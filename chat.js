const CHAT_SERVER = "https://kittycrypto.ddns.net:7619/chat";
const CHAT_STREAM_URL = "https://kittycrypto.ddns.net:7619/chat/stream";
const SESSION_TOKEN_URL = "https://kittycrypto.ddns.net:7619/session-token";

const chatroom = document.getElementById("chatroom");
const nicknameInput = document.getElementById("nickname");
const messageInput = document.getElementById("message");
const sendButton = document.getElementById("send-button");

let sessionToken = null;
let eventSource = null; // Track SSE connection
let alerted = false;

// Utility: Get Cookie
const getChatCookie = (name) => {
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
};

// Utility: Set Cookie (expires in 1 year) 
const setChatCookie = (name, value, days = 365) => {
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${date.toUTCString()}; path=/; SameSite=Lax`;
};

// Load Nickname from Cookie 
const loadNickname = () => {
  const savedNick = getChatCookie("nickname");
  if (savedNick) {
    nicknameInput.value = savedNick;
  }
};

// Fetch Session Token 
const fetchSessionToken = async () => {
  try {
    const response = await fetch(SESSION_TOKEN_URL);
    if (!response.ok) throw new Error(`Failed to fetch session token: ${response.status}`);

    const data = await response.json();
    sessionToken = data.sessionToken;
    console.log("🔑 Session Token received:", sessionToken);

    // Connect to SSE once session token is received
    connectToChatStream();
  } catch (error) {
    console.error("❌ Error fetching session token:", error);
  }
};

// Seeded PRNG (Mulberry32) 
function seededRandom(seed) {
  let t = seed += 0x6D2B79F5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296; // Scales to [0, 1)
}

// Connect to SSE for Real-Time Chat Updates 
const connectToChatStream = () => {
  if (!sessionToken) return;

  if (eventSource) {
    console.log("⚠️ SSE connection already exists, closing old connection...");
    eventSource.close();
  }

  console.log("🔄 Attempting to connect to chat stream...");

  // Use query parameter for token since EventSource does not support headers
  eventSource = new EventSource(`${CHAT_STREAM_URL}?token=${sessionToken}`);

  eventSource.onopen = () => {
    console.log("✅ Successfully connected to chat stream.");
  };

  eventSource.onmessage = (event) => {
    console.log("📩 Raw SSE Data:", event.data); // Debugging log

    try {
      const messages = JSON.parse(event.data);
      displayChat(messages);
    } catch (error) {
      console.error("❌ Error parsing chat update:", error, "\n📩 Raw data received:", event.data);
    }
  };

  eventSource.onerror = () => {
    console.error("❌ Connection to chat stream lost. Retrying...");
    eventSource.close();
    setTimeout(connectToChatStream, 3000); // Retry after 3s
  };
};

// Generates a Unique Seed for Each User 
async function hashUser(nick, id) {
  const encoder = new TextEncoder();
  const data = encoder.encode(nick + id);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.slice(0, 4).reduce((acc, val) => (acc << 8) + val, 0);
}

// Generates a Consistent Colour 
async function getColourForUser(nick, id) {
  const seed = await hashUser(nick, id);
  const rng = seededRandom(seed);

  const hue = Math.floor(rng * 360);
  const saturation = Math.floor(50 + rng * 30);
  const lightness = Math.floor(40 + rng * 30);

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

const fetchUserIP = async () => {
  try {
    const response = await fetch("https://kittycrypto.ddns.net:7619/get-ip");
    if (!response.ok) throw new Error(`Failed to fetch IP: ${response.status}`);

    const data = await response.json();
    console.log(`🌍 User IP: ${data.ip}`);
    return data.ip;
  } catch (error) {
    console.error("❌ Error fetching IP:", error);
    return null;
  }
};

// Sends a chat message 
const sendMessage = async () => {
  const nick = nicknameInput.value.trim();
  const msg = messageInput.value.trim();

  if (!nick || !msg) {
    alert("Please enter a nickname and a message.");
    return;
  }

  setChatCookie("nickname", nick);

  try {
    console.log("📡 Fetching IP address...");

    const userIp = await fetchUserIP();
    if (!userIp) {
      alert("❌ Unable to retrieve IP. Please try again.");
      return;
    }

    const chatRequest = {
      chatRequest: {
        nick,
        msg,
        ip: userIp
      }
    };

    console.log("📡 Sending chat message:", chatRequest);

    const response = await fetch(CHAT_SERVER, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(chatRequest)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    console.log("✅ Message sent successfully.");
    messageInput.value = "";
  } catch (error) {
    console.error("❌ Error sending message:", error);
    alert(`Failed to send message: ${error.message}`);
  }
};

// Displays Chat Messages 
const displayChat = async (messages) => {
  chatroom.innerHTML = "";

  for (const { nick, id, msg, timestamp } of messages) {
    const colour = await getColourForUser(nick, id);
    const formattedDate = new Date(timestamp)
      .toISOString()
      .replace("T", " ")
      .slice(0, 19)
      .replace(/-/g, ".");

    const messageHtml = `
      <div class="chat-message">
        <span class="chat-nick" style="color: ${colour}; font-weight: bold;">${nick} - (${id}):</span>
        <span class="chat-timestamp">${formattedDate}</span>
        <div class="chat-text">${msg}</div>
      </div>
    `;
    chatroom.innerHTML += messageHtml;
  }

  chatroom.scrollTop = chatroom.scrollHeight;
};

// Attach Event Listeners 
sendButton.addEventListener("click", sendMessage);
messageInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

// Load nickname on startup 
loadNickname();
fetchSessionToken();
