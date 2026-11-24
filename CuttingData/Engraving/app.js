/* 四組雕刻切削工具共用介面。配對與數學由純核心負責；此處只管理輸入、URL及呈現。 */
(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const escapeHTML = value => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  const numberText = (value, digits = 4) => Number.isFinite(Number(value)) && value !== null && value !== "" ? String(Number(Number(value).toFixed(digits))) : "—";
  const unique = values => [...new Set(values.filter(Boolean))];
  const product = document.body.dataset.product;
  const pdf = "../Engraving/sources/Engraving-Tool-p068-083.pdf";
  const formNames = { radius_angled: "圓角 V 形／小平底", radius: "圓弧底", angled: "角形刀尖" };
  const numericIds = ["width", "depth", "hrc", "rpm", "feed", "machineMax"];
  const queryIds = ["width", "depth", "material", "angle", "form", "hrc", "materialDetail", "insertId", "holderId", "machineMax"];
  let catalog = null, lastFilter = null, lastResult = null, manual = false, pendingInsert = "", pendingHolder = "", diagramMarkup = "", diagramContext = null;
  let queryNotice = "";

  function readState() {
    const values = Object.fromEntries(queryIds.concat(["rpm", "feed"]).map(id => [id, $(id).value]));
    numericIds.forEach(id => { if ($(id).validity.badInput) values[id] = "invalid"; });
    values.valueMode = manual ? "manual" : "site_midpoint";
    values.lang = "zh-TW";
    return values;
  }

  function renderOptions(select, options, preferred, placeholder) {
    select.innerHTML = options.length ? options.map(option => `<option value="${escapeHTML(option.value)}">${escapeHTML(option.label)}</option>`).join("") : `<option value="">${escapeHTML(placeholder)}</option>`;
    const found = options.some(option => option.value === preferred);
    if (found) select.value = preferred;
    select.disabled = options.length === 0;
    return found;
  }

  function rangeText(range, unit = "") {
    return Array.isArray(range) ? `${numberText(range[0])}–${numberText(range[1])}${unit ? ` ${unit}` : ""}` : "未列";
  }

  function limitText(min, max) {
    return min === null || min === undefined ? `最大 ${numberText(max)} mm` : `${numberText(min)}–${numberText(max)} mm`;
  }

  function insertLabel(insert) {
    return `${insert.partBase} · ${insert.grade} · ${insert.angle}°${insert.status === "review" ? " · 需核對" : ""}`;
  }

  function closeZoom() {
    if ($("diagramDialog").open) $("diagramDialog").close();
  }

  function updateURL(state) {
    const url = new URL(window.location.href);
    queryIds.forEach(id => {
      const value = state[id];
      if (value !== "" && value !== null && value !== undefined && !(id === "materialDetail" && value === "unknown")) url.searchParams.set(id, value);
      else url.searchParams.delete(id);
    });
    ["rpm", "feed"].forEach(id => { if (manual && state[id] !== "") url.searchParams.set(id, state[id]); else url.searchParams.delete(id); });
    if (url.searchParams.has("lang")) url.searchParams.set("lang", "zh-TW");
    if (url.href !== window.location.href) window.history.replaceState(null, "", url);
  }

  function renderSelected(insert, holder) {
    if (!insert) {
      $("insertHelp").textContent = "";
      $("holderHelp").textContent = "";
      $("selectedSpecs").innerHTML = "";
      return;
    }
    $("insertHelp").textContent = `${insert.coating || "塗層未列"} · ${formNames[insert.form] || insert.form} · 訂購碼 ${insert.order_code}`;
    $("holderHelp").textContent = holder ? `${holder.shankLabel} · 總長 ${numberText(holder.length)} mm${holder.shank_material ? ` · ${holder.shank_material === "Carbide" ? "碳化鎢柄" : holder.shank_material === "Steel" ? "鋼柄" : holder.shank_material}` : ""} · 螺絲 ${holder.screw || "未列"}${holder.screw_torque_Nm ? ` / ${numberText(holder.screw_torque_Nm)} Nm` : ""}` : "此條件沒有可直接配對的刀柄。";
    $("selectedSpecs").innerHTML = `<div><dt>刻線寬度範圍</dt><dd>${escapeHTML(limitText(insert.limits.Wmin, insert.limits.Wmax))}</dd></div><div><dt>雕刻深度範圍</dt><dd>${escapeHTML(limitText(insert.limits.Tmin, insert.limits.Tmax))}</dd></div><div><dt>刀尖角度與底形</dt><dd>${escapeHTML(insert.angle)}° · ${escapeHTML(formNames[insert.form] || insert.form)}</dd></div><div><dt>刀片來源</dt><dd><a href="${pdf}#page=${insert.sourcePage - 67}" target="_blank" rel="noopener">型錄 p.${escapeHTML(insert.sourcePage)}</a></dd></div>`;
  }

  function renderPasses(cutting) {
    if (!cutting?.valid || !cutting.depthPasses) {
      $("passReference").innerHTML = '<p class="muted mb-0">選擇有直接切削配對的材料與刀片後顯示。</p>';
      return;
    }
    const passes = cutting.depthPasses;
    const values = passes.numbered_passes || [];
    const headers = values.map((_, index) => `第 ${index + 1} 道`).concat(["後續 ~", "精修"]);
    const cells = values.map(value => value === null ? "~" : numberText(value)).concat([passes.subsequent_pass_value === null ? "—" : numberText(passes.subsequent_pass_value), passes.finishing === null ? "未列" : numberText(passes.finishing)]);
    $("passReference").innerHTML = `<div class="table-responsive"><table class="table pass-table"><caption class="visually-hidden">型錄單道切深參考，單位mm</caption><thead><tr>${headers.map(label => `<th scope="col">${escapeHTML(label)}</th>`).join("")}</tr></thead><tbody><tr>${cells.map(value => `<td>${escapeHTML(value)}</td>`).join("")}</tr></tbody></table></div><p class="pass-note">單位 mm。以上是單道切深參考，請以需求總深與刀片上限為界；不將整列與精修直接相加成加工循環。原表「~」或未列值不作 0 處理。</p><a href="${pdf}#page=${cutting.sourcePage - 67}" target="_blank" rel="noopener">核對型錄 p.${escapeHTML(cutting.sourcePage)}</a>`;
  }

  function renderCalculation(state, filter, insert, holder, cutting, recommendation) {
    const hasManualBlank = manual && ($("rpm").value === "" || $("feed").value === "");
    let result = window.EngravingCore.calculate(catalog, state);
    if (hasManualBlank) result = { ...result, valid: false, rpm: null, feedRate: null, plungeFeed: null, errors: ["請填寫轉速與每轉進給，或使用範圍中間值。"] };
    lastResult = result;
    $("rpmOutput").textContent = result.valid ? Number(numberText(result.rpm, 2)).toLocaleString("en-US", { maximumFractionDigits: 2 }) : "—";
    $("feedOutput").textContent = result.valid ? numberText(result.feedRate, 2) : "—";
    $("plungeOutput").textContent = result.valid ? numberText(result.plungeFeed, 2) : "—";
    $("selectedName").textContent = insert ? `${insert.partBase} · ${insert.grade}` : "先選擇加工條件";
    $("medianButton").disabled = !cutting.valid;
    $("copyButton").disabled = !result.valid;
    $("valueMode").textContent = cutting.valid ? manual ? "手動值 · 結果依輸入數值換算" : recommendation.valid ? "型錄範圍中間值 · 可調整" : "請檢查機台上限或輸入條件" : "選擇材料與適用刀片，取得型錄範圍。";
    $("cuttingRange").hidden = !cutting.valid;
    if (cutting.valid) $("cuttingRange").innerHTML = `轉速範圍 <strong>${escapeHTML(rangeText(cutting.rpmRange, "rpm"))}</strong><br>每轉進給 <strong>${escapeHTML(rangeText(cutting.feedRange, "mm/rev"))}</strong><br><a href="${pdf}#page=${cutting.sourcePage - 67}" target="_blank" rel="noopener">型錄 p.${escapeHTML(cutting.sourcePage)}</a>`;
    const errors = filter.ready ? unique(result.errors || []) : [];
    $("resultMessages").innerHTML = errors.slice(0, 3).map(error => `<p class="result-error">${escapeHTML(error)}</p>`).join("");
    const warnings = unique(result.warnings || []);
    const importantWarnings = warnings.filter(value => /手動.*超出|已受機台/.test(value));
    $("resultMessages").innerHTML += importantWarnings.slice(0, 2).map(warning => `<p class="result-warning">${escapeHTML(warning)}</p>`).join("");
    $("copyStatus").textContent = "";
    const warningTarget = $("setupWarnings");
    if (warningTarget) warningTarget.innerHTML = warnings.length ? `<ul class="setup-warning-list mt-3">${warnings.map(value => `<li>${escapeHTML(value)}</li>`).join("")}</ul>` : "";
    $("sourceDescription").textContent = cutting.valid ? `本次配對採 Engraving Tool 型錄 p.${cutting.sourcePage}，刀片規格 p.${insert.sourcePage}。` : "Engraving Tool p68–83，依產品與實體刀片分開配對。";
    $("cuttingSource").href = cutting.valid ? `${pdf}#page=${cutting.sourcePage - 67}` : pdf;
    renderPasses(cutting);
    if (window.EngravingDiagrams) {
      diagramContext = { family: product, insert, holder, state: { ...state } };
      diagramMarkup = window.EngravingDiagrams.render(diagramContext);
      $("diagramCanvas").innerHTML = diagramMarkup;
    }
  }

  // 依賴條件改變時重新取得配對及中間值，避免保留上一個材料的手動S/f。
  function update(resetValues = true, preservePreferences = true) {
    if (!catalog) return;
    closeZoom();
    if (resetValues) manual = false;
    let state = readState();
    $("hardnessGroup").hidden = state.material !== "hardened_steel";
    $("materialDetailGroup").hidden = state.material !== "non_ferrous";
    const filter = window.EngravingCore.filterInserts(catalog, state);
    lastFilter = filter;
    const candidates = filter.ready ? filter.candidates : [];
    const preferredInsert = pendingInsert || (preservePreferences ? $("insertId").value : "");
    const preferredHolder = pendingHolder || (preservePreferences ? $("holderId").value : "");
    const foundInsert = renderOptions($("insertId"), candidates.map(item => ({ value: item.id, label: insertLabel(item) })), preferredInsert, filter.ready ? "沒有符合條件的刀片" : "請先設定加工需求");
    if (pendingInsert && !foundInsert && filter.ready) queryNotice = "原連結指定的刀片不符合目前條件，已依可用規格重新配對。";
    const insert = candidates.find(item => item.id === $("insertId").value) || null;
    const holders = insert ? window.EngravingCore.getHolders(catalog, insert, state) : [];
    const foundHolder = renderOptions($("holderId"), holders.map(item => ({ value: item.id, label: `${item.partNumber} · ${item.shankLabel} · L ${numberText(item.length)} mm` })), preferredHolder, insert ? "沒有適用刀柄" : "請先選擇刀片");
    if (pendingHolder && !foundHolder && insert) queryNotice = "原連結刀柄不符合目前刀片或材料限制，已重新配對。";
    const holder = holders.find(item => item.id === $("holderId").value) || null;
    pendingInsert = ""; pendingHolder = "";
    state = readState();
    const cutting = window.EngravingCore.selectCutting(catalog, insert, state);
    const recommendation = window.EngravingCore.recommendValues(cutting, state);
    const canSetValues = cutting.valid && Boolean(holder);
    $("rpm").disabled = !canSetValues;
    $("feed").disabled = !canSetValues;
    if (resetValues || !canSetValues) {
      $("rpm").value = canSetValues && recommendation.valid ? numberText(recommendation.rpm, 5) : "";
      $("feed").value = canSetValues && recommendation.valid ? numberText(recommendation.feed, 6) : "";
    }
    state = readState();
    $("candidateCount").textContent = filter.ready ? `${filter.matches.length} 種配對${filter.reviewMatches.length ? ` · ${filter.reviewMatches.length} 種需核對` : ""}` : "待輸入尺寸";
    $("selectionStatus").textContent = !filter.valid ? "請檢查加工需求。" : !filter.ready ? "刻線寬度或雕刻深度，先填一項就能開始找。" : !candidates.length ? "目前沒有同時符合尺寸、角度與材料的刀片，可先調整篩選條件。" : insert?.status === "review" ? "此候選還有槽形、硬度或切削深度需要核對，請查看下方說明。" : state.material ? "已依型錄尺寸及材料配對，可更換其他候選刀片。" : "已先依尺寸配對；選擇材料後取得轉速與進給範圍。";
    $("jobErrors").hidden = !filter.errors.length;
    $("jobErrors").textContent = filter.errors.join(" ");
    $("geometryNote").hidden = !filter.geometryCaution;
    $("geometryNote").textContent = filter.geometryCaution || "";
    const insertNotes = unique((insert?.status === "review" ? insert.notes || [] : []).concat(queryNotice));
    $("pairingNotice").hidden = insertNotes.length === 0;
    $("pairingNotice").textContent = insertNotes.join(" ");
    renderSelected(insert, holder);
    renderCalculation(state, filter, insert, holder, cutting, recommendation);
    updateURL(state);
  }

  function updateValues() {
    if (!catalog || !lastFilter) return;
    closeZoom();
    manual = true;
    const state = readState();
    const insert = lastFilter.candidates.find(item => item.id === state.insertId) || null;
    const holder = catalog.holders.find(item => item.id === state.holderId) || null;
    const cutting = window.EngravingCore.selectCutting(catalog, insert, state);
    const recommendation = window.EngravingCore.recommendValues(cutting, state);
    renderCalculation(state, lastFilter, insert, holder, cutting, recommendation);
    updateURL(state);
  }

  function loadExample() {
    const examples = {
      X060: { width: "0.5", depth: "0.2", material: "carbon_steel", angle: "45", form: "radius_angled" },
      V060: { width: "0.8", depth: "0.3", material: "carbon_steel", angle: "60", form: "radius_angled" },
      W060: { width: "0.25", depth: "0.1", material: "carbon_steel", angle: "60", form: "angled" },
      N9MTW: { width: "0.8", depth: "0.3", material: "alloy_steel", angle: "60", form: "angled" }
    };
    $("jobForm").reset();
    $("machineMax").value = "";
    Object.entries(examples[product]).forEach(([key, value]) => { $(key).value = value; });
    queryNotice = "";
    update(true, false);
  }

  function reset() {
    $("jobForm").reset();
    $("machineMax").value = "";
    $("rpm").value = "";
    $("feed").value = "";
    queryNotice = "";
    pendingInsert = ""; pendingHolder = "";
    update(true, false);
  }

  async function copySetup() {
    if (!lastResult?.valid) return;
    const state = readState(), result = lastResult;
    const material = catalog.materials.find(item => item.id === state.material);
    const content = [
      `${catalog.title} 雕刻設定`,
      `需求刻線寬 W：${state.width ? `${state.width} mm` : "未指定"}；總深 t：${state.depth ? `${state.depth} mm` : "未指定"}`,
      `材料：${material?.label || "未指定"}${state.hrc ? ` / HRC ${state.hrc}` : ""}`,
      `刀片：${result.insert.partBase} / ${result.insert.grade}；訂購碼 ${result.insert.order_code}`,
      `刀柄：${result.holder.partNumber}；${result.holder.shankLabel}；L ${numberText(result.holder.length)} mm`,
      `S=${numberText(result.rpm, 5)} rpm；f=${numberText(result.feed, 6)} mm/rev`,
      `F=${numberText(result.feedRate, 3)} mm/min；Z下刀進給=${numberText(result.plungeFeed, 3)} mm/min`,
      `${manual ? "手動數值換算" : "型錄範圍中間值：網站可調整起始參考"}；來源：Engraving Tool p.${result.sourcePage}`,
      "寬深僅分別比對型錄範圍；需依刀片確認實際槽形、裝夾及組合額定。單道Ap表不構成完整NC循環。"
    ].join("\n");
    try { await navigator.clipboard.writeText(content); $("copyStatus").textContent = "已複製雕刻設定。"; }
    catch { $("copyStatus").textContent = "瀏覽器無法寫入剪貼簿，請使用畫面上的設定值。"; }
  }

  function restoreQuery() {
    const params = new URLSearchParams(window.location.search);
    queryIds.filter(id => !["insertId", "holderId"].includes(id)).concat(["rpm", "feed"]).forEach(id => {
      if (!params.has(id)) return;
      const input = $(id), value = params.get(id);
      if (input.tagName === "SELECT" && ![...input.options].some(option => option.value === value)) {
        const option = new Option(`連結指定的條件未列：${value}`, value);
        option.hidden = true; option.disabled = true; input.add(option);
      }
      input.value = value;
    });
    pendingInsert = params.get("insertId") || "";
    pendingHolder = params.get("holderId") || "";
    manual = params.has("rpm") || params.has("feed");
    update(!manual);
  }

  async function loadShared() {
    await Promise.all(["header", "footer"].map(async part => {
      try {
        const response = await fetch(`../../${part}/${part}.html`);
        if (!response.ok) throw new Error(`${part}: ${response.status}`);
        $(`${part}-placeholder`).innerHTML = await response.text();
        if (part === "header") {
          const button = $("mobileMenuBtn"), nav = $("topNav");
          if (button && nav) {
            button.innerHTML = '<svg width="24" height="24" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M2 3.5a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5m0 4a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5m0 4a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5"/></svg>';
            button.setAttribute("aria-expanded", "false"); button.setAttribute("aria-controls", "topNav");
            button.addEventListener("click", () => button.setAttribute("aria-expanded", String(nav.classList.toggle("active"))));
          }
        }
      } catch (error) { console.error("共用區塊載入失敗", error); }
    }));
  }

  async function initialize() {
    loadShared();
    try {
      if (!window.EngravingCore) throw new Error("雕刻核心未載入");
      const data = await Promise.all(["./data/catalog.json", "./data/cutting-data.json", "../Engraving/data/common.json"].map(async url => { const response = await fetch(url); if (!response.ok) throw new Error(`${url}: ${response.status}`); return response.json(); }));
      catalog = window.EngravingCore.normalizeCatalog(...data);
      $("material").insertAdjacentHTML("beforeend", catalog.materials.map(item => `<option value="${escapeHTML(item.id)}">${escapeHTML(item.iso)} · ${escapeHTML(item.label)}</option>`).join(""));
      $("angle").insertAdjacentHTML("beforeend", unique(catalog.inserts.map(item => item.angle)).sort((a, b) => a - b).map(value => `<option value="${value}">${value}°</option>`).join(""));
      $("form").insertAdjacentHTML("beforeend", unique(catalog.inserts.map(item => item.form)).map(value => `<option value="${escapeHTML(value)}">${escapeHTML(formNames[value] || value)}</option>`).join(""));
      $("notesLink").href = `../Engraving/catalog-notes.html?product=${encodeURIComponent(product)}`;
      $("loadStatus").textContent = "";
      $("jobForm").addEventListener("submit", event => event.preventDefault());
      $("jobForm").addEventListener("input", event => { if (event.target.tagName === "INPUT") update(true); });
      $("jobForm").addEventListener("change", event => { if (event.target.tagName !== "SELECT") return; if (event.target.id === "material") { $("hrc").value = ""; $("materialDetail").value = "unknown"; } queryNotice = ""; update(true); });
      $("insertId").addEventListener("change", () => { queryNotice = ""; update(true); });
      $("holderId").addEventListener("change", () => update(true));
      $("machineMax").addEventListener("input", () => update(true));
      ["rpm", "feed"].forEach(id => $(id).addEventListener("input", updateValues));
      $("medianButton").addEventListener("click", () => update(true));
      $("exampleButton").addEventListener("click", loadExample);
      $("resetButton").addEventListener("click", reset);
      $("copyButton").addEventListener("click", copySetup);
      $("zoomDiagram").addEventListener("click", () => { $("zoomCanvas").innerHTML = diagramContext && window.EngravingDiagrams ? window.EngravingDiagrams.render(diagramContext) : diagramMarkup; $("diagramDialog").showModal(); });
      $("closeDiagram").addEventListener("click", () => $("diagramDialog").close());
      $("diagramDialog").addEventListener("click", event => { if (event.target !== $("diagramDialog")) return; const rect = $("diagramDialog").getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) $("diagramDialog").close(); });
      // 細節說明共用一份warning來源；主要操作區只顯示阻擋與手動越界事項。
      const detail = [...document.querySelectorAll(".reference-details")].find(item => item.querySelector("summary")?.textContent === "計算方式與裝夾條件");
      if (detail) detail.querySelector("div").insertAdjacentHTML("beforeend", '<div id="setupWarnings"></div>');
      restoreQuery();
    } catch (error) {
      console.error("雕刻資料載入失敗", error);
      $("loadStatus").textContent = "型錄資料載入失敗，請重新整理頁面。";
      $("loadStatus").setAttribute("role", "alert");
      $("exampleButton").disabled = true;
      $("resetButton").disabled = true;
    }
  }
  initialize();
})();
