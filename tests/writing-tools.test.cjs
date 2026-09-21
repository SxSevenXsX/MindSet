const test=require('node:test'),assert=require('node:assert/strict');
const writing=require('../src/writing-tools');
test('three custom colors rotate in fixed slots without recording presets or duplicates',()=>{
 let h={slots:[],next:0};const colors=['#123456','#234567','#345678','#456789','#56789a','#6789ab'];
 for (let i=0;i<colors.length;i++) {h=writing.rememberColor(h,colors[i],['#000000']);assert.equal(h.slots[i%3],colors[i]);assert.equal(h.next,(i+1)%3);}
 assert.deepEqual(h.slots,colors.slice(3));assert.deepEqual(writing.rememberColor(h,'#000000',['#000000']),h);assert.deepEqual(writing.rememberColor(h,colors[4]),h);
});
test('old six-color ring migrates to the last three, keeping empty slots stable',()=>{
 assert.deepEqual(writing.recentColors(['#000001','#000002','#000003','#000004','#000005','#000006'],2),{slots:['#000006','#000001','#000002'],next:0});
 assert.deepEqual(writing.recentColors(['#123456','','#234567']),{slots:['#123456','','#234567'],next:0});
 assert.deepEqual(writing.recentColors(),{slots:['','',''],next:0});
});
test('emoji input preserves an entire grapheme including flags, family and skin tones',()=>{
 for(const emoji of ['🌱','🇫🇷','👩🏽‍🚀','👨‍👩‍👧‍👦','1️⃣','🏳️‍🌈','🫩'])assert.equal(writing.emoji(emoji),emoji);
 assert.equal(writing.emoji('  🪴🌸  '),'🪴');assert.equal(writing.emoji('<script>'),'');assert.equal(writing.emoji('abc'),'');
});
test('visual note zoom has independent safe bounds',()=>{
 assert.equal(writing.clampZoom(),1);assert.equal(writing.clampZoom(.1),.5);assert.equal(writing.clampZoom(4),2);assert.equal(writing.clampZoom(1.131),1.13);
});
