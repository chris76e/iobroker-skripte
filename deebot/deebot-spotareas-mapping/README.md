# 🗺️ Deebot SpotAreas → JSON Mapping mit Telegram

Dieses ioBroker-Skript liest automatisch alle SpotAreas einer Deebot-Karte aus, erstellt daraus ein JSON-Mapping und sendet die Informationen per Telegram.  
Es erkennt Änderungen an der Karte oder den SpotAreas automatisch und aktualisiert die Daten sofort.

---

## 🚀 Funktionen

- 🧠 Automatisches Auslesen aller SpotAreas aus der aktuellen Karte  
- 📊 JSON-Mapping im Datenpunkt `0_userdata.0.Deebot.MapNumberName`  
- 📩 Telegram-Benachrichtigungen bei Änderungen  
- 🗺️ Erkennung neuer Karten-IDs und Meldung per Telegram  

---

## 🧩 Voraussetzungen

- ioBroker mit folgenden Adaptern:
  - `ecovacs-deebot` (für SpotAreas)
  - `telegram` (für Benachrichtigungen)
- Datenpunkt `0_userdata.0.Deebot.MapNumberName` wird automatisch angelegt, falls nicht vorhanden.

---

## ⚙️ Verwendung

1. Skript unter `scripts/deebot-spotareas/deebot_spotareas_mapping_v1.0.0.js` speichern.  
2. Telegram-Instanz ggf. anpassen (`TELEGRAM_INSTANZ`).  
3. Skript aktivieren.  
4. Fertig ✅ – JSON-Mapping und Telegram-Nachrichten funktionieren automatisch.

---

## 📬 Beispielausgabe (Telegram)

