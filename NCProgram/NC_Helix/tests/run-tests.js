const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const helixRoot = path.resolve(__dirname, '..');

function test(name, fn) {
    try {
        fn();
        console.log(`ok - ${name}`);
    } catch (error) {
        console.error(`not ok - ${name}`);
        throw error;
    }
}

// 用意：確保頁面維持外部模組結構，不會再次把程式塞回 HTML。
test('NC Helix page uses shared layout and external modules', () => {
    const html = fs.readFileSync(path.join(helixRoot, 'index.html'), 'utf8');
    assert.doesNotMatch(html, /<style[\s>]/i);
    assert.doesNotMatch(html, /\son(?:change|click|input)=/i);
    assert.match(html, /\.\.\/header\/header\.css/);
    assert.match(html, /\.\.\/footer\/footer\.css/);
    assert.match(html, /\.\/src\/data\/cutting-data\.js/);
    assert.match(html, /\.\/src\/services\/gcode-generator\.js/);
    assert.match(html, /\.\/src\/ui\/form-bindings\.js/);
});

// 用意：驗證最常用的 Part No. 刀徑資料在拆檔後仍可正確讀取。
test('tool data preserves part diameter mapping', () => {
    const source = fs.readFileSync(path.join(helixRoot, 'src/data/tool-data.js'), 'utf8');
    const context = {};
    vm.createContext(context);
    vm.runInContext(`${source}\nglobalThis.testDiameter = PART_TO_DIAMETER['00-99321-010-1320'];`, context);
    assert.equal(context.testDiameter, 11);
});

// 用意：確認拆分後的主軸轉速與進給公式保持舊版計算結果。
test('feed calculator preserves spindle speed and feed rate', () => {
    const source = fs.readFileSync(path.join(helixRoot, 'src/services/feed-calculator.js'), 'utf8');
    const elements = {
        toolDiameter: { value: '11' },
        vc: { value: '120' },
        n: { value: '' },
        z: { value: '2' },
        fz: { value: '0.025' },
        vf: { value: '' }
    };
    const context = {
        document: { getElementById: id => elements[id] },
        window: {}
    };
    vm.createContext(context);
    vm.runInContext(source, context);
    context.updateSpindleSpeed();
    assert.equal(elements.n.value, '3472');
    assert.equal(elements.vf.value, '173.60');
});
