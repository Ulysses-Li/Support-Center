window.NCProgram = window.NCProgram || {};

(() => {
    const NC = window.NCProgram;

// 材料 select 會用 option 的顏色標示材料類別，這裡只處理視覺效果。
function updateSelectColor() {
    const select = document.getElementById('selectMaterial');
    const option = select?.options[select.selectedIndex];
    if (!select || !option) return;
    select.style.backgroundColor = option.style.backgroundColor || '';
    select.style.color = option.style.color || '';
}


    // 傳統 script 版本：把 UI/state API 掛到 NCProgram 供 main.js 啟動。
    Object.assign(NC, { updateSelectColor });
})();
