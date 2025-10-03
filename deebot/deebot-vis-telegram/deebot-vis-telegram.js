// ======= Deebot VIS & Telegram Script – Version 1.2.0 (03.10.2025) =======
// 📝 Changelog (kumulativ):
// - 1.0.0: Grundfunktionen – Telegram + VIS-Text bei Start, Reinigung, Abschluss, Laden
// - 1.0.1: Akku-Vollmeldung „Vollgetankt und einsatzbereit!“ hinzugefügt
// - 1.0.2: Mop-Reinigung und Trocknung integriert, Telegram + VIS erweitert
// - 1.0.3: Nutzung von cleaningMode zur Moduserkennung (saugen/putzen/reinigen)
// - 1.0.4: Endzeit für Trocknung aus endDateTime übernommen, VIS ohne Emojis
// - 1.0.5: Fix für doppelte Trocknungs-Zeiten → 2s Delay, nur **eine** korrekte Uhrzeit in VIS & Telegram
// - 1.0.6: Automatische Statusmeldung **nach Trocknung** hinzugefügt (z. B. Laden oder bereit)
// - 1.0.7: ✅ Logik optimiert – nach Trocknung sofort normale Statusmeldung, keine doppelten Zeiten mehr
// - 1.0.8: 🧪 Fix – VIS-Text aktualisiert sich jetzt korrekt **nach Ende der Trocknung**
// - 1.0.9: 🔧 Fix – Telegram/VIS bei Trocknung nur einmal & erst bei gültiger Endzeit, Trigger auf "ne" optimiert
// - 1.1.0 (03.10.2025): 🧼 Fix – Endzeit bei Trocknung wird jetzt **einmalig korrekt gespeichert** und nicht mehr überschrieben
// - 1.2.0 (03.10.2025): 🌍 Raum-Namen aus DP `0_userdata.0.Deebot.MapNumberName` geladen + Log-Ausgabe beim Skriptstart

const DP_VIS_TEXT   = "0_userdata.0.Deebot.VISAnzeige";
const DP_VIS_JSON   = "0_userdata.0.Deebot.VISAnzeigeJSON";

const DP_DEVICE_STATUS     = "ecovacs-deebot.0.status.device";
const DP_CLEAN_STATUS      = "ecovacs-deebot.0.info.cleanstatus";
const DP_CURRENT_ROOM_ID   = "ecovacs-deebot.0.map.deebotPositionCurrentSpotAreaID";
const DP_TARGET            = "ecovacs-deebot.0.control.spotArea";
const DP_CLEANING_MODE_DP  = "ecovacs-deebot.0.control.extended.cleaningMode";
const DP_CLEANED_AREA      = "ecovacs-deebot.0.cleaninglog.current.cleanedArea";
const DP_CLEANED_TIME      = "ecovacs-deebot.0.cleaninglog.current.cleanedSeconds";
const DP_BATTERY           = "ecovacs-deebot.0.info.battery";
const DP_AIR_DRYING        = "ecovacs-deebot.0.control.extended.airDrying";
const DP_DRYING_END        = "ecovacs-deebot.0.info.extended.airDryingDateTime.endDateTime";

const DP_ROOM_MAPPING      = "0_userdata.0.Deebot.MapNumberName";

const TELEGRAM = "telegram.0";

let RAUM_MAPPING = {};

let lastTelegramText = "";
let lastVisText = "";
let dryingEndOnce = null; // 🆕 Merker für einmalige Trocknungs-Endzeit

function loadRoomMapping() {
  try {
    const state = getState(DP_ROOM_MAPPING);
    if (state && state.val) {
      RAUM_MAPPING = JSON.parse(state.val);
      log("📍 Raum-Mapping geladen: " + JSON.stringify(RAUM_MAPPING));
    } else {
      log("⚠️ Konnte Raum-Mapping nicht laden – State leer");
    }
  } catch (e) {
    log("❌ Fehler beim Laden des Raum-Mappings: " + e);
  }
}

function getModeInfo() {
  const rawState = getState(DP_CLEANING_MODE_DP);
  const raw = rawState ? rawState.val : null;
  let modeNum = null;

  if (raw !== null && raw !== undefined && raw !== "") {
    if (typeof raw === "number") {
      modeNum = Number(raw);
    } else {
      const m = String(raw).match(/(\d+)/);
      if (m) modeNum = Number(m[1]);
      else {
        const s = String(raw).toLowerCase();
        if (s.includes("vacuum")) modeNum = 1;
        else if (s.includes("mop")) modeNum = 2;
        else if (s.includes("vacuum and mop") || s.includes("mop after vacuum")) modeNum = 3;
      }
    }
  }

  if (modeNum === null || isNaN(modeNum)) {
    const csState = getState(DP_CLEAN_STATUS);
    const cs = csState && csState.val ? String(csState.val).toLowerCase() : "";
    if (cs.includes("mop")) modeNum = 2;
    else modeNum = 1;
  }

  if (modeNum === 0 || modeNum === 3) modeNum = 3;

  let infinitive = "saugen";
  let ichForm = "sauge";
  if (modeNum === 2) {
    infinitive = "putzen";
    ichForm = "putze";
  } else if (modeNum === 3) {
    infinitive = "reinigen";
    ichForm = "reinige";
  }

  return { modeNum, infinitive, ichForm };
}

function makeVonForm(phrase) {
  if (!phrase) return phrase;
  if (phrase.startsWith("den ")) return "vom " + phrase.replace("den ", "");
  if (phrase.startsWith("das ")) return "vom " + phrase.replace("das ", "");
  if (phrase.startsWith("die ")) return "von der " + phrase.replace("die ", "");
  return "von " + phrase;
}

function sendTelegramMsg(msg) {
  if (msg !== lastTelegramText) {
    log(`📤 Telegram gesendet: ${msg}`);
    sendTo(TELEGRAM, "send", { text: msg });
    lastTelegramText = msg;
  }
}

function setVisText(text, json) {
  if (text !== lastVisText) {
    log(`📊 VIS-Text gesetzt: ${text}`);
    setState(DP_VIS_TEXT, text, true);
    setState(DP_VIS_JSON, JSON.stringify(json || {}, null, 2), true);
    lastVisText = text;
  }
}

// (... Rest bleibt unverändert ...)

on({
  id: [
    DP_DEVICE_STATUS,
    DP_CLEAN_STATUS,
    DP_CURRENT_ROOM_ID,
    DP_TARGET,
    DP_CLEANED_AREA,
    DP_CLEANED_TIME,
    DP_BATTERY,
    DP_AIR_DRYING,
    DP_DRYING_END,
    DP_CLEANING_MODE_DP,
    DP_ROOM_MAPPING
  ],
  change: "ne"
}, updateStatus);

loadRoomMapping();
log("🔁 Skriptstart: Aktueller Status = " + getState(DP_DEVICE_STATUS).val);
updateStatus();
