/*
=========================================================
products-render.js

用意：
1. 讀取 products-data.js 的 PRODUCT_FAMILIES
2. 自動產生 Products Card
3. 點擊 Card 直接進入產品頁
4. 桌面版直接前往分類頁，手機版使用單開式展開卡片
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

        <article class="product-family-card${index === 0 ? " is-open" : ""}" data-href="${escapeHTML(family.href)}">

          <!-- 桌面版頂端雙品牌色識別線；手機版會轉為左側橘線。 -->
          <span class="family-accent" aria-hidden="true"></span>

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

                <!-- 分類編號協助使用者快速辨識十二個加工家族。 -->
                <span class="family-number">

                  FAMILY ${String(index + 1).padStart(2, "0")}

                </span>

                <h2 class="product-family-name">

                  ${escapeHTML(family.title)}

                </h2>

              </div>

              <!-- 手機版展開提示：使用 Bootstrap Icons 的向下箭頭，卡片開啟時由 CSS 旋轉為向上。 -->
              <span class="family-chevron" aria-hidden="true">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chevron-down" viewBox="0 0 16 16">
                  <path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708"/>
                </svg>
              </span>

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

                    <!-- Bootstrap Icons arrow-right：提示此列可前往產品頁。 -->
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-right" viewBox="0 0 16 16" aria-hidden="true">
                      <path fill-rule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8"/>
                    </svg>

                  </a>

                </li>

              `).join("")}

            </ul>

            <a class="product-family-cta" href="${escapeHTML(family.href)}">

              View ${escapeHTML(family.title)}

              <!-- Bootstrap Icons arrow-right：提示主要操作會進入分類頁。 -->
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-right" viewBox="0 0 16 16" aria-hidden="true">
                <path fill-rule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8"/>
              </svg>

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

  /* 同步桌面與手機的 aria-expanded，讓輔助技術讀到正確狀態。 */
  function syncResponsiveState() {

    cards.forEach((card) => {

      const toggle =
        card.querySelector(".product-family-toggle");

      if (!toggle) return;

      toggle.setAttribute(
        "aria-expanded",
        mobileQuery.matches
          ? String(card.classList.contains("is-open"))
          : "true"
      );

    });

  }

  cards.forEach((card) => {

    const toggle =
      card.querySelector(".product-family-toggle");

    const href =
      card.dataset.href;

    if (!toggle || !href) return;

    toggle.addEventListener("click", () => {

      if (!mobileQuery.matches) {

        window.location.href = href;

        return;

      }

      const willOpen =
        !card.classList.contains("is-open");

      /* 手機版一次只展開一張卡片，縮短頁面並維持瀏覽位置清楚。 */
      cards.forEach((otherCard) => {

        otherCard.classList.remove("is-open");

        const otherToggle =
          otherCard.querySelector(".product-family-toggle");

        if (otherToggle) {

          otherToggle.setAttribute("aria-expanded", "false");

        }

      });

      if (willOpen) {

        card.classList.add("is-open");
        toggle.setAttribute("aria-expanded", "true");

      }

    });

  });

  mobileQuery.addEventListener("change", syncResponsiveState);
  syncResponsiveState();

}
