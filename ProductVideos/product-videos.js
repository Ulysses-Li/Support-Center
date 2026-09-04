/**
 * 產品影片入口清單。
 * 每筆資料包含產品名稱、分類、縮圖、狀態與產品頁影片分頁網址。
 */
const PRODUCT_VIDEO_ITEMS = [
  { id: "ace-spot-drill", name: "ACE Spot Drill", category: "Spotting / Chamfering", image: "../img/spotting.png", status: "Available", href: "../Products/AceSpotDrill/indexV2.0.html#videos", summary: "Planning and marketing product videos for ACE Spot Drill.", videos: ["Product Introduction Video", "Machining Application Video"] },
  { id: "chamfer-mill", name: "Chamfer Mill", category: "Chamfering", image: "../img/chamfering.png", status: "Available", href: "../Products/ChamferMill/index.html#videos", summary: "Chamfer Mill product videos are being prepared.", videos: ["Product overview", "Application footage"] },
  { id: "corner-rounding-rc", name: "Corner Rounding_RC Type", category: "Corner Rounding", image: "../img/chamfering.png", status: "Available", href: "../Products/CornerRoundingRC/index.html#videos", summary: "Corner Rounding RC videos are being prepared.", videos: ["Radius machining demo", "Product introduction"] },
  { id: "corner-rounding-r", name: "Corner Rounding_R Type", category: "Corner Rounding", image: "../img/chamfering.png", status: "Available", href: "../Products/CornerRoundingR/index.html#videos", summary: "Corner Rounding R videos are being prepared.", videos: ["Radius machining demo", "Product introduction"] },
  { id: "ergo-er", name: "Ergo ER Taper-Shank Cutter", category: "Accessories / Cutter", image: "../img/Ergo.png", status: "Available", href: "../Products/ErgoER/index.html#videos", summary: "Ergo ER product videos are being prepared.", videos: ["Tool setup", "Product overview"] },
  { id: "icenter", name: "i-Center Center Drill", category: "Centering", image: "../img/centering.png", status: "Available", href: "../Products/ICenter/index.html#videos", summary: "i-Center videos are being prepared.", videos: ["Center drilling demo", "Product overview"] },
  { id: "mcc-deburring", name: "MCC Deburring Mill", category: "Deburring", image: "../img/deburring.png", status: "Available", href: "../Products/MCCDeburring/index.html#videos", summary: "MCC Deburring videos are being prepared.", videos: ["Edge deburring demo", "Front/back deburring"] },
  { id: "mcc-thread-mill", name: "MCC Thread Mill", category: "Threading", image: "../img/threading.png", status: "Available", href: "../Products/MCCThreadMill/index.html#videos", summary: "MCC Thread Mill videos are being prepared.", videos: ["Thread milling demo", "NC program workflow"] },
  { id: "nc-spot-drill", name: "NC Spot Drill", category: "Spotting / Chamfering", image: "../img/spotting.png", status: "Available", href: "../Products/NCSpotDrill/index.html#videos", summary: "NC Spot Drill videos are being prepared.", videos: ["Spotting demo", "Chamfering demo"] },
  { id: "micro-spot-drill", name: "Micro Spot Drill", category: "Engraving / Spotting", image: "../img/engraving.png", status: "Available", href: "../Products/MicroSpotDrill/index.html#videos", summary: "Micro Spot Drill videos are being prepared.", videos: ["Micro machining demo", "Product overview"] },
  { id: "n9mtw", name: "N9MT-W", category: "Engraving", image: "../img/engraving.png", status: "Available", href: "../Products/N9MTW/index.html#videos", summary: "N9MT-W videos are being prepared.", videos: ["Engraving demo", "Product overview"] },
  { id: "nc-deburring", name: "NC Deburring", category: "Deburring", image: "../img/deburring.png", status: "Available", href: "../Products/NCDeburring/index.html#videos", summary: "NC Deburring videos are being prepared.", videos: ["Back deburring demo", "Edge break demo"] },
  { id: "nc-helix-drill", name: "NC Helix Drill", category: "Hole Making", image: "../img/helix.png", status: "Available", href: "../Products/NCHelixDrill/index.html#videos", summary: "NC Helix Drill videos are being prepared.", videos: ["Helical drilling demo", "NC program workflow"] },
  { id: "nine-bore", name: "NineBore Boring Tool", category: "Boring", image: "../img/boring.png", status: "Available", href: "../Products/NineBore/index.html#videos", summary: "NineBore videos are being prepared.", videos: ["Boring demo", "Product overview"] },
  { id: "nine-swiss-boring", name: "NineSwiss Modular Head Boring Tool", category: "Boring", image: "../img/boring.png", status: "Available", href: "../Products/NineSwissBoring/index.html#videos", summary: "NineSwiss boring videos are being prepared.", videos: ["Swiss boring demo", "Modular head setup"] },
  { id: "nine-swiss-turning", name: "NineSwiss Modular Head Turning Tool", category: "Turning", image: "../img/turning.png", status: "Available", href: "../Products/NineSwissTurning/index.html#videos", summary: "NineSwiss turning videos are being prepared.", videos: ["Swiss turning demo", "Modular head setup"] },
  { id: "power-mill", name: "Power Mill", category: "Milling", image: "../img/milling.png", status: "Available", href: "../Products/PowerMill/index.html#videos", summary: "Power Mill videos are being prepared.", videos: ["Milling demo", "Product overview"] },
  { id: "super-drill", name: "Super Drill", category: "Drilling", image: "../img/drilling.png", status: "Available", href: "../Products/SuperDrill/index.html#videos", summary: "Super Drill videos are being prepared.", videos: ["Drilling demo", "Product overview"] },
  { id: "super-power-drill", name: "Super Power Drill", category: "Drilling", image: "../img/drilling.png", status: "Available", href: "../Products/SuperPowerDrill/index.html#videos", summary: "Super Power Drill videos are being prepared.", videos: ["Heavy drilling demo", "Product overview"] },
  { id: "v060", name: "V060 / V045", category: "Engraving", image: "../img/engraving.png", status: "Available", href: "../Products/V060/index.html#videos", summary: "V060 / V045 videos are being prepared.", videos: ["Engraving demo", "Product overview"] },
  { id: "w060", name: "W060", category: "Engraving", image: "../img/engraving.png", status: "Available", href: "../Products/W060/index.html#videos", summary: "W060 videos are being prepared.", videos: ["Engraving demo", "Product overview"] },
  { id: "x060", name: "X060", category: "Engraving", image: "../img/engraving.png", status: "Available", href: "../Products/X060/index.html#videos", summary: "X060 videos are being prepared.", videos: ["Engraving demo", "Product overview"] }
];

// 編碼產品資料，避免動態 HTML 被插入惡意標記。
function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// 產生影片產品卡片，並讓可用卡片跳到對應產品頁。
function renderProductCards(selectedId) {
  const grid = document.getElementById("videoProductGrid");
  if (!grid) return;

  grid.innerHTML = PRODUCT_VIDEO_ITEMS.map(product => `
    <button
      type="button"
      class="video-product-card ${product.id === selectedId ? "is-active" : ""}"
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
      const product = PRODUCT_VIDEO_ITEMS.find(item => item.id === button.dataset.productId);

      if (product?.href) {
        window.location.href = product.href;
      }
    });
  });
}

// 驗證目前產品識別碼，找不到時使用第一筆資料。
function renderVideosPage(selectedId = PRODUCT_VIDEO_ITEMS[0].id) {
  const selected = PRODUCT_VIDEO_ITEMS.find(product => product.id === selectedId) || PRODUCT_VIDEO_ITEMS[0];

  renderProductCards(selected.id);
}

// DOM 完成後顯示產品影片入口。
document.addEventListener("DOMContentLoaded", () => {
  renderVideosPage();
});
