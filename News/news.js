/**
 * 新聞頁資料與卡片渲染。
 * 新聞內容連到官方網站，因此此處只維護日期、摘要與外部網址。
 */
const NEWS_ITEMS = [
  {
    date: "2026-02-12",
    title: "2026 Lunar New Year Holiday",
    summary: "Nine9 holiday notice for Lunar New Year. Office will be closed from Feb. 13 to Feb. 22, 2026 and reopen on Feb. 23, 2026.",
    url: "https://nine9.jic-tools.com.tw/news/2026-Lunar-New-Year-Holiday.html"
  },
  {
    date: "2026-01-27",
    title: "Thread Milling For Hardened steel up to HRC50",
    summary: "NPT/PT thread milling application for stainless steel and hardened steel, showing a two-step process for cleaner and stronger threads.",
    url: "https://nine9.jic-tools.com.tw/news/Precision-Tapered-Thread-Milling-For-Stainless-Steel-Hardened-steel-up-to-HRC50.html"
  },
  {
    date: "2025-08-12",
    title: "Meet Nine9 indexable cutting tools at EMO 2025",
    summary: "Nine9 EMO Hannover 2025 exhibition announcement, featuring Minimum Consumable Cutting and multi-function cutting tools.",
    url: "https://nine9.jic-tools.com.tw/news/Meet-Nine9-indexable-cutting-tools-at-EMO-2025.html"
  },
  {
    date: "2025-05-14",
    title: "Successful Story_Mass-Producing Taps with indexable center drill",
    summary: "A production case showing how Nine9 i-Center drill improves stable positioning and reduces tooling cost for tap manufacturing.",
    url: "https://nine9.jic-tools.com.tw/news/Successful-Story_Mass-Producing-Taps-with-indexable-center-drill.html"
  },
  {
    date: "2025-02-11",
    title: "Indexable center drill application for gear shaft center hole",
    summary: "Application case for gear shaft center hole machining, comparing conventional HSS drilling with Nine9 indexable i-Center performance.",
    url: "https://nine9.jic-tools.com.tw/news/Gear-Shaft-Center-Hole-No-more-frequent-tool-changes-and-slow-drilling-cycles.html"
  },
  {
    date: "2024-04-16",
    title: "No need to choose, Nine9 does it all",
    summary: "Nine9 multi-functional cutting tool overview, covering patented tooling for spotting, chamfering, engraving, and hole making.",
    url: "https://nine9.jic-tools.com.tw/news/No-need-to-choose-Nine9-does-it-all.html"
  },
  {
    date: "2022-05-09",
    title: "Successful Story - Drill Dia 40 x 390mm hole",
    summary: "Super Power Drill application story for deep hole drilling on 39 NiCr material with indexable drill performance.",
    url: "https://nine9.jic-tools.com.tw/news-pages-4-0.htm"
  },
  {
    date: "2022-02-25",
    title: "5 Things You Need to Know about the NC Helix Drill",
    summary: "NC Helix Drill application notes for rough milling, drilling, and slotting with one multi-tasking tool.",
    url: "https://nine9.jic-tools.com.tw/news-pages-4-0.htm"
  },
  {
    date: "2019-01-23",
    title: "Nine9 Main Catalog Released",
    summary: "Nine9 whole series catalog release covering NC spot drill, corner rounding, i-Center, engraving tools, NC deburring, and chamfer mill.",
    url: "https://nine9.jic-tools.com.tw/news-pages-9-0.htm"
  }
];

// 編碼資料中的 HTML 特殊字元，確保卡片內容只以文字顯示。
function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// 將新聞資料轉成可點擊的外部連結卡片。
function renderNewsCards() {
  const grid = document.getElementById("newsGrid");
  if (!grid) return;

  grid.innerHTML = NEWS_ITEMS.map(item => `
    <a class="news-card" href="${escapeHTML(item.url)}" target="_blank" rel="noopener">
      <span class="news-date">${escapeHTML(item.date)}</span>
      <h3>${escapeHTML(item.title)}</h3>
      <p>${escapeHTML(item.summary)}</p>
      <span class="news-card-footer">
        Read official news
        <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i>
      </span>
    </a>
  `).join("");
}

// 頁面載入完成後才把新聞卡片放進容器。
document.addEventListener("DOMContentLoaded", renderNewsCards);
