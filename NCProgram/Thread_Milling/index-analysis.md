# index.html 程式碼閱讀與模組化優化建議

分析日期：2026-05-15  
目標檔案：`index.html`  
檔案規模：約 1,310 行，單一 HTML 檔混合畫面、樣式、資料、計算邏輯與 NC 程式產生器。

## 我看到的內容

這個檔案是一個「Thread Milling NC Program Generator」，用 Bootstrap 做畫面，使用者在表單中選擇螺紋種類、刀片、材料、加工參數與座標後，產生螺紋銑削 NC 程式碼。

主要功能可以分成以下幾塊：

1. 頁面 UI
   - 標題與公司 Logo。
   - 左側是參數輸入表單。
   - 右側是按鈕與輸出區。
   - 底部是公司 footer。

2. 螺紋分類選擇
   - `Thread Type`
     - `parallel`
     - `tapered`
   - Parallel family
     - `parallel60`
     - `parallel55`
   - Taper family
     - `55`
     - `60`
   - Thread Series
     - `M`
     - `MF`
     - `UNC`
     - `UNF`
     - `UNEF`
   - 程式會根據 mode/family/series 動態更新可用的 thread size 與 insert。

3. 刀片與螺紋資料庫
   - `toolGroups`
     - 定義各 thread family 可用的 insert。
   - `getDcFromTool`
     - 根據 insert code 查刀徑。
   - `toolThreadMap`
     - 定義 insert 支援哪些 thread size。
   - `threadData`
     - 定義 thread size 對應的外徑、螺距、底孔徑、部分深度資料。
   - `coarsePitch`
     - 用於判斷 metric coarse/fine。

4. 材料切削參數
   - `cuttingSpeedMap`
     - 依材料設定預設 `vc` 與 `fz`。
   - `updateCuttingSpeed`
     - 選材料後自動帶入 cutting speed 與 feed per tooth。

5. 自動計算
   - `updateSpindleSpeed`
     - 用 `n = 1000 * vc / (pi * D)` 算 RPM。
   - `updateFeedRate`
     - 用 `vf = n * fz * z` 算進給。
   - `updateDepthAuto`
     - 依 thread data 或 pitch 自動估 depth。
   - `updateThreadFields`
     - 選 thread size 後填入 OD、pre-hole、pitch 與說明。

6. Passes 設定
   - `updatePassInputs`
     - 根據 pass count 動態建立 `pass1` 到 `pass5`。
     - 最後一刀固定 `100%`。
     - 倒數第二刀預設 `90%`。
   - `parsePassPercent`
     - 驗證每刀百分比必須大於 0 且小於等於 100。

7. NC code 產生
   - `calculateGCode`
     - 讀取所有 UI 表單值。
     - 檢查刀徑、OD、pitch、tap drill、depth。
     - 依 thread mode 呼叫：
       - `genParallel`
       - `genTapered`
   - `genParallel`
     - 產生平行牙螺旋路徑。
     - 使用 `G41`、`G03`、`G40`。
   - `genTapered`
     - 產生 PT/NPT 類錐牙路徑。
     - 使用 `G42`、`G02`、`G40`。
   - `addTool`
     - 加入換刀、主軸、冷卻等前置 NC code。
   - `exportToFile`
     - 將輸出結果加上結尾 `M05/M09/G28/M30` 並下載文字檔。
   - `clearOutput`
     - 清空輸出區。

## 目前程式的主要問題

### 1. 單一檔案責任過重

`index.html` 同時負責：

- HTML 結構
- CSS 樣式
- 表單事件
- DOM 操作
- 切削計算
- NC code 演算法
- 刀具資料
- 螺紋資料
- 匯出功能

這會讓後續新增規格、修 bug、驗證加工公式都變得困難。尤其 NC code 產生器和資料庫不應綁死在 DOM 裡。

### 2. 計算邏輯與 DOM 強耦合

例如 `calculateGCode`、`genParallel`、`genTapered` 直接讀 `document.getElementById(...)`。  
這造成三個問題：

- 很難單元測試。
- 很難重用計算邏輯。
- 修改 UI id 會影響核心加工邏輯。

比較好的方式是：

- UI 層負責收集表單資料。
- 計算層只接收普通物件。
- NC generator 只回傳字串陣列或完整文字。

### 3. 資料表混在程式碼裡

`toolGroups`、`toolThreadMap`、`threadData` 都很大，而且屬於資料，不屬於流程邏輯。  
目前資料表塞在 HTML script 內，後續會有這些風險：

- 不容易比對資料異動。
- 不容易讓非工程人員維護。
- 很容易因漏逗號或 key 拼錯造成整頁壞掉。
- insert、thread、family 三份資料之間沒有集中驗證。

### 4. inline event handler 太多

HTML 內直接寫：

- `onchange="onModeChange()"`
- `oninput="updateSpindleSpeed()"`
- `onclick="calculateGCode(); countClick('calculate')"`

這會讓 HTML 和 JavaScript 綁得太死。建議改成 JS 初始化時統一 `addEventListener`。

### 5. inline style 太多

表單和選項內有不少 `style="..."`。  
建議把它們移到 CSS class，例如：

- readonly input 樣式
- material color 樣式
- footer 樣式
- layout spacing

這樣 UI 修改會集中在 CSS，不會散在 HTML 裡。

### 6. 舊程式與註解堆積

檔案裡有不少舊版函式被整段註解保留，例如舊版 `onInsertChange`、舊版 `seriesOfSize`。  
若這些只是歷史紀錄，建議交給 git 管理，不要長期留在主程式中，否則後續維護者會很難判斷哪段才是現行邏輯。

### 7. 缺少自動驗證

這類 NC code generator 很需要測試，因為錯誤不是普通 UI bug，而是可能影響加工安全。  
目前沒有看到測試案例，例如：

- 不同 thread mode 是否產生正確 G-code。
- 刀徑大於孔徑時是否正確擋下。
- pass percentage 是否正確套用。
- PT/NPT depth 是否正確。
- feed 為空值時是否會產生 `FNaN`。

### 8. 潛在輸出風險

需要特別檢查：

- `genParallel` 裡有一行直接使用 `feed.toFixed(1)`，但 `feed` 可能是 `null`。
- `calculateGCode` 只檢查 `toolDia/OD/pitch/tapDrill/depth`，沒有強制檢查 `feed`。
- `exportToFile` 每次 export 都會無條件附加結尾 code，如果使用者已手動加過結尾，可能重複。
- `threadHand` UI 目前被註解，但 `calculateGCode` 還保留讀取邏輯。
- `countClick` 是 no-op，若不使用應移除或明確改成 analytics adapter。

## 建議的模組化拆解

建議先做「不改行為」的拆檔，再做邏輯清理。這樣比較容易確認每一步沒有改壞 NC code。

建議檔案結構：

```text
NC Program/
  index.html
  README.md
  index-analysis.md
  src/
    main.js
    dom.js
    state.js
    constants.js
    data/
      materials.js
      tools.js
      threads.js
    services/
      cutting-params.js
      depth.js
      thread-filter.js
      gcode-generator.js
      export-file.js
    ui/
      form-bindings.js
      selects.js
      passes.js
      material-style.js
  styles/
    main.css
    footer.css
  tests/
    gcode-generator.test.js
    thread-filter.test.js
    cutting-params.test.js
```

## 各模組責任

### `index.html`

只保留：

- HTML 結構
- 外部 CSS link
- Bootstrap link
- `<script type="module" src="./src/main.js"></script>`

不再放大型 JavaScript。

### `styles/main.css`

放主要畫面樣式：

- textarea 高度
- readonly input 樣式
- material select 顏色 class
- form spacing

### `styles/footer.css`

放 footer 樣式：

- `.site-footer`
- `.footer-logo`
- `.badge-row`
- `.duns-img`
- responsive footer rules

### `src/data/materials.js`

放材料切削參數：

```js
export const cuttingSpeedMap = {
  Material01: { vc: 80, fz: 0.0075 },
  Material04: { vc: 60, fz: 0.006 },
};
```

### `src/data/tools.js`

放刀具資料：

- `toolGroups`
- `toolThreadMap`
- `getDcFromTool` 用的刀徑 map

建議把 `getDcFromTool` 改成純查表，不要混在 UI 邏輯裡。

### `src/data/threads.js`

放螺紋資料：

- `threadData`
- `coarsePitch`
- `P_tpi`

若資料持續增加，之後可以再改成 JSON：

```text
src/data/threads.metric.json
src/data/threads.unified.json
src/data/threads.pipe.json
```

### `src/services/thread-filter.js`

放 thread/insert 篩選邏輯：

- `baseMetricOf`
- `hcOf`
- `isMetricSize`
- `seriesOfSize`
- `getCurrentFamilyKey` 的純邏輯版本
- `getFamilyInserts`
- `getFamilySizes`
- `filterSizesBySeries`
- `filterInsertsBySeries`
- `getThreadDataForKey`

注意：`getCurrentFamilyKey` 目前讀 DOM，拆出後建議改成：

```js
export function getFamilyKey({ mode, parallelFamily, taperFamily }) {
  if (mode === 'parallel') return parallelFamily || null;
  if (mode === 'tapered' && taperFamily === '55') return 'tapered55';
  if (mode === 'tapered' && taperFamily === '60') return 'tapered60';
  return null;
}
```

### `src/services/cutting-params.js`

放純計算：

- `calculateSpindleSpeed({ toolDiameter, cuttingSpeed })`
- `calculateFeedRate({ spindleSpeed, feedPerTooth, teeth })`
- `getMaterialPreset(materialId)`

### `src/services/depth.js`

放 depth 預設：

- `ceilTo`
- `getDepthPresetForThread`
- `calculateAutoDepth`

### `src/services/gcode-generator.js`

放 NC code 核心：

- `parsePassPercent`
- `generateGCode`
- `generateParallelGCode`
- `generateTaperedGCode`
- `generateToolHeader`
- `generateProgramFooter`

這個檔案應該完全不碰 DOM。輸入只收物件，輸出只回傳 string 或 string array。

範例：

```js
export function generateGCode(input) {
  validateGCodeInput(input);
  const header = buildHeader(input);
  const body = input.mode === 'tapered'
    ? generateTaperedGCode(input)
    : generateParallelGCode(input);
  return [...header, ...body].join('\n');
}
```

### `src/ui/selects.js`

放 select 操作：

- `populateInsertSelect`
- `populateSizeSelect`
- `clearThreadFields`
- `updateThreadFields`

### `src/ui/passes.js`

放 pass input UI：

- `renderPassInputs`
- `readPassPercents`

### `src/ui/form-bindings.js`

負責事件綁定：

- thread mode change
- family change
- series change
- size change
- insert change
- material change
- generate/export/clear/add tool button click

### `src/dom.js`

集中管理 DOM id：

```js
export const els = {
  threadMode: document.getElementById('threadMode'),
  selectTool: document.getElementById('selectTool'),
  result: document.getElementById('result'),
};
```

這樣未來修改 id 時，不需要全文搜尋。

### `src/main.js`

入口檔，只做初始化：

```js
import { bindFormEvents } from './ui/form-bindings.js';
import { renderPassInputs } from './ui/passes.js';
import { updateModeView } from './ui/selects.js';

window.addEventListener('DOMContentLoaded', () => {
  bindFormEvents();
  renderPassInputs();
  updateModeView();
});
```

## 建議重構順序

### 第 1 階段：安全拆檔，不改行為

1. 把 `<style>` 移到 `styles/main.css` 與 `styles/footer.css`。
2. 把材料資料與材料函式移到 `src/data/materials.js`、`src/services/cutting-params.js`。
3. 把刀具與螺紋資料移到 `src/data/tools.js`、`src/data/threads.js`。
4. 把 G-code 產生函式移到 `src/services/gcode-generator.js`。
5. `index.html` 改用 `<script type="module" src="./src/main.js"></script>`。

這一階段的標準是：畫面與輸出結果應該和目前完全一致。

### 第 2 階段：解除 DOM 與核心計算耦合

1. 新增 `readFormState()`，集中讀取表單。
2. 新增 `writeCalculatedFields()`，集中寫回 RPM/feed/thread fields。
3. 讓 `generateGCode(input)` 不再呼叫 `document.getElementById`。
4. 讓 `genParallel` 和 `genTapered` 不再讀 DOM 裡的 tool number。

### 第 3 階段：加驗證與測試

1. 加 `validateGCodeInput(input)`。
2. 加測試資料：
   - M thread
   - MF thread
   - UNC/UNF/UNEF
   - G/PF
   - PT
   - NPT
3. 測試至少確認：
   - 不產生 `NaN`
   - 不產生 `undefined`
   - G41/G42/G40 成對出現
   - depth 與 pitch 產生合理圈數
   - 錯誤參數會被擋下

### 第 4 階段：整理資料維護方式

1. 將 thread data 拆成多個資料檔。
2. 新增資料一致性檢查：
   - `toolThreadMap` 裡的每個 thread size 都必須存在於 `threadData`。
   - `toolGroups` 裡的每個 insert 都必須存在於 `toolThreadMap`。
   - `getDcFromTool` 的每個 insert 都必須存在於 `toolGroups` 或 `toolThreadMap`。
3. 若資料之後由型錄維護，建議轉成 CSV/JSON，再由程式載入。

## 優先修正清單

### P0：避免 NC code 產生錯誤值

- 在產生 G-code 前強制檢查 `feed`。
- 避免 `feed.toFixed(1)` 在 feed 為 `null` 時出錯。
- 檢查輸出是否有 `NaN`、`undefined`、`Infinity`。

### P1：拆出 G-code generator

`genParallel` 與 `genTapered` 是最重要的核心邏輯，應該先從 DOM 解耦，並加測試。

### P1：拆出資料庫

`threadData` 與 `toolThreadMap` 很大，且資料錯誤影響選刀與加工參數，應該獨立管理。

### P2：移除 inline event handler

改用 `addEventListener`，讓 HTML 只負責結構。

### P2：清理舊註解與 no-op

- 移除已不用的整段舊函式註解。
- 決定 `countClick` 是否要保留。
- 若 `threadHand` 暫時不用，相關讀取邏輯也應暫時移除或封裝。

## 建議的資料流

理想資料流如下：

```text
User input
  -> readFormState()
  -> validateInput()
  -> calculate derived values
  -> generateGCode()
  -> render output textarea
  -> export file
```

UI 連動資料流：

```text
thread mode
  -> family
  -> series
  -> available inserts / sizes
  -> selected size
  -> thread geometry fields
  -> depth / spindle / feed
```

## 最小可行拆檔版本

如果不想一次拆太大，最低限度可以先拆成 5 個檔案：

```text
index.html
styles.css
src/data.js
src/gcode.js
src/app.js
```

其中：

- `data.js` 放 `cuttingSpeedMap`、`toolGroups`、`toolThreadMap`、`threadData`。
- `gcode.js` 放 `calculateSpindleSpeed`、`calculateFeedRate`、`genParallel`、`genTapered`。
- `app.js` 放 DOM 操作與事件綁定。

這樣就能先把最大問題解掉：不要讓 `index.html` 同時承擔所有責任。

## 結論

目前程式已經有完整的業務邏輯：選螺紋、選刀、帶出參數、計算 RPM/feed、產生 parallel/tapered NC code。真正的問題不是功能不足，而是所有東西都集中在單一 HTML 檔，導致維護成本高、測試困難、加工邏輯風險不容易被隔離。

建議先做不改行為的模組化拆檔，再把 G-code generator 從 DOM 中抽離，最後補上測試與資料一致性檢查。這樣可以保留目前可用功能，同時讓後續新增 thread 規格、insert 型號或修正刀路公式時更安全。
