// placeholder for client-side metrics calculations if needed
function computeAvgDistance(events){
  const d = events.map(e=>e.distance_to_target).filter(x=>typeof x === 'number');
  if(!d.length) return null;
  const s = d.reduce((a,b)=>a+b,0);
  return s / d.length;
}

function computePathDeviation(events, pathPoints){
  if(!Array.isArray(pathPoints) || pathPoints.length===0) return null;
  // compute distance of each event to the closest path point
  const pts = pathPoints.map(p => ({x:p.x,y:p.y,z:p.z}));
  const euclid = (a,b)=> Math.sqrt((a.x-b.x)**2 + (a.y-b.y)**2 + (a.z-b.z)**2);
  const d = events.map(e=>{
    const pos = {x:e.x,y:e.y,z:e.z};
    const ds = pts.map(p=>euclid(pos,p));
    return Math.min(...ds)*1000.0;
  }).filter(x=>typeof x === 'number');
  if(!d.length) return null;
  const s = d.reduce((a,b)=>a+b,0);
  return s / d.length;
}