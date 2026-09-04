/** ACE Spot Drill 頁面資料：依序提供下載、程式工具、影片、FAQ 與切削參數給 V2 共用渲染器。 */
const PRODUCT_PAGE_DATA = {
  "productName": "ACE Spot Drill",
  "downloads": [
    {
      "title": "Catalog",
      "image": "",
      "href": ""
    },
    {
      "title": "Cutting Data",
      "image": "",
      "href": ""
    }
  ],
  "programming": {
    "title": "NC Program Generator",
    "desc": "ACE Spot Drill technical support area for catalog downloads, cutting data, NC programming support, and knowledge-base FAQ.",
    "href": ""
  },
  "videos": [
    {
      "title": "Product Introduction Video",
      "desc": "Planning and marketing product video for ACE Spot Drill.",
      "href": "",
      "status": "Coming soon"
    },
    {
      "title": "Machining Application Video",
      "desc": "Application footage for spotting, chamfering, and countersinking.",
      "href": "",
      "status": "Coming soon"
    }
  ],
  "cuttingData": {
    "operations": [
      {
        "id": "spotting",
        "label": "Spotting",
        "showQ": true,
        "insertGroups": [
          {
            "id": "SI06",
            "label": "SI06 - S9MT06T1",
            "diameter": 5.5,
            "spotDepth": {
              "l": { "60": 0.69, "90": 0.25, "120": 0.05, "142": 0.04 },
              "tmax": { "60": 4.1, "90": 2.5, "120": 1.6, "142": 0.95 }
            },
            "angles": {
              "60": { "f": { "carbonLow": [0.01, 0.05], "carbonHigh": [0.01, 0.05], "lowAlloy": [0.01, 0.04], "highAlloy": [0.01, 0.03], "stainless": [0.01, 0.02], "castIron": [0.01, 0.05], "nonFerrous": [0.01, 0.06] } },
              "90": { "f": { "carbonLow": [0.02, 0.08], "carbonHigh": [0.02, 0.08], "lowAlloy": [0.02, 0.07], "highAlloy": [0.02, 0.06], "stainless": [0.01, 0.03], "castIron": [0.02, 0.08], "nonFerrous": [0.03, 0.10] } },
              "120": { "f": { "carbonLow": [0.02, 0.10], "carbonHigh": [0.02, 0.10], "lowAlloy": [0.02, 0.08], "highAlloy": [0.02, 0.07], "stainless": [0.01, 0.03], "castIron": [0.02, 0.10], "nonFerrous": [0.03, 0.12] } },
              "142": { "f": { "carbonLow": [0.02, 0.10], "carbonHigh": [0.02, 0.10], "lowAlloy": [0.02, 0.08], "highAlloy": [0.02, 0.07], "stainless": [0.01, 0.03], "castIron": [0.02, 0.10], "nonFerrous": [0.03, 0.12] } }
            }
          },
          {
            "id": "SI08",
            "label": "SI08 - S9MT0802",
            "diameter": 7.5,
            "spotDepth": {
              "l": { "60": 0.92, "90": 0.34, "120": 0.05, "142": 0.04 },
              "tmax": { "60": 5.6, "90": 3.4, "120": 2.2, "142": 1.29 }
            },
            "angles": {
              "60": { "f": { "carbonLow": [0.02, 0.08], "carbonHigh": [0.02, 0.08], "lowAlloy": [0.02, 0.07], "highAlloy": [0.02, 0.06], "stainless": [0.01, 0.03], "castIron": [0.02, 0.08], "nonFerrous": [0.03, 0.10] } },
              "90": { "f": { "carbonLow": [0.03, 0.10], "carbonHigh": [0.03, 0.10], "lowAlloy": [0.03, 0.08], "highAlloy": [0.03, 0.07], "stainless": [0.01, 0.04], "castIron": [0.03, 0.10], "nonFerrous": [0.03, 0.12] } },
              "120": { "f": { "carbonLow": [0.03, 0.12], "carbonHigh": [0.03, 0.12], "lowAlloy": [0.03, 0.10], "highAlloy": [0.03, 0.08], "stainless": [0.01, 0.04], "castIron": [0.03, 0.12], "nonFerrous": [0.03, 0.15] } },
              "142": { "f": { "carbonLow": [0.03, 0.12], "carbonHigh": [0.03, 0.12], "lowAlloy": [0.03, 0.10], "highAlloy": [0.03, 0.08], "stainless": [0.01, 0.04], "castIron": [0.03, 0.12], "nonFerrous": [0.03, 0.15] } }
            }
          },
          {
            "id": "SI10",
            "label": "SI10 - S9MT1003",
            "diameter": 9.5,
            "spotDepth": {
              "l": { "60": 1.16, "90": 0.42, "120": 0.06, "142": 0.05 },
              "tmax": { "60": 7.1, "90": 4.4, "120": 2.7, "142": 1.64 }
            },
            "angles": {
              "60": { "f": { "carbonLow": [0.03, 0.08], "carbonHigh": [0.03, 0.08], "lowAlloy": [0.03, 0.07], "highAlloy": [0.02, 0.06], "stainless": [0.01, 0.03], "castIron": [0.02, 0.08], "nonFerrous": [0.03, 0.10] } },
              "90": { "f": { "carbonLow": [0.04, 0.15], "carbonHigh": [0.04, 0.15], "lowAlloy": [0.03, 0.12], "highAlloy": [0.03, 0.10], "stainless": [0.01, 0.04], "castIron": [0.03, 0.12], "nonFerrous": [0.04, 0.20] } },
              "120": { "f": { "carbonLow": [0.05, 0.20], "carbonHigh": [0.05, 0.20], "lowAlloy": [0.05, 0.15], "highAlloy": [0.04, 0.12], "stainless": [0.01, 0.04], "castIron": [0.05, 0.15], "nonFerrous": [0.05, 0.25] } },
              "142": { "f": { "carbonLow": [0.05, 0.20], "carbonHigh": [0.05, 0.20], "lowAlloy": [0.05, 0.15], "highAlloy": [0.04, 0.12], "stainless": [0.01, 0.04], "castIron": [0.05, 0.15], "nonFerrous": [0.05, 0.25] } }
            }
          },
          {
            "id": "SI12",
            "label": "SI12 - S9MT1203",
            "diameter": 11.5,
            "spotDepth": {
              "l": { "60": 1.39, "90": 0.51, "120": 0.06, "142": 0.05 },
              "tmax": { "60": 8.6, "90": 5.3, "120": 3.3, "142": 1.98 }
            },
            "angles": {
              "60": { "f": { "carbonLow": [0.03, 0.08], "carbonHigh": [0.03, 0.08], "lowAlloy": [0.03, 0.07], "highAlloy": [0.02, 0.06], "stainless": [0.01, 0.03], "castIron": [0.02, 0.08], "nonFerrous": [0.03, 0.10] } },
              "90": { "f": { "carbonLow": [0.05, 0.20], "carbonHigh": [0.05, 0.20], "lowAlloy": [0.04, 0.15], "highAlloy": [0.04, 0.12], "stainless": [0.01, 0.04], "castIron": [0.04, 0.15], "nonFerrous": [0.05, 0.22] } },
              "120": { "f": { "carbonLow": [0.06, 0.25], "carbonHigh": [0.06, 0.25], "lowAlloy": [0.05, 0.20], "highAlloy": [0.05, 0.16], "stainless": [0.01, 0.04], "castIron": [0.05, 0.20], "nonFerrous": [0.06, 0.25] } },
              "142": { "f": { "carbonLow": [0.06, 0.25], "carbonHigh": [0.06, 0.25], "lowAlloy": [0.05, 0.20], "highAlloy": [0.05, 0.16], "stainless": [0.01, 0.04], "castIron": [0.05, 0.20], "nonFerrous": [0.06, 0.25] } }
            }
          },
          {
            "id": "SI16",
            "label": "SI16 - S9MT1603",
            "diameter": 15.5,
            "spotDepth": {
              "l": { "60": 1.85, "90": 0.68, "120": 0.1, "142": 0.15 },
              "tmax": { "60": 11.6, "90": 7, "120": 4.4, "142": 2.67 }
            },
            "angles": {
              "60": { "f": { "carbonLow": [0.04, 0.10], "carbonHigh": [0.04, 0.10], "lowAlloy": [0.03, 0.08], "highAlloy": [0.02, 0.07], "stainless": [0.01, 0.03], "castIron": [0.03, 0.08], "nonFerrous": [0.04, 0.12] } },
              "90": { "f": { "carbonLow": [0.05, 0.20], "carbonHigh": [0.05, 0.20], "lowAlloy": [0.04, 0.15], "highAlloy": [0.04, 0.12], "stainless": [0.01, 0.04], "castIron": [0.04, 0.15], "nonFerrous": [0.05, 0.25] } },
              "120": { "f": { "carbonLow": [0.06, 0.25], "carbonHigh": [0.06, 0.25], "lowAlloy": [0.05, 0.20], "highAlloy": [0.05, 0.16], "stainless": [0.01, 0.04], "castIron": [0.05, 0.20], "nonFerrous": [0.06, 0.25] } },
              "142": { "f": { "carbonLow": [0.06, 0.25], "carbonHigh": [0.06, 0.25], "lowAlloy": [0.05, 0.20], "highAlloy": [0.05, 0.16], "stainless": [0.01, 0.04], "castIron": [0.05, 0.20], "nonFerrous": [0.06, 0.25] } }
            }
          },
          {
            "id": "SI20",
            "label": "SI20 - S9MT2004",
            "diameter": 19.5,
            "spotDepth": {
              "l": { "60": 2.31, "90": 0.85, "120": 0.1, "142": 0.15 },
              "tmax": { "60": 14.6, "90": 8.9, "120": 5.6, "142": 3.36 }
            },
            "angles": {
              "60": { "f": { "carbonLow": [0.04, 0.10], "carbonHigh": [0.04, 0.10], "lowAlloy": [0.03, 0.08], "highAlloy": [0.02, 0.07], "stainless": [0.01, 0.03], "castIron": [0.03, 0.08], "nonFerrous": [0.04, 0.12] } },
              "90": { "f": { "carbonLow": [0.05, 0.25], "carbonHigh": [0.05, 0.25], "lowAlloy": [0.04, 0.20], "highAlloy": [0.04, 0.15], "stainless": [0.01, 0.04], "castIron": [0.04, 0.20], "nonFerrous": [0.05, 0.30] } },
              "120": { "f": { "carbonLow": [0.06, 0.30], "carbonHigh": [0.06, 0.30], "lowAlloy": [0.05, 0.25], "highAlloy": [0.05, 0.20], "stainless": [0.01, 0.04], "castIron": [0.05, 0.25], "nonFerrous": [0.06, 0.30] } },
              "142": { "f": { "carbonLow": [0.06, 0.30], "carbonHigh": [0.06, 0.30], "lowAlloy": [0.05, 0.25], "highAlloy": [0.05, 0.20], "stainless": [0.01, 0.04], "castIron": [0.05, 0.25], "nonFerrous": [0.06, 0.30] } }
            }
          }
        ],
        "materials": {
          "carbonLow": { "label": "Carbon steel C < 0.3%", "vc": [120, 250], "q": "0.1-0.5 mm", "grade": "NC5254" },
          "carbonHigh": { "label": "Carbon steel C > 0.3%", "vc": [100, 220], "q": "0.1-0.5 mm", "grade": "NC2057" },
          "lowAlloy": { "label": "Low alloy steel C < 0.3%", "vc": [100, 200], "q": "0.1-0.5 mm", "grade": "NC5254" },
          "highAlloy": { "label": "High alloy steel", "vc": [80, 180], "q": "0.1-0.5 mm", "grade": "NC2057" },
          "stainless": { "label": "Stainless steel", "vc": [30, 80], "q": "0.1-0.2 mm", "grade": "NC5254" },
          "castIron": { "label": "Cast Iron", "vc": [80, 180], "q": "0.1-0.5 mm", "grade": "NC2057" },
          "nonFerrous": { "label": "Non-ferrous metal", "vc": [150, 300], "q": "0.2-1.0 mm", "grade": "XP9000" }
        }
      },
      {
        "id": "chamfering",
        "label": "Chamfering",
        "showQ": false,
        "insertGroups": [
          {
            "id": "SI06",
            "label": "SI06 - S9MT06T1",
            "diameter": 5.5,
            "angles": {
              "60": { "f": { "carbonLow": [0.02, 0.05], "carbonHigh": [0.04, 0.16], "lowAlloy": [0.02, 0.05], "highAlloy": [0.04, 0.12], "stainless": [0.01, 0.03], "castIron": [0.04, 0.16], "nonFerrous": [0.02, 0.16] } },
              "90": { "f": { "carbonLow": [0.02, 0.08], "carbonHigh": [0.04, 0.20], "lowAlloy": [0.02, 0.08], "highAlloy": [0.04, 0.16], "stainless": [0.01, 0.04], "castIron": [0.04, 0.20], "nonFerrous": [0.02, 0.20] } },
              "120": { "f": { "carbonLow": [0.02, 0.06], "carbonHigh": [0.04, 0.16], "lowAlloy": [0.02, 0.06], "highAlloy": [0.04, 0.14], "stainless": [0.01, 0.04], "castIron": [0.04, 0.16], "nonFerrous": [0.02, 0.16] } },
              "142": { "f": { "carbonLow": [0.02, 0.05], "carbonHigh": [0.04, 0.14], "lowAlloy": [0.02, 0.05], "highAlloy": [0.04, 0.12], "stainless": [0.01, 0.03], "castIron": [0.04, 0.14], "nonFerrous": [0.02, 0.14] } }
            }
          },
          {
            "id": "SI08",
            "label": "SI08 - S9MT0802",
            "diameter": 7.5,
            "angles": {
              "60": { "f": { "carbonLow": [0.03, 0.06], "carbonHigh": [0.06, 0.20], "lowAlloy": [0.03, 0.06], "highAlloy": [0.06, 0.18], "stainless": [0.01, 0.03], "castIron": [0.06, 0.18], "nonFerrous": [0.03, 0.20] } },
              "90": { "f": { "carbonLow": [0.03, 0.10], "carbonHigh": [0.06, 0.30], "lowAlloy": [0.03, 0.10], "highAlloy": [0.06, 0.25], "stainless": [0.01, 0.04], "castIron": [0.06, 0.25], "nonFerrous": [0.03, 0.30] } },
              "120": { "f": { "carbonLow": [0.03, 0.08], "carbonHigh": [0.06, 0.20], "lowAlloy": [0.03, 0.08], "highAlloy": [0.06, 0.18], "stainless": [0.01, 0.04], "castIron": [0.06, 0.18], "nonFerrous": [0.03, 0.20] } },
              "142": { "f": { "carbonLow": [0.03, 0.08], "carbonHigh": [0.06, 0.16], "lowAlloy": [0.03, 0.08], "highAlloy": [0.06, 0.14], "stainless": [0.01, 0.03], "castIron": [0.06, 0.14], "nonFerrous": [0.03, 0.16] } }
            }
          },
          {
            "id": "SI10",
            "label": "SI10 - S9MT1003",
            "diameter": 9.5,
            "angles": {
              "60": { "f": { "carbonLow": [0.04, 0.08], "carbonHigh": [0.08, 0.30], "lowAlloy": [0.04, 0.08], "highAlloy": [0.08, 0.25], "stainless": [0.01, 0.04], "castIron": [0.08, 0.25], "nonFerrous": [0.04, 0.30] } },
              "90": { "f": { "carbonLow": [0.04, 0.12], "carbonHigh": [0.08, 0.40], "lowAlloy": [0.04, 0.10], "highAlloy": [0.08, 0.30], "stainless": [0.01, 0.06], "castIron": [0.08, 0.30], "nonFerrous": [0.04, 0.40] } },
              "120": { "f": { "carbonLow": [0.04, 0.08], "carbonHigh": [0.08, 0.30], "lowAlloy": [0.04, 0.08], "highAlloy": [0.08, 0.25], "stainless": [0.01, 0.04], "castIron": [0.08, 0.25], "nonFerrous": [0.04, 0.30] } },
              "142": { "f": { "carbonLow": [0.04, 0.08], "carbonHigh": [0.08, 0.30], "lowAlloy": [0.04, 0.08], "highAlloy": [0.08, 0.25], "stainless": [0.01, 0.04], "castIron": [0.08, 0.25], "nonFerrous": [0.04, 0.30] } }
            }
          },
          {
            "id": "SI12",
            "label": "SI12 - S9MT1203",
            "diameter": 11.5,
            "angles": {
              "60": { "f": { "carbonLow": [0.06, 0.10], "carbonHigh": [0.10, 0.40], "lowAlloy": [0.06, 0.10], "highAlloy": [0.10, 0.30], "stainless": [0.02, 0.06], "castIron": [0.10, 0.30], "nonFerrous": [0.06, 0.40] } },
              "90": { "f": { "carbonLow": [0.06, 0.16], "carbonHigh": [0.10, 0.50], "lowAlloy": [0.06, 0.16], "highAlloy": [0.10, 0.40], "stainless": [0.02, 0.08], "castIron": [0.10, 0.40], "nonFerrous": [0.06, 0.50] } },
              "120": { "f": { "carbonLow": [0.06, 0.12], "carbonHigh": [0.10, 0.50], "lowAlloy": [0.06, 0.12], "highAlloy": [0.10, 0.40], "stainless": [0.02, 0.08], "castIron": [0.10, 0.40], "nonFerrous": [0.06, 0.50] } },
              "142": { "f": { "carbonLow": [0.06, 0.10], "carbonHigh": [0.10, 0.40], "lowAlloy": [0.06, 0.10], "highAlloy": [0.10, 0.30], "stainless": [0.02, 0.06], "castIron": [0.10, 0.30], "nonFerrous": [0.06, 0.40] } }
            }
          },
          {
            "id": "SI16",
            "label": "SI16 - S9MT1603",
            "diameter": 15.5,
            "angles": {
              "60": { "f": { "carbonLow": [0.06, 0.10], "carbonHigh": [0.10, 0.40], "lowAlloy": [0.06, 0.10], "highAlloy": [0.10, 0.30], "stainless": [0.02, 0.06], "castIron": [0.10, 0.30], "nonFerrous": [0.06, 0.40] } },
              "90": { "f": { "carbonLow": [0.06, 0.16], "carbonHigh": [0.10, 0.50], "lowAlloy": [0.06, 0.16], "highAlloy": [0.10, 0.40], "stainless": [0.02, 0.08], "castIron": [0.10, 0.40], "nonFerrous": [0.06, 0.50] } },
              "120": { "f": { "carbonLow": [0.06, 0.12], "carbonHigh": [0.10, 0.50], "lowAlloy": [0.06, 0.12], "highAlloy": [0.10, 0.40], "stainless": [0.02, 0.08], "castIron": [0.10, 0.40], "nonFerrous": [0.06, 0.50] } },
              "142": { "f": { "carbonLow": [0.06, 0.10], "carbonHigh": [0.10, 0.40], "lowAlloy": [0.06, 0.10], "highAlloy": [0.10, 0.30], "stainless": [0.02, 0.06], "castIron": [0.10, 0.30], "nonFerrous": [0.06, 0.40] } }
            }
          },
          {
            "id": "SI20",
            "label": "SI20 - S9MT2004",
            "diameter": 19.5,
            "angles": {
              "60": { "f": { "carbonLow": [0.06, 0.10], "carbonHigh": [0.10, 0.40], "lowAlloy": [0.06, 0.10], "highAlloy": [0.10, 0.30], "stainless": [0.02, 0.06], "castIron": [0.10, 0.30], "nonFerrous": [0.06, 0.40] } },
              "90": { "f": { "carbonLow": [0.06, 0.16], "carbonHigh": [0.10, 0.50], "lowAlloy": [0.06, 0.16], "highAlloy": [0.10, 0.40], "stainless": [0.02, 0.08], "castIron": [0.10, 0.40], "nonFerrous": [0.06, 0.50] } },
              "120": { "f": { "carbonLow": [0.06, 0.12], "carbonHigh": [0.10, 0.50], "lowAlloy": [0.06, 0.12], "highAlloy": [0.10, 0.40], "stainless": [0.02, 0.08], "castIron": [0.10, 0.40], "nonFerrous": [0.06, 0.50] } },
              "142": { "f": { "carbonLow": [0.06, 0.10], "carbonHigh": [0.10, 0.40], "lowAlloy": [0.06, 0.10], "highAlloy": [0.10, 0.30], "stainless": [0.02, 0.06], "castIron": [0.10, 0.30], "nonFerrous": [0.06, 0.40] } }
            }
          }
        ],
        "materials": {
          "carbonLow": { "label": "Carbon steel C < 0.3%", "vc": [60, 150], "grade": "NC5254" },
          "carbonHigh": { "label": "Carbon steel C > 0.3%", "vc": [60, 150], "grade": "NC2057" },
          "lowAlloy": { "label": "Low alloy steel C < 0.3%", "vc": [40, 120], "grade": "NC5254" },
          "highAlloy": { "label": "High alloy steel", "vc": [40, 100], "grade": "NC2057" },
          "stainless": { "label": "Stainless steel", "vc": [30, 80], "grade": "NC5254" },
          "castIron": { "label": "Cast Iron", "vc": [40, 120], "grade": "NC2057" },
          "nonFerrous": { "label": "Non-ferrous metal", "vc": [90, 200], "grade": "XP9000" }
        }
      }
    ]
  },
  "faqs": [
    {
      "topic": "Technical FAQ",
      "question": "ACE 可以取代 NC Spot Drill 嗎？",
      "answer": "可以在特定 spotting / 定位應用中取代，但要確認客戶要求的是孔口直徑、深度、角度還是靜點尺寸。`120°` 案例中，`φ10、Ap=2 mm` 會得到約 `136.4°` 的開口角與 `3.07 mm` 靜點，不一定等同傳統 NC Spot Drill 的結果。"
    },
    {
      "topic": "Technical FAQ",
      "question": "ACE 加工深度超過多少要啄鑽？",
      "answer": "經驗規則：60° 加工深度小於 `Tmax/3` 可不啄鑽；超過 `Tmax/3` 建議啄鑽。深加工若不啄鑽，排屑不佳可能造成擠壓、摩擦、破裂、崩刃。"
    },
    {
      "topic": "Technical FAQ",
      "question": "啄鑽 Q 值怎麼抓？",
      "answer": "先計算 `t/Tmax`，再依參數圖表或經驗起測。信件案例：\n\n- `S9MT1603-060`，`t/Tmax=0.535`，建議 `Q=0.3 mm`。\n- `S9MT1003-060`，孔約 4.8~5 mm，建議 `Q=0.2 mm`。\n- `S9MT2004-060`，切深 8.8 mm，曾提供 `Q=0.3` 與 `Q=0.5` 的加工時間比較。"
    },
    {
      "topic": "Technical FAQ",
      "question": "不銹鋼 316L 用什麼參數？",
      "answer": "信件建議：\n\nS9MT0802-090 NC5254\nVc = 30~60 m/min\nf = 0.01~0.04 mm/rev"
    },
    {
      "topic": "Technical FAQ",
      "question": "鋁合金 A5050 / A7070 點面壽命不好怎麼判斷？",
      "answer": "先看是否有崩刃與震動。信件中客戶用 `S=2400 rpm, F=300~400 mm/min`，加工徑 14 mm，推算 `Vc≈105 m/min, f≈0.125~0.16 mm/rev`，參數本身不算特殊。若壽命不好，應追問實際孔數、磨耗照片、夾持剛性、冷卻、是否震動。"
    },
    {
      "topic": "Technical FAQ",
      "question": "SKD11 壽命不足怎麼改善？",
      "answer": "SKD11 是高碳高合金冷作模具鋼，抗磨性高，刀片損耗大。建議降低 `Vc`，保持或提高每轉進給。信件案例：`S=4000 -> 2000 rpm`、`S=5000 -> 2500 rpm`，`F` 暫維持不變。若表面粗糙度不佳，再降低 `F`。"
    },
    {
      "topic": "Technical FAQ",
      "question": "ACE 120° 加工後角度不準，是刀片角度問題嗎？",
      "answer": "不一定。生產紀錄中 120° 刀片角度約 `119.6°~120.3°`，若刀片量測正常，問題可能來自切削側推力、量測位置、倒角尺寸、速度、鍛造件夾持定位或先加工小孔造成的影響。可嘗試分刀精修、降低轉速與進給、先倒角後加工小孔。"
    },
    {
      "topic": "Technical FAQ",
      "question": "SCM415 加工 M6 定位孔容易破或毛邊怎麼辦？",
      "answer": "SCM415 低碳合金鋼較不易斷屑。若 M6 定位孔包含倒角，孔尺寸可能大於 7 mm 甚至接近 8 mm。建議使用 `NC5254` 降低切削阻力，或加大使用 `SI10` 刀片以改善接近滿刀造成的排屑問題。"
    },
    {
      "topic": "Technical FAQ",
      "question": "客戶只有提供 NC 程式，能直接建議嗎？",
      "answer": "不建議直接下結論。若程式深度跨度超過刀片 `Tmax`，或看起來像螺旋加工，需請客戶提供工件圖、加工剖面、目標尺寸與刀具路徑。案例中 `S9MT0802-060` 的 `Tmax=5.6 mm`，但客戶程式 Z 跨度達 `12.957 mm`，明顯需補資料。"
    },
    {
      "topic": "Technical FAQ",
      "question": "刀片寄回檢查時，為什麼還要客戶補資料？",
      "answer": "單看刀片照片只能判斷磨耗外觀，無法知道每個刃口對應的加工條件。若同一刀片不同刃口磨耗差異很大，常見原因是客戶做了不同測試。需補材料、加工條件、孔尺寸、深度、冷卻、夾持與每個刃口的使用紀錄。"
    },
    {
      "topic": "Technical FAQ",
      "question": "ACE 刀桿柄部公差是多少？",
      "answer": "信件回覆為：柄部軸公差設定 `h7`。"
    },
    {
      "topic": "Technical FAQ",
      "question": "ACE 可以做 Morse taper 或左轉特殊刀片嗎？",
      "answer": "信件回覆：\n\n- Morse taper：目前星艦刀桿沒有承接。\n- 左轉或特殊刀片：目前尚未開放訂製特殊刀片計畫。"
    },
    {
      "topic": "Technical FAQ",
      "question": "ACE 是否可用在車床？",
      "answer": "有車床用方柄圖面案例，例如 `99688-SI08-12方柄` / `99688-SI08-L1212MF`。但需以圖面確認尺寸、刀片位置與客戶機台需求，不能直接視為標準品全系列可供。"
    },
    {
      "topic": "Technical FAQ",
      "question": "刀片安裝要注意什麼？",
      "answer": "刀座與刀片需清潔，刀片要完全平貼刀座並用手壓緊，再鎖螺絲。建議用扭力扳手。刀片未貼平可能造成偏擺、角度誤差、震動、崩刃。"
    },
    {
      "topic": "Technical FAQ",
      "question": "ACE 的設計變更重點是什麼？",
      "answer": "2023/06/30 設變通知指出：為增加壽命與排屑效果，將鑽尖靜點加厚並加大排屑隙角，讓切屑有足夠空間排出，提高刀片耐用度。"
    }
  ]
};
