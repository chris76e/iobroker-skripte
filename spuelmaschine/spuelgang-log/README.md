# 🧾 Spülgang-Log – iobroker Skript

Dieses Skript protokolliert automatisch alle Spülgänge einer Spülmaschine, die über den **Cloudless HomeConnect Adapter** eingebunden ist. Es speichert alle relevanten Daten wie Startzeit, Endzeit, Dauer, Programmname und Energieverbrauch und legt sie in einem JSON-Datenpunkt ab. Zusätzlich wird nach jedem abgeschlossenen Spülgang eine Telegram-Nachricht gesendet.

---

## 📦 Funktionen

- 📅 **Start- & Endzeit-Erfassung** – Jeder Spülgang wird mit Datum und Uhrzeit aufgezeichnet.  
- 🧼 **Programmerkennung** – Das aktuell laufende Spülprogramm wird automatisch ermittelt und protokolliert.  
- ⏱️ **Dauerberechnung** – Die Gesamtdauer des Spülgangs wird in Stunden und Minuten gespeichert.  
- ⚡ **Energieverbrauch** – Aus der Differenz des Energiezählers wird der Gesamtverbrauch pro Spülgang berechnet.  
- 🪵 **Spülgangs-Logbuch** – Alle Spülgänge werden in einem JSON-Array im Datenpunkt `0_userdata.0.Spülmaschiene.Daten.Log` gespeichert (max. 100 Einträge).  
- 📲 **Telegram-Benachrichtigung** – Nach Abschluss eines Spülgangs wird eine Nachricht mit den wichtigsten Daten versendet.

---

## 🧰 Voraussetzungen

- [ioBroker](https://www.iobroker.net/) mit installiertem  
  - **[cloudless-homeconnect Adapter](https://github.com/foxriver76/ioBroker.cloudless-homeconnect)**  
  - **[telegram Adapter](https://github.com/iobroker-community-adapters/ioBroker.telegram)** (optional für Benachrichtigungen)  
  - **sonoff Adapter** (oder ein anderer Adapter mit Energiedaten für den Stromverbrauch der Spülmaschine)

---

## ⚙️ Datenpunkte

| Datenpunkt | Beschreibung |
|------------|--------------|
| `cloudless-homeconnect.0.<DEVICE_ID>.Status.OperationState` | Aktueller Betriebszustand der Spülmaschine |
| `cloudless-homeconnect.0.<DEVICE_ID>.ActiveProgram` | Laufendes Spülprogramm |
| `sonoff.0.Spuehlmaschine.ENERGY_Total` | Gesamtverbrauchszähler (kWh) |
| `0_userdata.0.Spülmaschiene.Daten.Log` | JSON-Log aller Spülgänge |
| `0_userdata.0.Spülmaschiene.Daten.LetzterDurchgang` | Textzusammenfassung des letzten Spülgangs |

---

## 📤 Beispielausgabe (Telegram)


---

## 📝 Hinweis

- Das Skript erstellt automatisch neue Einträge im JSON-Log.  
- Alte Einträge werden automatisch gelöscht, sobald mehr als 100 Spülgänge gespeichert sind.  
- Neue Programme, die noch nicht bekannt sind, können bei Bedarf manuell im Skript ergänzt werden.

---

© 2025 – ioBroker Spülgang-Log


