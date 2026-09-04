/*
 * NC Helix - 回到頂端按鈕
 * 用意：依捲動位置顯示按鈕，並支援減少動態效果偏好。
 */

// 回到頂端按鈕顯示/隱藏 + 平滑捲動
    (function () {
      const btn = document.getElementById('backToTopBtn');
      if (!btn) return;

      const toggle = () => {
        const y = window.scrollY || document.documentElement.scrollTop;
        if (y > 240) btn.classList.add('show');
        else btn.classList.remove('show');
      };
      window.addEventListener('scroll', toggle, { passive: true });
      toggle();

      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
      });
    })();

    // （如果之後要啟用顏色點圖片切換，保留下面模板）
    // document.querySelectorAll('#product-guide [data-swap-target]').forEach(group => {
    //   const card = group.closest('.product-card');
    //   const img = card?.querySelector('img');
    //   const anchor = card?.querySelector('.img-link');
    //   const dots = group.querySelectorAll('button');
    //   dots.forEach((btn, i) => {
    //     btn.addEventListener('click', () => {
    //       dots.forEach(d => d.querySelector('.color-dot')?.classList.remove('active'));
    //       btn.querySelector('.color-dot')?.classList.add('active');
    //       const src = btn.getAttribute('data-img'); if (src && img) img.src = src;
    //       const url = btn.getAttribute('data-url'); if (url && anchor) anchor.href = url;
    //     });
    //     if (i === 0) btn.querySelector('.color-dot')?.classList.add('active');
    //   });
    // });
