const CHAT_SERVER = "https://kittycrypto.ddns.net:7619/chat";
const CHAT_JSON_URL = "https://kittycrypto.ddns.net:7619/chat/chat.json";
const SESSION_TOKEN_URL = "https://kittycrypto.ddns.net:7619/session-token";

const chatroom = document.getElementById("chatroom");
const nicknameInput = document.getElementById("nickname");
const messageInput = document.getElementById("message");
const sendButton = document.getElementById("send-button");

let lastChatData = "";
let sessionToken = null; // Store session token

/* Utility: Get Cookie */
const getChatCookie = (name) => {
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
};

/* Utility: Set Cookie (expires in 1 year) */
const setChatCookie = (name, value, days = 365) => {
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${date.toUTCString()}; path=/; SameSite=Lax`;
};

/* Load Nickname from Cookie */
const loadNickname = () => {
  const savedNick = getChatCookie("nickname");
  if (savedNick) {
    nicknameInput.value = savedNick;
  }
};

/* Fetch Session Token */
const fetchSessionToken = async () => {
  try {
    const response = await fetch(SESSION_TOKEN_URL);
    if (!response.ok) throw new Error(`Failed to fetch session token: ${response.status}`);
    
    const data = await response.json();
    sessionToken = data.sessionToken;
    console.log("🔑 Session Token received:", sessionToken);
  } catch (error) {
    console.error("❌ Error fetching session token:", error);
  }
};

/* Seeded PRNG (Mulberry32) */
function seededRandom(seed) {
  let t = seed += 0x6D2B79F5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296; // Scales to [0, 1)
}

/* Generates a Unique Seed for Each User */
async function hashUser(nick, id) {
  const encoder = new TextEncoder();
  const data = encoder.encode(nick + id); // Salting nick with hashed IP
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.slice(0, 4).reduce((acc, val) => (acc << 8) + val, 0); // Convert first 4 bytes to int
}

/* Generates a Consistent Colour */
async function getColourForUser(nick, id) {
  const seed = await hashUser(nick, id);
  const rng = seededRandom(seed);

  // Generate HSL values with controlled saturation & brightness
  const hue = Math.floor(rng * 360); // Full hue range
  const saturation = Math.floor(50 + rng * 30); // 50-80%
  const lightness = Math.floor(40 + rng * 30); // 40-70% (avoids white/black)

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`; // Return valid HSL colour
}

/* Sends a chat message */
const sendMessage = async () => {
  const nick = nicknameInput.value.trim();
  const msg = messageInput.value.trim();

  if (!nick || !msg) {
    alert("Please enter a nickname and a message.");
    return;
  }

  // Save nickname to a cookie
  setChatCookie("nickname", nick);

  try {
    console.log("📡 Fetching IP address...");
    const ipResponse = await fetch("https://api64.ipify.org?format=json");

    if (!ipResponse.ok) {
      throw new Error(`Failed to fetch IP: ${ipResponse.status} ${ipResponse.statusText}`);
    }

    const ipData = await ipResponse.json();
    const userIp = ipData.ip;
    console.log(`🌍 User IP: ${userIp}`);

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
    messageInput.value = ""; // Clear message input after sending
  } catch (error) {
    console.error("❌ Error sending message:", error);
    alert(`Failed to send message: ${error.message}`);
  }
};

/* Fetches and Updates Chat Messages */
const updateChat = async () => {
  if (!sessionToken) {
    console.warn("⚠️ No session token found. Fetching a new one...");
    await fetchSessionToken();
  }

  try {
    const response = await fetch(CHAT_JSON_URL, {
      method: "GET",
      headers: { "Authorization": sessionToken }, // Pass session token
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
    }

    const chatData = await response.text();

    if (chatData !== lastChatData) {
      lastChatData = chatData;
      try {
        const parsedData = JSON.parse(chatData);
        displayChat(parsedData);
      } catch (jsonError) {
        console.error("❌ Error parsing chat JSON:", jsonError);
      }
    }
  } catch (error) {
    console.error("❌ Error fetching chat:", error);
    if (error.message.includes("Failed to fetch")) {
      console.error("❗ Possible network issue or CORS restriction.");
      alert('The Server seems to be down!');
    }
  }
};

/* Displays Chat Messages in the Chatroom */
const displayChat = async (messages) => {
  chatroom.innerHTML = "";

  for (const { nick, id, msg, timestamp } of messages) {
    const colour = await getColourForUser(nick, id);
    const formattedDate = new Date(timestamp)
      .toISOString()
      .replace("T", " ")
      .slice(0, 19)
      .replace(/-/g, "."); // Format YYYY.mm.dd HH:MM:SS

    const messageHtml = `
      <div class="chat-message">
        <span class="chat-nick" style="color: ${colour}; font-weight: bold;">${nick} - (${id}):</span>
        <span class="chat-timestamp">${formattedDate}</span>
        <div class="chat-text">${msg}</div>
      </div>
    `;
    chatroom.innerHTML += messageHtml;
  }

  chatroom.scrollTop = chatroom.scrollHeight; // Auto-scroll to latest message
};

/* Attach Event Listeners */
sendButton.addEventListener("click", sendMessage);
messageInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

/* Load nickname on startup */
loadNickname();

(async () => {
  await fetchSessionToken();
  updateChat();
})();

setInterval(updateChat, 1000);
