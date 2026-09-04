/** 材料參數資料層：集中保存各材料的切削速度 vc 與每刃進給 fz 建議中值。 */
window.NCProgram = window.NCProgram || {};

(() => {
    const NC = window.NCProgram;

// 材料切削參數資料表：UI 只給 material id，計算層從這裡取 vc/fz 預設值。
const cuttingSpeedMap = {
    Material01: { vc: (40 + 120) / 2, fz: (0.002 + 0.013) / 2 },
    Material04: { vc: (30 + 90) / 2, fz: (0.002 + 0.01) / 2 },
    Material06: { vc: (30 + 80) / 2, fz: (0.002 + 0.01) / 2 },
    Material07: { vc: (40 + 100) / 2, fz: (0.002 + 0.01) / 2 },
    Material08: { vc: (60 + 200) / 2, fz: (0.002 + 0.013) / 2 },
    Material12: { vc: (20 + 60) / 2, fz: (0.002 + 0.008) / 2 }
};


    // 傳統 script 版本：資料掛在 NCProgram，後續 service 依載入順序讀取。
    NC.cuttingSpeedMap = cuttingSpeedMap;
})();
