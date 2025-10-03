// ======= Deebot VIS & Telegram Script – Version 1.1.2 (03.10.2025) =======
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
// - 1.1.0: 🧼 Fix – Endzeit bei Trocknung wird jetzt **einmalig korrekt gespeichert** und nicht mehr überschrieben
// - 1.1.1: 🗺️ Raum-Mapping dynamisch aus DP + Start-Log aller Räume + Fix für „updateStatus not defined“
// - 1.1.2: ⏱️ Neue Trocknungslogik (false→true → +120 Min) + 🧠 Artikel-/Grammatik-Automatik

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
const DP_AIR_DRYING_ACTIVE = "ecovacs-deebot.0.info.extended.airDryingActive";
const DP_MAP_NAMES         = "0_userdata.0.Deebot.MapNumberName";

const TELEGRAM = "telegram.0";

let RAUM_MAPPING = {};
let lastTelegramText = "";
let lastVisText = "";
let dryingEndOnce = null;
let prevAirDryingActive = (() => {
  const v = getState(DP_AIR_DRYING_ACTIVE)?.val;
  return v === true || v === "true" || v === 1;
})();

// 🗺️ Raum-Mapping aus DP laden
function loadRoomMapping() {
  try {
    const mapState = getState(DP_MAP_NAMES)?.val || "{}";
    RAUM_MAPPING = JSON.parse(mapState);
    log("🗺️ Raum-Mapping erfolgreich geladen:");
    for (const [num, name] of Object.entries(RAUM_MAPPING)) {
      log(`   ➤ ID ${num}: ${name}`);
    }
  } catch (e) {
    log("❌ Fehler beim Laden des Raum-Mappings – Fallback wird verwendet", "error");
    RAUM_MAPPING = {};
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

// 🧠 Artikel-Helfer: liefert accusative-Form (den/die/das ...)
function addArtikel(name) {
  if (!name) return name;
  const s = String(name).trim();
  // Wenn bereits ein Artikel oder "vom / von " vorhanden ist, nichts ändern
  if (/^(der |den |die |das |vom |von )/i.test(s)) return s;
  const n = s.toLowerCase();
  if (n.endsWith("e")) return "die " + s;   // Küche -> die Küche
  if (n.endsWith("r")) return "den " + s;   // Flur -> den Flur
  if (n.endsWith("m")) return "das " + s;   // Wohnzimmer -> das Wohnzimmer
  return "den " + s; // Default fallback
}

// makeVonForm erwartet eine artikulierte Form (z.B. "den Flur") und macht "vom Flur" / "von der Küche"
function makeVonForm(phrase) {
  if (!phrase) return phrase;
  const p = String(phrase).trim();
  const lower = p.toLowerCase();
  if (lower.startsWith("den ")) return "vom " + p.substring(p.indexOf(" ") + 1);
  if (lower.startsWith("das ")) return "vom " + p.substring(p.indexOf(" ") + 1);
  if (lower.startsWith("die ") || lower.startsWith("der ")) return "von der " + p.substring(p.indexOf(" ") + 1);
  return "von " + p;
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
  const d = new Date(timestamp);
  return isNaN(d.getTime()) ? "unbekannt" : d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
}

// 🧾 Wenn airDryingActive von false -> true geht, berechne einmalig now + 120min
on({ id: DP_AIR_DRYING_ACTIVE, change: "ne" }, (obj) => {
  const newVal = obj.state.val === true || obj.state.val === "true" || obj.state.val === 1;
  if (newVal && !prevAirDryingActive) {
    const end = new Date(Date.now() + 120 * 60 * 1000);
    dryingEndOnce = formatTime(end);
    log(`💨 Neue Trocknungs-Endzeit gesetzt: ${dryingEndOnce}`);
    // trigger updateStatus sofort, damit Telegram/VIS schnell kommen
    updateStatus();
  }
  prevAirDryingActive = newVal;
});

function updateStatus() {
  const statusRaw = String((getState(DP_DEVICE_STATUS)?.val) || "").toLowerCase();
  const modeInfo = getModeInfo();
  const area = Number(getState(DP_CLEANED_AREA)?.val || 0);
  const seconds = Number(getState(DP_CLEANED_TIME)?.val || 0);
  const dauer = `${Math.floor(seconds / 60)} Min ${seconds % 60} Sek`;
  const battery = Number(getState(DP_BATTERY)?.val || 0);

  const airDryingVal = getState(DP_AIR_DRYING)?.val;
  const airDrying = airDryingVal === true || airDryingVal === "true" || airDryingVal === 1;

  const currentRoomId = String(getState(DP_CURRENT_ROOM_ID)?.val || "");
  const targetId = String(getState(DP_TARGET)?.val || "");
  // -- WICHTIG: Artikel hier anwenden (accusative), Fallback ebenfalls artikuliert
  const rawTargetName = RAUM_MAPPING[targetId];
  const targetText = rawTargetName ? addArtikel(rawTargetName) : `den Raum ${targetId}`;
  const rawCurrentName = RAUM_MAPPING[currentRoomId];
  const currentRoomText = rawCurrentName ? addArtikel(rawCurrentName) : "einen Raum";

  let visText = "";

  // 🧼 Wischmop wird gereinigt
  if (statusRaw.includes("washing")) {
    const t = "Wischmop wird gerade gereinigt…";
    dryingEndOnce = null;
    sendTelegramMsg(`🧼 ${t}`);
    return setVisText(t, { status: statusRaw, ziel: targetText });
  }

  // 💨 Wischmop trocknet
  if (airDrying === true) {
    if (!dryingEndOnce) {
      // falls Endzeit noch nicht gesetzt wurde: kurz warten / retry
      setTimeout(updateStatus, 1000);
      return;
    }
    if (!lastVisText.includes("trocknet")) {
      const t = `Wischmop trocknet – fertig um ${dryingEndOnce} Uhr`;
      sendTelegramMsg(`💨 ${t}`);
      setVisText(t, { status: statusRaw, ziel: targetText, endzeit: dryingEndOnce });
    }
    return;
  }

  // 🧼 Trocknung beendet
  if (airDrying === false && lastVisText.includes("trocknet")) {
    dryingEndOnce = null;
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
    // hier brauchen wir accusative -> targetText ist bereits mit Artikel (z.B. "den Flur")
    const telegramMsg = `🚗 Der Deebot fährt jetzt los, um ${targetText} zu ${modeInfo.infinitive}.`;
    const visMsg = `Der Deebot fährt jetzt los, um ${targetText} zu ${modeInfo.infinitive}.`;
    sendTelegramMsg(telegramMsg);
    return setVisText(visMsg, { status: statusRaw, ziel: targetText, aktuellerRaum: currentRoomText });
  }

  if (statusRaw.includes("cleaning") && currentRoomId === targetId && !statusRaw.includes("washing") && !airDrying) {
    // "Ich sauge/putze/reinige jetzt <die Küche>" -> currentRoomText ist ebenfalls mit Artikel
    visText = `Ich ${modeInfo.ichForm} jetzt ${currentRoomText}.`;
    return setVisText(visText, { status: statusRaw, ziel: targetText, aktuellerRaum: currentRoomText });
  }

  if (statusRaw.includes("returning")) {
    // makeVonForm erwartet bereits artikulierten targetText (z.B. "den Flur")
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

// 🟢 Raum-Mapping laden und Statuslistener aktivieren
loadRoomMapping();

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
    DP_CLEANING_MODE_DP
  ],
  change: "ne"
}, updateStatus);

// 🟡 Initiallog bei Start
log(`🔁 Skriptstart: Aktueller Status = ${getState(DP_DEVICE_STATUS)?.val || "unbekannt"}`);
updateStatus();
