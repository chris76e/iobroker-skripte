# 🤖 deebot-vis-telegram.js

Dieses ioBroker-Skript zeigt den aktuellen Status deines Deebot-Roboters in VIS und versendet passende Telegram-Nachrichten. Es erkennt automatisch den Reinigungsmodus (saugen, putzen, reinigen), meldet Fortschritt, Raumstatus, Trocknung und Ladezustand.

## 📦 Funktionen
- VIS-Textanzeige 
- Telegram-Benachrichtigungen bei Start, Reinigung, Abschluss, Trocknung, Laden
- Raumtracking über SpotArea-ID
- Moduserkennung über `cleaningMode`
- Trocknungs-Endzeit aus `endDateTime`
- Doppelte Meldungen nach Trocknung werden verhindert

## 🛠️ Voraussetzungen
- Adapter: `ecovacs-deebot`, `telegram`
- Datenpunkte:
  - `ecovacs-deebot.0.status.device`
  - `ecovacs-deebot.0.map.deebotPositionCurrentSpotAreaID`
  - `ecovacs-deebot.0.control.spotArea`
  - `0_userdata.0.Deebot.VISAnzeige`
  - `0_userdata.0.Deebot.VISAnzeigeJSON`

## 📊 VIS-Integration
- Textanzeige über `0_userdata.0.Deebot.VISAnzeige`
- **Emoji-freier Klartext** für VIS, damit die Anzeige neutral und übersichtlich bleibt
- JSON-Objekt für strukturierte Anzeige in VIS über `0_userdata.0.Deebot.VISAnzeigeJSON`


## 📤 Telegram
- Nachrichten über `telegram.0`
- Enthalten Emojis zur besseren Lesbarkeit (z. B. 🧼 Reinigung gestartet, 🔋 Akku voll)
- Nur neue Nachrichten werden gesendet (Duplikate werden gefiltert)


## 📁 Struktur
- `deebot-vis-telegram.js`: Hauptskript
- `README.md`: Setup und Beschreibung
- `changelog.md`: Versionshistorie

## 📜 Lizenz
MIT – frei nutzbar und anpassbar
