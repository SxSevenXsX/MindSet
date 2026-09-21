const test=require('node:test'),assert=require('node:assert/strict');
const book=require('../src/book-layout'),guide=require('../src/guide');
test('book starts with A4 portrait, two columns and 2 cm margins',()=>{
 const g=book.geometry();assert.equal(g.columns,2);assert.equal(g.widthCm,21);assert.equal(g.heightCm,29.7);assert.equal(g.contentWidth,17*book.PX_PER_CM);assert.deepEqual(g.setup.margins,{left:2,right:2,top:2,bottom:2});
});
test('zoom affects the arrangement, never paper or text dimensions',()=>{
 const first=book.geometry({sizeId:'a5'});for(let n=1;n<=4;n++){const g=book.geometry(first.setup,n);assert.equal(g.columns,n);assert.equal(g.contentWidth,first.contentWidth);assert.equal(g.contentHeight,first.contentHeight);assert.equal(g.width,first.width);}
 assert.equal(book.geometry({},99).columns,4);assert.equal(book.geometry({},-3).columns,1);
});
test('preset and custom dimensions respect orientation',()=>{
 assert.deepEqual(book.dimensions(book.normalize({sizeId:'pocket',orientation:'landscape'})),{widthCm:18,heightCm:11});
 const setup=book.normalize({sizeId:'custom',customWidthCm:'14.25',customHeightCm:22.5});assert.deepEqual(book.dimensions(setup),{widthCm:14.25,heightCm:22.5});assert.equal(book.dimensions({...setup,orientation:'landscape'}).widthCm,22.5);
});
test('untrusted format values stay bounded and leave usable text area',()=>{
 for(const input of [null,{}, {sizeId:'<script>',margins:{left:NaN,right:Infinity}}, {sizeId:'custom',customWidthCm:-1,customHeightCm:999,margins:{left:55,right:55,top:55,bottom:55}}]) {
  const setup=book.normalize(input),g=book.geometry(setup);assert.ok(g.contentWidth>=3.99*book.PX_PER_CM);assert.ok(g.contentHeight>=3.99*book.PX_PER_CM);assert.ok(Number.isFinite(g.height));assert.equal('unexpected' in setup,false);
 }
 assert.equal(book.normalize({customWidthCm:null}).customWidthCm,21);
});
test('guide update appends the book chapter once without replacing user notes',()=>{
 let id=0;const uid=p=>`${p}-${++id}`,now=()=>new Date().toISOString();const box=guide.create(uid,now);box.guideVersion=1;box.root.children.pop();box.root.children[0].children[0].content='<p>Mes annotations personnelles</p>';const old=JSON.stringify(box.root.children);
 assert.equal(guide.upgrade(box,uid,now),true);assert.equal(JSON.stringify(box.root.children.slice(0,-1)),old);assert.equal(guide.upgrade(box,uid,now),false);assert.equal(guide.upgrade({isGuide:true},uid,now),false);
});
