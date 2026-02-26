// Initialisiere WaveSurfer
const wavesurfer = WaveSurfer.create({
    container: '#waveform',
    waveColor: '#007bff',
    progressColor: '#0056b3',
    cursorColor: '#333',
    barWidth: 2,
    barRadius: 3,
    height: 128,
});

// Mikrofon-Plugin Logik würde hier erweitert werden für Live-Visualisierung
// Für dieses einfache Beispiel nutzen wir WaveSurfer primär zum Abspielen der Ergebnisse
// oder visualisieren erst nach der Aufnahme, um Komplexität gering zu halten.