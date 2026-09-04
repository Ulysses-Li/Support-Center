/**
 * 切削資料首頁的產品清單與導覽。
 * 每筆資料描述卡片文字、圖片、狀態，以及可前往的產品切削資料頁。
 */
const CUTTING_DATA_PRODUCTS = [
  {
    id: "ace-spot-drill",
    name: "ACE Spot Drill",
    category: "Spotting / Chamfering",
    image: "../img/spotting.png",
    status: "Available",
    href: "../Products/AceSpotDrill/indexV2.0.html#cutting-data",
    summary: "Product preset cutting data for spotting and chamfering.",
    details: [
      "Operation: Spotting / Chamfering",
      "Product selection: SI06 to SI20",
      "Output: Vc, feed, Q, grade, RPM, feed rate"
    ]
  },
  {
    id: "chamfer-mill",
    name: "Chamfer Mill",
    category: "Chamfering",
    image: "../img/chamfering.png",
    status: "Available",
    href: "../Products/ChamferMill/index.html#cutting-data",
    summary: "Chamfer milling cutting data presets are being prepared.",
    details: [
      "Planned: chamfer size and tool selection",
      "Planned: material presets",
      "Planned: RPM and feed conversion"
    ]
  },
  {
    id: "corner-rounding-rc",
    name: "Corner Rounding_RC Type",
    category: "Corner Rounding",
    image: "../img/chamfering.png",
    status: "Available",
    href: "../Products/CornerRoundingRC/index.html#cutting-data",
    summary: "Corner rounding RC cutting data will support radius machining setup.",
    details: [
      "Planned: radius and insert selection",
      "Planned: Vc and feed range",
      "Planned: starter cutting conditions"
    ]
  },
  {
    id: "corner-rounding-r",
    name: "Corner Rounding_R Type",
    category: "Corner Rounding",
    image: "../img/chamfering.png",
    status: "Available",
    href: "../Products/CornerRoundingR/index.html#cutting-data",
    summary: "Corner rounding R cutting data will support radius machining setup.",
    details: [
      "Planned: radius and holder selection",
      "Planned: material presets",
      "Planned: RPM and feed conversion"
    ]
  },
  {
    id: "ergo-er",
    name: "Ergo ER Taper-Shank Cutter",
    category: "Accessories / Cutter",
    image: "../img/Ergo.png",
    status: "Available",
    href: "../Products/ErgoER/index.html#cutting-data",
    summary: "ER taper-shank cutter cutting references are being prepared.",
    details: [
      "Planned: cutter type selection",
      "Planned: application notes",
      "Planned: related cutting data links"
    ]
  },
  {
    id: "icenter",
    name: "i-Center Center Drill",
    category: "Centering",
    image: "../img/centering.png",
    status: "Available",
    href: "../Products/ICenter/index.html#cutting-data",
    summary: "Center drilling cutting data presets are being prepared.",
    details: [
      "Planned: center drill size selection",
      "Planned: material presets",
      "Planned: feed mode guidance"
    ]
  },
  {
    id: "mcc-deburring",
    name: "MCC Deburring Mill",
    category: "Deburring",
    image: "../img/deburring.png",
    status: "Available",
    href: "../Products/MCCDeburring/index.html#cutting-data",
    summary: "MCC deburring cutting data will support edge break applications.",
    details: [
      "Planned: insert and cutter selection",
      "Planned: front/back deburring notes",
      "Planned: RPM and feed conversion"
    ]
  },
  {
    id: "mcc-thread-mill",
    name: "MCC Thread Mill",
    category: "Threading",
    image: "../img/threading.png",
    status: "Available",
    href: "../Products/MCCThreadMill/index.html#cutting-data",
    summary: "Thread milling cutting data can be tied to the NC Program generator later.",
    details: [
      "Planned: insert and material presets",
      "Planned: cutting speed and feed per tooth",
      "Planned: direct handoff to NC Program"
    ]
  },
  {
    id: "nc-spot-drill",
    name: "NC Spot Drill",
    category: "Spotting / Chamfering",
    image: "../img/spotting.png",
    status: "Available",
    href: "../Products/NCSpotDrill/index.html#cutting-data",
    summary: "Cutting data selector for NC Spot Drill is being prepared.",
    details: [
      "Planned: product series selection",
      "Planned: material presets",
      "Planned: RPM and feed conversion"
    ]
  },
  {
    id: "micro-spot-drill",
    name: "Micro Spot Drill",
    category: "Engraving / Spotting",
    image: "../img/engraving.png",
    status: "Available",
    href: "../Products/MicroSpotDrill/index.html#cutting-data",
    summary: "Micro tool cutting data and feed conversion are planned.",
    details: [
      "Planned: tool size selection",
      "Planned: material and coating presets",
      "Planned: conservative starter values"
    ]
  },
  {
    id: "n9mtw",
    name: "N9MT-W",
    category: "Engraving",
    image: "../img/engraving.png",
    status: "Available",
    href: "../Products/N9MTW/index.html#cutting-data",
    summary: "N9MT-W engraving cutting data is being prepared.",
    details: [
      "Planned: angle and width selection",
      "Planned: material presets",
      "Planned: fine feed guidance"
    ]
  },
  {
    id: "nc-deburring",
    name: "NC Deburring",
    category: "Deburring",
    image: "../img/deburring.png",
    status: "Available",
    href: "../Products/NCDeburring/index.html#cutting-data",
    summary: "NC Deburring cutting data will support edge break and back deburring.",
    details: [
      "Planned: application type selection",
      "Planned: material presets",
      "Planned: safe starter values"
    ]
  },
  {
    id: "nc-helix-drill",
    name: "NC Helix Drill",
    category: "Hole Making",
    image: "../img/helix.png",
    status: "Available",
    href: "../Products/NCHelixDrill/index.html#cutting-data",
    summary: "Helical drilling cutting data will connect tool size, hole size, and pitch values.",
    details: [
      "Planned: Vc and feed ranges",
      "Planned: P value guidance",
      "Planned: hole diameter conversion"
    ]
  },
  {
    id: "nine-bore",
    name: "NineBore Boring Tool",
    category: "Boring",
    image: "../img/boring.png",
    status: "Available",
    href: "../Products/NineBore/index.html#cutting-data",
    summary: "Boring cutting data presets are being prepared.",
    details: [
      "Planned: boring diameter and allowance",
      "Planned: material presets",
      "Planned: feed per revolution guidance"
    ]
  },
  {
    id: "nine-swiss-boring",
    name: "NineSwiss Modular Head Boring Tool",
    category: "Boring",
    image: "../img/boring.png",
    status: "Available",
    href: "../Products/NineSwissBoring/index.html#cutting-data",
    summary: "NineSwiss boring cutting data presets are being prepared.",
    details: [
      "Planned: modular head selection",
      "Planned: bore size and allowance",
      "Planned: starter cutting conditions"
    ]
  },
  {
    id: "nine-swiss-turning",
    name: "NineSwiss Modular Head Turning Tool",
    category: "Turning",
    image: "../img/turning.png",
    status: "Available",
    href: "../Products/NineSwissTurning/index.html#cutting-data",
    summary: "NineSwiss turning cutting data presets are being prepared.",
    details: [
      "Planned: head and insert selection",
      "Planned: material presets",
      "Planned: feed mode guidance"
    ]
  },
  {
    id: "power-mill",
    name: "Power Mill",
    category: "Milling",
    image: "../img/milling.png",
    status: "Available",
    href: "../Products/PowerMill/index.html#cutting-data",
    summary: "Milling cutting data presets are planned for general milling applications.",
    details: [
      "Planned: tool diameter",
      "Planned: material grade presets",
      "Planned: RPM and feed rate conversion"
    ]
  },
  {
    id: "super-drill",
    name: "Super Drill",
    category: "Drilling",
    image: "../img/drilling.png",
    status: "Available",
    href: "../Products/SuperDrill/index.html#cutting-data",
    summary: "Super Drill cutting data presets are being prepared.",
    details: [
      "Planned: drill diameter selection",
      "Planned: material presets",
      "Planned: RPM and feed conversion"
    ]
  },
  {
    id: "super-power-drill",
    name: "Super Power Drill",
    category: "Drilling",
    image: "../img/drilling.png",
    status: "Available",
    href: "../Products/SuperPowerDrill/index.html#cutting-data",
    summary: "Super Power Drill cutting data presets are being prepared.",
    details: [
      "Planned: drill size selection",
      "Planned: material and coolant notes",
      "Planned: starter cutting conditions"
    ]
  },
  {
    id: "v060",
    name: "V060 / V045",
    category: "Engraving",
    image: "../img/engraving.png",
    status: "Available",
    href: "../Products/V060/index.html#cutting-data",
    summary: "V060 / V045 engraving cutting data is being prepared.",
    details: [
      "Planned: angle and tool selection",
      "Planned: material presets",
      "Planned: fine feed guidance"
    ]
  },
  {
    id: "w060",
    name: "W060",
    category: "Engraving",
    image: "../img/engraving.png",
    status: "Available",
    href: "../Products/W060/index.html#cutting-data",
    summary: "W060 engraving cutting data is being prepared.",
    details: [
      "Planned: width and tool selection",
      "Planned: material presets",
      "Planned: RPM and feed conversion"
    ]
  },
  {
    id: "x060",
    name: "X060",
    category: "Engraving",
    image: "../img/engraving.png",
    status: "Available",
    href: "../Products/X060/index.html#cutting-data",
    summary: "X060 engraving cutting data is being prepared.",
    details: [
      "Planned: tip width and depth selection",
      "Planned: material presets",
      "Planned: conservative starter values"
    ]
  }
];

// 將產品資料中的特殊字元編碼，避免插入不安全的 HTML。
function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// 依資料陣列產生產品卡片，並替可用項目綁定跳轉事件。
function renderProductCards(selectedId) {
  const grid = document.getElementById("cuttingProductGrid");
  if (!grid) return;

  grid.innerHTML = CUTTING_DATA_PRODUCTS.map(product => `
    <button
      type="button"
      class="cutting-product-card ${product.id === selectedId ? "is-active" : ""}"
      data-product-id="${escapeHTML(product.id)}"
    >
      <img src="${escapeHTML(product.image)}" alt="">
      <span>${escapeHTML(product.category)}</span>
      <strong>${escapeHTML(product.name)}</strong>
      <em class="${product.status === "Available" ? "is-available" : ""}">${escapeHTML(product.status)}</em>
    </button>
  `).join("");

  grid.querySelectorAll("button").forEach(button => {
    button.addEventListener("click", () => {
      const product = CUTTING_DATA_PRODUCTS.find(item => item.id === button.dataset.productId);

      if (product?.href) {
        window.location.href = product.href;
      }
    });
  });
}

// 決定目前選取產品；找不到時安全回退到第一筆。
function renderCuttingDataPage(selectedId = CUTTING_DATA_PRODUCTS[0].id) {
  const selected = CUTTING_DATA_PRODUCTS.find(product => product.id === selectedId) || CUTTING_DATA_PRODUCTS[0];

  renderProductCards(selected.id);
}

// DOM 完成後建立切削資料產品清單。
document.addEventListener("DOMContentLoaded", () => {
  renderCuttingDataPage();
});
