/* ACE 90° 倒角幾何：集中管理型錄尺寸，與既有切削速度／進給資料分開。
 * 來源：Products/AceSpotDrill/ACE-Spot-Drill-Catalog.pdf
 * 印刷頁 16–17：d1、Dmax；頁 19：實際刀尖修正 ℓ、Tmax；頁 20–23：Cmax、降進給門檻。
 * 注意：既有 spotting 資料的 ℓ 與型錄不一致，本助手直接使用核對過的型錄值。
 */
const ACE_CHAMFER_90 = Object.freeze({
  SI06: { minDiameter: 1.2, maxDiameter: 5.5, tipCorrection: .35, maxDepth: 2.5, maxC: 2, reduceFeedAbove: 1 },
  SI08: { minDiameter: 1.6, maxDiameter: 7.5, tipCorrection: .46, maxDepth: 3.4, maxC: 2.5, reduceFeedAbove: 1.25 },
  SI10: { minDiameter: 2, maxDiameter: 9.5, tipCorrection: .58, maxDepth: 4.4, maxC: 3.4, reduceFeedAbove: 1.7 },
  SI12: { minDiameter: 2.4, maxDiameter: 11.5, tipCorrection: .69, maxDepth: 5.3, maxC: 4, reduceFeedAbove: 2 },
  SI16: { minDiameter: 3.2, maxDiameter: 15.5, tipCorrection: .92, maxDepth: 7, maxC: 5.5, reduceFeedAbove: 2.5 },
  SI20: { minDiameter: 4, maxDiameter: 19.5, tipCorrection: 1.16, maxDepth: 8.9, maxC: 7, reduceFeedAbove: 3 }
});

/**
 * 原始輪廓 x=0；材料在 x<0；工件頂面 z=0。90° 刀片切出 45° 等邊 C 角。
 * 刀心向自由側偏移 R，倒角下緣 (0,-C)，上緣 (-C,0)。
 * position=1/0.5/0 分別代表所選 D 位於上緣／中央／下緣。
 * R = D/2 - position*C；上緣刀具半徑 = R+C。
 * 實際刀尖對刀：Z=-(R+C-ℓ)；理論尖點對刀：Z=-(R+C)。
 * 本函式只回傳原始輪廓之完整幾何補正量；不推定 G41/G42、正負方向或磨耗補正值。
 */
function calculateChamfer({ size, angle, c, diameter, reference = "upper", datum = "actual" }) {
  const geometry = ACE_CHAMFER_90[size];
  const positions = { upper: 1, middle: .5, lower: 0 };
  const position = positions[reference];
  const errors = [];
  if (Number(angle) !== 90 || !geometry) return { valid: false, errors: ["C-chamfer setup supports 90° ACE inserts (45° chamfer face)."], unsupported: true };
  if (!Number.isFinite(c) || c <= 0 || c > geometry.maxC) errors.push(`C must be above 0 and no greater than ${geometry.maxC} mm.`);
  if (!Number.isFinite(diameter) || diameter <= 0) errors.push("Enter a positive contact diameter D.");
  if (position === undefined || !["actual", "theoretical"].includes(datum)) errors.push("Select a valid diameter reference and Z datum.");
  if (errors.length) return { valid: false, errors, geometry };
  const radius = diameter / 2 - position * c;
  const lowerDiameter = 2 * radius;
  const upperDiameter = lowerDiameter + 2 * c;
  const actualDrop = upperDiameter / 2 - geometry.tipCorrection;
  const tolerance = 1e-9;
  if (lowerDiameter < geometry.minDiameter - tolerance || upperDiameter > geometry.maxDiameter + tolerance) {
    errors.push(`The full chamfer must stay within Ø${geometry.minDiameter}–Ø${geometry.maxDiameter} mm. Change D, its reference, or C.`);
  }
  if (radius <= 0 || actualDrop <= 0 || actualDrop > geometry.maxDepth + tolerance) errors.push("This contact position exceeds the usable cutting depth.");
  const minD = geometry.minDiameter + 2 * position * c;
  const maxD = geometry.maxDiameter - 2 * (1 - position) * c;
  const z = -(upperDiameter / 2 - (datum === "actual" ? geometry.tipCorrection : 0));
  return { valid: !errors.length, errors, geometry, radius, compensationDiameter: 2 * radius, z, actualDrop,
    lowerDiameter, upperDiameter, minD, maxD, position, c, diameter, reference, datum,
    reduceFeed: c > geometry.reduceFeedAbove };
}

// 同一個純函式供瀏覽器與 Node 幾何測試使用，不需模擬 DOM。
if (typeof module !== "undefined") module.exports = { ACE_CHAMFER_90, calculateChamfer };
