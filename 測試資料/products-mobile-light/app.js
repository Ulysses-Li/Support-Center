// 樣板資料沿用正式頁面的分類與圖片，方便直接比較明暗與密度。
const families = [
  { name: "Spotting", image: "/img/spotting.png", products: ["ACE Spot Drill", "Micro Spot Drill", "NC Spot Drill"] },
  { name: "Centering", image: "/img/centering.png", products: ["i-Center Center Drill"] },
  { name: "Drilling", image: "/img/drilling.png", products: ["Super Drill", "Super Power Drill"] },
  { name: "Boring", image: "/img/boring.png", products: ["NineBore Boring Tool", "NineSwiss Modular Head Boring Tool"] },
  { name: "Milling", image: "/img/milling.png", products: ["Power Mill"] },
  { name: "NC Helix Drill", image: "/img/helix.png", products: ["NC Helix Drill"] },
  { name: "Threading", image: "/img/threading.png", products: ["MCC Thread Mill"] },
  { name: "Engraving", image: "/img/engraving.png", products: ["X060", "V060 / V045", "W060", "N9MT-W"] },
  { name: "Chamfering & Corner Radii", image: "/img/chamfering.png", products: ["Chamfer Mill", "Corner Rounding RC Type", "Corner Rounding R Type"] },
  { name: "Deburring", image: "/img/deburring.png", products: ["NC Deburring", "MCC Deburring Mill"] },
  { name: "Turning", image: "/img/turning.png", products: ["NineSwiss Turning Tool", "NineSwiss Boring Tool"] },
  { name: "ER Taper-Shank Cutter", image: "/img/Ergo.png", products: ["Ergo ER Taper-Shank Cutter"] }
];

// 將文字轉成安全內容，避免產品名稱被瀏覽器當成 HTML 執行。
function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

const grid = document.getElementById("productGrid");

// 產生手機優先的產品卡片；按鈕與內容區使用 aria 屬性維持可及性。
grid.innerHTML = families.map((family, index) => {
  const panelId = `family-panel-${index}`;
  return `
    <article class="family-card">
      <button class="family-toggle" type="button" aria-expanded="false" aria-controls="${panelId}">
        <span class="icon-well"><img src="${escapeHTML(family.image)}" alt=""></span>
        <h2 class="family-name">${escapeHTML(family.name)}</h2>
        <span class="chevron" aria-hidden="true">›</span>
      </button>
      <div class="family-details" id="${panelId}">
        <p class="detail-label">Related Products</p>
        <ul class="product-links">
          ${family.products.map((product) => `<li><a href="#">${escapeHTML(product)}</a></li>`).join("")}
        </ul>
      </div>
    </article>
  `;
}).join("");

// 手機點擊時只展開一張卡片，避免畫面被多個清單拉得過長。
grid.addEventListener("click", (event) => {
  const toggle = event.target.closest(".family-toggle");
  if (!toggle) return;

  const selectedCard = toggle.closest(".family-card");
  const willOpen = !selectedCard.classList.contains("is-open");

  grid.querySelectorAll(".family-card").forEach((card) => {
    card.classList.remove("is-open");
    card.querySelector(".family-toggle").setAttribute("aria-expanded", "false");
  });

  if (willOpen) {
    selectedCard.classList.add("is-open");
    toggle.setAttribute("aria-expanded", "true");
  }
});
