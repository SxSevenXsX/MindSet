'use strict';
const { BrowserWindow } = require('electron');
let running = false;
async function renderBookPdf(html) {
  if (running) throw new Error('Un PDF est déjà en cours de préparation.');
  if (typeof html !== 'string' || Buffer.byteLength(html, 'utf8') > 32 * 1024 * 1024) throw new Error('Document PDF invalide ou trop volumineux (32 Mo maximum).');
  running = true;
  let window, timer;
  try {
    window = new BrowserWindow({ show:false, webPreferences:{ sandbox:true, contextIsolation:true, nodeIntegration:false, javascript:false, partition:'mindset-book-print' } });
    window.webContents.setWindowOpenHandler(() => ({ action:'deny' }));
    window.webContents.session.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
    window.webContents.session.webRequest.onBeforeRequest((details, callback) => callback({ cancel:!/^data:|^https?:/i.test(details.url) }));
    const operation = (async () => {
      await window.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
      const bytes = await window.webContents.printToPDF({ preferCSSPageSize:true, printBackground:true, displayHeaderFooter:false });
      return { base64:bytes.toString('base64'), pageCount:(bytes.toString('latin1').match(/\/Type\s*\/Page\b/g) || []).length };
    })();
    return await Promise.race([operation, new Promise((_resolve,reject) => { timer=setTimeout(() => reject(new Error('Le document met trop de temps à charger. Vérifie ses images et réessaie.')), 30000); })]);
  } finally { clearTimeout(timer); if (window && !window.isDestroyed()) window.destroy(); running=false; }
}
module.exports = { renderBookPdf };
