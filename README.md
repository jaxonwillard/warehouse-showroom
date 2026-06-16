# Warehouse Showroom Model

A Three.js model of a warehouse and the showroom / conference room being built
inside it. Renders both a **3D walkthrough view** and a top-down
**blueprint view** from the same data.

- **Units:** 1 unit = 1 foot.
- **Coordinates:** `X` = length (200 ft), `Z` = depth (70.5 ft), `Y` = up.
  Origin `(0,0)` is the top-left corner of the floor plan.
- **Buildless:** Three.js + lil-gui load from a CDN via an importmap. No
  Node/npm needed — just a static file server (this machine has Python).

## Run it

```powershell
# from the project folder
./serve.ps1
```

That starts a local server and opens the model in your browser. Or manually:

```powershell
python -m http.server 5173
# then open http://localhost:5173/
```

## Controls

- **Drag** = orbit, **Right-drag** = pan, **Scroll** = zoom.
- Top-right panel: switch **3D / Blueprint**, toggle layers (floor, shell,
  existing rooms, showroom), and toggle wireframe.

## Where the design lives

Everything is data-driven — edit these, not the geometry code:

| File | What it defines |
|---|---|
| `src/data/warehouse.js` | Warehouse shell (200 × 70.5 ft, 24 ft walls) + existing corner room. |
| `src/data/showroom.js`  | **The new showroom + conference room** — walls, windows, doors. Currently a placeholder example. |

### Room data format (`showroom.js`)

A room is a closed loop of corner points plus a list of openings:

```js
{
  name: "Conference Room",
  points: [ {x, z}, ... ],     // corners in order; loop closes automatically
  openings: [
    { segment, offset, width, bottom, top, kind }
    // segment: which wall edge (0 = points[0]->points[1])
    // offset : feet from that edge's start corner to the opening
    // width  : opening width (ft)
    // bottom : sill height above floor (ft); use 0 for a door
    // top    : head height above floor (ft)
    // kind   : "window" | "door" | "opening"
  ],
}
```

## Code map

- `src/main.js` — scene, lights, the two cameras, controls, UI, render loop.
- `src/buildScene.js` — assembles floor, shell, existing rooms, showroom into toggleable layers.
- `src/geometry/walls.js` — builds walls from points and punches window/door openings.
