/*
=========================================================
products-render.js

用意：
1. 讀取 products-data.js 的 PRODUCT_FAMILIES
2. 自動產生 Products Card
3. 點擊 Card 直接進入產品頁
4. 不再使用手機版展開模式
5. 所有動態文字先經 escapeHTML，避免產品資料被當成標記執行
=========================================================
*/

/* =========================================================
   DOM Ready
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  renderProductsCards();
  bindProductCardActions();

});

/* =========================================================
   escapeHTML()

   用意：
   避免特殊字元破壞 HTML 結構
========================================================= */

function escapeHTML(value) {

  return String(value)

    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}

/* =========================================================
   renderProductsCards()

   用意：
   1. 將 PRODUCT_FAMILIES 轉成 Card
   2. 點擊 Card 可直接跳頁
========================================================= */

function renderProductsCards() {

  const grid =
    document.getElementById("productsGrid");

  if (!grid) return;

  grid.innerHTML = PRODUCT_FAMILIES.map((family, index) => {

    const panelId = `product-family-panel-${index}`;

    return `

      <div class="col-12 col-sm-6 col-lg-4 col-xl-4">

        <!-- =================================================
             Product Card
        ================================================== -->

        <article class="product-family-card" data-href="${escapeHTML(family.href)}">

          <!-- ===============================================
               點擊直接進頁面
          ================================================ -->

          <button
            type="button"
            class="product-family-toggle"
            aria-expanded="false"
            aria-controls="${panelId}"
          >

            <!-- =============================================
                 Card 上方
            ============================================== -->

            <div class="product-family-head">

              <!-- 左側圖片 -->
              <div
                class="product-family-icon"
                aria-hidden="true"
              >

                <img
                  src="${escapeHTML(family.image)}"
                  alt="${escapeHTML(family.title)}"
                  class="product-family-img"
                >

              </div>

              <!-- 右側名稱 -->
              <div class="product-family-name-wrap">

                <h2 class="product-family-name">

                  ${escapeHTML(family.title)}

                </h2>

              </div>

            </div>

          </button>

          <!-- ===============================================
               Related Products
          ================================================ -->

          <div class="product-family-body" id="${panelId}">

            <div class="related-title">

              Related Products

            </div>

            <ul class="related-list">

              ${family.products.map((item) => `

                <li>

                  <a href="${escapeHTML(item.href)}">

                    ${escapeHTML(item.name)}

                  </a>

                </li>

              `).join("")}

            </ul>

            <a class="product-family-cta" href="${escapeHTML(family.href)}">

              View ${escapeHTML(family.title)}

            </a>

          </div>

        </article>

      </div>

    `;

  }).join("");

}

function bindProductCardActions() {

  const cards =
    document.querySelectorAll(".product-family-card");

  const mobileQuery =
    window.matchMedia("(max-width: 575.98px)");

  cards.forEach((card) => {

    const toggle =
      card.querySelector(".product-family-toggle");

    const href =
      card.dataset.href;

    if (!toggle || !href) return;

    toggle.setAttribute(
      "aria-expanded",
      String(!mobileQuery.matches)
    );

    toggle.addEventListener("click", () => {

      if (!mobileQuery.matches) {

        window.location.href = href;

        return;

      }

      const isOpen =
        card.classList.toggle("is-open");

      toggle.setAttribute(
        "aria-expanded",
        String(isOpen)
      );

    });

  });

}
