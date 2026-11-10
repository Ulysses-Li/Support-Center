"""驗證整理檔的數量、來源、料號及連接；不新增加工建議。"""
from pathlib import Path
from collections import Counter
import hashlib
import json

ROOT = Path(__file__).resolve().parents[1]
data = json.loads((ROOT / "research-data.json").read_text(encoding="utf-8"))
checks = []

def check(label, condition):
    checks.append((label, bool(condition)))

def pointer_value(pointer):
    node = data
    for key in pointer.split("/")[1:]:
        node = node[int(key)] if isinstance(node,list) else node[key]
    return node

ins = data["insert_inventory"]["items"]
masters = data["insert_inventory"]["measuring_masters"]
holders = data["holders_accessories"]["holders"]
conditions = data["cutting_data"]["cutting_conditions"]
check("主刀片51款",len(ins)==51)
check("R20 / A+B20 / A3 / ANSI8", Counter(i["family"] for i in ins)=={
    "DIN332 Form R":20,"DIN332 Form A+B":20,"DIN332 Form A":3,"ANSI 60°":8})
check("量測片5 / 刀柄27 / 套筒2 / Form D2",len(masters)==5 and len(holders)==27
      and len(data["holders_accessories"]["center_height_sleeves"])==2
      and len(data["holders_accessories"]["other_inserts"])==2)
index = data["product_index"]
check("87個唯一產品料號", len(index)==87 and len({p["parts_no"] for p in index})==87)
check("所有JSON Pointer可解析到相同料號",all(pointer_value(p["data_pointer"])["parts_no"]==p["parts_no"] for p in index))
check("刀片訂購碼為保留前導零的6碼字串",all(isinstance(i["order_code"],str) and len(i["order_code"])==6 for i in ins))
check("所有已列訂購碼互不重複",len([p for p in index if p["order_code"]])==len({p["order_code"] for p in index if p["order_code"]}))

product_source_ok = True
for p in index:
    s = p["source"]
    pp = s["pdf_page"]
    text = (ROOT / f"verification/pdf-page-{pp:02d}.txt").read_text(encoding="utf-8")
    product_source_ok &= p["parts_no"] in text
    if p["order_code"]:
        product_source_ok &= p["order_code"] in text
    product_source_ok &= pp == s["printed_page"] - 53
check("87款料號/已列訂購碼可回查各自PDF文字頁且頁碼正確",product_source_ok)

check("70筆唯一切削條件 / 10欄 / 7材料",len(conditions)==70 and len({r["id"] for r in conditions})==70
      and len(data["cutting_data"]["columns"])==10 and len({r["material_id"] for r in conditions})==7)
check("每個材料10筆且每個欄位7筆",set(Counter(r["material_id"] for r in conditions).values())=={10}
      and set(Counter(r["column_id"] for r in conditions).values())=={7})
check("S/f範圍及原序列一致",all(r["spindle_speed_rpm"]["min"]<=r["spindle_speed_rpm"]["max"]
    and r["feed_mm_per_rev"]["min"]==min(r["feed_mm_per_rev"]["catalog_sequence"])
    and r["feed_mm_per_rev"]["max"]==max(r["feed_mm_per_rev"]["catalog_sequence"]) for r in conditions))
check("不將進給中間值設為推薦值",all(r["feed_mm_per_rev"]["recommended_value"] is None for r in conditions))
check("標準孔11列且每列R/A/B各自保留",len(data["technical_standards"]["rows"])==11
      and all(all(k in r for k in ("R","A","B")) for r in data["technical_standards"]["rows"]))

check("56筆IC相容連接均有刀柄且未跨IC",len(data["compatibility_index"])==56
      and all(c["holder_parts_nos"] and all(next(h for h in holders if h["parts_no"]==pn)["ic"]==c["ic"]
              for pn in c["holder_parts_nos"]) for c in data["compatibility_index"]))
empty = [j for j in data["cutting_column_join"] if not j["column_ids"]]
expected = {i["parts_no"] for i in ins if i["family"]=="ANSI 60°" or i["dimensions"]["d1"]==1.5}
check("51筆切削欄連接，8款ANSI及2款1.50mm保持待確認",len(data["cutting_column_join"])==51
      and len(empty)==10 and {j["insert_parts_no"] for j in empty}==expected)

refs=[]
bad_sources=[]
def walk(obj):
    if isinstance(obj,dict):
        if "pdf_page" in obj and "printed_page" in obj:
            if obj["pdf_page"]!=obj["printed_page"]-53:
                bad_sources.append(obj)
        for v in obj.values(): walk(v)
    elif isinstance(obj,list):
        for v in obj: walk(v)
    elif isinstance(obj,str) and obj.startswith(("sources/","verification/")):
        refs.append(obj)
walk(data)
check("所有PDF/印刷頁來源一致",not bad_sources)
check("所有本機PDF/圖像/文字參照存在",all((ROOT / r).exists() for r in set(refs)))
check("14頁整頁核對圖存在",all((ROOT/f"verification/page-{i:02d}.png").exists() for i in range(1,15)))
check("來源SHA256與記錄一致",hashlib.sha256((ROOT/data["sources"][0]["local_path"]).read_bytes()).hexdigest()==data["sources"][0]["sha256"])

report = ["i-Center 研究資料驗證", "日期：2026-11-10", ""]
report += [("PASS " if ok else "FAIL ")+label for label,ok in checks]
report += ["",f"結果：{sum(ok for _,ok in checks)}/{len(checks)}通過。",
    "文字檢查用於料號/來源一致性，不能取代已完成的表格與尺寸圖目視核對。",
    "原值、推導值、單位/相容推定及不明缺口已分開；未用其他產品補值。",
    "沒有進行刪除、正式頁修改、commit或push。"]
(ROOT / "verification/validation-report.txt").write_text("\n".join(report)+"\n",encoding="utf-8")
print("\n".join(report))
if not all(ok for _,ok in checks):
    raise SystemExit(1)
