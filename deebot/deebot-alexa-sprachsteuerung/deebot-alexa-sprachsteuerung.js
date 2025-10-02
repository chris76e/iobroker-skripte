// ======= Alexa Sprachsteuerung – Version 1.1.0 =======
// Änderungen:
// - Neue Sprachlogik: 
//   🧹 "mache sauber", "sauge", "saugen" → nur Saugen
//   🧽 "putzen" → nur Wischen
//   🧹🧽 "reinige", "reinigen" → Kombi-Modus (Saugen + Wischen)
// - Alte Schlüsselwörter "wisch", "wischen" entfernt, damit Alexa besser versteht

// === Einstellungen ===
const MAPPING_DP = '0_userdata.0.Deebot.MapNumberName';
const STATUS_DP = 'ecovacs-deebot.0.info.deviceStatus';
const SPOTAREA_DP = 'ecovacs-deebot.0.control.spotArea';
const CLEANMODE_DP = 'ecovacs-deebot.0.control.extended.cleaningMode';
const RELOCATE_DP = 'ecovacs-deebot.0.control.relocate';
const CUSTOMAREA_DP = 'ecovacs-deebot.0.control.customArea';

let intervalCleanRepeat = null;
let intervalSpot = null;

// 🔍 Räume aus Mapping holen
function getMappedRooms(normalized) {
    const state = getState(MAPPING_DP);
    if (!state || !state.val) {
        log(`❌ Fehler: Datenpunkt ${MAPPING_DP} ist leer oder nicht vorhanden`, 'error');
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
async function startCleaning(roomIds, mode, times) {
    if (roomIds.length === 0) {
        log('⚠️ Keine passenden Räume gefunden.', 'warn');
        return;
    }

    setState(CLEANMODE_DP, mode); // 1 = Saugen, 2 = Wischen
    const ids = roomIds.join(',');
    log(`🧹 Starte Reinigung der Räume: ${ids} | Modus: ${mode} | Durchgänge: ${times}`);

    setState(SPOTAREA_DP, ids);

    // Mehrfache Durchgänge nur beim Saugen relevant
    if (times > 1 && mode === 1) {
        let remaining = times - 1;
        intervalCleanRepeat = setInterval(() => {
            if (getState(STATUS_DP).val !== 'cleaning' && remaining > 0) {
                log(`🔁 Starte zusätzlichen Durchgang (${remaining} übrig)...`);
                setState(SPOTAREA_DP, ids);
                remaining--;
            } else if (remaining <= 0) {
                clearInterval(intervalCleanRepeat);
            }
        }, 60000);
    }
}

// 🧽 Spot-Reinigung starten
async function startSpotCleaning() {
    setState(RELOCATE_DP, true);
    intervalSpot = setInterval(() => {
        const state = getState('ecovacs-deebot.0.map.relocationState').val;
        if (state === 'ok') {
            const pos = getState('ecovacs-deebot.0.map.deebotPosition').val.split(',');
            const x = parseFloat(pos[0]);
            const y = parseFloat(pos[1]);
            const customArea = `${x - 1000},${y - 1000},${x + 1000},${y + 1000}`;
            log(`📍 Starte Spotreinigung bei: ${customArea}`);
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
    log(`🎤 Sprachbefehl erkannt: ${value}`);

    // 🛑 Keyword-Sperre: Nur reagieren, wenn ein Reinigungsbefehl enthalten ist
    const isCleaningCommand = /(sauber|sauge|saugen|putz|putzen|reinige|reinigen|spotreinigung)/.test(normalized);
    if (!isCleaningCommand) {
        log('🛑 Kein Reinigungs-Schlüsselwort enthalten – Befehl wird ignoriert.');
        return;
    }

    // Spotreinigung
    if (normalized.includes('spotreinigung')) {
        await startSpotCleaning();
        return;
    }

    // Räume ermitteln
    const rooms = getMappedRooms(normalized);
    const roomIds = rooms.map(r => r.id);

    if (roomIds.length === 0) {
        log('⚠️ Kein Raumname erkannt – Reinigung wird nicht gestartet.');
        sendTo('telegram.0', { text: '⚠️ Sprachbefehl erkannt, aber kein Raumname gefunden – bitte wiederholen.' });
        return;
    }

    // Anzahl der Durchgänge
    let times = 1;
    if (normalized.includes('zwei')) times = 2;
    if (normalized.includes('drei')) times = 3;
    if (normalized.includes('vier')) times = 4;
    if (normalized.includes('fünf')) times = 5;

    // 🔧 Modus bestimmen
    const hasSaugen = /(sauber|sauge|saugen)/.test(normalized);
    const hasPutzen = /(putz|putzen)/.test(normalized);
    const hasReinigen = /(reinige|reinigen)/.test(normalized);

    let mode = 1; // Standard: nur Saugen

    if (hasPutzen) {
        mode = 2; // Nur Wischen
    } else if (hasReinigen) {
        mode = 3; // Kombi-Modus (erst saugen, dann wischen)
    }

    // 🧠 Kombi-Modus: Saugen mehrfach, dann 1× Wischen
    if (mode === 3) {
        log(`🧹 Kombi-Modus erkannt – starte zuerst Saugen (${times}x)...`);
        await startCleaning(roomIds, 1, times);

        let checkInterval = setInterval(() => {
            if (getState(STATUS_DP).val !== 'cleaning') {
                log('🧽 Saugen fertig – starte einmaligen Wischdurchgang...');
                sendTo('telegram.0', { text: '✅ Saugen abgeschlossen – jetzt wird gewischt 🧽' });
                startCleaning(roomIds, 2, 1);
                clearInterval(checkInterval);
            }
        }, 60000);
    } else {
        await startCleaning(roomIds, mode, times);
    }
});

// 🛠️ Räume nur einmalig beim Start oder bei Änderung ausgeben
on({ id: MAPPING_DP, change: 'any' }, (obj) => {
    if (obj.state && obj.state.val) {
        try {
            const rooms = JSON.parse(obj.state.val);
            log(`📦 Räume im Mapping (${Object.keys(rooms).length}): ${Object.entries(rooms).map(([id, name]) => `${id}=${name}`).join(', ')}`);
        } catch (e) {
            log('❌ Mapping konnte nicht gelesen werden', 'error');
        }
    } else {
        log('⚠️ Mapping-Datenpunkt leer oder nicht vorhanden.', 'warn');
    }
});
