/* MCC 刀片 Quick Pick：直接由官方 202604 六頁 PDF 的表格抽取。
 * 第 1–3 頁為內牙，第 4–6 頁為外牙；每筆記錄保留原表頁碼。
 * 只統一空白與乘號，合併同一規格的原表候選；不依螺距或舊 NC 資料推算。
 * 重建方式：tools/extract-quick-pick.py --source <官方 PDF 本機路徑>
 */
const MCC_QUICK_PICK = {
  "source": {
    "title": "Quick Pick for MCC Thread Insert",
    "url": "/Products/MCCThreadMill/downloads/Quick_Pick_for_MCC_Thread_insert.pdf",
    "originalUrl": "https://nine9.jic-tools.com.tw/upload_files/download/Quick_Pick_thread_type/Quick_Pick_for_MCC_Thread_insert.pdf",
    "revision": "202604",
    "pages": 6,
    "sha256": "9146998981fb80e83c72e3e8ebde1d839e36e1316b3a9694773b7929c16296e3"
  },
  "standards": [
    {
      "id": "M",
      "label": "M · Metric coarse",
      "angle": 60,
      "kind": "parallel"
    },
    {
      "id": "MF",
      "label": "MF · Metric fine",
      "angle": 60,
      "kind": "parallel"
    },
    {
      "id": "UNC",
      "label": "UNC · Unified coarse",
      "angle": 60,
      "kind": "parallel"
    },
    {
      "id": "UNF",
      "label": "UNF · Unified fine",
      "angle": 60,
      "kind": "parallel"
    },
    {
      "id": "UNEF",
      "label": "UNEF · Unified extra fine",
      "angle": 60,
      "kind": "parallel"
    },
    {
      "id": "G",
      "label": "G (PF) · BSPP",
      "angle": 55,
      "kind": "parallel"
    },
    {
      "id": "PT",
      "label": "PT · BSPT",
      "angle": 55,
      "kind": "tapered"
    },
    {
      "id": "NPT",
      "label": "NPT",
      "angle": 60,
      "kind": "tapered"
    }
  ],
  "inserts": [
    {
      "id": "R06005-05006",
      "diameter": 5.0
    },
    {
      "id": "R06005-05010",
      "diameter": 5.0
    },
    {
      "id": "R06007-06810",
      "diameter": 6.8
    },
    {
      "id": "R06010-08510",
      "diameter": 8.5
    },
    {
      "id": "R06010-10010",
      "diameter": 10.0
    },
    {
      "id": "R06005-05012",
      "diameter": 5.0
    },
    {
      "id": "R06005-05613",
      "diameter": 5.6
    },
    {
      "id": "R06007-07216",
      "diameter": 7.2
    },
    {
      "id": "R06010-09020",
      "diameter": 9.0
    },
    {
      "id": "R06010-09522",
      "diameter": 9.5
    },
    {
      "id": "R06010-10024",
      "diameter": 10.0
    },
    {
      "id": "R05507-06512",
      "diameter": 6.56
    },
    {
      "id": "R05510-10018",
      "diameter": 10.0
    },
    {
      "id": "R05510-09516",
      "diameter": 9.5
    },
    {
      "id": "R05510-10025",
      "diameter": 10.0
    },
    {
      "id": "R06010-09808",
      "diameter": 9.8
    },
    {
      "id": "R06010-10810",
      "diameter": 10.8
    }
  ],
  "rows": [
    {
      "id": "internal-mf-mf-6-0-75",
      "side": "internal",
      "standard": "MF",
      "size": "MF 6 × 0.75",
      "insertIds": [
        "R06005-05006"
      ],
      "page": 1
    },
    {
      "id": "internal-mf-mf-7-0-75",
      "side": "internal",
      "standard": "MF",
      "size": "MF 7 × 0.75",
      "insertIds": [
        "R06005-05006"
      ],
      "page": 1
    },
    {
      "id": "internal-mf-mf-8-0-75",
      "side": "internal",
      "standard": "MF",
      "size": "MF 8 × 0.75",
      "insertIds": [
        "R06005-05006"
      ],
      "page": 1
    },
    {
      "id": "internal-mf-mf-8-1-0",
      "side": "internal",
      "standard": "MF",
      "size": "MF 8 × 1.0",
      "insertIds": [
        "R06005-05010",
        "R06007-06810"
      ],
      "page": 1
    },
    {
      "id": "internal-mf-mf-9-0-75",
      "side": "internal",
      "standard": "MF",
      "size": "MF 9 × 0.75",
      "insertIds": [
        "R06005-05006"
      ],
      "page": 1
    },
    {
      "id": "internal-mf-mf-9-1-0",
      "side": "internal",
      "standard": "MF",
      "size": "MF 9 × 1.0",
      "insertIds": [
        "R06005-05010",
        "R06007-06810"
      ],
      "page": 1
    },
    {
      "id": "internal-mf-mf-10-0-75",
      "side": "internal",
      "standard": "MF",
      "size": "MF 10 × 0.75",
      "insertIds": [
        "R06005-05006"
      ],
      "page": 1
    },
    {
      "id": "internal-mf-mf-10-1-0",
      "side": "internal",
      "standard": "MF",
      "size": "MF 10 × 1.0",
      "insertIds": [
        "R06005-05010",
        "R06007-06810",
        "R06010-08510"
      ],
      "page": 1
    },
    {
      "id": "internal-mf-mf-10-1-25",
      "side": "internal",
      "standard": "MF",
      "size": "MF 10 × 1.25",
      "insertIds": [
        "R06007-06810",
        "R06010-08510"
      ],
      "page": 1
    },
    {
      "id": "internal-mf-mf-11-0-75",
      "side": "internal",
      "standard": "MF",
      "size": "MF 11 × 0.75",
      "insertIds": [
        "R06005-05006"
      ],
      "page": 1
    },
    {
      "id": "internal-mf-mf-11-1-0",
      "side": "internal",
      "standard": "MF",
      "size": "MF 11 × 1.0",
      "insertIds": [
        "R06005-05010",
        "R06007-06810",
        "R06010-08510",
        "R06010-10010"
      ],
      "page": 1
    },
    {
      "id": "internal-mf-mf-12-1-0",
      "side": "internal",
      "standard": "MF",
      "size": "MF 12 × 1.0",
      "insertIds": [
        "R06005-05010",
        "R06007-06810",
        "R06010-08510",
        "R06010-10010"
      ],
      "page": 1
    },
    {
      "id": "internal-mf-mf-12-1-25",
      "side": "internal",
      "standard": "MF",
      "size": "MF 12 × 1.25",
      "insertIds": [
        "R06007-06810",
        "R06010-08510",
        "R06010-10010"
      ],
      "page": 1
    },
    {
      "id": "internal-mf-mf-12-1-5",
      "side": "internal",
      "standard": "MF",
      "size": "MF 12 × 1.5",
      "insertIds": [
        "R06010-08510",
        "R06010-10010"
      ],
      "page": 1
    },
    {
      "id": "internal-mf-mf-14-1-0",
      "side": "internal",
      "standard": "MF",
      "size": "MF 14 × 1.0",
      "insertIds": [
        "R06005-05010",
        "R06007-06810",
        "R06010-08510",
        "R06010-10010"
      ],
      "page": 1
    },
    {
      "id": "internal-mf-mf-14-1-25",
      "side": "internal",
      "standard": "MF",
      "size": "MF 14 × 1.25",
      "insertIds": [
        "R06007-06810",
        "R06010-08510",
        "R06010-10010"
      ],
      "page": 1
    },
    {
      "id": "internal-mf-mf-14-1-5",
      "side": "internal",
      "standard": "MF",
      "size": "MF 14 × 1.5",
      "insertIds": [
        "R06010-08510",
        "R06010-10010"
      ],
      "page": 1
    },
    {
      "id": "internal-mf-mf-15-1-0",
      "side": "internal",
      "standard": "MF",
      "size": "MF 15 × 1.0",
      "insertIds": [
        "R06005-05010",
        "R06007-06810",
        "R06010-08510",
        "R06010-10010"
      ],
      "page": 1
    },
    {
      "id": "internal-mf-mf-15-1-5",
      "side": "internal",
      "standard": "MF",
      "size": "MF 15 × 1.5",
      "insertIds": [
        "R06010-08510",
        "R06010-10010"
      ],
      "page": 1
    },
    {
      "id": "internal-mf-mf-16-1-0",
      "side": "internal",
      "standard": "MF",
      "size": "MF 16 × 1.0",
      "insertIds": [
        "R06005-05010",
        "R06007-06810",
        "R06010-08510",
        "R06010-10010"
      ],
      "page": 1
    },
    {
      "id": "internal-mf-mf-16-1-5",
      "side": "internal",
      "standard": "MF",
      "size": "MF 16 × 1.5",
      "insertIds": [
        "R06010-08510",
        "R06010-10010"
      ],
      "page": 1
    },
    {
      "id": "internal-mf-mf-17-1-0",
      "side": "internal",
      "standard": "MF",
      "size": "MF 17 × 1.0",
      "insertIds": [
        "R06005-05010",
        "R06007-06810",
        "R06010-08510",
        "R06010-10010"
      ],
      "page": 1
    },
    {
      "id": "internal-mf-mf-17-1-5",
      "side": "internal",
      "standard": "MF",
      "size": "MF 17 × 1.5",
      "insertIds": [
        "R06010-08510",
        "R06010-10010"
      ],
      "page": 1
    },
    {
      "id": "internal-mf-mf-18-1-0",
      "side": "internal",
      "standard": "MF",
      "size": "MF 18 × 1.0",
      "insertIds": [
        "R06005-05010",
        "R06007-06810",
        "R06010-08510",
        "R06010-10010"
      ],
      "page": 1
    },
    {
      "id": "internal-mf-mf-18-1-5",
      "side": "internal",
      "standard": "MF",
      "size": "MF 18 × 1.5",
      "insertIds": [
        "R06010-08510",
        "R06010-10010"
      ],
      "page": 1
    },
    {
      "id": "internal-mf-mf-18-2-0",
      "side": "internal",
      "standard": "MF",
      "size": "MF 18 × 2.0",
      "insertIds": [
        "R06010-10010"
      ],
      "page": 1
    },
    {
      "id": "internal-mf-mf-20-1-0",
      "side": "internal",
      "standard": "MF",
      "size": "MF 20 × 1.0",
      "insertIds": [
        "R06005-05010",
        "R06007-06810",
        "R06010-08510",
        "R06010-10010"
      ],
      "page": 1
    },
    {
      "id": "internal-mf-mf-20-1-5",
      "side": "internal",
      "standard": "MF",
      "size": "MF 20 × 1.5",
      "insertIds": [
        "R06010-08510",
        "R06010-10010"
      ],
      "page": 1
    },
    {
      "id": "internal-mf-mf-20-2-0",
      "side": "internal",
      "standard": "MF",
      "size": "MF 20 × 2.0",
      "insertIds": [
        "R06010-10010"
      ],
      "page": 1
    },
    {
      "id": "internal-mf-mf-22-1-0",
      "side": "internal",
      "standard": "MF",
      "size": "MF 22 × 1.0",
      "insertIds": [
        "R06005-05010",
        "R06007-06810",
        "R06010-08510",
        "R06010-10010"
      ],
      "page": 1
    },
    {
      "id": "internal-mf-mf-22-1-5",
      "side": "internal",
      "standard": "MF",
      "size": "MF 22 × 1.5",
      "insertIds": [
        "R06010-08510",
        "R06010-10010"
      ],
      "page": 1
    },
    {
      "id": "internal-mf-mf-22-2-0",
      "side": "internal",
      "standard": "MF",
      "size": "MF 22 × 2.0",
      "insertIds": [
        "R06010-10010"
      ],
      "page": 1
    },
    {
      "id": "internal-mf-mf-24-1-0",
      "side": "internal",
      "standard": "MF",
      "size": "MF 24 × 1.0",
      "insertIds": [
        "R06005-05010",
        "R06007-06810",
        "R06010-08510",
        "R06010-10010"
      ],
      "page": 1
    },
    {
      "id": "internal-mf-mf-24-1-5",
      "side": "internal",
      "standard": "MF",
      "size": "MF 24 × 1.5",
      "insertIds": [
        "R06010-08510",
        "R06010-10010"
      ],
      "page": 1
    },
    {
      "id": "internal-mf-mf-24-2-0",
      "side": "internal",
      "standard": "MF",
      "size": "MF 24 × 2.0",
      "insertIds": [
        "R06010-10010"
      ],
      "page": 1
    },
    {
      "id": "internal-mf-mf-25-1-0",
      "side": "internal",
      "standard": "MF",
      "size": "MF 25 × 1.0",
      "insertIds": [
        "R06005-05010",
        "R06007-06810",
        "R06010-08510",
        "R06010-10010"
      ],
      "page": 1
    },
    {
      "id": "internal-mf-mf-25-1-5",
      "side": "internal",
      "standard": "MF",
      "size": "MF 25 × 1.5",
      "insertIds": [
        "R06010-08510",
        "R06010-10010"
      ],
      "page": 1
    },
    {
      "id": "internal-mf-mf-25-2-0",
      "side": "internal",
      "standard": "MF",
      "size": "MF 25 × 2.0",
      "insertIds": [
        "R06010-10010"
      ],
      "page": 1
    },
    {
      "id": "internal-mf-mf-27-1-0",
      "side": "internal",
      "standard": "MF",
      "size": "MF 27 × 1.0",
      "insertIds": [
        "R06005-05010",
        "R06007-06810",
        "R06010-08510",
        "R06010-10010"
      ],
      "page": 1
    },
    {
      "id": "internal-mf-mf-27-1-5",
      "side": "internal",
      "standard": "MF",
      "size": "MF 27 × 1.5",
      "insertIds": [
        "R06010-08510",
        "R06010-10010"
      ],
      "page": 1
    },
    {
      "id": "internal-mf-mf-27-2-0",
      "side": "internal",
      "standard": "MF",
      "size": "MF 27 × 2.0",
      "insertIds": [
        "R06010-10010"
      ],
      "page": 1
    },
    {
      "id": "internal-mf-mf-28-1-0",
      "side": "internal",
      "standard": "MF",
      "size": "MF 28 × 1.0",
      "insertIds": [
        "R06005-05010",
        "R06007-06810",
        "R06010-08510",
        "R06010-10010"
      ],
      "page": 1
    },
    {
      "id": "internal-mf-mf-28-1-5",
      "side": "internal",
      "standard": "MF",
      "size": "MF 28 × 1.5",
      "insertIds": [
        "R06010-08510",
        "R06010-10010"
      ],
      "page": 1
    },
    {
      "id": "internal-mf-mf-28-2-0",
      "side": "internal",
      "standard": "MF",
      "size": "MF 28 × 2.0",
      "insertIds": [
        "R06010-10010"
      ],
      "page": 1
    },
    {
      "id": "internal-mf-mf-30-1-0",
      "side": "internal",
      "standard": "MF",
      "size": "MF 30 × 1.0",
      "insertIds": [
        "R06005-05010",
        "R06007-06810",
        "R06010-08510",
        "R06010-10010"
      ],
      "page": 1
    },
    {
      "id": "internal-mf-mf-30-1-5",
      "side": "internal",
      "standard": "MF",
      "size": "MF 30 × 1.5",
      "insertIds": [
        "R06010-08510",
        "R06010-10010"
      ],
      "page": 1
    },
    {
      "id": "internal-mf-mf-30-2-0",
      "side": "internal",
      "standard": "MF",
      "size": "MF 30 × 2.0",
      "insertIds": [
        "R06010-10010"
      ],
      "page": 1
    },
    {
      "id": "internal-mf-mf-32-1-5",
      "side": "internal",
      "standard": "MF",
      "size": "MF 32 × 1.5",
      "insertIds": [
        "R06010-08510",
        "R06010-10010"
      ],
      "page": 1
    },
    {
      "id": "internal-mf-mf-32-2-0",
      "side": "internal",
      "standard": "MF",
      "size": "MF 32 × 2.0",
      "insertIds": [
        "R06010-10010"
      ],
      "page": 1
    },
    {
      "id": "internal-mf-mf-33-1-5",
      "side": "internal",
      "standard": "MF",
      "size": "MF 33 × 1.5",
      "insertIds": [
        "R06010-08510",
        "R06010-10010"
      ],
      "page": 1
    },
    {
      "id": "internal-mf-mf-33-2-0",
      "side": "internal",
      "standard": "MF",
      "size": "MF 33 × 2.0",
      "insertIds": [
        "R06010-10010"
      ],
      "page": 1
    },
    {
      "id": "internal-mf-mf-35-1-5",
      "side": "internal",
      "standard": "MF",
      "size": "MF 35 × 1.5",
      "insertIds": [
        "R06010-08510",
        "R06010-10010"
      ],
      "page": 1
    },
    {
      "id": "internal-mf-mf-36-1-5",
      "side": "internal",
      "standard": "MF",
      "size": "MF 36 × 1.5",
      "insertIds": [
        "R06010-08510",
        "R06010-10010"
      ],
      "page": 1
    },
    {
      "id": "internal-mf-mf-36-2-0",
      "side": "internal",
      "standard": "MF",
      "size": "MF 36 × 2.0",
      "insertIds": [
        "R06010-10010"
      ],
      "page": 1
    },
    {
      "id": "internal-mf-mf-39-1-5",
      "side": "internal",
      "standard": "MF",
      "size": "MF 39 × 1.5",
      "insertIds": [
        "R06010-08510",
        "R06010-10010"
      ],
      "page": 1
    },
    {
      "id": "internal-mf-mf-39-2-0",
      "side": "internal",
      "standard": "MF",
      "size": "MF 39 × 2.0",
      "insertIds": [
        "R06010-10010"
      ],
      "page": 1
    },
    {
      "id": "internal-mf-mf-40-1-5",
      "side": "internal",
      "standard": "MF",
      "size": "MF 40 × 1.5",
      "insertIds": [
        "R06010-08510",
        "R06010-10010"
      ],
      "page": 1
    },
    {
      "id": "internal-mf-mf-40-2-0",
      "side": "internal",
      "standard": "MF",
      "size": "MF 40 × 2.0",
      "insertIds": [
        "R06010-10010"
      ],
      "page": 1
    },
    {
      "id": "internal-mf-mf-42-1-5",
      "side": "internal",
      "standard": "MF",
      "size": "MF 42 × 1.5",
      "insertIds": [
        "R06010-08510",
        "R06010-10010"
      ],
      "page": 1
    },
    {
      "id": "internal-mf-mf-42-2-0",
      "side": "internal",
      "standard": "MF",
      "size": "MF 42 × 2.0",
      "insertIds": [
        "R06010-10010"
      ],
      "page": 1
    },
    {
      "id": "internal-mf-mf-45-1-5",
      "side": "internal",
      "standard": "MF",
      "size": "MF 45 × 1.5",
      "insertIds": [
        "R06010-08510",
        "R06010-10010"
      ],
      "page": 1
    },
    {
      "id": "internal-mf-mf-45-2-0",
      "side": "internal",
      "standard": "MF",
      "size": "MF 45 × 2.0",
      "insertIds": [
        "R06010-10010"
      ],
      "page": 1
    },
    {
      "id": "internal-mf-mf-48-1-5",
      "side": "internal",
      "standard": "MF",
      "size": "MF 48 × 1.5",
      "insertIds": [
        "R06010-08510",
        "R06010-10010"
      ],
      "page": 1
    },
    {
      "id": "internal-mf-mf-48-2-0",
      "side": "internal",
      "standard": "MF",
      "size": "MF 48 × 2.0",
      "insertIds": [
        "R06010-10010"
      ],
      "page": 1
    },
    {
      "id": "internal-mf-mf-50-1-5",
      "side": "internal",
      "standard": "MF",
      "size": "MF 50 × 1.5",
      "insertIds": [
        "R06010-08510",
        "R06010-10010"
      ],
      "page": 1
    },
    {
      "id": "internal-mf-mf-50-2-0",
      "side": "internal",
      "standard": "MF",
      "size": "MF 50 × 2.0",
      "insertIds": [
        "R06010-10010"
      ],
      "page": 1
    },
    {
      "id": "internal-mf-mf-52-2-0",
      "side": "internal",
      "standard": "MF",
      "size": "MF 52 × 2.0",
      "insertIds": [
        "R06010-10010"
      ],
      "page": 1
    },
    {
      "id": "internal-mf-mf-55-2-0",
      "side": "internal",
      "standard": "MF",
      "size": "MF 55 × 2.0",
      "insertIds": [
        "R06010-10010"
      ],
      "page": 1
    },
    {
      "id": "internal-mf-mf-56-2-0",
      "side": "internal",
      "standard": "MF",
      "size": "MF 56 × 2.0",
      "insertIds": [
        "R06010-10010"
      ],
      "page": 1
    },
    {
      "id": "internal-mf-mf-58-2-0",
      "side": "internal",
      "standard": "MF",
      "size": "MF 58 × 2.0",
      "insertIds": [
        "R06010-10010"
      ],
      "page": 1
    },
    {
      "id": "internal-mf-mf-60-2-0",
      "side": "internal",
      "standard": "MF",
      "size": "MF 60 × 2.0",
      "insertIds": [
        "R06010-10010"
      ],
      "page": 1
    },
    {
      "id": "internal-mf-mf-62-2-0",
      "side": "internal",
      "standard": "MF",
      "size": "MF 62 × 2.0",
      "insertIds": [
        "R06010-10010"
      ],
      "page": 1
    },
    {
      "id": "internal-mf-mf-64-2-0",
      "side": "internal",
      "standard": "MF",
      "size": "MF 64 × 2.0",
      "insertIds": [
        "R06010-10010"
      ],
      "page": 1
    },
    {
      "id": "internal-mf-mf-65-2-0",
      "side": "internal",
      "standard": "MF",
      "size": "MF 65 × 2.0",
      "insertIds": [
        "R06010-10010"
      ],
      "page": 1
    },
    {
      "id": "internal-mf-mf-68-2-0",
      "side": "internal",
      "standard": "MF",
      "size": "MF 68 × 2.0",
      "insertIds": [
        "R06010-10010"
      ],
      "page": 1
    },
    {
      "id": "internal-mf-mf-70-2-0",
      "side": "internal",
      "standard": "MF",
      "size": "MF 70 × 2.0",
      "insertIds": [
        "R06010-10010"
      ],
      "page": 1
    },
    {
      "id": "internal-mf-mf-72-2-0",
      "side": "internal",
      "standard": "MF",
      "size": "MF 72 × 2.0",
      "insertIds": [
        "R06010-10010"
      ],
      "page": 1
    },
    {
      "id": "internal-mf-mf-75-2-0",
      "side": "internal",
      "standard": "MF",
      "size": "MF 75 × 2.0",
      "insertIds": [
        "R06010-10010"
      ],
      "page": 1
    },
    {
      "id": "internal-mf-mf-76-2-0",
      "side": "internal",
      "standard": "MF",
      "size": "MF 76 × 2.0",
      "insertIds": [
        "R06010-10010"
      ],
      "page": 1
    },
    {
      "id": "internal-mf-mf-80-2-0",
      "side": "internal",
      "standard": "MF",
      "size": "MF 80 × 2.0",
      "insertIds": [
        "R06010-10010"
      ],
      "page": 1
    },
    {
      "id": "internal-m-m6-1",
      "side": "internal",
      "standard": "M",
      "size": "M6 × 1",
      "insertIds": [
        "R06005-05010"
      ],
      "page": 2
    },
    {
      "id": "internal-m-m7-1",
      "side": "internal",
      "standard": "M",
      "size": "M7 × 1",
      "insertIds": [
        "R06005-05010"
      ],
      "page": 2
    },
    {
      "id": "internal-m-m8-1-25",
      "side": "internal",
      "standard": "M",
      "size": "M8 × 1.25",
      "insertIds": [
        "R06007-06810"
      ],
      "page": 2
    },
    {
      "id": "internal-m-m9-1-25",
      "side": "internal",
      "standard": "M",
      "size": "M9 × 1.25",
      "insertIds": [
        "R06007-06810"
      ],
      "page": 2
    },
    {
      "id": "internal-m-m10-1-5",
      "side": "internal",
      "standard": "M",
      "size": "M10 × 1.5",
      "insertIds": [
        "R06010-08510"
      ],
      "page": 2
    },
    {
      "id": "internal-m-m11-1-5",
      "side": "internal",
      "standard": "M",
      "size": "M11 × 1.5",
      "insertIds": [
        "R06010-08510"
      ],
      "page": 2
    },
    {
      "id": "internal-m-m12-1-75",
      "side": "internal",
      "standard": "M",
      "size": "M12 × 1.75",
      "insertIds": [
        "R06010-10010"
      ],
      "page": 2
    },
    {
      "id": "internal-m-m14-2",
      "side": "internal",
      "standard": "M",
      "size": "M14 × 2",
      "insertIds": [
        "R06010-10010"
      ],
      "page": 2
    },
    {
      "id": "internal-m-m16-2",
      "side": "internal",
      "standard": "M",
      "size": "M16 × 2",
      "insertIds": [
        "R06010-10010"
      ],
      "page": 2
    },
    {
      "id": "internal-unf-unf-1-4-28",
      "side": "internal",
      "standard": "UNF",
      "size": "UNF 1/4-28",
      "insertIds": [
        "R06005-05006",
        "R06005-05010"
      ],
      "page": 2
    },
    {
      "id": "internal-unf-unf-5-16-24",
      "side": "internal",
      "standard": "UNF",
      "size": "UNF 5/16-24",
      "insertIds": [
        "R06005-05010",
        "R06007-06810"
      ],
      "page": 2
    },
    {
      "id": "internal-unf-unf-3-8-24",
      "side": "internal",
      "standard": "UNF",
      "size": "UNF 3/8-24",
      "insertIds": [
        "R06005-05010",
        "R06007-06810",
        "R06010-08510"
      ],
      "page": 2
    },
    {
      "id": "internal-unf-unf-7-16-20",
      "side": "internal",
      "standard": "UNF",
      "size": "UNF 7/16-20",
      "insertIds": [
        "R06007-06810",
        "R06010-08510"
      ],
      "page": 2
    },
    {
      "id": "internal-unf-unf-1-2-20",
      "side": "internal",
      "standard": "UNF",
      "size": "UNF 1/2-20",
      "insertIds": [
        "R06007-06810",
        "R06010-08510",
        "R06010-10010"
      ],
      "page": 2
    },
    {
      "id": "internal-unf-unf-9-16-18",
      "side": "internal",
      "standard": "UNF",
      "size": "UNF 9/16-18",
      "insertIds": [
        "R06010-08510",
        "R06010-10010"
      ],
      "page": 2
    },
    {
      "id": "internal-unf-unf-5-8-18",
      "side": "internal",
      "standard": "UNF",
      "size": "UNF 5/8-18",
      "insertIds": [
        "R06010-08510",
        "R06010-10010"
      ],
      "page": 2
    },
    {
      "id": "internal-unf-unf-3-4-16",
      "side": "internal",
      "standard": "UNF",
      "size": "UNF 3/4-16",
      "insertIds": [
        "R06010-10010"
      ],
      "page": 2
    },
    {
      "id": "internal-unf-unf-7-8-14",
      "side": "internal",
      "standard": "UNF",
      "size": "UNF 7/8-14",
      "insertIds": [
        "R06010-10010"
      ],
      "page": 2
    },
    {
      "id": "internal-unc-unc-1-4-20",
      "side": "internal",
      "standard": "UNC",
      "size": "UNC 1/4-20",
      "insertIds": [
        "R06005-05012"
      ],
      "page": 2
    },
    {
      "id": "internal-unc-unc-5-16-18",
      "side": "internal",
      "standard": "UNC",
      "size": "UNC 5/16-18",
      "insertIds": [
        "R06005-05613"
      ],
      "page": 2
    },
    {
      "id": "internal-unc-unc-3-8-16",
      "side": "internal",
      "standard": "UNC",
      "size": "UNC 3/8-16",
      "insertIds": [
        "R06007-07216"
      ],
      "page": 2
    },
    {
      "id": "internal-unc-unc-7-16-14",
      "side": "internal",
      "standard": "UNC",
      "size": "UNC 7/16-14",
      "insertIds": [
        "R06010-09020"
      ],
      "page": 2
    },
    {
      "id": "internal-unc-unc-1-2-13",
      "side": "internal",
      "standard": "UNC",
      "size": "UNC 1/2-13",
      "insertIds": [
        "R06010-09522",
        "R06010-10010"
      ],
      "page": 2
    },
    {
      "id": "internal-unc-unc-9-16-12",
      "side": "internal",
      "standard": "UNC",
      "size": "UNC 9/16-12",
      "insertIds": [
        "R06010-10024"
      ],
      "page": 2
    },
    {
      "id": "internal-unef-unef-1-4-32",
      "side": "internal",
      "standard": "UNEF",
      "size": "UNEF 1/4-32",
      "insertIds": [
        "R06005-05006"
      ],
      "page": 2
    },
    {
      "id": "internal-unef-unef-5-16-32",
      "side": "internal",
      "standard": "UNEF",
      "size": "UNEF 5/16-32",
      "insertIds": [
        "R06005-05006"
      ],
      "page": 2
    },
    {
      "id": "internal-unef-unef-3-8-32",
      "side": "internal",
      "standard": "UNEF",
      "size": "UNEF 3/8-32",
      "insertIds": [
        "R06005-05006"
      ],
      "page": 2
    },
    {
      "id": "internal-unef-unef-7-16-28",
      "side": "internal",
      "standard": "UNEF",
      "size": "UNEF 7/16-28",
      "insertIds": [
        "R06005-05006",
        "R06005-05010",
        "R06007-06810"
      ],
      "page": 2
    },
    {
      "id": "internal-unef-unef-1-2-28",
      "side": "internal",
      "standard": "UNEF",
      "size": "UNEF 1/2-28",
      "insertIds": [
        "R06005-05006",
        "R06005-05010",
        "R06007-06810"
      ],
      "page": 2
    },
    {
      "id": "internal-unef-unef-9-16-24",
      "side": "internal",
      "standard": "UNEF",
      "size": "UNEF 9/16-24",
      "insertIds": [
        "R06005-05010",
        "R06007-06810",
        "R06010-08510",
        "R06010-10010"
      ],
      "page": 2
    },
    {
      "id": "internal-unef-unef-5-8-24",
      "side": "internal",
      "standard": "UNEF",
      "size": "UNEF 5/8-24",
      "insertIds": [
        "R06005-05010",
        "R06007-06810",
        "R06010-08510",
        "R06010-10010"
      ],
      "page": 2
    },
    {
      "id": "internal-unef-unef-11-16-24",
      "side": "internal",
      "standard": "UNEF",
      "size": "UNEF 11/16-24",
      "insertIds": [
        "R06005-05010",
        "R06007-06810",
        "R06010-08510",
        "R06010-10010"
      ],
      "page": 2
    },
    {
      "id": "internal-unef-unef-3-4-20",
      "side": "internal",
      "standard": "UNEF",
      "size": "UNEF 3/4-20",
      "insertIds": [
        "R06007-06810",
        "R06010-08510",
        "R06010-10010"
      ],
      "page": 2
    },
    {
      "id": "internal-unef-unef-13-16-20",
      "side": "internal",
      "standard": "UNEF",
      "size": "UNEF 13/16-20",
      "insertIds": [
        "R06007-06810",
        "R06010-08510",
        "R06010-10010"
      ],
      "page": 2
    },
    {
      "id": "internal-unef-unef-7-8-20",
      "side": "internal",
      "standard": "UNEF",
      "size": "UNEF 7/8-20",
      "insertIds": [
        "R06007-06810",
        "R06010-08510",
        "R06010-10010"
      ],
      "page": 2
    },
    {
      "id": "internal-unef-unef-15-16-20",
      "side": "internal",
      "standard": "UNEF",
      "size": "UNEF 15/16-20",
      "insertIds": [
        "R06007-06810",
        "R06010-08510",
        "R06010-10010"
      ],
      "page": 2
    },
    {
      "id": "internal-unef-unef-1-20",
      "side": "internal",
      "standard": "UNEF",
      "size": "UNEF 1-20",
      "insertIds": [
        "R06007-06810",
        "R06010-08510",
        "R06010-10010"
      ],
      "page": 2
    },
    {
      "id": "internal-unef-unef-1-1-16-18",
      "side": "internal",
      "standard": "UNEF",
      "size": "UNEF 1 1/16-18",
      "insertIds": [
        "R06010-08510",
        "R06010-10010"
      ],
      "page": 2
    },
    {
      "id": "internal-unef-unef-1-1-8-18",
      "side": "internal",
      "standard": "UNEF",
      "size": "UNEF 1 1/8-18",
      "insertIds": [
        "R06010-08510",
        "R06010-10010"
      ],
      "page": 2
    },
    {
      "id": "internal-unef-unef-1-3-16-18",
      "side": "internal",
      "standard": "UNEF",
      "size": "UNEF 1 3/16-18",
      "insertIds": [
        "R06010-08510",
        "R06010-10010"
      ],
      "page": 2
    },
    {
      "id": "internal-unef-unef-1-1-4-18",
      "side": "internal",
      "standard": "UNEF",
      "size": "UNEF 1 1/4-18",
      "insertIds": [
        "R06010-08510",
        "R06010-10010"
      ],
      "page": 2
    },
    {
      "id": "internal-unef-unef-1-5-16-18",
      "side": "internal",
      "standard": "UNEF",
      "size": "UNEF 1 5/16-18",
      "insertIds": [
        "R06010-08510",
        "R06010-10010"
      ],
      "page": 2
    },
    {
      "id": "internal-unef-unef-1-3-8-18",
      "side": "internal",
      "standard": "UNEF",
      "size": "UNEF 1 3/8-18",
      "insertIds": [
        "R06010-08510",
        "R06010-10010"
      ],
      "page": 2
    },
    {
      "id": "internal-unef-unef-1-7-16-18",
      "side": "internal",
      "standard": "UNEF",
      "size": "UNEF 1 7/16-18",
      "insertIds": [
        "R06010-08510",
        "R06010-10010"
      ],
      "page": 2
    },
    {
      "id": "internal-unef-unef-1-1-2-18",
      "side": "internal",
      "standard": "UNEF",
      "size": "UNEF 1 1/2-18",
      "insertIds": [
        "R06010-08510",
        "R06010-10010"
      ],
      "page": 2
    },
    {
      "id": "internal-unef-unef-1-9-16-18",
      "side": "internal",
      "standard": "UNEF",
      "size": "UNEF 1 9/16-18",
      "insertIds": [
        "R06010-08510",
        "R06010-10010"
      ],
      "page": 2
    },
    {
      "id": "internal-unef-unef-1-5-8-18",
      "side": "internal",
      "standard": "UNEF",
      "size": "UNEF 1 5/8-18",
      "insertIds": [
        "R06010-08510",
        "R06010-10010"
      ],
      "page": 2
    },
    {
      "id": "internal-unef-unef-1-11-16-18",
      "side": "internal",
      "standard": "UNEF",
      "size": "UNEF 1 11/16-18",
      "insertIds": [
        "R06010-08510",
        "R06010-10010"
      ],
      "page": 2
    },
    {
      "id": "internal-g-g-pf-1-16",
      "side": "internal",
      "standard": "G",
      "size": "G (PF) 1/16",
      "insertIds": [
        "R05507-06512"
      ],
      "page": 3
    },
    {
      "id": "internal-g-g-pf-1-8",
      "side": "internal",
      "standard": "G",
      "size": "G (PF) 1/8",
      "insertIds": [
        "R05507-06512"
      ],
      "page": 3
    },
    {
      "id": "internal-g-g-pf-1-4",
      "side": "internal",
      "standard": "G",
      "size": "G (PF) 1/4",
      "insertIds": [
        "R05510-10018"
      ],
      "page": 3
    },
    {
      "id": "internal-g-g-pf-3-8",
      "side": "internal",
      "standard": "G",
      "size": "G (PF) 3/8",
      "insertIds": [
        "R05510-10018"
      ],
      "page": 3
    },
    {
      "id": "internal-g-g-pf-1-2",
      "side": "internal",
      "standard": "G",
      "size": "G (PF) 1/2",
      "insertIds": [
        "R05510-10018"
      ],
      "page": 3
    },
    {
      "id": "internal-g-g-pf-5-8",
      "side": "internal",
      "standard": "G",
      "size": "G (PF) 5/8",
      "insertIds": [
        "R05510-10018"
      ],
      "page": 3
    },
    {
      "id": "internal-g-g-pf-3-4",
      "side": "internal",
      "standard": "G",
      "size": "G (PF) 3/4",
      "insertIds": [
        "R05510-10018"
      ],
      "page": 3
    },
    {
      "id": "internal-g-g-pf-7-8",
      "side": "internal",
      "standard": "G",
      "size": "G (PF) 7/8",
      "insertIds": [
        "R05510-10018"
      ],
      "page": 3
    },
    {
      "id": "internal-pt-pt-1-4",
      "side": "internal",
      "standard": "PT",
      "size": "PT 1/4",
      "insertIds": [
        "R05510-09516"
      ],
      "page": 3
    },
    {
      "id": "internal-pt-pt-3-8",
      "side": "internal",
      "standard": "PT",
      "size": "PT 3/8",
      "insertIds": [
        "R05510-09516"
      ],
      "page": 3
    },
    {
      "id": "internal-pt-pt-1-2",
      "side": "internal",
      "standard": "PT",
      "size": "PT 1/2",
      "insertIds": [
        "R05510-10025"
      ],
      "page": 3
    },
    {
      "id": "internal-pt-pt-3-4",
      "side": "internal",
      "standard": "PT",
      "size": "PT 3/4",
      "insertIds": [
        "R05510-10025"
      ],
      "page": 3
    },
    {
      "id": "internal-npt-npt-1-4",
      "side": "internal",
      "standard": "NPT",
      "size": "NPT 1/4",
      "insertIds": [
        "R06010-09808"
      ],
      "page": 3
    },
    {
      "id": "internal-npt-npt-3-8",
      "side": "internal",
      "standard": "NPT",
      "size": "NPT 3/8",
      "insertIds": [
        "R06010-09808"
      ],
      "page": 3
    },
    {
      "id": "internal-npt-npt-1-2",
      "side": "internal",
      "standard": "NPT",
      "size": "NPT 1/2",
      "insertIds": [
        "R06010-10810"
      ],
      "page": 3
    },
    {
      "id": "internal-npt-npt-3-4",
      "side": "internal",
      "standard": "NPT",
      "size": "NPT 3/4",
      "insertIds": [
        "R06010-10810"
      ],
      "page": 3
    },
    {
      "id": "external-mf-mf-4-0-5",
      "side": "external",
      "standard": "MF",
      "size": "MF 4 × 0.5",
      "insertIds": [
        "R06005-05006"
      ],
      "page": 4
    },
    {
      "id": "external-mf-mf-4-5-0-5",
      "side": "external",
      "standard": "MF",
      "size": "MF 4.5 × 0.5",
      "insertIds": [
        "R06005-05006"
      ],
      "page": 4
    },
    {
      "id": "external-mf-mf-5-0-5",
      "side": "external",
      "standard": "MF",
      "size": "MF 5 × 0.5",
      "insertIds": [
        "R06005-05006"
      ],
      "page": 4
    },
    {
      "id": "external-mf-mf-5-5-0-5",
      "side": "external",
      "standard": "MF",
      "size": "MF 5.5 × 0.5",
      "insertIds": [
        "R06005-05006"
      ],
      "page": 4
    },
    {
      "id": "external-mf-mf-6-0-75",
      "side": "external",
      "standard": "MF",
      "size": "MF 6 × 0.75",
      "insertIds": [
        "R06005-05010",
        "R06007-06810",
        "R06010-08510"
      ],
      "page": 4
    },
    {
      "id": "external-mf-mf-7-0-75",
      "side": "external",
      "standard": "MF",
      "size": "MF 7 × 0.75",
      "insertIds": [
        "R06005-05010",
        "R06007-06810",
        "R06010-08510"
      ],
      "page": 4
    },
    {
      "id": "external-mf-mf-8-0-75",
      "side": "external",
      "standard": "MF",
      "size": "MF 8 × 0.75",
      "insertIds": [
        "R06005-05010",
        "R06007-06810",
        "R06010-08510"
      ],
      "page": 4
    },
    {
      "id": "external-mf-mf-8-1-0",
      "side": "external",
      "standard": "MF",
      "size": "MF 8 × 1.0",
      "insertIds": [
        "R06007-06810",
        "R06010-08510",
        "R06010-10010"
      ],
      "page": 4
    },
    {
      "id": "external-mf-mf-9-0-75",
      "side": "external",
      "standard": "MF",
      "size": "MF 9 × 0.75",
      "insertIds": [
        "R06005-05010",
        "R06007-06810",
        "R06010-08510"
      ],
      "page": 4
    },
    {
      "id": "external-mf-mf-9-1-0",
      "side": "external",
      "standard": "MF",
      "size": "MF 9 × 1.0",
      "insertIds": [
        "R06007-06810",
        "R06010-08510",
        "R06010-10010"
      ],
      "page": 4
    },
    {
      "id": "external-mf-mf-10-0-75",
      "side": "external",
      "standard": "MF",
      "size": "MF 10 × 0.75",
      "insertIds": [
        "R06005-05010",
        "R06007-06810",
        "R06010-08510"
      ],
      "page": 4
    },
    {
      "id": "external-mf-mf-10-1-0",
      "side": "external",
      "standard": "MF",
      "size": "MF 10 × 1.0",
      "insertIds": [
        "R06007-06810",
        "R06010-08510",
        "R06010-10010"
      ],
      "page": 4
    },
    {
      "id": "external-mf-mf-10-1-25",
      "side": "external",
      "standard": "MF",
      "size": "MF 10 × 1.25",
      "insertIds": [
        "R06010-10010"
      ],
      "page": 4
    },
    {
      "id": "external-mf-mf-11-0-75",
      "side": "external",
      "standard": "MF",
      "size": "MF 11 × 0.75",
      "insertIds": [
        "R06005-05010",
        "R06007-06810",
        "R06010-08510"
      ],
      "page": 4
    },
    {
      "id": "external-mf-mf-11-1-0",
      "side": "external",
      "standard": "MF",
      "size": "MF 11 × 1.0",
      "insertIds": [
        "R06007-06810",
        "R06010-08510",
        "R06010-10010"
      ],
      "page": 4
    },
    {
      "id": "external-mf-mf-12-1-0",
      "side": "external",
      "standard": "MF",
      "size": "MF 12 × 1.0",
      "insertIds": [
        "R06007-06810",
        "R06010-08510",
        "R06010-10010"
      ],
      "page": 4
    },
    {
      "id": "external-mf-mf-12-1-25",
      "side": "external",
      "standard": "MF",
      "size": "MF 12 × 1.25",
      "insertIds": [
        "R06010-10010"
      ],
      "page": 4
    },
    {
      "id": "external-mf-mf-12-1-5",
      "side": "external",
      "standard": "MF",
      "size": "MF 12 × 1.5",
      "insertIds": [
        "R06010-10010"
      ],
      "page": 4
    },
    {
      "id": "external-mf-mf-14-1-0",
      "side": "external",
      "standard": "MF",
      "size": "MF 14 × 1.0",
      "insertIds": [
        "R06007-06810",
        "R06010-08510",
        "R06010-10010"
      ],
      "page": 4
    },
    {
      "id": "external-mf-mf-14-1-25",
      "side": "external",
      "standard": "MF",
      "size": "MF 14 × 1.25",
      "insertIds": [
        "R06010-10010"
      ],
      "page": 4
    },
    {
      "id": "external-mf-mf-14-1-5",
      "side": "external",
      "standard": "MF",
      "size": "MF 14 × 1.5",
      "insertIds": [
        "R06010-10010"
      ],
      "page": 4
    },
    {
      "id": "external-mf-mf-15-1-0",
      "side": "external",
      "standard": "MF",
      "size": "MF 15 × 1.0",
      "insertIds": [
        "R06007-06810",
        "R06010-08510",
        "R06010-10010"
      ],
      "page": 4
    },
    {
      "id": "external-mf-mf-15-1-5",
      "side": "external",
      "standard": "MF",
      "size": "MF 15 × 1.5",
      "insertIds": [
        "R06010-10010"
      ],
      "page": 4
    },
    {
      "id": "external-mf-mf-16-1-0",
      "side": "external",
      "standard": "MF",
      "size": "MF 16 × 1.0",
      "insertIds": [
        "R06007-06810",
        "R06010-08510",
        "R06010-10010"
      ],
      "page": 4
    },
    {
      "id": "external-mf-mf-16-1-5",
      "side": "external",
      "standard": "MF",
      "size": "MF 16 × 1.5",
      "insertIds": [
        "R06010-10010"
      ],
      "page": 4
    },
    {
      "id": "external-mf-mf-17-1-0",
      "side": "external",
      "standard": "MF",
      "size": "MF 17 × 1.0",
      "insertIds": [
        "R06007-06810",
        "R06010-08510",
        "R06010-10010"
      ],
      "page": 4
    },
    {
      "id": "external-mf-mf-17-1-5",
      "side": "external",
      "standard": "MF",
      "size": "MF 17 × 1.5",
      "insertIds": [
        "R06010-10010"
      ],
      "page": 4
    },
    {
      "id": "external-mf-mf-18-1-0",
      "side": "external",
      "standard": "MF",
      "size": "MF 18 × 1.0",
      "insertIds": [
        "R06007-06810",
        "R06010-08510",
        "R06010-10010"
      ],
      "page": 4
    },
    {
      "id": "external-mf-mf-18-1-5",
      "side": "external",
      "standard": "MF",
      "size": "MF 18 × 1.5",
      "insertIds": [
        "R06010-10010"
      ],
      "page": 4
    },
    {
      "id": "external-mf-mf-20-1-0",
      "side": "external",
      "standard": "MF",
      "size": "MF 20 × 1.0",
      "insertIds": [
        "R06007-06810",
        "R06010-08510",
        "R06010-10010"
      ],
      "page": 4
    },
    {
      "id": "external-mf-mf-20-1-5",
      "side": "external",
      "standard": "MF",
      "size": "MF 20 × 1.5",
      "insertIds": [
        "R06010-10010"
      ],
      "page": 4
    },
    {
      "id": "external-mf-mf-22-1-0",
      "side": "external",
      "standard": "MF",
      "size": "MF 22 × 1.0",
      "insertIds": [
        "R06007-06810",
        "R06010-08510",
        "R06010-10010"
      ],
      "page": 4
    },
    {
      "id": "external-mf-mf-22-1-5",
      "side": "external",
      "standard": "MF",
      "size": "MF 22 × 1.5",
      "insertIds": [
        "R06010-10010"
      ],
      "page": 4
    },
    {
      "id": "external-mf-mf-24-1-0",
      "side": "external",
      "standard": "MF",
      "size": "MF 24 × 1.0",
      "insertIds": [
        "R06007-06810",
        "R06010-08510",
        "R06010-10010"
      ],
      "page": 4
    },
    {
      "id": "external-mf-mf-24-1-5",
      "side": "external",
      "standard": "MF",
      "size": "MF 24 × 1.5",
      "insertIds": [
        "R06010-10010"
      ],
      "page": 4
    },
    {
      "id": "external-mf-mf-25-1-0",
      "side": "external",
      "standard": "MF",
      "size": "MF 25 × 1.0",
      "insertIds": [
        "R06007-06810",
        "R06010-08510",
        "R06010-10010"
      ],
      "page": 4
    },
    {
      "id": "external-mf-mf-25-1-5",
      "side": "external",
      "standard": "MF",
      "size": "MF 25 × 1.5",
      "insertIds": [
        "R06010-10010"
      ],
      "page": 4
    },
    {
      "id": "external-mf-mf-27-1-0",
      "side": "external",
      "standard": "MF",
      "size": "MF 27 × 1.0",
      "insertIds": [
        "R06007-06810",
        "R06010-08510",
        "R06010-10010"
      ],
      "page": 4
    },
    {
      "id": "external-mf-mf-27-1-5",
      "side": "external",
      "standard": "MF",
      "size": "MF 27 × 1.5",
      "insertIds": [
        "R06010-10010"
      ],
      "page": 4
    },
    {
      "id": "external-mf-mf-28-1-0",
      "side": "external",
      "standard": "MF",
      "size": "MF 28 × 1.0",
      "insertIds": [
        "R06007-06810",
        "R06010-08510",
        "R06010-10010"
      ],
      "page": 4
    },
    {
      "id": "external-mf-mf-28-1-5",
      "side": "external",
      "standard": "MF",
      "size": "MF 28 × 1.5",
      "insertIds": [
        "R06010-10010"
      ],
      "page": 4
    },
    {
      "id": "external-mf-mf-30-1-0",
      "side": "external",
      "standard": "MF",
      "size": "MF 30 × 1.0",
      "insertIds": [
        "R06007-06810",
        "R06010-08510",
        "R06010-10010"
      ],
      "page": 4
    },
    {
      "id": "external-mf-mf-30-1-5",
      "side": "external",
      "standard": "MF",
      "size": "MF 30 × 1.5",
      "insertIds": [
        "R06010-10010"
      ],
      "page": 4
    },
    {
      "id": "external-mf-mf-32-1-5",
      "side": "external",
      "standard": "MF",
      "size": "MF 32 × 1.5",
      "insertIds": [
        "R06010-10010"
      ],
      "page": 4
    },
    {
      "id": "external-mf-mf-33-1-5",
      "side": "external",
      "standard": "MF",
      "size": "MF 33 × 1.5",
      "insertIds": [
        "R06010-10010"
      ],
      "page": 4
    },
    {
      "id": "external-mf-mf-35-1-5",
      "side": "external",
      "standard": "MF",
      "size": "MF 35 × 1.5",
      "insertIds": [
        "R06010-10010"
      ],
      "page": 4
    },
    {
      "id": "external-mf-mf-36-1-5",
      "side": "external",
      "standard": "MF",
      "size": "MF 36 × 1.5",
      "insertIds": [
        "R06010-10010"
      ],
      "page": 4
    },
    {
      "id": "external-mf-mf-39-1-5",
      "side": "external",
      "standard": "MF",
      "size": "MF 39 × 1.5",
      "insertIds": [
        "R06010-10010"
      ],
      "page": 4
    },
    {
      "id": "external-mf-mf-40-1-5",
      "side": "external",
      "standard": "MF",
      "size": "MF 40 × 1.5",
      "insertIds": [
        "R06010-10010"
      ],
      "page": 4
    },
    {
      "id": "external-mf-mf-42-1-5",
      "side": "external",
      "standard": "MF",
      "size": "MF 42 × 1.5",
      "insertIds": [
        "R06010-10010"
      ],
      "page": 4
    },
    {
      "id": "external-mf-mf-45-1-5",
      "side": "external",
      "standard": "MF",
      "size": "MF 45 × 1.5",
      "insertIds": [
        "R06010-10010"
      ],
      "page": 4
    },
    {
      "id": "external-mf-mf-48-1-5",
      "side": "external",
      "standard": "MF",
      "size": "MF 48 × 1.5",
      "insertIds": [
        "R06010-10010"
      ],
      "page": 4
    },
    {
      "id": "external-mf-mf-50-1-5",
      "side": "external",
      "standard": "MF",
      "size": "MF 50 × 1.5",
      "insertIds": [
        "R06010-10010"
      ],
      "page": 4
    },
    {
      "id": "external-m-m3-0-5",
      "side": "external",
      "standard": "M",
      "size": "M3 × 0.5",
      "insertIds": [
        "R06005-05006"
      ],
      "page": 5
    },
    {
      "id": "external-m-m3-5-0-6",
      "side": "external",
      "standard": "M",
      "size": "M3.5 × 0.6",
      "insertIds": [
        "R06005-05006",
        "R06005-05010"
      ],
      "page": 5
    },
    {
      "id": "external-m-m4-0-7",
      "side": "external",
      "standard": "M",
      "size": "M4 × 0.7",
      "insertIds": [
        "R06005-05006",
        "R06005-05010",
        "R06007-06810",
        "R06010-08510"
      ],
      "page": 5
    },
    {
      "id": "external-m-m4-5-0-75",
      "side": "external",
      "standard": "M",
      "size": "M4.5 × 0.75",
      "insertIds": [
        "R06005-05010",
        "R06007-06810",
        "R06010-08510"
      ],
      "page": 5
    },
    {
      "id": "external-m-m5-0-8",
      "side": "external",
      "standard": "M",
      "size": "M5 × 0.8",
      "insertIds": [
        "R06005-05010",
        "R06007-06810",
        "R06010-08510"
      ],
      "page": 5
    },
    {
      "id": "external-m-m6-1-0",
      "side": "external",
      "standard": "M",
      "size": "M6 × 1.0",
      "insertIds": [
        "R06007-06810",
        "R06010-08510",
        "R06010-10010"
      ],
      "page": 5
    },
    {
      "id": "external-m-m7-1-0",
      "side": "external",
      "standard": "M",
      "size": "M7 × 1.0",
      "insertIds": [
        "R06007-06810",
        "R06010-08510",
        "R06010-10010"
      ],
      "page": 5
    },
    {
      "id": "external-m-m8-1-25",
      "side": "external",
      "standard": "M",
      "size": "M8 × 1.25",
      "insertIds": [
        "R06010-10010"
      ],
      "page": 5
    },
    {
      "id": "external-m-m9-1-25",
      "side": "external",
      "standard": "M",
      "size": "M9 × 1.25",
      "insertIds": [
        "R06010-10010"
      ],
      "page": 5
    },
    {
      "id": "external-m-m10-1-5",
      "side": "external",
      "standard": "M",
      "size": "M10 × 1.5",
      "insertIds": [
        "R06010-10010"
      ],
      "page": 5
    },
    {
      "id": "external-m-m11-1-5",
      "side": "external",
      "standard": "M",
      "size": "M11 × 1.5",
      "insertIds": [
        "R06010-10010"
      ],
      "page": 5
    },
    {
      "id": "external-m-m12-1-75",
      "side": "external",
      "standard": "M",
      "size": "M12 × 1.75",
      "insertIds": [
        "R06010-10010"
      ],
      "page": 5
    },
    {
      "id": "external-unf-unf-4-48",
      "side": "external",
      "standard": "UNF",
      "size": "UNF #4-48",
      "insertIds": [
        "R06005-05006"
      ],
      "page": 5
    },
    {
      "id": "external-unf-unf-5-44",
      "side": "external",
      "standard": "UNF",
      "size": "UNF #5-44",
      "insertIds": [
        "R06005-05006"
      ],
      "page": 5
    },
    {
      "id": "external-unf-unf-6-40",
      "side": "external",
      "standard": "UNF",
      "size": "UNF #6-40",
      "insertIds": [
        "R06005-05006",
        "R06005-05010"
      ],
      "page": 5
    },
    {
      "id": "external-unf-unf-8-36",
      "side": "external",
      "standard": "UNF",
      "size": "UNF #8-36",
      "insertIds": [
        "R06005-05006",
        "R06005-05010"
      ],
      "page": 5
    },
    {
      "id": "external-unf-unf-10-32",
      "side": "external",
      "standard": "UNF",
      "size": "UNF #10-32",
      "insertIds": [
        "R06005-05010",
        "R06007-06810",
        "R06010-08510"
      ],
      "page": 5
    },
    {
      "id": "external-unf-unf-12-28",
      "side": "external",
      "standard": "UNF",
      "size": "UNF #12-28",
      "insertIds": [
        "R06007-06810",
        "R06010-08510"
      ],
      "page": 5
    },
    {
      "id": "external-unf-unf-1-4-28",
      "side": "external",
      "standard": "UNF",
      "size": "UNF 1/4-28",
      "insertIds": [
        "R06007-06810",
        "R06010-08510"
      ],
      "page": 5
    },
    {
      "id": "external-unf-unf-5-16-24",
      "side": "external",
      "standard": "UNF",
      "size": "UNF 5/16-24",
      "insertIds": [
        "R06010-08510",
        "R06010-10010"
      ],
      "page": 5
    },
    {
      "id": "external-unf-unf-3-8-24",
      "side": "external",
      "standard": "UNF",
      "size": "UNF 3/8-24",
      "insertIds": [
        "R06010-08510",
        "R06010-10010"
      ],
      "page": 5
    },
    {
      "id": "external-unf-unf-7-16-20",
      "side": "external",
      "standard": "UNF",
      "size": "UNF 7/16-20",
      "insertIds": [
        "R06010-10010"
      ],
      "page": 5
    },
    {
      "id": "external-unf-unf-1-2-20",
      "side": "external",
      "standard": "UNF",
      "size": "UNF 1/2-20",
      "insertIds": [
        "R06010-10010"
      ],
      "page": 5
    },
    {
      "id": "external-unf-unf-9-16-18",
      "side": "external",
      "standard": "UNF",
      "size": "UNF 9/16-18",
      "insertIds": [
        "R06010-10010"
      ],
      "page": 5
    },
    {
      "id": "external-unf-unf-5-8-18",
      "side": "external",
      "standard": "UNF",
      "size": "UNF 5/8-18",
      "insertIds": [
        "R06010-10010"
      ],
      "page": 5
    },
    {
      "id": "external-unf-unf-3-4-16",
      "side": "external",
      "standard": "UNF",
      "size": "UNF 3/4-16",
      "insertIds": [
        "R06010-10010"
      ],
      "page": 5
    },
    {
      "id": "external-unf-unf-7-8-14",
      "side": "external",
      "standard": "UNF",
      "size": "UNF 7/8-14",
      "insertIds": [
        "R06010-10010"
      ],
      "page": 5
    },
    {
      "id": "external-unc-unc-6-32",
      "side": "external",
      "standard": "UNC",
      "size": "UNC #6-32",
      "insertIds": [
        "R06005-05010",
        "R06007-06810",
        "R06010-08510"
      ],
      "page": 5
    },
    {
      "id": "external-unc-unc-8-32",
      "side": "external",
      "standard": "UNC",
      "size": "UNC #8-32",
      "insertIds": [
        "R06005-05010",
        "R06007-06810",
        "R06010-08510"
      ],
      "page": 5
    },
    {
      "id": "external-unc-unc-10-24",
      "side": "external",
      "standard": "UNC",
      "size": "UNC #10-24",
      "insertIds": [
        "R06010-08510",
        "R06010-10010"
      ],
      "page": 5
    },
    {
      "id": "external-unc-unc-12-24",
      "side": "external",
      "standard": "UNC",
      "size": "UNC #12-24",
      "insertIds": [
        "R06010-08510",
        "R06010-10010"
      ],
      "page": 5
    },
    {
      "id": "external-unc-unc-1-4-20",
      "side": "external",
      "standard": "UNC",
      "size": "UNC 1/4-20",
      "insertIds": [
        "R06010-10010"
      ],
      "page": 5
    },
    {
      "id": "external-unc-unc-5-16-18",
      "side": "external",
      "standard": "UNC",
      "size": "UNC 5/16-18",
      "insertIds": [
        "R06010-10010"
      ],
      "page": 5
    },
    {
      "id": "external-unc-unc-3-8-16",
      "side": "external",
      "standard": "UNC",
      "size": "UNC 3/8-16",
      "insertIds": [
        "R06010-10010"
      ],
      "page": 5
    },
    {
      "id": "external-unc-unc-7-16-14",
      "side": "external",
      "standard": "UNC",
      "size": "UNC 7/16-14",
      "insertIds": [
        "R06010-10010"
      ],
      "page": 5
    },
    {
      "id": "external-unef-unef-12-32",
      "side": "external",
      "standard": "UNEF",
      "size": "UNEF #12-32",
      "insertIds": [
        "R06005-05010",
        "R06007-06810",
        "R06010-08510"
      ],
      "page": 6
    },
    {
      "id": "external-unef-unef-1-4-32",
      "side": "external",
      "standard": "UNEF",
      "size": "UNEF 1/4-32",
      "insertIds": [
        "R06005-05010",
        "R06007-06810",
        "R06010-08510"
      ],
      "page": 6
    },
    {
      "id": "external-unef-unef-5-16-32",
      "side": "external",
      "standard": "UNEF",
      "size": "UNEF 5/16-32",
      "insertIds": [
        "R06005-05010",
        "R06007-06810",
        "R06010-08510"
      ],
      "page": 6
    },
    {
      "id": "external-unef-unef-3-8-32",
      "side": "external",
      "standard": "UNEF",
      "size": "UNEF 3/8-32",
      "insertIds": [
        "R06005-05010",
        "R06007-06810",
        "R06010-08510"
      ],
      "page": 6
    },
    {
      "id": "external-unef-unef-7-16-28",
      "side": "external",
      "standard": "UNEF",
      "size": "UNEF 7/16-28",
      "insertIds": [
        "R06007-06810",
        "R06010-08510"
      ],
      "page": 6
    },
    {
      "id": "external-unef-unef-1-2-28",
      "side": "external",
      "standard": "UNEF",
      "size": "UNEF 1/2-28",
      "insertIds": [
        "R06007-06810",
        "R06010-08510"
      ],
      "page": 6
    },
    {
      "id": "external-unef-unef-9-16-24",
      "side": "external",
      "standard": "UNEF",
      "size": "UNEF 9/16-24",
      "insertIds": [
        "R06010-08510",
        "R06010-10010"
      ],
      "page": 6
    },
    {
      "id": "external-unef-unef-5-8-24",
      "side": "external",
      "standard": "UNEF",
      "size": "UNEF 5/8-24",
      "insertIds": [
        "R06010-08510",
        "R06010-10010"
      ],
      "page": 6
    },
    {
      "id": "external-unef-unef-11-16-24",
      "side": "external",
      "standard": "UNEF",
      "size": "UNEF 11/16-24",
      "insertIds": [
        "R06010-08510",
        "R06010-10010"
      ],
      "page": 6
    },
    {
      "id": "external-unef-unef-3-4-20",
      "side": "external",
      "standard": "UNEF",
      "size": "UNEF 3/4-20",
      "insertIds": [
        "R06010-10010"
      ],
      "page": 6
    },
    {
      "id": "external-unef-unef-13-16-20",
      "side": "external",
      "standard": "UNEF",
      "size": "UNEF 13/16-20",
      "insertIds": [
        "R06010-10010"
      ],
      "page": 6
    },
    {
      "id": "external-unef-unef-7-8-20",
      "side": "external",
      "standard": "UNEF",
      "size": "UNEF 7/8-20",
      "insertIds": [
        "R06010-10010"
      ],
      "page": 6
    },
    {
      "id": "external-unef-unef-15-16-20",
      "side": "external",
      "standard": "UNEF",
      "size": "UNEF 15/16-20",
      "insertIds": [
        "R06010-10010"
      ],
      "page": 6
    },
    {
      "id": "external-unef-unef-1-20",
      "side": "external",
      "standard": "UNEF",
      "size": "UNEF 1-20",
      "insertIds": [
        "R06010-10010"
      ],
      "page": 6
    },
    {
      "id": "external-unef-unef-1-1-16-18",
      "side": "external",
      "standard": "UNEF",
      "size": "UNEF 1 1/16-18",
      "insertIds": [
        "R06010-10010"
      ],
      "page": 6
    },
    {
      "id": "external-unef-unef-1-1-8-18",
      "side": "external",
      "standard": "UNEF",
      "size": "UNEF 1 1/8-18",
      "insertIds": [
        "R06010-10010"
      ],
      "page": 6
    },
    {
      "id": "external-unef-unef-1-3-16-18",
      "side": "external",
      "standard": "UNEF",
      "size": "UNEF 1 3/16-18",
      "insertIds": [
        "R06010-10010"
      ],
      "page": 6
    },
    {
      "id": "external-unef-unef-1-1-4-18",
      "side": "external",
      "standard": "UNEF",
      "size": "UNEF 1 1/4-18",
      "insertIds": [
        "R06010-10010"
      ],
      "page": 6
    },
    {
      "id": "external-unef-unef-1-5-16-18",
      "side": "external",
      "standard": "UNEF",
      "size": "UNEF 1 5/16-18",
      "insertIds": [
        "R06010-10010"
      ],
      "page": 6
    },
    {
      "id": "external-unef-unef-1-3-8-18",
      "side": "external",
      "standard": "UNEF",
      "size": "UNEF 1 3/8-18",
      "insertIds": [
        "R06010-10010"
      ],
      "page": 6
    },
    {
      "id": "external-unef-unef-1-7-16-18",
      "side": "external",
      "standard": "UNEF",
      "size": "UNEF 1 7/16-18",
      "insertIds": [
        "R06010-10010"
      ],
      "page": 6
    },
    {
      "id": "external-unef-unef-1-1-2-18",
      "side": "external",
      "standard": "UNEF",
      "size": "UNEF 1 1/2-18",
      "insertIds": [
        "R06010-10010"
      ],
      "page": 6
    },
    {
      "id": "external-unef-unef-1-9-16-18",
      "side": "external",
      "standard": "UNEF",
      "size": "UNEF 1 9/16-18",
      "insertIds": [
        "R06010-10010"
      ],
      "page": 6
    },
    {
      "id": "external-unef-unef-1-5-8-18",
      "side": "external",
      "standard": "UNEF",
      "size": "UNEF 1 5/8-18",
      "insertIds": [
        "R06010-10010"
      ],
      "page": 6
    },
    {
      "id": "external-unef-unef-1-11-16-18",
      "side": "external",
      "standard": "UNEF",
      "size": "UNEF 1 11/16-18",
      "insertIds": [
        "R06010-10010"
      ],
      "page": 6
    },
    {
      "id": "external-g-g-pf-1-16",
      "side": "external",
      "standard": "G",
      "size": "G (PF) 1/16",
      "insertIds": [
        "R05507-06512"
      ],
      "page": 6
    },
    {
      "id": "external-g-g-pf-1-8",
      "side": "external",
      "standard": "G",
      "size": "G (PF) 1/8",
      "insertIds": [
        "R05507-06512"
      ],
      "page": 6
    },
    {
      "id": "external-g-g-pf-1-4",
      "side": "external",
      "standard": "G",
      "size": "G (PF) 1/4",
      "insertIds": [
        "R05510-10018"
      ],
      "page": 6
    },
    {
      "id": "external-g-g-pf-3-8",
      "side": "external",
      "standard": "G",
      "size": "G (PF) 3/8",
      "insertIds": [
        "R05510-10018"
      ],
      "page": 6
    },
    {
      "id": "external-g-g-pf-1-2",
      "side": "external",
      "standard": "G",
      "size": "G (PF) 1/2",
      "insertIds": [
        "R05510-10018"
      ],
      "page": 6
    },
    {
      "id": "external-g-g-pf-5-8",
      "side": "external",
      "standard": "G",
      "size": "G (PF) 5/8",
      "insertIds": [
        "R05510-10018"
      ],
      "page": 6
    },
    {
      "id": "external-g-g-pf-3-4",
      "side": "external",
      "standard": "G",
      "size": "G (PF) 3/4",
      "insertIds": [
        "R05510-10018"
      ],
      "page": 6
    },
    {
      "id": "external-g-g-pf-7-8",
      "side": "external",
      "standard": "G",
      "size": "G (PF) 7/8",
      "insertIds": [
        "R05510-10018"
      ],
      "page": 6
    },
    {
      "id": "external-pt-pt-1-4",
      "side": "external",
      "standard": "PT",
      "size": "PT 1/4",
      "insertIds": [
        "R05510-09516"
      ],
      "page": 6
    },
    {
      "id": "external-pt-pt-3-8",
      "side": "external",
      "standard": "PT",
      "size": "PT 3/8",
      "insertIds": [
        "R05510-09516"
      ],
      "page": 6
    },
    {
      "id": "external-pt-pt-1-2",
      "side": "external",
      "standard": "PT",
      "size": "PT 1/2",
      "insertIds": [
        "R05510-10025"
      ],
      "page": 6
    },
    {
      "id": "external-pt-pt-3-4",
      "side": "external",
      "standard": "PT",
      "size": "PT 3/4",
      "insertIds": [
        "R05510-10025"
      ],
      "page": 6
    },
    {
      "id": "external-npt-npt-1-4",
      "side": "external",
      "standard": "NPT",
      "size": "NPT 1/4",
      "insertIds": [
        "R06010-09808"
      ],
      "page": 6
    },
    {
      "id": "external-npt-npt-3-8",
      "side": "external",
      "standard": "NPT",
      "size": "NPT 3/8",
      "insertIds": [
        "R06010-09808"
      ],
      "page": 6
    },
    {
      "id": "external-npt-npt-1-2",
      "side": "external",
      "standard": "NPT",
      "size": "NPT 1/2",
      "insertIds": [
        "R06010-10810"
      ],
      "page": 6
    },
    {
      "id": "external-npt-npt-3-4",
      "side": "external",
      "standard": "NPT",
      "size": "NPT 3/4",
      "insertIds": [
        "R06010-10810"
      ],
      "page": 6
    }
  ]
};

if (typeof module !== "undefined") module.exports = MCC_QUICK_PICK;
