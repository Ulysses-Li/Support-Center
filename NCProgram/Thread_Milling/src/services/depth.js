window.NCProgram = window.NCProgram || {};

(() => {
    const NC = window.NCProgram;

const { baseMetricOf, getThreadDataForKey } = NC;


// 向上取小數，保留原本 depth 自動估算的行為。
function ceilTo(value, decimals = 3) {
    const factor = Math.pow(10, decimals);
    return Math.ceil(value * factor) / factor;
}

// 優先用資料表的 DepthOfCut；公制粗牙沿用原本 MajorDiameter * 2 的邏輯。
function getDepthPresetForThread(name, data) {
    if (data && (data.DepthOfCut != null || data.DepthofCut != null)) {
        return Number(data.DepthOfCut ?? data.DepthofCut);
    }

    const metricName = baseMetricOf(name);
    if (/^M\b/i.test(metricName) && data?.MajorDiameter) {
        return Number(data.MajorDiameter) * 2;
    }

    return null;
}

function calculateAutoDepth({ threadSize, pitch }) {
    const data = getThreadDataForKey(threadSize || '');
    const preset = getDepthPresetForThread(threadSize || '', data);
    if (preset != null) return Number(preset).toFixed(3);

    const p = Number(pitch);
    if (Number.isFinite(p) && p > 0) return ceilTo(p * 10, 3).toFixed(3);
    return '';
}


    // 將本檔公開 API 掛到 NCProgram，傳統 script 依此互相呼叫。
    Object.assign(NC, { ceilTo, getDepthPresetForThread, calculateAutoDepth });
})();
