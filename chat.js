const CHAT_SERVER = "https://kittycrypto.ddns.net:7619/chat";
const CHAT_JSON_URL = "https://kittycrypto.ddns.net:7619/chat/chat.json";

// Encryption Keys (set from environment variables)
const CHAT_SECRET = "YOUR_GITHUB_SECRET"; // This should be set dynamically
const CHAT_KEY = "YOUR_GITHUB_KEY"; // This should be set dynamically

const chatroom = document.getElementById("chatroom");
const nicknameInput = document.getElementById("nickname");
const messageInput = document.getElementById("message");
const sendButton = document.getElementById("send-button");

let lastChatData = "";

/* 🔹 Generates a Cryptographic Key from a Secret */
async function deriveKey(secret) {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encoder.encode("chat-salt"),
      iterations: 100000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/* 🔹 Encrypts Data Using AES-256-GCM */
async function encryptData(data, secret) {
  const key = await deriveKey(secret);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();
  const encodedData = encoder.encode(JSON.stringify(data));

  const encryptedData = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encodedData
  );

  return {
    iv: Array.from(iv),
    encryptedData: Array.from(new Uint8Array(encryptedData))
  };
}

/* 🔹 Decrypts Data Using AES-256-GCM */
async function decryptData(encryptedObject, secret) {
  const key = await deriveKey(secret);
  const iv = new Uint8Array(encryptedObject.iv);
  const encryptedData = new Uint8Array(encryptedObject.encryptedData);

  try {
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      encryptedData
    );

    const decoder = new TextDecoder();
    return JSON.parse(decoder.decode(decryptedBuffer));
  } catch (error) {
    console.error("❌ Error decrypting data:", error);
    return null;
  }
}

/* 🔹 Sends a Chat Message (Encrypts before sending) */
const sendMessage = async () => {
  const nick = nicknameInput.value.trim();
  const msg = messageInput.value.trim();

  if (!nick || !msg) {
    alert("Please enter a nickname and a message.");
    return;
  }

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
      nick,
      msg,
      ip: userIp
    };

    const encryptedChatRequest = await encryptData(chatRequest, CHAT_SECRET);

    console.log("📡 Sending encrypted chat message:", encryptedChatRequest);

    const response = await fetch(CHAT_SERVER, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chatRequest: encryptedChatRequest })
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

/* 🔹 Fetches and Decrypts Chat Messages */
const updateChat = async () => {
  try {
    console.log(`📡 Fetching encrypted chat history from: ${CHAT_JSON_URL}`);

    const response = await fetch(CHAT_JSON_URL, {
      method: "GET",
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
    }

    const encryptedChatData = await response.json();
    console.log("📜 Encrypted chat data fetched:", encryptedChatData);

    const decryptedChatData = await decryptData(encryptedChatData, CHAT_KEY);

    if (!decryptedChatData) {
      console.error("❌ Error: Could not decrypt chat data.");
      return;
    }

    console.log("✅ Chat data decrypted:", decryptedChatData);

    if (JSON.stringify(decryptedChatData) !== lastChatData) {
      lastChatData = JSON.stringify(decryptedChatData);
      displayChat(decryptedChatData);
    }
  } catch (error) {
    console.error("❌ Error fetching chat:", error);
  }
};

/* 🔹 Displays Chat Messages in the Chatroom */
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

/* 🔹 Attach Event Listeners */
sendButton.addEventListener("click", sendMessage);
messageInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

// ✅ Load chat immediately
updateChat();

// ✅ Continue updating chat every second
setInterval(updateChat, 1000);
