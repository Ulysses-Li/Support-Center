/** 核心測試入口：用 VM 載入瀏覽器腳本，驗證切削參數、牙規篩選與 G-code 輸出。 */
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { readFileSync } = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const context = vm.createContext({
    window: {},
    console,
    Math,
    Number,
    String,
    Array,
    Object,
    Set,
    RegExp
});

function loadScript(relativePath) {
    const filePath = path.join(root, relativePath);
    const code = readFileSync(filePath, 'utf8');
    vm.runInContext(code, context, { filename: relativePath });
}

[
    'src/data/materials.js',
    'src/data/tools.js',
    'src/data/threads.js',
    'src/services/cutting-params.js',
    'src/services/thread-filter.js',
    'src/services/depth.js',
    'src/services/gcode-generator.js',
    'src/services/export-file.js'
].forEach(loadScript);

const NC = context.window.NCProgram;

function test(name, fn) {
    try {
        fn();
        console.log(`ok - ${name}`);
    } catch (error) {
        console.error(`not ok - ${name}`);
        throw error;
    }
}

const baseInput = {
    threadSize: 'M 10 x 1.5',
    toolNo: 99,
    toolDiameter: 8.5,
    od: 10,
    tapDrill: 8.5,
    pitch: 1.5,
    depth: 20,
    feed: 500,
    passPercents: [90, 100],
    coordinate: { x: 0, y: 0, zSafe: 20, zSurface: 0, workOffset: 'G54' }
};

test('spindle speed formula matches vc and tool diameter', () => {
    const rpm = NC.calculateSpindleSpeed({ toolDiameter: 10, cuttingSpeed: 80 });
    assert.equal(Math.round(rpm), 2546);
});

test('feed rate formula matches rpm, fz and teeth', () => {
    const vf = NC.calculateFeedRate({ spindleSpeed: 1000, feedPerTooth: 0.01, teeth: 6 });
    assert.equal(vf, 60);
});

test('invalid numeric inputs return null', () => {
    assert.equal(NC.calculateSpindleSpeed({ toolDiameter: 0, cuttingSpeed: 80 }), null);
    assert.equal(NC.calculateFeedRate({ spindleSpeed: 1000, feedPerTooth: '', teeth: 6 }), null);
});

test('series detection supports metric and unified threads', () => {
    assert.equal(NC.seriesOfSize('M 10 x 1.5'), 'M');
    assert.equal(NC.seriesOfSize('MF 10 x 1.0'), 'MF');
    assert.equal(NC.seriesOfSize('UNC 1/4-20'), 'UNC');
    assert.equal(NC.seriesOfSize('UNF 1/4-28'), 'UNF');
    assert.equal(NC.seriesOfSize('UNEF 1/4-32'), 'UNEF');
});

test('family key maps UI values to data keys', () => {
    assert.equal(NC.getFamilyKey({ mode: 'parallel', parallelFamily: 'parallel60' }), 'parallel60');
    assert.equal(NC.getFamilyKey({ mode: 'tapered', taperFamily: '55' }), 'tapered55');
    assert.equal(NC.getFamilyKey({ mode: 'tapered', taperFamily: '60' }), 'tapered60');
});

test('parallel60 can be filtered to UNC sizes', () => {
    const sizes = NC.filterSizesBySeries(NC.getFamilySizes('parallel60'), 'UNC');
    assert.ok(sizes.includes('UNC 1/4-20'));
    assert.ok(sizes.every(size => size.startsWith('UNC')));
});

test('parallel G-code contains compensation and no invalid values', () => {
    const output = NC.generateGCode({ ...baseInput, mode: 'parallel' });
    assert.match(output, /G41/);
    assert.match(output, /G03/);
    assert.match(output, /G40/);
    assert.doesNotMatch(output, /NaN|undefined|Infinity/);
});

test('tapered G-code contains compensation and no invalid values', () => {
    const output = NC.generateGCode({
        ...baseInput,
        mode: 'tapered',
        threadSize: 'NPT 1/4',
        toolDiameter: 9.8,
        od: 13.716,
        tapDrill: 11.113,
        pitch: 1.411,
        depth: 12
    });
    assert.match(output, /G42/);
    assert.match(output, /G02/);
    assert.match(output, /G40/);
    assert.match(output, /F500\.0/);
    assert.doesNotMatch(output, /NaN|undefined|Infinity/);
});

test('missing feed is rejected before output generation', () => {
    assert.throws(() => NC.generateGCode({ ...baseInput, mode: 'parallel', feed: null }), /進給/);
});
