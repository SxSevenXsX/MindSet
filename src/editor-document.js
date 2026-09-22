/* Migration of legacy paper layouts. Never runs against the live editable DOM. */
(function () {
  function normalize(html) {
    const source = document.createElement("div");
    source.innerHTML = html || "<p><br></p>";
    const sheets = [...source.querySelectorAll(".page-sheet")];
    // Saved independent sheets had their contenteditable attribute stripped.
    // Keep their boundaries; continuation markers identify the old automatic splits.
    const independent = sheets.length > 0 && (sheets.some((sheet) => sheet.getAttribute("contenteditable") === "true")
      || !sheets.some((sheet) => sheet.querySelector("[data-split-continuation]")));
    for (const [index, sheet] of sheets.entries()) {
      [...sheet.children].slice(1).forEach((block) => {
        block.removeAttribute("data-split-continuation");
        block.classList.remove("is-split-continuation");
        block.querySelectorAll("[data-split-continuation]").forEach(clearContinuation);
      });
      if (independent && index) {
        const separator = document.createElement("hr");
        separator.className = "note-page-break";
        separator.setAttribute("contenteditable", "false");
        sheet.before(separator);
      }
      if (!sheet.hasChildNodes()) sheet.innerHTML = "<p><br></p>";
      sheet.replaceWith(...sheet.childNodes);
    }
    if (!independent) {
      for (const block of [...source.children]) {
        const previous = block.previousElementSibling;
        if (block.dataset.splitContinuation !== "true" || !previous || previous.tagName !== block.tagName) continue;
        if (["UL", "OL"].includes(block.tagName)) {
          if (previous.className !== block.className) continue;
          const first = block.firstElementChild;
          if (first?.dataset.splitContinuation === "true" && previous.lastElementChild) {
            previous.lastElementChild.append(...first.childNodes);
            first.remove();
          }
        }
        previous.append(...block.childNodes);
        block.remove();
      }
    }
    source.querySelectorAll("[data-split-continuation], .is-split-continuation").forEach(clearContinuation);
    source.querySelectorAll("[data-editor-selection-marker], [data-pagination-probe]").forEach((node) => node.remove());
    return source.innerHTML || "<p><br></p>";
  }
  function clearContinuation(block) {
    block.removeAttribute("data-split-continuation");
    block.classList.remove("is-split-continuation");
    if (!block.className) block.removeAttribute("class");
  }
  // Restore snapshots in place. Unchanged paragraphs, text and images keep their
  // live nodes, avoiding full-document repaints and image reloads on Undo/Redo.
  function restore(editor, html) {
    const target = document.createElement("div");
    target.innerHTML = normalize(html);
    function patchNode(live, wanted) {
      if (live.isEqualNode(wanted)) return;
      if (live.nodeType !== wanted.nodeType || live.nodeName !== wanted.nodeName || live.namespaceURI !== wanted.namespaceURI) {
        live.replaceWith(wanted.cloneNode(true)); return;
      }
      if (live.nodeType === Node.TEXT_NODE || live.nodeType === Node.COMMENT_NODE) {
        const before = live.data, after = wanted.data;
        let start = 0, end = 0;
        while (start < Math.min(before.length, after.length) && before[start] === after[start]) start++;
        while (end < Math.min(before.length, after.length) - start && before[before.length - 1 - end] === after[after.length - 1 - end]) end++;
        live.replaceData(start, before.length - start - end, after.slice(start, after.length - end));
        return;
      }
      for (const attribute of [...live.attributes]) if (!wanted.hasAttribute(attribute.name)) live.removeAttribute(attribute.name);
      for (const attribute of wanted.attributes) if (live.getAttribute(attribute.name) !== attribute.value) live.setAttribute(attribute.name, attribute.value);
      patchChildren(live, wanted);
    }
    function patchChildren(live, wanted) {
      const before = [...live.childNodes], after = [...wanted.childNodes];
      let first = 0, tail = 0;
      while (first < Math.min(before.length, after.length) && before[first].isEqualNode(after[first])) first++;
      while (tail < Math.min(before.length, after.length) - first && before[before.length - 1 - tail].isEqualNode(after[after.length - 1 - tail])) tail++;
      const oldCount = before.length - first - tail, newCount = after.length - first - tail;
      const shared = Math.min(oldCount, newCount);
      for (let i = 0; i < shared; i++) patchNode(before[first + i], after[first + i]);
      for (let i = shared; i < oldCount; i++) before[first + i].remove();
      const anchor = tail ? before[before.length - tail] : null;
      for (let i = shared; i < newCount; i++) live.insertBefore(after[first + i].cloneNode(true), anchor);
    }
    patchChildren(editor, target);
  }
  window.MindSetDocument = { normalize, restore };
})();
