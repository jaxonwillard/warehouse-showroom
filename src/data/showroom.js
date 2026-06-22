// Showroom + conference room — the NEW construction inside the warehouse.
//
// PLACEHOLDER until real dimensions are provided. Edit this file to define the
// showroom and conference-room walls, windows, and doors. Everything else
// (geometry, both views) is driven from this data.
//
// Format
// ------
// A "room" is a closed loop of corner points + a list of openings.
//   points:   [{x, z}, ...]  corners in order (loop closes back to the first)
//   openings: [{ segment, offset, width, bottom, top, kind }]
//       segment : index of the wall segment (0 = points[0]->points[1], etc.)
//       offset  : distance (ft) from that segment's start corner to the opening's near edge
//       width   : opening width (ft)
//       bottom  : sill height above floor (ft)  — for a door use 0
//       top     : head height above floor (ft)
//       kind    : "window" | "door" | "opening"
//
// Units: feet. Same coordinate frame as warehouse.js.

// Showroom footprint defined by its top-left (NW) corner + size, so moving the
// room is a one-line change and the table/openings follow automatically.
// Placed by its SW corner; the side ("leg") walls keep their length (DEPTH),
// and the room stretches in width to reach the warehouse right wall.
const DEPTH = 11.9; // along Z — left/right wall length (unchanged)
const SW = { x: 177, z: 33.1 }; // bottom-left corner; west wall at x = 177
const NW = { x: SW.x, z: SW.z - DEPTH }; // (174.5, 21.2)
const RIGHT_WALL = 200; // warehouse right (east) wall — room extends to here
const WIDTH = RIGHT_WALL - NW.x; // 25.5, along X
const CENTER = { x: NW.x + WIDTH / 2, z: NW.z + DEPTH / 2 };
const ROOM_HEIGHT = 12; // wall height (ft), shared with the canopy

// Display units. The x=195 row (IDXX, AEDX, MDX) is evenly spaced north -> south
// between the showroom south wall and the warehouse south wall. The x=153.8 row
// (Guillotine, IMDX) is placed at user-picked points. All rotated 45 deg CCW from
// west-facing -> rotateDeg = -45. Sizes given in inches (/12 -> ft).
const DOOR_X = 195;
const SHOWROOM_SOUTH = NW.z + DEPTH; // 33.1 (south wall)
const WHS_SOUTH = 70.1; // warehouse depth (south wall)
const IN = 1 / 12; // inches -> feet
const zAt = (i, n) => SHOWROOM_SOUTH + ((WHS_SOUTH - SHOWROOM_SOUTH) * (i + 0.5)) / n;
const DOOR_ROT = -45; // 45 deg CCW from west-facing
const DISPLAY_DOORS = [
  // Row at x=195, evenly spaced (north -> south).
  {
    name: "IDXX", // 76" x 120" double door
    type: "double",
    width: 76 * IN,
    height: 120 * IN,
    center: { x: DOOR_X, z: zAt(0, 3) },
    rotateDeg: DOOR_ROT,
  },
  {
    name: "AEDX", // 72" x 108" single pivoting door
    type: "single",
    ajar: 25, // pivoted open to show it pivots
    width: 72 * IN,
    height: 108 * IN,
    center: { x: DOOR_X, z: zAt(1, 3) },
    rotateDeg: DOOR_ROT,
  },
  {
    name: "MDX", // 38" x 120" single door
    type: "single",
    width: 38 * IN,
    height: 120 * IN,
    center: { x: DOOR_X, z: zAt(2, 3) },
    rotateDeg: DOOR_ROT + 90, // rotated 90 deg from the others
  },
  // Row at x=153.8 (user-placed).
  {
    name: "Guillotine", // 96" x 72" window w/ horizontal mid bar, on a 36" box
    type: "window",
    width: 96 * IN,
    height: 72 * IN,
    boxHeight: 36 * IN,
    center: { x: 153.8, z: 37.3 },
    rotateDeg: DOOR_ROT,
  },
  {
    name: "IMDX", // 38" x 120" single door (another MDX)
    type: "single",
    width: 38 * IN,
    height: 120 * IN,
    center: { x: 153.8, z: 44.2 },
    rotateDeg: DOOR_ROT,
  },
];

export const showroom = {
  height: ROOM_HEIGHT, // showroom wall height (ft)
  wallThickness: 0.5, // ~6 in stud wall
  glassColor: 0x9fc8e8,

  rooms: [
    {
      // ~25.5 ft wide x ~11.9 ft deep (stretched to the right wall). The conference room.
      name: "Showroom / Conference Room",
      points: [
        { x: NW.x, z: NW.z }, // 0: NW corner
        { x: NW.x + WIDTH, z: NW.z }, // 1: NE corner
        { x: NW.x + WIDTH, z: NW.z + DEPTH }, // 2: SE corner
        { x: NW.x, z: NW.z + DEPTH }, // 3: SW corner
      ],
      // Segment indices: 0 = N (top) wall, 1 = E (right) wall, 2 = S wall, 3 = W wall.
      // All walls are 12 ft (uniform).
      ceiling: true, // cap the room with a ceiling at wall height
      openings: [
        // North wall: 3-panel sliding glass door, 10 ft tall, spanning 90% of the
        // width, centered.
        { segment: 0, offset: WIDTH * 0.05, width: WIDTH * 0.9, bottom: 0, top: 10, kind: "glassdoor", panels: 3 },
        // South wall: same 3-panel sliding glass door.
        { segment: 2, offset: WIDTH * 0.05, width: WIDTH * 0.9, bottom: 0, top: 10, kind: "glassdoor", panels: 3 },
        // West wall: existing 3-panel sliding glass door (9 ft wide x 10 ft tall).
        { segment: 3, offset: (DEPTH - 9) / 2, width: 9, bottom: 0, top: 10, kind: "glassdoor", panels: 3 },
      ],
    },
  ],

  // Free-standing display doors south of the showroom.
  displayDoors: DISPLAY_DOORS,

  // Furniture placed inside the showroom (rendered as its own toggleable layer).
  furniture: [
    {
      kind: "table",
      name: "Conference Table",
      center: CENTER, // room center (follows the footprint)
      length: 8, // long axis (ft)
      width: 3,
      height: 2.5,
      axis: "x", // table length runs along the room's long (X) dimension
      chairsPerSide: 3,
    },
    {
      // Flat-panel TV mounted on the east wall, facing into the room (-X).
      kind: "tv",
      name: "Wall TV",
      center: { x: RIGHT_WALL - 0.4, y: 5.5, z: CENTER.z }, // just off the east wall
      width: 6, // along the wall (Z)
      height: 3.5,
      rotateDeg: -90, // face -X (into the room)
    },
    {
      // Counter under the TV, against the east wall, spanning N->S (full depth).
      kind: "counter",
      name: "Counter",
      center: { x: RIGHT_WALL - 1.25, z: CENTER.z }, // back against the east wall
      length: DEPTH, // north-south span (along Z)
      depth: 2, // protrusion into the room (along X)
      height: 3,
    },
    {
      // 45" (E-W) x 40" x 84" display box, just east of the office east wall
      // (x=173), outside the office (office spans x 130-173, z 49.1-70.1).
      kind: "box",
      name: "Display Box",
      size: { x: 45 * IN, y: 84 * IN, z: 40 * IN }, // 3.75 (X) x 7 (Y) x 3.33 (Z) ft
      // West face flush to the office east wall; north face at the wall's north end (z=49.1).
      center: { x: 175.125, z: 49.1 + (40 * IN) / 2 }, // ~50.77
    },
  ],
};
