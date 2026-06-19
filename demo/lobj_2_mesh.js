import * as THREE from 'three';

const LABEL_COLORS = [
    0xe94560, 0x06d6a0, 0xffd166, 0x118ab2, 0xef476f,
    0x533483, 0x0f3460, 0xf4a261, 0x2a9d8f, 0xe9c46a,
    0x264653, 0xe76f51, 0xa8dadc, 0x457b9d, 0x1d3557,
    0xffb703, 0x8ecae6, 0x219ebc, 0x023047, 0xfb8500,
];
const NO_LABEL_COLOR = 0x888888;

function labelsToVertexColors(labels) {
    const vertexCount = labels.length

    const labelSet = new Set();
    if (labels) for (let i = 0; i < labels.length; i++) labelSet.add(labels[i]);
    const labelList = [...labelSet].sort((a, b) => a - b);

    const labelColorMap = new Map();
    let colorIdx = 0;
    for (const lv of labelList) {
        labelColorMap.set(lv, lv < 0 ? NO_LABEL_COLOR : LABEL_COLORS[colorIdx++ % LABEL_COLORS.length]);
    }

    const vertexColors = new Float32Array(vertexCount * 3);
    for (let i = 0; i < vertexCount; i++) {
        const lv = labels ? labels[i] : -1;
        const hex = labelColorMap.get(lv) ?? NO_LABEL_COLOR;
        vertexColors[i * 3] = ((hex >> 16) & 0xff) / 255;
        vertexColors[i * 3 + 1] = ((hex >> 8) & 0xff) / 255;
        vertexColors[i * 3 + 2] = (hex & 0xff) / 255;
    }

    // 回傳 labelColorMap 方便 sidebar 顯示
    return { vertexColors, labelColorMap };
}

export function buildGeometry(lobj) {
    const { vertices, normals, triangles, labels } = lobj;

    const { vertexColors, labelColorMap } = labelsToVertexColors(labels);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(vertexColors, 3));
    if (normals) geo.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    geo.setIndex(new THREE.BufferAttribute(triangles, 1));
    if (!normals) geo.computeVertexNormals();
    return { geo, labelColorMap };
}
