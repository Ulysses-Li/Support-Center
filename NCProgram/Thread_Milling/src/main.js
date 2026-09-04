window.NCProgram = window.NCProgram || {};

(() => {
    const NC = window.NCProgram;

// main.js 是最後載入的啟動檔；前面所有檔案都已經把功能掛到 NCProgram。
    window.addEventListener('DOMContentLoaded', () => {
        const year = document.getElementById('year');
        if (year) year.textContent = String(new Date().getFullYear());

        NC.bindFormEvents();
        NC.renderPassInputs();
        NC.updateModeView();
        NC.updateDepthAuto();
    });
})();
