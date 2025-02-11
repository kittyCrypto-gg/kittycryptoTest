const CHAT_SERVER = "https://kittycrypto.ddns.net:7619/chat";
const CHAT_JSON_URL = "https://kittycrypto.ddns.net:7619/chat/chat.json";

const chatroom = document.getElementById("chatroom");
const nicknameInput = document.getElementById("nickname");
const messageInput = document.getElementById("message");
const sendButton = document.getElementById("send-button");

let lastChatData = "";

// Generates a consistent colour for each nickname (non-white)
const getColourForNick = (nick) => {
  const hash = [...nick].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colours = [
    "#ff5733", "#33ff57", "#3357ff", "#ff33a6", "#a633ff",
    "#33fff5", "#ff8c33", "#57ff33", "#f5ff33", "#ff3357"
  ];
  return colours[hash % colours.length];
};

// Sends a chat message
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

// Fetches and updates chat messages
const updateChat = async () => {
  try {
    console.log(`📡 Fetching chat history from: ${CHAT_JSON_URL}`);

    const response = await fetch(CHAT_JSON_URL, {
      method: "GET",
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
    }

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
  }
};

// Displays chat messages in the chatroom
const displayChat = (messages) => {
  chatroom.innerHTML = messages.map(({ nick, id, msg, timestamp }) => {
    const colour = getColourForNick(nick);
    const formattedDate = new Date(timestamp)
      .toISOString()
      .replace("T", " ")
      .slice(0, 19)
      .replace(/-/g, "."); // Format YYYY.mm.dd HH:MM:SS

    return `
      <p><strong style="color: ${colour};">${nick} - (${id}):</strong> 
      <span style="color: grey; font-size: 0.9em;">${formattedDate}</span><br>
      ${msg}</p>
    `;
  }).join("");

  chatroom.scrollTop = chatroom.scrollHeight; // Auto-scroll to the bottom
};

// Attach event listeners
sendButton.addEventListener("click", sendMessage);
messageInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

// ✅ Load chat immediately when the page loads
updateChat();

// ✅ Continue updating chat every second
setInterval(updateChat, 1000);
