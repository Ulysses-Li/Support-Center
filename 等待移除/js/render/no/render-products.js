/* =========================================================
   Render Products
   用途：
   把 PRODUCT_CATEGORIES 資料轉成首頁產品分類 Card
========================================================= */

function renderProductCategories(categories, targetId) {

  const target = document.getElementById(targetId);

  if (!target) {
    console.error("找不到指定容器：" + targetId);
    return;
  }

  target.innerHTML = categories.map(category => {

    return `
      <div class="col-12 col-md-6 col-lg-4">
        <a href="${category.href}" class="product-category-card">

          <div class="category-icon">
            <i class="${category.icon}"></i>
          </div>

          <h3>${category.title}</h3>

          <p>${category.description}</p>

          <span class="product-count">
            ${category.products.length} Products
          </span>

        </a>
      </div>
    `;

  }).join("");
}
