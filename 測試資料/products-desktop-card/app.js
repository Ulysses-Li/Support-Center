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

/* Bootstrap Icons 的向下箭頭，用來提示手機版卡片可以展開。 */
const chevronDown = `
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chevron-down" viewBox="0 0 16 16" aria-hidden="true">
    <path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708"/>
  </svg>`;

const grid = document.getElementById("familyGrid");

/* 一次產生所有卡片，編號、圖片、產品清單與按鈕維持一致結構。 */
grid.innerHTML = families.map((family, index) => {
  const panelId = `family-panel-${index}`;

  return `
  <article class="family-card${index === 0 ? " is-open" : ""}">
    <div class="card-accent" aria-hidden="true"></div>
    <button class="family-head" type="button" aria-expanded="${index === 0 ? "true" : "false"}" aria-controls="${panelId}">
      <span class="family-icon"><img src="../../img/${escapeHTML(family.image)}" alt=""></span>
      <div class="family-heading">
        <span class="family-number">FAMILY ${String(index + 1).padStart(2, "0")}</span>
        <h2>${escapeHTML(family.title)}</h2>
      </div>
      <span class="mobile-chevron" aria-hidden="true">${chevronDown}</span>
    </button>
    <div class="family-body" id="${panelId}">
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
  `;
}).join("");

const mobileQuery = window.matchMedia("(max-width: 620px)");

/* 手機版使用單開式手風琴；桌面版則固定顯示每張卡片的完整內容。 */
grid.addEventListener("click", (event) => {
  const head = event.target.closest(".family-head");

  if (head && mobileQuery.matches) {
    const selectedCard = head.closest(".family-card");
    const willOpen = !selectedCard.classList.contains("is-open");

    grid.querySelectorAll(".family-card").forEach((card) => {
      card.classList.remove("is-open");
      card.querySelector(".family-head").setAttribute("aria-expanded", "false");
    });

    if (willOpen) {
      selectedCard.classList.add("is-open");
      head.setAttribute("aria-expanded", "true");
    }
  }

  /* 視覺樣板暫時不導向正式產品頁。 */
  if (event.target.closest("a, .family-action")) event.preventDefault();
});

/* 切換桌面與手機寬度時，同步按鈕的展開狀態。 */
function syncResponsiveState() {
  grid.querySelectorAll(".family-card").forEach((card) => {
    const head = card.querySelector(".family-head");
    head.setAttribute("aria-expanded", mobileQuery.matches ? String(card.classList.contains("is-open")) : "true");
  });
}

mobileQuery.addEventListener("change", syncResponsiveState);
syncResponsiveState();
