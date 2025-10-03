// ======= deebot-alexa-sprachsteuerung.js – Version 1.2.0 =======
// 📜 CHANGELOG:
// - 1.0.0 (20.09.2025): 🧠 Grundlogik zur Alexa-Sprachsteuerung implementiert
// - 1.1.0 (28.09.2025): 🧹 Neue Sprachlogik, Schlüsselwörter optimiert
// - 1.2.0 (03.10.2025): ✅ cleaningMode = 3 nur bei „reinigen“, keine Mehrfachdurchgänge mehr, nur log()-Ausgaben, ausführliches Logging

// === Einstellungen ===
const MAPPING_DP = '0_userdata.0.Deebot.MapNumberName';
const STATUS_DP = 'ecovacs-deebot.0.info.deviceStatus';
const SPOTAREA_DP = 'ecovacs-deebot.0.control.spotArea';
const CLEANMODE_DP = 'ecovacs-deebot.0.control.extended.cleaningMode';
const RELOCATE_DP = 'ecovacs-deebot.0.control.relocate';
const CUSTOMAREA_DP = 'ecovacs-deebot.0.control.customArea';

let intervalSpot = null;

// 🔍 Räume aus Mapping holen
function getMappedRooms(normalized) {
    const state = getState(MAPPING_DP);
    if (!state || !state.val) {
        log(`❌ Fehler: Datenpunkt ${MAPPING_DP} ist leer oder nicht vorhanden.`, 'error');
        return [];
    }

    let rooms;
    try {
        rooms = JSON.parse(state.val);
    } catch (e) {
        log(`❌ Fehler beim Parsen des JSON: ${e}`, 'error');
        return [];
    }

    const selected = [];
    for (const [id, name] of Object.entries(rooms)) {
        if (normalized.includes(name.toLowerCase())) {
            selected.push({ name, id });
        }
    }

    return selected;
}

// 🧹 Raumreinigung starten
async function startCleaning(roomIds, mode) {
    if (roomIds.length === 0) {
        log('⚠️ Keine passenden Räume gefunden – Reinigung abgebrochen.', 'warn');
        return;
    }

    const ids = roomIds.join(',');
    setState(CLEANMODE_DP, mode);
    setState(SPOTAREA_DP, ids);

    if (mode === 1) {
        log(`🧹 Nur Saugen gestartet – Räume: ${ids} | cleaningMode: ${mode}`);
    } else if (mode === 2) {
        log(`🧽 Nur Wischen gestartet – Räume: ${ids} | cleaningMode: ${mode}`);
    } else if (mode === 3) {
        log(`🧹🧽 Kombi-Modus gestartet – Räume: ${ids} | cleaningMode: ${mode}`);
        log(`ℹ️ Der Deebot startet jetzt automatisch mit dem Saugen und wird danach selbstständig wischen.`);
    }
}

// 🧽 Spot-Reinigung starten
async function startSpotCleaning() {
    log(`📍 Spotreinigung angefordert – Relokalisierung wird gestartet...`);
    setState(RELOCATE_DP, true);
    intervalSpot = setInterval(() => {
        const state = getState('ecovacs-deebot.0.map.relocationState').val;
        if (state === 'ok') {
            const pos = getState('ecovacs-deebot.0.map.deebotPosition').val.split(',');
            const x = parseFloat(pos[0]);
            const y = parseFloat(pos[1]);
            const customArea = `${x - 1000},${y - 1000},${x + 1000},${y + 1000}`;
            log(`📍 Starte Spotreinigung bei Position: ${customArea}`);
            setState(CUSTOMAREA_DP, customArea);
            clearInterval(intervalSpot);
        } else if (state !== 'start') {
            log('❌ Fehler bei der Relokalisierung!', 'error');
            clearInterval(intervalSpot);
        }
    }, 3000);
}

// 📢 Sprachbefehl überwachen
on({ id: 'alexa2.0.History.summary', change: 'ne' }, async (obj) => {
    const value = (obj.state.val || '').trim();
    if (value === '' || value === ',' || value.length < 3) return;

    const normalized = value.toLowerCase();
    log(`🎤 Sprachbefehl erkannt: "${value}"`);

    // 🛑 Nur bei Reinigungsbefehl reagieren
    const isCleaningCommand = /(sauber|sauge|saugen|putz|putzen|reinige|reinigen|spotreinigung)/.test(normalized);
    if (!isCleaningCommand) {
        log('🛑 Kein Reinigungs-Schlüsselwort enthalten – Befehl wird ignoriert.');
        return;
    }

    // 🧽 Spotreinigung
    if (normalized.includes('spotreinigung')) {
        await startSpotCleaning();
        return;
    }

    // 🏠 Räume ermitteln
    const rooms = getMappedRooms(normalized);
    const roomIds = rooms.map(r => r.id);
    if (roomIds.length === 0) {
        log('⚠️ Kein Raumname erkannt – Reinigung wird nicht gestartet.');
        return;
    }

    // 🔢 Mehrfachdurchgänge erkennen, aber ignorieren
    const matchTimes = /(zwei|drei|vier|fünf)/.exec(normalized);
    if (matchTimes) {
        log(`ℹ️ Mehrfachdurchgang erkannt (${matchTimes[0]}), wird ignoriert – es wird nur 1× gereinigt.`);
    }

    // 🔧 Modus bestimmen
    const hasSaugen = /(sauber|sauge|saugen)/.test(normalized);
    const hasPutzen = /(putz|putzen)/.test(normalized);
    const hasReinigen = /(reinige|reinigen)/.test(normalized);

    let mode = 1; // Standard: Saugen
    if (hasPutzen) mode = 2;
    if (hasReinigen) mode = 3;

    // 🚀 Reinigung starten
    await startCleaning(roomIds, mode);
});

// 🛠️ Räume beim Start oder bei Änderung anzeigen
on({ id: MAPPING_DP, change: 'any' }, (obj) => {
    if (obj.state && obj.state.val) {
        try {
            const rooms = JSON.parse(obj.state.val);
            log(`📦 Räume im Mapping (${Object.keys(rooms).length}): ${Object.entries(rooms).map(([id, name]) => `${id}=${name}`).join(', ')}`);
        } catch (e) {
            log('❌ Mapping konnte nicht gelesen werden.', 'error');
        }
    } else {
        log('⚠️ Mapping-Datenpunkt leer oder nicht vorhanden.', 'warn');
    }
});

// 🧠 Abschlussmeldung, wenn Reinigung fertig
on({ id: STATUS_DP, change: 'ne' }, (obj) => {
    const status = obj.state.val;
    if (status === 'idle' || status === 'returning' || status === 'charging') {
        log(`✅ Reinigung abgeschlossen – der Deebot ist nun wieder im Basiszustand (${status}).`);
    }
});
