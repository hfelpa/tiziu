/**
 * TIZIU
 * Core Logic & Math
 */

/* Version: 1.0.0-beta.34 */
const CACHE_NAME = 'tiziu-v1.0.0-beta.34';

const MISSIONS = {
    TINIA26: {
        name: 'TINIA26',
        bullseye: { name: 'SILVER', lat: -15.520278, lon: -49.987222, magVar: -21.4 },
        threats: [
            { code: 'SA24', type: 'A/G', range: 3 },
            { code: 'M60', type: 'A/G', range: 24 },
            { code: 'R70', type: 'A/G', range: 3.5 },
            { code: 'S7', type: 'A/G', range: 10 },
            { code: 'SPY', type: 'A/G', range: 18 },
            { code: 'MIS', type: 'A/G', range: 3 },
            { code: 'SA23', type: 'A/G', range: 70 },
            { code: 'F5', type: 'A/A', range: 25 },
            { code: 'F39', type: 'A/A', range: 35 }
        ]
    }
};

// MGRS LIBRARY (Mini-bundle)
const mgrs = (function () {
    const NUM_100K_SETS = 6;
    const SET_ORIGIN_COLUMN_LETTERS = 'AJSAJS';
    const SET_ORIGIN_ROW_LETTERS = 'AFAFAF';
    const A = 65, I = 73, O = 79, V = 86, Z = 90;
    const ECC_SQUARED = 0.00669438;
    const SCALE_FACTOR = 0.9996;
    const SEMI_MAJOR_AXIS = 6378137;
    const EASTING_OFFSET = 500000;
    const NORTHING_OFFFSET = 10000000;
    const UTM_ZONE_WIDTH = 6;
    const HALF_UTM_ZONE_WIDTH = UTM_ZONE_WIDTH / 2;

    function degToRad(deg) { return (deg * (Math.PI / 180)); }
    function radToDeg(rad) { return (180 * (rad / Math.PI)); }

    function getLetterDesignator(latitude) {
        if (latitude <= 84 && latitude >= 72) return 'X';
        else if (latitude < 72 && latitude >= -80) {
            const bandLetters = 'CDEFGHJKLMNPQRSTUVWX';
            const index = Math.floor((latitude - (-80)) / 8);
            return bandLetters[index];
        }
        return 'Z';
    }

    function LLtoUTM(ll) {
        const Lat = ll.lat; const Long = ll.lon; const a = SEMI_MAJOR_AXIS;
        const LatRad = degToRad(Lat); const LongRad = degToRad(Long);
        let ZoneNumber = Math.floor((Long + 180) / 6) + 1;
        if (Long === 180) ZoneNumber = 60;
        if (Lat >= 56 && Lat < 64 && Long >= 3 && Long < 12) ZoneNumber = 32;
        if (Lat >= 72 && Lat < 84) {
            if (Long >= 0 && Long < 9) ZoneNumber = 31;
            else if (Long >= 9 && Long < 21) ZoneNumber = 33;
            else if (Long >= 21 && Long < 33) ZoneNumber = 35;
            else if (Long >= 33 && Long < 42) ZoneNumber = 37;
        }
        const LongOrigin = (ZoneNumber - 1) * UTM_ZONE_WIDTH - 180 + HALF_UTM_ZONE_WIDTH;
        const LongOriginRad = degToRad(LongOrigin);
        const eccPrimeSquared = (ECC_SQUARED) / (1 - ECC_SQUARED);
        const N = a / Math.sqrt(1 - ECC_SQUARED * Math.sin(LatRad) * Math.sin(LatRad));
        const T = Math.tan(LatRad) * Math.tan(LatRad);
        const C = eccPrimeSquared * Math.cos(LatRad) * Math.cos(LatRad);
        const A = Math.cos(LatRad) * (LongRad - LongOriginRad);
        const M = a * ((1 - ECC_SQUARED / 4 - 3 * ECC_SQUARED * ECC_SQUARED / 64 - 5 * ECC_SQUARED * ECC_SQUARED * ECC_SQUARED / 256) * LatRad - (3 * ECC_SQUARED / 8 + 3 * ECC_SQUARED * ECC_SQUARED / 32 + 45 * ECC_SQUARED * ECC_SQUARED * ECC_SQUARED / 1024) * Math.sin(2 * LatRad) + (15 * ECC_SQUARED / 256 + 45 * ECC_SQUARED * ECC_SQUARED * ECC_SQUARED / 1024) * Math.sin(4 * LatRad) - (35 * ECC_SQUARED * ECC_SQUARED * ECC_SQUARED / 3072) * Math.sin(6 * LatRad));
        const UTMEasting = (SCALE_FACTOR * N * (A + (1 - T + C) * A * A * A / 6 + (5 - 18 * T + T * T + 72 * C - 58 * eccPrimeSquared) * A * A * A / 120) + EASTING_OFFSET);
        let UTMNorthing = (SCALE_FACTOR * (M + N * Math.tan(LatRad) * (A * A / 2 + (5 - T + 9 * C + 4 * C * C) * A * A * A * A / 24 + (61 - 58 * T + T * T + 600 * C - 330 * eccPrimeSquared) * A * A * A * A * A * A / 720)));
        if (Lat < 0) UTMNorthing += NORTHING_OFFFSET;
        return { northing: Math.trunc(UTMNorthing), easting: Math.trunc(UTMEasting), zoneNumber: ZoneNumber, zoneLetter: getLetterDesignator(Lat) };
    }

    function getLetter100kID(column, row, parm) {
        const index = parm - 1;
        const colOrigin = SET_ORIGIN_COLUMN_LETTERS.charCodeAt(index);
        const rowOrigin = SET_ORIGIN_ROW_LETTERS.charCodeAt(index);
        let colInt = colOrigin + column - 1;
        let rowInt = rowOrigin + row;
        let rollover = false;
        if (colInt > Z) { colInt = colInt - Z + A - 1; rollover = true; }
        if (colInt === I || (colOrigin < I && colInt > I) || ((colInt > I || colOrigin < I) && rollover)) colInt++;
        if (colInt === O || (colOrigin < O && colInt > O) || ((colInt > O || colOrigin < O) && rollover)) { colInt++; if (colInt === I) colInt++; }
        if (colInt > Z) colInt = colInt - Z + A - 1;
        if (rowInt > V) { rowInt = rowInt - V + A - 1; rollover = true; } else rollover = false;
        if (((rowInt === I) || ((rowOrigin < I) && (rowInt > I))) || (((rowInt > I) || (rowOrigin < I)) && rollover)) rowInt++;
        if (((rowInt === O) || ((rowOrigin < O) && (rowInt > O))) || (((rowInt > O) || (rowOrigin < O)) && rollover)) { rowInt++; if (rowInt === I) rowInt++; }
        if (rowInt > V) rowInt = rowInt - V + A - 1;
        return String.fromCharCode(colInt) + String.fromCharCode(rowInt);
    }

    function encode(utm, accuracy) {
        const seasting = '00000' + utm.easting; const snorthing = '00000' + utm.northing;
        let setParm = utm.zoneNumber % NUM_100K_SETS; if (setParm === 0) setParm = NUM_100K_SETS;
        const setColumn = Math.floor(utm.easting / 100000);
        const setRow = Math.floor(utm.northing / 100000) % 20;
        const id100k = getLetter100kID(setColumn, setRow, setParm);
        const east = seasting.substr(seasting.length - 5, accuracy);
        const north = snorthing.substr(snorthing.length - 5, accuracy);
        return utm.zoneNumber + utm.zoneLetter + ' ' + id100k + ' ' + east + ' ' + north;
    }

    return { forward: function (ll, acc) { return encode(LLtoUTM({ lat: ll[1], lon: ll[0] }), acc || 5); } };
})();

const CONFIG = {
    R: 3440.065, // Earth radius in Nautical Miles
    TO_RAD: Math.PI / 180,
    TO_DEG: 180 / Math.PI
};

const state = {
    ownPos: { lat: null, lon: null, heading: 0, compass: null },
    watchId: null,
    lastFixTime: 0,
    plots: [],
    targetPos: null,
    originalPlotPos: null,
    startTargetId: 71,
    rangeScale: 40,
    orientation: 'HEADING', // HEADING or NORTH
    threats: [],
    bullseyes: [
        { name: "SILVER", lat: -15.520278, lon: -49.987222, magVar: -21.4 }
    ],
    activeBullseyeName: "SILVER",
    route: [],
    activeInputId: null,
    activePlotIndex: null,
    editingTargetId: null,
    keypadValue: "",
    sensorsActive: false,
    plotMode: 'BE', // 'BE' or 'COORD'
    threatPage: 0,
    declutter: false,
    showClosestThreats: true,
    selectedTargetId: null,
    plotsFilter: 'ALL',
    ringsOnBullseye: false
};

const INPUT_SEQUENCE_BE = ["targetId", "targetRadial", "targetDist", "targetThreat"];
const INPUT_SEQUENCE_COORD = ["targetId", "targetLat", "targetLon", "targetThreat"];

function getActiveInputSequence() {
    return state.plotMode === 'COORD' ? INPUT_SEQUENCE_COORD : INPUT_SEQUENCE_BE;
}

// Format raw string to GG° MM.MM' for realtime typing feedback
function formatCoordinateRealtime(str, isLon) {
    if (!str) return "";
    let maxLen = isLon ? 7 : 6;
    let degLen = isLon ? 3 : 2;

    let padded = str.padEnd(maxLen, '_');

    let deg = padded.slice(0, degLen);
    let minWhole = padded.slice(degLen, degLen + 2);
    let minDec = padded.slice(degLen + 2, degLen + 4);

    let dir = isLon ? 'W' : 'S';
    return `${dir} ${deg}° ${minWhole}.${minDec}'`;
}

function isCoordinateInvalid(str, isLon) {
    if (!str) return false;
    let degLen = isLon ? 3 : 2;
    if (str.length >= degLen) {
        let deg = parseInt(str.slice(0, degLen), 10);
        if (isLon && deg > 180) return true;
        if (!isLon && deg > 90) return true;
        if (isLon && deg === 180 && str.length > degLen && parseInt(str.slice(degLen), 10) > 0) return true;
        if (!isLon && deg === 90 && str.length > degLen && parseInt(str.slice(degLen), 10) > 0) return true;
    }
    if (str.length >= degLen + 2) {
        let minWhole = parseInt(str.slice(degLen, degLen + 2), 10);
        if (minWhole >= 60) return true;
    }
    return false;
}

// Parse string (e.g. 'S 15° 30.50'') into decimal degrees (-15.5083...)
function parseCoordinateInput(formattedStr, isLon) {
    if (!formattedStr) return NaN;
    let str = formattedStr.replace(/\D/g, '');
    if (!str || str.length === 0) return NaN;
    let maxLen = isLon ? 7 : 6;
    let padded = str.padEnd(maxLen, '0');
    let degLen = isLon ? 3 : 2;
    let deg = parseInt(padded.slice(0, degLen), 10);
    let minWhole = parseInt(padded.slice(degLen, degLen + 2), 10);
    let minDec = parseInt(padded.slice(degLen + 2, degLen + 4), 10);

    let decimalDegrees = deg + (minWhole + minDec / 100) / 60;
    return -decimalDegrees; // South/West are negative
}

// UI Elements
const el = {
    ownLat: document.getElementById('ownLat'),
    ownLon: document.getElementById('ownLon'),
    ownLatDisplay: document.getElementById('ownLatDisplay'),
    ownLonDisplay: document.getElementById('ownLonDisplay'),
    bullLat: document.getElementById('bullLat'),
    bullLon: document.getElementById('bullLon'),
    magVar: document.getElementById('magVar'),
    bullBadge: document.getElementById('bull-badge'),
    targetRadial: document.getElementById('targetRadial'),
    targetDist: document.getElementById('targetDist'),
    targetId: document.getElementById('targetId'),
    targetThreat: document.getElementById('targetThreat'),
    resBearing: document.getElementById('resBearing'),
    resRange: document.getElementById('resRange'),
    gpsStatus: document.getElementById('gps-status'),
    compassStatus: document.getElementById('compass-status'),
    navBtns: document.querySelectorAll('.nav-btn'),
    pages: document.querySelectorAll('.page'),
    bullResLat: document.getElementById('bullResLat'),
    bullResLon: document.getElementById('bullResLon'),
    resMGRS: document.getElementById('resMGRS'),
    bullResRadial: document.getElementById('bullResRadial'),
    bullResDist: document.getElementById('bullResDist'),
    targetLat: document.getElementById('targetLat'),
    targetLon: document.getElementById('targetLon'),
    canvas: document.getElementById('tactical-canvas'),
    addPlotBtn: document.getElementById('add-plot-btn'),
    threatSelect: document.getElementById('threat-select'),
    historyGroups: document.getElementById('history-groups'),
    threatsConfigList: document.getElementById('threats-config-list'),
    threatCountBadge: document.getElementById('threat-count-badge'),
    newThreatCode: document.getElementById('new-threat-code'),
    newThreatType: document.getElementById('new-threat-type'),
    newThreatRange: document.getElementById('new-threat-range'),
    addThreatConfigBtn: document.getElementById('add-threat-config-btn'),
    missionFileInput: document.getElementById('mission-file-input'),
    gpxFileInput: document.getElementById('gpx-file-input'),
    keypad: document.getElementById('tactical-keypad'),
    keypadBackdrop: document.getElementById('keypad-backdrop'),
    keypadTitle: document.getElementById('keypad-title'),
    keypadContextInfo: document.getElementById('keypad-context-info'),
    keypadPreview: document.getElementById('keypad-preview'),
    keypadEnterBtn: document.querySelector('.action-ent')
};

const ctx = el.canvas ? el.canvas.getContext('2d') : null;

/**
 * UTILS & SECURITY
 */
function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * MATH UTILS
 */
function toRad(deg) {
    return deg * CONFIG.TO_RAD;
}

function toDeg(rad) {
    return rad * CONFIG.TO_DEG;
}

function getDestPoint(lat, lon, brng, dist) {
    const rLat = toRad(lat);
    const rLon = toRad(lon);
    const rBrng = toRad(brng);
    const dR = dist / CONFIG.R;
    const destLat = Math.asin(Math.sin(rLat) * Math.cos(dR) + Math.cos(rLat) * Math.sin(dR) * Math.cos(rBrng));
    const destLon = rLon + Math.atan2(Math.sin(rBrng) * Math.sin(dR) * Math.cos(rLat), Math.cos(dR) - Math.sin(rLat) * Math.sin(destLat));
    return { lat: toDeg(destLat), lon: (toDeg(destLon) + 540) % 360 - 180 };
}

function getDistance(lat1, lon1, lat2, lon2) {
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return CONFIG.R * c;
}

function getBearing(lat1, lon1, lat2, lon2) {
    const rLat1 = toRad(lat1);
    const rLat2 = toRad(lat2);
    const dLon = toRad(lon2 - lon1);
    const y = Math.sin(dLon) * Math.cos(rLat2);
    const x = Math.cos(rLat1) * Math.sin(rLat2) - Math.sin(rLat1) * Math.cos(rLat2) * Math.cos(dLon);
    return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function toDDM(decimal, isLat) {
    const d = Math.abs(decimal);
    const degrees = Math.floor(d);
    const minutes = ((d - degrees) * 60).toFixed(2);
    const direction = isLat ? (decimal >= 0 ? "N" : "S") : (decimal >= 0 ? "E" : "W");
    const degStr = isLat ? degrees.toString().padStart(2, '0') : degrees.toString().padStart(3, '0');
    return `${direction} ${degStr}° ${minutes.padStart(5, '0')}'`;
}

/**
 * KEYPAD LOGIC
 */
function openKeypad(id, plotIndex = null, element = null) {
    state.activeInputId = id; state.activePlotIndex = plotIndex;
    let currentVal = ""; let label = ""; let contextVal = "";

    // Highlight active element
    document.querySelectorAll('.editing-active').forEach(el => el.classList.remove('editing-active'));
    if (!element && plotIndex === null) element = document.getElementById(id);
    if (element) {
        const group = element.closest('.input-group');
        if (group) group.classList.add('editing-active');
        else element.classList.add('editing-active');
    }

    if (plotIndex === null && !state.editingTargetId) {
        document.body.classList.add('keypad-focused-plot-be');
        document.body.classList.add('keypad-mode-new');
        document.body.classList.remove('keypad-mode-edit');
        window.scrollTo(0, 0);
        setTimeout(() => {
            if (typeof drawTacticalDisplay === 'function') drawTacticalDisplay();
        }, 150);
    } else {
        document.body.classList.add('keypad-focused-plot-be');
        document.body.classList.add('keypad-mode-edit');
        document.body.classList.remove('keypad-mode-new');

        // Save original plot position if not already saved in this session
        if (typeof plotIndex === 'number' && plotIndex !== null && !state.originalPlotPos) {
            const plot = state.plots[plotIndex];
            state.originalPlotPos = {
                lat: plot.lat,
                lon: plot.lon,
                radial: plot.radial,
                dist: plot.dist,
                threatCode: plot.threatCode,
                threatRange: plot.threatRange
            };
        }

        // Highlight active history group
        document.querySelectorAll('.editing-active-group').forEach(el => el.classList.remove('editing-active-group'));
        if (element) {
            const histGroup = element.closest('.history-group');
            if (histGroup) histGroup.classList.add('editing-active-group');
        }

        window.scrollTo(0, 0);
        setTimeout(() => {
            if (typeof drawTacticalDisplay === 'function') drawTacticalDisplay();
        }, 150);
    }

    if (id === 'targetThreat' || id === 'threatCode') {
        label = 'AMEAÇA';
        contextVal = plotIndex !== null ? 'SELECIONE NOVA AMEAÇA' : 'SELECIONE AMEAÇA';
        el.keypadTitle.textContent = label;
        el.keypadContextInfo.textContent = contextVal;

        // Initialize state.keypadValue with the current threat so ENTER preserves it
        if (plotIndex !== null) {
            state.keypadValue = state.plots[plotIndex].threatCode || "";
        } else {
            state.keypadValue = document.getElementById(id).value;
            if (state.keypadValue === "-") state.keypadValue = ""; // Handle placeholder
        }

        document.querySelector('.keypad-grid:not(#keypad-threat-grid)').style.display = 'none';
        document.getElementById('keypad-preview').style.display = 'none';
        document.getElementById('keypad-threat-grid').style.display = 'grid';

        state.threatPage = 0;
        renderThreatKeypad();

        if (plotIndex !== null || state.editingTargetId) {
            el.keypad.classList.add('editing');
            el.keypadEnterBtn.textContent = 'CORRIGIR';
            if (state.editingTargetId) {
                contextVal = `ALTERANDO AMEAÇA DO ALVO ${state.editingTargetId}`;
                el.keypadContextInfo.textContent = contextVal;
            }
        } else {
            el.keypad.classList.remove('editing');
            el.keypadEnterBtn.textContent = 'ENTER';
        }
        el.keypad.style.display = 'flex';
        el.keypadBackdrop.style.display = 'block';
        return;
    }

    document.querySelector('.keypad-grid:not(#keypad-threat-grid)').style.display = 'grid';
    document.getElementById('keypad-preview').style.display = 'inline';
    document.getElementById('keypad-threat-grid').style.display = 'none';

    if (plotIndex !== null) {
        const plot = state.plots[plotIndex]; currentVal = plot[id] ? plot[id].toString() : ""; label = id === 'radial' ? 'RADIAL' : 'DISTÂNCIA'; contextVal = `CORRIGINDO REGISTRO (ATUAL: ${currentVal})`;
        el.keypad.classList.add('editing'); el.keypadEnterBtn.textContent = 'CORRIGIR';
    } else {
        const targetElement = document.getElementById(id); currentVal = targetElement.value; label = targetElement.previousElementSibling.textContent;
        if (id === 'targetLat' || id === 'targetLon') {
            currentVal = currentVal.replace(/\D/g, '');
        }
        const targetId = el.targetId.value; const lastPlot = state.plots.filter(p => p.targetId === targetId).slice(-1)[0];
        if (lastPlot) { const lastVal = (id === 'targetRadial') ? lastPlot.radial : (id === 'targetDist' ? lastPlot.dist : ""); if (lastVal !== "") contextVal = `ÚLTIMO PLOT: ${lastVal}`; }
        el.keypad.classList.remove('editing'); el.keypadEnterBtn.textContent = 'ENTER';
    }
    state.keypadValue = currentVal; el.keypadTitle.textContent = label; el.keypadContextInfo.textContent = contextVal;

    if (id === 'targetLat' || id === 'targetLon') {
        const isLon = id === 'targetLon';
        el.keypadPreview.textContent = formatCoordinateRealtime(state.keypadValue, isLon);
        if (isCoordinateInvalid(state.keypadValue, isLon)) el.keypadPreview.style.color = '#ff3b30';
        else el.keypadPreview.style.color = '';
    } else {
        el.keypadPreview.textContent = currentVal;
        if (id === 'targetRadial' || id === 'radial') {
            const rad = parseFloat(state.keypadValue);
            if (!isNaN(rad) && (rad < 0 || rad > 360)) el.keypadPreview.style.color = '#ff3b30';
            else el.keypadPreview.style.color = '';
        } else {
            el.keypadPreview.style.color = '';
        }
    }
    el.keypad.style.display = 'flex'; el.keypadBackdrop.style.display = 'block';
}

function renderThreatKeypad() {
    const grid = document.getElementById('keypad-threat-grid');
    const ITEMS_PER_PAGE = 6;
    const sortedThreats = [...state.threats].sort((a, b) => {
        if (a.type !== b.type) return a.type === 'A/G' ? -1 : 1;
        return a.code.localeCompare(b.code);
    });
    const start = state.threatPage * ITEMS_PER_PAGE;
    const pageThreats = sortedThreats.slice(start, start + ITEMS_PER_PAGE);
    const hasNext = start + ITEMS_PER_PAGE < sortedThreats.length;
    const hasPrev = state.threatPage > 0;

    let html = '';
    pageThreats.forEach(t => {
        const isAG = t.type === 'A/G';
        const bg = isAG ? 'rgba(255, 176, 0, 0.15)' : 'rgba(100, 150, 255, 0.15)';
        const border = isAG ? '1px solid rgba(255, 176, 0, 0.5)' : '1px solid rgba(100, 150, 255, 0.5)';
        const colorCode = isAG ? '#ffb000' : '#88b8ff';
        const colorRange = isAG ? 'rgba(255, 176, 0, 0.7)' : 'rgba(100, 150, 255, 0.7)';
        html += `<button class="threat-key-btn" style="background:${bg}; border:${border};" onclick="selectThreatInput('${t.code}')">
                    <span class="t-code" style="color:${colorCode}">${t.code}</span>
                    <span class="t-rng" style="color:${colorRange}; font-size: 0.7rem; margin-top: 2px;">${t.type} ${t.range} NM</span>
                 </button>`;
    });

    // Fill empty slots to maintain grid layout
    for (let i = pageThreats.length; i < ITEMS_PER_PAGE; i++) {
        html += `<div class="threat-key-btn t-empty"></div>`;
    }

    if (sortedThreats.length > ITEMS_PER_PAGE) {
        html += `<button class="threat-key-btn threat-control-btn" onclick="changeThreatPage(-1)" ${!hasPrev ? 'disabled' : ''}>❮</button>`;
        html += `<button class="threat-key-btn threat-control-btn" onclick="selectThreatInput('')"><span class="t-code">-</span><span class="t-rng">NENHUMA</span></button>`;
        html += `<button class="threat-key-btn threat-control-btn" onclick="changeThreatPage(1)" ${!hasNext ? 'disabled' : ''}>❯</button>`;
    } else {
        html += `<div class="threat-key-btn t-empty"></div>`;
        html += `<button class="threat-key-btn threat-control-btn" onclick="selectThreatInput('')"><span class="t-code">-</span><span class="t-rng">NENHUMA</span></button>`;
        html += `<div class="threat-key-btn t-empty"></div>`;
    }

    grid.innerHTML = html;
}

window.changeThreatPage = (dir) => {
    state.threatPage += dir;
    renderThreatKeypad();
};

window.selectThreatInput = (code) => {
    state.keypadValue = code;
    updateActiveField();

    // If we are in the main insertion flow, move to ID next
    if (state.activePlotIndex === null && !state.editingTargetId) {
        keypadNav(1); // Auto advance
    } else {
        closeKeypad(); // If editing a history plot or global target threat, just close
    }
};

function updateActiveField() {
    if (state.editingTargetId) {
        const targetId = state.editingTargetId;
        const code = state.keypadValue;
        const threat = state.threats.find(t => t.code === code);
        state.plots.forEach(p => {
            if (p.targetId === targetId) {
                p.threatCode = code || null;
                p.threatRange = threat ? threat.range : null;
                p.threatType = threat ? threat.type : null;
            }
        });
        renderHistory();
        drawTacticalDisplay();
    } else if (state.activePlotIndex !== null) {
        updatePlot(state.activePlotIndex, state.activeInputId, state.keypadValue);
        renderHistory();
        drawTacticalDisplay();
    } else if (state.activeInputId) {
        if (state.activeInputId === 'targetLat' || state.activeInputId === 'targetLon') {
            const isLon = state.activeInputId === 'targetLon';
            const inputEl = document.getElementById(state.activeInputId);
            inputEl.value = formatCoordinateRealtime(state.keypadValue, isLon);
            if (isCoordinateInvalid(state.keypadValue, isLon)) {
                inputEl.style.color = '#ff3b30';
            } else {
                inputEl.style.color = '';
            }
        } else {
            document.getElementById(state.activeInputId).value = state.keypadValue;
        }

        if (state.activeInputId === 'targetId') {
            syncThreatFromLastPlot(state.keypadValue);
        }

        if (state.activeInputId === 'targetRadial' || state.activeInputId === 'radial') {
            const inputEl = document.getElementById(state.activeInputId);
            const rad = parseFloat(state.keypadValue);
            if (!isNaN(rad) && (rad < 0 || rad > 360)) {
                inputEl.style.color = '#ff3b30';
            } else {
                inputEl.style.color = '';
            }
        }

        calculateBRAA();
        calculateBullCoord();
    }
}

window.keyInput = (char) => {
    // Prevent typing raw numbers into the threat code fields
    if (state.activeInputId === 'targetThreat' || state.activeInputId === 'threatCode') {
        return;
    }
    let maxLen = 6;
    if (state.activeInputId === 'targetLon' || state.activeInputId === 'lon') maxLen = 7;
    if (state.activeInputId === 'targetRadial' || state.activeInputId === 'radial') maxLen = 3;
    if (state.activeInputId === 'targetDist' || state.activeInputId === 'dist') maxLen = 3;

    if (char === 'CLR') {
        state.keypadValue = "";
    } else if (char === 'DEL') {
        state.keypadValue = state.keypadValue.slice(0, -1);
    } else {
        if (state.keypadValue.length < maxLen) {
            state.keypadValue += char;
        }
    }

    if (state.activeInputId === 'targetLat' || state.activeInputId === 'targetLon') {
        const isLon = state.activeInputId === 'targetLon';
        el.keypadPreview.textContent = formatCoordinateRealtime(state.keypadValue, isLon);
        if (isCoordinateInvalid(state.keypadValue, isLon)) {
            el.keypadPreview.style.color = '#ff3b30';
        } else {
            el.keypadPreview.style.color = '';
        }
    } else {
        el.keypadPreview.textContent = state.keypadValue;
        if (state.activeInputId === 'targetRadial' || state.activeInputId === 'radial') {
            const rad = parseFloat(state.keypadValue);
            if (!isNaN(rad) && (rad < 0 || rad > 360)) {
                el.keypadPreview.style.color = '#ff3b30';
            } else {
                el.keypadPreview.style.color = '';
            }
        } else {
            el.keypadPreview.style.color = '';
        }
    }

    updateActiveField();

    // Auto advance
    if (char !== 'CLR' && char !== 'DEL' && state.keypadValue.length === maxLen) {
        let shouldAdvance = true;
        if (state.activeInputId === 'targetRadial' || state.activeInputId === 'radial') {
            const rad = parseFloat(state.keypadValue);
            if (!isNaN(rad) && (rad < 0 || rad > 360)) {
                shouldAdvance = false;
            }
        } else if (state.activeInputId === 'targetLat' || state.activeInputId === 'targetLon') {
            const isLon = state.activeInputId === 'targetLon';
            if (isCoordinateInvalid(state.keypadValue, isLon)) {
                shouldAdvance = false;
            }
        }

        if (shouldAdvance && ['targetRadial', 'radial', 'targetLat', 'targetLon', 'targetDist', 'dist'].includes(state.activeInputId)) {
            setTimeout(() => {
                keypadNav(1);
            }, 100);
        }
    }
};

window.keypadNav = (dir) => {
    updateActiveField();
    if (state.activePlotIndex !== null) {
        const sequence = ["threatCode", "radial", "dist"];
        const curIdx = sequence.indexOf(state.activeInputId);
        let nextIdx = (curIdx + dir + sequence.length) % sequence.length;
        const nextElement = document.querySelector(`[onclick*="openKeypad('${sequence[nextIdx]}', ${state.activePlotIndex})"]`);
        openKeypad(sequence[nextIdx], state.activePlotIndex, nextElement);
    } else {
        const sequence = getActiveInputSequence();
        const curIdx = sequence.indexOf(state.activeInputId);
        let nextIdx = (curIdx + dir + sequence.length) % sequence.length;
        const nextElement = document.getElementById(sequence[nextIdx]);
        openKeypad(sequence[nextIdx], null, nextElement);
    }
};

window.confirmKeypad = (shouldAdd) => {
    updateActiveField();
    if (shouldAdd && state.activePlotIndex === null) {
        addPlot();
    }
    closeKeypad();
};
window.closeKeypad = () => {
    el.keypad.style.display = 'none';
    el.keypadBackdrop.style.display = 'none';
    state.activeInputId = null;
    state.activePlotIndex = null;
    state.editingTargetId = null;
    state.targetPos = null; // Clear preview
    state.originalPlotPos = null; // Clear comparison
    document.body.classList.remove('keypad-focused-plot-be');
    document.body.classList.remove('keypad-mode-new');
    document.body.classList.remove('keypad-mode-edit');
    document.querySelectorAll('.editing-active').forEach(el => el.classList.remove('editing-active'));
    document.querySelectorAll('.editing-active-group').forEach(el => el.classList.remove('editing-active-group'));
    setTimeout(() => {
        if (typeof drawTacticalDisplay === 'function') drawTacticalDisplay();
    }, 150);
};

window.exportState = () => {
    const data = {
        type: "tiziu_session_state",
        version: "7.7.3",
        plots: state.plots,
        threats: state.threats,
        bullseyes: state.bullseyes,
        activeBullseyeName: state.activeBullseyeName,
        startTargetId: state.startTargetId
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const d = new Date();
    const dateStr = d.getFullYear() +
        String(d.getMonth() + 1).padStart(2, '0') +
        String(d.getDate()).padStart(2, '0') + "_" +
        String(d.getHours()).padStart(2, '0') +
        String(d.getMinutes()).padStart(2, '0');
    a.href = url;
    a.download = `tiziu_cenario_${dateStr}.json`;
    a.click();
    URL.revokeObjectURL(url);
};

document.querySelectorAll('.custom-keyboard-input').forEach(input => { input.addEventListener('click', () => openKeypad(input.id, null, input)); });

/**
 * MISSION LOADING
 */
function handleMissionFile(event) {
    const file = event.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        const content = e.target.result;
        try {
            if (file.name.endsWith('.json')) {
                const data = JSON.parse(content);
                if (data.type === "tiziu_session_state" || (data.plots && data.threats)) {
                    if (data.plots) state.plots = data.plots;
                    if (data.threats) state.threats = data.threats;
                    if (data.bullseyes) state.bullseyes = data.bullseyes;
                    if (data.activeBullseyeName) {
                        state.activeBullseyeName = data.activeBullseyeName;
                        const activeB = state.bullseyes.find(b => b.name === state.activeBullseyeName);
                        if (activeB) applyBullseye(activeB);
                    }
                    if (data.startTargetId) {
                        state.startTargetId = data.startTargetId;
                        const startInput = document.getElementById('start-target-id-input');
                        if (startInput) startInput.value = data.startTargetId;
                    }
                    updateBullseyesTable();
                    updateThreatDropdowns();
                    renderHistory();
                    drawTacticalDisplay();
                    alert("Cenário completo carregado com sucesso!");
                } else {
                    if (data.bullseye) applyBullseye(data.bullseye);
                    if (data.threats) { state.threats = data.threats; updateThreatDropdowns(); }
                    alert("Preparação de cenário importada com sucesso!");
                }
                return;
            }
            const lines = content.split('\n'); const newThreats = [];
            lines.forEach(line => {
                const parts = line.split(/[,\t ]+/).map(p => p.trim());
                if (parts[0].toUpperCase() === 'BULLSEYE' && parts.length >= 5) { applyBullseye({ name: parts[1], lat: parseFloat(parts[2]), lon: parseFloat(parts[3]), magVar: parseFloat(parts[4]) }); }
                else if (parts.length >= 3) { const code = parts[0].toUpperCase(); const type = parts[1].toUpperCase().includes('A/A') ? 'A/A' : 'A/G'; const range = parseFloat(parts[2]); if (code && !isNaN(range)) newThreats.push({ code, type, range }); }
            });
            if (newThreats.length > 0) { state.threats = newThreats; updateThreatDropdowns(); }
            alert("Cenário de texto importado com sucesso!");
        } catch (err) {
            console.error("Erro ao ler arquivo.", err);
            alert("Erro ao decodificar o arquivo de cenário.");
        }
    };
    reader.readAsText(file);
}

function handleGpxFile(event) {
    const file = event.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        const content = e.target.result;
        try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(content, "text/xml");
            const trkpts = xmlDoc.getElementsByTagName("trkpt");
            const wpts = xmlDoc.getElementsByTagName("wpt");
            const points = trkpts.length > 0 ? trkpts : wpts;
            state.route = [];
            for (let i = 0; i < points.length; i++) {
                const lat = parseFloat(points[i].getAttribute("lat"));
                const lon = parseFloat(points[i].getAttribute("lon"));
                if (!isNaN(lat) && !isNaN(lon)) state.route.push({ lat, lon });
            }
            if (state.route.length > 0) alert(`Rota carregada com ${state.route.length} pontos.`);
            drawTacticalDisplay();
        } catch (err) { console.error("Erro ao ler arquivo GPX.", err); }
    };
    reader.readAsText(file);
}

function updateBullseyeDropdowns() {
    const activeSelect = document.getElementById('active-bullseye-select');
    if (!activeSelect) return;

    const currentSelected = state.activeBullseyeName;
    activeSelect.innerHTML = '';

    state.bullseyes.forEach(b => {
        const opt = document.createElement('option');
        opt.value = b.name;
        opt.textContent = b.name;
        activeSelect.appendChild(opt);
    });

    activeSelect.value = currentSelected;
}

function updateBullseyesTable() {
    const list = document.getElementById('bullseyes-list');
    if (!list) return;

    list.innerHTML = '';
    state.bullseyes.forEach((b, index) => {
        const row = document.createElement('tr');
        const isActive = b.name === state.activeBullseyeName;
        if (isActive) {
            row.classList.add('active-bullseye-row');
        }
        const escapedName = escapeHTML(b.name);

        row.innerHTML = `
            <td class="bullseye-cell-name ${isActive ? 'active-cell' : ''}">${escapedName} ${isActive ? '⭐' : ''}</td>
            <td class="bullseye-cell-val">${b.lat.toFixed(6)}</td>
            <td class="bullseye-cell-val">${b.lon.toFixed(6)}</td>
            <td class="bullseye-cell-val">${b.magVar.toFixed(1)}°</td>
            <td class="bullseye-cell-actions">
                <div style="display: flex; gap: 6px; justify-content: flex-end; align-items: center;">
                    ${isActive
                ? `<span class="badge-active-bullseye">ATIVO</span>`
                : `<button class="btn-tiny" onclick="selectActiveBullseye('${escapedName}')">ATIVAR</button>`
            }
                    ${b.name !== 'SILVER' ? `<button class="btn-tiny btn-tiny-remove" onclick="removeBullseye(${index})">REMOVER</button>` : ''}
                </div>
            </td>
        `;
        list.appendChild(row);
    });
}

window.updateOwnBullPosition = () => {
    const badgeOwn = document.getElementById('own-bull-pos-badge');
    const badgeAlpha = document.getElementById('alpha-check-badge');
    if (!badgeOwn) return;
    const bull = state.bullseyes.find(b => b.name === state.activeBullseyeName);
    if (!bull || !state.ownPos.lat) {
        badgeOwn.textContent = "OWN: ---/---";
        if (badgeAlpha) badgeAlpha.textContent = "ALPHA: ---/---";
        return;
    }
    const d = getDistance(bull.lat, bull.lon, state.ownPos.lat, state.ownPos.lon);
    const b = getBearing(bull.lat, bull.lon, state.ownPos.lat, state.ownPos.lon);

    let radOwnNum = Math.round((b - bull.magVar + 360) % 360);
    if (radOwnNum === 0) radOwnNum = 360;
    const radOwnStr = radOwnNum.toString().padStart(3, '0');

    let radAlphaNum = (radOwnNum + 180) % 360;
    if (radAlphaNum === 0) radAlphaNum = 360;
    const radAlphaStr = radAlphaNum.toString().padStart(3, '0');

    const dist = Math.round(d);

    badgeOwn.textContent = `OWN: ${radOwnStr}/${dist}`;
    if (badgeAlpha) badgeAlpha.textContent = `ALPHA: ${radAlphaStr}/${dist}`;
};

window.selectActiveBullseye = (name) => {
    state.activeBullseyeName = name;
    const bull = state.bullseyes.find(b => b.name === name);
    if (bull) {
        if (el.bullLat) el.bullLat.value = bull.lat;
        if (el.bullLon) el.bullLon.value = bull.lon;
        if (el.magVar) el.magVar.value = bull.magVar;

        const badge = document.getElementById('bull-badge');
        if (badge) {
            badge.textContent = `BULLSEYE ${bull.name}`;
            badge.className = `badge-${bull.name.toLowerCase() === 'silver' ? 'silver' : 'gold'}`;
        }

        const activeSelect = document.getElementById('active-bullseye-select');
        if (activeSelect) activeSelect.value = bull.name;

        const badgeMain = document.getElementById('bull-badge-main');
        if (badgeMain) {
            badgeMain.textContent = 'PLOT BE';
        }

        calculateBRAA();
        calculateBullCoord();
        drawTacticalDisplay();
        updateBullseyesTable();
        if (typeof updateOwnBullPosition === 'function') updateOwnBullPosition();
    }
};

window.toggleDeclutter = () => {
    state.declutter = !state.declutter;
    const btn = document.getElementById('dclt-btn');
    if (btn) {
        if (state.declutter) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    }
    drawTacticalDisplay();
};

window.toggleRingsCenter = () => {
    state.ringsOnBullseye = !state.ringsOnBullseye;
    const btn = document.getElementById('rings-be-btn');
    if (btn) {
        if (state.ringsOnBullseye) {
            btn.classList.add('active');
            btn.textContent = 'RNG BE';
        } else {
            btn.classList.remove('active');
            btn.textContent = 'RNG AC';
        }
    }
    drawTacticalDisplay();
};

window.toggleClosestThreatsOverlay = () => {
    state.showClosestThreats = !state.showClosestThreats;
    const overlay = document.getElementById('closest-threats-overlay');
    if (overlay) {
        if (state.showClosestThreats) {
            overlay.classList.remove('collapsed');
        } else {
            overlay.classList.add('collapsed');
        }
    }
};

window.changeRangeScale = (direction) => {
    const levels = [20, 40, 80, 160];
    let currentIndex = levels.indexOf(state.rangeScale);
    if (currentIndex === -1) currentIndex = 1; // default to 40

    if (direction === 'up') {
        if (currentIndex < levels.length - 1) {
            state.rangeScale = levels[currentIndex + 1];
        }
    } else if (direction === 'down') {
        if (currentIndex > 0) {
            state.rangeScale = levels[currentIndex - 1];
        }
    }

    const display = document.getElementById('zoom-level-display');
    if (display) {
        display.textContent = `${state.rangeScale}`;
    }

    drawTacticalDisplay();
};

function getActiveTargetIds() {
    const ids = new Set();
    state.plots.forEach(p => {
        if (p.targetId) ids.add(p.targetId);
    });
    return Array.from(ids).sort((a, b) => {
        const numA = parseInt(a);
        const numB = parseInt(b);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return String(a).localeCompare(String(b));
    });
}

window.cycleSelectedTarget = (direction) => {
    const ids = getActiveTargetIds();
    if (ids.length === 0) {
        state.selectedTargetId = null;
        updateTargetInspector();
        return;
    }

    let index = ids.indexOf(state.selectedTargetId);
    if (index === -1) {
        state.selectedTargetId = ids[0];
    } else {
        if (direction === 'up') {
            index = (index + 1) % ids.length;
        } else if (direction === 'down') {
            index = (index - 1 + ids.length) % ids.length;
        }
        state.selectedTargetId = ids[index];
    }

    updateTargetInspector();
    drawTacticalDisplay();
};

window.selectTargetId = (id) => {
    state.selectedTargetId = id;
    updateTargetInspector();
    drawTacticalDisplay();
};

function updateTargetInspector() {
    const idDisplay = document.getElementById('selected-target-id-display');
    const detailsDisplay = document.getElementById('target-inspector-details');
    const overlay = document.getElementById('target-inspector-overlay');
    if (!idDisplay || !detailsDisplay) return;

    if (overlay) {
        overlay.classList.remove('critical');
    }

    const ids = getActiveTargetIds();
    if (ids.length === 0) {
        state.selectedTargetId = null;
        if (idDisplay.textContent !== '---') idDisplay.textContent = '---';
        const html = `
            <div class="detail-line faded">SEM ALVO</div>
            <div class="detail-line faded">---</div>
        `;
        if (detailsDisplay.innerHTML !== html) detailsDisplay.innerHTML = html;
        return;
    }

    if (!state.selectedTargetId || !ids.includes(state.selectedTargetId)) {
        state.selectedTargetId = ids[0];
    }

    if (idDisplay.textContent !== state.selectedTargetId) {
        idDisplay.textContent = state.selectedTargetId;
    }

    const latestPlot = state.plots
        .filter(p => p.targetId === state.selectedTargetId)
        .sort((a, b) => b.timestamp - a.timestamp)[0];

    if (!latestPlot) {
        const html = `
            <div class="detail-line faded">SEM DADOS</div>
            <div class="detail-line faded">---</div>
        `;
        if (detailsDisplay.innerHTML !== html) detailsDisplay.innerHTML = html;
        return;
    }

    const code = latestPlot.threatCode || 'ALVO';
    const bull = state.bullseyes.find(b => b.name === state.activeBullseyeName);
    let beRadial = latestPlot.radial || 0;
    let beDist = latestPlot.dist || 0;
    if (bull) {
        const trueBearing = getBearing(bull.lat, bull.lon, latestPlot.lat, latestPlot.lon);
        const magVar = parseFloat(el.magVar.value) || 0;
        beRadial = Math.round((trueBearing - magVar + 360) % 360);
        beDist = Math.round(getDistance(bull.lat, bull.lon, latestPlot.lat, latestPlot.lon));
    }
    const radialVal = Math.round(beRadial).toString().padStart(3, '0');
    const distVal = Math.round(beDist);
    const beInfo = `BE ${radialVal}/${distVal}`;

    const d = getDistance(state.ownPos.lat, state.ownPos.lon, latestPlot.lat, latestPlot.lon);
    const b = getBearing(state.ownPos.lat, state.ownPos.lon, latestPlot.lat, latestPlot.lon);
    const magVar = parseFloat(el.magVar.value) || 0;
    const magBrg = Math.round((b - magVar + 360) % 360).toString().padStart(3, '0');
    const dist = Math.round(d);
    const braaInfo = `BR ${magBrg}/${dist}`;

    // Apply critical state if selected target meets PUMP criteria
    const isNearOrInside = latestPlot.threatRange && (d <= latestPlot.threatRange + 3);
    if (overlay && isNearOrInside) {
        overlay.classList.add('critical');
    }

    const html = `
        <div class="detail-line">${code}</div>
        <div class="detail-line">${beInfo}</div>
        <div class="detail-line">${braaInfo}</div>
    `;
    if (detailsDisplay.innerHTML !== html) {
        detailsDisplay.innerHTML = html;
    }
}

window.removeBullseye = (index) => {
    const bull = state.bullseyes[index];
    if (bull.name === 'SILVER') return;

    if (confirm(`Remover Bullseye ${bull.name}?`)) {
        state.bullseyes.splice(index, 1);
        if (state.activeBullseyeName === bull.name) {
            selectActiveBullseye('SILVER');
        }
        updateBullseyeDropdowns();
        updateBullseyesTable();
    }
};

window.addBullseyeConfig = () => {
    const nameInput = document.getElementById('newBullName');
    const latInput = document.getElementById('newBullLat');
    const lonInput = document.getElementById('newBullLon');
    const magInput = document.getElementById('newBullMagVar');

    const name = nameInput.value.trim().toUpperCase();
    const lat = parseFloat(latInput.value);
    const lon = parseFloat(lonInput.value);
    const magVar = parseFloat(magInput.value) || 0;

    if (!name || isNaN(lat) || isNaN(lon)) {
        alert("Preencha o Nome, Latitude e Longitude do Bullseye.");
        return;
    }

    if (state.bullseyes.some(b => b.name === name)) {
        alert("Já existe um Bullseye com este nome.");
        return;
    }

    state.bullseyes.push({ name, lat, lon, magVar });
    nameInput.value = '';
    latInput.value = '';
    lonInput.value = '';
    magInput.value = '';

    updateBullseyeDropdowns();
    updateBullseyesTable();
    selectActiveBullseye(name);
};

function applyBullseye(bull) {
    let existing = state.bullseyes.find(b => b.name.toUpperCase() === bull.name.toUpperCase());
    if (!existing) {
        existing = {
            name: bull.name.toUpperCase(),
            lat: bull.lat,
            lon: bull.lon,
            magVar: bull.magVar
        };
        state.bullseyes.push(existing);
        updateBullseyeDropdowns();
        updateBullseyesTable();
    } else {
        existing.lat = bull.lat;
        existing.lon = bull.lon;
        existing.magVar = bull.magVar;
        updateBullseyesTable();
    }
    selectActiveBullseye(existing.name);
}

window.loadDefaultMission = (showAlert = false) => {
    state.bullseyes = [
        { name: "SILVER", lat: -15.520278, lon: -49.987222, magVar: -21.4 }
    ];
    updateBullseyeDropdowns();
    updateBullseyesTable();
    const m = MISSIONS.TINIA26; applyBullseye(m.bullseye); state.threats = JSON.parse(JSON.stringify(m.threats)); updateThreatDropdowns();
    if (showAlert) alert(`Missão ${m.name} carregada.`);
};

window.resetThreats = () => { if (confirm("Limpar todas as ameaças?")) { state.threats = []; updateThreatDropdowns(); } };

/**
 * CORE LOGIC
 */
function calculateBRAA() {
    const bullLat = parseFloat(el.bullLat.value); const bullLon = parseFloat(el.bullLon.value); const magVar = parseFloat(el.magVar.value) || 0;
    const ownLat = state.ownPos.lat; const ownLon = state.ownPos.lon;

    let targetPos = null;
    let radial = NaN, dist = NaN;

    if (state.plotMode === 'BE') {
        radial = parseFloat(el.targetRadial.value); dist = parseFloat(el.targetDist.value);
        if (isNaN(radial) || isNaN(dist)) { el.resBearing.textContent = "---°"; el.resRange.textContent = "---"; return; }
        const trueRadial = (radial + magVar + 360) % 360;
        targetPos = getDestPoint(bullLat, bullLon, trueRadial, dist);
    } else {
        const tLat = parseCoordinateInput(el.targetLat.value, false);
        const tLon = parseCoordinateInput(el.targetLon.value, true);
        if (isNaN(tLat) || isNaN(tLon)) { el.resBearing.textContent = "---°"; el.resRange.textContent = "---"; return; }
        targetPos = { lat: tLat, lon: tLon };
    }

    if (ownLat === null || ownLon === null || !targetPos) { el.resBearing.textContent = "---°"; el.resRange.textContent = "---"; return; }

    const trueBearingToTarget = getBearing(ownLat, ownLon, targetPos.lat, targetPos.lon);
    const magBearingToTarget = (trueBearingToTarget - magVar + 360) % 360;
    const rangeToTarget = getDistance(ownLat, ownLon, targetPos.lat, targetPos.lon);
    el.resBearing.textContent = Math.round(magBearingToTarget).toString().padStart(3, '0') + '°'; el.resRange.textContent = Math.round(rangeToTarget);

    if (state.plotMode === 'BE') {
        state.targetPos = { lat: targetPos.lat, lon: targetPos.lon, radial, dist };
    } else {
        const tb = getBearing(bullLat, bullLon, targetPos.lat, targetPos.lon);
        const tr = (tb - magVar + 360) % 360;
        const d = getDistance(bullLat, bullLon, targetPos.lat, targetPos.lon);
        state.targetPos = { lat: targetPos.lat, lon: targetPos.lon, radial: Math.round(tr), dist: Math.round(d) };
    }
    drawTacticalDisplay();
}

function calculateBullCoord() {
    const bullLat = parseFloat(el.bullLat.value); const bullLon = parseFloat(el.bullLon.value); const magVar = parseFloat(el.magVar.value) || 0;

    if (state.plotMode === 'BE') {
        const radial = parseFloat(el.targetRadial.value); const dist = parseFloat(el.targetDist.value);
        if (isNaN(radial) || isNaN(dist)) { el.bullResLat.textContent = "S 00° 00.00'"; el.bullResLon.textContent = "W 000° 00.00'"; el.resMGRS.textContent = "---"; return; }
        const trueRadial = (radial + magVar + 360) % 360; const targetPos = getDestPoint(bullLat, bullLon, trueRadial, dist);
        el.bullResLat.textContent = toDDM(targetPos.lat, true); el.bullResLon.textContent = toDDM(targetPos.lon, false);
        try { el.resMGRS.textContent = mgrs.forward([targetPos.lon, targetPos.lat], 4); } catch (e) { el.resMGRS.textContent = "ERR"; }
    } else {
        const tLat = parseCoordinateInput(el.targetLat.value, false);
        const tLon = parseCoordinateInput(el.targetLon.value, true);
        if (isNaN(tLat) || isNaN(tLon)) { el.bullResRadial.textContent = "---°"; el.bullResDist.textContent = "---"; return; }

        const trueBearing = getBearing(bullLat, bullLon, tLat, tLon);
        const magRadial = (trueBearing - magVar + 360) % 360;
        const dist = getDistance(bullLat, bullLon, tLat, tLon);

        el.bullResRadial.textContent = Math.round(magRadial).toString().padStart(3, '0') + '°';
        el.bullResDist.textContent = Math.round(dist);
    }
}

/**
 * THREATS & HISTORY
 */
function updateThreatDropdowns() {
    renderThreatConfig();
}

function renderThreatConfig() {
    if (el.threatCountBadge) el.threatCountBadge.textContent = state.threats.length;
    el.threatsConfigList.innerHTML = state.threats.map((t, index) => {
        const escapedCode = escapeHTML(t.code);
        const escapedType = escapeHTML(t.type);
        return `
        <div class="threat-card-modern">
            <div class="threat-info-modern">
                <span class="threat-code-modern">${escapedCode}</span>
                <div class="threat-meta-modern" style="margin-top: 4px;">
                    <span class="threat-type-tag" style="background: ${t.type === 'A/A' ? 'rgba(255,255,255,0.1)' : 'rgba(255, 176, 0, 0.2)'}; color: ${t.type === 'A/A' ? '#ccc' : 'var(--secondary-color)'}; border: 1px solid ${t.type === 'A/A' ? 'rgba(255,255,255,0.15)' : 'rgba(255,176,0,0.3)'}; padding: 2px 6px; border-radius: 4px; margin-right: 5px; font-size: 0.7rem; font-weight: bold;">${escapedType}</span>
                    <span style="font-family: var(--font-mono); font-size: 0.75rem;">${t.range} NM</span>
                </div>
            </div>
            <div style="display: flex; gap: 8px;">
                <button class="btn-edit-threat-modern" onclick="editThreat(${index})">✎</button>
                <button class="btn-delete-threat-modern" onclick="deleteThreat(${index})">×</button>
            </div>
        </div>
        `;
    }).join('');
}

function deleteThreat(index) {
    const t = state.threats[index];
    if (confirm(`Remover Ameaça ${t.code}?`)) {
        state.threats.splice(index, 1);
        updateThreatDropdowns();
        drawTacticalDisplay();
    }
}

window.editThreat = (index) => {
    const t = state.threats[index];
    const newCode = prompt("Código da Ameaça:", t.code);
    if (newCode === null) return;
    const cleanCode = newCode.trim().toUpperCase();
    if (!cleanCode) {
        alert("Código inválido.");
        return;
    }

    const newType = prompt("Tipo da Ameaça (A/A ou A/G):", t.type);
    if (newType === null) return;
    const cleanType = newType.trim().toUpperCase();
    if (cleanType !== 'A/A' && cleanType !== 'A/G') {
        alert("Tipo inválido. Deve ser A/A ou A/G.");
        return;
    }

    const newRangeStr = prompt("Alcance da Ameaça (NM):", t.range);
    if (newRangeStr === null) return;
    const newRange = parseFloat(newRangeStr);
    if (isNaN(newRange) || newRange <= 0) {
        alert("Alcance inválido.");
        return;
    }

    const oldCode = t.code;
    t.code = cleanCode;
    t.type = cleanType;
    t.range = newRange;

    // Dynamically update existing plots using this threat code
    state.plots.forEach(p => {
        if (p.threatCode === oldCode) {
            p.threatCode = t.code;
            p.threatRange = t.range;
            p.threatType = t.type;
        }
    });

    updateThreatDropdowns();
    drawTacticalDisplay();
    renderHistory();
};
function syncThreatFromLastPlot(id) {
    const targetPlots = state.plots.filter(p => p.targetId === id);
    const threatInput = document.getElementById('targetThreat');
    if (threatInput) {
        if (targetPlots.length > 0) {
            targetPlots.sort((a, b) => b.timestamp - a.timestamp);
            const lastThreat = targetPlots[0].threatCode || "";
            threatInput.value = lastThreat;
        }
    }
}

function selectTargetId(id) {
    el.targetId.value = id;
    syncThreatFromLastPlot(id);
}

function addPlot() {
    // If targetPos isn't set yet, compute it fresh from the current field values
    if (!state.targetPos) {
        const bullLat = parseFloat(el.bullLat.value);
        const bullLon = parseFloat(el.bullLon.value);
        const magVar = parseFloat(el.magVar.value) || 0;

        if (state.plotMode === 'BE') {
            const radial = parseFloat(el.targetRadial.value);
            const dist = parseFloat(el.targetDist.value);
            if (isNaN(radial) || isNaN(dist) || isNaN(bullLat) || isNaN(bullLon)) return;
            const trueRadial = (radial + magVar + 360) % 360;
            const pos = getDestPoint(bullLat, bullLon, trueRadial, dist);
            state.targetPos = { lat: pos.lat, lon: pos.lon, radial, dist };
        } else {
            const tLat = parseCoordinateInput(el.targetLat.value, false);
            const tLon = parseCoordinateInput(el.targetLon.value, true);
            if (isNaN(tLat) || isNaN(tLon) || isNaN(bullLat) || isNaN(bullLon)) return;

            const trueBearing = getBearing(bullLat, bullLon, tLat, tLon);
            const magRadial = (trueBearing - magVar + 360) % 360;
            const dist = getDistance(bullLat, bullLon, tLat, tLon);
            state.targetPos = { lat: tLat, lon: tLon, radial: Math.round(magRadial), dist: Math.round(dist) };
        }
    }

    const threatCode = el.targetThreat.value;
    const threat = state.threats.find(t => t.code === threatCode);
    const targetId = el.targetId.value || "71";

    state.plots.push({
        ...state.targetPos,
        targetId: targetId,
        threatCode: threatCode && threatCode !== '-' ? threatCode : null,
        threatRange: threat ? threat.range : null,
        threatType: threat ? threat.type : null,
        timestamp: Date.now()
    });

    state.selectedTargetId = targetId;

    // Clear all input fields
    el.targetRadial.value = "";
    el.targetDist.value = "";
    el.targetLat.value = "";
    el.targetLon.value = "";
    el.targetRadial.style.color = '';

    // Calculate next available ID
    const usedIds = new Set(state.plots.map(p => p.targetId));
    let nextId = state.startTargetId || 1;
    while (usedIds.has(nextId.toString())) { nextId++; }
    el.targetId.value = nextId.toString();

    if (el.targetThreat) el.targetThreat.value = "-";
    state.targetPos = null;

    // Clear threat unless next ID has prior history
    const nextPlots = state.plots.filter(p => p.targetId === nextId.toString());
    el.targetThreat.value = nextPlots.length > 0
        ? (nextPlots.sort((a, b) => b.timestamp - a.timestamp)[0].threatCode || "")
        : "";

    // Force clear all result displays
    el.resBearing.textContent = "---°";
    el.resRange.textContent = "---";
    el.bullResLat.textContent = "S 00° 00.00'";
    el.bullResLon.textContent = "W 000° 00.00'";
    el.resMGRS.textContent = "---";
    if (el.bullResRadial) el.bullResRadial.textContent = "---°";
    if (el.bullResDist) el.bullResDist.textContent = "---";

    renderHistory();
    drawTacticalDisplay();
}

window.clearPlotFields = () => {
    el.targetRadial.value = "";
    el.targetDist.value = "";
    el.targetLat.value = "";
    el.targetLon.value = "";
    el.targetRadial.style.color = '';
    if (el.targetThreat) el.targetThreat.value = "-";
    state.targetPos = null;

    const usedIds = new Set(state.plots.map(p => p.targetId));
    let nextId = state.startTargetId || 1;
    while (usedIds.has(nextId.toString())) { nextId++; }
    el.targetId.value = nextId.toString();

    // Force clear all outputs directly
    el.resBearing.textContent = "---°";
    el.resRange.textContent = "---";
    el.bullResLat.textContent = "S 00° 00.00'";
    el.bullResLon.textContent = "W 000° 00.00'";
    el.resMGRS.textContent = "---";
    if (el.bullResRadial) el.bullResRadial.textContent = "---°";
    if (el.bullResDist) el.bullResDist.textContent = "---";

    drawTacticalDisplay();
};

window.updateStartTargetId = (val) => {
    const parsed = parseInt(val) || 1;
    state.startTargetId = Math.max(1, parsed);

    // Auto-update next target ID input field if it's currently free and below the new start ID
    const usedIds = new Set(state.plots.map(p => p.targetId));
    let nextId = state.startTargetId;
    while (usedIds.has(nextId.toString())) {
        nextId++;
    }
    if (el.targetId) {
        el.targetId.value = nextId.toString();
    }
};

function renderHistory() {
    // Remember which groups are currently expanded in the DOM to preserve state
    const expandedGroups = new Set();
    document.querySelectorAll('.history-group').forEach(groupEl => {
        if (!groupEl.classList.contains('collapsed')) {
            const titleEl = groupEl.querySelector('.history-group-title');
            if (titleEl) {
                expandedGroups.add(titleEl.textContent.trim());
            }
        }
    });

    const groups = state.plots.reduce((acc, plot, index) => {
        if (!acc[plot.targetId]) acc[plot.targetId] = [];
        acc[plot.targetId].push({ ...plot, originalIndex: index });
        return acc;
    }, {});

    // First sort the items in each group to determine the latest plot
    Object.values(groups).forEach(items => {
        items.sort((a, b) => b.timestamp - a.timestamp);
    });

    let entries = Object.entries(groups);
    if (state.plotsFilter === 'A/G') {
        entries = entries.filter(([id, items]) => {
            const latest = items[0] || {};
            return latest.threatType === 'A/G';
        });
    } else if (state.plotsFilter === 'A/A') {
        entries = entries.filter(([id, items]) => {
            const latest = items[0] || {};
            return latest.threatType === 'A/A';
        });
    }

    el.historyGroups.innerHTML = entries.map(([id, items]) => {
        const escapedId = escapeHTML(id);
        const isCollapsed = !expandedGroups.has(escapedId);
        const collapsedClass = isCollapsed ? ' collapsed' : '';

        // Extract threat type and threat code from the latest plot in this group
        const latestPlot = items[0] || {};
        const threatType = latestPlot.threatType;
        const threatCode = latestPlot.threatCode;

        let parentCoordStr = "";
        if (latestPlot.lat !== undefined && latestPlot.lon !== undefined) {
            const latDM = toDDM(latestPlot.lat, true);
            const lonDM = toDDM(latestPlot.lon, false);
            let mgrsStr = "---";
            try { mgrsStr = mgrs.forward([latestPlot.lon, latestPlot.lat], 4); } catch (e) { }
            parentCoordStr = `<span class="hist-coords-info" style="font-size: 10px; opacity: 0.6; font-family: monospace; margin-left: 4px;">${latDM} ${lonDM} / ${mgrsStr}</span>`;
        }

        const typeTag = threatType ? `<span class="badge-hist-tag type-${threatType.toLowerCase() === 'a/a' ? 'aa' : 'ag'}" onclick="event.stopPropagation(); editTargetThreatCode('${escapedId}')">${escapeHTML(threatType)}</span>` : '';
        const codeTag = threatCode ? `<span class="badge-hist-tag code-val" onclick="event.stopPropagation(); editTargetThreatCode('${escapedId}')">${escapeHTML(threatCode)}</span>` : `<span class="badge-hist-tag code-none" onclick="event.stopPropagation(); editTargetThreatCode('${escapedId}')">+ AMEAÇA</span>`;

        return `
            <div class="history-group${collapsedClass}">
                <div class="history-group-header">
                    <div onclick="selectTargetPlot('${escapedId}')" style="flex:1; display:flex; align-items:center; gap:8px; flex-wrap: wrap;">
                        <span class="history-group-title">${escapedId}</span>
                        ${typeTag}
                        ${codeTag}
                        ${parentCoordStr}
                    </div>
                    <div style="display:flex; gap:12px; align-items:center;">
                        <span class="badge-plots-count">[${items.length} PLOTS]</span>
                        <button class="btn-remove-target" onclick="event.stopPropagation(); removeTargetTrack('${escapedId}')">×</button>
                        <span class="toggle-icon" onclick="this.parentElement.parentElement.parentElement.classList.toggle('collapsed')">▼</span>
                    </div>
                </div>
                <div class="history-group-content">
                    ${items.map((plot, i) => {
            const plotNumber = items.length - i;
            let rowCoordStr = "";
            if (plot.lat !== undefined && plot.lon !== undefined) {
                const latDM = toDDM(plot.lat, true);
                const lonDM = toDDM(plot.lon, false);
                let mgrsStr = "---";
                try { mgrsStr = mgrs.forward([plot.lon, plot.lat], 4); } catch (e) { }
                rowCoordStr = `<div class="plot-row-coords" style="width: 100%; margin-left: 20px; font-size: 10px; opacity: 0.6; font-family: monospace; margin-top: 4px;">${latDM} ${lonDM} / ${mgrsStr}</div>`;
            }
            return `
                        <div class="plot-history-row" style="flex-wrap: wrap;">
                            <div style="display: flex; align-items: center; gap: 8px; width: 100%;">
                                <span class="plot-number-label">${plotNumber}.</span>
                                <div class="plot-pills-container" style="flex: 1;">
                                    <!-- RADIAL PILL -->
                                    <div class="history-pill radial-pill" onclick="openKeypad('radial', ${plot.originalIndex}, this)">
                                        <span class="history-pill-label">RADIAL</span>
                                        <span class="history-pill-value">${plot.radial.toString().padStart(3, '0')}°</span>
                                    </div>
                                    
                                    <!-- DISTANCE PILL -->
                                    <div class="history-pill dist-pill" onclick="openKeypad('dist', ${plot.originalIndex}, this)">
                                        <span class="history-pill-label">DIST</span>
                                        <span class="history-pill-value">${plot.dist} NM</span>
                                    </div>
                                </div>
                                <button class="btn-remove-plot" onclick="removePlot(${plot.originalIndex})">×</button>
                            </div>
                            ${rowCoordStr}
                        </div>
                        `;
        }).join('')}
                </div>
            </div>
        `;
    }).join('');
}

window.setPlotsFilter = (filter) => {
    state.plotsFilter = filter;
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    if (filter === 'ALL') {
        const btn = document.getElementById('btn-filter-all');
        if (btn) btn.classList.add('active');
    } else if (filter === 'A/G') {
        const btn = document.getElementById('btn-filter-ag');
        if (btn) btn.classList.add('active');
    } else if (filter === 'A/A') {
        const btn = document.getElementById('btn-filter-aa');
        if (btn) btn.classList.add('active');
    }
    renderHistory();
};

window.toggleTheme = () => {
    const body = document.body;
    const btn = document.getElementById('theme-toggle-btn');
    if (body.classList.contains('light-mode')) {
        body.classList.remove('light-mode');
        localStorage.setItem('theme', 'dark');
        if (btn) btn.textContent = '◐';
    } else {
        body.classList.add('light-mode');
        localStorage.setItem('theme', 'light');
        if (btn) btn.textContent = '◐';
    }
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
        metaThemeColor.setAttribute('content', body.classList.contains('light-mode') ? '#f4f5f7' : '#000000');
    }
    drawTacticalDisplay();
};

window.initTheme = () => {
    const savedTheme = localStorage.getItem('theme');
    const body = document.body;
    const btn = document.getElementById('theme-toggle-btn');
    if (savedTheme === 'light') {
        body.classList.add('light-mode');
        if (btn) btn.textContent = '◐';
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) metaThemeColor.setAttribute('content', '#f4f5f7');
    } else {
        body.classList.remove('light-mode');
        if (btn) btn.textContent = '◐';
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) metaThemeColor.setAttribute('content', '#000000');
    }
};

window.updatePlot = (index, field, value) => {
    const plot = state.plots[index];
    if (field === 'threatCode') {
        const threat = state.threats.find(t => t.code === value);
        plot.threatCode = value || null;
        plot.threatRange = threat ? threat.range : null;
        plot.threatType = threat ? threat.type : null;
    } else {
        plot[field] = parseFloat(value);
    }

    const bullLat = parseFloat(el.bullLat.value);
    const bullLon = parseFloat(el.bullLon.value);
    const magVar = parseFloat(el.magVar.value) || 0;
    const trueRadial = (plot.radial + magVar + 360) % 360;

    const pos = getDestPoint(bullLat, bullLon, trueRadial, plot.dist);
    plot.lat = pos.lat;
    plot.lon = pos.lon;

    drawTacticalDisplay();
    renderHistory();
};

window.removePlot = (index) => {
    state.plots.splice(index, 1);
    renderHistory();
    drawTacticalDisplay();
};

window.removeTargetTrack = (targetId) => {
    if (confirm(`Deseja remover o alvo ${targetId} e todo o seu histórico?`)) {
        state.plots = state.plots.filter(p => p.targetId !== targetId);
        if (state.selectedTargetId === targetId) {
            state.selectedTargetId = null;
            updateTargetInspector();
        }
        renderHistory();
        drawTacticalDisplay();
    }
};

window.deleteThreat = deleteThreat;
window.selectTargetId = selectTargetId;

window.selectTargetPlot = (id) => {
    selectTargetId(id);
    state.selectedTargetId = id;
    updateTargetInspector();
    drawTacticalDisplay();
    openKeypad('targetRadial');
};

window.editTargetThreatCode = (targetId) => {
    state.editingTargetId = targetId;
    openKeypad('threatCode', 'target-global', null);
};

/**
 * TACTICAL DISPLAY
 */


function getMagneticHeading() {
    const magVar = parseFloat(el.magVar.value) || 0;
    if (state.ownPos.compass !== null) return state.ownPos.compass;
    if (state.ownPos.heading !== null && state.ownPos.heading !== 0) return (state.ownPos.heading - magVar + 360) % 360;
    return state.ownPos.heading || 0;
}

function updateClosestThreats() {
    const overlayContent = document.getElementById('closest-threats-content');
    if (!overlayContent) return;

    if (!state.ownPos.lat || state.plots.length === 0) {
        overlayContent.innerHTML = `<div class="closest-threat-item" style="opacity: 0.4;">SEM ALVOS</div>`;
        return;
    }

    // Find latest plot for each target ID
    const latestById = {};
    state.plots.forEach(p => {
        if (!latestById[p.targetId] || p.timestamp > latestById[p.targetId].timestamp) {
            latestById[p.targetId] = p;
        }
    });

    const targets = Object.values(latestById);
    const magVar = parseFloat(el.magVar.value) || 0;

    // Filter to A/A only and calculate distance
    const aaTargets = [];
    targets.forEach(p => {
        if (p.threatType === 'A/A') {
            const d = getDistance(state.ownPos.lat, state.ownPos.lon, p.lat, p.lon);
            aaTargets.push({ plot: p, dist: d });
        }
    });

    // Sort by distance ascending
    aaTargets.sort((a, b) => a.dist - b.dist);

    // Get the top 3 closest
    const top3 = aaTargets.slice(0, 3);

    let html = '';
    if (top3.length === 0) {
        html = `<div class="closest-threat-item" style="opacity: 0.4;">SEM AMEAÇAS</div>`;
    } else {
        top3.forEach((item, index) => {
            const p = item.plot;
            const b = getBearing(state.ownPos.lat, state.ownPos.lon, p.lat, p.lon);
            const magBrg = Math.round((b - magVar + 360) % 360).toString().padStart(3, '0');
            const distVal = Math.round(item.dist);
            const code = p.threatCode || 'ALVO';

            // Proximity/pump criteria (d <= threatRange + 3)
            const isNearOrInside = p.threatRange && (item.dist <= p.threatRange + 3);
            const itemClass = isNearOrInside ? 'closest-threat-item critical' : 'closest-threat-item';
            const nameSpan = isNearOrInside ? `<span class="threat-name-blink">${code}</span>` : code;

            html += `<div class="${itemClass}" style="cursor: pointer;" onclick="window.selectTargetId('${p.targetId}')">(${p.targetId}) ${nameSpan} - ${magBrg}/${distVal}</div>`;
        });
    }

    if (overlayContent.innerHTML !== html) {
        overlayContent.innerHTML = html;
    }
}

function drawTacticalDisplay() {
    if (!ctx) return;
    updateClosestThreats();
    updateTargetInspector();
    const zoomDisp = document.getElementById('zoom-level-display');
    if (zoomDisp) zoomDisp.textContent = `${state.rangeScale}`;
    const cw = el.canvas.parentElement.clientWidth; 
    const ch = el.canvas.parentElement.clientHeight || cw;
    el.canvas.width = cw; 
    el.canvas.height = ch;
    const centerX = cw / 2; const centerY = ch / 2;
    const padding = 32;
    const minDim = Math.min(cw, ch);
    const rOuter = minDim / 2 - padding;
    const rInner = rOuter - 8;
    const scale = state.rangeScale; const pxPerNM = rOuter / scale;

    const activeBull = state.bullseyes.find(b => b.name === state.activeBullseyeName) || state.bullseyes[0];
    const magVar = activeBull ? activeBull.magVar : 0;
    
    let trueHeading = 0;
    if (state.ownPos.compass !== null) {
        trueHeading = state.ownPos.compass;
    } else if (state.ownPos.heading !== null) {
        trueHeading = state.ownPos.heading;
    }
    
    // N UP: Magnetic North is UP -> Rotate canvas by -magVar
    // HDG UP: True Aircraft Heading is UP -> Rotate canvas by -trueHeading
    const rotationRad = (state.orientation === 'HEADING') ? -toRad(trueHeading) : toRad(-magVar);

    const isLightMode = document.body.classList.contains('light-mode');

    ctx.clearRect(0, 0, cw, ch);
    // Fill canvas background based on theme
    ctx.fillStyle = isLightMode ? '#ffffff' : '#000000';
    ctx.fillRect(0, 0, cw, ch);

    ctx.save(); // Save 1: block state for clipping (now removed, but kept for symmetry with restore)
    
    ctx.save(); // Save 2: rotation/translation
    ctx.translate(centerX, centerY);
    ctx.rotate(rotationRad);
    ctx.translate(-centerX, -centerY);

    if (!state.declutter) {
        // DRAW RINGS
        let ringCenterX = centerX;
        let ringCenterY = centerY;
        if (state.ringsOnBullseye && state.bullseyes.length > 0) {
            const be = state.bullseyes.find(b => b.name === state.activeBullseyeName) || state.bullseyes[0];
            if (be) {
                const dBe = getDistance(state.ownPos.lat, state.ownPos.lon, be.lat, be.lon);
                const bBe = getBearing(state.ownPos.lat, state.ownPos.lon, be.lat, be.lon);
                ringCenterX = centerX + Math.sin(toRad(bBe)) * (dBe * pxPerNM);
                ringCenterY = centerY - Math.cos(toRad(bBe)) * (dBe * pxPerNM);
            }
        }
        
        ctx.strokeStyle = isLightMode ? 'rgba(30, 41, 59, 0.12)' : 'rgba(0, 255, 65, 0.12)'; ctx.lineWidth = 1;
        
        // Calculate max distance from ring center to the 4 corners of the canvas
        const corners = [
            {x: 0, y: 0}, {x: cw, y: 0}, {x: 0, y: ch}, {x: cw, y: ch}
        ];
        let maxDistToCorner = 0;
        corners.forEach(c => {
            const d = Math.hypot(c.x - ringCenterX, c.y - ringCenterY);
            if (d > maxDistToCorner) maxDistToCorner = d;
        });
        
        // Step is 1/4 of the scale (e.g., if scale is 40, rings are every 10NM)
        const stepPx = (scale * 0.25) * pxPerNM;
        
        // Draw rings until the radius exceeds the max distance to any canvas corner
        for (let rPx = stepPx; rPx <= maxDistToCorner + stepPx; rPx += stepPx) {
            ctx.beginPath(); 
            ctx.arc(ringCenterX, ringCenterY, rPx, 0, Math.PI * 2); 
            ctx.stroke();
        }

        // DRAW COMPASS ROSE (HSI/ND style as in F-16 image)
        const bezelColor = isLightMode ? 'rgba(30, 41, 59, 1)' : 'rgba(0, 255, 65, 1)';
        const bezelTextColor = bezelColor;
        
        // Ticks point INWARDS from the label circle
        const tickOuter = rOuter - 20; 
        
        for (let magDeg = 0; magDeg < 360; magDeg += 10) {
            // Compass rose is physically at True bearings, but labeled magnetically
            const trueRad = toRad(magDeg + magVar);
            const sinVal = Math.sin(trueRad);
            const cosVal = Math.cos(trueRad);
            
            const is30 = (magDeg % 30 === 0);
            const tickLength = is30 ? 14 : 7;
            const tickInner = tickOuter - tickLength;
            
            const x1 = centerX + sinVal * tickOuter;
            const y1 = centerY - cosVal * tickOuter;
            const x2 = centerX + sinVal * tickInner;
            const y2 = centerY - cosVal * tickInner;
            
            ctx.strokeStyle = bezelColor;
            ctx.lineWidth = is30 ? 1.5 : 1;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
            
            if (is30) {
                let labelText = '';
                if (magDeg === 0) labelText = 'N';
                else if (magDeg === 90) labelText = 'E';
                else if (magDeg === 180) labelText = 'S';
                else if (magDeg === 270) labelText = 'W';
                else {
                    labelText = Math.round(magDeg / 10).toString().padStart(2, '0');
                }
                
                // Labels are outside the ticks
                const rLabel = tickOuter + 14;
                const lx = centerX + sinVal * rLabel;
                const ly = centerY - cosVal * rLabel;
                
                ctx.save();
                ctx.translate(lx, ly);
                ctx.rotate(-rotationRad); // Keep upright
                ctx.fillStyle = bezelTextColor;
                ctx.font = '500 14px "JetBrains Mono", monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(labelText, 0, 0);
                ctx.restore();
            }
        }

        // BILLBOARDED SCALE LABELS
        ctx.fillStyle = isLightMode ? 'rgba(30, 41, 59, 0.65)' : 'rgba(255, 255, 255, 0.35)';
        ctx.font = 'bold 9px "Outfit", "Inter", "JetBrains Mono", sans-serif';
        
        let ringIndex = 1;
        for (let rPx = stepPx; rPx <= maxDistToCorner + stepPx; rPx += stepPx) {
            // Don't draw label if it goes off screen vertically
            if (ringCenterY - rPx < 0) continue;
            const currentNM = Math.round(scale * 0.25 * ringIndex);
            const lx = ringCenterX + 5; const ly = ringCenterY - rPx + 12;
            ctx.save(); ctx.translate(lx, ly); ctx.rotate(-rotationRad); ctx.fillText(`${currentNM}`, 0, 0); ctx.restore();
            ringIndex++;
        }
    }

    if (!state.ownPos.lat) { ctx.restore(); return; }

    // DRAW GPX ROUTE
    if (state.route && state.route.length > 0) {
        ctx.strokeStyle = isLightMode ? '#b300b3' : '#ff00ff';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        for (let i = 0; i < state.route.length; i++) {
            const pt = state.route[i];
            const d = getDistance(state.ownPos.lat, state.ownPos.lon, pt.lat, pt.lon);
            const b = getBearing(state.ownPos.lat, state.ownPos.lon, pt.lat, pt.lon);
            const x = centerX + Math.sin(toRad(b)) * (d * pxPerNM);
            const y = centerY - Math.cos(toRad(b)) * (d * pxPerNM);
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.setLineDash([]);
    }

    // DRAW ACTIVE BULLSEYE (BE) ON TACTICAL DISPLAY
    // activeBull is already defined at the top of the function
    if (activeBull) {
        const d = getDistance(state.ownPos.lat, state.ownPos.lon, activeBull.lat, activeBull.lon);
        const b = getBearing(state.ownPos.lat, state.ownPos.lon, activeBull.lat, activeBull.lon);
        const x = centerX + Math.sin(toRad(b)) * (d * pxPerNM);
        const y = centerY - Math.cos(toRad(b)) * (d * pxPerNM);

        const beColor = isLightMode ? 'rgba(0, 141, 166, 0.9)' : 'rgba(0, 229, 255, 0.85)';
        const lineOpacity = isLightMode ? 'rgba(0, 141, 166, 0.3)' : 'rgba(0, 229, 255, 0.25)';

        // Concentric circles
        ctx.strokeStyle = beColor;
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(x, y, 11, 0, Math.PI * 2); ctx.stroke();

        // Small center dot
        ctx.fillStyle = beColor;
        ctx.beginPath(); ctx.arc(x, y, 1.5, 0, Math.PI * 2); ctx.fill();

        if (!state.declutter) {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(toRad(activeBull.magVar));

            // N, S, E, W radial helper lines (infinite, clipped by visor)
            const lineLen = Math.max(cw, ch) * 2;
            ctx.strokeStyle = lineOpacity;
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);

            ctx.beginPath();
            ctx.moveTo(0, -11); ctx.lineTo(0, -lineLen);
            ctx.moveTo(0, 11); ctx.lineTo(0, lineLen);
            ctx.moveTo(11, 0); ctx.lineTo(lineLen, 0);
            ctx.moveTo(-11, 0); ctx.lineTo(-lineLen, 0);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();


        }
        // Reset text state to defaults after bullseye labels
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
    }

    const latestById = {}; state.plots.forEach(p => { if (!latestById[p.targetId] || p.timestamp > latestById[p.targetId].timestamp) latestById[p.targetId] = p; });
    const groups = {}; state.plots.forEach(p => { if (!groups[p.targetId]) groups[p.targetId] = []; groups[p.targetId].push(p); });
    Object.values(groups).forEach(g => g.sort((a, b) => a.timestamp - b.timestamp));



    // Compute screen coordinates for each latest plot to detect proximity conflicts
    const latestScreenCoords = {};
    Object.keys(latestById).forEach(targetId => {
        const plot = latestById[targetId];
        const d = getDistance(state.ownPos.lat, state.ownPos.lon, plot.lat, plot.lon);
        const b = getBearing(state.ownPos.lat, state.ownPos.lon, plot.lat, plot.lon);
        const x = centerX + Math.sin(toRad(b)) * (d * pxPerNM);
        const y = centerY - Math.cos(toRad(b)) * (d * pxPerNM);
        latestScreenCoords[targetId] = { x, y };
    });

    // Identify conflicting labels closer than 35 pixels
    const collapsedLabels = new Set();
    const targetIds = Object.keys(latestScreenCoords);
    for (let i = 0; i < targetIds.length; i++) {
        for (let j = i + 1; j < targetIds.length; j++) {
            const idA = targetIds[i];
            const idB = targetIds[j];
            const pA = latestScreenCoords[idA];
            const pB = latestScreenCoords[idB];
            const distPx = Math.hypot(pA.x - pB.x, pA.y - pB.y);
            if (distPx < 35) {
                collapsedLabels.add(idA);
                collapsedLabels.add(idB);
            }
        }
    }

    // Find the most critical A/A threat (closest to its pump crit range)
    let mostCriticalAAId = null;
    let minPumpMargin = Infinity;
    Object.values(latestById).forEach(plot => {
        if (plot.threatType === 'A/A' && plot.threatRange) {
            const d = getDistance(state.ownPos.lat, state.ownPos.lon, plot.lat, plot.lon);
            const margin = d - plot.threatRange;
            if (margin < minPumpMargin) {
                minPumpMargin = margin;
                mostCriticalAAId = plot.targetId;
            }
        }
    });

    state.plots.forEach((plot, idx) => {
        const d = getDistance(state.ownPos.lat, state.ownPos.lon, plot.lat, plot.lon); const b = getBearing(state.ownPos.lat, state.ownPos.lon, plot.lat, plot.lon);
        const x = centerX + Math.sin(toRad(b)) * (d * pxPerNM); const y = centerY - Math.cos(toRad(b)) * (d * pxPerNM);
        const isLatest = latestById[plot.targetId] === plot;

        const isEditingThis = state.activePlotIndex === idx;
        if (state.declutter && !isLatest && !isEditingThis) return;

        if (isEditingThis) {
            // Draw blue dotted target preview for currently edited existing plot
            ctx.strokeStyle = isLightMode ? '#008da6' : '#00e5ff'; // Sleek cyan/blue edit-color
            ctx.lineWidth = 1.5;
            ctx.setLineDash([2, 3]); // Nice dotted pattern

            ctx.beginPath();
            ctx.arc(x, y, 6, 0, Math.PI * 2);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(x - 10, y); ctx.lineTo(x + 10, y);
            ctx.moveTo(x, y - 10); ctx.lineTo(x, y + 10);
            ctx.stroke();

            if (plot.threatRange && plot.threatType !== 'A/A') {
                ctx.beginPath();
                ctx.arc(x, y, plot.threatRange * pxPerNM, 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.setLineDash([]);
        } else if (isLatest) {
            const isSelected = plot.targetId === state.selectedTargetId;

            // Compute PUMP CRIT FIRST so it can override selected color
            const isNearOrInside = plot.threatRange && (d <= plot.threatRange + 3);
            const isBlinkOn = Math.floor(Date.now() / 400) % 2 === 0;
            const alertLabel = isNearOrInside ? 'PUMP CRIT' : '';

            // Color priority: PUMP CRIT (red) > selected (green) > type-based (grey/orange)
            let targetColor;
            if (isNearOrInside) {
                targetColor = isBlinkOn ? '#ff2020' : '#cc1010'; // Red blink for PUMP CRIT
            } else if (isSelected) {
                targetColor = isLightMode ? '#00a82d' : '#39ff14'; // Neon Green
            } else if (plot.threatType === 'A/A') {
                targetColor = isLightMode ? '#555555' : '#c8c8c8'; // Grey
            } else {
                targetColor = isLightMode ? '#cc7000' : '#ffb000'; // Orange/Gold
            }

            if (plot.threatType === 'A/A') {
                let targetHeading = 0;
                const targetPlots = groups[plot.targetId];
                if (targetPlots && targetPlots.length > 1) {
                    const idxInGroup = targetPlots.indexOf(plot);
                    if (idxInGroup > 0) {
                        const p1 = targetPlots[idxInGroup - 1];
                        targetHeading = getBearing(p1.lat, p1.lon, plot.lat, plot.lon);
                    }
                }

                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(toRad(targetHeading));
                ctx.strokeStyle = targetColor;
                ctx.lineWidth = 2;
                ctx.fillStyle = isLightMode ? '#ffffff' : '#000000';
                ctx.beginPath();
                ctx.moveTo(-5, 4);
                ctx.lineTo(5, 4);
                ctx.lineTo(0, -6);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(0, -6);
                ctx.lineTo(0, -12);
                ctx.stroke();
                ctx.restore();
            } else {
                ctx.fillStyle = targetColor; ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill();
            }

            // Draw target bracket around the selected target (red if PUMP, green if selected)
            if (isSelected) {
                ctx.strokeStyle = isNearOrInside ? (isBlinkOn ? '#ff2020' : '#cc1010') : (isLightMode ? '#00a82d' : '#39ff14');
                ctx.lineWidth = 1.5;
                ctx.strokeRect(x - 9, y - 9, 18, 18);
            }

            const isCollapsed = state.declutter || collapsedLabels.has(plot.targetId);

            if (isCollapsed) {
                // In collapsed mode: draw ID slightly above/right of the dot
                ctx.save(); ctx.translate(x + 10, y - 8); ctx.rotate(-rotationRad);
                ctx.fillStyle = targetColor;
                ctx.font = 'bold 11px JetBrains Mono';
                ctx.fillText(plot.targetId, 0, 8);
                if (alertLabel) {
                    ctx.fillStyle = isBlinkOn ? 'rgba(255, 0, 0, 0.95)' : 'rgba(255, 0, 0, 0.15)';
                    ctx.font = 'bold 10px JetBrains Mono';
                    ctx.fillText(alertLabel, 0, 20);
                }
                ctx.restore();
            } else {
                // Compact label: ID + threat code only, no BRAA or BE
                const infoText = plot.threatCode || '---';

                ctx.font = 'bold 11px JetBrains Mono';
                const mInfo = ctx.measureText(infoText);
                const idText = plot.targetId;
                ctx.font = 'bold 9px JetBrains Mono';
                const mId = ctx.measureText(idText);

                // Measure alert label if active
                ctx.font = 'bold 8px JetBrains Mono';
                const mAlert = alertLabel ? ctx.measureText(alertLabel) : { width: 0 };

                const boxW = Math.max(mInfo.width, mId.width, mAlert.width) + 12;
                const boxH = alertLabel ? 34 : 22;

                // Label box clearly offset from dot
                const labelX = x + 18;
                const labelY = y - 11;

                ctx.save(); ctx.translate(labelX, labelY); ctx.rotate(-rotationRad);
                // Ensure text state is correct (may be dirty from bullseye or other draws)
                ctx.textAlign = 'left';
                ctx.textBaseline = 'alphabetic';

                // Box background with subtle border
                ctx.fillStyle = isLightMode ? 'rgba(255, 255, 255, 0.94)' : 'rgba(0, 0, 0, 0.88)';
                ctx.fillRect(0, 0, boxW, boxH);
                ctx.strokeStyle = isNearOrInside
                    ? 'rgba(255, 32, 32, 0.6)'
                    : (isSelected ? (isLightMode ? 'rgba(0, 168, 45, 0.4)' : 'rgba(57, 255, 20, 0.3)') : 'rgba(128,128,128,0.25)');
                ctx.lineWidth = 1;
                ctx.strokeRect(0, 0, boxW, boxH);

                // Target ID (small, top line)
                ctx.fillStyle = targetColor;
                ctx.font = 'bold 9px JetBrains Mono';
                ctx.fillText(idText, 4, 9);

                // Threat code (main line)
                ctx.fillStyle = targetColor;
                ctx.font = 'bold 10px JetBrains Mono';
                ctx.fillText(infoText, 4, 20);

                // PUMP CRIT alert badge (3rd line)
                if (alertLabel) {
                    ctx.fillStyle = isBlinkOn ? 'rgba(255, 32, 32, 0.95)' : 'rgba(255, 32, 32, 0.35)';
                    ctx.font = 'bold 8px JetBrains Mono';
                    ctx.fillText(alertLabel, 4, 30);
                }
                ctx.restore();
            }

            if (plot.threatRange && plot.threatType !== 'A/A') {
                let strokeColor;
                // PUMP CRIT red has highest priority for ring color too
                if (isNearOrInside) {
                    strokeColor = isBlinkOn ? 'rgba(255, 32, 32, 0.95)' : 'rgba(200, 0, 0, 0.7)';
                } else if (isSelected) {
                    strokeColor = isLightMode ? 'rgba(0, 168, 45, 0.8)' : 'rgba(57, 255, 20, 0.8)'; // Selected green ring
                } else {
                    strokeColor = isLightMode ? 'rgba(204, 112, 0, 0.8)' : 'rgba(255, 176, 0, 0.7)'; // Orange for A/G
                }
                ctx.strokeStyle = strokeColor;
                ctx.setLineDash([]); ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(x, y, plot.threatRange * pxPerNM, 0, Math.PI * 2); ctx.stroke();
            }

            if (plot.threatType === 'A/A' && plot.targetId === mostCriticalAAId) {
                let lineColor = isLightMode ? 'rgba(85, 85, 85, 0.7)' : 'rgba(200, 200, 200, 0.6)';
                if (isNearOrInside) {
                    lineColor = isBlinkOn ? 'rgba(255, 32, 32, 0.95)' : 'rgba(200, 0, 0, 0.7)';
                }
                ctx.save();
                ctx.strokeStyle = lineColor;
                ctx.lineWidth = 2.5;
                ctx.setLineDash([12, 8]);
                ctx.beginPath();
                ctx.moveTo(centerX, centerY);
                ctx.lineTo(x, y);
                ctx.stroke();

                if (plot.threatRange && d > plot.threatRange) {
                    const tickDist = plot.threatRange * pxPerNM;
                    // Tick mark should be drawn at threatRange distance *from the threat* towards ownship
                    const markX = x - Math.sin(toRad(b)) * tickDist;
                    const markY = y + Math.cos(toRad(b)) * tickDist;
                    
                    const pAngle = toRad(b + 90);
                    const tickLength = 10;
                    const pX1 = markX + Math.sin(pAngle) * tickLength;
                    const pY1 = markY - Math.cos(pAngle) * tickLength;
                    const pX2 = markX - Math.sin(pAngle) * tickLength;
                    const pY2 = markY + Math.cos(pAngle) * tickLength;
                    
                    ctx.setLineDash([]);
                    ctx.lineWidth = 3.5;
                    ctx.beginPath();
                    ctx.moveTo(pX1, pY1);
                    ctx.lineTo(pX2, pY2);
                    ctx.stroke();
                }
                ctx.restore();
            }
        } else {
            const isSelectedGroup = plot.targetId === state.selectedTargetId;
            let histColor = isLightMode ? 'rgba(204, 112, 0, 0.45)' : 'rgba(255, 176, 0, 0.35)'; // Default faded orange
            if (isSelectedGroup) {
                histColor = isLightMode ? 'rgba(0, 168, 45, 0.5)' : 'rgba(57, 255, 20, 0.4)'; // Faded neon green
            } else if (plot.threatType === 'A/A') {
                histColor = isLightMode ? 'rgba(85, 85, 85, 0.45)' : 'rgba(200, 200, 200, 0.35)'; // Faded gray
            }
            ctx.fillStyle = histColor; ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2); ctx.fill();
        }
    });

    // DRAW PREVIEW (GHOST TARGET IN EDIT)
    if (state.targetPos) {
        const d = getDistance(state.ownPos.lat, state.ownPos.lon, state.targetPos.lat, state.targetPos.lon);
        const b = getBearing(state.ownPos.lat, state.ownPos.lon, state.targetPos.lat, state.targetPos.lon);
        const x = centerX + Math.sin(toRad(b)) * (d * pxPerNM);
        const y = centerY - Math.cos(toRad(b)) * (d * pxPerNM);

        // Draw orange dotted preview
        ctx.strokeStyle = isLightMode ? '#cc7000' : '#ffb000';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([2, 3]); // Beautiful dotted pattern

        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(x - 10, y); ctx.lineTo(x + 10, y);
        ctx.moveTo(x, y - 10); ctx.lineTo(x, y + 10);
        ctx.stroke();

        // Draw dotted threat ring if threat selected
        const threatCode = document.getElementById('targetThreat').value;
        const threat = state.threats.find(t => t.code === threatCode);
        if (threat && threat.range) {
            ctx.beginPath();
            ctx.arc(x, y, threat.range * pxPerNM, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.setLineDash([]);
    }

    // DRAW ORIGINAL POSITION OF THE PLOT UNDER EDIT (FOR COMPARISON)
    if (state.originalPlotPos) {
        const d = getDistance(state.ownPos.lat, state.ownPos.lon, state.originalPlotPos.lat, state.originalPlotPos.lon);
        const b = getBearing(state.ownPos.lat, state.ownPos.lon, state.originalPlotPos.lat, state.originalPlotPos.lon);
        const x = centerX + Math.sin(toRad(b)) * (d * pxPerNM);
        const y = centerY - Math.cos(toRad(b)) * (d * pxPerNM);

        // Draw orange/yellow dotted preview (original position before edit)
        ctx.strokeStyle = 'rgba(255, 176, 0, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([2, 4]); // Different dotted pattern

        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(x - 8, y); ctx.lineTo(x + 8, y);
        ctx.moveTo(x, y - 8); ctx.lineTo(x, y + 8);
        ctx.stroke();

        if (state.originalPlotPos.threatRange) {
            ctx.beginPath();
            ctx.arc(x, y, state.originalPlotPos.threatRange * pxPerNM, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.setLineDash([]);
    }

    ctx.restore(); // Restore Save 2
    ctx.restore(); // Restore Save 1



    ctx.save(); ctx.translate(centerX, centerY);
    if (state.orientation === 'NORTH') { ctx.rotate(toRad(trueHeading - magVar)); }

    // Draw ownship symbol (like F-16 HSD)
    ctx.strokeStyle = isLightMode ? 'rgba(30, 41, 59, 1)' : 'rgba(0, 255, 65, 1)';
    ctx.lineWidth = 3.5;

    ctx.beginPath();
    // Fuselage
    ctx.moveTo(0, -10);
    ctx.lineTo(0, 16);
    // Main wings
    ctx.moveTo(-14, 0);
    ctx.lineTo(14, 0);
    // Tail
    ctx.moveTo(-6, 12);
    ctx.lineTo(6, 12);
    ctx.stroke();
    
    ctx.restore();

    // DRAW HEADING INDICATOR TOP CENTER
    ctx.fillStyle = isLightMode ? '#008f25' : '#00FF41';
    ctx.font = 'bold 16px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    let topMagHeading = Math.round((trueHeading - magVar + 360) % 360);
    if (topMagHeading === 0) topMagHeading = 360;
    const headingText = topMagHeading.toString().padStart(3, '0') + '°';
    const textWidth = ctx.measureText(headingText).width;

    // Background box for readability over rings/lines
    ctx.fillStyle = isLightMode ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(centerX - textWidth / 2 - 6, padding - 28, textWidth + 12, 24);

    // Text border and text
    ctx.strokeStyle = isLightMode ? 'rgba(0, 143, 37, 0.5)' : 'rgba(0, 255, 65, 0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(centerX - textWidth / 2 - 6, padding - 28, textWidth + 12, 24);
    ctx.fillStyle = isLightMode ? '#008f25' : '#00FF41';
    ctx.fillText(headingText, centerX, padding - 24);
}

/**
 * INTERACTION
 */
el.canvas.addEventListener('click', (e) => {
    const rect = el.canvas.getBoundingClientRect(); 
    const scaleX = el.canvas.width / rect.width;
    const scaleY = el.canvas.height / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX; 
    const clickY = (e.clientY - rect.top) * scaleY;
    const cw = el.canvas.width; const ch = el.canvas.height;
    const centerX = cw / 2; const centerY = ch / 2;
    const padding = 32;
    const minDim = Math.min(cw, ch);
    const scale = state.rangeScale; const pxPerNM = (minDim / 2 - padding) / scale;
    if (!state.ownPos.lat) return;
    const activeBull = state.bullseyes.find(b => b.name === state.activeBullseyeName) || state.bullseyes[0];
    const magVar = activeBull ? activeBull.magVar : 0;
    
    let trueHeading = 0;
    if (state.ownPos.compass !== null) {
        trueHeading = state.ownPos.compass;
    } else if (state.ownPos.heading !== null) {
        trueHeading = state.ownPos.heading;
    }
    const rotationRad = (state.orientation === 'HEADING') ? -toRad(trueHeading) : toRad(-magVar);
    
    const latestById = {}; state.plots.forEach(p => { if (!latestById[p.targetId] || p.timestamp > latestById[p.targetId].timestamp) latestById[p.targetId] = p; });
    let foundId = null;
    Object.values(latestById).forEach(plot => {
        const d = getDistance(state.ownPos.lat, state.ownPos.lon, plot.lat, plot.lon); const b = getBearing(state.ownPos.lat, state.ownPos.lon, plot.lat, plot.lon);
        let x = centerX + Math.sin(toRad(b)) * (d * pxPerNM); let y = centerY - Math.cos(toRad(b)) * (d * pxPerNM);
        
        // Apply canvas rotation to the plotted coordinates to match visual hitboxes
        const dx = x - centerX; const dy = y - centerY;
        const rx = dx * Math.cos(rotationRad) - dy * Math.sin(rotationRad);
        const ry = dx * Math.sin(rotationRad) + dy * Math.cos(rotationRad);
        x = centerX + rx; y = centerY + ry;
        const dist = Math.sqrt((clickX - x) ** 2 + (clickY - y) ** 2); 
        if (dist < 45) foundId = plot.targetId; // Increased hit radius to encompass labels
    });
    if (foundId) selectTargetPlot(foundId);
});

/**
 * GPS & SENSORS
 */
function updatePosition(pos) {
    const { latitude, longitude, heading } = pos.coords; el.ownLat.value = latitude.toFixed(6); el.ownLon.value = longitude.toFixed(6);
    if (el.ownLatDisplay) el.ownLatDisplay.textContent = toDDM(latitude, true); if (el.ownLonDisplay) el.ownLonDisplay.textContent = toDDM(longitude, false);
    state.ownPos.lat = latitude; state.ownPos.lon = longitude; state.ownPos.heading = heading || 0; state.lastFixTime = Date.now();
    const now = new Date(); const timeStr = now.getUTCHours().toString().padStart(2, '0') + ":" + now.getUTCMinutes().toString().padStart(2, '0') + ":" + now.getUTCSeconds().toString().padStart(2, '0') + "Z";
    el.gpsStatus.textContent = `GPS: LIVE [${timeStr}]`; el.gpsStatus.classList.remove('offline'); el.gpsStatus.classList.add('online'); calculateBRAA();
    if (typeof updateOwnBullPosition === 'function') updateOwnBullPosition();
    drawTacticalDisplay();
}

window.updateCompassStatusUI = () => {
    const mainEl = document.querySelector('main');
    if (state.sensorsActive) {
        if (mainEl) mainEl.classList.remove('compass-blurred');
        if (el.compassStatus) {
            el.compassStatus.innerHTML = "ORIENTAÇÃO: ATIVA";
            el.compassStatus.classList.remove('offline', 'pulse-highlight');
            el.compassStatus.classList.add('online');
        }
    } else {
        if (mainEl) mainEl.classList.add('compass-blurred');
        if (el.compassStatus) {
            el.compassStatus.innerHTML = "ATIVAR ORIENTAÇÃO 🧭";
            el.compassStatus.classList.remove('online');
            el.compassStatus.classList.add('offline', 'pulse-highlight');
        }
    }
};

window.activateSensors = (isAuto = false) => {
    console.log("Tentando ativar sensores... Auto:", isAuto);
    if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission()
            .then(permissionState => {
                if (permissionState === 'granted') {
                    window.addEventListener('deviceorientation', handleOrientation, true);
                    state.sensorsActive = true;
                    window.updateCompassStatusUI();
                } else if (!isAuto) {
                    alert('Permissão de orientação negada pelo usuário.');
                }
            })
            .catch(err => {
                console.error("Erro nos sensores:", err);
                if (!isAuto) {
                    alert('Erro ao solicitar sensores. Verifique se está usando HTTPS.');
                }
            });
    } else {
        // Fallback for non-iOS or older versions (like Android)
        window.addEventListener('deviceorientation', handleOrientation, true);
        window.addEventListener('deviceorientationabsolute', handleOrientation, true);
        state.sensorsActive = true;
        window.updateCompassStatusUI();
    }
};

function handleOrientation(event) {
    let heading = null;
    if (event.webkitCompassHeading) { heading = event.webkitCompassHeading; }
    else if (event.absolute && event.alpha) { heading = 360 - event.alpha; }
    if (heading !== null) { state.ownPos.compass = heading; drawTacticalDisplay(); }
}

function handleGPSError(err) {
    let msg = "GPS: BUSCANDO...";
    if (err.code === 1) msg = "GPS: BLOQUEADO (HTTPS?)";
    if (err.code === 3) msg = "GPS: TIMEOUT (RETRYING...)";
    el.gpsStatus.textContent = msg;
    el.gpsStatus.classList.add('offline');
    if (err.code === 3) navigator.geolocation.getCurrentPosition(updatePosition, null, { enableHighAccuracy: false, timeout: 5000 });
}

function initGPS(manual = false) {
    if (!navigator.geolocation) {
        if (el.gpsStatus) {
            el.gpsStatus.textContent = "GPS: SEM SUPORTE (REQUER HTTPS)";
            el.gpsStatus.classList.add('offline');
        }
        if (manual) {
            alert("A geolocalização não é suportada neste dispositivo. Certifique-se de que a página está sendo acessada via conexão segura HTTPS.");
        }
        return;
    }
    el.gpsStatus.textContent = "GPS: BUSCANDO...";
    el.gpsStatus.classList.add('offline');
    const options = { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 };

    navigator.geolocation.getCurrentPosition(
        updatePosition,
        (err) => {
            if (manual && err.code === 1) {
                alert("A permissão ao GPS foi negada ou bloqueada. Para ativá-lo:\n\n1. Use uma conexão HTTPS segura.\n2. No iOS, vá em Ajustes > Safari > Localização e selecione 'Permitir'.");
            }
            if (err.code === 3) {
                navigator.geolocation.getCurrentPosition(updatePosition, handleGPSError, { enableHighAccuracy: false, timeout: 10000 });
            } else {
                handleGPSError(err);
            }
        },
        options
    );
    if (state.watchId) navigator.geolocation.clearWatch(state.watchId);
    state.watchId = navigator.geolocation.watchPosition(updatePosition, handleGPSError, options);
}

setInterval(() => { if (Date.now() - state.lastFixTime > 15000) initGPS(false); }, 20000);

// DIRECT CLICK ON HEADER FOR SENSORS
el.gpsStatus.onclick = (e) => {
    e.preventDefault();
    initGPS(true);
    window.activateSensors();
};

document.querySelectorAll('input:not([readonly])').forEach(input => {
    input.addEventListener('input', () => {
        calculateBRAA();
        calculateBullCoord();
    });
});

el.navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        el.navBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        el.pages.forEach(p => p.classList.remove('active'));
        document.getElementById(btn.getAttribute('data-page')).classList.add('active');

        if (btn.getAttribute('data-page') === 'calc-page') {
            setTimeout(drawTacticalDisplay, 100);
        }
    });
});
el.addPlotBtn.addEventListener('click', addPlot);

// Plot Mode Segmented Control
document.querySelectorAll('#plot-mode-segmented .segment-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('#plot-mode-segmented .segment-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.plotMode = btn.getAttribute('data-val');

        // Toggle visibility of input groups
        const beInputs = document.querySelectorAll('.plot-be-input');
        const coordInputs = document.querySelectorAll('.plot-coord-input');
        if (state.plotMode === 'BE') {
            beInputs.forEach(el => el.style.display = '');
            coordInputs.forEach(el => el.style.display = 'none');
            document.getElementById('res-coord-label').textContent = 'COORDENADAS';
            document.getElementById('res-coord-display').style.display = '';
            document.getElementById('res-bull-display').style.display = 'none';
        } else {
            beInputs.forEach(el => el.style.display = 'none');
            coordInputs.forEach(el => el.style.display = '');
            document.getElementById('res-coord-label').textContent = 'BULLSEYE';
            document.getElementById('res-coord-display').style.display = 'none';
            document.getElementById('res-bull-display').style.display = '';
        }
        clearPlotFields();
    });
});

// Orientation single toggle button
const orientationBtn = document.getElementById('orientation-toggle-btn');
if (orientationBtn) {
    orientationBtn.addEventListener('click', () => {
        if (state.orientation === 'HEADING') {
            state.orientation = 'NORTH';
            orientationBtn.textContent = 'N UP';
        } else {
            state.orientation = 'HEADING';
            orientationBtn.textContent = 'HDG UP';
        }
        drawTacticalDisplay();
    });
}


el.addThreatConfigBtn.addEventListener('click', () => {
    const code = el.newThreatCode.value.toUpperCase();
    const type = el.newThreatType.value;
    const range = parseFloat(el.newThreatRange.value);

    if (code && !isNaN(range)) {
        state.threats.push({ code, type, range });
        el.newThreatCode.value = '';
        updateThreatDropdowns();
    }
});
el.missionFileInput.addEventListener('change', handleMissionFile);
if (el.gpxFileInput) el.gpxFileInput.addEventListener('change', handleGpxFile);

// INITIAL LOAD
window.initTheme();
loadDefaultMission(false);
initGPS();
window.activateSensors(true);
window.updateCompassStatusUI();

function animLoop() {
    drawTacticalDisplay();
    requestAnimationFrame(animLoop);
}
requestAnimationFrame(animLoop);
