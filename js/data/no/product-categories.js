/* =========================================================
   Product Categories Data
   用途：
   首頁產品分類資料，render-products.js 會讀取這份資料產生 Card
========================================================= */

const PRODUCT_CATEGORIES = [

  {
    title: "Spotting",
    icon: "fa-solid fa-location-crosshairs",
    description: "Spot drilling, centering and positioning applications.",
    href: "./Products/Spotting/index.html",
    products: [
      "ACE Spot Drill",
      "Micro Spot Drill",
      "NC Spot Drill"
    ]
  },

  {
    title: "Drilling",
    icon: "fa-solid fa-circle-dot",
    description: "Replaceable insert drilling and high efficiency hole making.",
    href: "./Products/Drilling/index.html",
    products: [
      "Super Drill",
      "Super Power Drill"
    ]
  },

  {
    title: "Threading",
    icon: "fa-solid fa-arrows-spin",
    description: "Thread milling solutions for internal and external threads.",
    href: "./Products/Threading/index.html",
    products: [
      "MCC Thread Mill"
    ]
  },

  {
    title: "Chamfering & Corner Radii",
    icon: "fa-solid fa-vector-square",
    description: "Chamfering, countersinking and corner rounding applications.",
    href: "./Products/Chamfering_Corner_Radii/index.html",
    products: [
      "Chamfer Mill",
      "Corner Rounding RC Type",
      "Corner Rounding R Type"
    ]
  },

  {
    title: "Engraving",
    icon: "fa-solid fa-pen-nib",
    description: "Engraving, marking and small feature machining.",
    href: "./Products/Engraving/index.html",
    products: [
      "X060",
      "V060 / V045",
      "W060",
      "N9MT-W"
    ]
  },

  {
    title: "Boring",
    icon: "fa-solid fa-bullseye",
    description: "Precision boring and modular boring tool systems.",
    href: "./Products/Boring/index.html",
    products: [
      "NineBore",
      "NineSwiss Boring"
    ]
  }

];
