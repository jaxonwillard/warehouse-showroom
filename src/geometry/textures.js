import * as THREE from "three";

// Procedural concrete-ish texture: a base gray with fine speckle noise and a
// few faint darker streaks, so the floor doesn't read as a flat color.
export function makeConcreteTexture(size = 512) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d");

  ctx.fillStyle = "#8f8d86";
  ctx.fillRect(0, 0, size, size);

  // Fine speckle.
  const img = ctx.getImageData(0, 0, size, size);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * 38;
    d[i] = clamp8(d[i] + n);
    d[i + 1] = clamp8(d[i + 1] + n);
    d[i + 2] = clamp8(d[i + 2] + n);
  }
  ctx.putImageData(img, 0, 0);

  // A handful of faint streaks / stains.
  ctx.globalAlpha = 0.06;
  for (let k = 0; k < 18; k++) {
    ctx.strokeStyle = Math.random() > 0.5 ? "#5f5d57" : "#b6b4ac";
    ctx.lineWidth = 1 + Math.random() * 3;
    ctx.beginPath();
    ctx.moveTo(Math.random() * size, Math.random() * size);
    ctx.lineTo(Math.random() * size, Math.random() * size);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

function clamp8(v) {
  return Math.max(0, Math.min(255, v));
}
