/* A boundary delete is a no-op, including beforeinput from touch/assistive input. */
(function () {
  function atStart(editor, selection = window.getSelection()) {
    if (!selection?.isCollapsed || !selection.rangeCount || !editor.contains(selection.anchorNode)) return false;
    if (selection.anchorNode.nodeType === Node.ELEMENT_NODE && selection.anchorOffset > 0) return false;
    if (selection.anchorNode.nodeType === Node.TEXT_NODE && selection.anchorNode.textContent.slice(0, selection.anchorOffset).replace(/[\u200b\ufeff]/g, '').length) return false;
    let node = selection.anchorNode;
    while (node && node !== editor) {
      // Empty elements before the caret still constitute intentional structure.
      if (node.previousSibling) return false;
      node = node.parentNode;
    }
    return true;
  }
  function blockBoundaryDelete(event, editor) {
    const backward = event.type === 'keydown' ? event.key === 'Backspace' : ['deleteContentBackward', 'deleteWordBackward', 'deleteSoftLineBackward', 'deleteHardLineBackward'].includes(event.inputType);
    if (!backward || event.isComposing || event.keyCode === 229 || !atStart(editor)) return false;
    event.preventDefault();
    return true;
  }
  window.MindSetEditorBoundary = { atStart, blockBoundaryDelete };
})();
