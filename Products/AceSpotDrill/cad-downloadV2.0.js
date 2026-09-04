/**
 * ACE Spot Drill 專用 CAD 選擇器。
 * 依 CAD 格式、刀桿型式與型號篩選檔案，並把尺寸摘要與下載狀態渲染到產品頁。
 */
const ACE_CAD_CONFIG = {
  productName: "ACE Spot Drill",
  cadTypes: [
    { id: "step", label: "3D STEP", extension: "STEP" },
    { id: "dxf", label: "2D DXF", extension: "DXF" }
  ],
  holderTypes: [
    { id: "cylindrical", label: "Cylindrical Shank" },
    { id: "screw-fit", label: "Screw Fit Cutter" }
  ],
  holders: [
    { type: "cylindrical", si: "SI06", code: "6A0001", partsNo: "00-99688-SI06-06", filePart: "99688-SI06-06", dimensions: { od: "8", d: "6", l1: "27", l2: "14" }, screw: "*NS-18037 / 0.6Nm", key: "NK-T6" },
    { type: "cylindrical", si: "SI08", code: "6A0101", partsNo: "00-99688-SI08-08", filePart: "99688-SI08-08", dimensions: { od: "10.5", d: "8", l1: "36", l2: "19" }, screw: "*NS-20045 / 0.6Nm", key: "NK-T6" },
    { type: "cylindrical", si: "SI10", code: "6A0201", partsNo: "00-99688-SI10-10", filePart: "99688-SI10-10", dimensions: { od: "13", d: "10", l1: "40", l2: "22.5" }, screw: "*NS-25060 / 0.9Nm", key: "NK-T7" },
    { type: "cylindrical", si: "SI12", code: "6A0301", partsNo: "00-99688-SI12-12", filePart: "99688-SI12-12", dimensions: { od: "15.5", d: "12", l1: "45", l2: "25" }, screw: "NS-30072 / 2.0Nm", key: "NK-T9" },
    { type: "cylindrical", si: "SI16", code: "6A0401", partsNo: "00-99688-SI16-16", filePart: "99688-SI16-16", dimensions: { od: "21", d: "16", l1: "48", l2: "32" }, screw: "NS-35080 / 2.5Nm", key: "NK-T15" },
    { type: "cylindrical", si: "SI20", code: "6A0501", partsNo: "00-99688-SI20-20", filePart: "99688-SI20-20", dimensions: { od: "26", d: "20", l1: "50", l2: "35" }, screw: "NS-50125 / 5.5Nm", key: "NK-T20" },
    { type: "screw-fit", si: "SI06", code: "6A2001", partsNo: "00-99688-SI06-M04", filePart: "99688-SI06-M04", dimensions: { od: "8", l: "14.5", m: "M4xP0.7", dpm: "4.5" }, screw: "*NS-18037 / 0.6Nm", key: "NK-T6" },
    { type: "screw-fit", si: "SI08", code: "6A2101", partsNo: "00-99688-SI08-M05", filePart: "99688-SI08-M05", dimensions: { od: "10", l: "19", m: "M5xP0.8", dpm: "5.5" }, screw: "*NS-20045 / 0.6Nm", key: "NK-T6" },
    { type: "screw-fit", si: "SI10", code: "6A2201", partsNo: "00-99688-SI10-M06", filePart: "99688-SI10-M06", dimensions: { od: "12", l: "22", m: "M6xP1.0", dpm: "6.5" }, screw: "*NS-25060 / 0.9Nm", key: "NK-T7" },
    { type: "screw-fit", si: "SI12", code: "6A2301", partsNo: "00-99688-SI12-M08", filePart: "99688-SI12-M08", dimensions: { od: "16", l: "25", m: "M8xP1.25", dpm: "8.5" }, screw: "NS-30072 / 2.0Nm", key: "NK-T9" },
    { type: "screw-fit", si: "SI16", code: "6A2401", partsNo: "00-99688-SI16-M10", filePart: "99688-SI16-M10", dimensions: { od: "20", l: "31", m: "M10xP1.5", dpm: "10.5" }, screw: "NS-35080 / 2.5Nm", key: "NK-T15" },
    { type: "screw-fit", si: "SI20", code: "6A2501", partsNo: "00-99688-SI20-M12", filePart: "99688-SI20-M12", dimensions: { od: "25", l: "35", m: "M12xP1.75", dpm: "12.5" }, screw: "NS-50125 / 5.5Nm", key: "NK-T20" }
  ],
  cadFiles: [
    "99688-SI06-06_S9MT06T1-090", "99688-SI06-06_S9MT06T1-120", "99688-SI06-06_S9MT06T1-142",
    "99688-SI08-08_S9MT0802-060", "99688-SI08-08_S9MT0802-090", "99688-SI08-08_S9MT0802-120", "99688-SI08-08_S9MT0802-142",
    "99688-SI10-10_S9MT1003-060", "99688-SI10-10_S9MT1003-090", "99688-SI10-10_S9MT1003-120", "99688-SI10-10_S9MT1003-142",
    "99688-SI12-12_S9MT1203-060", "99688-SI12-12_S9MT1203-090", "99688-SI12-12_S9MT1203-120", "99688-SI12-12_S9MT1203-142",
    "99688-SI16-16_S9MT1604-060", "99688-SI16-16_S9MT1604-090", "99688-SI16-16_S9MT1604-120", "99688-SI16-16_S9MT1604-142",
    "99688-SI20-20_S9MT2004-060", "99688-SI20-20_S9MT2004-090", "99688-SI20-20_S9MT2004-120", "99688-SI20-20_S9MT2004-142",
    "99688-SI06-M04_S9MT06T1-090", "99688-SI06-M04_S9MT06T1-120", "99688-SI06-M04_S9MT06T1-142",
    "99688-SI08-M05_S9MT0802-090", "99688-SI08-M05_S9MT0802-120", "99688-SI08-M05_S9MT0802-142",
    "99688-SI10-M06_S9MT1003-090", "99688-SI10-M06_S9MT1003-120", "99688-SI10-M06_S9MT1003-142",
    "99688-SI12-M08_S9MT1203-090", "99688-SI12-M08_S9MT1203-120", "99688-SI12-M08_S9MT1203-142",
    "99688-SI16-M10_S9MT1603-090", "99688-SI16-M10_S9MT1603-120", "99688-SI16-M10_S9MT1603-142",
    "99688-SI20-M12_S9MT2004-090", "99688-SI20-M12_S9MT2004-120", "99688-SI20-M12_S9MT2004-142"
  ]
};

function escapeCadHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getAceCadValue(id) {
  return document.getElementById(id)?.value || "";
}

function parseAceCadFile(value) {
  const [holderPart, insert] = value.split("_");
  const angle = insert.split("-").pop();
  return {
    value,
    holderPart,
    insert,
    angle,
    angleLabel: `${Number(angle)} deg`,
    href: `./cadV2.0/${value}.STEP`
  };
}

const ACE_CAD_FILES = ACE_CAD_CONFIG.cadFiles.map(parseAceCadFile);

function getAceCadType() {
  return ACE_CAD_CONFIG.cadTypes.find(type => type.id === getAceCadValue("aceCadType")) || ACE_CAD_CONFIG.cadTypes[0];
}

function getAceHolderType() {
  return ACE_CAD_CONFIG.holderTypes.find(type => type.id === getAceCadValue("aceHolderType")) || ACE_CAD_CONFIG.holderTypes[0];
}

function getFilteredAceHolders() {
  const holderType = getAceCadValue("aceHolderType");
  const siSize = getAceCadValue("aceSiSize");

  return ACE_CAD_CONFIG.holders.filter(holder =>
    (!holderType || holder.type === holderType) &&
    (!siSize || holder.si === siSize)
  );
}

function getSelectedAceHolder() {
  const selectedPartsNo = getAceCadValue("aceHolderModel");
  return ACE_CAD_CONFIG.holders.find(holder => holder.partsNo === selectedPartsNo) || getFilteredAceHolders()[0] || null;
}

function getAceFilesForHolder(holder) {
  if (!holder) return [];
  return ACE_CAD_FILES.filter(file => file.holderPart === holder.filePart);
}

function getSelectedAceFile(holder) {
  const selectedValue = getAceCadValue("aceInsertModel");
  const files = getAceFilesForHolder(holder);
  return files.find(file => file.value === selectedValue) || files[0] || null;
}

function formatAceHolderLabel(holder) {
  const holderType = ACE_CAD_CONFIG.holderTypes.find(type => type.id === holder.type)?.label || holder.type;
  return `${holder.partsNo} / ${holder.si} / ${holderType}`;
}

function renderAceHolderOptions() {
  const modelSelect = document.getElementById("aceHolderModel");
  if (!modelSelect) return;

  const currentValue = modelSelect.value;
  const holders = getFilteredAceHolders();
  const selectedHolder = holders.find(holder => holder.partsNo === currentValue) || holders[0] || null;

  modelSelect.innerHTML = holders.map(holder => `
    <option value="${escapeCadHTML(holder.partsNo)}">
      ${escapeCadHTML(formatAceHolderLabel(holder))}
    </option>
  `).join("");

  if (selectedHolder) {
    modelSelect.value = selectedHolder.partsNo;
  }
}

function renderAceInsertOptions() {
  const insertSelect = document.getElementById("aceInsertModel");
  const holder = getSelectedAceHolder();
  if (!insertSelect || !holder) return;

  const currentValue = insertSelect.value;
  const files = getAceFilesForHolder(holder);
  const selectedFile = files.find(file => file.value === currentValue) || files[0] || null;

  insertSelect.innerHTML = files.map(file => `
    <option value="${escapeCadHTML(file.value)}">
      ${escapeCadHTML(file.insert)} / ${escapeCadHTML(file.angleLabel)}
    </option>
  `).join("");

  if (selectedFile) {
    insertSelect.value = selectedFile.value;
  }
}

function getAceDimensionRows(holder) {
  if (!holder) return [];

  if (holder.type === "cylindrical") {
    return [
      ["Ød", holder.dimensions.d],
      ["ØD", holder.dimensions.od],
      ["L1", holder.dimensions.l1],
      ["L2", holder.dimensions.l2]
    ];
  }

  return [
    ["ØD", holder.dimensions.od],
    ["L", holder.dimensions.l],
    ["M", holder.dimensions.m],
    ["DPM", holder.dimensions.dpm]
  ];
}

function renderAceCadSummary() {
  const summary = document.getElementById("aceCadSummary");
  const status = document.getElementById("aceCadStatus");
  const downloadBtn = document.getElementById("aceCadDownloadBtn");
  const holder = getSelectedAceHolder();
  const cadType = getAceCadType();
  const holderType = getAceHolderType();
  const selectedFile = getSelectedAceFile(holder);

  if (!summary || !status || !downloadBtn || !holder) return;

  const dimensionRows = getAceDimensionRows(holder);
  const href = cadType.id === "step" && selectedFile ? selectedFile.href : "";
  const cadFileName = selectedFile ? `${selectedFile.value}.${cadType.extension}` : `${holder.filePart}.${cadType.extension}`;

  summary.innerHTML = `
    <div class="ace-cad-summary-head">
      <span>${escapeCadHTML(cadType.label)}</span>
      <h3>${escapeCadHTML(holder.partsNo)}</h3>
      <p>${escapeCadHTML(holderType.label)} / ${escapeCadHTML(holder.si)}${selectedFile ? ` / ${escapeCadHTML(selectedFile.insert)}` : ""}</p>
    </div>

    <dl class="ace-cad-spec-grid">
      <div><dt>Code</dt><dd>${escapeCadHTML(holder.code)}</dd></div>
      <div><dt>Parts No.</dt><dd>${escapeCadHTML(holder.partsNo)}</dd></div>
      ${selectedFile ? `<div><dt>Insert</dt><dd>${escapeCadHTML(selectedFile.insert)}</dd></div><div><dt>Angle</dt><dd>${escapeCadHTML(selectedFile.angleLabel)}</dd></div>` : ""}
      ${dimensionRows.map(([label, value]) => `<div><dt>${escapeCadHTML(label)}</dt><dd>${escapeCadHTML(value)}</dd></div>`).join("")}
      <div><dt>Screw</dt><dd>${escapeCadHTML(holder.screw)}</dd></div>
      <div><dt>Key</dt><dd>${escapeCadHTML(holder.key)}</dd></div>
    </dl>
  `;

  downloadBtn.dataset.href = href;
  downloadBtn.dataset.filename = cadFileName;
  if (href) {
    downloadBtn.setAttribute("href", href);
    downloadBtn.setAttribute("aria-disabled", "false");
  } else {
    downloadBtn.setAttribute("href", "#");
    downloadBtn.setAttribute("aria-disabled", "true");
  }
  status.textContent = href
    ? `${cadFileName} 已可下載。`
    : `${cadFileName} 官方目前未提供。`;
}

function updateAceCadForm() {
  renderAceHolderOptions();
  renderAceInsertOptions();
  renderAceCadSummary();
}

function bindAceCadForm() {
  ["aceCadType", "aceHolderType", "aceSiSize", "aceHolderModel", "aceInsertModel"].forEach(id => {
    document.getElementById(id)?.addEventListener("change", updateAceCadForm);
  });

  document.getElementById("aceCadDownloadBtn")?.addEventListener("click", event => {
    const button = event.currentTarget;
    const href = button.dataset.href || "";
    const status = document.getElementById("aceCadStatus");

    if (href) {
      window.location.href = href;
      return;
    }

    event.preventDefault();

    if (status) {
      status.textContent = `${button.dataset.filename || "CAD file"} 官方目前未提供。`;
    }
  });
}

function renderAceSelectOptions(items, getValue, getLabel) {
  return items.map(item => `<option value="${escapeCadHTML(getValue(item))}">${escapeCadHTML(getLabel(item))}</option>`).join("");
}

function renderProductCadDownloadPage(container) {
  if (!container) return;

  const siSizes = [...new Set(ACE_CAD_CONFIG.holders.map(holder => holder.si))];

  container.innerHTML = `
    <h1 class="page-title">${escapeCadHTML(ACE_CAD_CONFIG.productName)} CAD Download</h1>
    <div class="title-line"></div>

    <section class="cad-download-panel ace-cad-panel is-compact" aria-label="${escapeCadHTML(ACE_CAD_CONFIG.productName)} CAD download">
      <div class="cad-download-intro">
        <span>CAD Download</span>
        <h2>ACE CAD 快速選型下載</h2>
        <p>選擇 CAD 格式、刀桿型式、SI 尺寸、Holder Model 與刀片角度，快速下載對應的官方 STEP 檔案。</p>
      </div>

      <form class="ace-cad-quick-form" id="aceCadForm">
        <label>
          <span>CAD 格式</span>
          <select id="aceCadType">${renderAceSelectOptions(ACE_CAD_CONFIG.cadTypes, item => item.id, item => item.label)}</select>
        </label>

        <label>
          <span>刀桿型式</span>
          <select id="aceHolderType">${renderAceSelectOptions(ACE_CAD_CONFIG.holderTypes, item => item.id, item => item.label)}</select>
        </label>

        <label>
          <span>SI 尺寸</span>
          <select id="aceSiSize">
            <option value="">全部 SI 尺寸</option>
            ${siSizes.map(size => `<option value="${escapeCadHTML(size)}">${escapeCadHTML(size)}</option>`).join("")}
          </select>
        </label>

        <label>
          <span>Holder Model</span>
          <select id="aceHolderModel"></select>
        </label>

        <label>
          <span>刀片 / 角度</span>
          <select id="aceInsertModel"></select>
        </label>

        <a class="ace-cad-download-btn" id="aceCadDownloadBtn" href="#" role="button">下載 CAD</a>
      </form>

      <div class="ace-cad-output">
        <aside class="ace-cad-model-panel" aria-label="Selected ACE CAD file">
          <div id="aceCadSummary"></div>
          <div class="ace-cad-status" id="aceCadStatus" aria-live="polite"></div>
        </aside>

        <aside class="ace-cad-note-panel">
          <h3>下載說明</h3>
          <p>官方 ACE CAD 檔案是 Holder + Insert 角度的 STEP 組合檔。若選擇 2D DXF，目前會顯示官方未提供。</p>
          <p>STEP 檔案已下載到本機 cadV2.0 資料夾，按下下載會直接開啟對應檔案。</p>
        </aside>
      </div>
    </section>
  `;

  bindAceCadForm();
  updateAceCadForm();
}

/*
  Legacy full-form markup kept out of render. The live CAD Download page uses the compact B layout above.
*/
function renderProductCadDownloadPageLegacy(container) {
  if (!container) return;

  const siSizes = [...new Set(ACE_CAD_CONFIG.holders.map(holder => holder.si))];

  container.innerHTML = `
    <h1 class="page-title">${escapeCadHTML(ACE_CAD_CONFIG.productName)} CAD Download</h1>
    <div class="title-line"></div>

    <section class="cad-download-panel ace-cad-panel" aria-label="${escapeCadHTML(ACE_CAD_CONFIG.productName)} CAD download">
      <div class="cad-download-intro">
        <span>CAD Download</span>
        <h2>ACE CAD 快速選型下載</h2>
        <p>選擇 CAD 格式、刀桿型式、SI 尺寸、Holder Model 與刀片角度，快速下載對應的官方 STEP 檔案。</p>
      </div>

      <div class="ace-cad-workspace">
        <form class="ace-cad-form" id="aceCadForm">
          <label>
            <span>CAD 格式</span>
            <select id="aceCadType">${renderAceSelectOptions(ACE_CAD_CONFIG.cadTypes, item => item.id, item => item.label)}</select>
          </label>

          <label>
            <span>刀桿型式</span>
            <select id="aceHolderType">${renderAceSelectOptions(ACE_CAD_CONFIG.holderTypes, item => item.id, item => item.label)}</select>
          </label>

          <label>
            <span>SI 尺寸</span>
            <select id="aceSiSize">
              <option value="">全部 SI 尺寸</option>
              ${siSizes.map(size => `<option value="${escapeCadHTML(size)}">${escapeCadHTML(size)}</option>`).join("")}
            </select>
          </label>

          <label>
            <span>Holder Model</span>
            <select id="aceHolderModel"></select>
          </label>

          <label>
            <span>刀片 / 角度</span>
            <select id="aceInsertModel"></select>
          </label>
        </form>

        <aside class="ace-cad-result" aria-label="Selected ACE CAD specification">
          <div id="aceCadSummary"></div>
          <a class="ace-cad-download-btn" id="aceCadDownloadBtn" href="#" role="button">下載 CAD</a>
          <div class="ace-cad-status" id="aceCadStatus" aria-live="polite"></div>
        </aside>
      </div>
    </section>
  `;

  bindAceCadForm();
  updateAceCadForm();
}
