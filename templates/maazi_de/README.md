# maazi.de - Professionelle Software Lösungen

## Projektübersicht
maazi.de ist eine professionelle Webseite für maßgeschneiderte Softwarelösungen, die seit langer Zeit online unter [https://maazi.de](https://maazi.de) erreichbar ist. Die Webseite läuft auf einem IONOS VPS mit Ubuntu und Plesk, wobei nur Apache HTTP & HTTPS Konfigurationen möglich sind.

## Technologiestack

### Frontend
- **HTML5** - Semantische Struktur
- **CSS3** - Responsive Design mit CSS Grid und Flexbox
- **JavaScript ES6+** - Moderne JavaScript-Features
- **Google Fonts** - Roboto Schriftart

### Backend & Infrastruktur
- **IONOS VPS** - Hosting-Umgebung
- **Apache HTTP Server** - Webserver
- **HTTPS** - Sichere Verbindung

## Projektstruktur

```
maazi_de/
├── maazi_de.html          # Haupt-HTML-Datei
├── css/
│   └── style.css         # Haupt-CSS-Datei
└── js/
    └── main.js           # JavaScript-Datei
```

## Funktionalitäten

### Navigation
- Mobile-responsive Navigation mit Hamburger-Menü
- Smooth Scrolling zu den verschiedenen Sektionen
- Scroll-Effekte für die Navigation

### KI-Sandbox
- Integrierte KI-Tools über iframe
- Vollbild-Modus für KI-Tools
- Verschiedene KI-Tools (Qwen3-Coder, hunyuan3d, sparc3d, etc.)

### Responsive Design
- Mobile-First Ansatz
- Breakpoint bei 768px
- Flexibles Grid-System

## Installation & Bereitstellung

### Lokale Entwicklung
1. Die HTML-Datei kann direkt im Browser geöffnet werden
2. Alle Ressourcen sind lokal verlinkt
3. Keine zusätzlichen Abhängigkeiten erforderlich

### Server-Bereitstellung
1. Dateien auf IONOS VPS hochladen
2. Plesk-Konfiguration für Apache
3. HTTPS-Zertifikat einrichten
4. Port-Konfiguration (HTTP/HTTPS)

## Wichtige Hinweise

### Hosting-Umgebung
- IONOS VPS mit Ubuntu
- Plesk als Control Panel
- Nur Apache HTTP & HTTPS Konfigurationen möglich
- Alle Port-Freigaben sind eingerichtet

### Dateizugriffe
- Statische Dateien werden über `/static/` aufgerufen
- AI-Tools werden über externe URLs geladen
- Externes CSS von Google Fonts

## Kontakt & Support
- E-Mail: info@maazi.de
- Impressum und Datenschutzerklärung sind integriert
- KI-Sandbox unter: https://ai.maazi.de/

## Lizenz
Das Projekt verwendet Open Source Technologien und ist für professionelle Zwecke konzipiert.