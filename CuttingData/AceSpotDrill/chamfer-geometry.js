/* ACE 點鑽與倒角幾何：集中管理型錄尺寸，與既有切削速度／進給資料分開。
 * 來源：Products/AceSpotDrill/ACE-Spot-Drill-Catalog.pdf
 * 印刷頁 16–17：d1、Dmax；頁 19：實際刀尖修正 ℓ、Tmax；頁 20–23：Cmax、降進給門檻。
 * 注意：既有 spotting 資料的 ℓ 與型錄不一致，本助手直接使用核對過的型錄值。
 */
const ACE_CHAMFER_SIZES = Object.freeze({
  SI06: { d1: 1.2, maxDiameter: 5.5, c90: 2, feed90: 1, corrections: [.35, .35, .05, .04], depths: [4.1, 2.5, 1.6, .95] },
  SI08: { d1: 1.6, maxDiameter: 7.5, c90: 2.5, feed90: 1.25, corrections: [.46, .46, .05, .04], depths: [5.6, 3.4, 2.2, 1.29] },
  SI10: { d1: 2, maxDiameter: 9.5, c90: 3.4, feed90: 1.7, corrections: [.58, .58, .06, .05], depths: [7.1, 4.4, 2.7, 1.64] },
  SI12: { d1: 2.4, maxDiameter: 11.5, c90: 4, feed90: 2, corrections: [.69, .69, .06, .05], depths: [8.6, 5.3, 3.3, 1.98] },
  SI16: { d1: 3.2, maxDiameter: 15.5, c90: 5.5, feed90: 2.5, corrections: [.92, .92, .1, .15], depths: [11.6, 7, 4.4, 2.67] },
  SI20: { d1: 4, maxDiameter: 19.5, c90: 7, feed90: 3, corrections: [1.16, 1.16, .1, .15], depths: [14.6, 8.9, 5.6, 3.36] }
});
const ACE_CHAMFER_ANGLES = Object.freeze([60, 90, 120, 142]);

function getChamferGeometry(size, angle) {
  const spec = ACE_CHAMFER_SIZES[size];
  const index = ACE_CHAMFER_ANGLES.indexOf(Number(angle));
  if (!spec || index < 0) return null;
  const includedAngle = Number(angle);
  const depthPerWidth = includedAngle === 90 ? 1 : 1 / Math.tan(includedAngle * Math.PI / 360);
  const tipCorrection = spec.corrections[index];
  const maxDepth = spec.depths[index];
  // 120°／142° 型錄沒有 d1，以刀尖平面的幾何交點作模型下限，絕不冒稱型錄最小切徑。
  const minDiameterSource = includedAngle <= 90 ? "catalog" : "tip-plane geometry";
  const minDiameter = includedAngle <= 90 ? spec.d1 : 2 * tipCorrection / depthPerWidth;
  // 同時檢查 Dmax 和 Tmax；較尖的 60° 刀片不可僅以名目最大直徑限制 Z。
  const maxContactDiameter = Math.min(spec.maxDiameter, 2 * (maxDepth + tipCorrection) / depthPerWidth);
  const geometricWidth = (maxContactDiameter - minDiameter) / 2;
  const maxC = includedAngle === 90 ? Math.min(spec.c90, geometricWidth) : Math.floor((geometricWidth + 1e-10) * 10000) / 10000;
  return { angle: includedAngle, faceAngle: 90 - includedAngle / 2, depthPerWidth, minDiameter, minDiameterSource,
    maxDiameter: spec.maxDiameter, maxContactDiameter, tipCorrection, maxDepth, maxC,
    maxWidthSource: includedAngle === 90 ? "catalog" : "geometry", reduceFeedAbove: includedAngle === 90 ? spec.feed90 : null };
}

// 保留 90° 資料入口供既有回歸測試使用；原始尺寸只在上表維護一次。
const ACE_CHAMFER_90 = Object.freeze(Object.fromEntries(Object.keys(ACE_CHAMFER_SIZES).map(size => [size, getChamferGeometry(size, 90)])));

const CHAMFER_CONTACT_POSITIONS = Object.freeze({ upper: 1, middle: .5, lower: 0 });

// 點鑽 D 位於工件頂面；實際刀尖深度扣除型錄 ℓ，不能把超過 Tmax 的深度截短後冒充有效結果。
function calculateSpotting({ size, angle, diameter }) {
  const geometry = getChamferGeometry(size, angle);
  if (!geometry) return { valid: false, errors: ["Select a supported ACE insert and angle."], unsupported: true };
  const errors = [];
  if (!Number.isFinite(diameter) || diameter <= 0) {
    return { valid: false, errors: ["Enter a positive spotting diameter D."], geometry };
  }
  const theoreticalDepth = diameter / 2 * geometry.depthPerWidth;
  const depth = theoreticalDepth - geometry.tipCorrection;
  if (diameter < geometry.minDiameter - 1e-9 || diameter > geometry.maxDiameter + 1e-9 || depth <= 0) {
    errors.push("D must intersect the modeled cutting edge and stay within catalog Dmax.");
  }
  if (depth > geometry.maxDepth + 1e-9) errors.push("The spotting depth exceeds catalog Tmax. Reduce D.");
  return { valid: !errors.length, errors, geometry, diameter, theoreticalDepth, depth, z: -depth };
}

// 換直徑標示位置時保留同一組 R／Z：D新 = D舊 + 2C × (k新 − k舊)。
// 不將原本無效的輸入夾限成合法值；交由既有驗證呈現錯誤。
function convertContactDiameter({ diameter, c, from, to }) {
  const previous = CHAMFER_CONTACT_POSITIONS[from];
  const next = CHAMFER_CONTACT_POSITIONS[to];
  if (!Number.isFinite(diameter) || diameter <= 0 || !Number.isFinite(c) || c <= 0 || previous === undefined || next === undefined) return NaN;
  return diameter + 2 * c * (next - previous);
}

/**
 * 原始輪廓 x=0；材料在 x<0；工件頂面 z=0；α 為刀片夾角，β=90°−α/2 為倒角面與頂面的夾角。
 * c 在 API 中統一代表水平寬度 W；只有 90° 刀片時可稱等邊 C 角。
 * q=cot(α/2)，H=Wq；倒角下緣 (0,-H)，上緣 (-W,0)。
 * position=1/0.5/0 分別代表所選 D 位於上緣／中央／下緣；R=D/2−position*W。
 * 實際刀尖對刀：Z=−((R+W)q−ℓ)；理論尖點對刀：Z=−(R+W)q。
 * 本函式只回傳原始輪廓之完整幾何補正量；不推定 G41/G42、正負方向或磨耗補正值。
 */
function calculateChamfer({ size, angle, c, diameter, reference = "upper", datum = "actual" }) {
  const geometry = getChamferGeometry(size, angle);
  const position = CHAMFER_CONTACT_POSITIONS[reference];
  const errors = [];
  if (!geometry) return { valid: false, errors: ["Select a supported ACE insert and angle (60°, 90°, 120° or 142°)."], unsupported: true };
  const widthLabel = geometry.angle === 90 ? "C" : "W";
  if (!Number.isFinite(c) || c <= 0 || c > geometry.maxC) errors.push(`${widthLabel} must be above 0 and no greater than ${geometry.maxC} mm.`);
  if (!Number.isFinite(diameter) || diameter <= 0) errors.push("Enter a positive contact diameter D.");
  if (position === undefined || !["actual", "theoretical"].includes(datum)) errors.push("Select a valid diameter reference and Z datum.");
  if (errors.length) return { valid: false, errors, geometry };
  const radius = diameter / 2 - position * c;
  const lowerDiameter = 2 * radius;
  const upperDiameter = lowerDiameter + 2 * c;
  const height = c * geometry.depthPerWidth;
  const actualDrop = upperDiameter / 2 * geometry.depthPerWidth - geometry.tipCorrection;
  const tolerance = 1e-9;
  if (lowerDiameter < geometry.minDiameter - tolerance || upperDiameter > geometry.maxContactDiameter + tolerance) {
    errors.push(`The full chamfer must stay within the modeled diameter band and catalog Tmax. Change D, its reference, or ${widthLabel}.`);
  }
  if (radius <= 0 || actualDrop <= 0 || actualDrop > geometry.maxDepth + tolerance) errors.push("This contact position exceeds the usable cutting depth.");
  const minD = geometry.minDiameter + 2 * position * c;
  const maxD = geometry.maxContactDiameter - 2 * (1 - position) * c;
  const z = -(upperDiameter / 2 * geometry.depthPerWidth - (datum === "actual" ? geometry.tipCorrection : 0));
  return { valid: !errors.length, errors, geometry, radius, compensationDiameter: 2 * radius, z, actualDrop,
    lowerDiameter, upperDiameter, minD, maxD, position, c, height, diameter, reference, datum,
    reduceFeed: Number.isFinite(geometry.reduceFeedAbove) && c > geometry.reduceFeedAbove };
}

// 同一個純函式供瀏覽器與 Node 幾何測試使用，不需模擬 DOM。
if (typeof module !== "undefined") module.exports = { ACE_CHAMFER_90, ACE_CHAMFER_SIZES, ACE_CHAMFER_ANGLES, getChamferGeometry, calculateSpotting, calculateChamfer, convertContactDiameter };
