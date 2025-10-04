/*
 * Script: deebot_json_logger.js
 * Version: 1.0.0
 * Date: 04.10.2025
 * 
 * 📜 CHANGELOG:
 * - 1.0.0 (04.10.2025): 🎉 Erstveröffentlichung – Reinigungsüberwachung mit Zeitmessung, JSON-Logging, Statusaktualisierung und korrekt ausgelesenem CleaningMode.
 */

// ===============================
// Variablen für die Zeitmessung
// ===============================
var cleaningStartTime = null;

// ===============================
// Hauptfunktion: JSON überwachen und speichern
// ===============================
function monitorAndSaveJson() {

    // Überwache Änderungen im JSON-Datenpunkt (wenn neuer Reinigungseintrag geschrieben wird)
    on({ id: "ecovacs-deebot.0.cleaninglog.last20Logs", change: "ne", ack: true }, function (obj) {
        // Überprüfe, ob die Zeitmessung läuft        
        if (cleaningStartTime !== null) {
            // Beende die Zeitmessung nach kleiner Verzögerung (um alle Daten zu haben)
            setTimeout(function() {
                var cleaningEndTime = new Date();
                var totalCleaningTimeInSeconds = (cleaningEndTime - cleaningStartTime) / 1000;
                var totalCleaningTimeFormatted = formatTime(totalCleaningTimeInSeconds);

                // Lese die aktuellen Daten aus dem JSON-Datenpunkt
                getState("0_userdata.0.Deebot.JSON", function (err, state) {
                    if (!err && state) {
                        var currentJson = state.val ? JSON.parse(state.val) : []; // Aktuelles JSON oder leeres Array

                        // Lese alle relevanten Datenpunkte aus
                        var spotAreaName = getState("ecovacs-deebot.0.map.lastCleanedSpotArea.spotAreaName").val || "";
                        var lastTimeStamp = getState("ecovacs-deebot.0.cleaninglog.lastCleaningTimestamp").val || "";
                        var lastCleaningDate = getState("ecovacs-deebot.0.cleaninglog.lastCleaningDate").val || "";
                        lastCleaningDate = removeTimeFromDate(lastCleaningDate); 
                        var lastSquareMeters = getState("ecovacs-deebot.0.cleaninglog.lastSquareMeters").val || "";
                        var lastTotalSeconds = getState("ecovacs-deebot.0.map.lastCleanedSpotArea.totalSeconds").val || "";

                        // ✅ FIX: CleaningMode direkt aus dem Adapter lesen
                        var cleaningMode = getState("ecovacs-deebot.0.control.extended.cleaningMode").val || "";
                        cleaningMode = translateCleaningMode(cleaningMode);

                        // Effizienz (Mopping-Mode) ermitteln und übersetzen
                        var Moppingmode = getState("ecovacs-deebot.0.info.extended.moppingMode").val || "";
                        if (Moppingmode == 'deep') Moppingmode = 'tief';
                        else if (Moppingmode == 'fast') Moppingmode = 'schnell';

                        // Neues Objekt erstellen
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

                        // Neues Objekt vorne anfügen
                        currentJson.unshift(newData);

                        // Speichern in 0_userdata
                        setState("0_userdata.0.Deebot.JSON", JSON.stringify(currentJson), function () {
                            log("✅ JSON erfolgreich aktualisiert und gespeichert.", "info");
                            
                            // Zeitmessung zurücksetzen
                            cleaningStartTime = null;

                            // Zusätzliche Datenpunkte aktualisieren
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
            }, 2000); // 2-Sekunden-Verzögerung
        }
    });

    // Startzeit setzen, wenn Reinigung startet (Spot-Bereich geändert)
    on({ id: "ecovacs-deebot.0.map.currentUsedSpotAreas", change: "ne", ack: true }, function (obj) {
        if (cleaningStartTime === null) {
            cleaningStartTime = new Date();
            log("🕐 Reinigung gestartet um: " + formatTimeComponents(cleaningStartTime), "info");
        }
    });
}

// ===============================
// Starte die Überwachung
// ===============================
monitorAndSaveJson();

// ===============================
// Hilfsfunktionen
// ===============================
function formatTime(totalSeconds) {
    var minutes = Math.floor(totalSeconds / 60);
    var seconds = Math.floor(totalSeconds % 60);
    var minutesString = minutes < 10 ? "0" + minutes : minutes.toString();
    var secondsString = seconds < 10 ? "0" + seconds : seconds.toString();
    return minutesString + ":" + secondsString;
}

function formatTimeComponents(date) {
    var hours = pad(date.getHours(), 2);
    var minutes = pad(date.getMinutes(), 2);
    return hours + ":" + minutes;
}

function removeTimeFromDate(dateString) {
    var parts = dateString.split(" ");
    return parts[0];
}

function pad(num, size) {
    var s = num.toString();
    while (s.length < size) s = "0" + s;
    return s;
}

function translateCleaningMode(mode) {
    mode = +mode;
    var cleaningModes = {
        0: "saugen und wischen",
        1: "saugen",
        2: "wischen",
        3: "wischen nach saugen"
    };
    var translatedMode = cleaningModes[mode] || "unbekannt";

    log("ℹ️ Ursprünglicher Reinigungsmodus: " + mode, "info");
    log("✅ Übersetzter Reinigungsmodus: " + translatedMode, "info");

    return translatedMode;
}

