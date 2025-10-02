// ======= Deebot VIS & Telegram Script – Version 1.0.9 (02.10.2025) =======
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

const TELEGRAM = "telegram.0";

const RAUM_MAPPING = {
  "0": "den Eingang",
  "1": "den Flur",
  "2": "das Badezimmer",
  "3": "die Küche",
  "4": "das Wohnzimmer",
  "5": "das Büro",
  "6": "das Schlafzimmer"
};

let lastTelegramText = "";
let lastVisText = "";

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

function formatTime(timestamp) {
  if (!timestamp) return "unbekannt";
  if (typeof timestamp === "string" && timestamp.includes("T")) {
    const d = new Date(timestamp);
    if (!isNaN(d.getTime())) return d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
  }
  if (typeof timestamp === "string" && timestamp.includes(".")) {
    try {
      const parts = timestamp.split(" ");
      const [tag, monat, jahr] = parts[0].split(".");
      const [stunden, minuten] = parts[1].split(":");
      const date = new Date(jahr, monat - 1, tag, stunden, minuten);
      if (!isNaN(date.getTime())) return date.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
    } catch (e) {}
  }
  if (!isNaN(Number(timestamp))) {
    const num = Number(timestamp);
    const date = new Date(num < 1e12 ? num * 1000 : num);
    if (!isNaN(date.getTime())) return date.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
  }
  return "unbekannt";
}

function updateStatus() {
  const statusRaw = String((getState(DP_DEVICE_STATUS)?.val) || "").toLowerCase();
  const modeInfo = getModeInfo();
  const area = Number(getState(DP_CLEANED_AREA)?.val || 0);
  const seconds = Number(getState(DP_CLEANED_TIME)?.val || 0);
  const dauer = `${Math.floor(seconds / 60)} Min ${seconds % 60} Sek`;
  const battery = Number(getState(DP_BATTERY)?.val || 0);

  const airDryingVal = getState(DP_AIR_DRYING)?.val;
  const airDrying = airDryingVal === true || airDryingVal === "true" || airDryingVal === 1;
  const dryingEndRaw = getState(DP_DRYING_END)?.val;

  const currentRoomId = String(getState(DP_CURRENT_ROOM_ID)?.val || "");
  const targetId = String(getState(DP_TARGET)?.val || "");
  const targetText = RAUM_MAPPING[targetId] || `Raum ${targetId}`;
  const currentRoomText = RAUM_MAPPING[currentRoomId] || "einen Raum";

  let visText = "";

  // 🧼 Wischmop wird gereinigt
  if (statusRaw.includes("washing")) {
    const t = "Wischmop wird gerade gereinigt…";
    sendTelegramMsg(`🧼 ${t}`);
    return setVisText(t, { status: statusRaw, ziel: targetText });
  }

  // 💨 Wischmop trocknet – erst bei gültiger Endzeit senden, nur einmal
  if (airDrying === true) {
    const formattedEnd = formatTime(dryingEndRaw);
    if (!dryingEndRaw || formattedEnd === "unbekannt") {
      setTimeout(updateStatus, 1000);
      return;
    }
    if (!lastVisText.includes("trocknet")) {
      const t = `Wischmop trocknet – fertig um ${formattedEnd} Uhr`;
      sendTelegramMsg(`💨 ${t}`);
      setVisText(t, { status: statusRaw, ziel: targetText, endzeit: formattedEnd });
    }
    return;
  }

  // 🧼 Trocknung war aktiv und ist jetzt beendet → Status neu setzen
  if (airDrying === false && lastVisText.includes("trocknet")) {
    if (battery === 100 && statusRaw.includes("charging")) {
      const t = "Vollgetankt und einsatzbereit!";
      return setVisText(t, { status: statusRaw, ziel: targetText, aktuellerRaum: currentRoomText });
    } else if (statusRaw.includes("charging")) {
      const t = "Bin an der Ladestation und tanke Energie.";
      return setVisText(t, { status: statusRaw, ziel: targetText, aktuellerRaum: currentRoomText });
    }
  }

  if (battery === 100 && statusRaw.includes("charging")) {
    visText = "Vollgetankt und einsatzbereit!";
    return setVisText(visText, { status: statusRaw, ziel: targetText, aktuellerRaum: currentRoomText });
  }

  if (statusRaw.includes("charging") && area === 0) {
    visText = "Bin an der Ladestation und tanke Energie.";
    return setVisText(visText, { status: statusRaw, ziel: targetText, aktuellerRaum: currentRoomText });
  }

  if (statusRaw.includes("cleaning") && currentRoomId !== targetId && !statusRaw.includes("washing") && !airDrying) {
    const telegramMsg = `🚗 Der Deebot fährt jetzt los, um ${targetText} zu ${modeInfo.infinitive}.`;
    const visMsg = `Der Deebot fährt jetzt los, um ${targetText} zu ${modeInfo.infinitive}.`;
    sendTelegramMsg(telegramMsg);
    return setVisText(visMsg, { status: statusRaw, ziel: targetText, aktuellerRaum: currentRoomText });
  }

  if (statusRaw.includes("cleaning") && currentRoomId === targetId && !statusRaw.includes("washing") && !airDrying) {
    visText = `Ich ${modeInfo.ichForm} jetzt ${currentRoomText}.`;
    return setVisText(visText, { status: statusRaw, ziel: targetText, aktuellerRaum: currentRoomText });
  }

  if (statusRaw.includes("returning")) {
    const korrektTargets = makeVonForm(targetText);
    const telegramMsg = `✅ Reinigung ${korrektTargets} abgeschlossen\n📏 Fläche: ${area} m²\n⏱️ Dauer: ${dauer}\nIch fahre jetzt zur Ladestation`;
    const visMsg = `Reinigung ${korrektTargets} abgeschlossen`;
    sendTelegramMsg(telegramMsg);
    return setVisText(visMsg, { status: statusRaw, ziel: targetText, aktuellerRaum: currentRoomText });
  }

  if (statusRaw.includes("charging") && area > 0) {
    const telegramMsg = "🔋 Ich bin wieder an der Ladestation und tanke Energie.";
    const visMsg = "Bin an der Ladestation und tanke Energie.";
    sendTelegramMsg(telegramMsg);
    return setVisText(visMsg, { status: statusRaw, ziel: targetText, aktuellerRaum: currentRoomText });
  }
}

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
    DP_CLEANING_MODE_DP
  ],
  change: "ne" // ✅ nur bei echten Änderungen auslösen
}, updateStatus);

log(`🔁 Skriptstart: Aktueller Status = ${getState(DP_DEVICE_STATUS).val}`);
updateStatus();
