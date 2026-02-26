async function startScenario() {
  console.log('[workflow] startScenario');
  document.getElementById('status').innerText = 'Lade Szenario...';
  const resp = await fetch(`/sim_train/api/scenario/${SCENARIO_ID}`);
  console.log('[workflow] fetched scenario:', SCENARIO_ID, resp.status);
  if (!resp.ok) { document.getElementById('status').innerText = 'Szenario nicht gefunden'; return; }
  const scenario = await resp.json();
  console.log('[workflow] scenario json loaded', (scenario.meta && scenario.meta.title) || 'no-meta');
  document.getElementById('instructions').innerText = scenario.workflow[0].instruction || '';

  try {
    // Prefer dynamically importing local Three modules if available to avoid CDN/CORS issues
    if(typeof window.loadLocalThree === 'function'){
      try{
        await window.loadLocalThree();
        console.log('[workflow] loadLocalThree succeeded');
      } catch(e){
        console.warn('[workflow] loadLocalThree failed, continuing to initScene', e);
      }
    }
    await initScene();
    console.log('[workflow] initScene completed');
    // set grid visibility according to UI
    try{ const cgH = document.getElementById('chk-grid-horizontal'); const cgV = document.getElementById('chk-grid-vertical'); if(typeof window.toggleGrid === 'function') window.toggleGrid(cgH ? cgH.checked : true, cgV ? cgV.checked : true); } catch(e){ console.warn('set initial grid visibility failed', e); }
  } catch (err) {
    console.error('[workflow] initScene error', err);
    document.getElementById('status').innerText = 'Fehler beim Initialisieren der Szene: ' + err.message;
    return;
  }
  if (scenario.scene.model) {
    try {
      await loadModel(scenario.scene.model);
      console.log('[workflow] loadModel success', scenario.scene.model);
    } catch (e) {
      console.warn("Modell konnte nicht geladen werden, Placeholder wird angezeigt.");
      loadPlaceholderModel();
      document.getElementById('status').innerText = 'Placeholder geladen';
    }
  } else {
    loadPlaceholderModel();
    document.getElementById('status').innerText = 'Placeholder geladen';
  }
  try{
    if(typeof setupInteraction === 'function') await setupInteraction(scenario);
  } catch(err){
    console.error('[workflow] setupInteraction failed', err);
    document.getElementById('status').innerText = 'Interaktion konnte nicht initialisiert werden: ' + (err.message || err);
  }
  document.getElementById('status').innerText = 'Szenario geladen';
  // clear previous results
  const rp = document.getElementById('result-panel'); if(rp){ rp.innerText = ''; rp.style.display = 'none'; }

  const btnStart = document.getElementById('btn-start');
  if(btnStart){
    btnStart.onclick = () => {
      console.log('[workflow] btn-start clicked');
      // mark session start for logging
      if(window._USE_CANVAS_FALLBACK && window.CanvasFallback && typeof window.CanvasFallback.startSession === 'function'){
        window.CanvasFallback.startSession();
        console.log('[workflow] CanvasFallback startSession called');
      } else {
        try {
          if (typeof startSession === 'function') {
            startSession();
            console.log('[workflow] startSession called');
          } else {
            console.warn('[workflow] startSession function not found');
          }
        } catch (err) {
          console.warn('[workflow] could not call startSession', err);
        }
      }
      document.getElementById('instructions').innerText = scenario.workflow[1].instruction || '';
      document.getElementById('status').innerText = 'Session gestartet';
    };
  } else {
    console.warn('[workflow] btn-start not found');
  }
  // UI toggles
  const chkGridH = document.getElementById('chk-grid-horizontal');
  const chkGridV = document.getElementById('chk-grid-vertical');
  function _gridChange(){ try{ const h = (!!(chkGridH && chkGridH.checked)); const v = (!!(chkGridV && chkGridV.checked)); window.toggleGrid(h, v); } catch(err){ console.warn('toggleGrid failed', err); } }
  if(chkGridH){ chkGridH.addEventListener('change', _gridChange); }
  if(chkGridV){ chkGridV.addEventListener('change', _gridChange); }
  const chkSnap = document.getElementById('chk-snap');
  if(chkSnap) chkSnap.checked = false;
  const snapThresholdEl = document.getElementById('snap-threshold');
  const snapValueEl = document.getElementById('snap-value');
  if(snapThresholdEl){ snapThresholdEl.value = window.snapThreshold || 0.005; const _updateSnap = (v)=>{ try{ if(snapValueEl) snapValueEl.innerText = `${Math.round((v||snapThresholdEl.value)*1000)} mm`; }catch(e){} }; _updateSnap(parseFloat(snapThresholdEl.value)); snapThresholdEl.addEventListener('input', (e)=>{ try{ window.setSnapThreshold && window.setSnapThreshold(parseFloat(e.target.value)); _updateSnap(parseFloat(e.target.value)); } catch(err){ console.warn('setSnapThreshold failed', err); } }); }
  // unit buttons
  function setUnitUI(u){
    ['unit-mm','unit-cm','unit-m'].forEach(id=>{ const el = document.getElementById(id); if(!el) return; el.setAttribute('aria-pressed', (id==='unit-'+u)); });
  }
  ['mm','cm','m'].forEach(u=>{
    const id = 'unit-'+u;
    const el = document.getElementById(id);
    if(!el) return;
    el.addEventListener('click', async ()=>{
      try{ if(typeof window.setUnit === 'function') window.setUnit(u);
        setUnitUI(u);
        document.getElementById('status').innerText = `Einheit gesetzt: ${u}`;
      } catch(err){ console.warn('setUnit failed', err); }
    });
  });
  // default unit UI
  setUnitUI(window.currentUnit || 'm');
  // Wire new visual controls
  const colMarker = document.getElementById('col-marker'); if(colMarker){ colMarker.value = window.markerColor || '#00ff00'; colMarker.addEventListener('input', (e)=>{ try{ if(typeof window.setMarkerColor === 'function') window.setMarkerColor(e.target.value); } catch(err){ console.warn('setMarkerColor failed', err); } }); }
  const colGridMajor = document.getElementById('col-grid-major'); const colGridMinor = document.getElementById('col-grid-minor'); if(colGridMajor) colGridMajor.value = window.gridColorMajor || '#333333'; if(colGridMinor) colGridMinor.value = window.gridColorMinor || '#222222';
  if(colGridMajor && colGridMinor){ colGridMajor.addEventListener('input', (e)=>{ try{ window.setGridColors(e.target.value, colGridMinor.value); } catch(err){ console.warn('setGridColors failed', err); } }); colGridMinor.addEventListener('input', (e)=>{ try{ window.setGridColors(colGridMajor.value, e.target.value); } catch(err){ console.warn('setGridColors failed', err); } }); }
  const bgColor = document.getElementById('col-bg'); if(bgColor){ bgColor.value = window.backgroundColor || '#111111'; bgColor.addEventListener('input', (e)=>{ try{ window.setBackgroundColor(e.target.value); } catch(err){ console.warn('setBackgroundColor failed', err); } }); }
  const gridSpacing = document.getElementById('grid-spacing'); const gridSpacingValue = document.getElementById('grid-spacing-value');
  if(gridSpacing){ gridSpacing.value = window.gridSpacing || 1; const _updateGridText = (v)=>{ try{ if(gridSpacingValue) gridSpacingValue.innerText = `${parseFloat(v).toFixed(2)} m`; }catch(e){} }; _updateGridText(parseFloat(gridSpacing.value)); gridSpacing.addEventListener('input', (e)=>{ try{ window.setGridSpacing(e.target.value); _updateGridText(e.target.value); } catch(err){ console.warn('setGridSpacing failed', err); } }); }
  const gridPreset = document.getElementById('grid-preset'); if(gridPreset){ gridPreset.addEventListener('change', (e)=>{ try{ const v = parseFloat(e.target.value); if(gridSpacing) gridSpacing.value = v; window.setGridSpacing(v); } catch(err){ console.warn('gridPreset change failed', err); } }); }
  const lightIntensity = document.getElementById('light-intensity'); const lightAz = document.getElementById('light-azimuth'); const lightEl = document.getElementById('light-elevation'); const lightIntensityValue = document.getElementById('light-intensity-value'); const lightAzValue = document.getElementById('light-az-value'); const lightElValue = document.getElementById('light-el-value'); if(lightIntensity) { lightIntensity.value = window.lightSettings.intensity || 1; if(lightIntensityValue) lightIntensityValue.innerText = `${parseFloat(lightIntensity.value).toFixed(2)}`; lightIntensity.addEventListener('input', (e)=>{ try{ window.setLightSettings({ intensity: parseFloat(e.target.value) }); if(lightIntensityValue) lightIntensityValue.innerText = `${parseFloat(e.target.value).toFixed(2)}`; } catch(err){ console.warn('setLight intensity failed', err); } }); }
  if(lightAz){ lightAz.value = window.lightSettings.azimuth || 45; if(lightAzValue) lightAzValue.innerText = `${lightAz.value}°`; lightAz.addEventListener('input', (e)=>{ try{ window.setLightSettings({ azimuth: parseFloat(e.target.value) }); if(lightAzValue) lightAzValue.innerText = `${parseFloat(e.target.value).toFixed(0)}°`; } catch(err){ console.warn('setLight az failed', err); } }); }
  if(lightEl){ lightEl.value = window.lightSettings.elevation || 30; if(lightElValue) lightElValue.innerText = `${lightEl.value}°`; lightEl.addEventListener('input', (e)=>{ try{ window.setLightSettings({ elevation: parseFloat(e.target.value) }); if(lightElValue) lightElValue.innerText = `${parseFloat(e.target.value).toFixed(0)}°`; } catch(err){ console.warn('setLight el failed', err); } }); }
  // no duplicate listeners – already set above with UI text updates
  const mScale = document.getElementById('marker-scale'); const mScaleValue = document.getElementById('marker-scale-value'); if(mScale){ mScale.value = window.markerScaleFactor || 1; if(mScaleValue) mScaleValue.innerText = `${parseFloat(mScale.value).toFixed(1)}x`; mScale.addEventListener('input', (e)=>{ try{ window.setMarkerScaleFactor(parseFloat(e.target.value)); if(mScaleValue) mScaleValue.innerText = `${parseFloat(e.target.value).toFixed(1)}x`; } catch(err){ console.warn('setMarkerScaleFactor failed', err); } }); }
  const btnForceLocal = document.getElementById('btn-force-local');
  if(btnForceLocal){
    btnForceLocal.onclick = async () => {
      const status = document.getElementById('status');
      try{
        if(status) status.innerText = 'Lade lokale Three.js...';
        if(typeof window.loadLocalThree === 'function'){
          await window.loadLocalThree();
          if(status) status.innerText = 'Lokale Three.js geladen — Szene neu initialisieren';
          // re-init scene to ensure we have controls
          await initScene();
          // re-load model and re-setup interaction if scenario available
          if(scenario && scenario.scene && scenario.scene.model){
            try{ await loadModel(scenario.scene.model); if(status) status.innerText = '3D Model geladen'; } catch(e){ console.warn('[workflow] re-load model failed', e); }
          }
          try{ if(typeof setupInteraction === 'function') await setupInteraction(scenario); } catch(e){ console.warn('[workflow] re-setup interaction failed', e); }
          if(status) status.innerText = 'Lokale Three.js aktiv';
        } else {
          if(status) status.innerText = 'Lokaler Loader nicht vorhanden';
        }
      } catch (err) {
        console.error('[workflow] force-local error', err);
        if(status) status.innerText = 'Fehler beim Laden der lokalen Three.js: ' + (err.message || err);
      }
    };
  } else {
    console.warn('[workflow] btn-force-local not found');
  }
  const btnExport = document.getElementById('btn-export');
  if(btnExport){
    btnExport.onclick = async () => {
      console.log('[workflow] btn-export clicked');
      const resultPanel = document.getElementById('result-panel');
      try {
        document.getElementById('status').innerText = 'Evaluating...';
        const payload = getLogPayload();
        if(!payload || !payload.events || payload.events.length === 0){
          if(resultPanel){ resultPanel.innerText = 'Keine Aktionen erfasst. Bitte zuerst Marker setzen oder Aktionen durchführen.'; resultPanel.style.display = 'block'; }
          document.getElementById('status').innerText = 'Keine Aktionen';
          return;
        }
      // simple evaluate and show result
      const res = await fetch('/sim_train/api/evaluate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const metrics = await res.json();
        console.log('[workflow] evaluation metrics', metrics);
      // show results in result-panel and open results in a new tab by POSTing the JSON to the /results endpoint
      const resultPanel = document.getElementById('result-panel');
      if(resultPanel){ resultPanel.innerText = JSON.stringify(metrics, null, 2); resultPanel.style.display = 'block'; }
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = '/sim_train/results';
      form.target = '_blank';
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = 'result';
      input.value = JSON.stringify(metrics, null, 2);
      form.appendChild(input);
      document.body.appendChild(form);
      form.submit();
      form.remove();

      // offer CSV download
        const res2 = await fetch('/sim_train/api/export_csv', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const blob = await res2.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'training_log.csv'; a.click();
      } catch (err) {
        console.error('[workflow] export error', err);
        if(resultPanel){ resultPanel.innerText = 'Fehler: ' + (err.message || err); resultPanel.style.display = 'block'; }
        document.getElementById('status').innerText = 'Fehler';
      }
    };
  } else {
    console.warn('[workflow] btn-export not found');
  }
  const btnClear = document.getElementById('btn-clear-markers');
  if(btnClear){ btnClear.addEventListener('click', ()=>{ console.log('[workflow] btn-clear-markers clicked'); try{ if(typeof window.clearMarkers === 'function') { window.clearMarkers(); document.getElementById('status').innerText = 'Marker gelöscht'; } else { console.warn('clearMarkers function not found'); } } catch(e){ console.warn('clearMarkers failed', e); } }); }
  const chkMarkerOcc = document.getElementById('chk-marker-occlusion'); if(chkMarkerOcc){ chkMarkerOcc.addEventListener('change', (e)=>{ try{ if(typeof window.setMarkerOcclusion === 'function') window.setMarkerOcclusion(!!e.target.checked); } catch(err){ console.warn('setMarkerOcclusion failed', err); } }); chkMarkerOcc.checked = window.markerOcclusion || false; }
  // Tooltip: show help from data-tooltip attributes
  const tooltip = document.getElementById('tooltip');
  function _showTooltip(e){ try{ const el = e.currentTarget; const txt = el.getAttribute('data-tooltip') || el.title || el.getAttribute('aria-label'); if(!txt) return; tooltip.style.display = 'block'; tooltip.innerText = txt; const x = (e.clientX || (e.touches && e.touches[0] && e.touches[0].clientX)) || 20; const y = (e.clientY || (e.touches && e.touches[0] && e.touches[0].clientY)) || 20; const offX = 18; const offY = 18; tooltip.style.left = Math.min(window.innerWidth - tooltip.offsetWidth - 12, x + offX) + 'px'; tooltip.style.top = Math.min(window.innerHeight - tooltip.offsetHeight - 12, y + offY) + 'px'; } catch(e){} }
  function _moveTooltip(e){ try{ if(tooltip.style.display === 'none') return; const x = (e.clientX || (e.touches && e.touches[0] && e.touches[0].clientX)) || 20; const y = (e.clientY || (e.touches && e.touches[0] && e.touches[0].clientY)) || 20; tooltip.style.left = Math.min(window.innerWidth - tooltip.offsetWidth - 12, x + 18) + 'px'; tooltip.style.top = Math.min(window.innerHeight - tooltip.offsetHeight - 12, y + 18) + 'px'; } catch(e){} }
  function _hideTooltip(){ try{ tooltip.style.display = 'none'; } catch(e){} }
  // Attach listeners to all elements with data-tooltip
  document.querySelectorAll('[data-tooltip]').forEach(el=>{ try{ el.addEventListener('mouseenter', _showTooltip); el.addEventListener('mousemove', _moveTooltip); el.addEventListener('mouseleave', _hideTooltip); el.addEventListener('focus', _showTooltip); el.addEventListener('blur', _hideTooltip); el.addEventListener('touchstart', _showTooltip); el.addEventListener('touchmove', _moveTooltip); el.addEventListener('touchend', _hideTooltip); } catch(e){} });
  const btnLoadModel = document.getElementById('btn-load-model');
  if(btnLoadModel){
    btnLoadModel.onclick = async () => {
      console.log('[workflow] btn-load-model clicked');
      const input = document.getElementById('file-input');
      if (!input || input.files.length === 0) {
        alert("Bitte eine Modell-Datei auswählen (.glb, .gltf, .obj, .stl)");
        return;
      }
      const f = input.files[0];
      try {
        await loadLocalModel(f);
        document.getElementById('status').innerText = `Modell geladen: ${f.name}`;
        console.log('[workflow] loadLocalModel called', f.name);
      } catch (err) {
        console.error('[workflow] loadLocalModel error', err);
        document.getElementById('status').innerText = 'Fehler beim Laden des Modells: ' + err.message;
      }
    };
  } else {
    console.warn('[workflow] btn-load-model not found');
  }
  // also load model automatically when a file is selected
  const fileInput = document.getElementById('file-input');
  if (fileInput) {
    fileInput.addEventListener('change', async (ev) => {
      console.log('[workflow] file-input change event');
      if (fileInput.files.length === 0) return;
      await loadLocalModel(fileInput.files[0]);
      document.getElementById('status').innerText = `Modell geladen: ${fileInput.files[0].name}`;
    });
  }
  const btnExportJson = document.getElementById('btn-export-json');
  if(btnExportJson){
    btnExportJson.onclick = async () => {
      console.log('[workflow] btn-export-json clicked');
      const resultPanel = document.getElementById('result-panel');
      const payload = getLogPayload();
      if(!payload || !payload.events || payload.events.length === 0){
        if(resultPanel){ resultPanel.innerText = 'Keine Aktionen erfasst. Bitte zuerst Marker setzen oder Aktionen durchführen.'; resultPanel.style.display = 'block'; }
        document.getElementById('status').innerText = 'Keine Aktionen';
        return;
      }
      const res = await fetch('/sim_train/api/export_json', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'training_metrics.json'; a.click();
    };
  } else {
    console.warn('[workflow] btn-export-json not found');
  }
}

// auto-start only when viewer exists on page (prevents errors on index page)
window.addEventListener('load', () => {
  console.log('[workflow] window.load event');
  if (document.getElementById('viewer')) startScenario();
});
