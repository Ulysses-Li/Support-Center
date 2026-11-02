/* UI 僅呈現型錄確切配對；純查詢集中在 core.js，未核對的切削數據不預填。 */
(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const selector = createMccSelector(MCC_QUICK_PICK);
  // 由目前站點解析網址，讓預覽、正式網域與複製內容都指向同一份站內 PDF。
  const sourceURL = new URL(MCC_QUICK_PICK.source.url, window.location.href);
  const escapeHTML = value => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  const numberText = value => String(Number(value.toFixed(2)));
  const state = { mode: "thread", side: "internal", standard: "M", threadId: "", insertId: "R06005-05010", chosenInsert: "", threadQuery: "", insertQuery: "", reverseQuery: "", limit: 12 };
  let visibleThreads = [];
  let copyText = "";

  function setOptions(field, entries, selected, emptyLabel) {
    field.innerHTML = entries.length ? entries.map(([value, label]) => `<option value="${escapeHTML(value)}">${escapeHTML(label)}</option>`).join("") : `<option value="">${escapeHTML(emptyLabel)}</option>`;
    field.disabled = !entries.length;
    field.value = entries.some(([value]) => value === selected) ? selected : entries[0]?.[0] || "";
    return field.value;
  }

  function updateFilters() {
    const reverse = state.mode === "insert";
    $("threadFields").hidden = reverse;
    $("insertFields").hidden = !reverse;
    $("reverseThreadFilter").hidden = !reverse;
    $("standardLabel").textContent = `${reverse ? "03" : "02"} · Thread standard`;
    document.querySelectorAll("[data-mode]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.mode === state.mode)));
    document.querySelectorAll("[data-side]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.side === state.side)));

    if (reverse) {
      const options = selector.getInserts({ query: state.insertQuery });
      state.insertId = setOptions($("insertSelect"), options.map(insert => [insert.id, `${insert.id} · Ø${numberText(insert.diameter)} mm`]), state.insertId, "No listed insert");
    }
    const standards = MCC_QUICK_PICK.standards.filter(standard => selector.getThreads({ side: state.side, standard: standard.id, insertId: reverse ? state.insertId : "" }).length);
    const standardEntries = standards.map(standard => [standard.id, standard.label]);
    if (reverse) standardEntries.unshift(["", "All listed standards"]);
    state.standard = setOptions($("standardSelect"), standardEntries, state.standard, "No listed standard");
    const standard = selector.getStandard(state.standard);
    $("standardHint").textContent = standard ? `${standard.angle}° · ${standard.kind === "tapered" ? "Tapered thread" : "Parallel thread"}` : "Shows this insert’s listed thread standards.";

    visibleThreads = reverse && !state.insertId ? [] : selector.getThreads({ side: state.side, standard: state.standard, insertId: reverse ? state.insertId : "", query: reverse ? state.reverseQuery : state.threadQuery });
    if (!reverse) {
      state.threadId = setOptions($("threadSelect"), visibleThreads.map(row => [row.id, row.size]), state.threadId, "No size listed for this search");
      const inserts = selector.getInserts({ threadId: state.threadId || "__none__" });
      if (!inserts.some(insert => insert.id === state.chosenInsert)) state.chosenInsert = inserts.length === 1 ? inserts[0].id : "";
    } else {
      if (!visibleThreads.some(row => row.id === state.threadId)) state.threadId = visibleThreads.length === 1 ? visibleThreads[0].id : "";
    }
  }

  function applicationDiagram(insert) {
    const internal = state.side === "internal";
    const title = internal ? "Internal thread" : "External thread";
    // 僅示意相對位置，不從公稱牙規推估底孔、刀心距離或實際干涉。
    $("applicationDiagram").innerHTML = `<title id="applicationDiagramTitle">${title} insert selection</title><desc id="applicationDiagramDescription">${title} application schematic. Blue is the workpiece and orange is the selected insert. This drawing does not calculate clearance or depth.</desc>
      <defs><pattern id="mccHatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><line x1="0" y1="0" x2="0" y2="7" stroke="#cadce8" stroke-width="1.5"/></pattern></defs>
      ${internal ? '<path d="M59 78a57 57 0 1 0 114 0a57 57 0 1 0-114 0M78 78a38 38 0 1 1 76 0a38 38 0 1 1-76 0" fill="url(#mccHatch)" fill-rule="evenodd" stroke="#7f9db1"/><circle cx="134" cy="78" r="19" fill="#fff2e8" stroke="#f05a1a" stroke-width="3"/>' : '<circle cx="99" cy="78" r="42" fill="url(#mccHatch)" stroke="#7f9db1"/><circle cx="163" cy="78" r="23" fill="#fff2e8" stroke="#f05a1a" stroke-width="3"/>'}
      <path d="M${internal ? 134 : 163} 73v10m-5-5h10" fill="none" stroke="#b83e0c"/>
      <g font-family="Arial,sans-serif" font-size="14" fill="#3e617a"><text x="125" y="16" text-anchor="middle">${title}</text><text x="125" y="151" text-anchor="middle" fill="#b44819">Insert Ø${numberText(insert.diameter)} mm</text></g>`;
  }

  function renderDetail() {
    const row = selector.getRow(state.threadId);
    const insert = selector.getInsert(state.mode === "thread" ? state.chosenInsert : state.insertId);
    const valid = Boolean(row && insert && row.insertIds.includes(insert.id));
    $("selectionDetail").hidden = !valid;
    $("copyFeedback").textContent = "";
    copyText = "";
    if (!valid) return;
    const standard = selector.getStandard(row.standard);
    const side = state.side === "internal" ? "Internal" : "External";
    $("selectedModel").textContent = insert.id;
    $("selectedThread").textContent = `${side} thread · ${row.size}`;
    $("selectedDiameter").textContent = `Ø${numberText(insert.diameter)} mm`;
    $("selectedForm").textContent = `${standard.angle}° · ${standard.kind === "tapered" ? "Tapered" : "Parallel"}`;
    const pageURL = new URL(sourceURL.href);
    pageURL.hash = `page=${row.page}`;
    $("rowSourceLink").href = pageURL.href;
    $("rowSourceLink").textContent = `Quick Pick · p. ${row.page} ↗`;
    applicationDiagram(insert);
    copyText = [`MCC Thread Mill | Quick Pick selection`, `${side} thread: ${row.size}`, `Insert: ${insert.id} | ØD: ${numberText(insert.diameter)} mm`, `${standard.angle}° ${standard.kind} thread`, `Source: ${MCC_QUICK_PICK.source.title}, ${MCC_QUICK_PICK.source.revision}, p. ${row.page}`, `Holder fit, reach, machining depth and cutting conditions still need confirmation.`, pageURL.href].join("\n");
  }

  function renderResults() {
    const reverse = state.mode === "insert";
    const row = selector.getRow(state.threadId);
    const inserts = reverse ? [] : selector.getInserts({ threadId: state.threadId || "__none__" });
    const total = reverse ? visibleThreads.length : inserts.length;
    $("resultsKicker").textContent = reverse ? "REVERSE LOOKUP" : "MATCHED IN QUICK PICK";
    $("resultsTitle").textContent = reverse ? "Listed thread sizes" : "Listed inserts";
    $("resultCount").textContent = `${total} ${reverse ? (total === 1 ? "size" : "sizes") : (total === 1 ? "insert" : "inserts")}`;
    const side = state.side === "internal" ? "Internal" : "External";
    $("resultContext").textContent = reverse ? `${side} thread · ${state.insertId || "No insert selected"}. Choose a listed size to inspect the pairing.` : row ? `${side} thread · ${row.size}. ${total > 1 ? "Select an insert to inspect this pairing." : "One insert is listed for this specification."}` : `${side} thread · no matching size in this edition.`;
    $("emptyState").hidden = total > 0;
    $("moreButton").hidden = !reverse || total <= state.limit;
    if (reverse) {
      $("moreButton").textContent = `Show more sizes (${Math.min(state.limit, total)} of ${total})`;
      $("resultList").innerHTML = visibleThreads.slice(0, state.limit).map(item => `<button type="button" class="thread-choice" data-row="${escapeHTML(item.id)}" aria-pressed="${item.id === state.threadId}"><strong>${escapeHTML(item.size)}</strong><span>${escapeHTML(item.standard)} · p. ${item.page}</span><span aria-hidden="true">→</span></button>`).join("");
    } else {
      $("resultList").innerHTML = inserts.map(insert => `<button type="button" class="insert-choice" data-insert="${escapeHTML(insert.id)}" aria-pressed="${insert.id === state.chosenInsert}"><span><strong>${escapeHTML(insert.id)}</strong><small>${insert.id === state.chosenInsert ? "Selected" : "Listed candidate"} · Quick Pick p. ${row.page}</small></span><span class="insert-diameter">Ø${numberText(insert.diameter)} <span>mm</span></span></button>`).join("");
    }
    renderDetail();
  }

  function render() { updateFilters(); renderResults(); }
  function reset() {
    Object.assign(state, { mode: "thread", side: "internal", standard: "M", threadId: MCC_QUICK_PICK.rows.find(row => row.side === "internal" && row.standard === "M" && normalizeSearch(row.size) === "m6x1")?.id || "", insertId: "R06005-05010", chosenInsert: "", threadQuery: "", insertQuery: "", reverseQuery: "", limit: 12 });
    ["threadSearch", "insertSearch", "reverseThreadSearch"].forEach(id => { $(id).value = ""; });
    render();
  }

  document.querySelectorAll("[data-mode]").forEach(button => button.addEventListener("click", () => {
    if (state.mode === button.dataset.mode) return;
    if (state.mode === "thread" && state.chosenInsert) state.insertId = state.chosenInsert;
    state.mode = button.dataset.mode;
    state.standard = state.mode === "insert" ? "" : selector.getRow(state.threadId)?.standard || "M";
    if (state.mode === "thread") state.chosenInsert = state.insertId;
    state.threadQuery = state.insertQuery = state.reverseQuery = "";
    ["threadSearch", "insertSearch", "reverseThreadSearch"].forEach(id => { $(id).value = ""; });
    state.limit = 12;
    render();
  }));
  document.querySelectorAll("[data-side]").forEach(button => button.addEventListener("click", () => {
    const previous = selector.getRow(state.threadId);
    state.side = button.dataset.side;
    state.threadId = selector.getThreads({ side: state.side, standard: state.standard }).find(row => normalizeSearch(row.size) === normalizeSearch(previous?.size))?.id || "";
    state.chosenInsert = "";
    state.limit = 12;
    render();
  }));
  $("standardSelect").addEventListener("change", event => { state.standard = event.target.value; state.threadId = ""; state.chosenInsert = ""; state.limit = 12; render(); });
  $("threadSelect").addEventListener("change", event => { state.threadId = event.target.value; state.chosenInsert = ""; renderResults(); });
  $("insertSelect").addEventListener("change", event => { state.insertId = event.target.value; state.threadId = ""; state.limit = 12; render(); });
  [["threadSearch", "threadQuery"], ["insertSearch", "insertQuery"], ["reverseThreadSearch", "reverseQuery"]].forEach(([id, key]) => $(id).addEventListener("input", event => { state[key] = event.target.value; state.limit = 12; render(); }));
  $("resultList").addEventListener("click", event => {
    const button = event.target.closest("button[data-insert],button[data-row]");
    if (!button) return;
    if (button.dataset.insert) state.chosenInsert = button.dataset.insert;
    else state.threadId = button.dataset.row;
    renderResults();
  });
  $("moreButton").addEventListener("click", () => { state.limit += 12; renderResults(); });
  $("resetButton").addEventListener("click", reset);
  $("copyButton").addEventListener("click", async () => {
    if (!copyText) return;
    const snapshot = copyText;
    try { await navigator.clipboard.writeText(snapshot); if (copyText === snapshot) $("copyFeedback").textContent = "Selection copied."; }
    catch { $("copyFeedback").textContent = "Copy is unavailable. You can select the displayed values."; }
  });
  $("sourceLink").href = sourceURL.href;
  $("sourceRevision").textContent = `${MCC_QUICK_PICK.source.revision.slice(0, 4)}.${MCC_QUICK_PICK.source.revision.slice(4)}`;
  $("sourceCount").textContent = `${MCC_QUICK_PICK.rows.length} thread entries · ${MCC_QUICK_PICK.inserts.length} insert models`;
  reset();

  // 全站共用頁首頁尾；本頁只補齊手機選單狀態，不建立另一份 Header。
  async function loadLayout(part) {
    const response = await fetch(`../../${part}/${part}.html`);
    if (!response.ok) throw new Error(`Unable to load ${part}.`);
    $(`${part}-placeholder`).innerHTML = await response.text();
    if (part !== "header") return;
    const button = $("mobileMenuBtn"), nav = $("topNav");
    if (!button || !nav) return;
    button.setAttribute("aria-controls", "topNav");
    button.setAttribute("aria-expanded", "false");
    button.addEventListener("click", () => {
      const expanded = nav.classList.toggle("active");
      button.setAttribute("aria-expanded", String(expanded));
      button.setAttribute("aria-label", expanded ? "Close Menu" : "Open Menu");
    });
  }
  Promise.all([loadLayout("header"), loadLayout("footer")]).catch(error => console.warn(error.message));
})();
