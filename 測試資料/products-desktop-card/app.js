/* 桌面卡片樣板資料：保留正式產品頁的分類與產品名稱，方便直接比較設計。 */
const families = [
  { title: "Spotting", image: "spotting.png", products: ["ACE Spot Drill", "Micro Spot Drill", "NC Spot Drill"] },
  { title: "Centering", image: "centering.png", products: ["i-Center Center Drill"] },
  { title: "Drilling", image: "drilling.png", products: ["Super Drill", "Super Power Drill"] },
  { title: "Boring", image: "boring.png", products: ["NineBore Boring Tool", "NineSwiss Modular Head Boring Tool"] },
  { title: "Milling", image: "milling.png", products: ["Power Mill"] },
  { title: "NC Helix Drill", image: "helix.png", products: ["NC Helix Drill"] },
  { title: "Threading", image: "threading.png", products: ["MCC Thread Mill"] },
  { title: "Engraving", image: "engraving.png", products: ["X060", "V060 / V045", "W060", "N9MT-W", "NC Spot Drill"] },
  { title: "Chamfering & Corner Radii", image: "chamfering.png", products: ["Chamfer Mill", "ACE Spot Drill", "NC Spot Drill", "Corner Rounding_RC Type", "Corner Rounding_R Type"] },
  { title: "Deburring", image: "deburring.png", products: ["NC Deburring", "MCC Deburring Mill"] },
  { title: "Turning", image: "turning.png", products: ["NineSwiss Modular Head Turning Tool", "NineSwiss Modular Head Boring Tool"] },
  { title: "ER Taper-Shank Cutter", image: "Ergo.png", products: ["Ergo ER Taper-Shank Cutter"] }
];

/* 將動態文字轉為安全字串，避免資料內容被瀏覽器當成 HTML 執行。 */
function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* Bootstrap Icons 的向右箭頭，用在產品連結與卡片主要操作。 */
const arrowRight = `
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-right" viewBox="0 0 16 16" aria-hidden="true">
    <path fill-rule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8"/>
  </svg>`;

const grid = document.getElementById("familyGrid");

/* 一次產生所有卡片，編號、圖片、產品清單與按鈕維持一致結構。 */
grid.innerHTML = families.map((family, index) => `
  <article class="family-card">
    <div class="card-accent" aria-hidden="true"></div>
    <header class="family-head">
      <span class="family-icon"><img src="../../img/${escapeHTML(family.image)}" alt=""></span>
      <div class="family-heading">
        <span class="family-number">FAMILY ${String(index + 1).padStart(2, "0")}</span>
        <h2>${escapeHTML(family.title)}</h2>
      </div>
    </header>
    <div class="family-body">
      <p class="related-label"><span></span>Related Products</p>
      <ul class="product-list">
        ${family.products.map((product) => `<li><a href="#">${escapeHTML(product)}${arrowRight}</a></li>`).join("")}
      </ul>
      <button class="family-action" type="button">
        View ${escapeHTML(family.title)}
        ${arrowRight}
      </button>
    </div>
  </article>
`).join("");

/* 此頁是視覺樣板，暫時阻止測試連結跳離頁面。 */
grid.addEventListener("click", (event) => {
  if (event.target.closest("a, button")) event.preventDefault();
});
