// Load local three.js ES module and examples via dynamic imports.
export async function loadLocalThree(){
  console.log('[three-local-loader] Attempt to dynamically import local three modules');
  try{
    const THREE = await import('/sim_train/static/libs/three.module.js');
    const { OrbitControls } = await import('/sim_train/static/libs/examples/jsm/controls/OrbitControls.js');
    const { GLTFLoader } = await import('/sim_train/static/libs/examples/jsm/loaders/GLTFLoader.js');
    const { OBJLoader } = await import('/sim_train/static/libs/examples/jsm/loaders/OBJLoader.js');
    const { STLLoader } = await import('/sim_train/static/libs/examples/jsm/loaders/STLLoader.js');
    // Copy module namespace into a mutable object so we can attach extras
    const THREE_OBJ = Object.assign({}, THREE);
    THREE_OBJ.OrbitControls = OrbitControls;
    THREE_OBJ.GLTFLoader = GLTFLoader;
    THREE_OBJ.OBJLoader = OBJLoader;
    THREE_OBJ.STLLoader = STLLoader;
    window.THREE = THREE_OBJ;
    // also set direct globals for loaders/controls for non-module code
    window.OrbitControls = OrbitControls;
    window.GLTFLoader = GLTFLoader;
    window.OBJLoader = OBJLoader;
    window.STLLoader = STLLoader;
    // debug info: log which constructors and helpers we attached
    try{ console.log('[three-local-loader] attached to window.THREE keys:', Object.keys(window.THREE).slice(0,50)); } catch(e){}
      try{ console.log('[three-local-loader] THREE module REVISION:', window.THREE && window.THREE.REVISION); } catch(e){}
    try{ console.log('[three-local-loader] globals set:', !!window.OrbitControls, !!window.GLTFLoader, !!window.OBJLoader, !!window.STLLoader); } catch(e){}
    console.log('[three-local-loader] local three modules imported and attached to window.THREE');
    try{ document.getElementById('status') && (document.getElementById('status').innerText = 'Local Three.js loaded'); } catch(e){}
    return window.THREE;
  }catch(err){
    console.warn('[three-local-loader] Could not import local three modules', err);
    throw err;
  }
}
// make a simple global alias for non-module callers
window.loadLocalThree = loadLocalThree;
