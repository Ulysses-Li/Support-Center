/* 雕刻尺寸示意：需求、刀片規格與刀柄尺寸分開；不由寬/深反推精確槽形。 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.EngravingDiagrams = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";
  let renderCount = 0;
  const escapeXML = value => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
  const numeric = value => value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value)) ? Number(value) : null;
  const format = value => numeric(value) === null ? "型錄未列" : String(Number(Number(value).toFixed(4)));
  const mm = value => numeric(value) === null ? "型錄未列" : `${format(value)} mm`;
  const positive = value => numeric(value) !== null && Number(value) > 0 ? Number(value) : null;
  const formNames = { radius_angled: "圓角 V 形／小平底", radius: "圓弧底", angled: "角形刀尖" };

  function text(x, y, value, className = "label", extra = "") {
    return `<text x="${x}" y="${y}" class="egdraw-${className}" ${extra}>${escapeXML(value)}</text>`;
  }

  function horizontalDimension(x1, x2, y, label, marker) {
    return `<path d="M${x1} ${y - 13}V${y + 13}M${x2} ${y - 13}V${y + 13}" class="egdraw-extension"/><path d="M${x1} ${y}H${x2}" class="egdraw-dimension" marker-start="url(#${marker})" marker-end="url(#${marker})"/>${text((x1 + x2) / 2, y - 10, label, "dimension-text", 'text-anchor="middle"')}`;
  }

  function verticalDimension(x, y1, y2, label, marker) {
    return `<path d="M${x - 12} ${y1}H${x + 12}M${x - 12} ${y2}H${x + 12}" class="egdraw-extension"/><path d="M${x} ${y1}V${y2}" class="egdraw-dimension" marker-start="url(#${marker})" marker-end="url(#${marker})"/><text x="${x + 23}" y="${(y1 + y2) / 2}" class="egdraw-dimension-text" transform="rotate(-90 ${x + 23} ${(y1 + y2) / 2})" text-anchor="middle">${escapeXML(label)}</text>`;
  }

  // 各系列原始向量分別取自型錄；錨點是原圖座標比例，避免把尺寸線畫到刀片外緣。
  const holderFigures = {
    X060: { file: "x060-holder-outline.svg", page: 71, box: [140.7, 12.8], shank: [0, 1], legacyPlacement: true },
    V045: { file: "v045-holder-outline.svg", page: 75, box: [142.8, 14.4], shank: [.0810416667, .8931944444], tip: .0019257703, tail: .9968277311 },
    V060: { file: "v060-holder-outline.svg", page: 76, box: [142.8, 14.42], shank: [.0812066574, .8922330097], tip: .0019327731, tail: .9968347339 },
    "V060-04": { file: "v060-04-holder-outline.svg", page: 76, box: [69.7, 18.2], shank: [.2348681319, .7716263736], front: [.1214340659, .8615989011], step: .5796499283, tip: .0045624103, tail: .9959311334 },
    W060: { file: "w060-holder-outline.svg", page: 77, box: [102.3, 10.5], shank: [.0294770740, .9697614397] },
    "N9MT-W": { file: "n9mtw-holder-outline.svg", page: 78, box: [153.1, 19.6], shank: [.0582104119, .9208162269] }
  };

  function catalogFigure(insert, holder, familyHint, state) {
    const holderPart = holder?.part_number || holder?.partNumber || holder?.id || "";
    let family = holder?.family || insert?.family || familyHint || "";
    if (family === "N9MTW") family = "N9MT-W";
    if (!insert && !holder && family === "V060" && Number(state.angle) === 45) family = "V045";
    const source = holderFigures[holderPart === "00-99619-V060-04" ? "V060-04" : family];
    if (!source) return null;
    // 小台階柄保留原圖比例、縮短顯示寬度；一般刀柄維持相同可讀範圍。
    const height = source.legacyPlacement ? 51 : Math.min(76, 583 * source.box[1] / source.box[0]);
    const width = source.legacyPlacement ? 583 : height * source.box[0] / source.box[1];
    return { ...source, family, width, height, x: 364.5 - width / 2, y: source.legacyPlacement ? 93 : 126 - height / 2 };
  }

  function render(options = {}) {
    const insert = options.insert || null;
    const holder = options.holder || null;
    const state = options.state || {};
    const limits = insert?.engraving_limits_mm || insert?.limits || {};
    const dimensions = insert?.insert_dimensions_mm || insert?.dimensions || {};
    const angle = insert?.angle_deg ?? insert?.angle;
    const part = insert?.part_base || insert?.partBase || "請先選擇刀片";
    const holderPart = holder?.part_number || holder?.partNumber || holder?.id || "請先選擇刀柄";
    const form = insert?.form || "radius_angled";
    const length = holder?.length_L_mm ?? holder?.length;
    const L1 = holder?.length_L1_mm ?? holder?.L1;
    // p76的V060-04：前頭Ø6、後端Ø4；L1是台階到尾端的後段，不是前端頸長。
    const steppedShank = holderPart === "00-99619-V060-04";
    const figure = catalogFigure(insert, holder, options.family, state);
    const rearStepX = figure?.step !== undefined ? figure.x + figure.width * figure.step : 422;
    const rearTop = figure ? figure.y + figure.height * figure.shank[0] : steppedShank ? 102 : 93;
    const rearBottom = figure ? figure.y + figure.height * figure.shank[1] : steppedShank ? 135 : 144;
    const tipX = figure ? figure.x + figure.width * (figure.tip || 0) : 73;
    const tailX = figure ? figure.x + figure.width * (figure.tail ?? 1) : 656;
    const frontLabelX = figure?.front ? rearStepX - Math.min(32, figure.width * .08) : 280;
    const shank = holder?.shank_diameter;
    const shankLabel = shank && numeric(shank.value) !== null ? `Ø${format(shank.value)} ${shank.unit === "inch" ? "inch" : "mm"}` : holder?.shankLabel || "柄徑待選";
    const width = positive(state.width);
    const depth = positive(state.depth);
    const radius = dimensions.Re;
    const tolerance = insert?.Re_tolerance_mm;
    const radiusLabel = numeric(radius) === null ? "型錄未列" : `${format(radius)}${numeric(tolerance) === null ? "" : ` ± ${format(tolerance)}`} mm`;
    const seq = ++renderCount;
    const titleId = `eg-drawing-title-${seq}`;
    const descId = `eg-drawing-description-${seq}`;
    const marker = `eg-drawing-arrow-${seq}`;
    const title = insert ? `${part} 刀片與刀柄尺寸示意` : `${figure ? `${figure.family} ` : ""}雕刻刀尺寸待選`;
    const description = [
      "非比例外形與槽形示意，不進行精確寬深換算。",
      ...(figure ? [`刀柄組裝外形直接取自型錄p${figure.page}原始向量線圖。`] : []),
      width === null ? "需求線寬未指定。" : `需求線寬 ${format(width)} mm。`,
      depth === null ? "需求深度未指定。" : `需求深度 ${format(depth)} mm。`,
      insert ? `刀片 ${part}，${format(angle)}度，${formNames[form] || "依型錄"}。` : "請選擇刀片查看實際規格。",
      holder ? `刀柄 ${holderPart}，總長 ${mm(length)}，柄徑 ${shankLabel}。` : "刀柄待選。"
    ].join(" ");

    // 底部的三種輪廓僅表達底型；寬度、角度與深度標示值不控制示意圖比例。
    const groove = form === "radius" ?
      "M65 302H165L207 355Q245 414 283 355L325 302H425V421H65Z" :
      form === "angled" ?
      "M65 302H165L218 375H272L325 302H425V421H65Z" :
      "M65 302H165L211 367Q216 375 226 375H264Q274 375 279 367L325 302H425V421H65Z";
    const grooveEdge = form === "radius" ? "M165 302L207 355Q245 414 283 355L325 302" :
      form === "angled" ? "M165 302L218 375H272L325 302" : "M165 302L211 367Q216 375 226 375H264Q274 375 279 367L325 302";
    const grooveBottom = form === "radius" ? 385 : 375;

    return `<svg xmlns="http://www.w3.org/2000/svg" class="engraving-dimension-drawing" viewBox="0 0 760 490" role="img" aria-labelledby="${titleId} ${descId}">
      <title id="${titleId}">${escapeXML(title)}</title><desc id="${descId}">${escapeXML(description)}</desc>
      <defs><marker id="${marker}" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M10 5L0 1V9Z" fill="#0067ad"/></marker></defs>
      <style>.egdraw-label{font:16px Arial,"Microsoft JhengHei",sans-serif;fill:#0c2237}.egdraw-small{font:14px Arial,"Microsoft JhengHei",sans-serif;fill:#5c7488}.egdraw-heading{font:700 17px Arial,"Microsoft JhengHei",sans-serif;fill:#0c2237}.egdraw-value{font:700 16px Arial,"Microsoft JhengHei",sans-serif;fill:#0c2237}.egdraw-dimension-text{font:16px Arial,"Microsoft JhengHei",sans-serif;fill:#0067ad}.egdraw-dimension{fill:none;stroke:#0067ad;stroke-width:1.4}.egdraw-extension{fill:none;stroke:#7a9bb2;stroke-width:1}.egdraw-tool{fill:#e7f0f7;stroke:#0c2237;stroke-width:1.7}.egdraw-axis{stroke:#7897ad;stroke-width:1;stroke-dasharray:9 5 2 5}</style>
      ${text(26, 26, figure ? "刀柄尺寸 · 型錄線圖" : "刀柄尺寸 · 外形非比例示意", "heading")}
      ${text(26, 51, holderPart, "small")}
      <!-- 各系列直接使用各自原圖；V060小台階柄有獨立圖檔及尺寸錨點。 -->
      ${figure ? `<image href="../Engraving/assets/${figure.file}" x="${figure.x}" y="${figure.y}" width="${figure.width}" height="${figure.height}" preserveAspectRatio="none"/>` : `
      <path d="${steppedShank ? `M73 106H136L164 93H${rearStepX}V102H650Q656 102 656 109V128Q656 135 650 135H${rearStepX}V144H164L136 131H73Z` : "M73 106H136L164 93H650Q656 93 656 100V137Q656 144 650 144H164L136 131H73Z"}" class="egdraw-tool"/>
      <path d="M165 94V144M639 ${rearTop + 1}V${rearBottom}" fill="none" stroke="#8aa5ba" stroke-width="1.3"/>
      <path d="M55 119H675" class="egdraw-axis"/>
      <path d="M77 106L97 109L94 130L74 127Z" fill="#f9b16d" stroke="#0c2237" stroke-width="1.4"/><circle cx="85" cy="118" r="4" fill="#0c2237"/>
      `}
      ${steppedShank ? `${text(frontLabelX, 79, "前頭 Ø6 mm", "dimension-text", 'text-anchor="middle"')}<path d="M${frontLabelX} 83V${figure?.front ? figure.y + figure.height * figure.front[0] : 93}" class="egdraw-extension"/>` : ""}
      ${holder ? horizontalDimension(tipX, tailX, steppedShank ? 207 : 192, `總長 ${mm(length)}`, marker) : text(365, 196, "選定刀柄後顯示實際總長", "small", 'text-anchor="middle"')}
      ${holder ? verticalDimension(tailX + 35, rearTop, rearBottom, shankLabel, marker) : ""}
      ${steppedShank && numeric(L1) !== null ? horizontalDimension(rearStepX, tailX, 178, `後段 ${mm(L1)}`, marker) : ""}
      <path d="M26 224H733" stroke="#d6e5ef" stroke-width="1"/>
      ${text(26, 253, "工件刻槽 · 形狀示意", "heading")}
      <path d="${groove}" fill="#e7f0f7" stroke="#6e8ba1" stroke-width="1.4"/>
      <path d="${grooveEdge}" fill="none" stroke="#f05a1a" stroke-width="2.8"/>
      <path d="M245 286V433" class="egdraw-axis"/>
      ${horizontalDimension(165, 325, 280, width === null ? "線寬未指定" : `需求 W ${format(width)} mm`, marker)}
      ${verticalDimension(449, 302, grooveBottom, depth === null ? "深度未指定" : `需求 t ${format(depth)} mm`, marker)}
      ${text(509, 254, insert ? `${format(angle)}° · ${formNames[form] || "依型錄底型"}` : "刀片規格待選", "heading")}
      ${text(509, 287, part, "small")}
      ${text(509, 321, "最小刻線寬", "small")}${text(733, 321, mm(limits.Wmin), "value", 'text-anchor="end"')}
      ${text(509, 354, "最大刻線寬", "small")}${text(733, 354, mm(limits.Wmax), "value", 'text-anchor="end"')}
      ${text(509, 387, "最大雕刻深度", "small")}${text(733, 387, mm(limits.Tmax), "value", 'text-anchor="end"')}
      ${text(509, 420, "刀尖圓角 Re", "small")}${text(733, 420, radiusLabel, "value", 'text-anchor="end"')}
      ${text(26, 465, "需求尺寸與型錄規格分開顯示；示意圖不代表精確槽形或實際突出長度。", "small")}
    </svg>`;
  }

  return Object.freeze({ render });
});
