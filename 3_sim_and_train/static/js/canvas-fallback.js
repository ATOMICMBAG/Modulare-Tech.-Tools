// Simple 2D canvas fallback for environments where Three.js cannot be loaded.
// Provides minimal interactivity: placeholder rendering, marker placement, and event logging.
(function(){
  const F = {};
  F.container = null;
  F.canvas = null;
  F.ctx = null;
  F.width = 0; F.height = 0;
  F.markers = [];
  F.events = [];
  F.startTs = null;
  F.scenario = null;

  function resize(){
    if(!F.canvas || !F.container) return;
    F.width = F.container.clientWidth;
    F.height = Math.max(200, Math.floor(window.innerHeight * 0.4));
    F.canvas.width = F.width;
    F.canvas.height = F.height;
    draw();
  }

  function draw(){
    if(!F.ctx) return;
    F.ctx.fillStyle = '#111';
    F.ctx.fillRect(0,0,F.width,F.height);
    // placeholder organ with rotation & scale
    const cx = F.width/2; const cy = F.height/2;
    const rW = Math.min(F.width, F.height)/6 * (F._scale || 1);
    const rH = Math.min(F.width, F.height)/8 * (F._scale || 1);
    const rot = F._rotX || 0;
    F.ctx.save();
    F.ctx.translate(cx, cy);
    F.ctx.rotate(rot);
    F.ctx.fillStyle = '#ddd';
    F.ctx.beginPath();
    F.ctx.ellipse(0, 0, rW, rH, 0, 0, Math.PI*2);
    F.ctx.fill();
    F.ctx.restore();
    // draw target if scenario provided
    if(F.scenario && F.scenario.scene){
      const tx = cx; const ty = cy - rH * 0.4;
      F.ctx.fillStyle = 'rgba(255,0,0,0.8)';
      F.ctx.beginPath(); F.ctx.arc(tx, ty, 6, 0, Math.PI*2); F.ctx.fill();
    }
    // markers
    for(const m of F.markers){
      F.ctx.fillStyle = 'rgba(0,255,0,0.9)';
      F.ctx.beginPath(); F.ctx.arc(m.x, m.y, 6, 0, Math.PI*2); F.ctx.fill();
    }
  }

  F.init = function(containerId='viewer'){
    F.container = document.getElementById(containerId);
    if(!F.container) return;
    F.canvas = document.createElement('canvas');
    F.canvas.style.width = '100%';
    F.canvas.style.height = '100%';
    F.canvas.style.display = 'block';
    F.container.innerHTML = '';
    F.container.appendChild(F.canvas);
    F.ctx = F.canvas.getContext('2d');
    window.addEventListener('resize', resize);
    resize();
      // pointer interactions: left click = place marker, drag = rotate, wheel = zoom
    F.canvas.addEventListener('pointerdown', ev => {
      const rect = F.canvas.getBoundingClientRect();
      const x = ev.clientX - rect.left; const y = ev.clientY - rect.top;
      if(ev.button === 0 && !ev.shiftKey){ // primary click: place marker
        F.placeMarkerAt(x,y);
      } else {
        F._isDragging = true; F._lastX = x; F._lastY = y;
      }
    });
    F.canvas.addEventListener('pointermove', ev => {
      if(!F._isDragging) return;
      const rect = F.canvas.getBoundingClientRect(); const x = ev.clientX - rect.left; const y = ev.clientY - rect.top;
      const dx = x - F._lastX; const dy = y - F._lastY;
      F._rotX = (F._rotX || 0) + dy * 0.01;
      F._rotY = (F._rotY || 0) + dx * 0.01;
      F._lastX = x; F._lastY = y;
      draw();
    });
    F.canvas.addEventListener('pointerup', ev => { F._isDragging = false; });
    F.canvas.addEventListener('pointerleave', ev => { F._isDragging = false; });
    F.canvas.addEventListener('wheel', ev => { ev.preventDefault(); F._scale = Math.max(0.3, (F._scale || 1) - ev.deltaY * 0.001); draw(); });
    const info = document.getElementById('status'); if(info) info.innerText = 'Canvas-Fallback aktiv';
    console.warn('[canvas-fallback] initialized');
  };

  F.loadPlaceholderModel = function(){ draw(); };
  F.loadModel = function(url){ console.log('[canvas-fallback] loadModel:', url); F.loadPlaceholderModel(); };
  F.loadLocalModel = function(file){ console.log('[canvas-fallback] loadLocalModel:', file.name); F.loadPlaceholderModel(); }

  F.placeMarkerAt = function(x,y){
    F.markers.push({x,y});
    const now = performance.now()/1000.0; if(!F.startTs) F.startTs = now;
    const evt = { ts: now, type: 'place_marker', x: x/F.width, y: y/F.height, z: 0, distance_to_target: 0 };
    F.events.push(evt);
    draw();
    const s = document.getElementById('status'); if(s) s.innerText = `Marker (Fallback) gesetzt: ${Math.round(x)},${Math.round(y)}`;
  };

  F.setupScenario = function(scenario){
    F.scenario = scenario;
    draw();
  };

  F.startSession = function(){ F.events = []; F.startTs = performance.now()/1000.0; const s = document.getElementById('status'); if(s) s.innerText = 'Session (Fallback) gestartet'; };

  F.getLogPayload = function(){
    const endTs = performance.now()/1000.0;
    return { scenario_id: (F.scenario && F.scenario.meta && F.scenario.meta.id) || 'fallback', events: F.events, start_time: F.startTs, end_time: endTs };
  };

  window.CanvasFallback = F;
})();
