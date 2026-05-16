/**
 * BRAA TACTICAL CALCULATOR
 * Core Logic & Math
 */

/* Version: 56.0.0 - Time: 2101 */
const CACHE_NAME = 'braa-tactical-v56';

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
            { code: 'SA23', type: 'A/G', range: 108 },
            { code: 'F5', type: 'A/A', range: 23 },
            { code: 'F39', type: 'A/A', range: 34 }
        ]
    }
};

// MGRS LIBRARY (Mini-bundle)
const mgrs = (function() {
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

    return { forward: function(ll, acc) { return encode(LLtoUTM({lat: ll[1], lon: ll[0]}), acc || 5); } };
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
    keypadValue: "",
    sensorsActive: false,
    threatPage: 0
};

const INPUT_SEQUENCE = ["targetThreat", "targetId", "targetRadial", "targetDist"];

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
    resBearing: document.getElementById('resBearing'),
    resRange: document.getElementById('resRange'),
    gpsStatus: document.getElementById('gps-status'),
    compassStatus: document.getElementById('compass-status'),
    navBtns: document.querySelectorAll('.nav-btn'),
    pages: document.querySelectorAll('.page'),
    bullResLat: document.getElementById('bullResLat'),
    bullResLon: document.getElementById('bullResLon'),
    resMGRS: document.getElementById('resMGRS'),
    canvas: document.getElementById('tactical-canvas'),
    addPlotBtn: document.getElementById('add-plot-btn'),
    rangeScale: document.getElementById('range-scale'),
    plotterOrientation: document.getElementById('plotter-orientation'),
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
 * MATH UTILS
 */
function toRad(deg) { return deg * CONFIG.TO_RAD; }
function toDeg(rad) { return rad * CONFIG.TO_DEG; }

function getDestPoint(lat, lon, brng, dist) {
    const rLat = toRad(lat); const rLon = toRad(lon); const rBrng = toRad(brng);
    const dR = dist / CONFIG.R;
    const destLat = Math.asin(Math.sin(rLat) * Math.cos(dR) + Math.cos(rLat) * Math.sin(dR) * Math.cos(rBrng));
    const destLon = rLon + Math.atan2(Math.sin(rBrng) * Math.sin(dR) * Math.cos(rLat), Math.cos(dR) - Math.sin(rLat) * Math.sin(destLat));
    return { lat: toDeg(destLat), lon: (toDeg(destLon) + 540) % 360 - 180 };
}

function getDistance(lat1, lon1, lat2, lon2) {
    const dLat = toRad(lat2 - lat1); const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return CONFIG.R * c;
}

function getBearing(lat1, lon1, lat2, lon2) {
    const rLat1 = toRad(lat1); const rLat2 = toRad(lat2); const dLon = toRad(lon2 - lon1);
    const y = Math.sin(dLon) * Math.cos(rLat2);
    const x = Math.cos(rLat1) * Math.sin(rLat2) - Math.sin(rLat1) * Math.cos(rLat2) * Math.cos(dLon);
    return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function toDDM(decimal, isLat) {
    const d = Math.abs(decimal); const degrees = Math.floor(d); const minutes = ((d - degrees) * 60).toFixed(2);
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
    
    if (plotIndex === null) {
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
        if (!state.originalPlotPos) {
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
        
        document.querySelector('.keypad-grid:not(#keypad-threat-grid)').style.display = 'none';
        document.getElementById('keypad-preview').style.display = 'none';
        document.getElementById('keypad-threat-grid').style.display = 'grid';
        
        state.threatPage = 0;
        renderThreatKeypad();
        
        if (plotIndex !== null) {
            el.keypad.classList.add('editing');
            el.keypadEnterBtn.textContent = 'CORRIGIR';
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
        const targetId = el.targetId.value; const lastPlot = state.plots.filter(p => p.targetId === targetId).slice(-1)[0];
        if (lastPlot) { const lastVal = (id === 'targetRadial') ? lastPlot.radial : (id === 'targetDist' ? lastPlot.dist : ""); if (lastVal !== "") contextVal = `ÚLTIMO PLOT: ${lastVal}`; }
        el.keypad.classList.remove('editing'); el.keypadEnterBtn.textContent = 'ENTER';
    }
    state.keypadValue = currentVal; el.keypadTitle.textContent = label; el.keypadContextInfo.textContent = contextVal; el.keypadPreview.textContent = currentVal; el.keypad.style.display = 'flex'; el.keypadBackdrop.style.display = 'block';
}

function renderThreatKeypad() {
    const grid = document.getElementById('keypad-threat-grid');
    const ITEMS_PER_PAGE = 6;
    const start = state.threatPage * ITEMS_PER_PAGE;
    const pageThreats = state.threats.slice(start, start + ITEMS_PER_PAGE);
    const hasNext = start + ITEMS_PER_PAGE < state.threats.length;
    const hasPrev = state.threatPage > 0;
    
    let html = '';
    pageThreats.forEach(t => {
        html += `<button class="threat-key-btn" onclick="selectThreatInput('${t.code}')"><span class="t-code">${t.code}</span><span class="t-rng">${t.range} NM</span></button>`;
    });
    
    // Fill empty slots to maintain grid layout
    for (let i = pageThreats.length; i < ITEMS_PER_PAGE; i++) {
        html += `<div class="threat-key-btn t-empty"></div>`;
    }
    
    if (state.threats.length > ITEMS_PER_PAGE) {
        html += `<button class="threat-key-btn" style="background:#333; color:#aaa; font-size:1.5rem;" onclick="changeThreatPage(-1)" ${!hasPrev ? 'disabled style="opacity:0.3;"' : ''}>❮</button>`;
        html += `<button class="threat-key-btn" style="background:#333; color:#aaa; font-size:1.5rem;" onclick="selectThreatInput('')"><span class="t-code">-</span><span class="t-rng">NENHUMA</span></button>`;
        html += `<button class="threat-key-btn" style="background:#333; color:#aaa; font-size:1.5rem;" onclick="changeThreatPage(1)" ${!hasNext ? 'disabled style="opacity:0.3;"' : ''}>❯</button>`;
    } else {
        html += `<div class="threat-key-btn t-empty"></div>`;
        html += `<button class="threat-key-btn" style="background:#333; color:#aaa; font-size:1.5rem;" onclick="selectThreatInput('')"><span class="t-code">-</span><span class="t-rng">NENHUMA</span></button>`;
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
    if (state.activePlotIndex === null) {
        keypadNav(1); // Auto advance
    } else {
        closeKeypad(); // If editing a history plot, just close
    }
};

function updateActiveField() {
    if (state.activePlotIndex !== null) { updatePlot(state.activePlotIndex, state.activeInputId, state.keypadValue); }
    else if (state.activeInputId) { document.getElementById(state.activeInputId).value = state.keypadValue; calculateBRAA(); calculateBullCoord(); }
}

window.keyInput = (char) => { if (char === 'CLR') state.keypadValue = ""; else if (char === 'DEL') state.keypadValue = state.keypadValue.slice(0, -1); else { if (state.keypadValue.length < 6) state.keypadValue += char; } el.keypadPreview.textContent = state.keypadValue; updateActiveField(); };
window.keypadNav = (dir) => { 
    updateActiveField(); 
    if (state.activePlotIndex !== null) { 
        const sequence = ["threatCode", "radial", "dist"]; 
        const curIdx = sequence.indexOf(state.activeInputId); 
        let nextIdx = (curIdx + dir + sequence.length) % sequence.length; 
        const nextElement = document.querySelector(`[onclick*="openKeypad('${sequence[nextIdx]}', ${state.activePlotIndex})"]`);
        openKeypad(sequence[nextIdx], state.activePlotIndex, nextElement); 
    } else { 
        const curIdx = INPUT_SEQUENCE.indexOf(state.activeInputId); 
        let nextIdx = (curIdx + dir + INPUT_SEQUENCE.length) % INPUT_SEQUENCE.length; 
        const nextElement = document.getElementById(INPUT_SEQUENCE[nextIdx]);
        openKeypad(INPUT_SEQUENCE[nextIdx], null, nextElement); 
    } 
};
window.confirmKeypad = (shouldAdd) => { updateActiveField(); if (shouldAdd && state.activePlotIndex === null) addPlot(); closeKeypad(); };
window.closeKeypad = () => { 
    el.keypad.style.display = 'none'; 
    el.keypadBackdrop.style.display = 'none'; 
    state.activeInputId = null; 
    state.activePlotIndex = null; 
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
                const data = JSON.parse(content); if (data.bullseye) applyBullseye(data.bullseye); if (data.threats) { state.threats = data.threats; updateThreatDropdowns(); }
                return;
            }
            const lines = content.split('\n'); const newThreats = [];
            lines.forEach(line => {
                const parts = line.split(/[,\t ]+/).map(p => p.trim());
                if (parts[0].toUpperCase() === 'BULLSEYE' && parts.length >= 5) { applyBullseye({ name: parts[1], lat: parseFloat(parts[2]), lon: parseFloat(parts[3]), magVar: parseFloat(parts[4]) }); }
                else if (parts.length >= 3) { const code = parts[0].toUpperCase(); const type = parts[1].toUpperCase().includes('A/A') ? 'A/A' : 'A/G'; const range = parseFloat(parts[2]); if (code && !isNaN(range)) newThreats.push({ code, type, range }); }
            });
            if (newThreats.length > 0) { state.threats = newThreats; updateThreatDropdowns(); }
        } catch(err) { console.error("Erro ao ler arquivo."); }
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
        } catch(err) { console.error("Erro ao ler arquivo GPX.", err); }
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
        row.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
        row.style.background = b.name === state.activeBullseyeName ? 'rgba(0, 255, 65, 0.08)' : 'transparent';
        
        const isActive = b.name === state.activeBullseyeName;
        
        row.innerHTML = `
            <td style="padding: 10px 6px; font-weight: bold; color: ${isActive ? 'var(--primary-color)' : '#fff'}">${b.name} ${isActive ? '⭐' : ''}</td>
            <td style="padding: 10px 6px; font-family: var(--font-mono);">${b.lat.toFixed(6)}</td>
            <td style="padding: 10px 6px; font-family: var(--font-mono);">${b.lon.toFixed(6)}</td>
            <td style="padding: 10px 6px; font-family: var(--font-mono);">${b.magVar.toFixed(1)}°</td>
            <td style="padding: 10px 6px; text-align: right;">
                <div style="display: flex; gap: 6px; justify-content: flex-end; align-items: center;">
                    ${isActive 
                        ? `<span style="color: var(--primary-color); font-weight: bold; font-size: 0.7rem; padding: 4px 8px; border: 1px solid var(--primary-color); border-radius: 4px; background: rgba(0, 255, 65, 0.15); letter-spacing: 0.5px;">ATIVO</span>` 
                        : `<button class="btn-tiny" onclick="selectActiveBullseye('${b.name}')" style="padding: 4px 8px; font-size: 0.7rem; border-color: var(--primary-color); color: var(--primary-color); background: rgba(0, 255, 65, 0.1);">ATIVAR</button>`
                    }
                    ${b.name !== 'SILVER' ? `<button class="btn-tiny" onclick="removeBullseye(${index})" style="padding: 4px 8px; font-size: 0.7rem; border-color: #ff3b30; color: #ff3b30; background: rgba(255, 59, 48, 0.1);">REMOVER</button>` : ''}
                </div>
            </td>
        `;
        list.appendChild(row);
    });
}

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
            badgeMain.textContent = `PLOT BE [${bull.name}]`;
        }

        calculateBRAA();
        calculateBullCoord();
        drawTacticalDisplay();
        updateBullseyesTable();
    }
};

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
    const radial = parseFloat(el.targetRadial.value); const dist = parseFloat(el.targetDist.value);
    const ownLat = state.ownPos.lat; const ownLon = state.ownPos.lon;
    if (ownLat === null || ownLon === null || isNaN(radial) || isNaN(dist)) { el.resBearing.textContent = "---°"; el.resRange.textContent = "---"; return; }
    const trueRadial = (radial + magVar + 360) % 360; const targetPos = getDestPoint(bullLat, bullLon, trueRadial, dist);
    const trueBearingToTarget = getBearing(ownLat, ownLon, targetPos.lat, targetPos.lon);
    const magBearingToTarget = (trueBearingToTarget - magVar + 360) % 360;
    const rangeToTarget = getDistance(ownLat, ownLon, targetPos.lat, targetPos.lon);
    el.resBearing.textContent = Math.round(magBearingToTarget).toString().padStart(3, '0') + '°'; el.resRange.textContent = Math.round(rangeToTarget);
    state.targetPos = { lat: targetPos.lat, lon: targetPos.lon, radial, dist }; drawTacticalDisplay();
}

function calculateBullCoord() {
    const bullLat = parseFloat(el.bullLat.value); const bullLon = parseFloat(el.bullLon.value); const magVar = parseFloat(el.magVar.value) || 0;
    const radial = parseFloat(el.targetRadial.value); const dist = parseFloat(el.targetDist.value);
    if (isNaN(radial) || isNaN(dist)) { el.bullResLat.textContent = "S 00° 00.00'"; el.bullResLon.textContent = "W 000° 00.00'"; el.resMGRS.textContent = "---"; return; }
    const trueRadial = (radial + magVar + 360) % 360; const targetPos = getDestPoint(bullLat, bullLon, trueRadial, dist);
    el.bullResLat.textContent = toDDM(targetPos.lat, true); el.bullResLon.textContent = toDDM(targetPos.lon, false);
    try { el.resMGRS.textContent = mgrs.forward([targetPos.lon, targetPos.lat], 4); } catch(e) { el.resMGRS.textContent = "ERR"; }
}

/**
 * THREATS & HISTORY
 */
function updateThreatDropdowns() {
    renderThreatConfig();
}

function renderThreatConfig() {
    if (el.threatCountBadge) el.threatCountBadge.textContent = state.threats.length;
    el.threatsConfigList.innerHTML = state.threats.map((t, index) => `
        <div class="threat-card-modern">
            <div class="threat-info-modern">
                <span class="threat-code-modern">${t.code}</span>
                <div class="threat-meta-modern" style="margin-top: 4px;">
                    <span class="threat-type-tag" style="background: ${t.type === 'A/A' ? 'rgba(255,255,255,0.1)' : 'rgba(255, 176, 0, 0.2)'}; color: ${t.type === 'A/A' ? '#ccc' : 'var(--secondary-color)'}; border: 1px solid ${t.type === 'A/A' ? 'rgba(255,255,255,0.15)' : 'rgba(255,176,0,0.3)'}; padding: 2px 6px; border-radius: 4px; margin-right: 5px; font-size: 0.7rem; font-weight: bold;">${t.type}</span>
                    <span style="font-family: var(--font-mono); font-size: 0.75rem;">${t.range} NM</span>
                </div>
            </div>
            <div style="display: flex; gap: 8px;">
                <button class="btn-edit-threat-modern" onclick="editThreat(${index})">✎</button>
                <button class="btn-delete-threat-modern" onclick="deleteThreat(${index})">×</button>
            </div>
        </div>
    `).join('');
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
function selectTargetId(id) { el.targetId.value = id; }

function addPlot() {
    if (!state.targetPos) return;
    const threatCode = document.getElementById('targetThreat').value; const threat = state.threats.find(t => t.code === threatCode); const targetId = el.targetId.value || "71";
    state.plots.push({ ...state.targetPos, targetId: targetId, threatCode: threatCode && threatCode !== '-' ? threatCode : null, threatRange: threat ? threat.range : null, threatType: threat ? threat.type : null, timestamp: Date.now() });
    state.targetPos = null; // Clear preview
    const usedIds = new Set(state.plots.map(p => p.targetId)); let nextId = state.startTargetId || 1; while (usedIds.has(nextId.toString())) { nextId++; }
    el.targetId.value = nextId.toString(); renderHistory(); drawTacticalDisplay();
}

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
    const groups = state.plots.reduce((acc, plot, index) => { if (!acc[plot.targetId]) acc[plot.targetId] = []; acc[plot.targetId].push({ ...plot, originalIndex: index }); return acc; }, {});
    el.historyGroups.innerHTML = Object.entries(groups).map(([id, items]) => {
        items.sort((a, b) => b.timestamp - a.timestamp);
        return `
            <div class="history-group">
                <div class="history-group-header">
                    <div onclick="selectTargetPlot('${id}')" style="flex:1; display:flex; align-items:center; gap:8px;">
                        <span class="history-group-title">ALVO ID: ${id}</span>
                        <span class="badge-select-id">SELECIONAR</span>
                    </div>
                    <div style="display:flex; gap:12px; align-items:center;">
                        <span class="badge-plots-count">${items.length} PLOTS</span>
                        <span class="toggle-icon" onclick="this.parentElement.parentElement.parentElement.classList.toggle('collapsed')">▼</span>
                    </div>
                </div>
                <div class="history-group-content">
                    ${items.map(plot => `
                        <div class="plot-history-row">
                            <div class="plot-pills-container">
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
                                
                                <!-- THREAT PILL -->
                                <div class="history-pill threat-pill ${plot.threatCode ? (plot.threatType === 'A/A' ? 'aa' : 'ag') : 'none'}" onclick="openKeypad('threatCode', ${plot.originalIndex}, this)">
                                    <span class="history-pill-label">AMEAÇA</span>
                                    <span class="history-pill-value">${plot.threatCode || '-'}</span>
                                </div>
                            </div>
                            
                            <!-- REMOVE BUTTON -->
                            <button class="btn-remove-plot" onclick="removePlot(${plot.originalIndex})">×</button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }).join('');
}

window.updatePlot = (index, field, value) => {
    const plot = state.plots[index];
    if (field === 'threatCode') { const threat = state.threats.find(t => t.code === value); plot.threatCode = value || null; plot.threatRange = threat ? threat.range : null; plot.threatType = threat ? threat.type : null; }
    else { plot[field] = parseFloat(value); }
    const bullLat = parseFloat(el.bullLat.value); const bullLon = parseFloat(el.bullLon.value); const magVar = parseFloat(el.magVar.value) || 0;
    const trueRadial = (plot.radial + magVar + 360) % 360; const pos = getDestPoint(bullLat, bullLon, trueRadial, plot.dist);
    plot.lat = pos.lat; plot.lon = pos.lon; drawTacticalDisplay(); renderHistory();
};

window.removePlot = (index) => { state.plots.splice(index, 1); renderHistory(); drawTacticalDisplay(); };
window.deleteThreat = deleteThreat; window.selectTargetId = selectTargetId;
window.selectTargetPlot = (id) => { selectTargetId(id); openKeypad('targetRadial'); };

/**
 * TACTICAL DISPLAY
 */
function drawPredictionArrow(ctx, fromX, fromY, toX, toY) {
    const headLen = 12; const predX = toX + (toX - fromX) * 0.8; const predY = toY + (toY - fromY) * 0.8;
    const angle = Math.atan2(predY - toY, predX - toX);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'; ctx.setLineDash([2, 3]); ctx.beginPath(); ctx.moveTo(toX, toY); ctx.lineTo(predX, predY); ctx.stroke();
    ctx.setLineDash([]); ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'; ctx.beginPath(); ctx.moveTo(predX, predY);
    ctx.lineTo(predX - headLen * Math.cos(angle - Math.PI / 6), predY - headLen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(predX - headLen * Math.cos(angle + Math.PI / 6), predY - headLen * Math.sin(angle + Math.PI / 6));
    ctx.closePath(); ctx.fill();
}

function drawTacticalDisplay() {
    if (!ctx) return;
    const size = el.canvas.parentElement.clientWidth; el.canvas.width = size; el.canvas.height = size;
    const centerX = size / 2; const centerY = size / 2;
    const scale = state.rangeScale; const pxPerNM = (size / 2) / scale;
    
    const currentHeading = (state.ownPos.compass !== null) ? state.ownPos.compass : (state.ownPos.heading || 0);
    const rotationRad = (state.orientation === 'HEADING') ? -toRad(currentHeading) : 0;

    ctx.clearRect(0, 0, size, size);
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(rotationRad);
    ctx.translate(-centerX, -centerY);

    // DRAW RINGS
    ctx.strokeStyle = 'rgba(0, 255, 65, 0.12)'; ctx.lineWidth = 1;
    [0.25, 0.5, 0.75, 1.0].forEach(r => {
        const ringRadius = (scale * r) * pxPerNM;
        ctx.beginPath(); ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2); ctx.stroke();
    });

    // DRAW AZIMUTH LINES
    ctx.beginPath(); ctx.moveTo(centerX, 0); ctx.lineTo(centerX, size); ctx.moveTo(0, centerY); ctx.lineTo(size, centerY); ctx.stroke();

    // BILLBOARDED SCALE LABELS
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'; ctx.font = '9px JetBrains Mono';
    [0.25, 0.5, 0.75, 1.0].forEach(r => {
        const ringRadius = (scale * r) * pxPerNM;
        const lx = centerX + 5; const ly = centerY - ringRadius + 12;
        ctx.save(); ctx.translate(lx, ly); ctx.rotate(-rotationRad); ctx.fillText(`${Math.round(scale * r)} NM`, 0, 0); ctx.restore();
    });

    // BILLBOARDED AZIMUTH LABELS
    const azLabels = [{a:0, t:'000°', y:15}, {a:180, t:'180°', y:size-8}, {a:270, t:'270°', x:15}, {a:90, t:'090°', x:size-25}];
    azLabels.forEach(l => {
        const lx = l.x !== undefined ? l.x : centerX; const ly = l.y !== undefined ? l.y : centerY;
        ctx.save(); ctx.translate(lx, ly); ctx.rotate(-rotationRad); ctx.fillText(l.t, 0, 0); ctx.restore();
    });

    if (!state.ownPos.lat) { ctx.restore(); return; }

    // DRAW GPX ROUTE
    if (state.route && state.route.length > 0) {
        ctx.strokeStyle = '#ff00ff';
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

    const latestById = {}; state.plots.forEach(p => { if (!latestById[p.targetId] || p.timestamp > latestById[p.targetId].timestamp) latestById[p.targetId] = p; });
    const groups = {}; state.plots.forEach(p => { if (!groups[p.targetId]) groups[p.targetId] = []; groups[p.targetId].push(p); });
    
    Object.values(groups).forEach(group => {
        if (group.length < 2) return;
        group.sort((a, b) => a.timestamp - b.timestamp);
        for (let i = 1; i < group.length; i++) {
            const prev = group[i - 1]; const curr = group[i];
            const d1 = getDistance(state.ownPos.lat, state.ownPos.lon, prev.lat, prev.lon); const b1 = getBearing(state.ownPos.lat, state.ownPos.lon, prev.lat, prev.lon);
            const d2 = getDistance(state.ownPos.lat, state.ownPos.lon, curr.lat, curr.lon); const b2 = getBearing(state.ownPos.lat, state.ownPos.lon, curr.lat, curr.lon);
            const x1 = centerX + Math.sin(toRad(b1)) * (d1 * pxPerNM); const y1 = centerY - Math.cos(toRad(b1)) * (d1 * pxPerNM);
            const x2 = centerX + Math.sin(toRad(b2)) * (d2 * pxPerNM); const y2 = centerY - Math.cos(toRad(b2)) * (d2 * pxPerNM);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
            if (i === group.length - 1) drawPredictionArrow(ctx, x1, y1, x2, y2);
        }
        ctx.setLineDash([]);
    });

    const magVar = parseFloat(el.magVar.value) || 0;
    state.plots.forEach((plot, idx) => {
        const d = getDistance(state.ownPos.lat, state.ownPos.lon, plot.lat, plot.lon); const b = getBearing(state.ownPos.lat, state.ownPos.lon, plot.lat, plot.lon);
        const x = centerX + Math.sin(toRad(b)) * (d * pxPerNM); const y = centerY - Math.cos(toRad(b)) * (d * pxPerNM);
        const isLatest = latestById[plot.targetId] === plot;
        
        const isEditingThis = state.activePlotIndex === idx;
        if (isEditingThis) {
            // Draw blue dotted target preview for currently edited existing plot
            ctx.strokeStyle = '#00e5ff'; // Sleek cyan/blue edit-color
            ctx.lineWidth = 1.5;
            ctx.setLineDash([2, 3]); // Nice dotted pattern
            
            ctx.beginPath();
            ctx.arc(x, y, 6, 0, Math.PI * 2);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(x - 10, y); ctx.lineTo(x + 10, y);
            ctx.moveTo(x, y - 10); ctx.lineTo(x, y + 10);
            ctx.stroke();

            if (plot.threatRange) {
                ctx.beginPath();
                ctx.arc(x, y, plot.threatRange * pxPerNM, 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.setLineDash([]);
        } else if (isLatest) {
            ctx.fillStyle = '#ffb000'; ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill();
            
            ctx.font = 'bold 11px JetBrains Mono';
            const braaBrg = Math.round((b - magVar + 360) % 360).toString().padStart(3, '0'); const braaRng = Math.round(d);
            const line1 = `${plot.targetId} ${plot.threatCode || ''} ${braaBrg}/${braaRng}`; const line2 = `(${plot.radial}/${plot.dist})`;
            
            // 3 NM proximity warning to the threat ring boundary
            const isNearOrInside = plot.threatRange && (d <= plot.threatRange + 3);
            const isBlinkOn = Math.floor(Date.now() / 400) % 2 === 0;
            const alertLabel = isNearOrInside ? 'PUMP CRIT' : '';
            
            const m1 = ctx.measureText(line1); const m2 = ctx.measureText(line2); const boxW = Math.max(m1.width, m2.width) + 8;
            const boxH = alertLabel ? 36 : 26;
            
            ctx.save(); ctx.translate(x + 10, y - 10); ctx.rotate(-rotationRad);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.85)'; ctx.fillRect(0, 0, boxW, boxH);
            ctx.fillStyle = '#ffb000'; ctx.fillText(line1, 4, 12);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'; ctx.font = '9px JetBrains Mono'; ctx.fillText(line2, 4, 22);
            if (alertLabel) { 
                ctx.fillStyle = isBlinkOn ? 'rgba(255, 0, 0, 0.95)' : 'rgba(255, 0, 0, 0.15)'; 
                ctx.font = 'bold 10px JetBrains Mono'; 
                ctx.fillText(alertLabel, 4, 33); 
            }
            ctx.restore();
            
            if (plot.threatRange) {
                let strokeColor = '';
                if (isNearOrInside) {
                    strokeColor = 'rgba(255, 0, 0, 0.85)'; // Turns Red when within 3 NM of the ring
                } else if (plot.threatType === 'A/A') {
                    strokeColor = 'rgba(200, 200, 200, 0.6)'; // Gray for Air-to-Air
                } else {
                    strokeColor = 'rgba(255, 176, 0, 0.7)'; // Orange for Air-to-Ground
                }
                ctx.strokeStyle = strokeColor;
                ctx.setLineDash(plot.threatType === 'A/A' ? [2, 2] : []); ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(x, y, plot.threatRange * pxPerNM, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
            }
        } else { ctx.fillStyle = 'rgba(255, 176, 0, 0.35)'; ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2); ctx.fill(); }
    });

    // DRAW PREVIEW (GHOST TARGET IN EDIT)
    if (state.targetPos) {
        const d = getDistance(state.ownPos.lat, state.ownPos.lon, state.targetPos.lat, state.targetPos.lon);
        const b = getBearing(state.ownPos.lat, state.ownPos.lon, state.targetPos.lat, state.targetPos.lon);
        const x = centerX + Math.sin(toRad(b)) * (d * pxPerNM);
        const y = centerY - Math.cos(toRad(b)) * (d * pxPerNM);

        // Draw orange dotted preview
        ctx.strokeStyle = '#ffb000';
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

    ctx.restore();

    ctx.save(); ctx.translate(centerX, centerY);
    if (state.orientation === 'NORTH') { ctx.rotate(toRad(currentHeading)); }
    ctx.fillStyle = '#00FF41'; ctx.beginPath(); ctx.moveTo(0, -11); ctx.lineTo(8, 11); ctx.lineTo(0, 6); ctx.lineTo(-8, 11); ctx.closePath(); ctx.fill(); ctx.restore();
}

/**
 * INTERACTION
 */
el.canvas.addEventListener('click', (e) => {
    const rect = el.canvas.getBoundingClientRect(); const clickX = e.clientX - rect.left; const clickY = e.clientY - rect.top;
    const size = el.canvas.width; const centerX = size / 2; const centerY = size / 2;
    const scale = state.rangeScale; const pxPerNM = (size / 2) / scale;
    if (!state.ownPos.lat) return;
    const currentHeading = (state.ownPos.compass !== null) ? state.ownPos.compass : (state.ownPos.heading || 0);
    const rotationRad = (state.orientation === 'HEADING') ? -toRad(currentHeading) : 0;
    const latestById = {}; state.plots.forEach(p => { if (!latestById[p.targetId] || p.timestamp > latestById[p.targetId].timestamp) latestById[p.targetId] = p; });
    let foundId = null;
    Object.values(latestById).forEach(plot => {
        const d = getDistance(state.ownPos.lat, state.ownPos.lon, plot.lat, plot.lon); const b = getBearing(state.ownPos.lat, state.ownPos.lon, plot.lat, plot.lon);
        let x = centerX + Math.sin(toRad(b)) * (d * pxPerNM); let y = centerY - Math.cos(toRad(b)) * (d * pxPerNM);
        if (state.orientation === 'HEADING') {
            const dx = x - centerX; const dy = y - centerY;
            const rx = dx * Math.cos(rotationRad) - dy * Math.sin(rotationRad);
            const ry = dx * Math.sin(rotationRad) + dy * Math.cos(rotationRad);
            x = centerX + rx; y = centerY + ry;
        }
        const dist = Math.sqrt((clickX - x)**2 + (clickY - y)**2); if (dist < 25) foundId = plot.targetId;
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
    const now = new Date(); const timeStr = now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0') + ":" + now.getSeconds().toString().padStart(2, '0');
    el.gpsStatus.textContent = `GPS: LIVE [${timeStr}]`; el.gpsStatus.classList.remove('offline'); el.gpsStatus.classList.add('online'); calculateBRAA();
}

// THE DIRECT HANDLER REQUIRED BY SAFARI
window.activateSensors = () => {
    console.log("Tentando ativar sensores...");
    if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission()
            .then(permissionState => {
                if (permissionState === 'granted') {
                    window.addEventListener('deviceorientation', handleOrientation, true);
                    state.sensorsActive = true;
                    if(el.compassStatus) {
                        el.compassStatus.innerHTML = "BÚSSOLA: ATIVA";
                        el.compassStatus.classList.remove('offline');
                        el.compassStatus.classList.add('online');
                    }
                } else {
                    alert('Permissão de orientação negada pelo usuário.');
                }
            })
            .catch(err => {
                console.error(err);
                alert('Erro ao solicitar sensores. Verifique se está usando HTTPS.');
            });
    } else {
        // Fallback for non-iOS or older versions
        window.addEventListener('deviceorientation', handleOrientation, true);
        window.addEventListener('deviceorientationabsolute', handleOrientation, true);
        state.sensorsActive = true;
        if(el.compassStatus) {
            el.compassStatus.innerHTML = "BÚSSOLA: ATIVA";
            el.compassStatus.classList.remove('offline');
            el.compassStatus.classList.add('online');
        }
    }
};

function handleOrientation(event) {
    let heading = null;
    if (event.webkitCompassHeading) { heading = event.webkitCompassHeading; }
    else if (event.absolute && event.alpha) { heading = 360 - event.alpha; }
    if (heading !== null) { state.ownPos.compass = heading; drawTacticalDisplay(); }
}

function handleGPSError(err) {
    let msg = "GPS: BUSCANDO..."; if (err.code === 1) msg = "GPS: PERMISSION DENIED"; if (err.code === 3) msg = "GPS: TIMEOUT (RETRYING...)";
    el.gpsStatus.textContent = msg; el.gpsStatus.classList.add('offline'); if (err.code === 3) navigator.geolocation.getCurrentPosition(updatePosition, null, { enableHighAccuracy: false, timeout: 5000 });
}

function initGPS() {
    if (!navigator.geolocation) return; el.gpsStatus.textContent = "GPS: BUSCANDO..."; el.gpsStatus.classList.add('offline');
    const options = { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 };
    navigator.geolocation.getCurrentPosition(updatePosition, (err) => { if (err.code === 3) navigator.geolocation.getCurrentPosition(updatePosition, handleGPSError, { enableHighAccuracy: false, timeout: 10000 }); else handleGPSError(err); }, options);
    if (state.watchId) navigator.geolocation.clearWatch(state.watchId); state.watchId = navigator.geolocation.watchPosition(updatePosition, handleGPSError, options);
}

setInterval(() => { if (Date.now() - state.lastFixTime > 15000) initGPS(); }, 20000);

// DIRECT CLICK ON HEADER FOR SENSORS
el.gpsStatus.onclick = (e) => {
    e.preventDefault();
    initGPS();
    window.activateSensors();
};

document.querySelectorAll('input:not([readonly])').forEach(input => input.addEventListener('input', () => { calculateBRAA(); calculateBullCoord(); }));
el.navBtns.forEach(btn => btn.addEventListener('click', () => { el.navBtns.forEach(b => b.classList.remove('active')); btn.classList.add('active'); el.pages.forEach(p => p.classList.remove('active')); document.getElementById(btn.getAttribute('data-page')).classList.add('active'); if (btn.getAttribute('data-page') === 'calc-page') setTimeout(drawTacticalDisplay, 100); }));
el.addPlotBtn.addEventListener('click', addPlot);
el.rangeScale.addEventListener('change', (e) => { state.rangeScale = parseInt(e.target.value); drawTacticalDisplay(); });
el.plotterOrientation.addEventListener('change', (e) => { state.orientation = e.target.value; drawTacticalDisplay(); });
el.addThreatConfigBtn.addEventListener('click', () => {
    const code = el.newThreatCode.value.toUpperCase(); const type = el.newThreatType.value; const range = parseFloat(el.newThreatRange.value);
    if (code && !isNaN(range)) { state.threats.push({ code, type, range }); el.newThreatCode.value = ''; updateThreatDropdowns(); }
});
el.missionFileInput.addEventListener('change', handleMissionFile);
if (el.gpxFileInput) el.gpxFileInput.addEventListener('change', handleGpxFile);

// INITIAL LOAD
loadDefaultMission(false);
initGPS();

function animLoop() {
    drawTacticalDisplay();
    requestAnimationFrame(animLoop);
}
requestAnimationFrame(animLoop);
