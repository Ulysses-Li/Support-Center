window.NCProgram = window.NCProgram || {};

(() => {
    const NC = window.NCProgram;

const { calculateFeedRate, parsePassPercentValue } = NC;


const numberValue = (id, fallback = NaN) => {
    const value = Number(document.getElementById(id)?.value);
    return Number.isNaN(value) ? fallback : value;
};

// readFormState 是唯一讀取表單的入口，核心 service 不直接碰 DOM。
function readFormState() {
    const rpm = numberValue('n');
    const fz = numberValue('fz');
    const teeth = numberValue('z', 6);
    const feed = calculateFeedRate({ spindleSpeed: rpm, feedPerTooth: fz, teeth });
    const passCount = parseInt(document.getElementById('passes')?.value, 10) || 1;
    const passPercents = [];
    for (let i = 1; i <= passCount; i++) {
        passPercents.push(parsePassPercentValue(document.getElementById(`pass${i}`)?.value, i));
    }

    return {
        threadMode: document.getElementById('threadMode')?.value || 'parallel',
        parallelFamily: document.getElementById('selectParallelFamily')?.value || '',
        taperFamily: document.getElementById('selectTaper')?.value || '',
        series: document.getElementById('threadSeries')?.value || '',
        threadSize: document.getElementById('selectThreadSize')?.value || '',
        toolCode: document.getElementById('selectTool')?.value || '',
        toolNo: numberValue('toolNo', 99),
        toolDiameter: numberValue('toolDiameter'),
        od: numberValue('od'),
        tapDrill: numberValue('tapDrill'),
        pitch: numberValue('pitch'),
        depth: numberValue('depth', 10),
        rpm,
        fz,
        teeth,
        feed,
        passPercents,
        coordinate: {
            x: numberValue('x', 0),
            y: numberValue('y', 0),
            zSafe: numberValue('zsafe', 20),
            zSurface: numberValue('zsurface', 0),
            workOffset: document.getElementById('gcode')?.value || 'G54'
        }
    };
}


    // 傳統 script 版本：把 UI/state API 掛到 NCProgram 供 main.js 啟動。
    Object.assign(NC, { readFormState });
})();
