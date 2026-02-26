let scene, camera, renderer, controls, clock;
let activeModel = null;
window.currentUnit = 'm';
window.unitMultiplier = { 'mm': 1000, 'cm': 100, 'm': 1 };
// Visual settings and defaults
window.markerColor = '#00ff00';
window.gridColorMajor = '#333333';
window.gridColorMinor = '#222222';
window.backgroundColor = '#111111';
window.gridSpacing = 1; // meters per grid spacing
window.markerScaleFactor = 1.0;
window.lightSettings = { intensity: 1.0, azimuth: 45, elevation: 30 };

/**
 * Initialisiert die Three.js-Szene.
 */
async function initScene(containerId = 'viewer') {
    try{
        await window.waitForTHREE();
    } catch(err){
        console.error('[sceneLoader] THREE not available - switching to CanvasFallback', err);
        const info = document.getElementById('status'); if(info) info.innerText = 'Canvas fallback active';
        // Initialize the canvas fallback UI; keep the flow going so UI buttons etc. work
        if(window.CanvasFallback){
            window.CanvasFallback.init(containerId);
            window._USE_CANVAS_FALLBACK = true;
            // fallback scene and placeholder
            window.CanvasFallback.setupScenario && window.CanvasFallback.setupScenario({});
            window.CanvasFallback.loadPlaceholderModel && window.CanvasFallback.loadPlaceholderModel();
            return;
        }
        const container = document.getElementById(containerId);
        if (container) container.innerHTML = '<div style="padding:16px;background:#fff;border-radius:6px;color:#000">Three.js konnte nicht geladen werden. Bitte CDN zulassen oder lokale Kopie bereitstellen.</div>';
        throw err;
    }
    const container = document.getElementById(containerId);
    // If a renderer already exists (re-init), clean up old renderer and DOM
    if (renderer && renderer.domElement) {
        try{
            if(renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
            if(typeof renderer.dispose === 'function') renderer.dispose();
            renderer = null;
        } catch(e){ console.warn('[sceneLoader] error cleaning up previous renderer', e); }
    }
    console.log('[sceneLoader] initScene container:', containerId, container);

    scene = new THREE.Scene();
    // clear any fallback flag
    window._USE_CANVAS_FALLBACK = false;

        const width = container.clientWidth || Math.max(600, window.innerWidth - 40);
        const height = container.clientHeight || Math.max(320, Math.floor(window.innerHeight * 0.6));
        camera = new THREE.PerspectiveCamera(
            60,
            width / height,
            0.01,
            1000
        );
    camera.position.set(0.3, 0.3, 0.6);

    try {
        renderer = new THREE.WebGLRenderer({ antialias: true });
    } catch (err) {
        console.error('[sceneLoader] WebGLRenderer not available', err);
        const container = document.getElementById(containerId);
        if (container) container.innerHTML = '<div style="padding:16px;background:#fff;border-radius:6px;color:#000">WebGL wird nicht unterstützt oder Renderer konnte nicht erstellt werden.</div>';
        throw err;
    }
        renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x1b1b1b, 1);
    container.appendChild(renderer.domElement);
    renderer.domElement.style.touchAction = 'none';
    renderer.domElement.setAttribute('id','three-canvas');
    console.log('[sceneLoader] renderer appended; size: ', width, height);

        try{
            const OrbitCtr = (window.THREE && window.THREE.OrbitControls) || window.OrbitControls;
            if(!OrbitCtr) throw new Error('OrbitControls not available');
            controls = new OrbitCtr(camera, renderer.domElement);
            controls.target.set(0, 0, 0);
            camera.lookAt(0,0,0);
            controls.update();
        } catch(err){
            console.warn('[sceneLoader] OrbitControls init failed - switching to CanvasFallback', err);
            const info = document.getElementById('status'); if(info) info.innerText = 'Canvas fallback active (controls missing)';
            if(window.CanvasFallback){
                window.CanvasFallback.init(containerId);
                window._USE_CANVAS_FALLBACK = true;
                window.CanvasFallback.loadPlaceholderModel && window.CanvasFallback.loadPlaceholderModel();
                return;
            }
            throw err;
        }

    // Grundbeleuchtung
    const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1.2);
    scene.add(hemi);

    // directional light controlled by UI
    const dir = new THREE.DirectionalLight(0xffffff, window.lightSettings.intensity);
    // position set from spherical coordinates
    const radA = window.lightSettings.azimuth * Math.PI/180;
    const radE = window.lightSettings.elevation * Math.PI/180;
    const lx = Math.cos(radE) * Math.cos(radA);
    const ly = Math.sin(radE);
    const lz = Math.cos(radE) * Math.sin(radA);
    dir.position.set(lx, ly, lz);
    scene.add(dir);
    window._dirLight = dir;

    // add helpers to improve debugging and visibility
    const grid = makeGridHelper(0.5);
    grid.position.y = -0.05;
    // make a very large grid and center it under the camera target each frame to simulate "infinite" grid
    grid.name = 'scene-grid';
    grid.userData.isHelper = true;
    scene.add(grid);
    window._sceneGrid = grid;
    // vertical grid (rotate to be vertical alongside Y axis, center at target) - useful to have X/Y plane grid
    const vgrid = makeGridHelper(0.5, true);
    vgrid.rotation.z = Math.PI/2; // rotate to be vertical on YZ plane
    vgrid.position.y = 0;
    vgrid.name = 'scene-vgrid';
    vgrid.userData.isHelper = true;
    scene.add(vgrid);
    window._sceneVGrid = vgrid;

    // helper: expose grid toggle
    window.toggleGrid = function(visibleH, visibleV){ if(window._sceneGrid) window._sceneGrid.visible = !!visibleH; if(window._sceneVGrid) window._sceneVGrid.visible = !!visibleV; };

    // set background color
    try{ if(renderer && typeof renderer.setClearColor === 'function') renderer.setClearColor(parseColor(window.backgroundColor) || 0x111111); } catch(e){ }

    window.setGridColors = function(major, minor){ window.gridColorMajor = major; window.gridColorMinor = minor; // rebuild grid to reflect new colors
        try{ rebuildGrid(); } catch(e){ console.warn('setGridColors rebuild failed', e);} try{ const mg = document.getElementById('col-grid-major'); const mn = document.getElementById('col-grid-minor'); if(mg) mg.value = window.gridColorMajor; if(mn) mn.value = window.gridColorMinor; } catch(e){} };
    window.setBackgroundColor = function(c){ window.backgroundColor = c; try{ renderer.setClearColor(parseColor(c)); }catch(e){}; try{ const el = document.getElementById('col-bg'); if(el) el.value = window.backgroundColor; } catch(e){} };
    window.setGridSpacing = function(s){ window.gridSpacing = parseFloat(s) || 1; try{ rebuildGrid(); } catch(e){}; try{ const el = document.getElementById('grid-spacing'); const elVal = document.getElementById('grid-spacing-value'); if(el){ el.value = window.gridSpacing; } if(elVal){ elVal.innerText = `${parseFloat(window.gridSpacing).toFixed(2)} m`; } } catch(e){} };
    window.setLightSettings = function(o){ window.lightSettings = Object.assign(window.lightSettings, o || {}); try{ if(window._dirLight){ window._dirLight.intensity = window.lightSettings.intensity; const radA = window.lightSettings.azimuth * Math.PI/180; const radE = window.lightSettings.elevation * Math.PI/180; window._dirLight.position.set(Math.cos(radE)*Math.cos(radA), Math.sin(radE), Math.cos(radE)*Math.sin(radA)); } } catch(e){ };
        try{ const li = document.getElementById('light-intensity'); const la = document.getElementById('light-azimuth'); const le = document.getElementById('light-elevation'); const liVal = document.getElementById('light-intensity-value'); const laVal = document.getElementById('light-az-value'); const leVal = document.getElementById('light-el-value'); if(li) li.value = window.lightSettings.intensity; if(la) la.value = window.lightSettings.azimuth; if(le) le.value = window.lightSettings.elevation; if(liVal) liVal.innerText = `${parseFloat(window.lightSettings.intensity).toFixed(2)}`; if(laVal) laVal.innerText = `${parseFloat(window.lightSettings.azimuth).toFixed(0)}°`; if(leVal) leVal.innerText = `${parseFloat(window.lightSettings.elevation).toFixed(0)}°`; } catch(e){} };
    window.setMarkerScaleFactor = function(f){ window.markerScaleFactor = parseFloat(f) || 1.0; try{ if(window.updateMarkerScales) window.updateMarkerScales(); } catch(e){}; try{ const el = document.getElementById('marker-scale'); const elVal = document.getElementById('marker-scale-value'); if(el){ el.value = window.markerScaleFactor; } if(elVal){ elVal.innerText = `${parseFloat(window.markerScaleFactor).toFixed(1)}x`; } } catch(e){} };
    window.setMarkerColor = function(c){ window.markerColor = c; try{ if(window && window.markerMeshes) window.markerMeshes.forEach(m=>{ if(m.material) m.material.color.set(c); }); } catch(e){}; try{ const el = document.getElementById('col-marker'); if(el) el.value = window.markerColor; } catch(e){} };

    // apply initial UI values so colors/spacing/light are applied at startup
    try{ window.setGridColors(window.gridColorMajor, window.gridColorMinor); } catch(e){}
    try{ window.setBackgroundColor(window.backgroundColor); } catch(e){}
    try{ window.setGridSpacing(window.gridSpacing); } catch(e){}
    try{ window.setLightSettings(window.lightSettings); } catch(e){}
    try{ window.setMarkerScaleFactor(window.markerScaleFactor); } catch(e){}

    window.setUnit = function(u){
        if(!window.unitMultiplier[u]) return;
        window.currentUnit = u;
        const mult = window.unitMultiplier[u];
        // re-scale active model if available
        if(activeModel){
            try{
                if(!activeModel.userData.originalScale) activeModel.userData.originalScale = activeModel.scale.clone();
                const base = activeModel.userData.originalScale.clone();
                activeModel.scale.set(base.x * mult, base.y * mult, base.z * mult);
                // adjust camera to fit
                const box = new THREE.Box3().setFromObject(activeModel);
                const center = box.getCenter(new THREE.Vector3());
                const radius = box.getBoundingSphere(new THREE.Sphere()).radius || 1;
                camera.position.set(center.x, center.y + radius*1.5, center.z + radius*1.5);
                controls.target.copy(center);
                controls.update();
            } catch(e){ console.warn('[sceneLoader] setUnit scale error', e); }
        }
        // adjust grid divisions based on multiplier
        if(window._sceneGrid){
            try{
                const t = controls && controls.target ? controls.target : new THREE.Vector3(0,0,0);
                const size = Math.max(0.5, Math.min(2000, Math.round(camera.position.distanceTo(t)*10)*10));
                scene.remove(window._sceneGrid);
                const ng = new THREE.GridHelper(size * mult, Math.max(10, Math.floor(size/1)), 0x333333, 0x222222);
                ng.name = 'scene-grid'; ng.userData.isHelper = true; ng.position.set(t.x, 0, t.z);
                scene.add(ng);
                window._sceneGrid = ng;
            }catch(e){ console.warn('[sceneLoader] setUnit grid error', e); }
        }
        // also update vertical grid if present
        if(window._sceneVGrid){
            try{
                const t = controls && controls.target ? controls.target : new THREE.Vector3(0,0,0);
                const size = Math.max(0.5, Math.min(2000, Math.round(camera.position.distanceTo(t)*10)*10));
                scene.remove(window._sceneVGrid);
                const vg = new THREE.GridHelper(size * mult, Math.max(10, Math.floor(size/1)), 0x333333, 0x222222);
                vg.rotation.z = Math.PI/2; vg.name = 'scene-vgrid'; vg.userData.isHelper = true; vg.position.set(t.x, t.y, t.z);
                scene.add(vg);
                window._sceneVGrid = vg;
            }catch(e){ console.warn('[sceneLoader] setUnit vgrid error', e); }
        }
        try{ if(window.updateMarkerScales && typeof window.updateMarkerScales === 'function') window.updateMarkerScales(); } catch(e){ }
    };
    const axes = new THREE.AxesHelper(0.1);
    scene.add(axes);
    axes.name = 'scene-axes';

    clock = new THREE.Clock();

    // Resize-Handling
    window.addEventListener('resize', () => {
            const w = container.clientWidth || Math.max(600, window.innerWidth - 40);
            const h = container.clientHeight || Math.max(320, Math.floor(window.innerHeight * 0.6));
            camera.aspect = w / h;
        camera.updateProjectionMatrix();
            renderer.setSize(w, h);
    });

    animate();
}

/**
 * Render-Schleife
 */
function animate() {
    requestAnimationFrame(animate);
    // keep grid centered at controls.target (simulate infinite grid)
    try{
        if(window._sceneGrid && controls){
            const t = controls.target || new THREE.Vector3(0,0,0);
            window._sceneGrid.position.set(t.x, 0, t.z);
            // scale grid size based on camera distance
            const dist = camera.position.distanceTo(t);
            const size = Math.max(0.5, Math.min(2000, Math.round(dist*10)*10));
            if(window._sceneGrid.geometry && window._sceneGrid.geometry.parameters && window._sceneGrid.geometry.parameters.size !== size){
                // replace grid with new size so divisions look regular
                scene.remove(window._sceneGrid);
                const ng = makeGridHelper(size);
                ng.name = 'scene-grid'; ng.userData.isHelper = true;
                ng.position.set(t.x, 0, t.z);
                scene.add(ng);
                window._sceneGrid = ng;
            }
        }
        // vertical grid: keep centered and resize similarly
        if(window._sceneVGrid && controls){
            const t = controls.target || new THREE.Vector3(0,0,0);
            // place vertical grid centered on camera target
            window._sceneVGrid.position.set(t.x, t.y, t.z);
            const dist = camera.position.distanceTo(t);
            const size = Math.max(0.5, Math.min(2000, Math.round(dist*10)*10));
            if(window._sceneVGrid.geometry && window._sceneVGrid.geometry.parameters && window._sceneVGrid.geometry.parameters.size !== size){
                scene.remove(window._sceneVGrid);
                const ng2 = makeGridHelper(size, true);
                ng2.rotation.z = Math.PI/2; ng2.name = 'scene-vgrid'; ng2.userData.isHelper = true;
                ng2.position.set(t.x, t.y, t.z);
                scene.add(ng2);
                window._sceneVGrid = ng2;
            }
        }
    } catch(e){ console.warn('[sceneLoader] grid update error', e); }
    try{ if(window.updateMarkerScales && typeof window.updateMarkerScales === 'function') window.updateMarkerScales(); } catch(e){ console.warn('[sceneLoader] updateMarkerScales failed', e); }
    renderer.render(scene, camera);
}

// Utility: parse hex color '#rrggbb' into integer for Three.js
function parseColor(hex){ try{ if(typeof hex === 'string' && hex.startsWith('#')) return parseInt(hex.substring(1), 16); return hex; } catch(e){ return 0x111111; } }

// Create a grid helper with current spacing and colors; vertical rotates if v=true
function makeGridHelper(size, v=false){
    const spacing = Math.max(0.01, Math.min(100, window.gridSpacing || 1));
    const divisions = Math.max(2, Math.min(200, Math.round(size / spacing)));
    const major = parseColor(window.gridColorMajor) || 0x333333;
    const minor = parseColor(window.gridColorMinor) || 0x222222;
    const gh = new THREE.GridHelper(size, divisions, major, minor);
    if(v){ gh.rotation.z = Math.PI/2; }
    gh.userData.isHelper = true;
    return gh;
}

// Rebuild both grids using the makeGridHelper function maintaining visibility state
function rebuildGrid(){
    try{
        const t = controls && controls.target ? controls.target : new THREE.Vector3(0,0,0);
        const size = Math.max(0.5, Math.min(2000, Math.round(camera.position.distanceTo(t)*10)*10));
        if(window._sceneGrid){ scene.remove(window._sceneGrid); }
        if(window._sceneVGrid){ scene.remove(window._sceneVGrid); }
        const g = makeGridHelper(size, false); g.position.set(t.x, 0, t.z); g.name = 'scene-grid';
        const vg = makeGridHelper(size, true); vg.position.set(t.x, t.y, t.z); vg.name = 'scene-vgrid';
        scene.add(g); scene.add(vg);
        window._sceneGrid = g; window._sceneVGrid = vg;
    }catch(e){ console.warn('rebuildGrid failed', e); }
}

/**
 * Lädt ein GLB/GLTF-Modell aus dem Backend (per URL).
 */
async function loadModel(url) {
    await window.waitForTHREE().catch(() => {});
    return new Promise((resolve, reject) => {
        console.log('[sceneLoader] loadModel', url, 'window.THREE present:', !!window.THREE, 'window.GLTFLoader:', !!window.GLTFLoader, 'window.THREE.GLTFLoader:', !!(window.THREE && window.THREE.GLTFLoader));
        if(window._USE_CANVAS_FALLBACK && window.CanvasFallback){ window.CanvasFallback.loadModel(url); resolve(); return; }
        const GLTFCtr = (window.THREE && window.THREE.GLTFLoader) || window.GLTFLoader;
        if(!GLTFCtr){
            console.warn('[sceneLoader] GLTFLoader not available, using CanvasFallback - checks:', { three: !!window.THREE, threeGLTF: !!(window.THREE && window.THREE.GLTFLoader), globalGLTF: !!window.GLTFLoader });
            if(window.CanvasFallback){ window.CanvasFallback.loadModel(url); resolve(); return; }
            reject(new Error('GLTFLoader not available'));
            return;
        }
        const loader = new GLTFCtr();

        loader.load(
            url,
                gltf => {
                    if (activeModel) scene.remove(activeModel);
                    activeModel = gltf.scene;
                    // record original scale for unit scaling
                    activeModel.userData = activeModel.userData || {};
                    activeModel.userData.originalScale = activeModel.scale.clone();
                    scene.add(gltf.scene);
                    // compute bounding sizes and show in status (mm/cm/m)
                    try{
                        const box = new THREE.Box3().setFromObject(activeModel);
                        const size = box.getSize(new THREE.Vector3());
                        const sx = size.x, sy = size.y, sz = size.z;
                        const sx_mm = sx*1000, sy_mm = sy*1000, sz_mm = sz*1000;
                        const msg = `Modell geladen — size: ${sx_mm.toFixed(1)}×${sy_mm.toFixed(1)}×${sz_mm.toFixed(1)} mm`;
                        const info = document.getElementById('status'); if(info) info.innerText = msg;
                    } catch(e){ console.warn('[sceneLoader] compute bbox failed', e); }
                    resolve(gltf.scene);
                },
            undefined,
            err => {
                console.error('[sceneLoader] loader error', err);
                reject(err);
            }
        );
    });
}

/**
 * Lädt ein Fallback-Modell, wenn kein File geladen ist
 * oder ein Modell fehlschlägt.
 */
function loadPlaceholderModel() {
    if (activeModel) scene.remove(activeModel);

    const group = new THREE.Group();

    // Oberer Körper (Organ-like)
    const geo1 = new THREE.SphereGeometry(0.1, 24, 24);
    const mat1 = new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness:0.1, roughness:0.7 });
    const sphere = new THREE.Mesh(geo1, mat1);
    sphere.position.set(0, 0.05, 0);

    // Unterer Körper (technisches Element)
    const geo2 = new THREE.BoxGeometry(0.18, 0.08, 0.12);
    const mat2 = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness:0.2, roughness:0.6 });
    const box = new THREE.Mesh(geo2, mat2);

    group.add(sphere);
    group.add(box);

    scene.add(group);
    activeModel = group;
    console.log('[sceneLoader] placeholder model added');
    return group;
}

/**
 * Lädt ein lokal ausgewähltes 3D-Modell (Upload).
 */
async function loadLocalModel(file) {
    console.log('[sceneLoader] loadLocalModel file: ', file.name, 'window.THREE present:', !!window.THREE);
    try {
    } catch (err) {
        console.warn('[sceneLoader] Using CanvasFallback for loadLocalModel', err);
        if(window.CanvasFallback){ window.CanvasFallback.loadLocalModel(file); return; }
        alert('Three.js wird momentan nicht geladen. Bitte überprüfen Sie die Entwicklerkonsole.');
        return;
    }
    if (!renderer) {
        try { await initScene(); } catch (err) { console.error('initScene failed during loadLocalModel', err); }
    }
    const reader = new FileReader();
    const ext = file.name.split('.').pop().toLowerCase();

    reader.onload = function (event) {
        const data = event.target.result;

        // GLB / GLTF
        if (ext === 'glb' || ext === 'gltf') {
                const GLTFCtr = (window.THREE && window.THREE.GLTFLoader) || window.GLTFLoader;
                if(!GLTFCtr){
                    console.warn('[sceneLoader] GLTFLoader not available for local model, using CanvasFallback', { three: !!window.THREE, threeGLTF: !!(window.THREE && window.THREE.GLTFLoader), globalGLTF: !!window.GLTFLoader });
                    if(window.CanvasFallback){ window.CanvasFallback.loadLocalModel(file); return; }
                    alert('GLTFLoader nicht verfügbar.');
                    return;
                }
                const loader = new GLTFCtr();
            loader.parse(data, '', gltf => {
                if (activeModel) scene.remove(activeModel);
                activeModel = gltf.scene;
                activeModel.userData = activeModel.userData || {};
                activeModel.userData.originalScale = activeModel.scale.clone();
                scene.add(gltf.scene);
                try{ const box = new THREE.Box3().setFromObject(activeModel); const size = box.getSize(new THREE.Vector3()); const sx_mm = size.x*1000; const sy_mm = size.y*1000; const sz_mm = size.z*1000; const info=document.getElementById('status'); if(info) info.innerText = `Local Modell geladen — ${sx_mm.toFixed(1)}×${sy_mm.toFixed(1)}×${sz_mm.toFixed(1)} mm`; } catch(e){}
            });
        }

        // OBJ
        else if (ext === 'obj') {
            try {
                const OBJCtr = (window.THREE && window.THREE.OBJLoader) || window.OBJLoader;
                if(!OBJCtr){
                    console.warn('[sceneLoader] OBJLoader not available for local model, using CanvasFallback');
                    if(window.CanvasFallback){ window.CanvasFallback.loadLocalModel(file); return; }
                    throw new Error('OBJLoader not available');
                }
                const loader = new OBJCtr();
                const obj = loader.parse(new TextDecoder().decode(data));
                if (activeModel) scene.remove(activeModel);
                activeModel = obj;
                scene.add(obj);
                try{ const box = new THREE.Box3().setFromObject(activeModel); const size = box.getSize(new THREE.Vector3()); const sx_mm = size.x*1000; const sy_mm = size.y*1000; const sz_mm = size.z*1000; const info=document.getElementById('status'); if(info) info.innerText = `Local OBJ geladen — ${sx_mm.toFixed(1)}×${sy_mm.toFixed(1)}×${sz_mm.toFixed(1)} mm`; } catch(e){}
            } catch (err) {
                console.error('[sceneLoader] OBJ parse error', err);
                alert('Beim Laden der OBJ-Datei ist ein Fehler aufgetreten.');
            }
        }

        // STL
        else if (ext === 'stl') {
            try {
                const STLCtr = (window.THREE && window.THREE.STLLoader) || window.STLLoader;
                if(!STLCtr){
                    console.warn('[sceneLoader] STLLoader not available for local model, using CanvasFallback');
                    if(window.CanvasFallback){ window.CanvasFallback.loadLocalModel(file); return; }
                    throw new Error('STLLoader not available');
                }
                const loader = new STLCtr();
                const geom = loader.parse(data);
                const mat = new THREE.MeshStandardMaterial({ color: 0x999999 });
                const mesh = new THREE.Mesh(geom, mat);
                if (activeModel) scene.remove(activeModel);
                activeModel = mesh;
                scene.add(mesh);
                try{ const box = new THREE.Box3().setFromObject(activeModel); const size = box.getSize(new THREE.Vector3()); const sx_mm = size.x*1000; const sy_mm = size.y*1000; const sz_mm = size.z*1000; const info=document.getElementById('status'); if(info) info.innerText = `Local STL geladen — ${sx_mm.toFixed(1)}×${sy_mm.toFixed(1)}×${sz_mm.toFixed(1)} mm`; } catch(e){}
            } catch (err) {
                console.error('[sceneLoader] STL parse error', err);
                alert('Beim Laden der STL-Datei ist ein Fehler aufgetreten.');
            }
        }

        else {
            alert("Nicht unterstütztes Dateiformat.");
        }
    };

    // Reader: OBJ benötigt Text, alle anderen ArrayBuffer
    if (ext === 'obj') reader.readAsArrayBuffer(file);
    else reader.readAsArrayBuffer(file);
}

