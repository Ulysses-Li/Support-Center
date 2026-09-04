/** 匯出服務：補上 NC 程式結尾，建立文字 Blob 並觸發瀏覽器下載。 */
window.NCProgram = window.NCProgram || {};

(() => {
    const NC = window.NCProgram;

// 匯出 NC 程式文字檔，結尾碼維持原本 M05/M09/G28/M30 行為。
function buildProgramWithFooter(content) {
    return `${content}\nM05\nM09\nG91 G28 Z0.\nG91 G28 Y0.\nM30`;
}

function exportTextFile({ content, filename }) {
    const blob = new Blob([content], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
}


    // 將本檔公開 API 掛到 NCProgram，傳統 script 依此互相呼叫。
    Object.assign(NC, { buildProgramWithFooter, exportTextFile });
})();
