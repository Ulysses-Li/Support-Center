window.NCProgram = window.NCProgram || {};

(() => {
    const NC = window.NCProgram;

// 依照使用者選的刀路次數建立百分比欄位；最後一刀固定 100%。
function renderPassInputs() {
    const passCount = parseInt(document.getElementById('passes')?.value, 10) || 1;
    const container = document.getElementById('passInputs');
    if (!container) return;
    container.innerHTML = '';

    for (let i = 0; i < 5; i++) {
        if (i >= passCount) continue;
        const col = document.createElement('div');
        col.className = 'col-md-2 text-center';

        const label = document.createElement('label');
        label.className = 'form-label';
        const suffix = ['st', 'nd', 'rd', 'th', 'th'][i];
        label.textContent = `${i + 1}${suffix} Pass`;

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'form-control text-center';
        input.id = `pass${i + 1}`;

        if (i === passCount - 1) {
            input.value = '100%';
            input.readOnly = true;
        } else if (i === passCount - 2) {
            input.value = '90%';
        } else {
            input.value = '%';
            input.placeholder = '%';
        }

        col.appendChild(label);
        col.appendChild(input);
        container.appendChild(col);
    }
}


    // 傳統 script 版本：把 UI/state API 掛到 NCProgram 供 main.js 啟動。
    Object.assign(NC, { renderPassInputs });
})();
