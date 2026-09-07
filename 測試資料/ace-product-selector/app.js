/**
 * ACE Spot Drill 產品選型資料。
 * 數值依 ACE Spot Drill 型錄第 16 至 19 頁整理；正式套用前可集中在此校對。
 */
const ACE_PRODUCT_DATA = {
  grades: {
    NC2057: { label: "合金鋼／鑄鐵", coating: "AlTiN + TiSiN", note: "通用於合金鋼與鑄鐵。" },
    NC5254: { label: "不鏽鋼", coating: "Helica", note: "建議用於不鏽鋼。" },
    XP9000: { label: "非鐵金屬", coating: "Uncoated", note: "高正前角與銳利刃口，適用鋁、鈦、黃銅、銅及長切屑材料。" }
  },
  angles: {
    60: { factor: 0.866, use: "60° 沉頭孔與點鑽；型錄要求使用啄鑽循環。" },
    90: { factor: 0.5, use: "90° 倒角與點鑽應用。" },
    120: { factor: 0.289, use: "適合在 118° 鑽頭加工前定位。" },
    142: { factor: 0.172, use: "適合在 135°–140° 高性能鑽頭加工前定位，也可用於雕刻。" }
  },
  sizes: {
    "06": {
      insert: "S9MT06T1", dmax: 5.5, ct: 1.8, qty: 5,
      dimensions: {
        60: { offset: 0.35, l2: 4.5, tmax: 4.1, s: 7.5, codes: { NC2057: "06A021", NC5254: "06A023", XP9000: "06A022" } },
        90: { offset: 0.35, l2: 2.75, tmax: 2.5, s: 7.5, codes: { NC2057: "06A031", NC5254: "06A033", XP9000: "06A032" } },
        120: { offset: 0.05, l2: 1.73, tmax: 1.6, s: 7, codes: { NC2057: "06A041", NC5254: "06A043", XP9000: "06A042" } },
        142: { offset: 0.04, l2: 1.03, tmax: 0.95, s: 7, codes: { NC2057: "06A051", NC5254: "06A053", XP9000: "06A052" } }
      }
    },
    "08": {
      insert: "S9MT0802", dmax: 7.5, ct: 2.4, qty: 5,
      dimensions: {
        60: { offset: 0.46, l2: 6, tmax: 5.6, s: 10, codes: { NC2057: "06A121", NC5254: "06A125", XP9000: "06A122" } },
        90: { offset: 0.46, l2: 3.6, tmax: 3.4, s: 10, codes: { NC2057: "06A131", NC5254: "06A135", XP9000: "06A132" } },
        120: { offset: 0.05, l2: 2.3, tmax: 2.2, s: 9, codes: { NC2057: "06A141", NC5254: "06A143", XP9000: "06A142" } },
        142: { offset: 0.04, l2: 1.38, tmax: 1.29, s: 9, codes: { NC2057: "06A151", NC5254: "06A153", XP9000: "06A152" } }
      }
    },
    "10": {
      insert: "S9MT1003", dmax: 9.5, ct: 3, qty: 5,
      dimensions: {
        60: { offset: 0.58, l2: 7.5, tmax: 7.1, s: 12.5, codes: { NC2057: "06A221", NC5254: "06A223", XP9000: "06A222" } },
        90: { offset: 0.58, l2: 4.6, tmax: 4.4, s: 12.5, codes: { NC2057: "06A231", NC5254: "06A233", XP9000: "06A232" } },
        120: { offset: 0.06, l2: 2.9, tmax: 2.7, s: 11.5, codes: { NC2057: "06A241", NC5254: "06A243", XP9000: "06A242" } },
        142: { offset: 0.05, l2: 1.72, tmax: 1.64, s: 11.5, codes: { NC2057: "06A251", NC5254: "06A253", XP9000: "06A252" } }
      }
    },
    "12": {
      insert: "S9MT1203", dmax: 11.5, ct: 3, qty: 5,
      dimensions: {
        60: { offset: 0.69, l2: 9, tmax: 8.6, s: 15, codes: { NC2057: "06A321", NC5254: "06A323", XP9000: "06A322" } },
        90: { offset: 0.69, l2: 5.5, tmax: 5.3, s: 15, codes: { NC2057: "06A331", NC5254: "06A333", XP9000: "06A332" } },
        120: { offset: 0.06, l2: 3.5, tmax: 3.3, s: 13.5, codes: { NC2057: "06A341", NC5254: "06A343", XP9000: "06A342" } },
        142: { offset: 0.05, l2: 2.07, tmax: 1.98, s: 13.5, codes: { NC2057: "06A351", NC5254: "06A353", XP9000: "06A352" } }
      }
    },
    "16": {
      insert: "S9MT1603", dmax: 15.5, ct: 3.18, qty: 2,
      dimensions: {
        60: { offset: 0.92, l2: 12, tmax: 11.6, s: 20, codes: { NC2057: "06A421", NC5254: "06A423", XP9000: "06A422" } },
        90: { offset: 0.92, l2: 7.3, tmax: 7, s: 20, codes: { NC2057: "06A431", NC5254: "06A433", XP9000: "06A432" } },
        120: { offset: 0.1, l2: 4.6, tmax: 4.4, s: 18, codes: { NC2057: "06A441", NC5254: "06A443", XP9000: "06A442" } },
        142: { offset: 0.15, l2: 2.76, tmax: 2.67, s: 18, codes: { NC2057: "06A451", NC5254: "06A453", XP9000: "06A452" } }
      }
    },
    "20": {
      insert: "S9MT2004", dmax: 19.5, ct: 4.76, qty: 1,
      dimensions: {
        60: { offset: 1.16, l2: 15, tmax: 14.6, s: 25, codes: { NC2057: "06A521", NC5254: "06A523", XP9000: "06A522" } },
        90: { offset: 1.16, l2: 9.2, tmax: 8.9, s: 25, codes: { NC2057: "06A531", NC5254: "06A533", XP9000: "06A532" } },
        120: { offset: 0.1, l2: 5.8, tmax: 5.6, s: 22, codes: { NC2057: "06A541", NC5254: "06A543", XP9000: "06A542" } },
        142: { offset: 0.15, l2: 3.44, tmax: 3.36, s: 22, codes: { NC2057: "06A551", NC5254: "06A553", XP9000: "06A552" } }
      }
    }
  },
  holders: {
    cylindrical: {
      label: "Cylindrical Shank｜直柄",
      "06": { code: "6A0001", part: "00-99688-SI06-06", d: 6, l1: 27, l2: 14, od: 8, screw: "NS-18037 / 0.6 Nm", key: "NK-T6" },
      "08": { code: "6A0101", part: "00-99688-SI08-08", d: 8, l1: 36, l2: 19, od: 10.5, screw: "NS-20045 / 0.6 Nm", key: "NK-T6" },
      "10": { code: "6A0201", part: "00-99688-SI10-10", d: 10, l1: 40, l2: 22.5, od: 13, screw: "NS-25060 / 0.9 Nm", key: "NK-T7" },
      "12": { code: "6A0301", part: "00-99688-SI12-12", d: 12, l1: 45, l2: 25, od: 15.5, screw: "NS-30072 / 2.0 Nm", key: "NK-T9" },
      "16": { code: "6A0401", part: "00-99688-SI16-16", d: 16, l1: 48, l2: 32, od: 21, screw: "NS-35080 / 2.5 Nm", key: "NK-T15" },
      "20": { code: "6A0501", part: "00-99688-SI20-20", d: 20, l1: 50, l2: 35, od: 26, screw: "NS-50125 / 5.5 Nm", key: "NK-T20" }
    },
    screwFit: {
      label: "Screw Fit Cutter｜螺牙式",
      "06": { code: "6A2001", part: "00-99688-SI06-M04", od: 8, l: 14.5, m: "M4 × P0.7", dpm: 4.5, screw: "NS-18037 / 0.6 Nm", key: "NK-T6" },
      "08": { code: "6A2101", part: "00-99688-SI08-M05", od: 10, l: 19, m: "M5 × P0.8", dpm: 5.5, screw: "NS-20045 / 0.6 Nm", key: "NK-T6" },
      "10": { code: "6A2201", part: "00-99688-SI10-M06", od: 12, l: 22, m: "M6 × P1.0", dpm: 6.5, screw: "NS-25060 / 0.9 Nm", key: "NK-T7" },
      "12": { code: "6A2301", part: "00-99688-SI12-M08", od: 16, l: 25, m: "M8 × P1.25", dpm: 8.5, screw: "NS-30072 / 2.0 Nm", key: "NK-T9" },
      "16": { code: "6A2401", part: "00-99688-SI16-M10", od: 20, l: 31, m: "M10 × P1.5", dpm: 10.5, screw: "NS-35080 / 2.5 Nm", key: "NK-T15" },
      "20": { code: "6A2501", part: "00-99688-SI20-M12", od: 25, l: 35, m: "M12 × P1.75", dpm: 12.5, screw: "NS-50125 / 5.5 Nm", key: "NK-T20" }
    }
  }
};

const elements = {
  size: document.getElementById("insertSize"),
  angleOptions: document.getElementById("angleOptions"),
  grade: document.getElementById("grade"),
  holderType: document.getElementById("holderType"),
  diameter: document.getElementById("spotDiameter")
};

/** 將純文字安全寫入節點，避免資料被瀏覽器當成 HTML 執行。 */
function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = String(value ?? "-");
}

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatMillimeter(value) {
  return value == null ? "-" : `${value} mm`;
}

/** 建立表單選項；產品資料只維護一份。 */
function initializeOptions() {
  elements.size.innerHTML = Object.entries(ACE_PRODUCT_DATA.sizes)
    .map(([key, item]) => `<option value="${escapeHTML(key)}">SI ${escapeHTML(key)}｜${escapeHTML(item.insert)}</option>`)
    .join("");
  elements.size.value = "10";

  elements.angleOptions.innerHTML = Object.keys(ACE_PRODUCT_DATA.angles)
    .map(angle => `<label class="angle-option"><input type="radio" name="angle" value="${escapeHTML(angle)}" ${angle === "90" ? "checked" : ""}><span>${escapeHTML(angle)}°</span></label>`)
    .join("");

  elements.grade.innerHTML = Object.entries(ACE_PRODUCT_DATA.grades)
    .map(([key, item]) => `<option value="${escapeHTML(key)}">${escapeHTML(key)}｜${escapeHTML(item.label)}</option>`)
    .join("");
  elements.grade.value = "NC5254";
}

function getSelectedAngle() {
  return Number(document.querySelector('input[name="angle"]:checked')?.value || 90);
}

/** 依型錄公式 t = Ød × 角度係數 - l 計算點鑽深度。 */
function calculateSpotDepth(diameter, angle, dimension) {
  const factor = ACE_PRODUCT_DATA.angles[angle].factor;
  return Math.min(Math.max((diameter * factor) - dimension.offset, 0), dimension.tmax);
}

function renderHolderSpecs(type, holder) {
  const rows = type === "cylindrical"
    ? [
        ["訂購代碼", holder.code], ["Parts No.", holder.part], ["Ød", formatMillimeter(holder.d)],
        ["L1", formatMillimeter(holder.l1)], ["L2", formatMillimeter(holder.l2)], ["ØD", formatMillimeter(holder.od)],
        ["螺絲／扭力", holder.screw], ["扳手", holder.key]
      ]
    : [
        ["訂購代碼", holder.code], ["Parts No.", holder.part], ["ØD", formatMillimeter(holder.od)],
        ["L", formatMillimeter(holder.l)], ["M", holder.m], ["DPM", formatMillimeter(holder.dpm)],
        ["螺絲／扭力", holder.screw], ["扳手", holder.key]
      ];

  document.getElementById("holderSpecs").innerHTML = rows
    .map(([label, value]) => `<div><dt>${escapeHTML(label)}</dt><dd>${escapeHTML(value)}</dd></div>`)
    .join("");
}

/** 任一條件變更時，同步更新刀片、刀桿與點鑽深度。 */
function updateResult({ resetDiameter = false } = {}) {
  const sizeKey = elements.size.value;
  const angle = getSelectedAngle();
  const gradeKey = elements.grade.value;
  const holderType = elements.holderType.value;
  const size = ACE_PRODUCT_DATA.sizes[sizeKey];
  const dimension = size.dimensions[angle];
  const grade = ACE_PRODUCT_DATA.grades[gradeKey];
  const holderGroup = ACE_PRODUCT_DATA.holders[holderType];
  const holder = holderGroup[sizeKey];

  if (resetDiameter || !elements.diameter.value) elements.diameter.value = size.dmax;
  const diameter = Number(elements.diameter.value);
  const invalidDiameter = !Number.isFinite(diameter) || diameter <= 0 || diameter > size.dmax;
  elements.diameter.max = size.dmax;
  elements.diameter.classList.toggle("is-invalid", invalidDiameter);

  setText("sizeHint", `Dmax ${size.dmax} mm｜每盒 ${size.qty} pcs`);
  setText("angleHint", ACE_PRODUCT_DATA.angles[angle].use);
  setText("gradeHint", grade.note);
  setText("diameterHint", invalidDiameter ? `請輸入 0.1 至 ${size.dmax} mm。` : `目前設定在 Dmax ${size.dmax} mm 以內。`);
  document.getElementById("diameterHint").classList.toggle("is-error", invalidDiameter);

  setText("insertPartNumber", `${size.insert}-${angle}`);
  setText("applicationText", ACE_PRODUCT_DATA.angles[angle].use);
  setText("angleBadge", `${angle}°`);
  setText("insertCode", dimension.codes[gradeKey]);
  setText("coating", `${gradeKey} / ${grade.coating}`);
  setText("dmax", formatMillimeter(size.dmax));
  setText("tmax", formatMillimeter(dimension.tmax));
  setText("insertS", formatMillimeter(dimension.s));
  setText("insertCt", formatMillimeter(size.ct));
  setText("boxQty", `${size.qty} pcs`);
  setText("spotDepth", invalidDiameter ? "超出範圍" : `${calculateSpotDepth(diameter, angle, dimension).toFixed(2)} mm`);
  setText("holderName", holderGroup.label);
  renderHolderSpecs(holderType, holder);

  setText("selectionNote", angle === 60
    ? "60° 點鑽必須使用啄鑽循環；規格取自型錄第 16–19 頁，訂購前請再次確認應用條件。"
    : "規格取自 ACE Spot Drill 型錄第 16–19 頁，訂購前請再次確認應用條件。"
  );
}

/** 載入專案根目錄的共用頁首與頁尾，避免測試頁複製正式元件。 */
function loadSharedLayout() {
  fetch("../../header/header.html?v=20260520-news")
    .then(response => response.text())
    .then(html => {
      document.getElementById("header-placeholder").innerHTML = html;
      const button = document.getElementById("mobileMenuBtn");
      const nav = document.getElementById("topNav");
      button?.addEventListener("click", () => nav?.classList.toggle("active"));
    });

  fetch("../../footer/footer.html")
    .then(response => response.text())
    .then(html => { document.getElementById("footer-placeholder").innerHTML = html; });
}

initializeOptions();
updateResult({ resetDiameter: true });
loadSharedLayout();

elements.size.addEventListener("change", () => updateResult({ resetDiameter: true }));
elements.angleOptions.addEventListener("change", () => updateResult());
elements.grade.addEventListener("change", () => updateResult());
elements.holderType.addEventListener("change", () => updateResult());
elements.diameter.addEventListener("input", () => updateResult());
