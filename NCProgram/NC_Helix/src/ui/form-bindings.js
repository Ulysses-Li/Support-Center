/*
 * NC Helix - 表單事件集中管理
 * 用意：HTML 只保留畫面結構，所有 change、input、click 事件統一在此綁定。
 */

document.addEventListener('DOMContentLoaded', () => {
    // 用意：安全取得欄位；若未找到指定元素，就略過該事件綁定。
    const byId = id => document.getElementById(id);
    const on = (id, eventName, handler) => {
        const element = byId(id);
        if (element) element.addEventListener(eventName, handler);
    };

    on('partsGroup1', 'change', event => onPartSelect(event.currentTarget));
    on('partsGroup2', 'change', event => onPartSelect(event.currentTarget));
    on('selectMaterial', 'change', updateSelectColor);

    on('machiningDia1', 'input', updateSuggestedParameters);
    on('machiningDia2', 'input', updateSuggestedParameters);
    on('machiningDia3', 'input', updateSuggestedParameters_forActiveMode);

    ['pitch1', 'pitch2', 'pitch3'].forEach(id => {
        on(id, 'input', event => event.currentTarget.classList.remove('is-suggested'));
    });

    on('toolDiameter', 'input', updateSpindleSpeed);
    on('vc', 'input', event => {
        event.currentTarget.classList.remove('is-suggested');
        updateSpindleSpeed();
    });
    on('z', 'input', updateFeedRate);
    on('fz', 'input', event => {
        event.currentTarget.classList.remove('is-suggested');
        updateFeedRate();
    });

    on('addToolButton', 'click', () => {
        addTool();
        countClick('addTool');
    });
    on('generateButton', 'click', () => {
        calculateGCode();
        countClick('calculate');
    });
    on('exportButton', 'click', () => {
        exportToFile();
        countClick('export');
    });
    on('clearButton', 'click', () => {
        clearOutput();
        countClick('clear');
    });
});
