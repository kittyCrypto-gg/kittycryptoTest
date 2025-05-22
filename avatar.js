// avatar.js
async function hashString(str) {
  const msgBuffer = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  return Array.from(new Uint8Array(hashBuffer));
}

function drawSpiralArm(ctx, hash, colour, angleOffset) {
  ctx.save();
  ctx.rotate(angleOffset);
  ctx.strokeStyle = colour;
  ctx.lineWidth = 1 + (hash[5] % 3);
  ctx.beginPath();

  for (let t = 0; t < 60; t++) {
    const theta = t * 0.25;
    const r = t * 1.2;
    const x = r * Math.cos(theta);
    const y = r * Math.sin(theta);
    t === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }

  ctx.stroke();
  ctx.restore();
}

async function drawSpiralIdenticon(username, size = 128) {
  const hash = await hashString(username);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, size, size);
  ctx.translate(size / 2, size / 2);

  const numArms = 3 + (hash[0] % 3); // 3–5 arms
  const colours = [
    `hsl(${hash[1] * 1.4}, 80%, 60%)`,
    `hsl(${hash[2] * 1.4}, 80%, 50%)`,
    `hsl(${hash[3] * 1.4}, 80%, 70%)`
  ];

  for (let arm = 0; arm < numArms; arm++) {
    const angleOffset = (2 * Math.PI / numArms) * arm;
    drawSpiralArm(ctx, hash, colours[arm % colours.length], angleOffset);
  }

  return canvas;
}

// Initialise DOM hooks and bind input
document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("name-input");
  const container = document.getElementById("avatar-root");

  async function updateAvatar() {
    const name = input.value.trim();
    if (!name) {
      container.innerHTML = ""; // Clear
      return;
    }

    const canvas = await drawSpiralIdenticon(name);
    container.innerHTML = ""; // Clear previous
    container.appendChild(canvas);
  }

  input.addEventListener("input", updateAvatar);
});
