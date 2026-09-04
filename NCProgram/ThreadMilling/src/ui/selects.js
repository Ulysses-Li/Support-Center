/** 下拉選單 UI：維持加工模式、牙系、牙規、刀片與尺寸欄位之間的連動。 */
window.NCProgram = window.NCProgram || {};

(() => {
    const NC = window.NCProgram;

const { getDcFromTool, filterInsertsBySeries, filterSizesBySeries, getAllowedSizesForInsert, getCompatibleInsertsForSize, getFamilyInserts, getFamilyKey, getFamilySizes, getThreadDataForKey, calculateAutoDepth } = NC;

function setOptions(select, options, selectedValue, defaultText) {
    select.innerHTML = '';
    const def = document.createElement('option');
    def.value = '';
    def.disabled = true;
    def.selected = !selectedValue;
    def.textContent = defaultText;
    select.appendChild(def);

    options.forEach(item => {
        const option = document.createElement('option');
        option.value = item.value;
        option.textContent = item.text;
        if (item.bold) option.style.fontWeight = 'bold';
        if (selectedValue && selectedValue === item.value) option.selected = true;
        select.appendChild(option);
    });
}

function populateInsertSelect(list, selectedValue = null) {
    const select = document.getElementById('selectTool');
    setOptions(select, list.map(item => ({ value: item.v, text: item.t, bold: true })), selectedValue, 'Select Insert');
}

function populateSizeSelect(list, selectedValue = null) {
    const select = document.getElementById('selectThreadSize');
    setOptions(select, (list || []).map(size => ({ value: size, text: size })), selectedValue, 'Select thread size');
}

function clearThreadFields() {
    document.getElementById('toolDiameter').value = '';
    ['od', 'tapDrill', 'pitch', 'threadInfo'].forEach(id => {
        const element = document.getElementById(id);
        if (element) element.value = '';
    });
}

function getCurrentFamilyKey() {
    return getFamilyKey({
        mode: document.getElementById('threadMode')?.value,
        parallelFamily: document.getElementById('selectParallelFamily')?.value,
        taperFamily: document.getElementById('selectTaper')?.value
    });
}

function updateModeView() {
    const mode = document.getElementById('threadMode')?.value;
    const parallelWrap = document.getElementById('parallelWrap');
    const taperWrap = document.getElementById('taperWrap');

    populateInsertSelect([]);
    populateSizeSelect([]);
    clearThreadFields();

    const parallelFamily = document.getElementById('selectParallelFamily');
    const taperFamily = document.getElementById('selectTaper');
    const series = document.getElementById('threadSeries');
    if (parallelFamily) parallelFamily.selectedIndex = 0;
    if (taperFamily) taperFamily.selectedIndex = 0;
    if (series) series.selectedIndex = 0;
    document.getElementById('seriesWrap').style.display = 'none';

    if (mode === 'parallel') {
        parallelWrap.style.display = '';
        taperWrap.style.display = 'none';
    } else if (mode === 'tapered') {
        parallelWrap.style.display = 'none';
        taperWrap.style.display = '';
    } else {
        parallelWrap.style.display = 'none';
        taperWrap.style.display = 'none';
    }
}

function updateInsertList() {
    const familyKey = getCurrentFamilyKey();
    const seriesWrap = document.getElementById('seriesWrap');
    const seriesSelect = document.getElementById('threadSeries');
    const showSeries = familyKey === 'parallel60';
    seriesWrap.style.display = showSeries ? '' : 'none';
    if (!showSeries && seriesSelect) seriesSelect.selectedIndex = 0;

    const selectedSeries = showSeries ? (seriesSelect.value || '') : '';
    const sizes = filterSizesBySeries(getFamilySizes(familyKey), selectedSeries);
    const inserts = filterInsertsBySeries(getFamilyInserts(familyKey), selectedSeries);

    populateInsertSelect(inserts);
    populateSizeSelect(sizes);
    clearThreadFields();
}

function onSeriesChange() {
    const familyKey = getCurrentFamilyKey();
    const series = document.getElementById('threadSeries')?.value || '';
    populateSizeSelect(filterSizesBySeries(getFamilySizes(familyKey), series));
    populateInsertSelect(filterInsertsBySeries(getFamilyInserts(familyKey), series));
    clearThreadFields();
}

function updateThreadFields(size) {
    const data = getThreadDataForKey(size);
    if (!data) return;

    if (data.Pitch != null) document.getElementById('pitch').value = data.Pitch;
    if (data.MajorDiameter != null) document.getElementById('od').value = data.MajorDiameter;
    if (data.TapDrillDiameter != null) document.getElementById('tapDrill').value = data.TapDrillDiameter;

    document.getElementById('threadInfo').value = `Thread: ${size}
Major Diameter: ${data.MajorDiameter ?? '-'} mm
Pitch: ${data.Pitch ?? '-'} mm
Tap Drill Diameter: ${data.TapDrillDiameter ?? '-'} mm`;
    updateDepthAuto();
}

function onInsertChange() {
    const toolCode = document.getElementById('selectTool')?.value || '';
    document.getElementById('toolDiameter').value = getDcFromTool(toolCode) || '';

    const series = document.getElementById('threadSeries')?.value || '';
    const allowed = getAllowedSizesForInsert({ toolCode, series });
    const sizeSelect = document.getElementById('selectThreadSize');
    const currentSize = sizeSelect.value;
    populateSizeSelect(allowed, allowed.includes(currentSize) ? currentSize : null);

    if (!allowed.includes(currentSize)) {
        ['od', 'tapDrill', 'pitch', 'threadInfo'].forEach(id => {
            const element = document.getElementById(id);
            if (element) element.value = '';
        });
    } else {
        updateThreadFields(currentSize);
    }
}

function onThreadSizeChange() {
    const size = document.getElementById('selectThreadSize')?.value || '';
    updateThreadFields(size);

    const familyKey = getCurrentFamilyKey();
    const series = document.getElementById('threadSeries')?.value || '';
    const filtered = getCompatibleInsertsForSize({ familyKey, series, size });
    const toolSelect = document.getElementById('selectTool');
    const previous = toolSelect.value;
    populateInsertSelect(filtered, filtered.some(insert => insert.v === previous) ? previous : null);

    if (!filtered.some(insert => insert.v === previous)) {
        document.getElementById('toolDiameter').value = '';
    } else {
        document.getElementById('toolDiameter').value = getDcFromTool(toolSelect.value) || '';
    }
}

function updateDepthAuto() {
    const depth = calculateAutoDepth({
        threadSize: document.getElementById('selectThreadSize')?.value || '',
        pitch: document.getElementById('pitch')?.value
    });
    if (depth) document.getElementById('depth').value = depth;
}


    // 傳統 script 版本：把 UI/state API 掛到 NCProgram 供 main.js 啟動。
    Object.assign(NC, { populateInsertSelect, populateSizeSelect, clearThreadFields, getCurrentFamilyKey, updateModeView, updateInsertList, onSeriesChange, updateThreadFields, onInsertChange, onThreadSizeChange, updateDepthAuto });
})();
