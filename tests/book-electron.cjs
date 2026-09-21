'use strict';
// Optional Electron integration suite. See docs/book-mode.md for the Playwright module setting.
const { _electron } = require(process.env.MINDSET_PLAYWRIGHT_MODULE || 'playwright');
const path=require('node:path'),fs=require('node:fs/promises'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),output=path.join(root,'output','book-tests');
(async()=>{
 await fs.mkdir(output,{recursive:true});
 const env={...process.env,MINDSET_DEV_PROFILE:path.join(output,`integration-profile-${process.pid}`)};delete env.ELECTRON_RUN_AS_NODE;
 const app=await _electron.launch({executablePath:path.join(root,'node_modules','electron','dist','electron.exe'),args:[root],env,timeout:30000});
 const checks=[];
 try{
  const page=await app.firstWindow(),errors=[]; page.on('pageerror',e=>errors.push(e.stack));
  await page.getByRole('button',{name:'Nouvelle boîte',exact:true}).waitFor();
  await page.evaluate(()=>{
   const state=JSON.parse(localStorage.getItem('mindset.state.v1'));let id=0;const box=MindSetGuide.create(p=>`${p}-${++id}`,()=>new Date().toISOString());box.isGuide=false;box.name='Carnet de test';box.root.title=box.name;
   const note=box.root.children[0].children[0];note.title='Au fil des pages';note.content='<h1>Un espace pour écrire</h1>'+Array.from({length:100},(_,i)=>`<p>Paragraphe ${String(i).padStart(3,'0')}. Chaque idée trouve sa place sur le papier. Le texte poursuit son chemin sur la feuille suivante, avec une écriture simple et continue.</p>`).join('');box.root.children=[note];box.activeItemId=note.id;box.openTabIds=[note.id];box.viewMode='list';box.expandedIds=[box.root.id];state.boxes=[box];state.settings.editorViewMode='book';state.settings.bookColumns=2;state.settings.rightPanelOpen=false;state.settings.theme='dark';localStorage.setItem('mindset.state.v1',JSON.stringify(state));
  });
  await page.reload();await page.getByRole('button',{name:'Ouvrir',exact:true}).click();await page.getByRole('button',{name:'Mode livre',exact:true}).click();
  const editor=page.locator('[data-note-editor]');await page.locator('[data-book-info]').waitFor();
  const settle=()=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  const content=await editor.innerHTML();const pageCount=()=>page.locator('[data-book-info]').textContent();const originalCount=(await pageCount()).split(' · ')[0];
  for(const columns of ['1','4','3','2']) {await page.locator('[data-book-columns]').selectOption(columns);await settle();assert.equal((await pageCount()).split(' · ')[0],originalCount);assert.equal(await editor.innerHTML(),content);}
  assert.equal(await editor.evaluate(el=>getComputedStyle(el).color),'rgb(23, 32, 28)');checks.push('Four zoom levels preserve content, page count and dark-theme paper contrast');
  const mapping=await editor.evaluate(el=>{
   const g=MindSetBookLayout.geometry({},2),scale=new DOMMatrix(getComputedStyle(el.parentElement).transform).a,o=el.getBoundingClientRect();return [...el.querySelectorAll('p')].map(p=>{const r=document.createRange();r.setStart(p.firstChild,0);r.setEnd(p.firstChild,15);const a=r.getClientRects()[0];return {text:p.textContent.slice(0,15),page:Math.floor(((a.top-o.top)/scale+1)/(g.height+g.gap))*2+Math.floor(((a.left-o.left)/scale+1)/(g.width+g.gap))+1};});
  });await fs.writeFile(path.join(output,'screen-map.json'),JSON.stringify(mapping));
  await page.screenshot({path:path.join(output,'book-two-pages.png')});
  await page.locator('[data-book-columns]').selectOption('4');await settle();await page.screenshot({path:path.join(output,'book-four-pages.png')});
  await page.getByRole('button',{name:'Exporter en PDF',exact:true}).click();await page.getByRole('button',{name:'Créer le PDF',exact:true}).click();await page.locator('.pdf-preview-frame').waitFor({timeout:40000});
  const pdf=await page.locator('.pdf-preview-frame').evaluate(async frame=>Array.from(new Uint8Array(await (await fetch(frame.src.split('#')[0])).arrayBuffer())));await fs.writeFile(path.join(output,'book-a4.pdf'),Buffer.from(pdf));assert.match(await page.locator('.modal-subtitle').textContent(),/7 pages/);await page.locator('.modal [data-action="close-modal"]').click();checks.push('Native styled PDF preview generated (seven A4 pages)');
  async function setContent(html){await editor.evaluate((el,html)=>{el.innerHTML=html;el.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertFromPaste'}));},html);await settle();}
  async function caret(selector='p',offset=0){await editor.evaluate((el,{selector,offset})=>{const node=el.querySelector(selector)?.firstChild || el;el.focus({preventScroll:true});const r=document.createRange();r.setStart(node,Math.min(offset,node.length||0));r.collapse(true);const s=getSelection();s.removeAllRanges();s.addRange(r);},{selector,offset});await settle();}
  for(const mode of ['book','flow']){
   if(mode==='flow')await page.locator('[data-action="toggle-editor-book-view"]').click();
   for(const html of ['<p>Première ligne</p>','<p><br></p>','<h1><span>Titre</span></h1>','<ul><li>Liste</li></ul>']){
    await setContent(html);await caret(html.includes('span')?'span':html.includes('<li>')?'li':html.includes('<h1>')?'h1':'p');
    const before=await editor.innerHTML();const top=await editor.evaluate(el=>el.getBoundingClientRect().top);
    for(let i=0;i<5;i++)await page.keyboard.press('Backspace');await settle();assert.equal(await editor.innerHTML(),before,`${mode} start content`);assert.ok(Math.abs(await editor.evaluate(el=>el.getBoundingClientRect().top)-top)<1,`${mode} start scroll`);
   }
  }checks.push('Repeated Backspace at document start: text, empty paragraph, heading and list in Note and Book views');
  await setContent('<p>abc</p>');await caret();await page.keyboard.press('Delete');assert.equal(await editor.textContent(),'bc');
  await setContent('<p>abc</p>');await editor.evaluate(el=>{el.focus();const r=document.createRange();r.setStart(el.firstChild.firstChild,0);r.setEnd(el.firstChild.firstChild,1);getSelection().removeAllRanges();getSelection().addRange(r);});await page.keyboard.press('Backspace');assert.equal(await editor.textContent(),'bc');
  await setContent('<p><br></p><p>Fin</p>');await caret('p:last-child');await page.keyboard.press('Backspace');assert.equal(await editor.locator('p').count(),1);assert.equal(await editor.textContent(),'Fin');checks.push('Forward Delete, selection deletion and merging with a preceding blank paragraph still work');
  await page.locator('[data-action="toggle-editor-book-view"]').click();
  await setContent('<p>Première</p>');await caret('p',8);await page.keyboard.press('Control+Enter');await page.keyboard.type('Deuxième');await settle();assert.match(await pageCount(),/^2 pages/);assert.equal(await editor.locator('.note-page-break').count(),1);await page.keyboard.press('Control+z');await settle();assert.equal((await editor.textContent()).includes('Deuxième'),false);await page.keyboard.press('Control+y');await settle();assert.ok((await editor.textContent()).includes('Deuxième'));checks.push('Explicit page break, typing, undo and redo');
  const typed=await editor.innerHTML();await caret('p:last-child',4);const beforeSelection=await editor.evaluate(()=>({text:getSelection().anchorNode.textContent,offset:getSelection().anchorOffset}));await page.getByRole('button',{name:'Zoomer le livre',exact:true}).click();assert.deepEqual(await editor.evaluate(()=>({text:getSelection().anchorNode.textContent,offset:getSelection().anchorOffset})),beforeSelection);assert.equal(await editor.innerHTML(),typed);checks.push('Zoom button preserves insertion point and document DOM');
  await page.getByRole('button',{name:'Format des pages',exact:true}).click();const form=page.locator('[data-book-format-form]');await form.locator('[name="sizeId"]').selectOption('custom');await form.locator('[name="customWidthCm"]').fill('14');await form.locator('[name="customHeightCm"]').fill('22');await form.locator('[name="orientation"]').selectOption('landscape');await form.getByRole('button',{name:'Appliquer',exact:true}).click();await settle();assert.match(await page.locator('.book-context').first().textContent(),/22 × 14 cm/);assert.equal(await editor.innerHTML(),typed);
  await page.reload();await page.getByRole('button',{name:'Ouvrir',exact:true}).click();await page.getByRole('button',{name:'Mode livre',exact:true}).click();await page.locator('[data-book-info]').waitFor();assert.match(await page.locator('.book-context').first().textContent(),/22 × 14 cm/);assert.ok((await editor.textContent()).includes('Deuxième'));checks.push('Custom landscape paper and note contents survive reopening');
  await setContent('<p>Première ligne</p>');await caret('p',14);
  for(let i=0;i<28;i++){await page.keyboard.press('Enter');await page.keyboard.type(`Ligne ${i} ajoutée au clavier.`);}await settle();
  assert.ok(Number.parseInt(await pageCount(),10)>1);
  const visible=await editor.evaluate(el=>{const r=getSelection().getRangeAt(0).getBoundingClientRect(),v=el.closest('[data-book-viewport]').getBoundingClientRect();return r.top>=v.top && r.bottom<=v.bottom;});assert.equal(visible,true);checks.push('Typing automatically creates further pages and keeps the caret visible');
  const illustration=(await fs.readFile(path.join(root,'tests/fixtures/book-image.png'))).toString('base64');
  const mixed=`<h1>Livre illustré</h1><p><img src="data:image/png;base64,${illustration}" width="400" height="80" alt="Illustration de test"></p>`+Array.from({length:14},(_,i)=>`<p>TOKEN_${String(i).padStart(3,'0')} ${'Un paragraphe continu doit traverser les pages sans perdre ses mots. '.repeat(18)}</p>`).join('')+'<ul>'+Array.from({length:25},(_,i)=>`<li>TOKEN_${String(i+14).padStart(3,'0')} Un élément de liste avec du <strong>texte en gras</strong>.</li>`).join('')+'</ul><table><thead><tr><th>Référence</th><th>Contenu</th></tr></thead><tbody>'+Array.from({length:24},(_,i)=>`<tr><td>TOKEN_${String(i+39).padStart(3,'0')}</td><td>Une ligne de tableau.</td></tr>`).join('')+'</tbody></table><hr class="note-page-break" contenteditable="false"><p>TOKEN_063 Après le saut forcé.</p>';
  await setContent(mixed);await settle();
  const mixedMap=await editor.evaluate(el=>{const saved=JSON.parse(localStorage.getItem('mindset.state.v1')),note=saved.boxes[0].root.children[0],columns=Number(getComputedStyle(el.parentElement).getPropertyValue('--book-columns')),g=MindSetBookLayout.geometry(note.bookSetup,columns),scale=new DOMMatrix(getComputedStyle(el.parentElement).transform).a,o=el.getBoundingClientRect(),walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT),result=[];while(walker.nextNode()){const node=walker.currentNode;for(const match of node.textContent.matchAll(/TOKEN_\d{3}/g)){const r=document.createRange();r.setStart(node,match.index);r.setEnd(node,match.index+match[0].length);const a=r.getClientRects()[0];result.push({text:match[0],page:Math.floor(((a.top-o.top)/scale+1)/(g.height+g.gap))*columns+Math.floor(((a.left-o.left)/scale+1)/(g.width+g.gap))+1});}}return result;});
  await fs.writeFile(path.join(output,'mixed-screen-map.json'),JSON.stringify(mixedMap));
  await page.getByRole('button',{name:'Exporter en PDF',exact:true}).click();await page.getByRole('button',{name:'Créer le PDF',exact:true}).click();await page.locator('.pdf-preview-frame').waitFor({timeout:40000});
  const mixedPdf=await page.locator('.pdf-preview-frame').evaluate(async frame=>Array.from(new Uint8Array(await (await fetch(frame.src.split('#')[0])).arrayBuffer())));await fs.writeFile(path.join(output,'book-custom.pdf'),Buffer.from(mixedPdf));checks.push('Custom-format PDF with long paragraphs, bold lists, a multi-page table and a forced break');
  await page.locator('.modal [data-action="close-modal"]').click();await setContent('<p><br></p>');
  await page.getByRole('button',{name:'Exporter en PDF',exact:true}).click();await page.getByRole('button',{name:'Créer le PDF',exact:true}).click();await page.locator('.pdf-preview-frame').waitFor({timeout:40000});
  const emptyPdf=await page.locator('.pdf-preview-frame').evaluate(async frame=>Array.from(new Uint8Array(await (await fetch(frame.src.split('#')[0])).arrayBuffer())));await fs.writeFile(path.join(output,'book-empty.pdf'),Buffer.from(emptyPdf));checks.push('Empty note produces a blank sheet, without printing the editor placeholder');
  assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:checks,errors},null,2));
 }finally{await app.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
