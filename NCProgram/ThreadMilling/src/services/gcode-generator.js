/** G-code 核心服務：驗證輸入，再依平行牙或錐管牙產生多刀路 NC 程式。 */
window.NCProgram = window.NCProgram || {};

(() => {
    const NC = window.NCProgram;

// G-code 產生器是核心邏輯，刻意不讀 DOM，方便測試與後續維護。
function parsePassPercentValue(value, index) {
    const text = String(value ?? '').replace('%', '').trim();
    if (text === '') return 100;
    const percent = Number(text);
    if (!Number.isFinite(percent) || percent <= 0 || percent > 100) {
        throw new Error(`第 ${index} 刀路深度百分比格式錯誤`);
    }
    return percent;
}

function validateGCodeInput(input) {
    if (!Number.isFinite(input.toolDiameter) || input.toolDiameter <= 0) throw new Error('缺少刀徑 (Insert Diameter)');
    if (!Number.isFinite(input.od)) throw new Error('請提供外徑 (OD)');
    if (!Number.isFinite(input.pitch) || input.pitch <= 0) throw new Error('請提供有效螺距 (Pitch)');
    if (!Number.isFinite(input.tapDrill)) throw new Error('請提供 Tap Drill Diameter');
    if (!Number.isFinite(input.depth) || input.depth <= 0) throw new Error('Depth of Cut 必須 > 0');
    if (!Number.isFinite(input.feed) || input.feed <= 0) throw new Error('請提供有效進給 (Feed Rate)');
}

function generateGCode(input) {
    validateGCodeInput(input);
    const coordinate = input.coordinate || {};
    const Xc = Number(coordinate.x) || 0;
    const Yc = Number(coordinate.y) || 0;
    const Zsafe = Number(coordinate.zSafe) || 20;
    const Zsurf = Number(coordinate.zSurface) || 0;
    const H = Number(input.toolNo) || 99;
    const workOffset = (coordinate.workOffset || 'G54').toUpperCase();

    const header = [
        `(Thread Size: ${input.threadSize || 'N/A'})`,
        `G90 ${workOffset} G00 X${Xc.toFixed(3)} Y${Yc.toFixed(3)}`,
        `G43 H${H} Z${Zsafe.toFixed(3)}`
    ];

    const common = {
        Xc,
        Yc,
        Zsafe,
        Zsurf,
        feed: input.feed,
        toolDia: input.toolDiameter,
        OD: input.od,
        pitch: input.pitch,
        tapDrill: input.tapDrill,
        depth: input.depth,
        toolNo: H,
        passPercents: input.passPercents
    };

    const body = input.mode === 'tapered'
        ? generateTaperedGCode(common)
        : generateParallelGCode(common);

    const output = header.concat(body).join('\n');
    if (/\b(?:NaN|undefined|Infinity)\b/.test(output)) {
        throw new Error('產生結果包含無效數值，請檢查輸入參數');
    }
    return output;
}

// Tapered: 保留原本 PT/NPT 的 G42 + G02 刀路邏輯，只把 DOM 依賴改成參數。
function generateTaperedGCode({ Xc, Yc, Zsafe, Zsurf, feed, toolDia, OD, pitch, tapDrill, depth, toolNo, passPercents }) {
    const out = [];
    const P = pitch;
    const stepDeg = 10;
    const liftZ = 1.5 * P;
    const dRPerRev = P / 32;
    const RFinish = (OD - toolDia) / 2;
    const RStart = (tapDrill - toolDia) / 2;

    if (RFinish <= 0) throw new Error('外徑需大於刀徑');
    if (RStart < 0) throw new Error('Tap Drill 需大於刀徑');

    for (let i = 0; i < passPercents.length; i++) {
        const percent = passPercents[i];
        const RBase = RStart + (RFinish - RStart) * (percent / 100);
        const REntry = RBase + (P / 32) * 1.5;
        out.push('G90 G01 ');
        out.push(`G42 D${toolNo} X${(Xc + REntry / 2).toFixed(3)} Y${(Yc + REntry / 2).toFixed(3)} Z${(Zsurf + liftZ).toFixed(3)}`);
        out.push(`G02 X${(Xc + REntry).toFixed(3)} Y${(Yc + 0).toFixed(3)} J-${(REntry / 2).toFixed(3)}`);

        let angle = 0;
        let firstFeed = true;
        let lastRNow = null;
        let loop = 0;
        while (true) {
            angle += stepDeg;
            const rev = angle / 360;
            const zOff = (-P) * rev + liftZ;
            const RNow = REntry - dRPerRev * rev;
            const xOff = Math.cos(angle * Math.PI / 180) * RNow;
            const yOff = -Math.sin(angle * Math.PI / 180) * RNow;
            const X = (Xc + xOff).toFixed(3);
            const Y = (Yc + yOff).toFixed(3);
            const Z = (Zsurf + zOff).toFixed(3);
            // Tapered 的螺旋切削第一段一定要給 F 值；後續同一段路徑沿用控制器上一個進給。
            const feedCommand = firstFeed ? ` F${feed.toFixed(1)}` : '';
            out.push(`G02 X${X} Y${Y} Z${Z} R${RNow.toFixed(3)}${feedCommand}`);
            firstFeed = false;
            lastRNow = Number(RNow.toFixed(3));
            if (Math.abs(zOff) >= depth) break;
            if (++loop > 20000) throw new Error('Angle 迴圈過多，請檢查參數');
        }

        out.push(`G02 X${Xc.toFixed(3)} Y${Yc.toFixed(3)} R${(lastRNow / 2).toFixed(3)}`);
        out.push(`G01 G40 X${Xc.toFixed(3)} Y${Yc.toFixed(3)}`);
        out.push(`G01 Z${Zsurf.toFixed(3)} F1500.`);
        out.push(`G00 Z${Zsafe.toFixed(3)}`);
    }
    return out;
}

// Parallel: 保留原本平行牙 G41 + G03 螺旋路徑，只把 pass 與 toolNo 改成外部參數。
function generateParallelGCode({ Xc, Yc, Zsafe, Zsurf, feed, toolDia, OD, pitch, tapDrill, depth, toolNo, passPercents }) {
    const out = [];
    const turns = Math.ceil(depth / pitch);
    const RTap = (tapDrill - toolDia) / 2;
    const RFin = (OD - toolDia) / 2;

    if (RFin <= 0) throw new Error('外徑需大於刀徑');
    if (RTap < 0) throw new Error('Tap Drill 需大於刀徑');

    for (const percent of passPercents) {
        const RWork = RTap + (RFin - RTap) * (percent / 100);
        let Z = Zsurf - depth;
        out.push(`G01 Z${Z.toFixed(3)} F${(feed * 5).toFixed(1)}`);
        out.push(`G41 D${toolNo} X${(Xc + (RWork * 0.50)).toFixed(3)} Y${(Yc - (RWork * 0.50)).toFixed(3)}F${feed.toFixed(1)}`);
        out.push(`G03 X${(Xc + RWork).toFixed(3)} Y${Yc.toFixed(3)} J${(RWork * 0.50).toFixed(3)}`);

        for (let k = 0; k < turns; k++) {
            Z += pitch;
            out.push(`G03 I-${RWork.toFixed(3)} Z${Z.toFixed(3)}`);
        }

        out.push(`G03 X${(Xc + (RWork * 0.50)).toFixed(3)} Y${(Yc + (RWork * 0.50)).toFixed(3)} I-${(RWork * 0.50).toFixed(3)}`);
        out.push(`G40 G01 X${Xc.toFixed(3)} Y${Yc.toFixed(3)} `);
        out.push(`G00 Z${Zsafe.toFixed(3)}`);
    }
    return out;
}


    // 將本檔公開 API 掛到 NCProgram，傳統 script 依此互相呼叫。
    Object.assign(NC, { parsePassPercentValue, validateGCodeInput, generateGCode, generateTaperedGCode, generateParallelGCode });
})();
