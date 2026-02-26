let raycaster;
let mouse;
let markerMeshes = [];
window.markerMeshes = markerMeshes;
window.snapThreshold = window.snapThreshold || 0.005;
window.markerOcclusion = window.markerOcclusion || false;
let targetPoint = null; // from scenario in world coords
let eventLog = [];
let startTs = null;

function startSession(){
  eventLog = [];
  startTs = performance.now()/1000.0;
  console.log('[interaction] startSession', startTs);
  const s = document.getElementById('status'); if(s) s.innerText = 'Session gestartet';
}

async function setupInteraction(scenario){
  // ensure THREE classes are available and raycaster/mouse are created lazily
  try {
    await window.waitForTHREE();
  } catch (err) {
    console.warn('[interaction] THREE not available - using CanvasFallback if present', err);
    if(window.CanvasFallback){
      if(!window._USE_CANVAS_FALLBACK) window._USE_CANVAS_FALLBACK = true;
      window.CanvasFallback.setupScenario && window.CanvasFallback.setupScenario(scenario);
      // make sure startSession maps to fallback
      window.startSession = window.startSession || (function(){ window.CanvasFallback.startSession && window.CanvasFallback.startSession(); });
      document.getElementById('status').innerText = 'Interaktion (Fallback) initialisiert';
      return;
    }
    document.getElementById('status').innerText = 'Interaktion nicht verfügbar: Three.js wurde nicht geladen.';
    return;
  }
  if(!raycaster) raycaster = new THREE.Raycaster();
  if(!mouse) mouse = new THREE.Vector2();
  // Support path_points: if present, the first point is used as the main target
  if(scenario.scene.path_points && scenario.scene.path_points.length){
    targetPoint = new THREE.Vector3(scenario.scene.path_points[0].x, scenario.scene.path_points[0].y, scenario.scene.path_points[0].z);
    // draw path
    const pts = scenario.scene.path_points.map(p => new THREE.Vector3(p.x,p.y,p.z));
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({color:0xffff00});
    const line = new THREE.Line(geo, mat);
    scene.add(line);
  } else {
    targetPoint = new THREE.Vector3(scenario.scene.target_point.x, scenario.scene.target_point.y, scenario.scene.target_point.z);
    console.log('[interaction] setupInteraction targetPoint', targetPoint);
  }

  // create a visual target (optional)
  const g = new THREE.SphereGeometry(0.01, 16, 16);
  const m = new THREE.MeshBasicMaterial({color:0xff0000, opacity:0.4, transparent:true});
  const sphere = new THREE.Mesh(g,m);
  sphere.position.copy(targetPoint);
  scene.add(sphere);

  renderer.domElement.addEventListener('pointerdown', onPointerDown);
  console.log('[interaction] pointerdown listener added to renderer.domElement');
}

function onPointerDown(ev){
  console.log('[interaction] onPointerDown', ev.clientX, ev.clientY);
  if(!startTs) startTs = performance.now()/1000.0;
  if(typeof THREE === 'undefined' || !raycaster || !mouse){
    try{ if(typeof setupInteraction === 'function') setupInteraction(); } catch(e){ console.warn('[interaction] setupInteraction retry failed', e); }
  }
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((ev.clientX - rect.left)/rect.width)*2 - 1;
  mouse.y = -((ev.clientY - rect.top)/rect.height)*2 + 1;
  raycaster.setFromCamera(mouse, camera);
  // filter out helper objects (grid, axes, lights) to get precise model intersections
  const potentiallyInteractive = [];
  scene.traverse(function(obj){
    if (!obj) return;
    if (obj.userData && obj.userData.isHelper) return;
    if (obj.name && obj.name.startsWith('scene-')) return;
    // Skip lights
    if (obj.isLight) return;
    // Save meshes with geometry
    if (obj.isMesh && obj.geometry) potentiallyInteractive.push(obj);
  });
  const intersects = raycaster.intersectObjects(potentiallyInteractive, true);
  if(intersects.length){
    console.log('[interaction] intersects length', intersects.length, intersects[0].object);
    const intersect = intersects[0];
    let p = intersect.point.clone();
    // Try snapping to nearest vertex if enabled
    const snapEnabled = document.getElementById('chk-snap') && document.getElementById('chk-snap').checked;
    if(snapEnabled && intersect && intersect.object && intersect.object.geometry && intersect.object.geometry.attributes && intersect.object.geometry.attributes.position){
        const snapped = snapToVertex(intersect.object, p, window.snapThreshold); // use UI/global threshold
      if(snapped) p.copy(snapped);
    }
    placeMarker(p, intersect);
  }
}

function placeMarker(p, intersect){
  // if we have a face normal, offset marker slightly along the normal to avoid z-fighting
  try{
    if(intersect && intersect.face && intersect.object && intersect.object.matrixWorld){
      const nm = new THREE.Matrix3().getNormalMatrix(intersect.object.matrixWorld);
      const n = intersect.face.normal.clone().applyMatrix3(nm).normalize();
      // offset marker by a fraction of its visual size so it's visible outside the surface
      const size = computeMarkerSize(p);
      p.add(n.multiplyScalar(size * 0.2));
    }
  } catch(e){ }
  // use a unit sphere and scale to desired visual size; this avoids recreating geometry when resizing
  const g = new THREE.SphereGeometry(1, 12, 12);
  const m = new THREE.MeshBasicMaterial({color: new THREE.Color(window.markerColor || '#00ff00')});
  // respect occlusion toggle: if false, render on top; if true, use normal depth testing
  m.depthTest = !!window.markerOcclusion;
  m.depthWrite = !!window.markerOcclusion;
  const mesh = new THREE.Mesh(g,m);
  mesh.position.copy(p);
  const initialSize = computeMarkerSize(p) * (window.markerScaleFactor || 1.0);
  mesh.scale.setScalar(initialSize);
  mesh.renderOrder = window.markerOcclusion ? 0 : 999;
  scene.add(mesh);
  markerMeshes.push(mesh);
  // keep window reference in sync
  window.markerMeshes = markerMeshes;
  const now = performance.now()/1000.0;
  const dist = p.distanceTo(targetPoint);
  const dist_mm = dist * 1000.0; // assuming model units in meters
  const evt = { ts: now, type: 'place_marker', x: p.x, y: p.y, z: p.z, distance_to_target: dist_mm };
  eventLog.push(evt);
  // build an interesting math-like status
  const dist_cm = dist * 100.0;
  const dist_m = dist;
  const ang = targetPoint.clone().sub(p).angleTo(new THREE.Vector3(0,1,0));
  document.getElementById('status').innerText = `Marker: d=${dist_mm.toFixed(1)}mm (${dist_cm.toFixed(2)}cm, ${dist_m.toFixed(4)}m) | θ=${(ang*180/Math.PI).toFixed(1)}°`;
  // update the results list on right panel
  appendResultRow(evt, intersect);
}

// set snap threshold (UI friendly)
window.setSnapThreshold = function(v){ try{ window.snapThreshold = parseFloat(v) || 0.005; const el = document.getElementById('snap-threshold'); const elVal = document.getElementById('snap-value'); if(el) el.value = window.snapThreshold; if(elVal) elVal.innerText = `${Math.round(window.snapThreshold*1000)} mm`; }catch(e){ } };

// toggle marker occlusion
window.setMarkerOcclusion = function(enabled){ try{ window.markerOcclusion = !!enabled; if(window.markerMeshes) window.markerMeshes.forEach(m=>{ try{ if(m.material){ m.material.depthTest = !!window.markerOcclusion; m.material.depthWrite = !!window.markerOcclusion; } if(m) m.renderOrder = window.markerOcclusion ? 0 : 999; } catch(e){} }); } catch(e){ console.warn('[interaction] setMarkerOcclusion failed', e); } };

// compute a reasonable visual marker size (in meters) based on camera distance and model scale
function computeMarkerSize(point){
  try{
    if(!camera) return 0.008;
    const dist = camera.position.distanceTo(point);
    // base size is a small fraction of distance; clamp to reasonable bounds
    const size = Math.max(0.002, Math.min(0.2, dist * 0.02));
    return size;
  }catch(e){ return 0.008; }
}

// update marker scales so they remain visible when camera moves/zooms
window.updateMarkerScales = function(){
  try{
    if(!markerMeshes || !camera) return;
    for(const m of markerMeshes){
      const desired = computeMarkerSize(m.position) * (window.markerScaleFactor || 1.0);
      // ensure slight offset along normal is maintained if stored
      m.scale.setScalar(desired);
    }
  }catch(e){ console.warn('[interaction] updateMarkerScales failed', e); }
}

function appendResultRow(evt, intersect){
    const rp = document.getElementById('result-panel');
    if(!rp) return;
    rp.style.display = 'block';
    const div = document.createElement('div');
    div.style.borderBottom = '1px dashed #666';
    div.style.padding = '6px 0';
    const i = markerMeshes.length;
    div.innerText = `#${i} @ (${evt.x.toFixed(3)}, ${evt.y.toFixed(3)}, ${evt.z.toFixed(3)}) — ${evt.distance_to_target.toFixed(1)} mm`;
    rp.appendChild(div);
}

function snapToVertex(obj, pointWorld, threshold){
    try{
        const geom = obj.geometry;
        const pos = geom.attributes.position;
        if(!pos) return null;
        const matrix = obj.matrixWorld;
        let minD = Infinity; let minV = null;
        const v = new THREE.Vector3();
    for(let i=0;i<pos.count;i++){
            v.fromBufferAttribute(pos, i).applyMatrix4(matrix);
            const d = v.distanceTo(pointWorld);
            if(d < minD){ minD = d; minV = v.clone(); }
        }
    // dynamic threshold: if not provided, scale with camera distance so snapping works for very large models
    if(!threshold){
      try{ const dist = camera ? camera.position.distanceTo(pointWorld) : 1; threshold = Math.max(0.005, dist * 0.002); } catch(e){ threshold = 0.005; }
    }
    if(minD <= threshold) return minV;
    }catch(e){ console.warn('[interaction] snap error', e); }
    return null;
}

function getLogPayload(){
  // If we're running in fallback mode, get the payload from the fallback implementation
  if(window._USE_CANVAS_FALLBACK && window.CanvasFallback){
    return window.CanvasFallback.getLogPayload();
  }
  const endTs = performance.now()/1000.0;
  return { scenario_id: SCENARIO_ID, events: eventLog, start_time: startTs, end_time: endTs };
}

// clear markers and results
function clearMarkers(){
  markerMeshes.forEach(m=>{ try{ scene.remove(m); if(m.geometry && typeof m.geometry.dispose === 'function') m.geometry.dispose(); if(m.material && typeof m.material.dispose === 'function') m.material.dispose(); } catch(e){} });
  markerMeshes = [];
  window.markerMeshes = markerMeshes;
  eventLog = [];
  const rp = document.getElementById('result-panel'); if(rp){ rp.innerText = ''; rp.style.display = 'none'; }
  const status = document.getElementById('status'); if(status) status.innerText = 'Marker gelöscht';
}
window.clearMarkers = clearMarkers;