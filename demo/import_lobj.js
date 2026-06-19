// main.js 太長，將關鍵的 sample 搬過來

import { parseLobjBinary, isValidLobj } from './../src/parseLobjBinary.js';

// --- File loading ---
async function loadFile(file) {
    try {
        const buf = await file.arrayBuffer();
        if (isValidLobj(buf)) {
            const lobjdata = parseLobjBinary(buf);
            
            // trigger document lobj-imported event
            const event = new CustomEvent('lobj-imported', { detail: {lobj: lobjdata} });
            document.dispatchEvent(event);
        }

    } catch (e) {
        alert('解析失敗: ' + e.message);
    }
}

export function add_event_drop_lobj(container) {
    container.addEventListener('dragover', e => e.preventDefault());
    container.addEventListener('drop', e => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) loadFile(file);
    });
}

export function add_input_type_change(input) {
    input.addEventListener('change', e => {
        const file = e.target.files[0];
        if (file) loadFile(file);
    });
}