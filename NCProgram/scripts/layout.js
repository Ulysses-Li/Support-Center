(function () {
    // 用意：讀取目前 script 標籤上的設定，讓不同子資料夾共用同一個版型載入器。
    const layoutScript = document.currentScript;
    const headerUrl = layoutScript?.dataset.headerUrl || '../header/header.html';
    const footerUrl = layoutScript?.dataset.footerUrl || '../footer/footer.html';

    // 用意：將外部 HTML 元件載入指定容器，集中處理回應錯誤。
    async function loadFragment(targetId, url) {
        const target = document.getElementById(targetId);
        if (!target) return;

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Unable to load ${url}: ${response.status}`);
        }

        target.innerHTML = await response.text();
    }

    // 用意：同時載入頁首與頁尾，完成後再綁定手機版選單事件。
    async function loadLayout() {
        try {
            await Promise.all([
                loadFragment('header-placeholder', headerUrl),
                loadFragment('footer-placeholder', footerUrl)
            ]);

            const mobileMenuBtn = document.getElementById('mobileMenuBtn');
            const topNav = document.getElementById('topNav');

            if (mobileMenuBtn && topNav) {
                mobileMenuBtn.addEventListener('click', function () {
                    topNav.classList.toggle('active');
                    mobileMenuBtn.setAttribute(
                        'aria-expanded',
                        String(topNav.classList.contains('active'))
                    );
                });
            }
        } catch (error) {
            // 用意：載入失敗時保留明確訊息，方便從瀏覽器主控台追查路徑問題。
            console.error('Failed to load the shared site layout.', error);
        }
    }

    loadLayout();
}());
