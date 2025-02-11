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
    "#9370DB", "#228B22", "#4682B4", "#FF8C00", "#FFDB58",
    "#2E8B57", "#6B4226", "#D2691E", "#5F9EA0", "#556B2F",
    "#708090", "#8B4513", "#DAA520", "#C71585", "#B22222",
    "#4169E1", "#468499", "#CD853F", "#32CD32", "#9932CC",
    "#DC143C", "#8FBC8F", "#E9967A", "#6495ED", "#FFD700",
    "#66CDAA", "#DDA0DD", "#4682B4", "#20B2AA", "#8A2BE2",
    "#D2691E", "#87CEEB", "#6A5ACD", "#00CED1", "#FA8072",
    "#2E8B57", "#FFDAB9", "#48D1CC", "#FF4500", "#DA70D6",
    "#BA55D3", "#CD5C5C", "#FF69B4", "#40E0D0", "#7B68EE",
    "#DB7093", "#AFEEEE", "#B0E0E6", "#7CFC00", "#32CD32",
    "#00FA9A", "#F4A460", "#FF6347", "#B8860B", "#BC8F8F"];
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
      <div class="chat-message">
        <span class="chat-nick" style="color: ${colour}; font-weight: bold;">${nick} - (${id}):</span>
        <span class="chat-timestamp">${formattedDate}</span>
        <div class="chat-text">${msg}</div>
      </div>
    `;
  }).join("");

  chatroom.scrollTop = chatroom.scrollHeight; // Auto-scroll to the latest message
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
