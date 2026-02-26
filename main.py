from flask import Flask, render_template
import os
import importlib.util

app = Flask(__name__)
app.secret_key = 'maazi_de_lmu_secret_key_2025'  # Für Session-Funktionalität

# Homepage Route - Hauptseite (mit CorpBot und Links)
@app.route('/')
def home():
    return render_template('maazi_de/maazi_de.html')

# Toolkit Haupttseite Route
@app.route('/toolkit')
def toolkit():
    return render_template('index.html')

# Unterseite Route
@app.route('/hp')
def hp():
    return render_template('main.html')

# Modul # Dynamisch Blueprint für 3D Viewer importieren
spec = importlib.util.spec_from_file_location("viewer_bp_module", "1_3d_viewer/app.py")
viewer_bp_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(viewer_bp_module)
viewer_bp = viewer_bp_module.viewer_bp
app.register_blueprint(viewer_bp, url_prefix='/viewer')

# Modul # Import and register data analysis blueprint
spec_data = importlib.util.spec_from_file_location("data_bp_module", "2_data_analysis/app.py")
data_bp_module = importlib.util.module_from_spec(spec_data)
spec_data.loader.exec_module(data_bp_module)
data_bp = data_bp_module.data_bp
print("Data BP:", data_bp)
app.register_blueprint(data_bp, url_prefix='/data_analysis')

# Modul # Import and register sim_and_train blueprint
spec_sim = importlib.util.spec_from_file_location("sim_bp_module", "3_sim_and_train/app.py")
sim_bp_module = importlib.util.module_from_spec(spec_sim)
spec_sim.loader.exec_module(sim_bp_module)
sim_bp = sim_bp_module.sim_bp
app.register_blueprint(sim_bp, url_prefix='/sim_train')

# Modul # Import and register audio_anno_chat blueprint
audio_anno = importlib.util.spec_from_file_location("audio_bp_module", "4_audio_anno_chat/app.py")
audio_anno_bp_module = importlib.util.module_from_spec(audio_anno)
audio_anno.loader.exec_module(audio_anno_bp_module)
audio_anno_bp = audio_anno_bp_module.audio_anno_bp
app.register_blueprint(audio_anno_bp, url_prefix='/audio_anno')

# Modul # Import and register ai blueprint
ai_spec = importlib.util.spec_from_file_location("ai_bp_module", "5_ai/app.py")
ai_bp_module = importlib.util.module_from_spec(ai_spec)
ai_spec.loader.exec_module(ai_bp_module)
ai_bp = ai_bp_module.ai_bp
app.register_blueprint(ai_bp, url_prefix='/ai')

# Modul # Import and register wiki_trends blueprint
wiki_spec = importlib.util.spec_from_file_location("wiki_bp_module", "6_wiki_trends/app.py")
wiki_bp_module = importlib.util.module_from_spec(wiki_spec)
wiki_spec.loader.exec_module(wiki_bp_module)
wiki_bp = wiki_bp_module.wiki_bp
app.register_blueprint(wiki_bp, url_prefix='/wiki')

# Modul # Import and register com blueprint
com_spec = importlib.util.spec_from_file_location("com_bp_module", "7_com/app.py")
com_bp_module = importlib.util.module_from_spec(com_spec)
com_spec.loader.exec_module(com_bp_module)
com_bp = com_bp_module.com_bp
app.register_blueprint(com_bp, url_prefix='/com')

# Modul # jambit-power-hub ist ein FastAPI-Projekt (nicht Flask)
# Es läuft separat auf Port 8010 und kann nicht als Flask Blueprint registriert werden
# Um es zu starten: cd jambit-power-hub/backend && python main.py
print("Modulare Technische Tools für Chirurgische Innovationen - Bewerberprojekt")

print("Rules: ")
for rule in app.url_map.iter_rules():
  print(f"{rule.rule} -> {rule.endpoint}")

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
