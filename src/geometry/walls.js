import * as THREE from "three";

// Build a single straight wall segment from `start` to `end` (points in the XZ
// plane), with optional rectangular openings (windows/doors) punched out of it.
//
// Instead of CSG, the wall is assembled from solid boxes: full-height pieces
// between openings, plus a sill below and a lintel above each opening. Windows
// get a transparent glass pane filling the hole.
//
// opts: { height, thickness, openings, material, glassColor }
export function buildWall(start, end, opts) {
  const {
    height,
    thickness,
    openings = [],
    material,
    glassColor = 0x9fc8e8,
  } = opts;

  const group = new THREE.Group();

  const dx = end.x - start.x;
  const dz = end.z - start.z;
  const length = Math.hypot(dx, dz);
  if (length < 1e-4) return group;

  const angle = Math.atan2(dz, dx); // rotation about Y so +X local runs along the wall

  // Sort openings along the wall and clamp to bounds.
  const sorted = openings
    .map((o) => ({
      ...o,
      offset: Math.max(0, Math.min(o.offset, length)),
      width: Math.max(0, Math.min(o.width, length)),
    }))
    .sort((a, b) => a.offset - b.offset);

  // Local-space box helper: position is measured along the wall (u) and up (y),
  // with `u`/`y` being the box CENTER. Returns nothing, adds to group.
  const addBox = (uCenter, yCenter, len, h, mat) => {
    if (len <= 1e-4 || h <= 1e-4) return;
    const geo = new THREE.BoxGeometry(len, h, thickness);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    // Place along local +X, then the whole group is rotated/positioned below.
    mesh.position.set(uCenter, yCenter, 0);
    group.add(mesh);
  };

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: glassColor,
    transparent: true,
    opacity: 0.28,
    roughness: 0.05,
    metalness: 0,
    transmission: 0.6,
    side: THREE.DoubleSide,
  });

  // Dark frame/mullion material for door & window dividers.
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x2b2f36,
    roughness: 0.6,
    metalness: 0.3,
  });

  let cursor = 0; // current position along the wall
  for (const o of sorted) {
    const oStart = o.offset;
    const oEnd = o.offset + o.width;

    // Solid full-height wall before this opening.
    if (oStart > cursor) {
      const len = oStart - cursor;
      addBox(cursor + len / 2, height / 2, len, height, material);
    }

    // Sill (below the opening) and lintel (above it).
    const bottom = o.bottom ?? 0;
    const top = o.top ?? height;
    if (bottom > 0) {
      addBox(oStart + o.width / 2, bottom / 2, o.width, bottom, material);
    }
    if (top < height) {
      addBox(oStart + o.width / 2, (top + height) / 2, o.width, height - top, material);
    }

    // Glass for windows and glass (sliding) doors, with optional panel mullions.
    if (o.kind === "window" || o.kind === "glassdoor") {
      const paneH = top - bottom;
      const cx = oStart + o.width / 2;
      const cy = (bottom + top) / 2;
      // PlaneGeometry faces +Z by default, which is across the wall thickness — correct.
      const pane = new THREE.Mesh(new THREE.PlaneGeometry(o.width, paneH), glassMat);
      pane.position.set(cx, cy, 0);
      group.add(pane);

      // Vertical mullions splitting the glass into panels (e.g. a 3-panel slider).
      const panels = o.panels ?? 1;
      if (panels > 1) {
        const mullGeo = new THREE.BoxGeometry(0.12, paneH, thickness * 0.9);
        for (let k = 1; k < panels; k++) {
          const m = new THREE.Mesh(mullGeo, frameMat);
          m.position.set(oStart + (o.width * k) / panels, cy, 0);
          group.add(m);
        }
      }
    }

    cursor = Math.max(cursor, oEnd);
  }

  // Remaining solid wall after the last opening.
  if (cursor < length) {
    const len = length - cursor;
    addBox(cursor + len / 2, height / 2, len, height, material);
  }

  // Orient the whole segment in world space.
  group.position.set(start.x, 0, start.z);
  group.rotation.y = -angle; // negative: Three.js Y rotation is CCW looking down -Y
  return group;
}

// Build all walls for a closed-loop room from its corner points.
// Returns a THREE.Group. `openings` reference segment indices (0 = first edge).
export function buildRoom(room, opts) {
  const {
    height,
    thickness,
    material,
    glassColor,
  } = opts;
  const group = new THREE.Group();
  group.name = room.name || "room";

  const pts = room.points;
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % n];
    const segOpenings = (room.openings || []).filter((o) => o.segment === i);
    const wall = buildWall(a, b, {
      height: room.height ?? height,
      thickness: room.wallThickness ?? thickness,
      openings: segOpenings,
      material,
      glassColor: room.glassColor ?? glassColor,
    });
    group.add(wall);
  }
  return group;
}
