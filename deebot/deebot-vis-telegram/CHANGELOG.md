# Changelog

- 1.0.0: Grundfunktionen – Telegram + VIS-Text bei Start, Reinigung, Abschluss, Laden
- 1.0.1: Akku-Vollmeldung „Vollgetankt und einsatzbereit!“ hinzugefügt
- 1.0.2: Mop-Reinigung und Trocknung integriert, Telegram + VIS erweitert
- 1.0.3: Nutzung von cleaningMode zur Moduserkennung (saugen/putzen/reinigen)
- 1.0.4: Endzeit für Trocknung aus endDateTime übernommen, VIS ohne Emojis
- 1.0.5: Fix für doppelte Trocknungs-Zeiten → 2s Delay, nur **eine** korrekte Uhrzeit in VIS & Telegram
- 1.0.6: Automatische Statusmeldung **nach Trocknung** hinzugefügt (z. B. Laden oder bereit)
- 1.0.7: ✅ Logik optimiert – nach Trocknung sofort normale Statusmeldung, keine doppelten Zeiten mehr
- 1.0.8: 🧪 Fix – VIS-Text aktualisiert sich jetzt korrekt **nach Ende der Trocknung**
- 1.0.9: 🔧 Fix – Telegram/VIS bei Trocknung nur einmal & erst bei gültiger Endzeit, Trigger auf "ne" optimiert
- 1.1.0 (03.10.2025): 🧼 Fix – Endzeit bei Trocknung wird jetzt **einmalig korrekt gespeichert** und nicht mehr überschrieben
- 1.2.0 (03.10.2025): 🌍 Raum-Namen aus DP `0_userdata.0.Deebot.MapNumberName` geladen + Log-Ausgabe beim Skriptstart
