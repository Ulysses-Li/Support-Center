/* 正式雕刻初篩直接取用切削工具的原始資料，尺寸與材料配對只維護一份。
 * 此轉接層不提供轉速與進給；瀏覽器以 Promise 等待四組正式資料完成載入。 */
(function (root, factory) {
  "use strict";
  const directories = ["X060", "V060", "W060", "N9MTW"];
  if (typeof module === "object" && module.exports) {
    const fs = require("node:fs");
    const path = require("node:path");
    const read = (directory, filename) => JSON.parse(fs.readFileSync(path.join(__dirname, "../../CuttingData", directory, "data", filename), "utf8"));
    module.exports = factory(directories.map(directory => ({ catalog: read(directory, "catalog.json"), cutting: read(directory, "cutting-data.json") })));
  } else {
    const read = async (directory, filename) => {
      const response = await fetch(`../../CuttingData/${directory}/data/${filename}`);
      if (!response.ok) throw new Error(`雕刻資料載入失敗：${directory}/${filename} (${response.status})`);
      return response.json();
    };
    root.EngravingDataReady = Promise.all(directories.map(async directory => {
      const [catalog, cutting] = await Promise.all([read(directory, "catalog.json"), read(directory, "cutting-data.json")]);
      return { catalog, cutting };
    })).then(groups => {
      const data = factory(groups);
      root.ENGRAVING_DATA = data;
      return data;
    });
  }
})(typeof window !== "undefined" ? window : globalThis, function (groups) {
  "use strict";

  // 此處僅維護系列的展示文字；實體料號、規格、材料及頁碼都來自正式 JSON。
  const descriptions = [
    { id: "X060", title: "X060", subtitle: "細緻刻字・多角度刀尖", description: "30° 至 90°，可依刻槽需求選擇小平底或圓弧底刀尖。", directory: "X060" },
    { id: "V045", title: "V045", subtitle: "45° V 型雕刻", description: "適合較寬刻線；依刀片牌號選擇不同最小刻線寬度。", directory: "V060" },
    { id: "V060", title: "V060", subtitle: "60° V 型雕刻", description: "W03 與 W06 刀片涵蓋不同刻線寬度及深度。", directory: "V060" },
    { id: "W060", title: "W060", subtitle: "薄淺刻字・細柄刀具", description: "Ø4 mm 刀柄，依刻線尺寸選擇 S101、S102 或 S103 刀片。", directory: "W060" },
    { id: "N9MT-W", title: "N9MT-W", subtitle: "60°／90° 多用途雕刻", description: "搭配型錄所列 NC Spot Drill 基本刀柄，選擇對應角度的雕刻刀片。", directory: "N9MTW" }
  ];
  const inserts = groups.flatMap(({ catalog }) => catalog.inserts.map(insert => ({
    id: insert.id,
    family: insert.family,
    partBase: insert.part_base,
    grade: insert.grade,
    orderCode: insert.order_code,
    angle: insert.angle_deg,
    form: insert.form,
    limits: { ...insert.engraving_limits_mm },
    radius: insert.insert_dimensions_mm.Re ?? null,
    radiusMaxDepth: insert.radius_max_depth_mm ?? null,
    sourcePage: insert.source_catalog_page
  })));
  const insertById = new Map(inserts.map(insert => [insert.id, insert]));
  const materialsById = new Map();
  groups.forEach(({ cutting }) => cutting.materials.forEach(material => {
    if (!materialsById.has(material.id)) materialsById.set(material.id, { id: material.id, label: material.label_zh_TW, iso: material.iso_group });
  }));
  const hardnessLabel = value => {
    if (!value) return null;
    const match = /HRC\s*(<=|<)\s*(\d+(?:\.\d+)?)/i.exec(value) || /(<=|<)\s*HRC\s*(\d+(?:\.\d+)?)/i.exec(value);
    return match ? `HRC ${match[1]} ${match[2]}` : value;
  };

  // 共表依已核對的 pairing 展開為實際料號與單一牌號，不能僅憑系列名稱借用材料列。
  const cuttingRows = groups.flatMap(({ cutting }) => {
    const rowsById = new Map(cutting.rows.map(row => [row.id, row]));
    return cutting.pairings.flatMap(pairing => {
      const row = rowsById.get(pairing.row_id);
      if (!row) throw new Error(`切削來源列不存在：${pairing.row_id}`);
      return pairing.insert_ids.map(id => {
        const insert = insertById.get(id);
        if (!insert) throw new Error(`切削配對的實體刀片不存在：${id}`);
        return { model: insert.partBase, material: row.material_id, grades: [insert.grade], maxDepth: row.Tmax_mm, hardnessLimit: hardnessLabel(row.hardness_limit), sourcePage: row.source_catalog_page };
      });
    });
  });
  const holders = groups.flatMap(({ catalog }) => catalog.holders.map(holder => ({
    id: holder.part_number,
    family: holder.family,
    shank: { ...holder.shank_diameter },
    shankLabel: holder.shank_diameter.unit === "inch" && holder.shank_diameter.value === 0.375 ? "Ø3/8 inch" : `Ø${holder.shank_diameter.value} ${holder.shank_diameter.unit}`,
    length: holder.length_L_mm,
    materialRestriction: holder.material_restriction ?? null,
    sourcePages: [...holder.source_catalog_pages]
  })));
  const families = descriptions.map(({ directory, ...family }) => ({
    ...family,
    image: "../../img/engraving.png",
    productHref: `../../Products/${directory === "N9MTW" ? "N9MTW" : directory}/index.html`,
    sourcePages: [...new Set(inserts.filter(insert => insert.family === family.id).map(insert => insert.sourcePage))].sort((a, b) => a - b)
  }));
  return {
    version: "2026-11-24-official",
    source: {
      title: "Engraving Tool p68–83",
      catalogHref: "../../CuttingData/Engraving/sources/Engraving-Tool-p068-083.pdf",
      researchHref: "../../CuttingData/Engraving/catalog-notes.html",
      note: "與四組雕刻切削設定工具共用已核對的型錄規格、實體牌號與來源頁碼。"
    },
    families, materials: [...materialsById.values()], inserts, cuttingRows, holders
  };
});
