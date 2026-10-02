// Shape matching is restricted to a mostly white stage with one isolated object.
export function describeThumbnail(data, width, height) {
  const mask = new Uint8Array(width * height);
  let foreground = 0;
  for (let i=0;i<mask.length;i++) {
    const p=i*4, a=data[p+3]/255;
    const r=255+(data[p]-255)*a,g=255+(data[p+1]-255)*a,b=255+(data[p+2]-255)*a;
    if (Math.min(r,g,b)<235) {mask[i]=1;foreground++;}
  }
  const visited=new Uint8Array(mask.length), components=[];
  for(let i=0;i<mask.length;i++) {
    if(!mask[i] || visited[i]) continue;
    const queue=[i];visited[i]=1;let minX=width,minY=height,maxX=0,maxY=0;
    for(let j=0;j<queue.length;j++) {
      const index=queue[j],x=index%width,y=Math.floor(index/width);
      minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);
      for(const next of [x>0?index-1:-1,x<width-1?index+1:-1,y>0?index-width:-1,y<height-1?index+width:-1]) {
        if(next>=0 && mask[next] && !visited[next]) {visited[next]=1;queue.push(next);}
      }
    }
    components.push({minX,minY,maxX,maxY,size:queue.length});
  }
  components.sort((a,b)=>b.size-a.size);
  const main=components[0];
  if(!main || main.size<8) return null;
  const padding=Math.max(2,Math.round(Math.max(main.maxX-main.minX,main.maxY-main.minY)*.15));
  const nearby=components.filter(c=>c.maxX>=main.minX-padding && c.minX<=main.maxX+padding && c.maxY>=main.minY-padding && c.minY<=main.maxY+padding);
  const bounds={minX:Math.min(...nearby.map(c=>c.minX)),maxX:Math.max(...nearby.map(c=>c.maxX)),minY:Math.min(...nearby.map(c=>c.minY)),maxY:Math.max(...nearby.map(c=>c.maxY))};
  const shape=[],orange=[];
  for(let y=0;y<48;y++) for(let x=0;x<48;x++) {
    const px=Math.min(bounds.maxX,Math.floor(bounds.minX+(x+.5)*(bounds.maxX-bounds.minX+1)/48));
    const py=Math.min(bounds.maxY,Math.floor(bounds.minY+(y+.5)*(bounds.maxY-bounds.minY+1)/48));
    const i=py*width+px,p=i*4,r=data[p],g=data[p+1],b=data[p+2];
    shape.push(mask[i]);orange.push(Number(mask[i] && r>180 && g>65 && g<220 && b<130 && r>g*1.1));
  }
  return {shape,orange,whiteFraction:1-foreground/(width*height),outsideFraction:(foreground-nearby.reduce((sum,c)=>sum+c.size,0))/Math.max(foreground,1)};
}
function overlap(a,b) {
  let intersection=0,union=0;
  for(let i=0;i<a.length;i++) {intersection+=Math.min(a[i],b[i]);union+=Math.max(a[i],b[i]);}
  return union ? intersection/union : 0;
}
export function isPlainScratchCat(candidate, reference) {
  if(!candidate || !reference || candidate.whiteFraction<.80 || candidate.outsideFraction>.06) return false;
  const compare=flipped=>{
    const shape=flipped?candidate.shape.map((_,i)=>candidate.shape[Math.floor(i/48)*48+47-i%48]):candidate.shape;
    const orange=flipped?candidate.orange.map((_,i)=>candidate.orange[Math.floor(i/48)*48+47-i%48]):candidate.orange;
    return overlap(shape,reference.shape)>.54 && overlap(orange,reference.orange)>.43;
  };
  return compare(false) || compare(true);
}
