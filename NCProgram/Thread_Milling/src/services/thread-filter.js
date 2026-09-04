window.NCProgram = window.NCProgram || {};

(() => {
    const NC = window.NCProgram;

const { toolGroups, toolThreadMap, coarsePitch, threadData } = NC;


// 移除 HC / Heli-Coil 前綴，讓 HC 規格可以回查底層公制牙資料。
function baseMetricOf(size) {
    return String(size || '').replace(/^(HC|Heli[\s-]?Coil)[\s-]*/i, '').trim();
}

// UI 顯示 HC 規格時，統一補上 HC 前綴。
function hcOf(size) {
    return `HC ${baseMetricOf(size)}`;
}

// 判斷是否為公制 M/MF 規格，HC 會先轉回底層公制規格再判斷。
function isMetricSize(size) {
    return /^(?:M|MF)\b/i.test(baseMetricOf(size));
}

// 將尺寸歸類為 M/MF/UNC/UNF/UNEF/HC，供下拉選單篩選使用。
function seriesOfSize(size) {
    const normalized = String(size || '');
    if (/^(HC|Heli[\s-]?Coil)/i.test(normalized)) return 'HC';

    const match = baseMetricOf(normalized).match(/^(M|MF)\s*([0-9.]+)(?:\s*x\s*([0-9.]+))?/i);
    if (match) {
        const label = (match[1] || '').toUpperCase();
        const dia = Number(match[2]);
        const pitch = match[3] ? Number(match[3]) : null;
        if (label === 'MF') return 'MF';
        if (pitch == null) return 'M';
        const coarse = coarsePitch[dia];
        if (coarse == null) return 'MF';
        return Math.abs(pitch - coarse) < 1e-6 ? 'M' : 'MF';
    }

    if (/^UNC\b/i.test(normalized)) return 'UNC';
    if (/^UNF\b/i.test(normalized)) return 'UNF';
    if (/^UNEF\b/i.test(normalized)) return 'UNEF';
    return 'OTHER';
}

// 將 UI 選到的 mode/family 轉成資料表 key，避免其他模組知道 select value 細節。
function getFamilyKey({ mode, parallelFamily, taperFamily }) {
    if (mode === 'parallel') return parallelFamily || null;
    if (mode === 'tapered' && taperFamily === '55') return 'tapered55';
    if (mode === 'tapered' && taperFamily === '60') return 'tapered60';
    return null;
}

function getFamilyInserts(key) {
    return key && toolGroups[key] ? toolGroups[key] : [];
}

function getFamilySizes(key) {
    const set = new Set();
    getFamilyInserts(key).forEach(insert => {
        (toolThreadMap[insert.v] || []).forEach(size => set.add(size));
    });
    return Array.from(set);
}

function filterSizesBySeries(sizes, series) {
    if (!series) return sizes;
    if (series === 'HC') {
        const hcSet = new Set();
        sizes.filter(isMetricSize).forEach(size => hcSet.add(hcOf(size)));
        return Array.from(hcSet);
    }
    return sizes.filter(size => seriesOfSize(size) === series);
}

function filterInsertsBySeries(inserts, series) {
    if (!series) return inserts;
    return inserts.filter(insert => {
        const sizes = toolThreadMap[insert.v] || [];
        if (series === 'HC') return sizes.some(isMetricSize);
        return sizes.some(size => seriesOfSize(size) === series);
    });
}

function getThreadDataForKey(key) {
    if (threadData[key]) return threadData[key];

    if (/^(HC|Heli[\s-]?Coil)\s*/i.test(key || '')) {
        const base = baseMetricOf(key);
        const baseData = threadData[base];
        if (!baseData) return {};
        const result = { ...baseData };
        if (result.TapDrillDiameter == null && result.MajorDiameter != null && result.Pitch != null) {
            result.TapDrillDiameter = +(result.MajorDiameter - 1.08253 * result.Pitch).toFixed(3);
        }
        return result;
    }
    return {};
}

function getAllowedSizesForInsert({ toolCode, series }) {
    const raw = toolThreadMap[toolCode] || [];
    if (series === 'HC') return raw.filter(isMetricSize).map(hcOf);
    if (['M', 'MF', 'UNC', 'UNF', 'UNEF'].includes(series)) {
        return raw.filter(size => seriesOfSize(size) === series);
    }
    return raw.slice();
}

function getCompatibleInsertsForSize({ familyKey, series, size }) {
    const matchSize = series === 'HC' ? baseMetricOf(size) : size;
    return filterInsertsBySeries(getFamilyInserts(familyKey), series)
        .filter(insert => (toolThreadMap[insert.v] || []).includes(matchSize));
}


    // 將本檔公開 API 掛到 NCProgram，傳統 script 依此互相呼叫。
    Object.assign(NC, { baseMetricOf, hcOf, isMetricSize, seriesOfSize, getFamilyKey, getFamilyInserts, getFamilySizes, filterSizesBySeries, filterInsertsBySeries, getThreadDataForKey, getAllowedSizesForInsert, getCompatibleInsertsForSize });
})();
