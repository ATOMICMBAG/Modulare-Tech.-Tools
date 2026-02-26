#!/usr/bin/env python3
"""
Simple installer to fetch Three.js ES module and UMD builds and example loaders/controls
into static/libs/ so the app can load local copies when CDNs are blocked.

Usage:
  python static/libs/install_three.py

Note: requires network access from the machine running this script.
"""
import os
import sys
from urllib.request import urlopen, Request
from urllib.error import URLError, HTTPError

BASE = os.path.join(os.path.dirname(__file__))
TARGETS = [
    ("https://unpkg.com/three@0.154.0/build/three.module.js", "three.module.js"),
    ("https://unpkg.com/three@0.154.0/build/three.min.js", os.path.join('build','three.min.js')),
    ("https://unpkg.com/three@0.154.0/examples/jsm/controls/OrbitControls.js", os.path.join('examples','jsm','controls','OrbitControls.js')),
    ("https://unpkg.com/three@0.154.0/examples/jsm/loaders/GLTFLoader.js", os.path.join('examples','jsm','loaders','GLTFLoader.js')),
    ("https://unpkg.com/three@0.154.0/examples/jsm/loaders/OBJLoader.js", os.path.join('examples','jsm','loaders','OBJLoader.js')),
    ("https://unpkg.com/three@0.154.0/examples/jsm/loaders/STLLoader.js", os.path.join('examples','jsm','loaders','STLLoader.js')),
    # utils used by loaders
    ("https://unpkg.com/three@0.154.0/examples/jsm/utils/BufferGeometryUtils.js", os.path.join('examples','jsm','utils','BufferGeometryUtils.js')),
    ("https://unpkg.com/three@0.154.0/examples/jsm/utils/SkeletonUtils.js", os.path.join('examples','jsm','utils','SkeletonUtils.js')),
    # UMD examples for fallback
    ("https://unpkg.com/three@0.154.0/examples/js/controls/OrbitControls.js", os.path.join('examples','js','controls','OrbitControls.js')),
    ("https://unpkg.com/three@0.154.0/examples/js/loaders/GLTFLoader.js", os.path.join('examples','js','loaders','GLTFLoader.js')),
    ("https://unpkg.com/three@0.154.0/examples/js/loaders/OBJLoader.js", os.path.join('examples','js','loaders','OBJLoader.js')),
    ("https://unpkg.com/three@0.154.0/examples/js/loaders/STLLoader.js", os.path.join('examples','js','loaders','STLLoader.js')),
]

HEADERS = {'User-Agent': 'three-installer/1.0'}


def ensure_dir(path):
    d = os.path.dirname(path)
    if d and not os.path.exists(d):
        os.makedirs(d, exist_ok=True)


def fetch_and_write(url, outpath):
    print(f"Fetching {url} -> {outpath}")
    req = Request(url, headers=HEADERS)
    try:
        with urlopen(req, timeout=30) as r:
            data = r.read()
            ensure_dir(outpath)
            with open(outpath, 'wb') as f:
                f.write(data)
        print("  OK")
        return True
    except HTTPError as e:
        print(f"  HTTP Error: {e.code} {e.reason}")
    except URLError as e:
        print(f"  URL Error: {e}")
    except Exception as e:
        print(f"  Error: {e}")
    return False


def main():
    print("Installing Three.js local libs into:", BASE)
    success = True
    for url, rel in TARGETS:
        target = os.path.join(BASE, rel)
        ok = fetch_and_write(url, target)
        success = success and ok
    if success:
        print("\nAll files downloaded successfully. You can now reload the simulator page and it will prefer local modules.")
    else:
        print("\nSome files failed to download. Check network access and try again.")


if __name__ == '__main__':
    main()
