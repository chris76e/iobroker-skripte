// ============================================================
// Deebot SpotAreas JSON als Mapping + Telegram – Version 1.0.0
// ============================================================
//
// 📜 CHANGELOG
// - 1.0.0 (02.10.2025): ✨ Erstveröffentlichung – SpotAreas automatisch in JSON-Mapping umwandeln und per Telegram melden
//
// ============================================================

const TELEGRAM_INSTANZ = "telegram.0"; // ggf. anpassen
const mapIdState = "ecovacs-deebot.0.map.currentMapMID";
const dpPath = "0_userdata.0.Deebot.MapNumberName";
const MAX_CONSECUTIVE_MISSES = 3; // bei 3 Lücken abbrechen

let lastMapId = null;

// 📩 Telegram senden
function sendTelegram(msg) {
    if (existsObject(TELEGRAM_INSTANZ)) {
        sendTo(TELEGRAM_INSTANZ, "send", { text: msg });
        log("📨 Telegram gesendet:\n" + msg);
    } else {
        log("⚠️ Telegram Adapter nicht gefunden!", "warn");
    }
}

// 📦 Hauptfunktion: SpotAreas → Mapping
function updateSpotAreas(trigger = "Manuell") {
    const mapState = getState(mapIdState);
    if (!mapState || !mapState.val) {
        log("❌ currentMapMID konnte nicht gelesen werden!", "warn");
        return;
    }
    const mapId = mapState.val;
    const basePath = "ecovacs-deebot.0.map." + mapId + ".spotAreas.";

    let mapping = {}; // statt Liste: Objekt
    let textList = ""; // für Telegram
    let i = 0;
    let consecutiveMisses = 0;

    while (true) {
        const objId = basePath + i;
        const obj = getObject(objId);

        if (!obj) {
            consecutiveMisses++;
            if (consecutiveMisses >= MAX_CONSECUTIVE_MISSES) break;
            i++;
            continue;
        }

        consecutiveMisses = 0;

        if (obj.common && obj.common.name) {
            const name = obj.common.name;
            const match = name.match(/Spot area\s+(\d+)\s*\(([^)]+)\)/i);
            if (match) {
                const id = parseInt(match[1], 10);
                const areaName = match[2];
                mapping[id] = areaName;
                textList += `- ID ${id}: ${areaName}\n`;
            } else {
                log("⚠️ Name konnte nicht geparst werden: " + name, "warn");
            }
        }
        i++;
    }

    const jsonString = JSON.stringify(mapping, null, 2);

    if (!existsState(dpPath)) {
        createState(dpPath, jsonString, {
            name: "SpotAreas Mapping JSON",
            type: "string",
            role: "json",
            read: true,
            write: false
        });
    } else {
        setState(dpPath, jsonString, true);
    }

    log(`✅ ${Object.keys(mapping).length} SpotAreas gespeichert (Mapping)`);

    // 📩 Telegram Nachricht zusammenstellen
    let message = `📍 *Deebot Update* (${trigger})\n`;
    message += `🗺️ Karte: ${mapId}\n`;
    message += `📊 Räume (${Object.keys(mapping).length}):\n\n${textList}`;

    sendTelegram(message);

    // 🆕 Karte erkannt?
    if (lastMapId !== null && lastMapId !== mapId) {
        sendTelegram(`🆕 *Neue Karte erkannt!*\nAlte ID: ${lastMapId}\nNeue ID: ${mapId}`);
    }
    lastMapId = mapId;
}

// 🟢 1️⃣ Beim Skriptstart ausführen
updateSpotAreas("Skriptstart");

// 🔁 2️⃣ Trigger: Map-ID geändert
on({ id: mapIdState, change: "any" }, function () {
    log("📍 currentMapMID geändert → JSON neu erzeugen");
    updateSpotAreas("Neue Karte erkannt");
});

// 🔁 3️⃣ Trigger: SpotArea geändert
on({ id: new RegExp("^ecovacs-deebot\\.0\\.map\\.[0-9]+\\.spotAreas\\.[0-9]+$"), change: "any" }, function () {
    log("📍 SpotArea geändert → JSON neu erzeugen");
    updateSpotAreas("SpotArea geändert");
});
