/** 螺紋銑削工具啟動檔：等待 DOM 完成，再初始化年份、事件、刀路欄位與預設畫面。 */
window.NCProgram = window.NCProgram || {};

(() => {
    const NC = window.NCProgram;

// main.js 是最後載入的啟動檔；前面所有檔案都已經把功能掛到 NCProgram。
    window.addEventListener('DOMContentLoaded', () => {
        const year = document.getElementById('year');
        if (year) {
            year.textContent = String(new Date().getFullYear());
        }
        NC.bindFormEvents();
        NC.renderPassInputs();
        NC.updateModeView();
        NC.updateDepthAuto();
    });
})();
