(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MindSetArchive = api;
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';
  const MAX_BYTES = 256 * 1024 * 1024;
  const FORMAT = 'mindset-backup';
  const fail = message => { throw new Error(message); };
  const validId = value => typeof value === 'string' && /^[a-zA-Z0-9_-]{1,160}$/.test(value);
  const text = (value, max = 2000) => typeof value === 'string' && value.length <= max;
  function safeParse(value) {
    return JSON.parse(value, (key, item) => {
      if (['__proto__', 'constructor', 'prototype'].includes(key)) fail('Propriété non autorisée dans le fichier.');
      return item;
    });
  }
  function toBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let result = '';
    for (let at = 0; at < bytes.length; at += 32768) result += String.fromCharCode(...bytes.subarray(at, at + 32768));
    return btoa(result);
  }
  function fromBase64(value) {
    if (typeof value !== 'string' || value.length % 4 || !/^[A-Za-z0-9+/]*={0,2}$/.test(value)) fail('Données encodées invalides.');
    return Uint8Array.from(atob(value), c => c.charCodeAt(0));
  }
  async function digest(value) {
    const bytes = new TextEncoder().encode(JSON.stringify(value));
    return Array.from(new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256', bytes)), n => n.toString(16).padStart(2, '0')).join('');
  }
  function validatePayload(payload, skipMissingAudio = false) {
    if (!payload || !Array.isArray(payload.boxes) || payload.boxes.length > 1000 || !Array.isArray(payload.audio)) fail('Ce fichier ne contient pas une sauvegarde de boîtes MindSet.');
    const boxes = new Map(), clips = new Map(), expectedClips = new Map();
    let totalNodes = 0;
    for (const box of payload.boxes) {
      if (!box || !validId(box.id) || boxes.has(box.id) || !text(box.name) || !text(box.passwordHash || '')) fail('Identité de boîte invalide ou répétée.');
      boxes.set(box.id, box);
      if (box.passwordHash) {
        if (box.root || box.encrypted?.v !== 1 || !box.encrypted.data) fail('Une boîte protégée doit être exportée chiffrée. Déverrouille-la une fois pour migrer son ancien format.');
        if (fromBase64(box.encrypted.salt).length !== 16 || fromBase64(box.encrypted.iv).length !== 12 || fromBase64(box.encrypted.data).length < 16) fail('Boîte chiffrée incomplète.');
      } else {
        if (box.root?.type !== 'folder') fail('La racine de la boîte est absente.');
        const ids = new Set();
        const visit = (node, depth = 0) => {
          if (!node || ++totalNodes > 50000 || depth > 100 || !validId(node.id) || ids.has(node.id) || !text(node.title)) fail('Structure de boîte invalide ou trop volumineuse.');
          ids.add(node.id);
          if (node.type === 'folder') {
            if (!Array.isArray(node.children)) fail('Dossier incomplet.');
            node.children.forEach(child => visit(child, depth + 1));
          } else if (node.type === 'note') {
            if (!text(node.content || '', 16 * 1024 * 1024)) fail('Note invalide ou trop volumineuse.');
          } else if (node.type === 'audio') {
            if (!Array.isArray(node.clips)) fail('Liste audio invalide.');
            for (const clip of node.clips) {
              if (!clip || !validId(clip.id) || expectedClips.has(clip.id) || !text(clip.name || '')) fail('Identité audio invalide ou répétée.');
              expectedClips.set(clip.id, box.id);
            }
          } else fail('Type de document inconnu.');
        };
        visit(box.root);
        for (const key of ['selectedIds', 'expandedIds', 'bookmarkedIds', 'openTabIds']) {
          if (box[key] !== undefined && (!Array.isArray(box[key]) || box[key].some(id => !validId(id)))) fail('Références de documents invalides.');
        }
        for (const key of ['activeItemId', 'iconFolderId']) {
          if (box[key] && !validId(box[key])) fail('Référence de document invalide.');
        }
      }
    }
    for (const record of payload.audio) {
      const box = boxes.get(record?.boxId);
      if (!box || !validId(record.id) || clips.has(record.id) || !text(record.mime || '', 200)) fail('Audio absent, répété ou rattaché à une boîte inconnue.');
      for (const variant of [record, record.pending].filter(Boolean)) {
        if (typeof variant.enc !== 'boolean' || !fromBase64(variant.data).length) fail('Données audio invalides.');
        if (variant.enc && fromBase64(variant.iv).length !== 12) fail('Chiffrement audio incomplet.');
        if (box.passwordHash && !variant.enc) fail('Une boîte protégée contient un audio non chiffré. Ouvre-la avant de réessayer.');
      }
      if (!box.passwordHash && expectedClips.get(record.id) !== box.id) fail('Audio sans document correspondant.');
      clips.set(record.id, record.boxId);
    }
    for (const [id, boxId] of expectedClips) if (!skipMissingAudio && clips.get(id) !== boxId) fail('Un enregistrement audio manque : export incomplet refusé.');
    return payload;
  }
  function encodeAudio(record) {
    const variant = value => ({ enc: !!value.enc, iv: value.iv || null, data: toBase64(value.data) });
    return { id: record.id, boxId: record.boxId, mime: record.mime || 'audio/webm', ...variant(record), ...(record.pending ? { pending: variant(record.pending) } : {}) };
  }
  function decodeAudio(record) {
    const variant = value => ({ enc: value.enc, iv: value.iv || null, data: fromBase64(value.data).buffer });
    return { id: record.id, boxId: record.boxId, mime: record.mime, ...variant(record), ...(record.pending ? { pending: variant(record.pending) } : {}) };
  }
  async function create(payload) {
    validatePayload(payload);
    const envelope = { format: FORMAT, version: 1, createdAt: new Date().toISOString(), payload, sha256: await digest(payload) };
    const result = JSON.stringify(envelope);
    if (new TextEncoder().encode(result).byteLength > MAX_BYTES) fail('Sauvegarde trop volumineuse (256 Mo maximum). Exporte les boîtes séparément.');
    return result;
  }
  async function parse(contents) {
    if (new TextEncoder().encode(contents).byteLength > MAX_BYTES) fail('Fichier trop volumineux (256 Mo maximum).');
    let archive;
    try { archive = safeParse(contents.replace(/^\uFEFF/, '')); } catch { fail('Le fichier est illisible ou n’est pas une sauvegarde MindSet.'); }
    if (archive?.format !== FORMAT || archive.version !== 1) fail('Format de sauvegarde MindSet non reconnu.');
    if (typeof archive.sha256 !== 'string' || archive.sha256 !== await digest(archive.payload)) fail('Le fichier est incomplet ou a été modifié. Aucune boîte n’a été importée.');
    validatePayload(archive.payload);
    return archive;
  }
  function planImport(payload, existingBoxes, existingAudio = []) {
    validatePayload(payload);
    const present = new Set(existingBoxes.map(box => box.id));
    const boxes = payload.boxes.filter(box => !present.has(box.id));
    const selected = new Set(boxes.map(box => box.id));
    const audio = payload.audio.filter(record => selected.has(record.boxId));
    const occupied = new Set(existingAudio.map(record => record.id));
    if (audio.some(record => occupied.has(record.id))) fail('Un identifiant audio existe déjà. Import arrêté pour préserver les enregistrements présents.');
    return { boxes, audio, skipped: payload.boxes.length - boxes.length };
  }
  function validateOpenedBox(box) { return validatePayload({ boxes: [{ ...box, passwordHash: '' }], audio: [] }, true); }
  return { validateOpenedBox, MAX_BYTES, FORMAT, safeParse, create, parse, validatePayload, planImport, encodeAudio, decodeAudio };
});
