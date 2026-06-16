import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";
import GUI from "lil-gui";
import { buildScene } from "./buildScene.js";

const canvas = document.getElementById("app");

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0e0e12);

// --- Model --------------------------------------------------------------
const { root, layers, bounds } = buildScene();
scene.add(root);
const { L, D, H } = bounds;
const center = new THREE.Vector3(L / 2, H / 2, D / 2);

// --- Lighting -----------------------------------------------------------
scene.add(new THREE.HemisphereLight(0xdfe7f2, 0x202830, 0.9));
const sun = new THREE.DirectionalLight(0xffffff, 1.4);
sun.position.set(L * 0.7, H * 4, -D * 0.6);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
const s = Math.max(L, D) * 0.75;
sun.shadow.camera.left = -s;
sun.shadow.camera.right = s;
sun.shadow.camera.top = s;
sun.shadow.camera.bottom = -s;
sun.shadow.camera.near = 1;
sun.shadow.camera.far = H * 12;
sun.target.position.copy(center);
scene.add(sun);
scene.add(sun.target);

// --- Cameras ------------------------------------------------------------
const aspect = () => window.innerWidth / window.innerHeight;

const persp = new THREE.PerspectiveCamera(55, aspect(), 0.5, 5000);
persp.position.set(L * 0.5, H * 2.2, D * 2.4);

// Orthographic top-down "blueprint" camera.
const ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, -1000, 5000);
function frameOrtho() {
  const margin = 1.1;
  const halfW = (L / 2) * margin;
  const halfH = (D / 2) * margin;
  const a = aspect();
  let w = halfW, h = halfH;
  if (halfW / halfH > a) h = halfW / a;
  else w = halfH * a;
  ortho.left = -w; ortho.right = w; ortho.top = h; ortho.bottom = -h;
  ortho.updateProjectionMatrix();
}
ortho.position.set(L / 2, H * 6, D / 2);
ortho.up.set(0, 0, -1); // so "north" (z=0) is up on screen
ortho.lookAt(L / 2, 0, D / 2);

// First-person "walk" camera, eye height fixed at 6 ft.
const EYE_HEIGHT = 6;
const walkCam = new THREE.PerspectiveCamera(70, aspect(), 0.1, 5000);
walkCam.position.set(140, EYE_HEIGHT, 30);
walkCam.lookAt(161.9, EYE_HEIGHT, 41.55); // face the showroom

let camera = persp;

// --- Controls -----------------------------------------------------------
let controls = new OrbitControls(persp, renderer.domElement);
controls.target.copy(center);
controls.maxPolarAngle = Math.PI * 0.495; // keep above the floor
controls.update();

// --- Walk (first-person) controls --------------------------------------
const walkhintEl = document.getElementById("walkhint");
const walkControls = new PointerLockControls(walkCam, renderer.domElement);
const clock = new THREE.Clock();
const WALK_SPEED = 16; // ft/sec
const keys = { f: false, b: false, l: false, r: false };

window.addEventListener("keydown", (e) => {
  if (state.view !== "Walk") return;
  switch (e.code) {
    case "KeyW": case "ArrowUp": keys.f = true; break;
    case "KeyS": case "ArrowDown": keys.b = true; break;
    case "KeyA": case "ArrowLeft": keys.l = true; break;
    case "KeyD": case "ArrowRight": keys.r = true; break;
  }
});
window.addEventListener("keyup", (e) => {
  switch (e.code) {
    case "KeyW": case "ArrowUp": keys.f = false; break;
    case "KeyS": case "ArrowDown": keys.b = false; break;
    case "KeyA": case "ArrowLeft": keys.l = false; break;
    case "KeyD": case "ArrowRight": keys.r = false; break;
  }
});

// Click the hint overlay to lock the pointer and start walking.
walkhintEl.addEventListener("click", () => {
  if (state.view === "Walk") walkControls.lock();
});
walkControls.addEventListener("lock", () => { walkhintEl.style.display = "none"; });
walkControls.addEventListener("unlock", () => {
  if (state.view === "Walk") walkhintEl.style.display = "flex";
});

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// --- View switching -----------------------------------------------------
const state = {
  view: "3D",
  floor: true,
  shell: true,
  existing: true,
  showroom: true,
  furniture: true,
  wireframe: false,
};

function applyView() {
  // Tear down whatever was active.
  if (controls) {
    controls.dispose();
    controls = null;
  }
  if (walkControls.isLocked) walkControls.unlock();
  walkhintEl.style.display = "none";

  if (state.view === "3D") {
    camera = persp;
    controls = new OrbitControls(persp, renderer.domElement);
    controls.target.copy(center);
    controls.maxPolarAngle = Math.PI * 0.495;
    controls.update();
  } else if (state.view === "Walk") {
    camera = walkCam;
    walkhintEl.style.display = "flex"; // prompt the user to click to start
  } else {
    camera = ortho;
    frameOrtho();
    controls = new OrbitControls(ortho, renderer.domElement);
    controls.target.set(L / 2, 0, D / 2);
    controls.enableRotate = false; // pure top-down pan/zoom
    controls.update();
  }
  updatePickerUI();
}

function applyLayers() {
  layers.floor.visible = state.floor;
  layers.shell.visible = state.shell;
  layers.existing.visible = state.existing;
  layers.showroom.visible = state.showroom;
  layers.furniture.visible = state.furniture;
}

function applyWireframe() {
  root.traverse((o) => {
    if (o.isMesh && o.material && "wireframe" in o.material) {
      // Don't wireframe glass panes.
      if (!o.material.transmission) o.material.wireframe = state.wireframe;
    }
  });
}

// --- GUI ----------------------------------------------------------------
const gui = new GUI({ title: "Showroom Model" });
gui.add(state, "view", ["3D", "Walk", "Blueprint"]).name("View").onChange(applyView);
const layerFolder = gui.addFolder("Layers");
layerFolder.add(state, "floor").name("Floor + grid").onChange(applyLayers);
layerFolder.add(state, "shell").name("Warehouse shell").onChange(applyLayers);
layerFolder.add(state, "existing").name("Existing rooms").onChange(applyLayers);
layerFolder.add(state, "showroom").name("Showroom").onChange(applyLayers);
layerFolder.add(state, "furniture").name("Furniture").onChange(applyLayers);
gui.add(state, "wireframe").name("Wireframe").onChange(applyWireframe);

applyLayers();

// --- Coordinate picker (Blueprint mode) --------------------------------
// Raycasts the cursor onto the floor plane (y=0). Reports world feet as
// x = world X (length), y = world Z (depth). Click to record a point.
const readoutEl = document.getElementById("readout");
const pickerEl = document.getElementById("picker");
const listEl = document.getElementById("picker-list");
const clearBtn = document.getElementById("picker-clear");

const raycaster = new THREE.Raycaster();
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const ndc = new THREE.Vector2();
const hit = new THREE.Vector3();

const pickMarkers = new THREE.Group();
pickMarkers.name = "pickMarkers";
scene.add(pickMarkers);
const markerGeo = new THREE.SphereGeometry(0.8, 16, 12);
const markerMat = new THREE.MeshBasicMaterial({ color: 0xffa733 });

const picked = [];

function worldFromEvent(e) {
  const rect = renderer.domElement.getBoundingClientRect();
  ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(ndc, camera);
  return raycaster.ray.intersectPlane(groundPlane, hit) ? hit : null;
}

function renderList() {
  if (picked.length === 0) {
    listEl.innerHTML = '<li class="empty">Click in the model to record points.</li>';
    return;
  }
  listEl.innerHTML = picked
    .map(
      (p, i) =>
        `<li><span class="idx">${i + 1}</span><span class="val">x ${p.x.toFixed(
          1
        )}, y ${p.y.toFixed(1)}</span></li>`
    )
    .join("");
}

function addPoint(x, y) {
  picked.push({ x, y });
  const m = new THREE.Mesh(markerGeo, markerMat);
  m.position.set(x, 0.2, y);
  pickMarkers.add(m);
  renderList();
}

function clearPoints() {
  picked.length = 0;
  pickMarkers.clear();
  renderList();
}
clearBtn.addEventListener("click", clearPoints);
renderList();

// Live readout follows the cursor in Blueprint mode.
renderer.domElement.addEventListener("pointermove", (e) => {
  if (state.view !== "Blueprint") return;
  const w = worldFromEvent(e);
  if (!w) {
    readoutEl.style.display = "none";
    return;
  }
  readoutEl.style.display = "block";
  readoutEl.style.left = e.clientX + "px";
  readoutEl.style.top = e.clientY + "px";
  readoutEl.textContent = `x: ${w.x.toFixed(1)} , y: ${w.z.toFixed(1)}`;
});

// Record on a click — but not when the pointer was dragged (panning).
let downX = 0;
let downY = 0;
renderer.domElement.addEventListener("pointerdown", (e) => {
  downX = e.clientX;
  downY = e.clientY;
});
renderer.domElement.addEventListener("pointerup", (e) => {
  if (state.view !== "Blueprint" || e.button !== 0) return;
  if (Math.hypot(e.clientX - downX, e.clientY - downY) > 5) return; // was a drag
  const w = worldFromEvent(e);
  if (w) addPoint(w.x, w.z);
});

function updatePickerUI() {
  const on = state.view === "Blueprint";
  pickerEl.style.display = on ? "flex" : "none";
  if (!on) readoutEl.style.display = "none";
}
updatePickerUI();

// --- Resize + render loop ----------------------------------------------
function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h);
  persp.aspect = w / h;
  persp.updateProjectionMatrix();
  walkCam.aspect = w / h;
  walkCam.updateProjectionMatrix();
  frameOrtho();
}
window.addEventListener("resize", resize);
resize();

renderer.setAnimationLoop(() => {
  const dt = clock.getDelta();
  if (state.view === "Walk") {
    if (walkControls.isLocked) {
      const v = WALK_SPEED * dt;
      if (keys.f) walkControls.moveForward(v);
      if (keys.b) walkControls.moveForward(-v);
      if (keys.r) walkControls.moveRight(v);
      if (keys.l) walkControls.moveRight(-v);
      // Stay inside the warehouse and locked to eye height.
      const p = walkCam.position;
      p.x = clamp(p.x, 2, L - 2);
      p.z = clamp(p.z, 2, D - 2);
      p.y = EYE_HEIGHT;
    }
  } else if (controls) {
    controls.update();
  }
  renderer.render(scene, camera);
});
