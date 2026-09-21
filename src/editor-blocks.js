/* Small, DOM-only writing tools. The host owns persistence and undo history. */
(function () {
  const fold = (text) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const commands = [
    { id: "p", label: "Texte", detail: "Un paragraphe simple", glyph: "T", keywords: "normal paragraph" },
    { id: "h1", label: "Titre 1", detail: "Grand titre de section", glyph: "H1", keywords: "heading grand" },
    { id: "h2", label: "Titre 2", detail: "Sous-titre", glyph: "H2", keywords: "heading" },
    { id: "h3", label: "Titre 3", detail: "Petite section", glyph: "H3", keywords: "heading" },
    { id: "bullet", label: "Liste à puces", detail: "Une idée par ligne", glyph: "•", keywords: "list" },
    { id: "number", label: "Liste numérotée", detail: "Des étapes dans l’ordre", glyph: "1.", keywords: "list ordered" },
    { id: "check", label: "À faire", detail: "Des cases à cocher", glyph: "☑", keywords: "todo tache checklist" },
    { id: "blockquote", label: "Citation", detail: "Mettre un passage en évidence", glyph: "❝", keywords: "quote" },
    { id: "callout", label: "Encadré", detail: "Une remarque ou une annotation", glyph: "!", keywords: "note annotation info callout" },
    { id: "pre", label: "Code", detail: "Texte à chasse fixe", glyph: "</>", keywords: "code" },
    { id: "divider", label: "Séparateur", detail: "Une ligne entre deux sections", glyph: "—", keywords: "ligne divider" },
    { id: "pagebreak", label: "Saut de page", detail: "Commencer une nouvelle page à l’impression", glyph: "↳", keywords: "page break" },
  ];

  function mount(editor, host) {
    const abort = new AbortController();
    const listen = (node, event, handler, options = {}) => node.addEventListener(event, handler, { ...options, signal: abort.signal });
    const menu = document.createElement("div");
    menu.className = "block-command-menu";
    menu.id = "block-command-menu";
    menu.setAttribute("role", "listbox");
    menu.setAttribute("aria-label", "Insérer un bloc");
    menu.hidden = true;
    const floating = document.createElement("div");
    floating.className = "selection-toolbar";
    floating.setAttribute("role", "toolbar");
    floating.setAttribute("aria-label", "Mise en forme de la sélection");
    floating.hidden = true;
    for (const [command, label, text] of [["bold", "Gras", "B"], ["italic", "Italique", "I"], ["underline", "Souligné", "U"], ["strikeThrough", "Barré", "S"], ["hiliteColor", "Surligner", "✎"]]) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = text;
      button.title = label;
      button.setAttribute("aria-label", label);
      button.dataset.command = command;
      floating.append(button);
    }
    document.body.append(menu, floating);
    let context = null;
    let matches = [];
    let index = 0;
    let dismissed = null;
    let selectionRange = null;
    let composing = false;

    function blockAtCaret() {
      const selection = window.getSelection();
      let node = selection?.anchorNode;
      if (!node || !editor.contains(node)) return null;
      if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;
      const block = node.closest("p, h1, h2, h3, h4, h5, h6, li, blockquote, pre, div");
      return block && editor.contains(block) ? block : editor;
    }

    function close() {
      menu.hidden = true;
      context = null;
      editor.removeAttribute("aria-controls");
      editor.removeAttribute("aria-activedescendant");
    }

    function position(element, rect) {
      element.style.left = `${Math.max(8, Math.min(rect.left, innerWidth - element.offsetWidth - 12))}px`;
      const below = rect.bottom + 8;
      element.style.top = `${Math.max(8, below + element.offsetHeight < innerHeight - 8 ? below : rect.top - element.offsetHeight - 8)}px`;
    }

    function slashContext() {
      const selection = window.getSelection();
      if (!selection?.rangeCount || !selection.isCollapsed || composing) return null;
      const block = blockAtCaret();
      if (!block || block.closest("pre, code") || block.querySelector("img, hr")) return null;
      const range = selection.getRangeAt(0).cloneRange();
      range.setStart(block, 0);
      const text = range.toString();
      // Start of a block only: typing URLs or fractions never opens the menu.
      if (!/^\/[^/\n]{0,40}$/.test(text)) return null;
      return { block, range, query: text.slice(1) };
    }

    function update() {
      if (!editor.isConnected) return;
      const next = slashContext();
      if (!next) { dismissed = null; close(); return; }
      if (dismissed === next.block) return;
      if (context?.query !== next.query) index = 0;
      context = next;
      matches = commands.filter((item) => fold(`${item.label} ${item.keywords}`).includes(fold(next.query)));
      index = Math.min(index, Math.max(0, matches.length - 1));
      menu.replaceChildren();
      const heading = document.createElement("div");
      heading.className = "block-command-label";
      heading.textContent = "INSÉRER UN BLOC";
      menu.append(heading);
      matches.forEach((item, itemIndex) => {
        const button = document.createElement("button");
        button.type = "button";
        button.id = `block-option-${item.id}`;
        button.dataset.blockCommand = item.id;
        button.setAttribute("role", "option");
        button.setAttribute("aria-selected", String(index === itemIndex));
        const glyph = document.createElement("span");
        glyph.className = "block-command-glyph";
        glyph.textContent = item.glyph;
        const copy = document.createElement("span");
        const name = document.createElement("strong");
        name.textContent = item.label;
        const detail = document.createElement("small");
        detail.textContent = item.detail;
        copy.append(name, detail);
        button.append(glyph, copy);
        menu.append(button);
      });
      const footer = document.createElement("div");
      footer.className = "block-command-footer";
      footer.textContent = matches.length ? "↑ ↓ choisir · Entrée insérer · Échap fermer" : "Aucun bloc trouvé · Échap pour continuer à écrire";
      menu.append(footer);
      menu.hidden = false;
      floating.hidden = true;
      editor.setAttribute("aria-controls", menu.id);
      if (matches[index]) editor.setAttribute("aria-activedescendant", `block-option-${matches[index].id}`);
      else editor.removeAttribute("aria-activedescendant");
      const rect = window.getSelection().getRangeAt(0).getBoundingClientRect();
      position(menu, rect.height ? rect : next.block.getBoundingClientRect());
      menu.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "nearest" });
    }

    function replaceBlock(block, ...nodes) {
      if (block.tagName !== "LI") { block.replaceWith(...nodes); return; }
      const list = block.parentElement;
      const before = list.cloneNode(false);
      const after = list.cloneNode(false);
      let passed = false;
      for (const item of [...list.children]) {
        if (item === block) { passed = true; continue; }
        (passed ? after : before).append(item);
      }
      list.replaceWith(...(before.children.length ? [before] : []), ...nodes, ...(after.children.length ? [after] : []));
    }

    function apply(id, source = context) {
      if (!source || !editor.contains(source.block)) return;
      host.remember();
      source.range.deleteContents();
      const selection = window.getSelection();
      selection.removeAllRanges();
      source.range.collapse(true);
      selection.addRange(source.range);
      close();
      let block = source.block;
      if (block === editor) {
        document.execCommand("formatBlock", false, "p");
        block = blockAtCaret();
      }
      if (!block || block === editor) return;
      if (block.dataset.collapsed === "true") host.expand(block);
      const list = ["bullet", "number", "check"].includes(id);
      const tag = list ? (id === "number" ? "ol" : "ul") : id === "callout" ? "blockquote" : ["divider", "pagebreak"].includes(id) ? "hr" : id;
      const replacement = document.createElement(tag);
      if (id === "check") replacement.className = "check-list";
      if (id === "callout") replacement.className = "note-callout";
      if (id === "pagebreak") {
        replacement.className = "note-page-break";
        replacement.setAttribute("contenteditable", "false");
        replacement.setAttribute("aria-label", "Saut de page à l’impression");
      }
      let caret = replacement;
      if (tag === "hr") {
        caret = document.createElement("p");
        while (block.firstChild) caret.append(block.firstChild);
        if (!caret.textContent && !caret.querySelector("br, img, hr")) caret.append(document.createElement("br"));
        replaceBlock(block, replacement, caret);
      } else {
        if (list) { caret = document.createElement("li"); replacement.append(caret); }
        while (block.firstChild) caret.append(block.firstChild);
        if (!caret.textContent && !caret.querySelector("br, img, hr")) caret.append(document.createElement("br"));
        replaceBlock(block, replacement);
      }
      host.caret(caret);
      host.changed();
    }

    function insertPageBreak() {
      const selection = window.getSelection();
      if (!selection?.rangeCount || !editor.contains(selection.anchorNode)) return;
      host.remember();
      document.execCommand("insertHTML", false, '<hr class="note-page-break" contenteditable="false" aria-label="Saut de page à l’impression"><p><br></p>');
      host.changed();
    }

    listen(editor, "keydown", (event) => {
      if (event.isComposing || composing || event.keyCode === 229) return;
      if (!menu.hidden && ["ArrowDown", "ArrowUp", "Enter", "Escape", "Tab"].includes(event.key)) {
        if (event.key === "Tab") { close(); return; }
        event.preventDefault();
        event.stopImmediatePropagation();
        if (event.key === "Escape") { dismissed = context?.block; close(); }
        else if (event.key === "Enter") { if (matches[index]) apply(matches[index].id); }
        else if (matches.length) { index = (index + (event.key === "ArrowDown" ? 1 : -1) + matches.length) % matches.length; update(); }
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault(); event.stopImmediatePropagation(); insertPageBreak(); return;
      }
      if (event.key === " " && !event.ctrlKey && !event.metaKey && !event.altKey) {
        const selection = window.getSelection();
        const block = blockAtCaret();
        if (!selection?.isCollapsed || !block || block.closest("pre, code")) return;
        const range = selection.getRangeAt(0).cloneRange();
        range.setStart(block, 0);
        const typed = range.toString();
        const id = /^#{1,6}$/.test(typed) ? `h${typed.length}` : typed === ">" ? "blockquote" : typed === "---" ? "divider" : typed === "```" ? "pre" : null;
        if (id) {
          event.preventDefault(); event.stopImmediatePropagation();
          apply(id, { block, range });
        }
      }
    });
    listen(menu, "mousedown", (event) => event.preventDefault());
    listen(menu, "click", (event) => {
      const button = event.target.closest("[data-block-command]");
      if (button) apply(button.dataset.blockCommand);
    });
    listen(editor, "input", update);
    listen(editor, "keyup", (event) => { if (!["Escape", "ArrowUp", "ArrowDown"].includes(event.key)) update(); });
    listen(editor, "compositionstart", () => { composing = true; close(); });
    listen(editor, "compositionend", () => { composing = false; update(); });
    function updateSelectionToolbar() {
      const selection = window.getSelection();
      const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
      const inside = range && editor.contains(range.startContainer) && editor.contains(range.endContainer);
      if (inside && !range.collapsed && selection.toString().trim() && document.activeElement === editor && !composing) {
        selectionRange = range.cloneRange();
        close();
        floating.hidden = false;
        for (const button of floating.children) button.setAttribute("aria-pressed", String(document.queryCommandState(button.dataset.command)));
        position(floating, range.getBoundingClientRect());
      } else floating.hidden = true;
      if (!inside) close();
    }
    listen(document, "selectionchange", updateSelectionToolbar);
    listen(floating, "mousedown", (event) => event.preventDefault());
    listen(floating, "click", (event) => {
      const button = event.target.closest("[data-command]");
      if (!button || !selectionRange || !editor.contains(selectionRange.commonAncestorContainer)) return;
      const selection = window.getSelection();
      selection.removeAllRanges(); selection.addRange(selectionRange);
      host.remember();
      document.execCommand(button.dataset.command, false, button.dataset.command === "hiliteColor" ? host.highlight() : null);
      host.changed();
    });
    listen(document, "pointerdown", (event) => {
      if (!menu.contains(event.target) && !editor.contains(event.target)) close();
    });
    let frame = 0;
    function followSelection(event) {
      if (event?.type === "keyup" && event.key === "Backspace" && window.MindSetEditorBoundary?.atStart(editor)) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (!editor.isConnected || document.activeElement !== editor) return;
        const selection = window.getSelection();
        if (!selection?.rangeCount || !editor.contains(selection.anchorNode)) return;
        const range = selection.getRangeAt(0);
        let rect = range.getBoundingClientRect();
        if (!rect.height) rect = blockAtCaret()?.getBoundingClientRect();
        const scroller = editor.closest("[data-book-viewport], [data-page-viewport], .content-area");
        if (rect && scroller) {
          const bounds = scroller.getBoundingClientRect();
          const toolbar = scroller.querySelector(".editor-toolbar")?.getBoundingClientRect();
          const top = Math.max(bounds.top, toolbar?.bottom || 0) + 12;
          const bottom = Math.min(bounds.bottom, innerHeight) - 20;
          if (rect.top < top) scroller.scrollTop -= top - rect.top;
          else if (rect.bottom > bottom) scroller.scrollTop += rect.bottom - bottom;
        }
        updateSelectionToolbar();
      });
    }
    listen(editor, "input", followSelection);
    listen(editor, "keyup", followSelection);
    listen(document, "scroll", (event) => {
      if (menu.contains(event.target)) return;
      updateSelectionToolbar();
      if (!menu.hidden && context) {
        const range = window.getSelection()?.rangeCount ? window.getSelection().getRangeAt(0) : null;
        if (range && editor.contains(range.startContainer)) position(menu, range.getBoundingClientRect());
        else close();
      }
    }, { capture: true });
    listen(window, "resize", () => { close(); floating.hidden = true; });
    return { insertPageBreak, destroy() { cancelAnimationFrame(frame); abort.abort(); menu.remove(); floating.remove(); } };
  }
  window.MindSetBlocks = { mount };
})();
