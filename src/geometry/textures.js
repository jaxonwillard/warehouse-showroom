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

// Bold text rendered to a transparent canvas, for signage/logos. Returns a
// CanvasTexture; tex.userData.aspect is the width/height ratio for plane sizing.
export function makeTextTexture(text, opts = {}) {
  const { color = "#000000", font = "900 220px 'Arial Black', Arial, sans-serif", pad = 60 } = opts;
  const c = document.createElement("canvas");
  let ctx = c.getContext("2d");

  ctx.font = font;
  const w = Math.ceil(ctx.measureText(text).width) + pad * 2;
  const h = 300;
  c.width = w;
  c.height = h;

  ctx = c.getContext("2d");
  ctx.font = font; // re-apply: resizing the canvas resets the context
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, w / 2, h / 2 + 8);

  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 8;
  tex.userData = { aspect: w / h };
  return tex;
}

// Light/blonde wood: vertical board separators + vertical grain streaks. Streaks
// run continuously top-to-bottom and boards sit on even intervals, so the tile
// repeats seamlessly. One tile is meant to cover WOOD_TILE_FT square (see walls).
export function makeWoodTexture(size = 512) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d");

  ctx.fillStyle = "#d8c098"; // base blonde
  ctx.fillRect(0, 0, size, size);

  // Vertical grain streaks (continuous vertically -> seamless tiling in Y).
  for (let k = 0; k < 260; k++) {
    const x = Math.random() * size;
    ctx.strokeStyle = Math.random() > 0.5 ? "rgba(255,244,222,0.16)" : "rgba(120,92,56,0.15)";
    ctx.lineWidth = 0.5 + Math.random() * 2.5;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.bezierCurveTo(
      x + (Math.random() - 0.5) * 6, size * 0.33,
      x + (Math.random() - 0.5) * 6, size * 0.66,
      x, size
    );
    ctx.stroke();
  }

  // Board separator lines on even intervals (seamless in X).
  const boards = 4;
  ctx.strokeStyle = "rgba(90,66,38,0.5)";
  ctx.lineWidth = 2;
  for (let b = 0; b <= boards; b++) {
    const x = (size * b) / boards;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, size);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}
