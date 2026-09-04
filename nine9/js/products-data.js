/* =========================================================
   Nine9 Product Families
   用意：
   以陣列集中管理產品總覽卡片；每筆資料定義名稱、分類、圖片、連結與可展開的簡介。
   1. 集中管理所有產品分類
   2. 未來新增產品只要修改這份檔案
   3. 前端 Card / Menu / Sidebar 都可共用
   4. 結構化方便維護
========================================================= */

const PRODUCT_FAMILIES = [
  {
    title: "Spotting",
    image: "../img/spotting.png",
    href: "../Machining/Spotting/index.html",
    products: [
      { name: "ACE Spot Drill", href: "../Products/AceSpotDrill/indexV2.0.html" },
      { name: "Micro Spot Drill", href: "../Products/MicroSpotDrill/index.html" },
      { name: "NC Spot Drill", href: "../Products/NCSpotDrill/index.html" }
    ]
  },

  {
    title: "Centering",
    image: "../img/centering.png",
    href: "../Machining/Centering/index.html",
    products: [
      { name: "i-Center Center Drill", href: "../Products/ICenter/index.html" }
    ]
  },

  {
    title: "Drilling",
    image: "../img/drilling.png",
    href: "../Machining/Drilling/index.html",
    products: [
      { name: "Super Drill", href: "../Products/SuperDrill/index.html" },
      { name: "Super Power Drill", href: "../Products/SuperPowerDrill/index.html" }
    ]
  },

  {
    title: "Boring",
    image: "../img/boring.png",
    href: "../Machining/Boring/index.html",
    products: [
      { name: "NineBore Boring Tool", href: "../Products/NineBore/index.html" },
      { name: "NineSwiss Modular Head Boring Tool", href: "../Products/NineSwissBoring/index.html" }
    ]
  },

  {
    title: "Milling",
    image: "../img/milling.png",
    href: "../Machining/Milling/index.html",
    products: [
      { name: "Power Mill", href: "../Products/PowerMill/index.html" }
    ]
  },

  {
    title: "NC Helix Drill",
    image: "../img/helix.png",
    href: "../Machining/NC_Helix_Drill/index.html",
    products: [
      { name: "NC Helix Drill", href: "../Products/NCHelixDrill/index.html" }
    ]
  },

  {
    title: "Threading",
    image: "../img/threading.png",
    href: "../Machining/Threading/index.html",
    products: [
      { name: "MCC Thread Mill", href: "../Products/MCCThreadMill/index.html" }
    ]
  },

  {
    title: "Engraving",
    image: "../img/engraving.png",
    href: "../Machining/Engraving/index.html",
    products: [
      { name: "X060", href: "../Products/X060/index.html" },
      { name: "V060 / V045", href: "../Products/V060/index.html" },
      { name: "W060", href: "../Products/W060/index.html" },
      { name: "N9MT-W", href: "../Products/N9MTW/index.html" },
      { name: "NC Spot Drill", href: "../Products/NCSpotDrill/index.html" }
    ]
  },

  {
    title: "Chamfering & Corner Radii",
    image: "../img/chamfering.png",
    href: "../Machining/Chamfering_Corner_Radii/index.html",
    products: [
      { name: "Chamfer Mill", href: "../Products/ChamferMill/index.html" },
      { name: "ACE Spot Drill", href: "../Products/AceSpotDrill/indexV2.0.html" },
      { name: "NC Spot Drill", href: "../Products/NCSpotDrill/index.html" },
      { name: "Corner Rounding_RC Type", href: "../Products/CornerRoundingRC/index.html" },
      { name: "Corner Rounding_R Type", href: "../Products/CornerRoundingR/index.html" }
    ]
  },

  {
    title: "Deburring",
    image: "../img/deburring.png",
    href: "../Machining/Deburring/index.html",
    products: [
      { name: "NC Deburring", href: "../Products/NCDeburring/index.html" },
      { name: "MCC Deburring Mill", href: "../Products/MCCDeburring/index.html" }
    ]
  },

  {
    title: "Turning",
    image: "../img/turning.png",
    href: "../Machining/Turning/index.html",
    products: [
      { name: "NineSwiss Modular Head Turning Tool", href: "../Products/NineSwissTurning/index.html" },
      { name: "NineSwiss Modular Head Boring Tool", href: "../Products/NineSwissBoring/index.html" }
    ]
  },

  {
    title: "ER Taper-Shank Cutter",
    image: "../img/Ergo.png",
    href: "../Machining/ER_Taper-Shank_Cutter/index.html",
    products: [
      { name: "Ergo ER Taper-Shank Cutter", href: "../Products/ErgoER/index.html" }
    ]
  }
];
