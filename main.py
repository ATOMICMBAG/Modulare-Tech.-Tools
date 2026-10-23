from flask import Flask, render_template, jsonify, redirect, url_for
import os
import secrets
import importlib.util

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

app = Flask(__name__)

# Secret Key aus der Umgebung (z.B. systemd: Environment=SECRET_KEY=...).
# Ohne Variable wird ein zufälliger Key pro Start erzeugt (Sessions gelten dann nur bis zum Neustart).
app.secret_key = os.environ.get('SECRET_KEY') or secrets.token_hex(32)
if not os.environ.get('SECRET_KEY'):
    print("WARNUNG: SECRET_KEY nicht gesetzt - verwende zufälligen Key für diesen Start.")

# Templates bei jeder Anfrage neu einlesen: Änderungen per Upload sind nach einem Reload sichtbar, ohne Neustart.
app.config['TEMPLATES_AUTO_RELOAD'] = True

# Upload-Limit (Gesamtgröße pro Request), per MAX_UPLOAD_MB anpassbar. Standard: 200 MB (DICOM/STL).
app.config['MAX_CONTENT_LENGTH'] = int(os.environ.get('MAX_UPLOAD_MB', '200')) * 1024 * 1024


@app.errorhandler(413)
def too_large(_e):
    limit_mb = app.config['MAX_CONTENT_LENGTH'] // (1024 * 1024)
    return jsonify({"status": "error", "message": f"Datei zu groß (max. {limit_mb} MB)"}), 413


# Homepage Route - Portfolio-Hauptseite (liegt nur auf dem Server, nicht im Repo).
# Ohne diese Datei (z.B. frischer Clone) landet man direkt im Toolkit.
PORTFOLIO_TEMPLATE = 'maazi_de/maazi_de.html'

@app.route('/')
def home():
    if os.path.exists(os.path.join(app.root_path, 'templates', PORTFOLIO_TEMPLATE)):
        return render_template(PORTFOLIO_TEMPLATE)
    return redirect(url_for('toolkit'))

# Toolkit Haupttseite Route
@app.route('/toolkit', strict_slashes=False)
def toolkit():
    return render_template('index.html')

# Unterseite Route
@app.route('/hp')
def hp():
    return render_template('main.html')


def register_module(folder, module_name, bp_attr, url_prefix):
    """Lädt <folder>/app.py (absoluter Pfad, unabhängig vom Arbeitsverzeichnis) und registriert den Blueprint."""
    spec = importlib.util.spec_from_file_location(module_name, os.path.join(BASE_DIR, folder, 'app.py'))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    app.register_blueprint(getattr(module, bp_attr), url_prefix=url_prefix)


register_module('1_3d_viewer', 'viewer_bp_module', 'viewer_bp', '/viewer')
register_module('2_data_analysis', 'data_bp_module', 'data_bp', '/data_analysis')
register_module('3_sim_and_train', 'sim_bp_module', 'sim_bp', '/sim_train')
register_module('4_audio_anno_chat', 'audio_bp_module', 'audio_anno_bp', '/audio_anno')
register_module('5_ai', 'ai_bp_module', 'ai_bp', '/ai')
register_module('6_wiki_trends', 'wiki_bp_module', 'wiki_bp', '/wiki')
register_module('7_com', 'com_bp_module', 'com_bp', '/com')

# jambit-power-hub ist ein FastAPI-Projekt (nicht Flask)
# Es läuft separat auf Port 8010 und kann nicht als Flask Blueprint registriert werden
# Um es zu starten: cd jambit-power-hub/backend && python main.py
print("Modulare Technische Tools für Chirurgische Innovationen - Bewerberprojekt")

print("Rules: ")
for rule in app.url_map.iter_rules():
  print(f"{rule.rule} -> {rule.endpoint}")

if __name__ == '__main__':
    # Standard: nur lokal erreichbar (Apache-Proxy läuft auf demselben Server) und ohne Debugger.
    # Lokal entwickeln: FLASK_DEBUG=1 python main.py
    app.run(
        debug=os.environ.get('FLASK_DEBUG') == '1',
        host=os.environ.get('HOST', '127.0.0.1'),
        port=int(os.environ.get('PORT', '5000')),
    )
