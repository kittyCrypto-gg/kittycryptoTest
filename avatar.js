// avatar.js
async function hashString(str) {
  const msgBuffer = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  return Array.from(new Uint8Array(hashBuffer));
}

function pickDistinctColours(seed) {
  const hues = [seed % 360, (seed + 120) % 360, (seed + 240) % 360];
  const arms = hues.map(hue => `hsl(${hue}, 80%, 60%)`);
  const bgHue = (seed + 180) % 360;
  const background = `hsl(${bgHue}, 50%, 80%)`; // darker background
  return { arms, background };
}

function drawSpiralArm(ctx, colour, angleOffset, spiralConfig) {
  const { angleStep, radiusStep, steps } = spiralConfig;

  ctx.save();
  ctx.rotate(angleOffset);
  ctx.strokeStyle = colour;
  ctx.lineWidth = 5.2; // Thicker lines for visibility
  ctx.beginPath();

  for (let t = 0; t < steps; t++) {
    const theta = t * angleStep;
    const r = t * radiusStep;
    const x = r * Math.cos(theta);
    const y = r * Math.sin(theta);
    t === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }

  ctx.stroke();
  ctx.restore();
}

function getSpiralConfig(hash) {
  const angleStep = 0.15 + (hash[2] % 70) / 200; // range: 0.15–0.5
  const radiusStep = 1.0 + (hash[3] % 40) / 10;  // range: 1.0–5.0
  const steps = 60 + (hash[4] % 40);            // 60–100 points

  return { angleStep, radiusStep, steps };
}

async function drawSpiralIdenticon(username, size = 128) {
  const hash = await hashString(username);
  const seed = hash[0] + hash[1] * 256;
  const { arms, background } = pickDistinctColours(seed);
  const spiralConfig = getSpiralConfig(hash);

  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");

  // Fill background
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, size, size);
  ctx.translate(size / 2, size / 2);

  // Draw 3 spiral arms
  for (let i = 0; i < 3; i++) {
    const angle = (2 * Math.PI / 3) * i;
    drawSpiralArm(ctx, arms[i], angle, spiralConfig);
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
      container.innerHTML = "";
      return;
    }

    const canvas = await drawSpiralIdenticon(name);
    container.innerHTML = "";
    container.appendChild(canvas);
  }

  input.addEventListener("input", updateAvatar);
});
