const CHAT_SERVER = "https://kittycrypto.ddns.net:7619/chat";
const CHAT_JSON_URL = "https://kittycrypto.ddns.net:7619/chat/chat.json";
const SESSION_TOKEN_URL = "https://kittycrypto.ddns.net:7619/session-token";

const chatroom = document.getElementById("chatroom");
const nicknameInput = document.getElementById("nickname");
const messageInput = document.getElementById("message");
const sendButton = document.getElementById("send-button");

let lastChatData = "";
let sessionToken = null; // Store session token
let sessionExpired = false; // Track session expiry

/* 🔹 Fetch Session Token */
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

/* 🔹 Seeded PRNG (Mulberry32) */
function seededRandom(seed) {
  let t = seed += 0x6D2B79F5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296; // Scales to [0, 1)
}

/* 🔹 Generates a Unique Seed for Each User */
async function hashUser(nick, id) {
  const encoder = new TextEncoder();
  const data = encoder.encode(nick + id); // Salting nick with hashed IP
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.slice(0, 4).reduce((acc, val) => (acc << 8) + val, 0); // Convert first 4 bytes to int
}

/* 🔹 Generates a Consistent Colour */
async function getColourForUser(nick, id) {
  const seed = await hashUser(nick, id);
  const rng = seededRandom(seed);

  // Generate HSL values with controlled saturation & brightness
  const hue = Math.floor(rng * 360); // Full hue range
  const saturation = Math.floor(50 + rng * 30); // 50-80%
  const lightness = Math.floor(40 + rng * 30); // 40-70% (avoids white/black)

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`; // Return valid HSL colour
}

/* 🔹 Fetches and Updates Chat Messages */
const updateChat = async () => {
  if (!sessionToken) {
    console.warn("⚠️ No session token found. Fetching a new one...");
    await fetchSessionToken();
  }

  try {
    console.log(`📡 Fetching chat history from: ${CHAT_JSON_URL}`);

    const response = await fetch(CHAT_JSON_URL, {
      method: "GET",
      headers: { "Authorization": sessionToken }, // Pass session token
      cache: "no-store"
    });

    if (!response.ok) {
      sessionExpired = true; // Mark session as expired
      throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
    }

    sessionExpired = false; // Reset session expiry if request is successful
    const chatData = await response.text();
    console.log("📜 Chat data fetched:", chatData);

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
    }
    displaySessionExpiredMessage(); // Inject expiry message
  }
};

/* 🔹 Displays Chat Messages in the Chatroom */
const displayChat = async (messages) => {
  chatroom.innerHTML = "";

  for (const { nick, id, msg, timestamp } of messages) {
    const colour = await getColourForUser(nick, id); // 🎨 Restore colour logic
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

  if (sessionExpired) {
    displaySessionExpiredMessage();
  }

  chatroom.scrollTop = chatroom.scrollHeight; // Auto-scroll to latest message
};

/* 🔹 Injects Session Expired Message */
const displaySessionExpiredMessage = async () => {
  if (document.getElementById("session-expired-msg")) return; // Prevent duplicates

  const timestamp = new Date()
    .toISOString()
    .replace("T", " ")
    .slice(0, 19)
    .replace(/-/g, ".");

  const systemMessageHtml = `
    <div class="chat-message" id="session-expired-msg">
      <span class="chat-nick" style="color: gray; font-weight: bold;">system - (0x0000000000):</span>
      <span class="chat-timestamp">${timestamp}</span>
      <div class="chat-text">
        Your session has expired and so the chat has been encrypted. Please 
        <a href="#" onclick="location.reload(); return false;" style="color: blue; text-decoration: underline;">refresh</a> the page to renew your session.
      </div>
    </div>
  `;
  
  chatroom.innerHTML += systemMessageHtml;
  chatroom.scrollTop = chatroom.scrollHeight; // Auto-scroll
};

/* 🔹 Attach Event Listeners */
sendButton.addEventListener("click", sendMessage);
messageInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

/* 🔹 Load chat & session on startup */
(async () => {
  await fetchSessionToken();
  updateChat();
})();

/* 🔹 Refresh chat every second */
setInterval(updateChat, 1000);
