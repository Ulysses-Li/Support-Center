/* 雕刻分類頁：介面只消費獨立引擎結果；所有資料文字先跳脫再輸出。 */
(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const escapeHTML = value => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  const numberText = value => Number.isFinite(value) ? String(Number(value.toFixed(4))) : "—";
  const mobile = window.matchMedia("(max-width:575.98px)");
  const state = { result: null, expanded: null, showExcluded: false };
  const chevron = '<svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708"/></svg>';

  // 線稿用來辨認刀尖角度與槽形，沒有替代精確型錄圖面或寬深換算。
  function familyIcon(id) {
    const top = id === "V045" ? 22 : id === "W060" ? 20 : 15;
    const tip = id === "V045" ? 43 : id === "W060" ? 39 : 42;
    const bottom = id === "X060" ? 'Q28 46 32 42' : 'H32';
    return `<svg viewBox="0 0 60 55" aria-hidden="true"><path d="M5 25H${top}L27 ${tip}${bottom}L${60 - top} 25H55V50H5Z" fill="#d4e4ef" stroke="#7894aa" stroke-width="1.3"/><path d="M${top} 25L27 ${tip}${bottom}L${60 - top} 25" fill="none" stroke="#f05a1a" stroke-width="2.6"/><path d="M30 4V48" stroke="#91afc2" stroke-dasharray="3 3" stroke-width=".9"/><path d="M14 14H46" stroke="#0067ad" stroke-width="1.2"/><path d="M18 11L14 14L18 17M42 11L46 14L42 17" fill="none" stroke="#0067ad" stroke-width="1.2"/></svg>`;
  }

  function widthText(range) {
    if (!range || range.max === null) return "依刀片確認";
    if (range.min === null) return `最大 ${numberText(range.max)} mm`;
    return `${numberText(range.min)}–${numberText(range.max)} mm`;
  }

  function rangeText(min, max) {
    if (min === null || min === undefined) return `≤ ${numberText(max)}`;
    return `${numberText(min)}–${numberText(max)}`;
  }

  function renderCard(family) {
    const isIdle = family.status === "idle";
    const isExcluded = family.status === "no-match";
    const summary = family.matchedSummary || family.summary;
    const expanded = !mobile.matches || state.expanded === family.id;
    const statusText = isIdle ? "瀏覽型錄規格" : family.status === "match" ? `${family.matches.length} 種刀片／牌號符合初篩` : family.status === "review" ? "需核對槽形或加工條件" : "目前條件未符合";
    const reason = isIdle ? family.description : family.reasons.join("；");
    return `<div class="col-12 col-md-6 col-xl-4"><article class="family-card ${family.status === "review" ? "is-review" : ""} ${isExcluded ? "is-excluded" : ""}">
      <button class="family-heading" type="button" data-family-toggle="${escapeHTML(family.id)}" aria-expanded="${expanded}" aria-controls="family-body-${escapeHTML(family.id)}">
        <span class="family-icon">${familyIcon(family.id)}</span><span><h3>${escapeHTML(family.title)}</h3><p>${escapeHTML(family.subtitle)}</p></span><span class="mobile-chevron">${chevron}</span>
      </button>
      <div class="family-body" id="family-body-${escapeHTML(family.id)}" ${expanded ? "" : "hidden"}>
        <p class="match-state state-${escapeHTML(family.status)}">${escapeHTML(statusText)}</p>
        <dl class="spec-pairs"><div><dt>刻線寬度範圍</dt><dd>${escapeHTML(widthText(summary.widthRange))}</dd></div><div><dt>雕刻深度上限</dt><dd>${escapeHTML(numberText(summary.depthRange.max))} mm</dd></div><div><dt>刀尖角度</dt><dd>${escapeHTML(summary.angles.map(value => `${value}°`).join(" / "))}</dd></div><div><dt>可選夾持柄徑</dt><dd>${escapeHTML(summary.shankLabels.join(" / "))}</dd></div></dl>
        <p class="match-reason">${escapeHTML(reason)}</p>
        <button type="button" class="family-button" data-open-family="${escapeHTML(family.id)}">${isIdle || isExcluded ? "查看系列規格" : "查看候選刀片"}</button>
      </div>
    </article></div>`;
  }

  function readInput() {
    return { width: $("width").validity.badInput ? "invalid" : $("width").value, depth: $("depth").validity.badInput ? "invalid" : $("depth").value, material: $("material").value, angle: $("angle").value };
  }

  function update() {
    const result = window.EngravingEngine.match(readInput());
    state.result = result;
    const idle = result.state === "idle";
    const invalid = result.state === "invalid";
    $("validationMessage").hidden = !invalid;
    $("validationMessage").textContent = invalid ? result.message : "";
    ["width", "depth", "material", "angle"].forEach(id => $(id).setAttribute("aria-invalid", String(Boolean(result.errors[id]))));
    $("resultCount").textContent = idle || invalid ? "5 個系列可比較" : `${result.matchCount} 個系列符合初篩${result.reviewCount ? ` · ${result.reviewCount} 個需核對` : ""}`;
    const descriptions = [];
    if (result.input.width !== null && !invalid) descriptions.push(`線寬 ${numberText(result.input.width)} mm`);
    if (result.input.depth !== null && !invalid) descriptions.push(`深度 ${numberText(result.input.depth)} mm`);
    const material = window.ENGRAVING_DATA.materials.find(item => item.id === result.input.material);
    if (material) descriptions.push(material.label);
    if (result.input.angle !== null && !invalid) descriptions.push(`${result.input.angle}°`);
    $("resultSummary").textContent = idle || invalid ? "先瀏覽系列，或填入加工需求縮小範圍。" : descriptions.join(" · ");
    const pendingNotes = [];
    if (result.geometryCaution) pendingNotes.push("已比對型錄的線寬與深度範圍；實際槽底形狀及兩者的對應關係，選定刀片後再確認。");
    if (result.requiredNext.includes("hardness")) pendingNotes.push("淬硬鋼請在下一步補充 HRC 硬度，各系列的適用上限不同。");
    $("geometryNote").textContent = pendingNotes.join(" ");
    $("geometryNote").hidden = pendingNotes.length === 0 || result.matchCount + result.reviewCount === 0;
    const shown = result.families.filter(item => item.status !== "no-match");
    const excluded = result.families.filter(item => item.status === "no-match");
    // 符合與需核對各保持原系列順序，不假定資料有唯一的原廠優先排名。
    shown.sort((a, b) => Number(a.status === "review") - Number(b.status === "review"));
    $("familyGrid").innerHTML = shown.map(renderCard).join("");
    $("excludedGrid").innerHTML = excluded.map(renderCard).join("");
    $("excludedArea").hidden = excluded.length === 0;
    $("excludedGrid").hidden = !state.showExcluded;
    $("excludedToggle").setAttribute("aria-expanded", String(state.showExcluded));
    $("excludedToggle").textContent = `${state.showExcluded ? "收合" : "查看"}未符合的 ${excluded.length} 個系列`;
    const empty = !idle && !invalid && result.matchCount === 0;
    $("emptyState").hidden = !empty;
    if (empty) $("emptyState").innerHTML = result.reviewCount ? '<h3>先核對這些候選系列</h3><p class="muted">尺寸上仍有可能，但型錄缺少直接確認的條件。展開卡片，看看需要補充什麼。</p>' : '<h3>目前沒有同時符合的刀片</h3><p class="muted">可以先放寬角度，或檢查線寬與深度。下方保留各系列未符合的原因供你比較。</p>';
  }

  // 初篩條件與實體刀片可帶到正式切削工具，保留使用者剛才的選擇。
  function cuttingToolHref(family, insert) {
    const directories = { X060: "X060", V045: "V060", V060: "V060", W060: "W060", "N9MT-W": "N9MTW" };
    const params = new URLSearchParams();
    const input = state.result.input;
    if (Number.isFinite(input.width) && input.width > 0) params.set("width", input.width);
    if (Number.isFinite(input.depth) && input.depth > 0) params.set("depth", input.depth);
    if (input.material) params.set("material", input.material);
    if (insert) { params.set("insertId", insert.id); params.set("angle", insert.angle); params.set("form", insert.form); }
    else if (input.angle) params.set("angle", input.angle);
    const query = params.toString();
    return `../../CuttingData/${directories[family.id]}/index.html${query ? `?${query}` : ""}`;
  }

  function openFamily(id) {
    const family = state.result.families.find(item => item.id === id);
    if (!family) return;
    const explore = family.status === "idle" || family.status === "no-match";
    const inserts = explore ? window.ENGRAVING_DATA.inserts.filter(item => item.family === id) : family.matches.concat(family.reviewMatches);
    const sourcePages = family.summary.sourcePages;
    const sourcePage = sourcePages[0];
    const labelForm = { radius_angled: "圓角 V 形／小平底", radius: "圓弧底", angled: "角形刀尖" };
    $("dialogTitle").textContent = `${family.title} · ${explore ? "系列規格" : "候選刀片"}`;
    let notice = explore ? "以下列出此系列的型錄規格，尚未完成材料與加工條件配對。" : family.status === "review" ? family.reasons.join("；") : state.result.geometryCaution || "這是型錄範圍初篩；選定刀片後，再確認實際槽底形狀與機台條件。";
    const hardnessLimits = [...new Set(inserts.flatMap(item => item.hardnessLimits || []))];
    if (hardnessLimits.length) notice += ` 工件硬度需符合此處候選刀片的條件：${hardnessLimits.join(" / ")}，請於下一步確認。`;
    $("dialogContent").innerHTML = `<p class="dialog-intro">${escapeHTML(family.description)}</p><p class="mb-2 fw-semibold">此系列可選夾持柄徑</p><div class="dialog-shanks">${family.summary.shankLabels.map(value => `<span>${escapeHTML(value)}</span>`).join("")}</div><p class="dialog-notice">${escapeHTML(notice)}</p>
      <div class="table-responsive"><table class="table spec-table"><caption class="visually-hidden">${escapeHTML(family.title)} 刀片規格，尺寸單位為 mm。</caption><thead><tr><th scope="col">刀片／牌號</th><th scope="col">角度・底形</th><th scope="col">線寬 mm</th><th scope="col">深度 mm</th><th scope="col">設定</th></tr></thead><tbody>${inserts.map(item => `<tr><td>${escapeHTML(item.partBase)}<br><small>${escapeHTML(item.grade)} · 訂購碼 ${escapeHTML(item.orderCode)}</small></td><td>${escapeHTML(item.angle)}°<br><small>${escapeHTML(labelForm[item.form] || item.form)}</small></td><td>${item.limits.Wmin === null ? `最大 ${escapeHTML(numberText(item.limits.Wmax))}<br><small>最小線寬需核對</small>` : escapeHTML(rangeText(item.limits.Wmin, item.limits.Wmax))}</td><td>${escapeHTML(rangeText(item.limits.Tmin, item.limits.Tmax))}${item.status === "review" ? '<br><small>加工條件需核對</small>' : ""}</td><td><a class="bring-setup" href="${escapeHTML(cuttingToolHref(family, item))}">帶入設定</a><br><small>p.${escapeHTML(item.sourcePage)}</small></td></tr>`).join("")}</tbody></table></div>
      <p class="muted small mb-0">各刀片的範圍分別依型錄列出。可用刃角數不代表同時參與切削的齒數。</p><div class="dialog-footer"><a href="${escapeHTML(cuttingToolHref(family))}">開啟切削設定工具</a><a href="${escapeHTML(family.productHref)}">產品技術資料</a><a href="${escapeHTML(window.ENGRAVING_DATA.source.catalogHref)}#page=${sourcePage - 67}" target="_blank" rel="noopener">核對原型錄 PDF</a></div>`;
    $("specDialog").showModal();
  }

  function toggleFamily(id) {
    if (!mobile.matches) return;
    state.expanded = state.expanded === id ? null : id;
    document.querySelectorAll("[data-family-toggle]").forEach(button => {
      const expanded = button.dataset.familyToggle === state.expanded;
      button.setAttribute("aria-expanded", String(expanded));
      $(button.getAttribute("aria-controls")).hidden = !expanded;
    });
  }

  // 頁首、頁尾取用根目錄原件；手機圖示採內嵌Bootstrap Icons，免載外部字型。
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
            button.setAttribute("aria-expanded", "false");
            button.setAttribute("aria-controls", "topNav");
            button.addEventListener("click", () => { const expanded = nav.classList.toggle("active"); button.setAttribute("aria-expanded", String(expanded)); });
          }
        }
      } catch (error) { console.error("共用區塊載入失敗", error); }
    }));
  }

  async function initialize() {
    loadShared();
    try {
      await window.EngravingEngineReady;
      if (!window.EngravingEngine || !window.ENGRAVING_DATA) throw new Error("雕刻型錄資料未就緒");
    } catch (error) {
      $("validationMessage").hidden = false;
      $("validationMessage").textContent = "型錄資料載入失敗，請重新整理頁面。";
      $("main-content").setAttribute("aria-busy", "false");
      return;
    }
    $("material").insertAdjacentHTML("beforeend", window.ENGRAVING_DATA.materials.map(item => `<option value="${escapeHTML(item.id)}">${escapeHTML(item.iso)} · ${escapeHTML(item.label)}</option>`).join(""));
    $("jobForm").addEventListener("submit", event => event.preventDefault());
    $("jobForm").addEventListener("input", update);
    $("jobForm").addEventListener("change", update);
    $("resetButton").addEventListener("click", () => { $("jobForm").reset(); state.expanded = null; state.showExcluded = false; update(); });
    const examples = { fine: { width: "0.2", depth: "", material: "carbon_steel", angle: "" }, deep: { width: "", depth: "1.2", material: "carbon_steel", angle: "" }, shallow: { width: "0.15", depth: "0.1", material: "carbon_steel", angle: "60" } };
    document.querySelectorAll("[data-example]").forEach(button => button.addEventListener("click", () => {
      Object.entries(examples[button.dataset.example]).forEach(([key, value]) => { $(key).value = value; });
      state.expanded = null; state.showExcluded = false; update();
    }));
    document.addEventListener("click", event => {
      const open = event.target.closest("[data-open-family]");
      const toggle = event.target.closest("[data-family-toggle]");
      if (open) openFamily(open.dataset.openFamily);
      else if (toggle) toggleFamily(toggle.dataset.familyToggle);
    });
    $("excludedToggle").addEventListener("click", () => { state.showExcluded = !state.showExcluded; $("excludedGrid").hidden = !state.showExcluded; $("excludedToggle").setAttribute("aria-expanded", String(state.showExcluded)); $("excludedToggle").textContent = `${state.showExcluded ? "收合" : "查看"}未符合的 ${state.result.families.filter(item => item.status === "no-match").length} 個系列`; });
    $("closeDialog").addEventListener("click", () => $("specDialog").close());
    $("specDialog").addEventListener("click", event => { if (event.target === $("specDialog")) { const rect = $("specDialog").getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) $("specDialog").close(); } });
    mobile.addEventListener("change", () => { state.expanded = null; update(); });
    update();
    $("main-content").setAttribute("aria-busy", "false");
  }
  initialize();
})();
