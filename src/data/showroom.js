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

export const showroom = {
  height: 12, // showroom wall height (ft)
  wallThickness: 0.5, // ~6 in stud wall
  glassColor: 0x9fc8e8,

  rooms: [
    {
      // Outer footprint from two picked corners: (151.7, 35.6) & (172.1, 47.5).
      // ~20.4 ft wide x ~11.9 ft deep, just right of the partition and above the office.
      // This room IS the conference room.
      name: "Showroom / Conference Room",
      points: [
        { x: 151.7, z: 35.6 }, // 0: NW corner
        { x: 172.1, z: 35.6 }, // 1: NE corner
        { x: 172.1, z: 47.5 }, // 2: SE corner
        { x: 151.7, z: 47.5 }, // 3: SW corner
      ],
      // Segment indices: 0 = N (top) wall, 1 = E (right) wall, 2 = S wall, 3 = W wall.
      openings: [
        // Top wall: 150" x 95" window (12.5 x 7.917 ft), centered on the 20.4 ft wall
        // both horizontally and vertically in the 12 ft height.
        { segment: 0, offset: 3.95, width: 12.5, bottom: 2.04, top: 9.96, kind: "window" },
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
      center: { x: 161.9, z: 41.55 }, // room center
      length: 8, // long axis (ft)
      width: 3,
      height: 2.5,
      axis: "x", // table length runs along the room's long (X) dimension
      chairsPerSide: 3,
    },
  ],
};
