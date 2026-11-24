雕刻工具共用資料、圖面與來源
建立日期：2026-11-24

四個產品入口
/CuttingData/X060/index.html
/CuttingData/V060/index.html（V060 / V045 合併產品組）
/CuttingData/W060/index.html
/CuttingData/N9MTW/index.html

共用資料
data/common.json：共通裝夾、冷卻、偏擺、單位及網站計算原則。
各產品自己的data/catalog.json、cutting-data.json與selection-rules.json保留實體刀片、刀柄、套件、切削表及限制。
規格資料合計36筆刀片/牌號、17支刀柄、7種套件、74筆按型號/底型分開的切削列。
catalog與cutting-data的source路徑以「產品入口資料夾」為起點，不是data子資料夾。
共用common.json的source路徑以本Engraving資料夾為起點。

型錄來源
sources/Engraving-Tool-p068-083.pdf：完整16頁；型錄p68對PDF第1頁，PDF頁=型錄頁-67。
來源PDF與原件逐位元相同，只將正式站檔名改為實際產品名稱。
SHA256：54bce9c904371810eed1641882c151834a082233fe5a645b7ee5a62f6d621052
sources/manifest.json保留來源識別、頁碼及雜湊。

diagrams.js
瀏覽器：window.EngravingDiagrams
Node：require('./diagrams.js')
API：render({family, insert, holder, state}) => SVG字串；family供未選實體料號時顯示該系列外形參考。
insert支援原欄part_base、angle_deg、engraving_limits_mm、insert_dimensions_mm，以及core的partBase、angle、limits、dimensions。
holder支援原欄part_number、shank_diameter、length_L_mm、length_L1_mm，以及core的partNumber、shankLabel、length、L1。
V060-04依p76顯示Ø6前頭、Ø4後端的台階；L1=12mm是台階至尾端的後段長度，不是前端頸長或可加工深度。
state.width、state.depth是客戶需求，顯示為需求W/t；不控制圖形比例，也不當作精確槽形換算。
所有系列皆使用assets/內各自原始向量圖：X060 p71、V045 p75、V060與V060-04 p76、W060 p77、N9MT-W p78。
只將原圖填色整理為淡藍／淡橘，移除漸層影像、文字和尺寸線；動態尺寸及底部刻槽圖維持原版。
提取頁碼、裁切範圍、原始路徑索引與SHA256記錄在對應source JSON；圖面為型錄共同刀柄組裝示例。
V060-04採獨立台階柄原圖，以來源座標錨定後端Ø4、前頭Ø6及後段12mm；較短圖面保持原始長高比。
N9MT-W的Ø10與Ø3/8共用p78同一張外形；尺寸文字仍來自所選實體刀柄。
未選定刀柄時不輸出假定的總長或柄徑數字。
SVG含role=img、title、desc；所有動態文字先XML跳脫；未知欄位維持「型錄未列」，不填0。
Radius、Radius Angled、Angled三種底形各自表達；W06的Re0.2±0.05與W03未知Re分開。

catalog-notes.html
資料說明頁直接讀四產品正式JSON；可使用?product=X060、V060、W060或N9MTW切換。
產品型錄與資料缺口全部依來源頁碼回查，未列參數不任意跨材種或跨刀片補值。

重要計算邊界
f為mm/rev，F=S×f，不乘可換刃角數；Z向下刀進給為0.5F。
型錄S範圍不等於所有刀柄/夾具/突出量的額定上限；G6.3/10000rpm為預平衡條件。
V045無NC2035實體訂購料號，不能由共表創造；N9MT90度尺寸0.9mm與切削表0.8mm不同。
100mm XL柄只供鋁及鋁合金，generic非鐵金屬不足以放行。
單道Ap/Finishing原表不等於完整NC循環，不自動累加使總深超過需求或Tmax。
