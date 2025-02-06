const CHAT_SERVER = "https://kittycrypto.ddns.net:7619/chat";
const CHAT_JSON_URL = "./chat.json";

const chatroom = document.getElementById("chatroom");
const nicknameInput = document.getElementById("nickname");
const messageInput = document.getElementById("message");
const sendButton = document.getElementById("send-button");

let lastChatData = "";

// Generates a consistent color for each nickname (non-white)
const getColorForNick = (nick) => {
  const hash = [...nick].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colors = [
    "#ff5733", "#33ff57", "#3357ff", "#ff33a6", "#a633ff",
    "#33fff5", "#ff8c33", "#57ff33", "#f5ff33", "#ff3357"
  ];
  return colors[hash % colors.length];
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
    const ipResponse = await fetch("https://api64.ipify.org?format=json");
    const ipData = await ipResponse.json();
    const userIp = ipData.ip;

    const chatRequest = {
      chatRequest: {
        nick,
        msg,
        ip: userIp
      }
    };

    await fetch(CHAT_SERVER, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(chatRequest)
    });

    messageInput.value = ""; // Clear message input after sending
  } catch (error) {
    console.error("Error sending message:", error);
    alert("Failed to send message. Please try again.");
  }
};

// Fetches and updates chat messages
const updateChat = async () => {
  try {
    const response = await fetch(CHAT_JSON_URL, { cache: "no-store" });
    const chatData = await response.text();

    if (chatData !== lastChatData) {
      lastChatData = chatData;
      displayChat(JSON.parse(chatData));
    }
  } catch (error) {
    console.error("Error fetching chat:", error);
  }
};

// Displays chat messages in the chatroom
const displayChat = (messages) => {
  chatroom.value = messages.map(({ nick, id, msg, timestamp }) => {
    const color = getColorForNick(nick);
    return `%c${nick} - (${id}): %c${timestamp}\n  ${msg}\n`;
  }).join("\n");

  // Apply colors
  const formattedMessages = messages.map(({ nick, id, msg, timestamp }) => {
    const color = getColorForNick(nick);
    return [
      `${nick} - (${id}): ${timestamp}\n  ${msg}\n`,
      `color: ${color}; font-weight: bold;`,
      "color: grey; font-size: 0.9em;"
    ];
  });

  console.clear();
  formattedMessages.forEach(([text, color1, color2]) => console.log(text, color1, color2));

  chatroom.scrollTop = chatroom.scrollHeight; // Auto-scroll to latest message
};

// Attach event listeners
sendButton.addEventListener("click", sendMessage);
messageInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

// Update chat every second
setInterval(updateChat, 1000);
