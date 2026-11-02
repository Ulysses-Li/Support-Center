"""從官方 MCC Quick Pick PDF 抽取內／外牙規與刀片對照；不從螺距推算相容性。"""

import argparse
from collections import Counter, OrderedDict
import hashlib
import json
from pathlib import Path
import re
import sys

import pdfplumber


# 客戶連結一律使用站內 PDF；原始官方網址僅保留作為維護溯源。
SOURCE_URL = "/Products/MCCThreadMill/downloads/Quick_Pick_for_MCC_Thread_insert.pdf"
ORIGINAL_URL = "https://nine9.jic-tools.com.tw/upload_files/download/Quick_Pick_thread_type/Quick_Pick_for_MCC_Thread_insert.pdf"
STANDARDS = [
    {"id": "M", "label": "M · Metric coarse", "angle": 60, "kind": "parallel"},
    {"id": "MF", "label": "MF · Metric fine", "angle": 60, "kind": "parallel"},
    {"id": "UNC", "label": "UNC · Unified coarse", "angle": 60, "kind": "parallel"},
    {"id": "UNF", "label": "UNF · Unified fine", "angle": 60, "kind": "parallel"},
    {"id": "UNEF", "label": "UNEF · Unified extra fine", "angle": 60, "kind": "parallel"},
    {"id": "G", "label": "G (PF) · BSPP", "angle": 55, "kind": "parallel"},
    {"id": "PT", "label": "PT · BSPT", "angle": 55, "kind": "tapered"},
    {"id": "NPT", "label": "NPT", "angle": 60, "kind": "tapered"},
]


def clean_text(value):
    return re.sub(r"\s+", " ", value or "").strip()


def clean_size(value):
    # 僅統一空白及乘號，保留原表的尺寸內容與小數精度，不增加／改寫規格。
    value = clean_text(value)
    return re.sub(r"\s*[x×]\s*", " × ", value)


def get_standard(size):
    match = re.match(r"^(UNEF|UNC|UNF|NPT|MF|M|PT|G)(?=\s|[0-9(])", size)
    if not match:
        raise ValueError(f"Unrecognized thread size: {size!r}")
    return match.group(1)


def is_data_header(row):
    return len(row) % 3 == 0 and all(
        [clean_text(cell) for cell in row[start:start + 3]] == ["Thread Size", "Parts No.", "ØD"]
        for start in range(0, len(row), 3)
    )


def extract_data(source):
    mappings = OrderedDict()
    inserts = OrderedDict()
    triple_count = 0
    table_blocks = Counter()

    with pdfplumber.open(source) as pdf:
        if len(pdf.pages) != 6:
            raise ValueError("This extractor was verified against the six-page 202604 Quick Pick PDF.")
        if "202604" not in (pdf.pages[-1].extract_text() or ""):
            raise ValueError("PDF revision does not match the verified 202604 source.")

        for page_number, page in enumerate(pdf.pages, 1):
            side = "internal" if page_number <= 3 else "external"
            heading = "Internal Thread" if side == "internal" else "External Thread"
            if heading not in (page.extract_text() or ""):
                raise ValueError(f"Page {page_number}: unexpected thread side.")

            for table in page.extract_tables():
                if not table or not is_data_header(table[0]):
                    continue
                # 三欄並排續表（例如第 2 頁 UNEF）各自處理，避免跨欄繼承上一欄資料。
                for start in range(0, len(table[0]), 3):
                    current = [None, None, None]
                    block_standard = None
                    table_blocks[page_number] += 1
                    for row in table[1:]:
                        cells = row[start:start + 3]
                        if len(cells) != 3:
                            raise ValueError(f"Page {page_number}: malformed table row.")
                        # 續表尾端為排版填充的全空列，不可把它變成上一筆的重複對照。
                        if not any(clean_text(value) for value in cells):
                            continue
                        # None 是 PDF 的垂直合併格；尺寸、料號和直徑皆只在本三欄內向下填充。
                        current = [clean_text(value) or previous for value, previous in zip(cells, current)]
                        size, insert_id, diameter_text = current
                        if not all(current):
                            raise ValueError(f"Page {page_number}: unresolved merged cell {current!r}")
                        if not re.fullmatch(r"R\d{5}-\d{5}", insert_id):
                            raise ValueError(f"Page {page_number}: invalid insert {insert_id!r}")
                        size = clean_size(size)
                        standard = get_standard(size)
                        if block_standard and standard != block_standard:
                            raise ValueError(f"Page {page_number}: mixed standards in one table block.")
                        block_standard = standard
                        diameter = float(diameter_text)
                        if insert_id in inserts and inserts[insert_id]["diameter"] != diameter:
                            raise ValueError(f"Conflicting diameter for {insert_id}.")
                        inserts.setdefault(insert_id, {"id": insert_id, "diameter": diameter})
                        key = (side, standard, size)
                        if key not in mappings:
                            slug = re.sub(r"[^a-z0-9]+", "-", size.lower()).strip("-")
                            mappings[key] = {"id": f"{side}-{standard.lower()}-{slug}", "side": side,
                                             "standard": standard, "size": size, "insertIds": [], "page": page_number}
                        record = mappings[key]
                        if record["page"] != page_number:
                            raise ValueError(f"Mapping repeats across pages; add explicit pages metadata: {key!r}")
                        # 跨欄續表及同規格分列的候選刀片合併，保留官方表中的順序。
                        if insert_id not in record["insertIds"]:
                            record["insertIds"].append(insert_id)
                            triple_count += 1

    records = list(mappings.values())
    if len({record["id"] for record in records}) != len(records):
        raise ValueError("Duplicate record IDs.")
    if dict(table_blocks) != {1: 3, 2: 6, 3: 3, 4: 2, 5: 3, 6: 4}:
        raise ValueError(f"Unexpected table-block layout: {dict(table_blocks)!r}")
    data = {
        "source": {"title": "Quick Pick for MCC Thread Insert", "url": SOURCE_URL, "originalUrl": ORIGINAL_URL, "revision": "202604",
                   "pages": 6, "sha256": hashlib.sha256(source.read_bytes()).hexdigest()},
        "standards": STANDARDS,
        "inserts": list(inserts.values()),
        "rows": records,
    }
    return data, triple_count


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, required=True, help="Local copy of the official PDF")
    parser.add_argument("--output", type=Path, default=Path(__file__).resolve().parents[1] / "data.js")
    args = parser.parse_args()
    data, triple_count = extract_data(args.source)
    comment = """/* MCC 刀片 Quick Pick：直接由官方 202604 六頁 PDF 的表格抽取。
 * 第 1–3 頁為內牙，第 4–6 頁為外牙；每筆記錄保留原表頁碼。
 * 只統一空白與乘號，合併同一規格的原表候選；不依螺距或舊 NC 資料推算。
 * 重建方式：tools/extract-quick-pick.py --source <官方 PDF 本機路徑>
 */
"""
    text = comment + "const MCC_QUICK_PICK = " + json.dumps(data, ensure_ascii=False, indent=2) + ";\n\n"
    text += 'if (typeof module !== "undefined") module.exports = MCC_QUICK_PICK;\n'
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(text, encoding="utf-8")
    print(json.dumps({"records": len(data["rows"]), "inserts": len(data["inserts"]), "compatibilityPairs": triple_count,
                      "bySideStandard": dict(Counter(f'{row["side"]}/{row["standard"]}' for row in data["rows"]))}, ensure_ascii=False))


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    main()
