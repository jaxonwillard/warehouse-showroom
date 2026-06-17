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

  // Canopy projecting north from the showroom's north wall.
  canopy: {
    name: "North Canopy",
    xMin: NW.x, // matches showroom width
    width: WIDTH,
    zStart: NW.z, // attaches at the north wall
    extend: -10, // projects 10 ft north (-Z)
    height: ROOM_HEIGHT, // same height as the showroom
    slabThickness: 0.6,
    legSize: 0.6,
    potCols: 4,
    potRows: 3,
  },

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
  ],
};
