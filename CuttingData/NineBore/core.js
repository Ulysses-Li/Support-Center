/* NineBore 選型工具：整合型錄資料與計算，不建立型錄未列的料號或組裝尺寸。 */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.NINEBORE_CORE = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const ROUTES = ['purchase_holder', 'existing_ninebore', 'existing_general', 'unknown'];
  const GENERAL_TYPES = ['side_lock', 'hydraulic', 'collet'];
  // 僅允許這三組同材料跨條件試切參考；不得擴張成任意材料／條件的備援搜尋。
  const REFERENCE_PAIRS = Object.freeze({
    'carbon-regular': { id: 'carbon-interrupted', material: 'Carbon Steel' },
    'alloy-regular': { id: 'alloy-interrupted', material: 'Alloy Steel' },
    'stainless-regular': { id: 'stainless-interrupted', material: 'Stainless Steel' }
  });
  const REFERENCE_WARNING = 'Reference values use the same material with NC30 under interrupted cutting; they are not catalog recommendations for the selected regular-cutting condition.';
  const EPSILON = 1e-9;
  const INSERT_COMPATIBILITY_SOURCE = 'https://nine9.jic-tools.com.tw/Inserts-For-99101-121-111-146-151.html';
  // 舊版CCGH0602U／XP9001與現行原廠頁牌號不同，本次僅採已逐項一致的兩個實體品項。
  const VERIFIED_INSERT_GRADES = Object.freeze({
    CCFT060204: Object.freeze(['NC2033', 'NC9036']),
    CCFW060204: Object.freeze(['NC2032'])
  });
  const missing = value => value === undefined || value === null || (typeof value === 'string' && value.trim() === '');
  const inRange = (value, min, max) => value >= min - EPSILON && value <= max + EPSILON;
  const rowsAsObjects = (columns, rows) => (rows || []).map(row => Object.fromEntries(columns.map((key, index) => [key, row[index]])));
  const unique = values => [...new Set(values)];
  const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

  function numberField(value, label, errors, required) {
    if (missing(value)) {
      if (required) errors.push(`Enter ${label}.`);
      return null;
    }
    // Number() 會將布林值與陣列變成有效數字；表單之外的呼叫亦須拒絕這些值。
    const numeric = (typeof value === 'number' || typeof value === 'string') ? Number(value) : NaN;
    if (!Number.isFinite(numeric) || numeric <= 0) {
      errors.push(`${label} must be a finite number greater than 0.`);
      return null;
    }
    return numeric;
  }

  function normalize(inventory, clamping, cutting, confirmedSpecs = null) {
    // 99121 圖面括號尺寸未對應到個別料號；只提供來源中的待確認選項，不寫成實際柄徑。
    const shankIssue = (inventory.critical_source_issues || []).find(issue => issue.id === '99121_diagram_shank_mapping');
    const diagramShankOptions = unique((shankIssue?.catalog_diagram_diameter_labels || []).filter(value => Number.isFinite(value) && value > 0));
    // 使用者另行確認的99121可選柄徑獨立保存；不改寫型錄原值、不建立變體料號或長度。
    const confirmed99121 = confirmedSpecs?.series?.['99121'];
    const confirmedShankOptions = confirmed99121?.status === 'confirmed' && confirmed99121.source?.kind === 'user_confirmation' &&
      Array.isArray(confirmed99121.shank_diameters_mm) ? unique(confirmed99121.shank_diameters_mm.filter(value => Number.isFinite(value) && value > 0)) : [];
    const hasConfirmedShankOptions = confirmedShankOptions.length > 0;
    const bars = (inventory.boring_bar_groups || []).flatMap(group => rowsAsObjects(group.columns, group.rows).map(row => {
      const raw = { ...group.defaults, ...row };
      const insertInterface = inventory.insert_interfaces[row.insert_interface_ref];
      return {
        id: row.part_no_catalog,
        partsNo: row.part_no_catalog,
        series: group.series,
        groupId: group.id,
        name: group.name_catalog,
        type: row.type_catalog,
        nominalD: row.nominal_D_mm_derived,
        minD: row.D_min_mm_catalog,
        maxD: row.D_max_mm_catalog,
        rangeText: row.D_range_text_catalog,
        l1: row.L1_mm_catalog,
        l: row.L_mm_catalog,
        shankD: raw.d_mm_catalog ?? raw.shank_diameter_mm_catalog ?? null,
        shankOptions: group.series === '99121' ? [...(hasConfirmedShankOptions ? confirmedShankOptions : diagramShankOptions)] : [],
        shankOptionsConfirmed: group.series === '99121' && hasConfirmedShankOptions,
        shankOptionsSource: group.series === '99121' && hasConfirmedShankOptions ? { ...confirmed99121.source } : null,
        shoulderD: raw.d1_mm_catalog ?? null,
        sourcePage: inventory.source_refs[group.source_ref].printed_page,
        source: inventory.source_refs[group.source_ref],
        insertInterface: { ...insertInterface, ref: row.insert_interface_ref, family: insertInterface.insert_family_catalog },
        depthKind: group.defaults.boring_depth_dimension_catalog === 'L1' ? 'catalog_boring_depth' : 'front_neck',
        adjustment: [raw.adjustment_min_mm_catalog, raw.adjustment_max_mm_catalog],
        division: raw.division_mm_catalog,
        raw
      };
    }));

    const holders = (clamping.head_shanks || []).map(holder => ({
      ...holder,
      id: holder.partsNo,
      machineInterface: holder.machine_interface,
      sourcePage: holder.source.printed_page,
      requiresExternal32: holder.machine_interface === 'SB32'
    }));
    const adapters = (clamping.adapters || []).map(adapter => ({
      ...adapter,
      id: adapter.partsNo,
      shankD: adapter.accepts_boring_bar_shank_diameter_mm,
      sourcePage: adapter.source.printed_page
    }));
    const physical = inventory.physical_inserts;
    const insertGeometries = rowsAsObjects(physical.columns, physical.rows).map(row => ({
      parts: row.part_no_catalog,
      partNo: row.part_no_catalog,
      re: row.Re_mm_catalog,
      screw: row.screw_catalog,
      sourcePage: inventory.source_refs[physical.source_ref].printed_page,
      raw: row
    }));
    const inserts = rowsAsObjects(physical.grade_variant_columns, physical.grade_variants).map(row => ({
      ...insertGeometries.find(insert => insert.parts === row.part_no_ref),
      // 這只是本站穩定識別碼；parts 與 grade 始終分欄，絕非合成訂購料號。
      id: `${row.part_no_ref}|${row.grade_designation_catalog}`,
      grade: row.grade_designation_catalog,
      coating: row.coating_catalog
    }));
    // 原廠系列刀片頁補足0602家族的實體配對；以獨立白名單保存，不將CCGH060204視為任何刀片的別名。
    // 規則還須逐一吻合實體品項、牌號、Ic與厚度；沒有可核對來源時維持原先的家族候選狀態。
    const compatibility = confirmedSpecs?.insert_compatibility;
    const verifiedInsertRules = compatibility?.status === 'verified' && compatibility.source?.kind === 'manufacturer_website' &&
      compatibility.source.url === INSERT_COMPATIBILITY_SOURCE && Array.isArray(compatibility.rules) ? compatibility.rules.filter(rule =>
        rule && Array.isArray(rule.series) && rule.series.length && rule.series.every(series => ['99101', '99121'].includes(series)) &&
        Array.isArray(rule.interface_refs) && rule.interface_refs.length && rule.interface_refs.every(ref => ['cc0602_ns25045', 'cc0602_ns25060'].includes(ref)) &&
        Object.hasOwn(VERIFIED_INSERT_GRADES, rule.part_no_catalog) && Array.isArray(rule.grade_designations) && rule.grade_designations.length &&
        rule.grade_designations.every(grade => VERIFIED_INSERT_GRADES[rule.part_no_catalog]?.includes(grade)) && Number.isFinite(rule.Ic_mm) && rule.Ic_mm > 0 &&
        Number.isFinite(rule.S_mm) && rule.S_mm > 0 && inserts.some(insert => insert.parts === rule.part_no_catalog &&
          rule.grade_designations.includes(insert.grade) && insert.raw.Ic_mm_catalog === rule.Ic_mm && insert.raw.S_mm_catalog === rule.S_mm)
      ).map(rule => ({ ...rule, series: [...rule.series], interface_refs: [...rule.interface_refs], grade_designations: [...rule.grade_designations], source: { ...compatibility.source } })) : [];
    const cuttingRows = (cutting.rows || []).map(row => ({ ...row }));
    const materials = unique(cuttingRows.map(row => row.workpiece_material)).map(label => ({
      id: label,
      label,
      iso: cuttingRows.find(row => row.workpiece_material === label).iso_group
    }));
    // 適材由p162牌號說明與材料列整理成明確矩陣，與「目前切削條件所列牌號」分開判斷。
    const applicability = confirmedSpecs?.grade_applicability;
    const gradeMaterials = applicability?.status === 'verified' && applicability.source?.kind === 'catalog' && applicability.source.printed_page === 162 &&
      applicability.by_grade && typeof applicability.by_grade === 'object' && !Array.isArray(applicability.by_grade) ? Object.fromEntries(
        Object.entries(applicability.by_grade).filter(([grade, entries]) => inserts.some(insert => insert.grade === grade) &&
          Array.isArray(entries) && entries.length && entries.every(material => materials.some(item => item.id === material)))
          .map(([grade, entries]) => [grade, unique(entries)])
      ) : {};
    const systemInsertNames = unique((inventory.critical_source_issues || []).flatMap(issue => issue.catalog_system_insert_names || []));
    return {
      bars, holders, adapters, inserts, insertGeometries, materials, cuttingRows, systemInsertNames, verifiedInsertRules, gradeMaterials,
      conditions: unique(cuttingRows.map(row => row.cutting_condition_or_surface_finish)),
      series: unique(bars.map(bar => bar.series)),
      grades: cutting.grade_descriptions || [],
      kits: clamping.kits || [],
      sourceInventory: inventory,
      sourceClamping: clamping,
      sourceCutting: cutting
    };
  }

  function cuttingRowFor(model, material, condition) {
    return model.cuttingRows.find(row => row.workpiece_material === material && row.cutting_condition_or_surface_finish === condition) || null;
  }

  function gradeSuitabilityFor(model, grade, material) {
    if (!material || !model.materials.some(item => item.id === material) || !Object.hasOwn(model.gradeMaterials || {}, grade)) return null;
    return model.gradeMaterials[grade].includes(material);
  }

  function insertOptionsFor(model, bar, cuttingRow, material = cuttingRow?.workpiece_material) {
    const family = bar.insertInterface.family;
    // 家族通配只建立候選；自動推薦另檢查小刀片的原型錄證據，或0602已核對的原廠系列白名單。
    const safePattern = family.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\\.\\\.\\\./g, '.*');
    const pattern = new RegExp(`^${safePattern}$`);
    const options = model.inserts.filter(insert => pattern.test(insert.parts)).map(insert => {
      const verifiedRule = model.verifiedInsertRules?.find(rule => rule.series.includes(bar.series) &&
        rule.interface_refs.includes(bar.insertInterface.ref) && rule.part_no_catalog === insert.parts &&
        rule.grade_designations.includes(insert.grade) && insert.raw.Ic_mm_catalog === rule.Ic_mm && insert.raw.S_mm_catalog === rule.S_mm);
      const exactGeometry = !!verifiedRule || family === insert.parts || (!family.endsWith('...') && model.systemInsertNames.includes(insert.parts));
      const materialSuitable = gradeSuitabilityFor(model, insert.grade, material);
      const gradeMatch = materialSuitable !== false && !!cuttingRow && cuttingRow.grade_candidates.includes(insert.grade);
      return {
        ...insert,
        exactGeometry,
        materialSuitable,
        gradeMatch,
        recommended: exactGeometry && gradeMatch,
        matchEvidence: verifiedRule ? 'manufacturer_series_and_p162_part' : exactGeometry ? (family === insert.parts ? 'bar_exact_part' : 'p151_system_and_p162_part') : 'family_only',
        matchSource: verifiedRule?.source || null,
        reviewNotes: exactGeometry ? [] : ['This bar lists only the CC...0602... family. Confirm the official mapping between CCGH060204 and the physical inserts on p162 with the manufacturer.']
      };
    });
    // 原列沒有「幾何已確認＋牌號符合」的實體刀片時，才顯示獨立的參考資格。
    // recommended／gradeMatch 仍只代表原選定列，不能藉此升級成型錄已確認配對。
    const pair = cuttingRow && REFERENCE_PAIRS[cuttingRow.id];
    const referenceRow = pair && cuttingRow.workpiece_material === pair.material &&
      cuttingRow.cutting_condition_or_surface_finish === 'Regular cutting' && !cuttingRow.hardness_condition &&
      !options.some(option => option.recommended) ? model.cuttingRows.find(row =>
        row.id === pair.id && row.workpiece_material === cuttingRow.workpiece_material &&
        row.cutting_condition_or_surface_finish === 'Interrupted cutting' &&
        !row.hardness_condition && row.grade_candidates.includes('NC30')) || null : null;
    return options.map(option => {
      const referenceRecommended = !!referenceRow && option.exactGeometry && option.materialSuitable !== false && option.grade === 'NC30';
      return { ...option, referenceRecommended, referenceRow: referenceRecommended ? referenceRow : null };
    });
  }

  // 選單只提供所選材料可用的牌號；完整物理候選仍留在candidate供錯誤網址／手動呼叫核對。
  function applicableInserts(model, candidate, material) {
    if (!candidate?.bar) return [];
    const row = cuttingRowFor(model, material, candidate.criteria?.condition || 'Regular cutting');
    return insertOptionsFor(model, candidate.bar, row, material).filter(insert => insert.materialSuitable !== false);
  }

  function makeCriteria(model, input, errors) {
    const diameter = numberField(input.diameter, 'Target diameter D (mm)', errors, false);
    const depth = numberField(input.depth, 'Boring depth (mm)', errors, false);
    const gripDiameter = numberField(input.gripDiameter, 'Gripping diameter (mm)', errors, false);
    const suppliedClamping = ROUTES.includes(input.clamping) ? input.clamping : null;
    const missingFields = [];
    if (diameter === null) missingFields.push('diameter');
    if (depth === null) missingFields.push('depth');
    if (missing(input.material)) missingFields.push('material');
    if (!suppliedClamping || suppliedClamping === 'unknown') missingFields.push('clamping');
    // 快換刀柄是第四項實際選擇；僅指定內部路徑不代表客戶已選好型錄刀柄。
    if (['purchase_holder', 'existing_ninebore'].includes(suppliedClamping) && !model.holders.some(holder => holder.id === input.holderId)) missingFields.push('holderId');
    if (suppliedClamping === 'existing_general' && gripDiameter === null) missingFields.push('gripDiameter');
    return {
      diameter, depth, gripDiameter,
      material: missing(input.material) ? null : String(input.material),
      clamping: suppliedClamping || 'unknown',
      holderId: missing(input.holderId) ? null : String(input.holderId),
      generalType: input.generalType || null,
      condition: input.condition || 'Regular cutting',
      complete: errors.length === 0 && missingFields.length === 0,
      questionsAnswered: missingFields.length === 0,
      missingFields
    };
  }

  function candidateFor(model, bar, criteria) {
    const reviewNotes = [];
    const holder = model.holders.find(item => item.id === criteria.holderId) || null;
    const adapter = bar.series === '99151' ? model.adapters.find(item => item.shankD === bar.shankD) || null : null;
    let clampStatus = 'review';
    let shankStatus = bar.shankD === null ? 'review' : 'confirmed';
    let selectedShankD = null;
    let depthStatus = 'review';
    if (criteria.depth === null) reviewNotes.push('Boring depth has not been provided, so the depth check is incomplete.');
    else if (bar.depthKind === 'front_neck') reviewNotes.push('L1 on p152/153 is the front-neck geometry. Confirm actual projection, shoulder clearance and workpiece interference.');
    else depthStatus = 'confirmed';

    if (criteria.clamping === 'existing_general') {
      if (!GENERAL_TYPES.includes(criteria.generalType)) reviewNotes.push('Confirm that the general holder is side-lock, hydraulic or spring-collet.');
      if (criteria.gripDiameter === null) {
        shankStatus = 'unselected';
        reviewNotes.push('Select the gripping diameter of the general holder to check the bar shank.');
      } else if (bar.shankD !== null && Math.abs(bar.shankD - criteria.gripDiameter) <= EPSILON) {
        selectedShankD = criteria.gripDiameter;
      } else if (bar.shankOptionsConfirmed && bar.shankOptions.some(value => Math.abs(value - criteria.gripDiameter) <= EPSILON)) {
        // 確認的是本次選用的柄徑；夾持長度、實際伸出與整組相容狀態仍分開檢查。
        shankStatus = 'confirmed';
        selectedShankD = criteria.gripDiameter;
      } else if (bar.shankD === null) {
        shankStatus = 'review';
        reviewNotes.push(`The requested Ø${criteria.gripDiameter} mm shank is shown in the 99121 drawing (Ø20（Ø13）), but the per-part mapping is unconfirmed. Confirm the actual bar shank before matching this holder.`);
      }
      reviewNotes.push('The catalog does not list a minimum effective clamping length for general holders. Check actual insertion and interference.');
    } else if (criteria.clamping === 'purchase_holder' || criteria.clamping === 'existing_ninebore') {
      if (!holder) reviewNotes.push('No catalog NineBore holder part number is selected. Confirm the machine-side connection.');
      else if (holder.requiresExternal32) reviewNotes.push('SB32 is a Ø32×60 Weldon straight shank. Confirm an external machine holder that grips Ø32; SB32 is not a direct spindle taper.');
      else clampStatus = 'confirmed';
      if (bar.series === '99151') {
        if (!adapter) {
          clampStatus = 'review';
          reviewNotes.push('No confirmed 99151 adapter is listed for this bar shank diameter.');
        } else if (holder && !adapter.compatible_head_shank_partsNo.includes(holder.id)) {
          clampStatus = 'review';
          reviewNotes.push('The selected holder is not listed as compatible with this adapter.');
        }
      }
    } else reviewNotes.push('Clamping remains unconfirmed. Candidates matching diameter and depth are retained for review.');

    if (bar.series === '99151') reviewNotes.push('Although within the listed 99151 L1, actual insertion into the adapter, assembly projection and shoulder clearance still require confirmation.');
    const cuttingRow = cuttingRowFor(model, criteria.material, criteria.condition);
    const insertOptions = insertOptionsFor(model, bar, cuttingRow, criteria.material);
    const referenceRow = insertOptions.find(insert => insert.referenceRecommended)?.referenceRow || null;
    let cuttingStatus;
    if (!criteria.material) {
      cuttingStatus = 'unselected';
      reviewNotes.push('Select the workpiece material to check insert grade and cutting data.');
    } else if (!cuttingRow) {
      cuttingStatus = 'no_data';
      reviewNotes.push('No confirmed catalog cutting row exists for this material and condition. Geometric candidates remain available with manual cutting inputs.');
    } else if (insertOptions.some(insert => insert.exactGeometry && insert.gradeMatch)) cuttingStatus = 'confirmed';
    else if (insertOptions.some(insert => insert.gradeMatch)) {
      cuttingStatus = 'geometry_review';
      reviewNotes.push('The cutting-row grade exists, but the mapping from CC...0602... to a physical insert part remains unconfirmed. Compatibility is not assumed.');
    } else {
      cuttingStatus = 'grade_gap';
      reviewNotes.push(`This row specifies ${cuttingRow.grade_candidates.join(' / ')}, but no matching physical grade is listed for this insert geometry. A missing item is not invented; the selected cutting row remains unconfirmed.`);
      if (referenceRow) reviewNotes.push('A same-material NC30 interrupted-cutting row is available only as a separately labeled trial reference.');
    }
    if (cuttingRow && cuttingRow.hardness_condition) reviewNotes.push('The H-material condition applies only to HRC < 50. Confirm the actual workpiece hardness.');
    const status = criteria.complete && depthStatus === 'confirmed' && clampStatus === 'confirmed' && cuttingStatus === 'confirmed' && !reviewNotes.length ? 'confirmed' : 'review';
    return {
      id: bar.id,
      bar,
      holder: criteria.clamping === 'unknown' || criteria.clamping === 'existing_general' ? null : holder,
      adapter,
      depthStatus, clampStatus, shankStatus, selectedShankD, reviewNotes: unique(reviewNotes), insertOptions, cuttingRow, referenceRow, cuttingStatus, status,
      criteria
    };
  }

  function diameterDiagnosis(bars, diameter) {
    if (!bars.length) return { code: 'clamping_unavailable', message: 'No confirmed bar route matches the clamping inputs. Check the gripping diameter and holder details.' };
    const min = Math.min(...bars.map(bar => bar.minD));
    const max = Math.max(...bars.map(bar => bar.maxD));
    const range = { min, max };
    if (diameter < min) return { code: 'below_minimum', message: `The target diameter is below the smallest listed diameter of ${min} mm for this clamping route.`, range };
    if (diameter > max) return { code: 'above_maximum', message: `The target diameter exceeds the largest listed diameter of ${max} mm for this clamping route.`, range };
    const below = bars.filter(bar => bar.maxD < diameter);
    const above = bars.filter(bar => bar.minD > diameter);
    const gap = below.length && above.length ? [Math.max(...below.map(bar => bar.maxD)), Math.min(...above.map(bar => bar.minD))] : null;
    return { code: 'diameter_gap', message: `The target diameter falls in a gap between actual adjustable ranges${gap ? ` (between ${gap[0]} and ${gap[1]} mm)` : ''}. No standard item is listed here; confirm a special size.`, range, gap };
  }

  function find(model, input = {}) {
    const errors = [];
    const criteria = makeCriteria(model, input, errors);
    if (errors.length) return { candidates: [], diagnosis: { code: 'invalid_input', message: 'Correct the input values to continue.' }, errors, criteria };
    const routeBars = model.bars.filter(bar => {
      if (criteria.clamping === 'existing_general') {
        if (!['99101', '99121'].includes(bar.series)) return false;
      } else if (criteria.clamping !== 'unknown' && !['99146', '99151'].includes(bar.series)) return false;
      return true;
    });
    // 未知實際柄徑只接受圖面明列的候選值；例如 Ø50 不能保留99121成為疑似相容刀桿。
    const eligible = criteria.clamping !== 'existing_general' || criteria.gripDiameter === null ? routeBars : routeBars.filter(bar =>
      bar.shankD !== null ? Math.abs(bar.shankD - criteria.gripDiameter) <= EPSILON :
        (bar.shankOptions || []).some(value => Math.abs(value - criteria.gripDiameter) <= EPSILON));
    const diameterMatches = criteria.diameter === null ? eligible : eligible.filter(bar => inRange(criteria.diameter, bar.minD, bar.maxD));
    const depthMatches = criteria.depth === null ? diameterMatches : diameterMatches.filter(bar => criteria.depth <= bar.l1 + EPSILON);
    // 使用者轉述原廠建議（2026-11-12）：99121每格0.01mm，較99101的0.03mm易微調，兩者皆符合時優先。
    // 排序只作用於已符合的候選，不放寬孔徑、深度、柄徑，也不升級夾持或刀片的確認狀態。
    const preferPrecision = depthMatches.some(bar => bar.series === '99101') && depthMatches.some(bar => bar.series === '99121');
    const candidates = depthMatches.map(bar => ({
      ...candidateFor(model, bar, criteria),
      precisionPreferred: preferPrecision && bar.series === '99121'
    })).sort((a, b) => Number(b.precisionPreferred) - Number(a.precisionPreferred) ||
      a.bar.l1 - b.bar.l1 || a.bar.series.localeCompare(b.bar.series) || a.bar.nominalD - b.bar.nominalD || a.bar.id.localeCompare(b.bar.id));
    let diagnosis;
    const geometryBeforeShank = criteria.clamping === 'existing_general' && criteria.gripDiameter !== null ? routeBars.filter(bar =>
      (criteria.diameter === null || inRange(criteria.diameter, bar.minD, bar.maxD)) &&
      (criteria.depth === null || criteria.depth <= bar.l1 + EPSILON)) : [];
    if (!candidates.length && geometryBeforeShank.length) {
      diagnosis = {
        code: 'shank_unavailable',
        message: `General-holder bars match the entered diameter and depth, but no listed or drawing-supported shank matches the requested Ø${criteria.gripDiameter} mm. Check the holder gripping diameter or confirm a suitable bar shank with the manufacturer.`,
        requestedShankDiameter: criteria.gripDiameter,
        availableShankDiameters: unique(geometryBeforeShank.flatMap(bar => bar.shankD === null ? bar.shankOptions || [] : [bar.shankD])).sort((a, b) => a - b)
      };
    } else if (!diameterMatches.length && criteria.diameter !== null) diagnosis = diameterDiagnosis(eligible, criteria.diameter);
    else if (!depthMatches.length && diameterMatches.length) {
      const maximumL1 = Math.max(...diameterMatches.map(bar => bar.l1));
      diagnosis = { code: 'depth_exceeded', message: `Listed bars match the diameter, but the required depth exceeds their largest L1 of ${maximumL1} mm. Holder length and depth-ratio summaries do not extend that limit.`, maximumL1 };
    } else if (!criteria.complete) diagnosis = { code: 'browse', message: 'Browse candidates while the four requirements remain incomplete.' };
    else diagnosis = { code: 'matches', message: `${candidates.length} bar(s) match the diameter and listed L1. Check each combination for clamping and insert pairing status.` };
    return { candidates, diagnosis, errors, criteria };
  }

  function calculate(model, candidate, input = {}) {
    const errors = [];
    const warnings = [];
    const diameter = numberField(input.diameter, 'Target diameter D (mm)', errors, true);
    const depth = numberField(input.depth, 'Boring depth (mm)', errors, true);
    const machineMaxRpm = numberField(input.machineMaxRpm, 'Machine / assembly maximum speed (rpm)', errors, false);
    const prebore = numberField(input.prebore, 'Prebore diameter (mm)', errors, false);
    const material = input.material || candidate?.criteria?.material || null;
    const condition = input.condition || candidate?.criteria?.condition || 'Regular cutting';
    const cuttingRow = cuttingRowFor(model, material, condition);
    const bar = candidate?.bar || null;
    if (!bar) errors.push('Select a bar combination first.');
    else {
      if (diameter !== null && !inRange(diameter, bar.minD, bar.maxD)) errors.push(`The target diameter is outside this bar's listed range of ${bar.minD}–${bar.maxD} mm.`);
      if (depth !== null && depth > bar.l1 + EPSILON) errors.push(`Boring depth exceeds this bar's listed L1 of ${bar.l1} mm.`);
    }
    const options = bar ? insertOptionsFor(model, bar, cuttingRow, material) : [];
    // 舊 API 預設不採用跨條件資料；呼叫端必須明確開啟，且原列的直接配對永遠優先。
    const allowReference = input.allowReference === true;
    let insert = null;
    if (!missing(input.insertId)) {
      insert = options.find(option => option.id === input.insertId) || null;
      if (!insert) errors.push('The selected insert / grade is not a listed physical candidate for this bar.');
    } else if (input.autoSelectInsert === false) {
      errors.push('Choose an applicable insert for the selected material.');
    } else {
      const matched = options.filter(option => option.exactGeometry && option.gradeMatch);
      if (matched.length === 1) insert = matched[0];
      else {
        const references = allowReference && matched.length === 0 ? options.filter(option => option.referenceRecommended) : [];
        if (references.length === 1) insert = references[0];
        else errors.push('Select a physical insert and grade. No insert is chosen automatically without a unique confirmed match.');
      }
    }
    const referenceMode = allowReference && !!insert?.referenceRecommended;
    const referenceRow = referenceMode ? insert.referenceRow : null;
    const usedCuttingRow = referenceMode ? referenceRow : cuttingRow;
    let recommendation = null;
    if (insert && insert.exactGeometry && ((insert.gradeMatch && cuttingRow) || referenceMode)) {
      const vcSequence = usedCuttingRow.cutting_speed.catalog_sequence;
      const feedSequence = usedCuttingRow.feed_per_revolution.catalog_sequence;
      recommendation = {
        vc: vcSequence[Math.floor(vcSequence.length / 2)],
        feed: feedSequence[Math.floor(feedSequence.length / 2)],
        source: referenceMode ? 'catalog_reference' : 'site_median',
        basis: referenceMode ? 'same_material_other_condition' : 'selected_condition',
        sourceRow: usedCuttingRow,
        label: referenceMode ? 'Same-material NC30 interrupted-cutting trial reference (selected regular cutting remains unconfirmed)' : 'Site median starting point (adjustable; not a catalog optimum)',
        vcSequence: [...vcSequence],
        feedSequence: [...feedSequence]
      };
    }
    if (!cuttingRow) warnings.push('No confirmed catalog cutting row exists for this material and condition. Manual values are not catalog recommendations.');
    if (insert?.materialSuitable === false) errors.push('The selected insert grade is not listed for the chosen material.');
    if (insert && !insert.exactGeometry) warnings.push('This insert matches only a family wildcard. Confirm the physical geometry with the manufacturer; cutting recommendations are not applied automatically.');
    if (referenceMode) warnings.push(REFERENCE_WARNING);
    else if (insert && cuttingRow && !insert.gradeMatch) warnings.push('The selected physical insert grade is absent from this row. Conditions from another material or operation are not substituted.');
    if (cuttingRow?.hardness_condition) warnings.push('This H-material cutting row applies only to HRC < 50. Confirm actual hardness.');

    const manualVc = !missing(input.vc);
    const manualFeed = !missing(input.feed);
    // 使用者開始手動編輯後，空白代表尚未填妥；保留建議供按鈕使用，但不可在欄位背後偷偷補值。
    const useRecommendations = input.useRecommendations !== false;
    const vc = manualVc ? numberField(input.vc, 'Cutting speed Vc (m/min)', errors, true) : useRecommendations ? recommendation?.vc ?? null : null;
    const feed = manualFeed ? numberField(input.feed, 'Feed per revolution f (mm/rev)', errors, true) : useRecommendations ? recommendation?.feed ?? null : null;
    if (vc === null && !manualVc) errors.push(useRecommendations ? 'No confirmed automatic cutting speed is available. Enter manual Vc.' : 'Enter manual cutting speed Vc, or use the Use median button.');
    if (feed === null && !manualFeed) errors.push(useRecommendations ? 'No confirmed automatic feed per revolution is available. Enter manual f.' : 'Enter manual feed per revolution f, or use the Use median button.');
    const source = !useRecommendations || (manualVc && manualFeed) ? 'manual' : recommendation && referenceMode ?
      (manualVc || manualFeed ? 'catalog_reference_manual' : 'catalog_reference') : manualVc || manualFeed ? 'mixed' : recommendation ? 'site_median' : null;
    if (source === 'manual' || source === 'mixed' || source === 'catalog_reference_manual') warnings.push('These conditions include user-entered values and are labeled as manual inputs.');

    // 型錄 f 為每轉進給：Vf = S × f，不乘刃數。深度只顯示需求，不推導程式 Z。
    const incompleteManual = !useRecommendations && (!manualVc || !manualFeed);
    const rpm = !incompleteManual && diameter !== null && vc !== null ? 1000 * vc / (Math.PI * diameter) : null;
    const feedRate = rpm !== null && feed !== null ? rpm * feed : null;
    if (rpm !== null && machineMaxRpm !== null && rpm > machineMaxRpm + EPSILON) errors.push(`Calculated speed ${Math.round(rpm)} rpm exceeds the entered limit of ${machineMaxRpm} rpm. Adjust Vc; speed has not been clipped automatically.`);
    if (rpm !== null && !Number.isFinite(rpm)) errors.push('The speed calculation exceeds the finite numeric range. Adjust the inputs.');
    if (feedRate !== null && !Number.isFinite(feedRate)) errors.push('The feed calculation exceeds the finite numeric range. Adjust the inputs.');
    let ae = null;
    if (prebore !== null && diameter !== null) {
      if (prebore >= diameter) errors.push('Prebore diameter must be smaller than the target diameter to calculate radial stock Ae.');
      else ae = (diameter - prebore) / 2;
    }
    let aeLimit = null;
    // Ae 跟隨實際採用的資料列，避免 S／F 參考斷續切削、餘量卻仍查一般切削。
    if (insert && Number.isFinite(insert.re) && usedCuttingRow) {
      const radiusEntry = usedCuttingRow.radial_stock_ae.by_insert_radius?.find(entry => Math.abs(entry.re_mm - insert.re) <= EPSILON);
      if (radiusEntry) aeLimit = radiusEntry.ae_mm;
      else if (Number.isFinite(usedCuttingRow.radial_stock_ae.value)) aeLimit = usedCuttingRow.radial_stock_ae.value;
    }
    if (ae !== null && aeLimit !== null && ae > aeLimit + EPSILON) warnings.push(`Radial stock Ae ${Number(ae.toFixed(4))} mm exceeds the listed ${aeLimit} mm for this row and insert radius. Review the cutting conditions.`);
    if (ae !== null && aeLimit === null) warnings.push('The physical insert Re or its catalog Ae mapping is unconfirmed. Radial stock cannot be marked as verified.');
    if (candidate?.status !== 'confirmed') warnings.push(...(candidate?.reviewNotes || []), 'This combination still requires review. Calculated values do not approve the complete assembly.');
    const excessAe = ae !== null && aeLimit !== null && ae > aeLimit + EPSILON;
    const canCopy = errors.length === 0 && !referenceMode && candidate?.status === 'confirmed' && !!insert?.exactGeometry && !!insert?.gradeMatch && !cuttingRow?.hardness_condition && !excessAe;
    return {
      rpm, feedRate, diameter, depth, ae, aeLimit, vc, feed,
      canCopy, errors: unique(errors), warnings: unique(warnings), recommendation,
      grade: insert?.grade || null, insert, cuttingRow, requestedCuttingRow: cuttingRow, referenceRow, usedCuttingRow, source,
      machineMaxRpm, prebore, useRecommendations, allowReference, referenceMode,
      formula: { rpm: '1000 × Vc ÷ (π × D)', feedRate: 'S × f (no tooth-count factor)', ae: '(D − prebore) ÷ 2' }
    };
  }

  return Object.freeze({ normalize, find, calculate, applicableInserts, escapeHTML });
});
