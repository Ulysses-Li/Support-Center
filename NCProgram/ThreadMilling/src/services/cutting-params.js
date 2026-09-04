/** 純計算服務：提供材料預設值、主軸轉速與工作進給計算，不直接操作畫面。 */
window.NCProgram = window.NCProgram || {};

(() => {
    const NC = window.NCProgram;

const { cuttingSpeedMap } = NC;


// 取得材料預設切削參數。回傳 null 讓 UI 決定要不要清空欄位。
function getMaterialPreset(materialId) {
    return cuttingSpeedMap[materialId] ?? null;
}

// 主軸轉速公式：n = 1000 * Vc / (pi * D)。無效輸入回傳 null，避免產生 NaN。
function calculateSpindleSpeed({ toolDiameter, cuttingSpeed }) {
    const d = Number(toolDiameter);
    const vc = Number(cuttingSpeed);
    if (!Number.isFinite(d) || d <= 0 || !Number.isFinite(vc) || vc <= 0) return null;
    return (1000 * vc) / (Math.PI * d);
}

// 進給公式：Vf = n * fz * z。無效輸入回傳 null，交給 UI 清空顯示。
function calculateFeedRate({ spindleSpeed, feedPerTooth, teeth }) {
    const n = Number(spindleSpeed);
    const fz = Number(feedPerTooth);
    const z = Number(teeth);
    if (!Number.isFinite(n) || n <= 0 || !Number.isFinite(fz) || fz <= 0 || !Number.isFinite(z) || z <= 0) return null;
    return n * fz * z;
}


    // 將本檔公開 API 掛到 NCProgram，傳統 script 依此互相呼叫。
    Object.assign(NC, { getMaterialPreset, calculateSpindleSpeed, calculateFeedRate });
})();
