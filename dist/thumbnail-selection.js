// Compare tiny previews locally; no image uploads or recognition service.
(() => {
  const cache = new Map();
  function pixels(url) {
    return new Promise(resolve => {
      const img = new Image(); img.crossOrigin = 'anonymous';
      const timer = setTimeout(() => resolve(null), 4000);
      img.onload = () => {
        clearTimeout(timer);
        try {
          const canvas = document.createElement('canvas'); canvas.width = 64; canvas.height = 48;
          const context = canvas.getContext('2d', {willReadFrequently:true});
          context.drawImage(img,0,0,64,48); resolve(context.getImageData(0,0,64,48).data);
        } catch { resolve(null); }
      };
      img.onerror = () => {clearTimeout(timer);resolve(null);}; img.src = url;
    });
  }
  let reference;
  function catOnly(data, standard) {
    if (!data) return false;
    let difference = 0, white = 0, orange = 0, outside = 0;
    for (let i=0; i<data.length; i+=4) {
      const [r,g,b] = data.slice(i,i+3);
      if (standard) difference += Math.abs(r-standard[i])+Math.abs(g-standard[i+1])+Math.abs(b-standard[i+2]);
      const isWhite = r>240 && g>240 && b>240;
      if (isWhite) white++;
      else {
        const x=(i/4)%64,y=Math.floor(i/4/64);
        if (x<14 || x>49 || y<6 || y>42) outside++;
      }
      if (r>190 && g>75 && g<205 && b<110 && r>g*1.15) orange++;
    }
    // Exact default thumbnail, or a small orange cat alone in the middle of a white stage.
    return (standard && difference/(64*48*3)<4) ||
      (white/(64*48)>.90 && orange>5 && orange/(64*48-white)>.12 && outside<8);
  }
  async function acceptable(project) {
    if (!cache.has(project.id)) cache.set(project.id,(async () => {
      reference ||= pixels('https://cdn2.scratch.mit.edu/get_image/project/default_64x48.png');
      const [data,standard] = await Promise.all([pixels(`https://cdn2.scratch.mit.edu/get_image/project/${project.id}_64x48.png`),reference]);
      return !catOnly(data,standard);
    })());
    return cache.get(project.id);
  }
  async function select(projects, count) {
    const selected=[];
    for (let offset=0;offset<projects.length && selected.length<count;offset+=8) {
      const batch=projects.slice(offset,offset+8);
      const valid=await Promise.all(batch.map(acceptable));
      batch.forEach((p,i)=>{if(valid[i] && selected.length<count) selected.push(p);});
    }
    return selected;
  }
  window.selectProjectThumbnails = select;
})();
