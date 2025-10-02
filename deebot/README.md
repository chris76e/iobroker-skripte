# 🤖 Deebot Skripte für ioBroker

Dieses Repository enthält eine Sammlung modularer JavaScript-Skripte für die Integration, Automatisierung und Steuerung eines **Ecovacs Deebot** Roboters innerhalb von **ioBroker**.  
Die Skripte sind bewusst **getrennt und unabhängig voneinander** aufgebaut, um Stabilität, einfache Wartung und flexible Erweiterbarkeit sicherzustellen.

---

## 📜 Übersicht der Skripte

### 1. `deebot-vis-telegram.js`
**Funktion:**  
Erstellt aussagekräftige Statusmeldungen zu allen Phasen der Deebot-Aktivität und sendet sie sowohl an das Telegram-Messenger-Plugin als auch an eine VIS-Visualisierung.

**Details & Features:**  
- Erkennung von Statusänderungen (Reinigung, Rückkehr, Laden, Mop-Reinigung & -Trocknung)  
- Automatische Telegram-Benachrichtigungen mit Status, Uhrzeit und Dauer  
- VIS-Textobjekte für Dashboards inkl. JSON-Datenstruktur  
- Intelligente Zeitformatierung & nur eine korrekte Trocknungszeit  
- Automatische Statusmeldung nach Mop-Trocknung  

**Typische Trigger:**  
- Statusänderung des Roboters (`device`, `cleanstatus`, `airDrying` usw.)  
- Änderungen an Endzeitpunkten oder Zielräumen  

---

### 2. `deebot-alexa-sprachsteuerung.js`
**Funktion:**  
Ermöglicht die **Sprachsteuerung des Deebot über Amazon Alexa** durch definierte Kommandos und Zustandsabfragen.

**Details & Features:**  
- Verarbeitung von Sprachbefehlen zur Steuerung einzelner Räume oder Reinigungsmodi  
- Rückmeldungen an Alexa mit aktuellem Status oder Erfolgsbestätigung  
- Möglichkeit zur Integration in Routinen und Automatisierungen  
- Unterstützung von Spot- und Zonenreinigung über Sprachkommandos  

**Typische Trigger:**  
- Aktivierung über Alexa Smart Home Skill oder benutzerdefinierte Routinen  
- Änderungen an Sprachbefehl-Datenpunkten  

---

### 3. `deebot-spotareas-mapping.js`
**Funktion:**  
Pflegt die Zuordnung von Spot-IDs zu Räumen und logischen Bereichen. Wird von anderen Skripten verwendet, um lesbare Raum- und Zielnamen zu generieren.

**Details & Features:**  
- Mapping-Tabelle aller Raum-IDs und deren Namen  
- Unterstützt dynamische Abfragen und Visualisierungen  
- Erlaubt gezieltes Ansteuern einzelner Bereiche über Skripte oder Sprachsteuerung  

**Typische Trigger:**  
- Zugriff aus anderen Skripten (z. B. VIS/Telegram oder Alexa)  
- Änderungen der Raum-ID durch Deebot-Status oder Nutzersteuerung

---

## 🧠 Empfohlene Nutzung & Tipps

- ⚙️ **Modularer Aufbau:** Jedes Skript arbeitet eigenständig und kann unabhängig voneinander gestartet, gestoppt oder aktualisiert werden.  
- 🧪 **Testempfehlung:** Teste Skripte einzeln nach Änderungen, um Fehlerquellen schnell eingrenzen zu können.  
- 🔄 **Reihenfolge:**  
  1. `deebot-spotareas-mapping.js` zuerst konfigurieren und aktivieren.  
  2. `deebot-vis-telegram.js` starten, um Statusmeldungen und Benachrichtigungen zu testen.  
  3. `deebot-alexa-sprachsteuerung.js` hinzufügen, wenn Sprachsteuerung gewünscht ist.  
- 📦 **Versionsverwaltung:** Jede Datei enthält einen eigenen Changelog und wird unabhängig versioniert. Dadurch kannst du bei Bedarf einzelne Skripte auf ältere Versionen zurücksetzen, ohne das Gesamtsystem zu beeinflussen.

---

## 🛠 Voraussetzungen

- ioBroker JavaScript-Adapter  
- Telegram-Adapter (für Benachrichtigungen)  
- VIS-Adapter (für Visualisierung)  
- Alexa Smart Home Skill oder Routine-Integration (für Sprachsteuerung)  

---

📌 **Hinweis:** Diese Skripte sind für die Nutzung mit Ecovacs Deebot Geräten optimiert und können bei Bedarf erweitert oder angepasst werden. Änderungen sollten immer versioniert und dokumentiert werden.

