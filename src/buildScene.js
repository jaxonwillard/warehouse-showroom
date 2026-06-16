import * as THREE from "three";
import { buildRoom, buildWall } from "./geometry/walls.js";
import { buildTable } from "./geometry/furniture.js";
import { warehouse } from "./data/warehouse.js";
import { showroom } from "./data/showroom.js";

// Builds the full model and returns named layer groups so the UI can toggle them.
export function buildScene() {
  const root = new THREE.Group();

  const layers = {
    floor: new THREE.Group(),
    shell: new THREE.Group(),
    existing: new THREE.Group(),
    showroom: new THREE.Group(),
    furniture: new THREE.Group(),
  };
  for (const [name, g] of Object.entries(layers)) {
    g.name = name;
    root.add(g);
  }

  const { length: L, depth: D, wallHeight, wallThickness } = warehouse;

  // --- Floor slab ---------------------------------------------------------
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x3a3f48,
    roughness: 0.95,
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

  // --- Warehouse shell ----------------------------------------------------
  const shellMat = new THREE.MeshStandardMaterial({
    color: 0x8a8f98,
    roughness: 0.9,
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
  const showroomMat = new THREE.MeshStandardMaterial({
    color: 0xcdd3dc,
    roughness: 0.7,
    metalness: 0,
    side: THREE.DoubleSide,
  });
  for (const room of showroom.rooms || []) {
    layers.showroom.add(
      buildRoom(room, {
        height: showroom.height,
        thickness: showroom.wallThickness,
        material: showroomMat,
        glassColor: showroom.glassColor,
      })
    );
  }

  // --- Furniture ----------------------------------------------------------
  for (const f of showroom.furniture || []) {
    if (f.kind === "table") layers.furniture.add(buildTable(f));
  }

  return { root, layers, bounds: { L, D, H: wallHeight } };
}
