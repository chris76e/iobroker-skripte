# 🧠 deebot-alexa-sprachsteuerung

**Version:** 1.2.0  
**Datum:** 03.10.2025  

## 📌 Übersicht

Dieses Skript integriert deinen **Ecovacs Deebot** nahtlos mit **Amazon Alexa**, sodass du per Sprachbefehl direkt starten kannst:

- 🧹 **„sauge“ / „mache sauber“** → Nur Saugen  
- 🧽 **„putzen“** → Nur Wischen  
- 🧹🧽 **„reinige“ / „reinigen“** → Kombi-Modus (Saugen + Wischen)

Das Skript analysiert automatisch den gesprochenen Befehl, ermittelt die entsprechenden Räume aus deiner ioBroker-Konfiguration und startet die gewünschte Reinigung **ohne weitere manuelle Eingriffe**.

---

## ⚙️ Funktionsweise

- Sprachbefehle werden über `alexa2.0.History.summary` abgefangen.
- Räume werden aus dem Mapping-Datenpunkt `0_userdata.0.Deebot.MapNumberName` ermittelt.
- Je nach Schlüsselwort wird der passende **Reinigungsmodus** gesetzt:
  - `1` → Nur Saugen  
  - `2` → Nur Wischen  
  - `3` → Kombi (Saugen + Wischen)
- Mehrfache Durchgänge sind standardmäßig deaktiviert.
- Im Kombi-Modus wird der **cleaningMode = 3** dauerhaft gesetzt – der Deebot erledigt Saugen und Wischen automatisch hintereinander.

---

## 🧪 Log-Ausgaben

Das Skript schreibt detaillierte Log-Meldungen in ioBroker, z. B.:

- 🎤 Sprachbefehl erkannt: „reinige den Flur“  
- 🧠 Kombi-Modus erkannt – Deebot startet Saugen und wird danach automatisch wischen  
- 🚗 Der Deebot fährt jetzt los, um den Flur zu reinigen  
- ✅ Gesamte Reinigung abgeschlossen (Saugen + Wischen)

📢 **Wichtig:** Telegram- und VIS-Nachrichten werden hier **nicht erzeugt** – sie laufen in einem separaten Skript und bleiben unberührt.

---

## 🧰 Voraussetzungen

- ioBroker mit installiertem `alexa2.0`-Adapter  
- `ecovacs-deebot`-Adapter mit Zugriff auf Gerätedaten  
- Raum-Mapping JSON unter `0_userdata.0.Deebot.MapNumberName`

---

## 📜 Lizenz

Dieses Skript darf frei verwendet, angepasst und verteilt werden, solange ein Verweis auf den ursprünglichen Autor erhalten bleibt.

---

