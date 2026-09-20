(function (root) {
  'use strict';
  root.MindSetStorage = {
    read(storage, key, normalize, createInitial) {
      let raw = null;
      try {
        raw = storage.getItem(key);
        if (raw === null) return { state: normalize(createInitial()), blocked: false, raw: null };
        const parsed = JSON.parse(raw);
        if (!parsed || !Array.isArray(parsed.boxes) || parsed.boxes.some(box => !box || typeof box.id !== 'string' || typeof box.name !== 'string' || (!box.root && !box.encrypted?.data))) throw Error('État incomplet');
        const ids = new Set();
        let count = 0;
        function checkNode(node, depth = 0) {
          if (!node || typeof node.id !== 'string' || typeof node.title !== 'string' || ++count > 100000 || depth > 200) throw Error('Document incomplet');
          if (node.type === 'folder') {
            if (!Array.isArray(node.children)) throw Error('Dossier incomplet');
            node.children.forEach(child => checkNode(child, depth + 1));
          } else if (node.type === 'note') {
            if (node.content !== undefined && typeof node.content !== 'string') throw Error('Note illisible');
          } else if (node.type === 'audio') {
            if (node.clips !== undefined && !Array.isArray(node.clips)) throw Error('Audio illisible');
          } else throw Error('Document inconnu');
        }
        for (const box of parsed.boxes) {
          if (ids.has(box.id)) throw Error('Boîte répétée');
          ids.add(box.id);
          if (box.root) {
            if (box.root.type !== 'folder') throw Error('Racine illisible');
            checkNode(box.root);
          }
        }
        const state = normalize(parsed);
        state.currentBoxId = null;
        return { state, blocked: false, raw };
      } catch {
        return { state: { boxes: [], currentBoxId: null, settings: {} }, blocked: true, raw };
      }
    },
  };
  if (typeof module === 'object' && module.exports) module.exports = root.MindSetStorage;
})(typeof globalThis === 'object' ? globalThis : this);
