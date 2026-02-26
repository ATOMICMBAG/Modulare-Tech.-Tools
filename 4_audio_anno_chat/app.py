import os
import time
from flask import Blueprint, render_template, request, jsonify, current_app, send_from_directory
import logging

# NEU: KI-Imports
try:
    import whisper
except ImportError:
    print("WARNUNG: 'whisper' Bibliothek nicht gefunden. Bitte 'pip install openai-whisper' ausfuehren.")
    whisper = None

# ----------------------------------------------------------------------
# KI MODELL INITIALISIERUNG
# ----------------------------------------------------------------------
WHISPER_MODEL = None
if whisper:
    try:
        # Lade das 'tiny'-Modell. Es ist klein und schnell, aber weniger genau als 'base' oder 'medium'.
        print("--- Lade Whisper KI Modell (tiny) DEUTSCH. Bitte warten... (Kann 30-60s dauern) ---")
        # Das Modell wird einmal geladen und im Arbeitsspeicher gehalten.
        WHISPER_MODEL = whisper.load_model("tiny")
        print("--- Whisper Modell erfolgreich geladen. ---")
    except Exception as e:
        print(f"FEHLER beim Laden des Whisper Modells: {e}. Pruefe torch und ffmpeg Installation.")

audio_anno_bp = Blueprint('audio_anno', __name__, template_folder='templates', static_folder='static')

# Konfiguration
UPLOAD_FOLDER = os.path.join(audio_anno_bp.root_path, 'static/uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@audio_anno_bp.route('/')
def index():
    print("Audio anno index called")
    # Listet vorhandene Aufnahmen auf
    files = [f for f in os.listdir(UPLOAD_FOLDER) if f.endswith('.wav') or f.endswith('.webm')]
    return render_template('audio_anno_index.html', files=files)

@audio_anno_bp.route('/upload', methods=['POST'])
def upload_audio():
    if 'audio_data' not in request.files:
        return jsonify({"status": "error", "message": "Keine Audio-Daten gefunden"}), 400

    file = request.files['audio_data']
    timestamp = int(time.time())
    filename = f"rec_{timestamp}.webm" # Browser senden oft webm
    filepath = os.path.join(UPLOAD_FOLDER, filename)

    file.save(filepath)

    # ----------------------------------------------------------------------
    # KI Transkription
    # ----------------------------------------------------------------------
    transkript = "KI-Modul inaktiv."

    if WHISPER_MODEL:
        try:
            # Transkribiere die Datei.
            # fp16=False: Vermeidet GPU-Nutzung, falls nicht vorhanden (normal bei VPS)
            # language="de": Beschleunigt die Erkennung, da nur Deutsch gesucht wird
            result = WHISPER_MODEL.transcribe(filepath, fp16=False, language="de")
            transkript = result["text"]

            # Optional: Wenn die Transkription zu leer ist
            if not transkript.strip():
                 transkript = "Transkription erfolgreich, aber der Text war leer oder nicht erkennbar."

        except Exception as e:
            current_app.logger.error(f"Fehler bei Whisper-Transkription von {filename}: {e}")
            transkript = f"KI-FEHLER: Transkription fehlgeschlagen ({str(e)}). Pruefe ffmpeg."
    else:
        transkript = "KI-FEHLER: Whisper Modell nicht initialisiert. Pruefe Server-Konsole beim Start."

    return jsonify({
        "status": "success",
        "filename": filename,
        "transcription": transkript
    })

@audio_anno_bp.route('/static/uploads/<path:filename>')
def upload_files(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)
