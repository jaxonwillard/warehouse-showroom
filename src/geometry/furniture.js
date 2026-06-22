import * as THREE from "three";

const WOOD = new THREE.MeshStandardMaterial({ color: 0x6b4a2b, roughness: 0.6 });
const METAL = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.5, metalness: 0.4 });
const CHAIR = new THREE.MeshStandardMaterial({ color: 0x444b57, roughness: 0.7 });

// A simple chair built at the origin: seat faces +Z, back panel on the -Z side.
function buildChair() {
  const g = new THREE.Group();
  const seatH = 1.5;
  const seat = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.18, 1.4), CHAIR);
  seat.position.y = seatH;
  seat.castShadow = true;
  g.add(seat);

  const back = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.5, 0.18), CHAIR);
  back.position.set(0, seatH + 0.75, -0.6);
  back.castShadow = true;
  g.add(back);

  const legGeo = new THREE.BoxGeometry(0.12, seatH, 0.12);
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const leg = new THREE.Mesh(legGeo, METAL);
      leg.position.set(sx * 0.55, seatH / 2, sz * 0.55);
      g.add(leg);
    }
  }
  return g;
}

// Builds a conference table (+ optional chairs) and returns a THREE.Group placed
// at spec.center. The table length runs along local X; if spec.axis === "z" the
// whole group is rotated 90° so the length runs along world Z.
export function buildTable(spec) {
  const {
    center,
    length,
    width,
    height = 2.5,
    axis = "x",
    chairsPerSide = 0,
  } = spec;

  const group = new THREE.Group();
  group.name = spec.name || "table";

  const topThick = 0.2;
  const top = new THREE.Mesh(new THREE.BoxGeometry(length, topThick, width), WOOD);
  top.position.y = height - topThick / 2;
  top.castShadow = true;
  top.receiveShadow = true;
  group.add(top);

  const legGeo = new THREE.BoxGeometry(0.28, height - topThick, 0.28);
  const lx = length / 2 - 0.7;
  const lz = width / 2 - 0.7;
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const leg = new THREE.Mesh(legGeo, METAL);
      leg.position.set(sx * lx, (height - topThick) / 2, sz * lz);
      leg.castShadow = true;
      group.add(leg);
    }
  }

  // Chairs along both long sides (the long sides run along local X).
  if (chairsPerSide > 0) {
    const gap = length / chairsPerSide;
    const zSeat = width / 2 + 1.1;
    for (let i = 0; i < chairsPerSide; i++) {
      const x = -length / 2 + gap * (i + 0.5);
      // +Z side: seat faces -Z (toward table) -> rotate 180°.
      const a = buildChair();
      a.position.set(x, 0, zSeat);
      a.rotation.y = Math.PI;
      group.add(a);
      // -Z side: seat already faces +Z (toward table).
      const b = buildChair();
      b.position.set(x, 0, -zSeat);
      group.add(b);
    }
  }

  group.position.set(center.x, 0, center.z);
  if (axis === "z") group.rotation.y = Math.PI / 2;
  return group;
}

// A flat-panel TV. Built in local space with the screen facing +Z, then placed
// at spec.center and rotated about Y by spec.rotateDeg to face into the room.
export function buildTv(spec) {
  const { center, width, height, depth = 0.3, rotateDeg = 0 } = spec;
  const g = new THREE.Group();
  g.name = spec.name || "tv";

  const bezelMat = new THREE.MeshStandardMaterial({
    color: 0x0a0a0a,
    roughness: 0.5,
    metalness: 0.3,
  });
  const screenMat = new THREE.MeshStandardMaterial({
    color: 0x10141c,
    roughness: 0.2,
    metalness: 0.1,
    emissive: 0x16243a,
    emissiveIntensity: 0.45,
  });

  const bezel = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), bezelMat);
  bezel.castShadow = true;
  g.add(bezel);

  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(width * 0.94, height * 0.9),
    screenMat
  );
  screen.position.z = depth / 2 + 0.01;
  g.add(screen);

  g.position.set(center.x, center.y, center.z);
  g.rotation.y = (rotateDeg * Math.PI) / 180;
  return g;
}

// A base cabinet / counter. `depth` runs along X (protrusion from the wall),
// `length` runs along Z (north-south span). Sits on the floor at spec.center.
export function buildCounter(spec) {
  const { center, length, depth = 2, height = 3 } = spec;
  const g = new THREE.Group();
  g.name = spec.name || "counter";

  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xdadbd8, roughness: 0.7 });
  const topMat = new THREE.MeshStandardMaterial({
    color: 0x33343a,
    roughness: 0.35,
    metalness: 0.1,
  });

  const topThick = 0.12;
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(depth, height - topThick, length),
    bodyMat
  );
  body.position.y = (height - topThick) / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  g.add(body);

  const top = new THREE.Mesh(
    new THREE.BoxGeometry(depth + 0.2, topThick, length),
    topMat
  );
  top.position.y = height - topThick / 2;
  top.castShadow = true;
  g.add(top);

  g.position.set(center.x, 0, center.z);
  return g;
}

// A simple rectangular display box / pedestal sitting on the floor.
// spec.size is { x, y, z } in feet; spec.center is the floor center { x, z }.
export function buildBox(spec) {
  const { center, size } = spec;
  const g = new THREE.Group();
  g.name = spec.name || "box";

  const mat = new THREE.MeshStandardMaterial({
    color: 0xc9ccd2,
    roughness: 0.55,
    metalness: 0.05,
  });
  const box = new THREE.Mesh(new THREE.BoxGeometry(size.x, size.y, size.z), mat);
  box.position.set(center.x, size.y / 2, center.z);
  box.castShadow = true;
  box.receiveShadow = true;
  g.add(box);
  return g;
}

// A free-standing framed glass display unit. Built facing +Z, then rotated about
// Y by spec.rotateDeg (-90 = faces west). `width` runs along local X.
//   type     : "single" | "double" | "window"
//   boxHeight: if > 0, the unit sits atop a base box of this height (ft)
//   ajar     : pivot the glass leaf open by this many degrees (pivoting doors)
export function buildDoorPanel(spec) {
  const {
    center,
    width,
    height,
    depth = 0.4,
    rotateDeg = 0,
    type = "single",
    boxHeight = 0,
    ajar = 0,
  } = spec;
  const g = new THREE.Group();
  g.name = spec.name || "door";

  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x0a0a0a,
    roughness: 0.4,
    metalness: 0.7,
  });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x9fc8e8,
    transparent: true,
    opacity: 0.3,
    roughness: 0.05,
    metalness: 0,
    transmission: 0.6,
    side: THREE.DoubleSide,
  });
  const baseMat = new THREE.MeshStandardMaterial({ color: 0xcfd2d6, roughness: 0.7 });

  const fw = 0.25; // frame face width
  const y0 = boxHeight; // the framed unit starts atop the optional base box

  // Optional base box (e.g. a window mounted on a 36" box).
  if (boxHeight > 0) {
    const box = new THREE.Mesh(new THREE.BoxGeometry(width, boxHeight, depth + 0.2), baseMat);
    box.position.set(0, boxHeight / 2, 0);
    box.castShadow = true;
    box.receiveShadow = true;
    g.add(box);
  }

  const addBar = (px, py, lx, ly) => {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(lx, ly, depth), frameMat);
    bar.position.set(px, py, 0);
    bar.castShadow = true;
    g.add(bar);
  };

  // Outer frame.
  addBar(0, y0 + height - fw / 2, width, fw); // head
  addBar(0, y0 + fw / 2, width, fw); // sill
  addBar(-width / 2 + fw / 2, y0 + height / 2, fw, height); // left jamb
  addBar(width / 2 - fw / 2, y0 + height / 2, fw, height); // right jamb

  // Divider: center stile for a double door, a horizontal bar for a window.
  if (type === "double") {
    addBar(0, y0 + height / 2, fw * 0.6, height);
  } else if (type === "window") {
    addBar(0, y0 + height / 2, width, fw * 0.7);
  }

  // Glass leaf (in a subgroup so a pivoting door can swing about its center).
  const leaf = new THREE.Group();
  const glass = new THREE.Mesh(
    new THREE.PlaneGeometry(width - 2 * fw, height - 2 * fw),
    glassMat
  );
  glass.position.set(0, y0 + height / 2, 0);
  leaf.add(glass);
  if (ajar) leaf.rotation.y = (ajar * Math.PI) / 180;
  g.add(leaf);

  // Handle for doors (not windows).
  if (type !== "window") {
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.2, 0.08), frameMat);
    handle.position.set(width * 0.16, y0 + height * 0.45, depth / 2);
    g.add(handle);
  }

  g.position.set(center.x, 0, center.z);
  g.rotation.y = (rotateDeg * Math.PI) / 180;
  return g;
}
