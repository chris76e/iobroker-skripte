// ======================================================
// Spülgang-Log – Version 1.0.0
// ======================================================
// 📜 CHANGELOG:
// - 1.0.0 (02.10.2025): 🆕 Erstveröffentlichung – Logging aller Spülgänge mit Start-, Endzeit, Dauer und Energieverbrauch.

// Dieses Skript protokolliert automatisch alle Spülgänge
// einer Spülmaschine mit HomeConnect-Integration (Cloudless Adapter).
// Es erstellt ein JSON-Log mit Datum, Uhrzeit, Dauer, Programmname
// und Energieverbrauch. Zusätzlich wird eine Telegram-Nachricht versendet,
// sobald der Spülgang beendet ist.

const dpState = 'cloudless-homeconnect.0.011040388898000963.Status.OperationState';
const dpProgramCode = 'cloudless-homeconnect.0.011040388898000963.ActiveProgram';
const dpVerbrauch = 'sonoff.0.Spuehlmaschine.ENERGY_Total';
const dpLog = '0_userdata.0.Spülmaschiene.Daten.Log';

let logArray = [];
if (getState(dpLog)?.val) {
    try {
        logArray = JSON.parse(getState(dpLog).val);
    } catch (err) {
        log(`❌ Fehler beim Parsen des Log-Datenpunkts: ${err}`, 'warn');
        logArray = [];
    }
}

let logObj = {};
let startDate = null;
let startVerbrauch = null;

// 🔧 Hilfsfunktionen
function pad(n) {
    return n < 10 ? '0' + n : n;
}

function formatDate(date) {
    const yyyy = date.getFullYear();
    const mm = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());
    const hh = pad(date.getHours());
    const min = pad(date.getMinutes());
    return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

function formatTime(date) {
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatDuration(ms) {
    const totalMin = Math.floor(ms / 60000);
    const hh = pad(Math.floor(totalMin / 60));
    const mm = pad(totalMin % 60);
    return `${hh}:${mm}`;
}

function getProgramName() {
    const code = getState(dpProgramCode)?.val;
    if (!code || code === '0') return 'Unbekannt';

    const map = {
        8192: 'Intensiv 70°C',
        8195: 'Auto 45–65°C',
        8196: 'Eco 50°C',
        8222: 'Schnell Waschen & Trocknen',
        8203: 'Schnell 65°C',
        8199: 'Schnell 45°C',
        8215: 'Maschinenpflege'
    };

    return map[code] || `Unbekannt (${code})`;
}

// 📡 Listener für Statuswechsel
on({ id: dpState, change: 'ne' }, function (dp) {
    const code = dp.state.val;

    if (code === 3) {
        // 🟢 Start erkannt
        startDate = new Date();
        startVerbrauch = getState(dpVerbrauch)?.val || 0;

        logObj = {
            Start: formatDate(startDate),
            StartUhr: formatTime(startDate),
            Programm: getProgramName()
        };

        log(`📋 Spülgang gestartet: ${logObj.Programm} um ${logObj.Start}`, 'info');
    }

    if (code === 6 && startDate) {
        // 🛑 Ende erkannt
        const endDate = new Date();
        const endVerbrauch = getState(dpVerbrauch)?.val || 0;
        const verbrauch = parseFloat((endVerbrauch - startVerbrauch).toFixed(3));
        const dauer = formatDuration(endDate.getTime() - startDate.getTime());

        logObj.Ende = formatDate(endDate);
        logObj.EndeUhr = formatTime(endDate);
        logObj.Verbrauch = verbrauch;
        logObj.Dauer = dauer;

        logArray.unshift(logObj);
        if (logArray.length > 100) logArray.pop();

        setState(dpLog, JSON.stringify(logArray, null, 2), true);
        log(`✅ Spülgang beendet – Log gespeichert:\n${JSON.stringify(logObj, null, 2)}`, 'info');

        // 🧾 Letzter Durchgang schreiben
        const letzterText = `Letzter Spülgang war am ${logObj.EndeUhr} am ${logObj.Ende.split(' ')[0]} fertig und hat ${logObj.Dauer} Stunden gebraucht.`;
        setState('0_userdata.0.Spülmaschiene.Daten.LetzterDurchgang', letzterText, true);
        log(`🧾 ${letzterText}`, 'info');
        sendTo("telegram.0", "send", { text: letzterText }); // 📩 Nachricht an Telegram

        // 🔄 Reset
        startDate = null;
        startVerbrauch = null;
        logObj = {};
    }
});
