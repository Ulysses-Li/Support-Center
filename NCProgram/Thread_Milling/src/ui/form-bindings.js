window.NCProgram = window.NCProgram || {};

(() => {
    const NC = window.NCProgram;

const { calculateFeedRate, calculateSpindleSpeed, getMaterialPreset, buildProgramWithFooter, exportTextFile, generateGCode, readFormState, updateSelectColor, renderPassInputs, onInsertChange, onSeriesChange, onThreadSizeChange, updateDepthAuto, updateInsertList, updateModeView } = NC;

function updateFeedRate() {
    const vf = calculateFeedRate({
        spindleSpeed: document.getElementById('n')?.value,
        feedPerTooth: document.getElementById('fz')?.value,
        teeth: document.getElementById('z')?.value
    });
    document.getElementById('vf').value = vf == null ? '' : vf.toFixed(2);
}

function updateSpindleSpeed() {
    const rpm = calculateSpindleSpeed({
        toolDiameter: document.getElementById('toolDiameter')?.value,
        cuttingSpeed: document.getElementById('vc')?.value
    });
    document.getElementById('n').value = rpm == null ? '' : rpm.toFixed(0);
    updateFeedRate();
}

function updateCuttingSpeed() {
    const materialId = document.getElementById('selectMaterial')?.value || '';
    const preset = getMaterialPreset(materialId);
    const vc = document.getElementById('vc');
    const fz = document.getElementById('fz');
    if (preset) {
        vc.value = preset.vc;
        fz.value = preset.fz;
    } else {
        vc.value = '';
        fz.value = '';
    }
    updateSpindleSpeed();
    updateSelectColor();
}

function addTool() {
    const toolNo = document.getElementById('toolNo')?.value || '99';
    const spindleSpeed = document.getElementById('n')?.value || '';
    const gcode = `G17 G21 G49 G80\nT${toolNo} M06\nS${spindleSpeed} M03\nM08\n`;
    document.getElementById('result').value += `${gcode}\n`;
}

function calculateAndAppendGCode() {
    try {
        const input = readFormState();
        const ncCode = generateGCode({
            mode: input.threadMode,
            threadSize: input.threadSize,
            toolNo: input.toolNo,
            toolDiameter: input.toolDiameter,
            od: input.od,
            tapDrill: input.tapDrill,
            pitch: input.pitch,
            depth: input.depth,
            feed: input.feed,
            passPercents: input.passPercents,
            coordinate: input.coordinate
        });
        document.getElementById('result').value += `${ncCode}\n`;
    } catch (error) {
        alert(`計算錯誤：${error.message}`);
    }
}

function clearOutput() {
    document.getElementById('result').value = '';
}

function exportOutput() {
    const content = buildProgramWithFooter(document.getElementById('result').value);
    exportTextFile({ content, filename: 'ThreadMilling_NCCode.txt' });
}

// 所有事件集中在這裡綁定，HTML 不再使用 onchange/onclick/oninput。
function bindFormEvents() {
    document.getElementById('threadMode')?.addEventListener('change', () => {
        updateModeView();
        updateSpindleSpeed();
    });
    document.getElementById('selectParallelFamily')?.addEventListener('change', updateInsertList);
    document.getElementById('selectTaper')?.addEventListener('change', updateInsertList);
    document.getElementById('threadSeries')?.addEventListener('change', onSeriesChange);
    document.getElementById('selectThreadSize')?.addEventListener('change', onThreadSizeChange);
    document.getElementById('selectTool')?.addEventListener('change', () => {
        onInsertChange();
        updateSpindleSpeed();
    });
    document.getElementById('selectMaterial')?.addEventListener('change', updateCuttingSpeed);
    document.getElementById('vc')?.addEventListener('input', updateSpindleSpeed);
    document.getElementById('fz')?.addEventListener('input', updateFeedRate);
    document.getElementById('z')?.addEventListener('input', updateFeedRate);
    document.getElementById('passes')?.addEventListener('change', renderPassInputs);
    document.getElementById('pitch')?.addEventListener('input', updateDepthAuto);

    document.getElementById('addToolButton')?.addEventListener('click', addTool);
    document.getElementById('generateButton')?.addEventListener('click', calculateAndAppendGCode);
    document.getElementById('exportButton')?.addEventListener('click', exportOutput);
    document.getElementById('clearButton')?.addEventListener('click', clearOutput);
}


    // 傳統 script 版本：把 UI/state API 掛到 NCProgram 供 main.js 啟動。
    Object.assign(NC, { bindFormEvents });
})();
