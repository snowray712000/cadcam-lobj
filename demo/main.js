import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { parseLobjBinary, isValidLobj } from '../src/parseLobjBinary.js';

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

import { buildGeometry } from './lobj_2_mesh.js';

// --- Binary .lobj ---
function buildSceneBinary(lobj) {
  clearScene();
  const {geo, labelColorMap} = buildGeometry(lobj);

  const mat = new THREE.MeshPhongMaterial({ vertexColors: true, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(geo, mat);
  scene.add(mesh);
  meshes.push(mesh);

  // sidebar
  const groupList = document.getElementById('group-list');

  for(const lv of labelColorMap.keys()) {
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


// 將關鍵，重構到 import_lobj.js 中
import { add_event_drop_lobj, add_input_type_change } from './import_lobj.js';

add_input_type_change(document.getElementById('file-input'));
add_event_drop_lobj(container);
document.addEventListener('lobj-imported', e => {
  const lobj = e.detail.lobj;
  buildSceneBinary(lobj);
})

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
