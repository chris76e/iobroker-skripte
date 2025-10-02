# 🤖 Alexa Sprachsteuerung für Deebot – v1.1.0

Dieses ioBroker-Skript erweitert deinen Deebot-Saugroboter um eine natürliche Alexa-Sprachsteuerung.  
Es erkennt verschiedene Befehle wie „sauge Wohnzimmer“, „putze Küche“ oder „reinige alles zweimal“ und startet automatisch die passende Reinigung.

---

## 🚀 Features

- 🧠 Intelligente Sprachlogik für Saugen, Wischen oder Kombi-Modus  
- 🗺️ Automatische Raum-Erkennung anhand des Mapping-Datenpunkts  
- 🔁 Unterstützung mehrerer Durchgänge („zweimal“, „dreimal“, etc.)  
- 📍 Spot-Reinigung möglich („spotreinigung“)  
- 📬 Telegram-Benachrichtigung bei Statuswechseln

---

## 🧩 Unterstützte Befehle

| Beispielbefehl                          | Funktion                                   |
|----------------------------------------|--------------------------------------------|
| „Alexa, mache sauber im Wohnzimmer“    | Saugt Wohnzimmer                            |
| „Alexa, putze Küche“                   | Wischt Küche                                |
| „Alexa, reinige Schlafzimmer zweimal“  | Kombi-Modus Schlafzimmer, 2× saugen, 1× wischen |
| „Alexa, Spotreinigung“                | Startet Spotreinigung an aktueller Position |

---

## ⚙️ Voraussetzungen

- ioBroker mit installiertem Adapter:
  - `alexa2` (für Sprachbefehle)
  - `ecovacs-deebot` (für Robotersteuerung)
  - `telegram` (optional, für Benachrichtigungen)
- Ein JSON-Mapping deiner Räume unter:  
  `0_userdata.0.Deebot.MapNumberName`

---

## 🛠️ Installation

1. Skript-Datei `alexa_deebot_voicecontrol_v1.1.0.js` in ioBroker `scripts/`-Ordner kopieren.  
2. Datenpunkte ggf. anpassen (siehe Variablen im oberen Bereich).  
3. Skript aktivieren – fertig ✅

---

## 🧾 Changelog

👉 Siehe [CHANGELOG.md](./CHANGELOG.md) für alle Versionen und Änderungen.
