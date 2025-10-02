# 📘 Spülmaschine Status – ioBroker Skript

Dieses Skript überwacht den kompletten Status einer Spülmaschine, die über den **[Cloudless HomeConnect Adapter](https://github.com/eifel-tech/ioBroker.cloudless-homeconnect)** in ioBroker eingebunden ist.  
Es liest die aktuellen Zustände und Phasen aus, berechnet automatisch die Restlaufzeit und sendet Benachrichtigungen über Telegram.
()

---

## ⚙️ Funktionen

- 📊 **Zustandserkennung:** Erkennt automatisch den aktuellen Status der Spülmaschine (z. B. *Bereit*, *Spülgang läuft*, *Fertig* etc.)
- ⏱️ **Restlaufzeit & Endzeit:** Berechnet anhand der vom Adapter gelieferten Restlaufzeit automatisch die voraussichtliche **Fertigstellungszeit**
- 📬 **Telegram-Benachrichtigungen:** Informiert dich automatisch, wenn der Spülgang startet oder abgeschlossen ist
- 🧠 **Automatisches Programmmapping:** Unbekannte Programmcodes werden erkannt, automatisch gespeichert und können benannt werden
- 🔁 **Datenpunkte in 0_userdata.0:** Speichert relevante Informationen strukturiert im Datenbaum für VIS-Darstellung oder weitere Automatisierungen

---

## 🔌 Voraussetzungen

- 🧩 **ioBroker** mit aktuellem JavaScript Adapter  
- ☁️ **Cloudless HomeConnect Adapter** (`cloudless-homeconnect.0`) zur lokalen Integration deiner Bosch / Siemens Spülmaschine ohne Cloud  
- 📬 **Telegram Adapter** (optional, aber empfohlen) für Benachrichtigungen

---

## 📂 Verwendete Datenpunkte (Cloudless HomeConnect)

| Datenpunkt | Beschreibung |
|-----------|--------------|
| `cloudless-homeconnect.0.<deviceId>.Status.OperationState` | Aktueller Betriebszustand |
| `cloudless-homeconnect.0.<deviceId>.Option.RemainingProgramTime` | Verbleibende Programmlaufzeit |
| `cloudless-homeconnect.0.<deviceId>.Status.ProgramPhase` | Aktuelle Programmlaufphase |
| `cloudless-homeconnect.0.<deviceId>.ActiveProgram` | Aktives Programm (Programmcode) |

> 🔎 Passe `<deviceId>` in deinem Skript an dein Gerät an .

---

## 📁 Erstellt Datenpunkte unter

0_userdata.0.Spülmaschiene.Daten
├─ ProgramDauer – Lesbarer Text der Restlaufzeit
├─ EndDatum – Voraussichtliches Enddatum
├─ EndZeit – Voraussichtliche Endzeit
├─ Zustand – Aktueller Zustand der Spülmaschine
├─ Phase – Aktuelle Programmlaufphase
├─ Fertig – Vollständige Telegram-Nachricht (Text)
└─ Log.ProgramMap – Automatisch erweitertes Mapping der Programmcodes
---

## 📩 Telegram-Benachrichtigungen

- 🔄 **Spülgang gestartet:** Meldung mit Restlaufzeit und Endzeit  
- ✅ **Spülgang beendet:** Fertigmeldung nach Abschluss  
- ⚠️ **Neuer ProgramCode:** Wird automatisch erkannt und gemappt

---

## 🧪 Beispiel-Ausgabe (Telegram)


---

## 🚀 Installation

1. Kopiere das Skript `spuelmaschine_status.js` in den JavaScript-Adapter  
2. Passe die Geräte-ID (`prefix`) an deine HomeConnect-Gerätekennung an  
3. Stelle sicher, dass Telegram korrekt eingerichtet ist  
4. Starte das Skript – es erkennt automatisch den aktuellen Zustand

---

## 🧾 Changelog

Siehe [`CHANGELOG.md`](./CHANGELOG.md) für alle Versionen und Änderungen.



