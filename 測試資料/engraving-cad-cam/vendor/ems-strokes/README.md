# EMS 單線字型

`EMSTech.svg`（EMS Tech）、`EMSCasualHand.svg`（EMS Casual Hand）、`EMSSwiss.svg`（EMS Swiss）、`EMSCapitol.svg`（EMS Capitol）、`EMSLeague.svg`（EMS League）及 `EMSNeato.svg`（EMS Neato）取自 [Hershey Text SVG fonts](https://github.com/tobiaszimmer/ofxHersheyFont/tree/master/svg-fonts/fonts/EMS)；各檔的 metadata 記錄字型設計者與 SVG 轉換者，並標示 SIL Open Font License。完整授權文字為 `OFL.txt`。

`build-fonts.ps1` 擷取 SVG 中的 95 個可列印 ASCII 字元，寫入 `../../singleline-latin-extra.js`；執行前請確定目前檔案未有需保留的自訂字型資料。筆畫維持原本的開放路徑。中文字形沿用此樣板獨立的中文字筆畫資料；目前不使用 SVG 字距微調資料，連筆字的相鄰字元可能不完全銜接。
