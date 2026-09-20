function acquireSingleInstance(app, getWindow) {
  if (!app.requestSingleInstanceLock()) {
    app.quit();
    return false;
  }
  let pendingFocus = false;
  const focus = () => {
    const window = getWindow();
    if (!window || window.isDestroyed()) { pendingFocus = true; return; }
    pendingFocus = false;
    if (window.isMinimized()) window.restore();
    window.show();
    window.focus();
  };
  app.on('second-instance', focus);
  app.on('browser-window-created', (_event, window) => {
    window.once('ready-to-show', () => { if (pendingFocus) focus(); });
  });
  return true;
}
module.exports = { acquireSingleInstance };
