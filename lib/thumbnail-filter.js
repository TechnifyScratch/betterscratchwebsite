import {PNG} from 'pngjs';
import reference from '../dist/assets/scratch-cat-reference.json' with {type:'json'};
import {describeThumbnail,isPlainScratchCat} from '../dist/thumbnail-classifier.js';
const cache=new Map();
export function isUsableThumbnail(buffer) {
  // Bound both downloaded and decoded image sizes before parsing.
  if(buffer.length<24 || buffer.length>750000 || buffer.readUInt32BE(16)>432 || buffer.readUInt32BE(20)>324) return false;
  try {
    const image=PNG.sync.read(buffer);
    const descriptor=describeThumbnail(image.data,image.width,image.height);
    return !!descriptor && !isPlainScratchCat(descriptor,reference);
  } catch {return false;}
}
async function inspect(project,deadline) {
  const existing=cache.get(project.id);
  if(existing && existing.expires>Date.now()) return existing.valid;
  if(Date.now()>=deadline) return false;
  try {
    const response=await fetch(`https://uploads.scratch.mit.edu/get_image/project/${project.id}_216x162.png`,{
      credentials:'omit',redirect:'error',signal:AbortSignal.timeout(Math.max(1,Math.min(2000,deadline-Date.now())))
    });
    if(!response.ok) return false;
    const length=Number(response.headers.get('content-length'));
    if(length>750000) return false;
    const valid=isUsableThumbnail(Buffer.from(await response.arrayBuffer()));
    if(cache.size>=1000) cache.delete(cache.keys().next().value);
    cache.set(project.id,{valid,expires:Date.now()+3600000});return valid;
  } catch {return false;}
}
export async function filterThumbnails(projects,deadline) {
  const accepted=new Map(),developers=new Set();
  let next=0;
  await Promise.all(Array.from({length:8},async()=>{
    while(next<projects.length && accepted.size<96 && Date.now()<deadline) {
      const project=projects[next++],name=project.author.toLowerCase();
      const developer=['viralgoose','-technify-'].includes(name);
      if(developer && developers.has(name)) continue;
      if(await inspect(project,deadline)) {
        if(developer && developers.has(name)) continue;
        if(developer) developers.add(name);
        if(accepted.size<96) accepted.set(project.id,{...project,thumbnailChecked:true});
      }
    }
  }));
  return [...accepted.values()];
}
