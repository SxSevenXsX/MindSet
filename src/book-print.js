(function () {
  function documentHtml({ title, content, setup, variables, fonts = '', header = '', pageNumbers = true }) {
    const g = MindSetBookLayout.geometry(setup, 1), margins = g.setup.margins;
    // Use the actual editor's styles, including custom lists and preset classes.
    const styles = [...document.styleSheets].flatMap(sheet => {
      try { return [...sheet.cssRules].filter(rule => rule.selectorText?.includes('.note-editor') || rule.selectorText === ':root' || rule.selectorText === '*').map(rule => rule.cssText); }
      catch { return []; }
    }).join('\n');
    return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${title}</title><style>
      ${styles}\n${fonts}
      :root { ${variables}; --book-content-height:${g.contentHeight}px; color-scheme:light; }
      * { box-sizing:border-box; }
      html,body { margin:0; padding:0; display:block; min-width:0; min-height:0; height:auto; background:white; color:#17201c; overflow:visible; }
      .note-editor.book-text { position:static; width:auto; height:auto; min-height:0; margin:0; padding:0; columns:auto; column-height:auto; column-wrap:nowrap; }
      .note-editor.book-text .note-page-break { break-before:page; page-break-before:always; }
      .note-editor.book-text > p:only-child:has(> br:only-child)::before { display:none; }
      .print-note-header { margin:0 0 1em; }
      .print-note-header h1 { margin:0 0 .5em; }
      .print-note-meta { font:12px 'Segoe UI',sans-serif; color:#657169; }
      @page { size:${g.widthCm}cm ${g.heightCm}cm; margin:${margins.top}cm ${margins.right}cm ${margins.bottom}cm ${margins.left}cm;
        ${pageNumbers ? '@bottom-center { content:counter(page); font:12px "Segoe UI",sans-serif; color:#657169; }' : ''}
      }
      @media screen { body { width:${g.widthCm}cm; margin:20px auto; padding:${margins.top}cm ${margins.right}cm ${margins.bottom}cm ${margins.left}cm; box-shadow:0 2px 18px #0002; } }
      @media print { html,body { width:auto !important; margin:0 !important; padding:0 !important; } * { -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
      </style></head><body><main class="note-editor book-text">${header}${content}</main></body></html>`;
  }
  window.MindSetBookPrint = { documentHtml };
})();
