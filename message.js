window.CHAT_SERVER = window.CHAT_SERVER || "https://kittycrypto.ddns.net:7619";
window.GET_IP_HASH_URL = window.GET_IP_HASH_URL || `${window.CHAT_SERVER}/get-ip/sha256`;
window.nicknameInput = window.nicknameInput || document.getElementById("nickname");

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
  if (!sessionToken) return;

  document.querySelectorAll(".chat-message").forEach((messageDiv) => {
    // Extract msgId from the message div's data attribute
    const msgId = messageDiv.dataset.msgid ? BigInt(messageDiv.dataset.msgid) : null;
    if (!msgId) return;

    // Ensure the msgId is a multiple of the session token
    if (msgId % BigInt(sessionToken) !== BigInt(0)) return;

    // Avoid duplicating buttons if they already exist
    if (messageDiv.querySelector(".chat-actions")) return;

    const actionSpan = document.createElement("span");
    actionSpan.classList.add("chat-actions");

    const editButton = document.createElement("span");
    editButton.innerHTML = " ✏️";
    editButton.classList.add("chat-action");
    editButton.title = "Edit Message";
    editButton.style.cursor = "pointer";
    editButton.onclick = () => openEditModal(msgId.toString(), messageDiv.querySelector(".chat-text").textContent);

    const deleteButton = document.createElement("span");
    deleteButton.innerHTML = " ❌";
    deleteButton.classList.add("chat-action");
    deleteButton.title = "Delete Message";
    deleteButton.style.cursor = "pointer";
    deleteButton.onclick = () => deleteMessage(msgId.toString());

    actionSpan.appendChild(editButton);
    actionSpan.appendChild(deleteButton);
    messageDiv.appendChild(actionSpan); // Append before message text
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

const editButton = document.createElement("span");
editButton.innerHTML = "✏️";
editButton.classList.add("chat-action"); // Assigns hover effect
editButton.onclick = () => openEditModal(id, msg);

const deleteButton = document.createElement("span");
deleteButton.innerHTML = "❌";
deleteButton.classList.add("chat-action"); // Assigns hover effect
deleteButton.onclick = () => deleteMessage(id);

// Fetch user IP on script load and enhance messages after chat updates
fetchUserHashedIp();
document.addEventListener("chatUpdated", enhanceMessages);
