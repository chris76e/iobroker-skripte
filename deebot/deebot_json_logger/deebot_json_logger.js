/***************************************************************
 * Script: Deebot JSON Logger
 * Version: 1.0.2 (04.10.2025)
 *
 * 📄 CHANGELOG:
 * - 1.0.0 (04.10.2025): 🆕 Erstes Release – JSON-Logger mit Zeitmessung
 * - 1.0.1 (04.10.2025): ✅ CleaningMode-Übersetzung auf Stringwerte angepasst
 * - 1.0.2 (04.10.2025): 🛠️ CleaningMode-Übersetzung robuster – unterstützt nun Zahl- und Stringwerte
 *
 * Beschreibung:
 * Dieses Skript überwacht Reinigungsdurchläufe des Deebot,
 * misst die Gesamtdauer und schreibt alle relevanten Daten als JSON
 * in 0_userdata.0.Deebot.JSON sowie einzelne Datenpunkte für die letzte Reinigung.
 ***************************************************************/

// Variablen für die Zeitmessung
var cleaningStartTime = null;

// Funktion zum Überwachen von Änderungen im JSON und Speichern in 0_userdata
function monitorAndSaveJson() {
    // Überwache Änderungen im JSON-Datenpunkt
    on({ id: "ecovacs-deebot.0.cleaninglog.last20Logs", change: "ne", ack: true }, function (obj) {
        if (cleaningStartTime !== null) {
            // Beende die Zeitmessung
            setTimeout(function() {
                var cleaningEndTime = new Date();
                var totalCleaningTimeInSeconds = (cleaningEndTime - cleaningStartTime) / 1000;
                var totalCleaningTimeFormatted = formatTime(totalCleaningTimeInSeconds);

                // Lese die aktuellen Daten aus dem JSON-Datenpunkt
                getState("0_userdata.0.Deebot.JSON", function (err, state) {
                    if (!err && state) {
                        var currentJson = state.val ? JSON.parse(state.val) : []; 

                        // Lese die Datenpunkte
                        var spotAreaName = getState("ecovacs-deebot.0.map.lastCleanedSpotArea.spotAreaName").val || "";
                        var lastTimeStamp = getState("ecovacs-deebot.0.cleaninglog.lastCleaningTimestamp").val || "";
                        var lastCleaningDate = getState("ecovacs-deebot.0.cleaninglog.lastCleaningDate").val || "";
                        lastCleaningDate = removeTimeFromDate(lastCleaningDate); 
                        var lastSquareMeters = getState("ecovacs-deebot.0.cleaninglog.lastSquareMeters").val || "";
                        var lastTotalSeconds = getState("ecovacs-deebot.0.map.lastCleanedSpotArea.totalSeconds").val || ""; 
                        
                        var cleaningModeRaw = getState("ecovacs-deebot.0.control.extended.cleaningMode").val || "";
                        log("📊 CleaningMode RAW: " + cleaningModeRaw, "info");
                        var cleaningMode = translateCleaningMode(cleaningModeRaw); 

                        var Moppingmode = getState("ecovacs-deebot.0.info.extended.moppingMode").val || "";
                        if (Moppingmode == 'deep') Moppingmode = 'tief';
                        else if (Moppingmode == 'fast') Moppingmode = 'schnell';

                        // Neues Objekt für JSON
                        var newData = {
                            "Raum": spotAreaName,
                            "Datum": lastCleaningDate,
                            "Timestamp": lastTimeStamp,
                            "Fläche": lastSquareMeters,
                            "Dauer": formatTime(lastTotalSeconds),
                            "Gesamtdauer": totalCleaningTimeFormatted,
                            "Reinigungsmodus": cleaningMode,
                            "Effizienz": Moppingmode,
                            "Startzeit": formatTimeComponents(new Date(cleaningStartTime)),
                            "Endzeit": formatTimeComponents(new Date(cleaningEndTime))
                        };

                        // Neues Objekt hinzufügen
                        currentJson.unshift(newData);

                        // JSON speichern
                        setState("0_userdata.0.Deebot.JSON", JSON.stringify(currentJson), function () {
                            log("✅ JSON erfolgreich aktualisiert und gespeichert.", "info");
                            
                            // Zeitmessung zurücksetzen
                            cleaningStartTime = null;

                            // Zusätzliche Datenpunkte setzen
                            setState("0_userdata.0.Deebot.lastCleaning.Dauer", formatTime(lastTotalSeconds));
                            setState("0_userdata.0.Deebot.lastCleaning.Fläche", lastSquareMeters);
                            setState("0_userdata.0.Deebot.lastCleaning.Gesamtdauer", totalCleaningTimeFormatted);
                            setState("0_userdata.0.Deebot.lastCleaning.Raum", spotAreaName);
                            setState("0_userdata.0.Deebot.lastCleaning.Reinigungsmodus", cleaningMode); 
                            setState("0_userdata.0.Deebot.lastCleaning.Effizienz", Moppingmode);               
                        });
                    } else {
                        log("❌ Fehler beim Lesen des Datenpunkts 0_userdata.0.Deebot.JSON", "error");
                    }
                });
            }, 2000); 
        }
    });

    // Startzeit setzen, wenn Reinigung startet
    on({ id: "ecovacs-deebot.0.map.currentUsedSpotAreas", change: "ne", ack: true }, function (obj) {
        if (cleaningStartTime === null) {
            cleaningStartTime = new Date();
            log("🕐 Reinigung gestartet um: " + formatTimeComponents(cleaningStartTime), "info");
        }
    });
}

// Überwachung starten
monitorAndSaveJson();

/***************************************************************
 * Hilfsfunktionen
 ***************************************************************/

// Zeitformatierung m:s
function formatTime(totalSeconds) {
    var minutes = Math.floor(totalSeconds / 60);
    var seconds = Math.floor(totalSeconds % 60);
    return (minutes < 10 ? "0" + minutes : minutes) + ":" + (seconds < 10 ? "0" + seconds : seconds);
}

// Formatierung Start-/Endzeit
function formatTimeComponents(date) {
    var hours = pad(date.getHours(), 2);
    var minutes = pad(date.getMinutes(), 2);
    return hours + ":" + minutes;
}

// Entfernt Uhrzeit aus Datum
function removeTimeFromDate(dateString) {
    var parts = dateString.split(" ");
    return parts[0];
}

// Zahlen mit führenden Nullen
function pad(num, size) {
    var s = num.toString();
    while (s.length < size) s = "0" + s;
    return s;
}

// CleaningMode-Übersetzer (robust für Zahl & String)
function translateCleaningMode(mode) {
    if (mode === null || mode === undefined) return "unbekannt";

    // Zahl → Übersetzen
    if (typeof mode === "number") {
        switch (mode) {
            case 0: return "saugen und wischen";
            case 1: return "saugen";
            case 2: return "wischen";
            case 3: return "wischen nach saugen";
            default: return "unbekannt";
        }
    }

    // String → Übersetzen
    if (typeof mode === "string") {
        mode = mode.toLowerCase();
        switch (mode) {
            case "vacuum and mop": return "saugen und wischen";
            case "vacuum only": return "saugen";
            case "mop only": return "wischen";
            case "mop after vacuum": return "wischen nach saugen";
            default: return "unbekannt";
        }
    }

    return "unbekannt";
}
