async function drawSpiralIdenticon(username, size = 128) {
  const hash = await hashString(username);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.translate(size / 2, size / 2);

  const numArms = 3 + (hash[0] % 3); // 3–5
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

drawSpiralIdenticon("kitty-crypto").then(canvas => { // test string
  document.body.appendChild(canvas);
});
