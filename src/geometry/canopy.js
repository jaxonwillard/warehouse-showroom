import * as THREE from "three";

// Builds a flat canopy that attaches to a wall and cantilevers out, supported by
// two legs at its far (outer) corners, with a grid of recessed pot lights in the
// underside.
//
// spec: { xMin, width, zStart, extend, height, slabThickness, legSize,
//         potCols, potRows }
//   xMin/width : X extent (matches the showroom width)
//   zStart     : Z of the attach edge (the showroom wall it ties into)
//   extend     : how far it projects (+Z = south, -Z = north)
//   height     : top-of-slab height (same as the showroom)
export function buildCanopy(spec) {
  const {
    xMin,
    width,
    zStart,
    extend,
    height,
    slabThickness = 0.6,
    legSize = 0.6,
    potCols = 4,
    potRows = 3,
  } = spec;

  const xMax = xMin + width;
  const g = new THREE.Group();
  g.name = spec.name || "canopy";

  const slabMat = new THREE.MeshStandardMaterial({ color: 0xcfd2d6, roughness: 0.85 });
  const legMat = new THREE.MeshStandardMaterial({
    color: 0x3a3d42,
    roughness: 0.5,
    metalness: 0.4,
  });
  const diskMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xfff2dd,
    emissiveIntensity: 0.3,
    roughness: 0.4,
  });

  // Roof slab.
  const slab = new THREE.Mesh(
    new THREE.BoxGeometry(width, slabThickness, Math.abs(extend)),
    slabMat
  );
  slab.position.set((xMin + xMax) / 2, height - slabThickness / 2, zStart + extend / 2);
  slab.castShadow = true;
  slab.receiveShadow = true;
  g.add(slab);

  // Legs at the two outer corners (the edge away from the building).
  const legH = height - slabThickness;
  const legGeo = new THREE.BoxGeometry(legSize, legH, legSize);
  const legZ = zStart + extend - Math.sign(extend) * (legSize / 2);
  for (const lx of [xMin + legSize / 2, xMax - legSize / 2]) {
    const leg = new THREE.Mesh(legGeo, legMat);
    leg.position.set(lx, legH / 2, legZ);
    leg.castShadow = true;
    g.add(leg);
  }

  // Grid of pot lights set into the underside.
  const underY = height - slabThickness;
  const diskGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.06, 20);
  for (let c = 0; c < potCols; c++) {
    for (let r = 0; r < potRows; r++) {
      const x = xMin + (width * (c + 0.5)) / potCols;
      const z = zStart + (extend * (r + 0.5)) / potRows;
      const disk = new THREE.Mesh(diskGeo, diskMat);
      disk.position.set(x, underY - 0.03, z);
      g.add(disk);
      const lamp = new THREE.PointLight(0xfff2dd, 20, 0, 2);
      lamp.position.set(x, underY - 0.3, z);
      g.add(lamp);
    }
  }

  return g;
}
