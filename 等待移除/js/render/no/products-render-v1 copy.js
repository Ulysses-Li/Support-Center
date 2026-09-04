
/* =========================================================
   products-render-v1.js
   用意：
   1. 共用產品頁渲染器
   2. 可依 Category Title 自動切換產品
   3. 共用 Header / Footer
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

  /* =======================================================
     頁面指定分類
     用意：
     每頁只需要改這行
  ======================================================= */

  renderProductsByCategory(
    "Chamfering & Corner Radii"
  );

  loadHeader();
  loadFooter();

});


/* =========================================================
   escapeHTML()
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
   renderProductsByCategory()
   用意：
   從 PRODUCT_CATEGORIES 找指定分類
========================================================= */

function renderProductsByCategory(categoryTitle) {

  const productGrid =
    document.getElementById("productGrid");

  if (!productGrid) return;

  /* =======================================================
     找對應 Category
  ======================================================= */

  const category =
    PRODUCT_CATEGORIES.find(item =>
      item.title === categoryTitle
    );

  if (!category) {

    productGrid.innerHTML =
      "<p>Category Not Found</p>";

    return;

  }

  /* =======================================================
     Render Product Cards
  ======================================================= */

  productGrid.innerHTML =
    category.products.map(product => `

      <a
        href="${escapeHTML(product.href)}"
        class="product-card"
      >

        <div class="product-image-box">

          <img
            src="${escapeHTML(product.image)}"
            alt="${escapeHTML(product.name)}"
          >

          <div class="product-desc">
            ${escapeHTML(product.description)}
          </div>

        </div>

        <div class="product-name">
          ${escapeHTML(product.name)}
        </div>

      </a>

    `).join("");

}

/* =========================================================
   loadHeader()
========================================================= */

function loadHeader() {

  fetch("../../header/header.html")

    .then(response => response.text())

    .then(data => {

      document.getElementById(
        "header-placeholder"
      ).innerHTML = data;

      const mobileMenuBtn =
        document.getElementById("mobileMenuBtn");

      const topNav =
        document.getElementById("topNav");

      if (mobileMenuBtn && topNav) {

        mobileMenuBtn.addEventListener(
          "click",
          function () {

            topNav.classList.toggle("active");

          }
        );

      }

    });

}

/* =========================================================
   loadFooter()
========================================================= */

function loadFooter() {

  fetch("../../footer/footer.html")

    .then(response => response.text())

    .then(data => {

      document.getElementById(
        "footer-placeholder"
      ).innerHTML = data;

    });

}
