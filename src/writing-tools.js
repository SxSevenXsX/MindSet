/* View-only zoom, unrestricted emoji input and list marker interactions. */
(function (root) {
  'use strict';
  const markerColors = [['Noir','#000000'],['Rouge','#d94b4b'],['Bleu','#2563eb'],['Jaune','#eab308'],['Orange','#f08a24'],['Vert','#28934b'],['Violet','#8b5cf6'],['Rose','#ec4899']];
  const clampZoom = value => Math.round(Math.min(2, Math.max(.5, Number(value) || 1)) * 100) / 100;
  function emoji(value) {
    if (typeof value !== 'string') return '';
    const first = new Intl.Segmenter('fr', {granularity:'grapheme'}).segment(value.trim())[Symbol.iterator]().next().value?.segment || '';
    return /[\p{Extended_Pictographic}\p{Regional_Indicator}\p{Emoji_Presentation}\u20e3]/u.test(first) ? first : '';
  }
  function recentColors(colors, next = 0, palette = []) {
    let source = Array.isArray(colors) ? colors : [];
    // Older versions had six slots: retain the latest three in chronological order.
    if (source.length > 3) {
      const full = source.every(Boolean);
      const start = full ? Math.max(0, Math.min(source.length - 1, Number(next) || 0)) : 0;
      source = [...source.slice(start), ...source.slice(0, start)].filter(Boolean).slice(-3);
      next = 0;
    }
    const used = new Set();
    const slots = Array.from({length:3}, (_, i) => {
      const color = String(source[i] || '').toLowerCase();
      if (!/^#[0-9a-f]{6}$/.test(color) || used.has(color) || palette.includes(color)) return '';
      used.add(color); return color;
    });
    return {slots, next:Math.max(0, Math.min(2, Math.trunc(Number(next) || 0)))};
  }
  function rememberColor(history, color, palette = []) {
    const result = recentColors(history.slots, history.next, palette);
    color = String(color || '').toLowerCase();
    if (!/^#[0-9a-f]{6}$/.test(color) || palette.includes(color) || result.slots.includes(color)) return result;
    const empty = result.slots.indexOf('');
    const index = empty < 0 ? result.next : empty;
    result.slots[index] = color; result.next = (index + 1) % 3;
    return result;
  }
  // Apply styles without moving focus: Selection.addRange / execCommand can close
  // Chromium's native color picker. Keep a separate, live range for the toolbar.
  function prepareColorRange(editor, initial) {
    const range = initial.cloneRange(), spans = [], texts = [];
    if (range.collapsed) {
      const span = document.createElement('span'), text = document.createTextNode('\u200b');
      span.append(text); range.insertNode(span); range.setStart(text,1); range.collapse(true);
      return {range,spans:[span]};
    }
    const walker = document.createTreeWalker(editor,NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (!range.intersectsNode(node)) continue;
      const start = node === range.startContainer ? range.startOffset : 0;
      const end = node === range.endContainer ? range.endOffset : node.length;
      if (end > start) texts.push({node,start,end});
    }
    const selected = [];
    for (const {node,start,end} of texts) {
      if (end < node.length) node.splitText(end);
      const text = start ? node.splitText(start) : node;
      let span = text.parentElement;
      if (span.tagName !== 'SPAN' || span.childNodes.length !== 1) {
        span = document.createElement('span'); text.before(span); span.append(text);
      }
      spans.push(span); selected.push(text);
    }
    if (selected.length) {range.setStart(selected[0],0);range.setEnd(selected.at(-1),selected.at(-1).length);}
    return {range,spans};
  }
  function mountZoom(editor, {value = 1, onChange = () => {}} = {}) {
    const surface = editor.closest('.editor-page'), shell = editor.closest('.editor-shell');
    const scroll = editor.closest('.content-area');
    const label = shell.querySelector('[data-note-zoom-reset]');
    const buttons = [...shell.querySelectorAll('[data-note-zoom-in],[data-note-zoom-out],[data-note-zoom-reset]')];
    let zoom = clampZoom(value), wheelZoom = zoom, lastWheelAt = 0;
    function paint() {
      editor.style.zoom = String(zoom);
      label.textContent = `${Math.round(zoom * 100)} %`;
      shell.querySelector('[data-note-zoom-in]').disabled = zoom === 2;
      shell.querySelector('[data-note-zoom-out]').disabled = zoom === .5;
    }
    function set(next, y) {
      next = clampZoom(next); if (next === zoom) return;
      const before = editor.getBoundingClientRect();
      const anchor = y ?? Math.max(before.top, (scroll?.getBoundingClientRect().top || 0) + 60);
      const relative = Math.max(0, anchor - before.top) / zoom;
      zoom = next; paint();
      if (scroll) scroll.scrollTop += editor.getBoundingClientRect().top + relative * zoom - anchor;
      onChange(zoom);
    }
    const wheel = event => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      const pixels = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 200 : 1);
      const time = performance.now();
      if (time - lastWheelAt > 250) wheelZoom = zoom;
      lastWheelAt = time;
      wheelZoom = Math.max(.5, Math.min(2, wheelZoom * Math.exp(-Math.max(-100, Math.min(100, pixels)) * .00125)));
      set(wheelZoom, event.clientY);
    };
    const press = event => { event.preventDefault(); };
    const click = event => {set(event.currentTarget.hasAttribute('data-note-zoom-reset') ? 1 : zoom + (event.currentTarget.hasAttribute('data-note-zoom-in') ? .05 : -.05));wheelZoom = zoom;};
    surface.addEventListener('wheel', wheel, {passive:false});
    buttons.forEach(button => {button.addEventListener('mousedown',press);button.addEventListener('click',click);});
    paint();
    return {destroy() {surface.removeEventListener('wheel',wheel);buttons.forEach(button => {button.removeEventListener('mousedown',press);button.removeEventListener('click',click);});}};
  }
  function markerAt(editor, event) {
    if (!editor) return null;
    const book = editor.closest('[data-book-canvas]');
    const scale = book ? new DOMMatrix(getComputedStyle(book).transform).a : Number(getComputedStyle(editor).zoom) || 1;
    // A fragmented item has only one marker, on its first line, even across pages.
    for (const li of editor.querySelectorAll('li')) {
      const rect = li.getClientRects()[0]; if (!rect || !rect.height) continue;
      const style = getComputedStyle(li), line = parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.55;
      const custom = ['dash-list','arrow-list','check-list','triangle-list','square-list'].some(name => li.parentElement.classList.contains(name));
      const left = rect.left + (custom ? 0 : -28 * scale), right = rect.left + (custom ? 21 * scale : 1);
      if (event.clientX >= left && event.clientX <= right && event.clientY >= rect.top && event.clientY <= rect.top + line * scale) return li;
    }
    return null;
  }
  function mountMarkers(editor, {remember = () => {}, changed = () => {}} = {}) {
    if (!editor) return {destroy() {}};
    let panel = null;
    function close() {panel?.remove(); panel = null;}
    const outside = event => {if (panel && !panel.contains(event.target)) close();};
    const key = event => {if (event.key === 'Escape' && panel) {event.preventDefault();close();editor.focus({preventScroll:true});}};
    const down = event => {if (markerAt(editor,event)) event.preventDefault();};
    const dblclick = event => {
      const li = markerAt(editor,event); if (!li) return;
      event.preventDefault(); event.stopPropagation(); close();
      panel = document.createElement('div'); panel.className = 'marker-color-panel'; panel.dataset.markerPalette = '';
      panel.setAttribute('role','dialog'); panel.setAttribute('aria-label','Couleur du marqueur');
      const title = document.createElement('div');title.className='menu-panel-label';title.textContent='Couleur du marqueur';panel.append(title);
      const row = document.createElement('div');row.className='marker-color-swatches';panel.append(row);
      function apply(color) {
        if (!li.isConnected) {close();return;}
        remember();
        if (color) li.dataset.markerColor = color; else delete li.dataset.markerColor;
        changed(); close(); editor.focus({preventScroll:true});
      }
      for (const [name,color] of markerColors) {
        const button=document.createElement('button');button.type='button';button.className='quick-color';button.style.setProperty('--quick-color',color);button.setAttribute('aria-label',name);button.title=name;
        button.addEventListener('click',()=>apply(color));row.append(button);
      }
      const inherit=document.createElement('button');inherit.type='button';inherit.className='menu-panel-item';inherit.textContent='Suivre la couleur du texte';inherit.addEventListener('click',()=>apply(''));panel.append(inherit);
      panel.addEventListener('mousedown',event=>event.preventDefault());document.body.append(panel);
      panel.style.left=`${Math.max(8,Math.min(event.clientX,window.innerWidth-panel.offsetWidth-8))}px`;
      panel.style.top=`${Math.max(8,Math.min(event.clientY+10,window.innerHeight-panel.offsetHeight-8))}px`;
    };
    editor.addEventListener('mousedown',down);editor.addEventListener('dblclick',dblclick);
    document.addEventListener('pointerdown',outside,true);document.addEventListener('keydown',key,true);document.addEventListener('scroll',close,true);
    return {destroy() {close();editor.removeEventListener('mousedown',down);editor.removeEventListener('dblclick',dblclick);document.removeEventListener('pointerdown',outside,true);document.removeEventListener('keydown',key,true);document.removeEventListener('scroll',close,true);}};
  }
  root.MindSetWriting = {clampZoom,emoji,recentColors,rememberColor,prepareColorRange,mountZoom,markerAt,mountMarkers};
  if (typeof module === 'object' && module.exports) module.exports = root.MindSetWriting;
})(typeof globalThis === 'object' ? globalThis : this);
