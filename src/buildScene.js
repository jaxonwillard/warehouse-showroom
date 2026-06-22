import * as THREE from "three";
import { buildRoom, buildWall } from "./geometry/walls.js";
import {
  buildTable,
  buildTv,
  buildCounter,
  buildDoorPanel,
  buildBox,
} from "./geometry/furniture.js";
import { buildCanopy } from "./geometry/canopy.js";
import { makeConcreteTexture, makeWoodTexture } from "./geometry/textures.js";
import { warehouse } from "./data/warehouse.js";
import { showroom } from "./data/showroom.js";

// Builds the full model and returns named layer groups so the UI can toggle them.
export function buildScene() {
  const root = new THREE.Group();

  const layers = {
    floor: new THREE.Group(),
    shell: new THREE.Group(),
    ceiling: new THREE.Group(),
    existing: new THREE.Group(),
    showroom: new THREE.Group(),
    furniture: new THREE.Group(),
  };
  for (const [name, g] of Object.entries(layers)) {
    g.name = name;
    root.add(g);
  }

  const { length: L, depth: D, wallHeight, wallThickness } = warehouse;

  // --- Floor slab (polished concrete) ------------------------------------
  const concreteTex = makeConcreteTexture();
  concreteTex.repeat.set(L / 12, D / 12); // tile across the slab
  const floorMat = new THREE.MeshStandardMaterial({
    map: concreteTex,
    color: 0xbdbbb3,
    roughness: 0.92,
    metalness: 0,
  });
  const floorGeo = new THREE.PlaneGeometry(L, D);
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(L / 2, 0, D / 2);
  floor.receiveShadow = true;
  layers.floor.add(floor);

  // Floor grid for scale / blueprint feel (1 line every 10 ft).
  const grid = new THREE.GridHelper(Math.max(L, D), Math.round(Math.max(L, D) / 10), 0x556070, 0x2a3038);
  grid.position.set(L / 2, 0.02, D / 2);
  layers.floor.add(grid);

  // --- Warehouse shell (white painted block) -----------------------------
  const shellMat = new THREE.MeshStandardMaterial({
    color: 0xe6e3dc,
    roughness: 0.95,
    metalness: 0,
    side: THREE.DoubleSide,
  });
  const shellRoom = {
    name: "Warehouse Shell",
    points: [
      { x: 0, z: 0 },
      { x: L, z: 0 },
      { x: L, z: D },
      { x: 0, z: D },
    ],
    height: wallHeight,
    wallThickness,
    openings: [],
  };
  layers.shell.add(
    buildRoom(shellRoom, { height: wallHeight, thickness: wallThickness, material: shellMat })
  );

  // --- Interior partition walls ------------------------------------------
  const partitionMat = new THREE.MeshStandardMaterial({
    color: 0xb7bcc6,
    roughness: 0.85,
    metalness: 0,
    side: THREE.DoubleSide,
  });
  for (const p of warehouse.partitions || []) {
    const wall = buildWall(p.start, p.end, {
      height: p.height ?? 12,
      thickness: p.thickness ?? 0.5,
      openings: p.openings || [],
      material: partitionMat,
    });
    wall.name = p.name || "partition";
    layers.shell.add(wall);
  }

  // --- Structural columns -------------------------------------------------
  const colCfg = warehouse.columns;
  if (colCfg) {
    const colMat = new THREE.MeshStandardMaterial({
      color: 0xf2c200, // safety yellow, matching the reference photo
      roughness: 0.6,
      metalness: 0.1,
    });
    const colGeo = new THREE.CylinderGeometry(
      colCfg.size / 2,
      colCfg.size / 2,
      wallHeight,
      24
    );
    for (let x = colCfg.spacing; x < L; x += colCfg.spacing) {
      const col = new THREE.Mesh(colGeo, colMat);
      col.position.set(x, wallHeight / 2, colCfg.z);
      col.castShadow = true;
      col.receiveShadow = true;
      layers.shell.add(col);
    }
  }

  // --- Ceiling deck + strip lights ---------------------------------------
  // Dark open metal deck at the eaves, with long continuous LED strips in rows.
  const deckMat = new THREE.MeshStandardMaterial({
    color: 0x26282b,
    roughness: 0.9,
    metalness: 0.2,
    side: THREE.DoubleSide,
  });
  const deck = new THREE.Mesh(new THREE.PlaneGeometry(L, D), deckMat);
  deck.rotation.x = Math.PI / 2; // face downward
  deck.position.set(L / 2, wallHeight, D / 2);
  layers.ceiling.add(deck);

  const fixtureMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveIntensity: 1.0,
    roughness: 0.4,
  });
  const lightRows = 5;
  const stripGeo = new THREE.BoxGeometry(L * 0.86, 0.35, 0.85);
  const fixtureY = wallHeight - 1.5;
  for (let r = 0; r < lightRows; r++) {
    const z = (D * (r + 1)) / (lightRows + 1);
    const strip = new THREE.Mesh(stripGeo, fixtureMat);
    strip.position.set(L / 2, fixtureY, z);
    layers.ceiling.add(strip);
    // A soft point light per row so the strips actually illuminate the space.
    const lamp = new THREE.PointLight(0xfff6e8, 220, 0, 2);
    lamp.position.set(L / 2, fixtureY - 0.5, z);
    layers.ceiling.add(lamp);
  }

  // --- Existing rooms (context) ------------------------------------------
  const existingMat = new THREE.MeshStandardMaterial({
    color: 0x6f7682,
    roughness: 0.9,
    metalness: 0,
    side: THREE.DoubleSide,
  });
  for (const room of warehouse.existingRooms || []) {
    layers.existing.add(
      buildRoom(room, {
        height: room.height ?? 10,
        thickness: room.wallThickness ?? 0.5,
        material: existingMat,
      })
    );
  }

  // --- Showroom / conference room (new construction) ---------------------
  // Light wood pattern on the showroom walls (scaled per-segment in buildWall).
  const showroomMat = new THREE.MeshStandardMaterial({
    map: makeWoodTexture(),
    color: 0xffffff,
    roughness: 0.75,
    metalness: 0,
    side: THREE.DoubleSide,
  });
  const ceilingMat = new THREE.MeshStandardMaterial({
    color: 0xeeeeec,
    roughness: 0.9,
    metalness: 0,
    side: THREE.DoubleSide,
  });
  for (const room of showroom.rooms || []) {
    const h = room.height ?? showroom.height;
    layers.showroom.add(
      buildRoom(room, {
        height: showroom.height,
        thickness: showroom.wallThickness,
        material: showroomMat,
        glassColor: showroom.glassColor,
      })
    );
    // Optional ceiling capping the room at wall height.
    if (room.ceiling) {
      const xs = room.points.map((p) => p.x);
      const zs = room.points.map((p) => p.z);
      const minX = Math.min(...xs), maxX = Math.max(...xs);
      const minZ = Math.min(...zs), maxZ = Math.max(...zs);
      const ceil = new THREE.Mesh(
        new THREE.PlaneGeometry(maxX - minX, maxZ - minZ),
        ceilingMat
      );
      ceil.rotation.x = Math.PI / 2; // horizontal
      ceil.position.set((minX + maxX) / 2, h, (minZ + maxZ) / 2);
      ceil.receiveShadow = true;
      layers.showroom.add(ceil);
    }
  }

  // --- South canopy -------------------------------------------------------
  if (showroom.canopy) layers.showroom.add(buildCanopy(showroom.canopy));

  // --- Free-standing display doors ---------------------------------------
  for (const d of showroom.displayDoors || []) {
    layers.showroom.add(buildDoorPanel(d));
  }

  // --- Furniture ----------------------------------------------------------
  for (const f of showroom.furniture || []) {
    if (f.kind === "table") layers.furniture.add(buildTable(f));
    else if (f.kind === "tv") layers.furniture.add(buildTv(f));
    else if (f.kind === "counter") layers.furniture.add(buildCounter(f));
    else if (f.kind === "box") layers.furniture.add(buildBox(f));
  }

  return { root, layers, bounds: { L, D, H: wallHeight } };
}
