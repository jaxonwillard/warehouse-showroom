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
const NW = { x: 150.1, z: 1.3 }; // top-left corner (user-placed)
const WIDTH = 20.4; // along X
const DEPTH = 11.9; // along Z
const CENTER = { x: NW.x + WIDTH / 2, z: NW.z + DEPTH / 2 };

export const showroom = {
  height: 12, // showroom wall height (ft)
  wallThickness: 0.5, // ~6 in stud wall
  glassColor: 0x9fc8e8,

  rooms: [
    {
      // ~20.4 ft wide x ~11.9 ft deep. This room IS the conference room.
      name: "Showroom / Conference Room",
      points: [
        { x: NW.x, z: NW.z }, // 0: NW corner
        { x: NW.x + WIDTH, z: NW.z }, // 1: NE corner
        { x: NW.x + WIDTH, z: NW.z + DEPTH }, // 2: SE corner
        { x: NW.x, z: NW.z + DEPTH }, // 3: SW corner
      ],
      // Segment indices: 0 = N (top) wall, 1 = E (right) wall, 2 = S wall, 3 = W wall.
      // Per-wall height overrides: left (W) and right (E) walls are 14 ft;
      // top/bottom stay at the default showroom height (12 ft).
      wallHeights: { 1: 14, 3: 14 },
      openings: [
        // Bottom (S) wall: 10 x 10 ft window, centered horizontally on the 20.4 ft
        // wall, sitting on the floor (sill at 0, head at 10 ft).
        { segment: 2, offset: 5.2, width: 10, bottom: 0, top: 10, kind: "window" },
        // Right wall: 3-panel sliding glass door, 9 ft wide x 10 ft tall, centered
        // horizontally on the 11.9 ft wall, floor to 10 ft.
        { segment: 1, offset: 1.45, width: 9, bottom: 0, top: 10, kind: "glassdoor", panels: 3 },
      ],
    },
  ],

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
  ],
};
