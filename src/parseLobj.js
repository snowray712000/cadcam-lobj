/**
 * Parse .lobj file text into structured data.
 * .lobj format: labeled OBJ — standard OBJ with optional `# label <name>` directives.
 * @param {string} text
 * @returns {{ groups: Array<{label: string, vertices: number[][], faces: number[][]}>  }}
 */
export function parseLobj(text) {
  const lines = text.split(/\r?\n/);
  const allVertices = [];
  const groups = [];
  let current = null;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#') && !line.startsWith('# label')) continue;

    if (line.startsWith('# label ')) {
      const label = line.slice('# label '.length).trim();
      current = { label, faces: [] };
      groups.push(current);
      continue;
    }

    const parts = line.split(/\s+/);
    const cmd = parts[0];

    if (cmd === 'v') {
      allVertices.push(parts.slice(1).map(Number));
    } else if (cmd === 'f') {
      if (!current) {
        current = { label: '', faces: [] };
        groups.push(current);
      }
      const indices = parts.slice(1).map(p => parseInt(p.split('/')[0]) - 1);
      current.faces.push(indices);
    }
  }

  return { vertices: allVertices, groups };
}
