// Warehouse shell + interior partition walls + existing office.
// Units: 1 unit = 1 foot.  Coordinate system: X = length (east), Z = depth (south), Y = up.
// Origin (0,0) is the top-left corner of the plan.
//
// Dimension labels from the marked-up floor plan are noted as (dim N).

// --- Tunable estimates (NOT given as numbers on the plan) ------------------
// X position of the central partition line, measured from the left wall (user-specified).
const PARTITION_X = 149;
const PARTITION_HEIGHT = 12; // partition walls aren't full-height; adjust if needed.

// --- Derived office geometry ----------------------------------------------
const LENGTH = 200; // dim 1
const DEPTH = 70.1; // dim 7
const OFFICE_WIDTH = 43; // user-specified
const OFFICE_DIST_FROM_RIGHT = 27; // user-specified gap from the right wall
const OFFICE_DEPTH = 21.0; // ~ dims 2 (21.52) & 4 (20.46), squared off
const OFFICE_RIGHT = LENGTH - OFFICE_DIST_FROM_RIGHT; // 173
const OFFICE_LEFT = OFFICE_RIGHT - OFFICE_WIDTH; // 130
const OFFICE_TOP = DEPTH - OFFICE_DEPTH; // z where the office front wall sits (~49.1)

export const warehouse = {
  length: LENGTH, // dim 1
  depth: DEPTH, // dim 7
  wallHeight: 24, // interior clear height
  wallThickness: 0.83, // ~10 in shell wall

  // Free-standing interior partition walls (the vertical lines mid-plan).
  // Two colinear segments at PARTITION_X (149 ft from left) with a gap for passage:
  //   A: drops from the top wall (z=0) down 21.87 ft        (dim 5)
  //   B: 13.76 ft long, ending at z = OFFICE_TOP            (dim 6)
  // NOTE: the office (left edge x=130) is now offset from the partition (x=149).
  partitions: [
    {
      name: "Partition A (dim 5)",
      start: { x: PARTITION_X, z: 0 },
      end: { x: PARTITION_X, z: 21.87 },
      height: PARTITION_HEIGHT,
      thickness: 0.5,
    },
    {
      name: "Partition B (dim 6)",
      start: { x: PARTITION_X, z: OFFICE_TOP - 13.76 },
      end: { x: PARTITION_X, z: OFFICE_TOP },
      height: PARTITION_HEIGHT,
      thickness: 0.5,
    },
  ],

  // Structural columns: a single row down the centerline of the depth
  // (y = half the depth wall length), spaced every 25 ft along the length.
  columns: {
    z: DEPTH / 2, // 35.05
    spacing: 25, // ft between columns along X
    size: 1.5, // square column footprint (ft)
  },

  // Existing office in the bottom area (the room the user marked for office space).
  existingRooms: [
    {
      name: "Office",
      points: [
        { x: OFFICE_LEFT, z: OFFICE_TOP },
        { x: OFFICE_RIGHT, z: OFFICE_TOP },
        { x: OFFICE_RIGHT, z: DEPTH },
        { x: OFFICE_LEFT, z: DEPTH },
      ],
      height: 10,
      wallThickness: 0.5,
      openings: [], // none specified yet
    },
  ],
};
