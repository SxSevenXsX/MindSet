/* Migration of legacy paper layouts. Never runs against the live editable DOM. */
(function () {
  function normalize(html) {
    const source = document.createElement("div");
    source.innerHTML = html || "<p><br></p>";
    const sheets = [...source.querySelectorAll(".page-sheet")];
    const independent = sheets.some((sheet) => sheet.getAttribute("contenteditable") === "true");
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
  window.MindSetDocument = { normalize };
})();
