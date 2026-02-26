
# Simulations- & Trainings-Modul (3_sim_and_train)

Kurze Instruktion und Übersicht für das Modul.

Endpoints
- `/` → Szenario-Übersicht
- `/simulator/<scenario_id>` → Simulator-View
- `/api/scenario/<scenario_id>` → liefert die Szenario-Definition als JSON
- `/api/evaluate` → wertet Trainings-Logs aus und gibt Kennzahlen zurück (POST JSON)
- `/api/export_csv` → lädt Trainings-Events als CSV herunter (POST JSON)
- `/api/export_json` → lädt die Metriken/Events JSON herunter (POST JSON)
- `/results` → Seite zur Anzeige einer Bewertungs-JSON (POST: `result` form field or JSON body)

Frontend
- `templates/sim_index.html` → Einstiegsseite: Szenarienliste
- `templates/simulator.html` → 3D-Viewer und Controls
- `templates/results.html` → Darstellung des Bewertungs-Output

Add new scenarios
- Szenarien liegen im `scenarios/`-Verzeichnis als JSON-Dateien.
- Minimal-Felder: `meta`, `scene` (mit `model` und `target_point`) und `workflow`.

Sample scenarios:
- `liver_basic.json` → Leber-marking baseline scenario
- `training_paths.json` → Pfad-Following example with multiple path points

- Mit dem Haupt-Launcher: python3 main.py (startet alle Module unter ihren Prefixes)
- Direkter Test: python3 app.py in diesem Modul-Ordner außer in blueprint-mode.

Logs
- Evaluationsläufe werden unter `logs/` persistiert. Sie können die Logs über `/sim_train/logs` im Browser ansehen und herunterladen.
- Mit dem Haupt-Launcher: python3 main.py (startet alle Module unter ihren Prefixes)
- Direkter Test: python3 app.py in diesem Modul-Ordner außer in blueprint-mode.

Weitere Hinweise
- Frontend verwendet Three.js für die Visualisierung. Falls Renderer nicht angezeigt wird: Stelle sicher, dass `#viewer` ausreichend hohe Höhe hat.
- Die Export-CSV und Export-JSON Buttons erzeugen client-side Downloads via server-endpoints.

Local Three.js libraries
- In restrictive environments, browser tracking prevention may block CDN scripts (Three.js). To avoid this, copy Three.js ES module or UMD files into `static/libs/` and the page will prefer local modules before falling back to CDN or UMD unpkg.
- Files to download: `three.module.js` or `three.min.js`, and examples loaders/controls (`examples/jsm/...` or `examples/js/...`) — see `static/libs/README.md` for details.

Canvas fallback
- If Three.js fails to load (e.g., due to tracking prevention or CDN CORS issues), the app now initializes a JavaScript canvas fallback that shows a placeholder model and permits marker placement and export of events. The fallback supports basic drag-to-rotate and wheel-to-zoom gestures to simulate camera movement. This preserves the ability to demonstrate workflows and collect logs even when 3D visualization is blocked.
- To fully use 3D visualization with Three.js, add local copies of the ES module files into `static/libs/` as described above.

Install local Three.js libs
- A helper script `static/libs/install_three.py` downloads a local copy of the Three.js ES/UMD builds and example loaders/controls into `static/libs/` so the app will prefer local copies.
- Run the installer from the repository root:
```
python static/libs/install_three.py
```
- After successful download, reload `/simulator/<scenario_id>` to use local files (no more CORS/MIME/Tracking-Prevention blocking).
