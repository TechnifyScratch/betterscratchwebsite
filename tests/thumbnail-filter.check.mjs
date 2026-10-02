import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {describeThumbnail,isPlainScratchCat} from '../dist/thumbnail-classifier.js';
const reference=JSON.parse(fs.readFileSync(new URL('../dist/assets/scratch-cat-reference.json',import.meta.url)));
function stage(size=35,left=90,top=60,background=255,flip=false,extra=false) {
 const width=216,height=162,data=new Uint8ClampedArray(width*height*4).fill(255);
 for(let i=0;i<width*height;i++) data[i*4]=data[i*4+1]=data[i*4+2]=background;
 for(let y=0;y<size;y++) for(let x=0;x<size;x++) {
  const sx=Math.min(47,Math.floor(x/size*48)),sy=Math.min(47,Math.floor(y/size*48)),s=sy*48+(flip?47-sx:sx);
  if(!reference.shape[s]) continue;
  const p=((top+y)*width+left+x)*4;
  data[p]=reference.orange[s]?255:30;data[p+1]=reference.orange[s]?170:30;data[p+2]=reference.orange[s]?25:30;
 }
 if(extra) for(let y=8;y<30;y++)for(let x=8;x<40;x++){const p=(y*width+x)*4;data[p]=30;data[p+1]=50;data[p+2]=200;}
 return describeThumbnail(data,width,height);
}
test('reference cat is rejected at different sizes, positions, and facing directions',()=>{
 for(const [size,x,y,flip] of [[22,20,15,false],[35,90,60,false],[70,120,70,false],[40,60,40,true]]) {
  assert.equal(isPlainScratchCat(stage(size,x,y,255,flip),reference),true,`size ${size}`);
 }
});
test('cat artwork on colored stages or with other substantial artwork remains eligible',()=>{
 assert.equal(isPlainScratchCat(stage(35,90,60,140),reference),false);
 assert.equal(isPlainScratchCat(stage(35,90,60,255,false,true),reference),false);
 const unrelated={...stage(),shape:new Array(2304).fill(1),orange:new Array(2304).fill(0)};
 assert.equal(isPlainScratchCat(unrelated,reference),false);
});

test('undecodable thumbnails are skipped instead of passing the filter',async()=>{
 const {isUsableThumbnail}=await import('../lib/thumbnail-filter.js');
 assert.equal(isUsableThumbnail(Buffer.from('not an image')),false);
 assert.equal(isUsableThumbnail(Buffer.alloc(800000)),false);
});
