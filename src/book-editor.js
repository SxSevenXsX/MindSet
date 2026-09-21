/* Native fragmentation keeps one editable DOM and one undo history at every zoom. */
(function () {
  function supported() { return CSS.supports('column-wrap', 'wrap') && CSS.supports('column-height', '100px'); }
  function mount(editor, { setup, columns = 2, onChange = () => {}, onZoom = () => {} }) {
    const viewport = editor.closest('[data-book-viewport]');
    const canvas = editor.parentElement;
    const layer = canvas.querySelector('[data-book-paper-layer]');
    const controls = viewport.previousElementSibling;
    let geometry, scale = 1, pageCount = 1, frame = 0, destroyed = false, followCaret = false;
    function setGeometry(count) {
      geometry = window.MindSetBookLayout.geometry(setup, count);
      const g = geometry;
      const values = { columns:g.columns, left:g.margins.left, top:g.margins.top, bottom:g.margins.bottom,
        'content-width':g.contentWidth, 'content-height':g.contentHeight,
        'content-width-total':g.contentWidth * g.columns + g.columnGap * (g.columns - 1),
        'column-gap':g.columnGap, 'row-gap':g.rowGap };
      for (const [key, value] of Object.entries(values)) canvas.style.setProperty(`--book-${key}`, `${value}${key === 'columns' ? '' : 'px'}`);
      canvas.style.width = `${g.canvasWidth}px`;
      controls.querySelector('[data-book-columns]').value = String(g.columns);
      controls.querySelector('[data-book-zoom-in]').disabled = g.columns === 1;
      controls.querySelector('[data-book-zoom-out]').disabled = g.columns === 4;
    }
    function pageAtRect(rect) {
      const origin = editor.getBoundingClientRect(), g = geometry;
      const col = Math.max(0, Math.min(g.columns - 1, Math.floor(((rect.left - origin.left) / scale + 1) / (g.width + g.gap))));
      const row = Math.max(0, Math.floor(((rect.top - origin.top) / scale + 1) / (g.height + g.gap)));
      return row * g.columns + col + 1;
    }
    function measure() {
      if (destroyed || !editor.isConnected) return;
      const g = geometry;
      // Fit a complete row in both dimensions, including padding and borders.
      const bottom = Math.min(window.innerHeight, viewport.closest('.content-area')?.getBoundingClientRect().bottom || window.innerHeight);
      const availableHeight = Math.max(100, bottom - viewport.getBoundingClientRect().top - 24);
      scale = Math.min(1.5, Math.max(.01, (viewport.clientWidth - 36) / g.canvasWidth), Math.max(.01, (availableHeight - 38) / g.height));
      canvas.style.transform = `scale(${scale})`;
      canvas.parentElement.style.width = `${g.canvasWidth * scale}px`;
      // Text line rectangles, not block bounds (which may cover empty columns).
      let count = 1;
      const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
      while (walker.nextNode()) {
        const node = walker.currentNode;
        if (node.nodeType === Node.TEXT_NODE && node.textContent.length) {
          const range = document.createRange(); range.selectNodeContents(node);
          for (const rect of range.getClientRects()) if (rect.height) count = Math.max(count, pageAtRect(rect));
        } else if (node.nodeType === Node.ELEMENT_NODE && node.matches('br,img,hr,video,audio')) {
          for (const rect of node.getClientRects()) count = Math.max(count, pageAtRect(rect));
        }
      }
      pageCount = count;
      const slots = Math.max(g.columns, count);
      const rows = Math.ceil(slots / g.columns);
      canvas.style.height = `${rows * g.height + (rows - 1) * g.gap}px`;
      canvas.parentElement.style.height = `${(rows * g.height + (rows - 1) * g.gap) * scale}px`;
      // Keep the entire row visible when possible; longer documents scroll vertically.
      viewport.style.height = `${Math.ceil(g.height * scale + 38)}px`;
      viewport.style.maxHeight = `${availableHeight}px`;
      const signature = `${slots}:${count}:${g.width}:${g.height}:${g.columns}`;
      if (layer.dataset.layout !== signature) {
        layer.replaceChildren();
        for (let index = 0; index < slots; index++) {
          const paper = document.createElement('div');
          paper.className = `book-paper${index >= count ? ' is-next-page' : ''}`;
          paper.dataset.bookPage = String(index + 1);
          Object.assign(paper.style, { left:`${index % g.columns * (g.width + g.gap)}px`, top:`${Math.floor(index / g.columns) * (g.height + g.gap)}px`, width:`${g.width}px`, height:`${g.height}px` });
          const label = document.createElement('span'); label.className = 'book-page-number'; label.textContent = String(index + 1); paper.append(label);
          if (index >= count) { const hint = document.createElement('span'); hint.className = 'book-next-page-label'; hint.textContent = 'Page suivante'; paper.append(hint); }
          layer.append(paper);
        }
        layer.dataset.layout = signature;
      }
      controls.querySelector('[data-book-info]').textContent = `${pageCount} page${pageCount > 1 ? 's' : ''} · ${Math.round(scale * 100)} %`;
      onChange(pageCount);
      if (document.activeElement === editor) {
        const selection = window.getSelection();
        if (selection?.isCollapsed && selection.rangeCount && editor.contains(selection.anchorNode)) {
          const caret = selection.getRangeAt(0).getBoundingClientRect(), bounds = viewport.getBoundingClientRect();
          if (caret.height && (followCaret || caret.bottom > bounds.bottom - 18 || caret.top < bounds.top + 18)) {
            const row = Math.floor((pageAtRect(caret) - 1) / g.columns);
            viewport.scrollTop = row * (g.height + g.gap) * scale;
          }
        }
      }
      followCaret = false;
    }
    function schedule() { cancelAnimationFrame(frame); frame = requestAnimationFrame(measure); }
    function follow(event) {
      if (event.type === 'keyup' && !['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End','PageUp','PageDown','Enter','Delete','Backspace'].includes(event.key)) return;
      if (event.key === 'Backspace' && window.MindSetEditorBoundary.atStart(editor)) return;
      followCaret = true; schedule();
    }
    function zoom(count) {
      const selected = window.getSelection();
      const range = selected?.rangeCount && editor.contains(selected.anchorNode) ? selected.getRangeAt(0).cloneRange() : null;
      const oldPage = range ? pageAtRect(range.getBoundingClientRect()) : Math.floor(viewport.scrollTop / scale / (geometry.height + geometry.gap)) * geometry.columns + 1;
      setGeometry(count); measure();
      viewport.scrollTop = Math.floor((oldPage - 1) / geometry.columns) * (geometry.height + geometry.gap) * scale;
      onZoom(geometry.columns);
    }
    const select = controls.querySelector('[data-book-columns]');
    const zoomIn = controls.querySelector('[data-book-zoom-in]'), zoomOut = controls.querySelector('[data-book-zoom-out]');
    const change = () => zoom(Number(select.value));
    const closer = () => zoom(geometry.columns - 1), farther = () => zoom(geometry.columns + 1);
    // Buttons preserve a text selection, including the insertion point.
    const keepSelection = event => event.preventDefault();
    zoomIn.addEventListener('mousedown', keepSelection); zoomOut.addEventListener('mousedown', keepSelection);
    select.addEventListener('change', change); zoomIn.addEventListener('click', closer); zoomOut.addEventListener('click', farther);
    const observer = new MutationObserver(schedule); observer.observe(editor, { subtree:true, childList:true, characterData:true, attributes:true });
    const resize = new ResizeObserver(schedule); resize.observe(viewport);
    editor.addEventListener('input', follow); editor.addEventListener('keyup', follow);
    editor.addEventListener('load', schedule, true); window.addEventListener('resize', schedule);
    document.fonts.addEventListener('loadingdone', schedule); document.fonts.ready.then(schedule);
    setGeometry(columns); measure();
    return { get pageCount() { return pageCount; }, get geometry() { return geometry; }, measure, schedule, zoom, pageAtRect,
      destroy() { destroyed = true; cancelAnimationFrame(frame); observer.disconnect(); resize.disconnect(); editor.removeEventListener('input',follow); editor.removeEventListener('keyup',follow); editor.removeEventListener('load',schedule,true); window.removeEventListener('resize',schedule); document.fonts.removeEventListener('loadingdone',schedule); select.removeEventListener('change',change); zoomIn.removeEventListener('click',closer); zoomOut.removeEventListener('click',farther); zoomIn.removeEventListener('mousedown',keepSelection); zoomOut.removeEventListener('mousedown',keepSelection); }
    };
  }
  window.MindSetBookEditor = { supported, mount };
})();
