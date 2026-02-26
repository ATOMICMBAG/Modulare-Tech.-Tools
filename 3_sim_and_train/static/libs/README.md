# Local Three.js libraries

In environments with strict tracking protection that blocks remote CDNs, copy the necessary Three.js files into this directory and include them via the UMD fallback in templates or change the templates to prefer local copies.

Files to add:
- three.min.js (from https://unpkg.com/three@0.154.0/build/three.min.js)
- examples/js/controls/OrbitControls.js
- examples/js/loaders/GLTFLoader.js
- examples/js/loaders/OBJLoader.js
- examples/js/loaders/STLLoader.js

Deploy steps:
1. Download the above files from a machine that can access the CDN and place them under `static/libs/`.
2. Update `templates/simulator.html` to load local files instead of CDN if desired.
3. Restart the web server.

You can also host the ES module builds locally if your preferences require <script type="module"> imports:
- three.module.js
- examples/jsm/controls/OrbitControls.js
- examples/jsm/loaders/GLTFLoader.js
- examples/jsm/loaders/OBJLoader.js
- examples/jsm/loaders/STLLoader.js

Note: This repository doesn't include the Three.js binaries due to licensing and distribution considerations. Please obtain the files from the official Three.js distribution.
