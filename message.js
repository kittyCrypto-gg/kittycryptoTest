const CHAT_SERVER = "https://kittycrypto.ddns.net:7619";
const GET_IP_HASH_URL = `${CHAT_SERVER}/get-ip/sha256`;
const nicknameInput = document.getElementById("nickname");

let userHashedIp = null; // Store the user's hashed IP

// Fetch user's hashed IP on load
const fetchUserHashedIp = async () => {
  try {
    const response = await fetch(GET_IP_HASH_URL);
    if (!response.ok) throw new Error("Failed to fetch hashed IP");
    const data = await response.json();
    userHashedIp = data.hashedIp;
    console.log("🔑 User Hashed IP:", userHashedIp);
  } catch (error) {
    console.error("❌ Error fetching hashed IP:", error);
  }
};

// Enhance chat messages with edit/delete buttons
const enhanceMessages = () => {
  document.querySelectorAll(".chat-message").forEach((messageDiv) => {
    const nickSpan = messageDiv.querySelector(".chat-nick");
    const idMatch = nickSpan.textContent.match(/\((0x[a-f0-9]+)\)/);
    if (!idMatch) return;

    const messageId = idMatch[1];
    const messageTextDiv = messageDiv.querySelector(".chat-text");
    const messageText = messageTextDiv.textContent;

    if (userHashedIp && messageId === userHashedIp && nicknameInput.value.trim() === nickSpan.textContent.split(" - ")[0]) {
      const editButton = document.createElement("span");
      editButton.innerHTML = " ✏️";
      editButton.style.cursor = "pointer";
      editButton.title = "Edit Message";
      editButton.onclick = () => openEditModal(messageId, messageText);

      const deleteButton = document.createElement("span");
      deleteButton.innerHTML = " ❌";
      deleteButton.style.cursor = "pointer";
      deleteButton.title = "Delete Message";
      deleteButton.onclick = () => deleteMessage(messageId);

      messageDiv.appendChild(editButton);
      messageDiv.appendChild(deleteButton);
    }
  });
};

// Open modal for editing messages
const openEditModal = (id, oldMessage) => {
  const modal = document.createElement("div");
  modal.id = "editModal";
  modal.innerHTML = `
    <div class="modal-content">
      <h3>Edit Message</h3>
      <textarea id="editMessageBox">${oldMessage}</textarea>
      <button onclick="submitEdit('${id}')">Edit</button>
      <button onclick="closeModal()">Cancel</button>
    </div>
  `;
  document.body.appendChild(modal);
};

// Close modal
const closeModal = () => {
  const modal = document.getElementById("editModal");
  if (modal) modal.remove();
};

// Submit edited message
const submitEdit = async (id) => {
  const newMessage = document.getElementById("editMessageBox").value.trim();
  if (!newMessage) return alert("Message cannot be empty!");

  try {
    const response = await fetch(`${CHAT_SERVER}/edit-message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, newMessage }),
    });
    if (!response.ok) throw new Error("Failed to edit message");
    console.log("✅ Message edited successfully");
    closeModal();
  } catch (error) {
    console.error("❌ Error editing message:", error);
  }
};

// Delete message
const deleteMessage = async (id) => {
  if (!confirm("Are you sure you want to delete this message?")) return;
  
  try {
    const response = await fetch(`${CHAT_SERVER}/delete-message`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!response.ok) throw new Error("Failed to delete message");
    console.log("✅ Message deleted successfully");
  } catch (error) {
    console.error("❌ Error deleting message:", error);
  }
};

// Fetch user IP on script load and enhance messages after chat updates
fetchUserHashedIp();
document.addEventListener("chatUpdated", enhanceMessages);
