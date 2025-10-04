# 🧹 Deebot JSON Logger

## 📌 Übersicht

Dieses Skript überwacht automatisch die Reinigungsaktivitäten eines Ecovacs Deebot im ioBroker-System.  
Es misst **Start- und Endzeit**, berechnet **Gesamtdauer**, erfasst **Flächenleistung** und erkennt den **Reinigungsmodus**.  
Alle erfassten Daten werden als JSON-Objekt in `0_userdata` gespeichert, Statusdatenpunkte aktualisiert und ein vollständiges Reinigungsprotokoll erstellt.

---

## ⚙️ Funktionen

- 🕐 **Zeitmessung:** Startzeit, Endzeit und Gesamtdauer der Reinigung  
- 🧽 **Raum- und Flächeninformationen:** Erfasster Bereich in m²  
- 🔁 **Reinigungsmodus-Erkennung:** Saugen, Wischen, kombiniert usw.  
- 📊 **JSON-Protokoll:** Speicherung aller Reinigungsvorgänge in `0_userdata.0.Deebot.JSON`  
- 📍 **Statuspunkte:** Automatische Aktualisierung aller relevanten Statuswerte  
- 🪄 **Übersetzung:** Automatische Umwandlung von Modus-Codes in verständliche Bezeichnungen

---

## 📁 Voraussetzungen

- ioBroker JavaScript-Adapter installiert und aktiv  
- Ecovacs-Deebot-Adapter installiert und eingerichtet  
- Schreibrechte für `0_userdata.0.*` Datenpunkte

---

## 📂 Erstinstallation

1. Erstelle im ioBroker JavaScript-Adapter ein neues Skript.  
2. Kopiere den Inhalt aus `deebot_json_logger.js` hinein.  
3. Stelle sicher, dass die Datenpunkte aus deinem Deebot-Adapter korrekt mit denen im Skript übereinstimmen.  
4. Starte das Skript – die JSON-Protokollierung läuft nun automatisch bei jeder Reinigung.

---

## 📊 Gespeicherte Datenstruktur (`0_userdata.0.Deebot.JSON`)

Beispiel eines gespeicherten Eintrags:

```json
{
  "Raum": "Wohnzimmer",
  "Datum": "2025-10-04",
  "Timestamp": "2025-10-04T12:34:56Z",
  "Fläche": "28",
  "Dauer": "24:32",
  "Gesamtdauer": "26:12",
  "Reinigungsmodus": "saugen und wischen",
  "Effizienz": "tief",
  "Startzeit": "12:08",
  "Endzeit": "12:34"
}

