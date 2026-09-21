'use strict';
// Real renderer interactions in a disposable Electron profile; no personal notes used.
const {_electron}=require(process.env.MINDSET_PLAYWRIGHT_MODULE || 'playwright');
const path=require('node:path'),fs=require('node:fs/promises'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),out=path.join(root,'output','writing-tests');
(async()=>{
 await fs.mkdir(out,{recursive:true});
 const env={...process.env,MINDSET_DEV_PROFILE:path.join(out,`profile-${process.pid}`)};delete env.ELECTRON_RUN_AS_NODE;
 const app=await _electron.launch({executablePath:path.join(root,'node_modules/electron/dist/electron.exe'),args:[root],env,timeout:30000});
 const checks=[],errors=[];let page;
 try {
  page=await app.firstWindow();page.setDefaultTimeout(12000);page.on('pageerror',e=>errors.push(e.stack));
  await page.getByRole('button',{name:'Nouvelle boîte',exact:true}).waitFor();
  await page.evaluate(()=>{
   const state=JSON.parse(localStorage.getItem('mindset.state.v1'));let id=0;
   const box=MindSetGuide.create(p=>`${p}-${++id}`,()=>new Date().toISOString());box.isGuide=false;box.name='Atelier écriture';box.root.title=box.name;
   const note=box.root.children[0].children[0];note.title='Écrire simplement';note.content='<p>Première sélection et dernière ligne.</p>';
   const second={...note,id:'second',title:'Autre note'},folder={id:'folder',type:'folder',title:'Dossier',children:[]},audio={id:'audio',type:'audio',title:'Audio',clips:[]};
   folder.createdAt=folder.modifiedAt=audio.createdAt=audio.modifiedAt=note.createdAt;box.root.children=[note,second,folder,audio];box.activeItemId=note.id;box.openTabIds=[note.id,second.id];box.viewMode='list';box.expandedIds=[box.root.id];
   state.boxes=[box];state.settings.editorViewMode='book';state.settings.bookColumns=2;state.settings.rightPanelOpen=false;state.settings.theme='light';state.settings.recentTextColors=[];state.settings.recentHighlightColors=[];
   localStorage.setItem('mindset.state.v1',JSON.stringify(state));
  });
  await page.reload();await page.getByRole('button',{name:'Ouvrir',exact:true}).click();
  const editor=page.locator('[data-note-editor]');await editor.waitFor();
  const settle=()=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  await settle();
  assert.equal(await page.getByRole('button',{name:'Mode note',exact:true}).getAttribute('aria-pressed'),'true');assert.equal(await page.locator('[data-action="toggle-editor-view"]').count(),0);
  checks.push('Opening a document defaults to Note; the old sheets toggle is removed');
  const original=await editor.innerHTML(),font=await editor.evaluate(el=>getComputedStyle(el).fontSize);
  await editor.hover();await page.keyboard.down('Control');await page.mouse.wheel(0,-100);await page.keyboard.up('Control');await settle();
  assert.ok(Number(await editor.evaluate(el=>el.style.zoom))>1);assert.equal(await editor.innerHTML(),original);assert.equal(await editor.evaluate(el=>getComputedStyle(el).fontSize),font);
  await page.getByRole('button',{name:'Réinitialiser le zoom de la note',exact:true}).click();assert.equal(await editor.evaluate(el=>el.style.zoom),'1');
  await editor.dispatchEvent('wheel',{ctrlKey:true,deltaY:40,deltaMode:0,clientY:350});assert.ok(Number(await editor.evaluate(el=>el.style.zoom))<1);await page.getByRole('button',{name:'Réinitialiser le zoom de la note',exact:true}).click();
  checks.push('Ctrl+wheel / pinch-style wheel changes only visual zoom and reset restores 100%');
  async function content(html){await editor.evaluate((el,html)=>{el.innerHTML=html;el.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertFromPaste'}));},html);await settle();}
  async function selectText(selector='p',start=0,end=8){await editor.evaluate((el,{selector,start,end})=>{const walker=document.createTreeWalker(el.querySelector(selector),NodeFilter.SHOW_TEXT);walker.nextNode();const node=walker.currentNode;el.focus({preventScroll:true});const r=document.createRange();r.setStart(node,start);r.setEnd(node,end);getSelection().removeAllRanges();getSelection().addRange(r);el.dispatchEvent(new MouseEvent('mouseup',{bubbles:true}));},{selector,start,end});}
  async function customColor(kind,colors,commit='change'){
   const palette=page.locator(`[data-color-palette="${kind}"]`);
   if(!await palette.evaluate(el=>el.open))await palette.locator('summary').click();
   const input=page.locator(`[data-color-input="${kind}"]`);await input.focus();
   for(const color of colors)await input.evaluate((el,color)=>{el.value=color;el.dispatchEvent(new Event('input',{bubbles:true}));},color);
   assert.equal(await input.evaluate(el=>document.activeElement===el),true,'live picker retains focus');
   if(commit==='change')await input.dispatchEvent('change');
   else if(commit==='close')await palette.locator('summary').click();
   await settle();
  }
  const history=kind=>page.evaluate(kind=>JSON.parse(localStorage.getItem('mindset.state.v1')).settings[kind==='text'?'recentTextColors':'recentHighlightColors'],kind);
  await content('<p>abcdefgh suite</p>');await selectText();
  await customColor('text',['#123456','#234567']);
  assert.match(await editor.innerHTML(),/#234567|rgb\(35, 69, 103\)/);assert.equal(await editor.textContent(),'abcdefgh suite');assert.deepEqual(await history('text'),['#234567','','']);
  // Entire native-picker drag is one undo step.
  await page.locator('[data-color-palette="text"] summary').click();await editor.focus();await page.keyboard.press('Control+z');assert.equal(await editor.innerHTML(),'<p>abcdefgh suite</p>');await page.keyboard.press('Control+y');assert.match(await editor.innerHTML(),/#234567|rgb\(35, 69, 103\)/);
  for(const color of ['#345678','#456789','#56789a','#6789ab','#789abc']){await selectText('p',0,8);await customColor('text',[color],'close');}
  assert.deepEqual(await history('text'),['#56789a','#6789ab','#789abc']);
  checks.push('Live custom text color applies to selection; closing retains it; one undo per gesture; circular three-slot history');
  await selectText();await page.locator('[data-color-palette="text"] summary').click();
  const beforeHistory=await history('text');await page.locator('[data-color-swatch="text"][data-color-value="#d94b4b"]').click();assert.match(await editor.innerHTML(),/#d94b4b|rgb\(217, 75, 75\)/);assert.deepEqual(await history('text'),beforeHistory);
  await page.locator('[data-color-palette="text"] summary').click();
  await selectText();await customColor('highlight',['#abcdef','#fedcba'],'close');assert.match(await editor.innerHTML(),/background-color: (rgb\(254, 220, 186\)|#fedcba)/);assert.deepEqual(await history('highlight'),['#fedcba','','']);
  await selectText();await page.locator('[data-color-palette="highlight"] summary').click();await page.getByRole('button',{name:'Enlever le surlignage',exact:true}).click();assert.ok(!(await editor.innerHTML()).includes('254, 220, 186'));await page.locator('[data-color-palette="highlight"] summary').click();
  checks.push('One-click presets do not pollute custom history; highlighting and removal preserve text selection');
  // Changing only the middle of rich text must preserve surrounding styles and content.
  await content('<p>Début <strong>gras coloré</strong></p><p>Suite <em>italique</em> fin</p>');
  await editor.evaluate(el=>{el.focus({preventScroll:true});const r=document.createRange();r.setStart(el.querySelector('strong').firstChild,5);r.setEnd(el.querySelector('em').firstChild,4);getSelection().removeAllRanges();getSelection().addRange(r);el.dispatchEvent(new MouseEvent('mouseup',{bubbles:true}));});
  await customColor('text',['#789abc'],'close');
  assert.equal(await editor.textContent(),'Début gras coloréSuite italique fin');assert.equal(await editor.locator('strong').textContent(),'gras coloré');assert.equal(await editor.locator('em').textContent(),'italique');
  assert.equal(await editor.locator('strong span').textContent(),'coloré');assert.equal(await editor.locator('em span').textContent(),'ital');
  await editor.focus();await page.keyboard.press('Control+z');assert.equal(await editor.innerHTML(),'<p>Début <strong>gras coloré</strong></p><p>Suite <em>italique</em> fin</p>');
  checks.push('Live color across paragraphs preserves bold, italic and unselected text; undo restores exact content');
  await content('<p>Avant </p>');await selectText('p',6,6);await customColor('text',['#789abc'],'close');
  await page.keyboard.type('suite');assert.equal((await editor.textContent()).replace(/\u200b/g,''),'Avant suite');assert.ok((await editor.locator('span').textContent()).includes('suite'));
  assert.equal(await editor.locator('span').evaluate(el=>getComputedStyle(el).color),'rgb(120, 154, 188)');
  // Every marker family, with actual double-click coordinates (including native markers outside li).
  for(const type of ['bullet','circle','dash','arrow','triangle','square','check','ordered']){
   const list=type==='ordered'?'ol':'ul',cls=['bullet','ordered'].includes(type)?'':` class="${type}-list"`;
   await content(`<p>Avant</p><${list}${cls}><li>Texte intact</li></${list}>`);
   const hit=await editor.locator('li').evaluate((li,type)=>{const r=li.getClientRects()[0];return{x:r.left+(['bullet','circle','ordered'].includes(type)?-8:7),y:r.top+10};},type);
   await page.mouse.dblclick(hit.x,hit.y);await page.getByRole('dialog',{name:'Couleur du marqueur'}).waitFor();await page.getByRole('button',{name:'Rose',exact:true}).click();
   assert.equal(await editor.locator('li').getAttribute('data-marker-color'),'#ec4899',type);assert.equal(await editor.locator('li').textContent(),'Texte intact');assert.equal(await editor.locator('li').evaluate(el=>el.style.color),'');assert.equal(await editor.locator('li').getAttribute('data-checked'),null);
   await editor.locator('li').dblclick({position:{x:70,y:10}});assert.equal(await page.locator('[data-marker-palette]').count(),0);
  }
  checks.push('Double-click palettes for bullets, circles, numbers, dash, arrow, triangle, square and checkbox; text double-click stays normal');
  await content('<p style="color:#123456">Avant</p><ul><li data-marker-color="#ec4899">Texte intact</li></ul>');
  const native=await editor.locator('li').boundingBox();await page.mouse.dblclick(native.x-8,native.y+10);await page.getByRole('button',{name:'Suivre la couleur du texte',exact:true}).click();assert.equal(await editor.locator('li').getAttribute('data-marker-color'),null);assert.equal(await editor.locator('li').evaluate(el=>el.style.getPropertyValue('--li-marker-color')),'rgb(18, 52, 86)');
  // All supported item types expose the same unrestricted picker.
  for(const [title,emoji] of [['Écrire simplement','👩🏽‍🚀'],['Dossier','🇫🇷'],['Audio','👨‍👩‍👧‍👦']]){
   await page.locator('.navigator [data-item-id]').filter({has:page.getByText(title,{exact:true})}).first().click({button:'right'});
   await page.getByRole('textbox',{name:'Émoji personnalisé',exact:true}).fill(emoji);await page.getByRole('button',{name:'Utiliser cet émoji',exact:true}).click();
   assert.ok(await page.locator('.navigator .item-icon.emoji').filter({hasText:emoji}).count());
  }
  checks.push('Custom emoji, skin tone, flag and family icons on notes, folders and audio files');
  await page.getByRole('button',{name:'Mode livre',exact:true}).click();await settle();
  await content('<ul><li>Marqueur dans le livre</li></ul>');
  const bookHit=await editor.locator('li').evaluate(li=>{const r=li.getClientRects()[0],s=new DOMMatrix(getComputedStyle(li.closest('[data-book-canvas]')).transform).a;return {x:r.left-8*s,y:r.top+10*s};});
  await page.mouse.dblclick(bookHit.x,bookHit.y);await page.getByRole('button',{name:'Bleu',exact:true}).click();
  await page.getByRole('button',{name:'Mode note',exact:true}).click();assert.equal(await editor.locator('li').getAttribute('data-marker-color'),'#2563eb');
  // Return to the first document; seed enough pages to inspect fitting and page boundaries.
  await page.locator('[data-tab-id]').filter({hasText:'Écrire simplement'}).first().click();
  await content(Array.from({length:100},(_,i)=>`<p>Paragraphe ${i}. ${'Une page entière reste visible. '.repeat(3)}</p>`).join(''));
  await page.getByRole('button',{name:'Mode livre',exact:true}).click();await settle();
  const verifyFit=async()=>{
   const fit=await page.evaluate(()=>{const v=document.querySelector('[data-book-viewport]').getBoundingClientRect();return [...document.querySelectorAll('[data-book-page]')].slice(0,2).map(p=>{const r=p.getBoundingClientRect();return{top:r.top>=v.top,bottom:r.bottom<=v.bottom,left:r.left>=v.left,right:r.right<=v.right};});});
   for(const page of fit)assert.deepEqual(page,{top:true,bottom:true,left:true,right:true});
  };
  await verifyFit();await page.screenshot({path:path.join(out,'book-fitted.png')});
  // Resize the real Electron window, rather than browser-only viewport emulation.
  await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].setSize(1100,740));await settle();await page.waitForTimeout(150);await verifyFit();
  // Move by ArrowRight from the final character on page 1 to page 2, then type.
  const boundary=await editor.evaluate(el=>{
   const canvas=el.parentElement,scale=new DOMMatrix(getComputedStyle(canvas).transform).a,g=MindSetBookLayout.geometry({},2),origin=el.getBoundingClientRect(),walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);let last;
   while(walker.nextNode()){const node=walker.currentNode;for(let i=0;i<node.length;i++){const r=document.createRange();r.setStart(node,i);r.setEnd(node,i+1);const rect=r.getBoundingClientRect(),col=Math.floor(((rect.left-origin.left)/scale+1)/(g.width+g.gap)),row=Math.floor(((rect.top-origin.top)/scale+1)/(g.height+g.gap));if(row===0&&col===0)last={node,offset:i};else if(last){el.focus({preventScroll:true});r.setStart(last.node,last.offset);r.collapse(true);getSelection().removeAllRanges();getSelection().addRange(r);return true;}}}return false;
  });assert.equal(boundary,true);await settle();
  const scrollBefore=await page.locator('[data-book-viewport]').evaluate(el=>el.scrollTop);
  await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowRight');await page.keyboard.type('x');await settle();assert.ok(Math.abs(await page.locator('[data-book-viewport]').evaluate(el=>el.scrollTop)-scrollBefore)<2);
  // On subsequent rows, both pages stay fully visible too.
  await editor.evaluate(el=>{const nodes=[...el.querySelectorAll('p')];const node=nodes[40].firstChild;el.focus({preventScroll:true});const r=document.createRange();r.setStart(node,0);r.collapse(true);getSelection().removeAllRanges();getSelection().addRange(r);});
  await page.keyboard.press('ArrowRight');await settle();
  const rowVisible=await editor.evaluate(el=>{const r=getSelection().getRangeAt(0).getBoundingClientRect(),v=el.closest('[data-book-viewport]').getBoundingClientRect(),papers=[...document.querySelectorAll('[data-book-page]')].map(p=>p.getBoundingClientRect());const own=papers.find(p=>r.left>=p.left&&r.right<=p.right&&r.top>=p.top&&r.bottom<=p.bottom);return own && own.top>=v.top && own.bottom<=v.bottom;});assert.equal(rowVisible,true);
  checks.push('Entire two-page row fits width and height, including smaller window; crossing page 1 to 2 leaves scroll stable');
  await page.locator('[data-tab-id="second"]').click();assert.equal(await page.getByRole('button',{name:'Mode note',exact:true}).getAttribute('aria-pressed'),'true');
  await page.locator('[data-tab-id]').filter({hasText:'Écrire simplement'}).first().click();assert.equal(await page.getByRole('button',{name:'Mode note',exact:true}).getAttribute('aria-pressed'),'true');
  await page.reload();await page.getByRole('button',{name:'Ouvrir',exact:true}).click();assert.deepEqual(await history('text'),['#56789a','#6789ab','#789abc']);assert.equal(await page.getByRole('button',{name:'Mode note',exact:true}).getAttribute('aria-pressed'),'true');
  checks.push('Switching documents returns to Note; histories and emoji persist after restart');
  await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].setSize(1400,950));await content('<h1>Un espace pour écrire</h1><p>Les couleurs se choisissent simplement.</p>');await selectText('p',0,12);await page.locator('[data-color-palette="text"] summary').click();await page.screenshot({path:path.join(out,'color-palette.png')});
  assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:checks,errors},null,2));
 } catch(error) {console.error('PAGE ERRORS',errors);console.error(await page.locator('body').innerText());await page.screenshot({path:path.join(out,'failure.png')});throw error;} finally {await app.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
