/** Builds a nested tree from the flat folder list the API returns. */
export function buildFolderTree(folders = []) {
  const byId = new Map(folders.map((f) => [f._id, { ...f, children: [] }]));
  const roots = [];

  for (const folder of byId.values()) {
    if (folder.parent && byId.has(folder.parent)) {
      byId.get(folder.parent).children.push(folder);
    } else {
      roots.push(folder);
    }
  }

  const sortByName = (list) => {
    list.sort((a, b) => a.name.localeCompare(b.name));
    list.forEach((f) => sortByName(f.children));
  };
  sortByName(roots);

  return roots;
}

/** Flattens the tree into `{ id, label, depth }` rows, suitable for a <select> or a simple indented list. */
export function flattenForSelect(tree, depth = 0, out = []) {
  for (const folder of tree) {
    out.push({ id: folder._id, label: `${'—'.repeat(depth)}${depth ? ' ' : ''}${folder.name}`, depth });
    flattenForSelect(folder.children, depth + 1, out);
  }
  return out;
}
