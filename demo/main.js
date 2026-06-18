import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { parseLobj } from '../src/parseLobj.js';

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
const COLORS = [0xe94560, 0x0f3460, 0x533483, 0x06d6a0, 0xffd166, 0x118ab2, 0xef476f];

function clearScene() {
  meshes.forEach(m => scene.remove(m));
  meshes.length = 0;
  document.getElementById('group-list').innerHTML = '';
}

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

    const mat = new THREE.MeshPhongMaterial({ color: COLORS[i % COLORS.length], side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);
    meshes.push(mesh);

    // sidebar item
    const item = document.createElement('div');
    item.className = 'group-item';
    item.textContent = g.label || `group ${i}`;
    item.addEventListener('click', () => {
      mesh.visible = !mesh.visible;
      item.classList.toggle('hidden', !mesh.visible);
    });
    document.getElementById('group-list').appendChild(item);
  });

  // fit camera
  const box = new THREE.Box3().setFromObject(scene);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3()).length();
  controls.target.copy(center);
  camera.position.copy(center).addScaledVector(new THREE.Vector3(0, 0, 1), size * 1.5);
  controls.update();

  document.getElementById('drop-zone').style.display = 'none';
}

function loadText(text) {
  try {
    buildScene(parseLobj(text));
  } catch (e) {
    alert('解析失敗: ' + e.message);
  }
}

// --- File input ---
document.getElementById('file-input').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  file.text().then(loadText);
});

// --- Drag & drop ---
container.addEventListener('dragover', e => e.preventDefault());
container.addEventListener('drop', e => {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  if (file) file.text().then(loadText);
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
