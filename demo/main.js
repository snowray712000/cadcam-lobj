import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { parseLobj } from '../src/parseLobj.js';
import { parseLobjBinary, isBinaryLobj } from '../src/parseLobjBinary.js';

// --- Scene setup ---
const container = document.getElementById('canvas-container');
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(devicePixelRatio);
renderer.setSize(container.clientWidth, container.clientHeight);
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a2e);

const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.01, 1000);
camera.position.set(0, 0, 5);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(5, 10, 7);
scene.add(dirLight);

// --- State ---
const meshes = [];
const LABEL_COLORS = [
  0xe94560, 0x06d6a0, 0xffd166, 0x118ab2, 0xef476f,
  0x533483, 0x0f3460, 0xf4a261, 0x2a9d8f, 0xe9c46a,
  0x264653, 0xe76f51, 0xa8dadc, 0x457b9d, 0x1d3557,
  0xffb703, 0x8ecae6, 0x219ebc, 0x023047, 0xfb8500,
];
const NO_LABEL_COLOR = 0x888888;

function clearScene() {
  meshes.forEach(m => scene.remove(m));
  meshes.length = 0;
  document.getElementById('group-list').innerHTML = '';
}

function fitCamera() {
  const box = new THREE.Box3().setFromObject(scene);
  if (box.isEmpty()) return;
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3()).length();
  controls.target.copy(center);
  camera.position.copy(center).addScaledVector(new THREE.Vector3(0, 0, 1), size * 1.5);
  controls.update();
}

// --- Binary .lobj ---
function buildSceneBinary(parsed) {
  clearScene();
  const { vertices, normals, labels, triangles } = parsed;
  const cntv = vertices.length / 3;

  // collect unique label values
  const labelSet = new Set();
  if (labels) for (let i = 0; i < labels.length; i++) labelSet.add(labels[i]);
  const labelList = [...labelSet].sort((a, b) => a - b);

  // assign color per label
  const labelColorMap = new Map();
  let colorIdx = 0;
  for (const lv of labelList) {
    labelColorMap.set(lv, lv < 0 ? NO_LABEL_COLOR : LABEL_COLORS[colorIdx++ % LABEL_COLORS.length]);
  }

  // build per-vertex color array
  const vertexColors = new Float32Array(cntv * 3);
  for (let i = 0; i < cntv; i++) {
    const lv = labels ? labels[i] : -1;
    const hex = labelColorMap.get(lv) ?? NO_LABEL_COLOR;
    vertexColors[i * 3]     = ((hex >> 16) & 0xff) / 255;
    vertexColors[i * 3 + 1] = ((hex >> 8)  & 0xff) / 255;
    vertexColors[i * 3 + 2] = (hex & 0xff)          / 255;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geo.setAttribute('color',    new THREE.BufferAttribute(vertexColors, 3));
  if (normals) geo.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  geo.setIndex(new THREE.BufferAttribute(triangles, 1));
  if (!normals) geo.computeVertexNormals();

  const mat = new THREE.MeshPhongMaterial({ vertexColors: true, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(geo, mat);
  scene.add(mesh);
  meshes.push(mesh);

  // sidebar
  const groupList = document.getElementById('group-list');
  for (const lv of labelList) {
    const hex = labelColorMap.get(lv);
    const item = document.createElement('div');
    item.className = 'group-item';
    item.style.borderLeft = `4px solid #${hex.toString(16).padStart(6, '0')}`;
    item.textContent = lv < 0 ? 'no label' : `label ${lv}`;
    groupList.appendChild(item);
  }

  fitCamera();
  document.getElementById('drop-zone').style.display = 'none';
}

// --- Text .lobj ---
function buildScene(parsed) {
  clearScene();
  const { vertices, groups } = parsed;

  const posArr = vertices.flat();
  const allPos = new THREE.Float32BufferAttribute(posArr, 3);

  groups.forEach((g, i) => {
    const indices = [];
    g.faces.forEach(face => {
      for (let j = 1; j < face.length - 1; j++) {
        indices.push(face[0], face[j], face[j + 1]);
      }
    });
    if (!indices.length) return;

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', allPos);
    geo.setIndex(indices);
    geo.computeVertexNormals();

    const mat = new THREE.MeshPhongMaterial({ color: LABEL_COLORS[i % LABEL_COLORS.length], side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);
    meshes.push(mesh);

    const item = document.createElement('div');
    item.className = 'group-item';
    item.textContent = g.label || `group ${i}`;
    item.addEventListener('click', () => {
      mesh.visible = !mesh.visible;
      item.classList.toggle('hidden', !mesh.visible);
    });
    document.getElementById('group-list').appendChild(item);
  });

  fitCamera();
  document.getElementById('drop-zone').style.display = 'none';
}

// --- File loading ---
async function loadFile(file) {
  try {
    const buf = await file.arrayBuffer();
    if (isBinaryLobj(buf)) {
      buildSceneBinary(parseLobjBinary(buf));
    } else {
      const text = new TextDecoder().decode(buf);
      buildScene(parseLobj(text));
    }
  } catch (e) {
    alert('解析失敗: ' + e.message);
  }
}

document.getElementById('file-input').addEventListener('change', e => {
  const file = e.target.files[0];
  if (file) loadFile(file);
});

container.addEventListener('dragover', e => e.preventDefault());
container.addEventListener('drop', e => {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  if (file) loadFile(file);
});

// --- Resize ---
window.addEventListener('resize', () => {
  renderer.setSize(container.clientWidth, container.clientHeight);
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
});

// --- Animate ---
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();
