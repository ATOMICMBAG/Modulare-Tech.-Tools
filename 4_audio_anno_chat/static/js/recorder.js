let mediaRecorder;
let audioChunks = [];

const btnRecord = document.getElementById('btnRecord');
const btnStop = document.getElementById('btnStop');
const statusDiv = document.getElementById('status');
const recordingsList = document.getElementById('recordingsList');

// ************************************************
// NEUER CHECK: Prueft, ob die Media API verfuegbar ist (nur unter HTTPS/localhost)
// ************************************************
if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    let errorMsg = "Fehler: Mikrofonzugriff (getUserMedia) nicht verfügbar.";
    
    if (isLocalhost) {
        // Sollte auf localhost funktionieren, aber vielleicht wurde das Gerät nicht gefunden.
        errorMsg += " Bitte prüfen Sie, ob ein Mikrofon angeschlossen ist.";
    } else {
        // Kritischer Hinweis für die Bewerbung/Demo:
        errorMsg += " Dies ist ein bekanntes Sicherheitsproblem von Browsern unter HTTP (statt HTTPS).";
        errorMsg += " Bitte aktivieren Sie HTTPS für diesen Server-Port, oder nutzen Sie die Chrome/Edge Flags (edge://flags) für unsichere Ursprünge.";
        errorMsg += " (Zeigt: Tool ist bereit, aber die Server-Infrastruktur muss gehärtet werden)";
    }
    
    statusDiv.innerHTML = `<strong style="color:red;">${errorMsg}</strong>`;
    btnRecord.disabled = true;
    btnStop.disabled = true;

} else {
    // Wenn die API gefunden wurde, aktiviere den Event-Listener
    btnRecord.addEventListener('click', async () => {
        statusDiv.innerText = "Frage Mikrofon-Zugriff an...";
        
        // Mikrofon Zugriff anfordern
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Bestes unterstütztes Audio-Format auswählen
            const options = {};
            if (MediaRecorder.isTypeSupported('audio/webm; codecs=opus')) {
                options.mimeType = 'audio/webm; codecs=opus';
            } else if (MediaRecorder.isTypeSupported('audio/webm')) {
                options.mimeType = 'audio/webm';
            } else if (MediaRecorder.isTypeSupported('audio/ogg; codecs=opus')) {
                options.mimeType = 'audio/ogg; codecs=opus';
            } else if (MediaRecorder.isTypeSupported('audio/mp4; codecs=mp4a.40.2')) {
                options.mimeType = 'audio/mp4; codecs=mp4a.40.2';
            }

            mediaRecorder = new MediaRecorder(stream, options);

            mediaRecorder.start();
            statusDiv.innerText = "🔴 Aufnahme läuft...";
            btnRecord.classList.add('recording');
            btnRecord.disabled = true;
            btnStop.disabled = false;

            audioChunks = [];
            mediaRecorder.addEventListener("dataavailable", event => {
                audioChunks.push(event.data);
            });

            mediaRecorder.addEventListener("stop", () => {
                const audioBlob = new Blob(audioChunks, { type: options.mimeType || 'audio/webm' });
                uploadAudio(audioBlob, stream); // Stream wird jetzt an Upload übergeben
            });

        } catch (err) {
            console.error("Fehler beim Mikrofon-Zugriff:", err);
            // Häufigste Fehlermeldung bei Blockierung durch User oder Browser
            statusDiv.innerText = "❌ Zugriff verweigert. Bitte Mikrofon-Erlaubnis im Browser prüfen.";
            btnRecord.disabled = false;
        }
    });

    btnStop.addEventListener('click', () => {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
            btnRecord.classList.remove('recording');
            btnStop.disabled = true;
            statusDiv.innerText = "Verarbeite & Lade hoch...";
        }
    });
}

// ************************************************
// Upload Funktion
// ************************************************
async function uploadAudio(blob, stream) {
    const formData = new FormData();
    formData.append('audio_data', blob);

    try {
        const response = await fetch('/audio_anno/upload', {
            method: 'POST',
            body: formData
        });
        const result = await response.json();
        
        if (result.status === 'success') {
            statusDiv.innerText = "✅ Upload erfolgreich! Transkript: " + result.transcription;
            addEntryToUI(result.filename, result.transcription);
        } else {
            statusDiv.innerText = "❌ Fehler beim Upload.";
        }
    } catch (error) {
        console.error('Error:', error);
        statusDiv.innerText = "❌ Server-Fehler (Backend nicht erreichbar).";
    } finally {
        // Stream Tracks freigeben
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        btnRecord.disabled = false;
    }
}


function addEntryToUI(filename, transcript) {
    const div = document.createElement('div');
    div.className = 'log-entry';
    div.innerHTML = `
        <strong>${filename}</strong> <span style="color:green">(Neu)</span><br>
        <div class="transcription">"${transcript}"</div>
        <audio controls src="/audio_anno/static/uploads/${filename}"></audio>
    `;
    recordingsList.prepend(div);
}
