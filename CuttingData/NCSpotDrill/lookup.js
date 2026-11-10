/* 型錄料號查找：一個刀片／刀柄可對應多種角度，不能在多筆命中時暗自選第一筆。 */
const NC_SPOT_LOOKUP = (() => {
  const normalize = value => String(value ?? "").trim().toUpperCase().replace(/\s+/g, "");
  const alias = value => normalize(value).replace(/^00-/, "");
  function find(query, { series = [], packages: suppliedPackages, catalogPackages = [] } = {}) {
    const packages = suppliedPackages ?? catalogPackages;
    const needle = normalize(query);
    if (!needle) return [];
    const matches = [];
    const add = (item, values) => {
      const keys = values.filter(Boolean).map(normalize);
      const exact = keys.some(key => key === needle || alias(key) === alias(needle));
      if (exact || keys.some(key => key.includes(needle))) matches.push({ ...item, exact });
    };
    for (const family of series) {
      add({ familyId: family.id, kind: "family", part: family.familyLabel }, [family.familyLabel]);
      for (const insert of family.inserts) add({ familyId: family.id, insertId: insert.id, kind: "insert", part: insert.part }, [insert.part, insert.code]);
      for (const holder of family.holders) add({ familyId: family.id, holderPart: holder.part, kind: "holder", part: holder.part }, [holder.part, holder.code]);
    }
    for (const item of packages) add({ familyId: item.familyId, insertId: item.insertId, holderPart: item.holderPart, kind: "package", part: item.part }, [item.part, item.code]);
    const filtered = matches.some(item => item.exact) ? matches.filter(item => item.exact) : matches;
    const unique = new Map();
    for (const item of filtered) unique.set([item.familyId, item.insertId || "", item.holderPart || ""].join("|"), item);
    return [...unique.values()];
  }
  function resolveAssembly({ seriesId, insertId, angle } = {}, series = []) {
    const numericAngle = Number(angle);
    const angleSpecified = angle !== null && angle !== undefined && angle !== "" && angle !== "all" && Number.isFinite(numericAngle);
    const exactFamily = series.find(item => item.id === seriesId);
    if (exactFamily && (!insertId || exactFamily.inserts.some(item => item.id === insertId)) && (!angleSpecified || exactFamily.angle === numericAngle)) return { series: exactFamily, candidates: [exactFamily] };
    if (insertId) {
      let candidates = series.filter(item => item.inserts.some(insert => insert.id === insertId));
      if (angleSpecified) candidates = candidates.filter(item => item.angle === numericAngle);
      return { series: candidates.length === 1 ? candidates[0] : null, candidates };
    }
    const selected = exactFamily || (angleSpecified ? series.find(item => item.angle === numericAngle) : null);
    return { series: selected || null, candidates: selected ? [selected] : [] };
  }
  return Object.freeze({ find, normalize, resolveAssembly });
})();
if (typeof module !== "undefined") module.exports = NC_SPOT_LOOKUP;
