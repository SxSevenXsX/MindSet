(function () {
  'use strict';
  const safeStyles = new Set(['color', 'background-color', 'font-family', 'font-size', 'font-weight', 'font-style', 'text-decoration', 'text-decoration-line', 'text-decoration-color', 'text-align', 'line-height', 'white-space', 'vertical-align', 'width', 'height', 'max-width', 'border-collapse', 'border', 'border-color', 'border-width', 'border-style', 'padding', 'padding-left', 'margin-left', 'margin-top', 'margin-bottom', 'text-indent', 'float', '--li-marker-color']);
  const safeClass = /^(ms-(?:style|inline)-(?:normal|h[1-6]|ps[1-4])|(?:dash|arrow|circle|check|triangle|square)-list|is-checked|note-page-break|note-callout|image-(?:left|right|center|inline|full)|img-(?:float-left|float-right|block-center))$/;
  function cleanHtml(value) {
    const fragment = DOMPurify.sanitize(String(value || ''), {
      USE_PROFILES: { html: true }, RETURN_DOM_FRAGMENT: true,
      ALLOW_DATA_ATTR: false, ADD_ATTR: ['data-checked'],
      FORBID_TAGS: ['style', 'form', 'input', 'button', 'textarea', 'select', 'video', 'audio'],
      FORBID_ATTR: ['id', 'name', 'srcset', 'contenteditable', 'autofocus', 'tabindex'],
    });
    for (const el of fragment.querySelectorAll('*')) {
      const kept = [...el.classList].filter(value => safeClass.test(value));
      if (kept.length) el.className = kept.join(' '); else el.removeAttribute('class');
      for (const property of [...el.style]) {
        const value = el.style.getPropertyValue(property);
        if (!safeStyles.has(property) || /url\s*\(|expression|var\s*\(/i.test(value)) el.style.removeProperty(property);
      }
      if (!el.getAttribute('style')) el.removeAttribute('style');
      if (el.tagName === 'A') el.setAttribute('rel', 'noopener noreferrer');
      if (el.tagName === 'IMG' && !/^(https?:|data:image\/(?:png|jpeg|gif|webp|bmp);base64,)/i.test(el.getAttribute('src') || '')) el.removeAttribute('src');
      if (el.matches('hr.note-page-break')) el.setAttribute('contenteditable', 'false');
    }
    const container = document.createElement('div');
    container.append(fragment);
    return container.innerHTML || '<p><br></p>';
  }
  function pick(source, keys) {
    return Object.fromEntries(keys.filter(key => source[key] !== undefined).map(key => [key, source[key]]));
  }
  function cleanBox(source) {
    const box = pick(source, ['id', 'name', 'passwordHash', 'createdAt', 'modifiedAt']);
    box.isGuide = source.isGuide === true;
    box.guideVersion = Number.isInteger(source.guideVersion) ? source.guideVersion : 0;
    if (source.passwordHash) return { ...box, encrypted: source.encrypted, archiveImported: true };
    MindSetArchive.validateOpenedBox(source);
    Object.assign(box, pick(source, ['activeItemId', 'selectedIds', 'expandedIds', 'viewMode', 'sortMode', 'customSortActive', 'iconFolderId', 'bookmarkedIds', 'openTabIds']));
    box.searchQuery = '';
    function node(source) {
      const result = pick(source, ['id', 'type', 'title', 'createdAt', 'modifiedAt']);
      result.iconKind = ['none', 'default', 'emoji'].includes(source.iconKind) ? source.iconKind : 'none';
      result.emoji = typeof source.emoji === 'string' ? source.emoji.slice(0, 32) : '';
      if (source.type === 'folder') result.children = source.children.map(node);
      if (source.type === 'note') {
        result.content = cleanHtml(source.content);
        if (source.bookSetup) result.bookSetup = MindSetBookLayout.normalize(source.bookSetup);
      }
      if (source.type === 'audio') {
        result.clipSort = source.clipSort;
        result.clips = source.clips.map(clip => ({
          ...pick(clip, ['id', 'name', 'mime', 'duration', 'createdAt', 'modifiedAt', 'size']),
          source: clip.source === 'import' ? 'import' : 'record',
          color: /^#[0-9a-f]{6}$/i.test(clip.color || '') ? clip.color : null,
        }));
      }
      return result;
    }
    box.root = node(source.root);
    return box;
  }
  window.MindSetArchiveContent = { cleanHtml, cleanBox };
})();
