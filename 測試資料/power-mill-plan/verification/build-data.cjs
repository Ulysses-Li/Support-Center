/* 繁體中文說明：本檔僅整理已備妥之型錄研究資料，不建立網站頁面。
 * 數值保留型錄字串與小數位；群組 source 由所屬資料列共同繼承。
 * 以 occurrence_id 識別型錄列，不以 Type 或相似料號合併刀體。
 */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const sourceFile = 'sources/12_Power Mill_p142-147.pdf';
const source = (printed_page, extra = {}) => ({ printed_page, pdf_page: printed_page - 141, ...extra });
const table = (id, page, mounting, section, fields, rows, shared = {}) => ({
  id, source: source(page, { section }), mounting, fields, shared,
  rows: rows.map((values, i) => ({ occurrence_id: `${id}-${String(i + 1).padStart(2, '0')}`, source_row: i + 1, ...Object.fromEntries(fields.map((field, j) => [field, values[j]])) }))
});

// A 系列刀體：共用欄位的 Ap 與刀片型式依原表合併儲存格展開到每列。
const aCyl = table('a-cylindrical', 143, 'cylindrical_shank', 'Cylindrical Shank',
  ['part_no', 'type', 'D_mm', 'd_h6_mm', 'd1_mm', 'ramp_angle_deg', 'L1_mm', 'L_mm', 'Z', 'Ap_mm', 'insert_pattern'], [
    ['00-99802-BC10-10A06','BC10-10A06-100','10','10','9.8','5.0','40','100',2,'5','A9...0602...'],
    ['00-99802-BC12-10A06','BC12-10A06-80','10','12','9.8','5.0','20','80',2,'5','A9...0602...'],
    ['00-99802-BC12-11A06','BC12-11A06-80','11','12','10.8','4.5','22','80',2,'5','A9...0602...'],
    ['00-99802-BC12-12A06','BC12-12A06-80','12','12','11.4','4.0','24','80',2,'5','A9...0602...'],
    ['00-99802-BC16-13A06','BC16-13A06-100','13','16','12.4','3.5','26','100',2,'5','A9...0602...'],
    ['00-99802-BC16-14A06','BC16-14A06-100','14','16','13.4','3.0','28','100',2,'5','A9...0602...'],
    ['00-99802-BC16-15A06','BC16-15A06-100','15','16','14.4','2.5','30','100',3,'5','A9...0602...'],
    ['00-99802-BC16-16A06','BC16-16A06-100','16','16','15.4','2.0','32','100',3,'5','A9...0602...'],
    ['00-99802-BC16-16A10','BC16-16A10-100','16','16','14.5','2.5','32','100',2,'9','A9...1035...'],
    ['00-99802-BC20-20A10','BC20-20A10-120','20','20','18.5','2.0','40','120',3,'9','A9...1035...'],
    ['00-99802-BC25-25A10','BC25-25A10-150','25','25','23.5','1.3','50','150',3,'9','A9...1035...']
  ], { dimensional_unit: 'mm', angle_unit: 'degree', d_tolerance: 'h6', Z_meaning_zh: '刃數', ramp_limit_note: 'p145: Ramping angle should be under α°.' });
const aScrew = table('a-screw-fit', 143, 'screw_fit', 'Screw-Fit Type',
  ['part_no','type','D_mm','ramp_angle_deg','L_mm','M','DPM_mm','Z','Ap_mm','insert_pattern'], [
    ['00-99805-M05-10A06','M05-10A06','10','5.0','13','M5xP0.8','5.5',2,'5','A9...0602...'],
    ['00-99805-M05-11A06','M05-11A06','11','4.5','13','M5xP0.8','5.5',2,'5','A9...0602...'],
    ['00-99805-M06-12A06','M06-12A06','12','4.0','13','M6xP1.0','6.5',2,'5','A9...0602...'],
    ['00-99805-M06-13A06','M06-13A06','13','3.5','13','M6xP1.0','6.5',2,'5','A9...0602...'],
    ['00-99805-M08-14A06','M08-14A06','14','3.0','13','M8xP1.25','8.5',2,'5','A9...0602...'],
    ['00-99805-M08-15A06','M08-15A06','15','2.5','15','M8xP1.25','8.5',3,'5','A9...0602...'],
    ['00-99805-M08-16A06','M08-16A06','16','2.0','15','M8xP1.25','8.5',3,'5','A9...0602...'],
    ['00-99805-M08-17A06','M08-17A06','17','1.5','15','M8xP1.25','8.5',3,'5','A9...0602...'],
    ['00-99802-M08-16A10','M08-16A10','16','2.5','25','M8xP1.25','8.5',2,'9','A9...1035...'],
    ['00-99802-M10-20A10','M10-20A10','20','2.0','30','M10xP1.5','10.5',3,'9','A9...1035...'],
    ['00-99802-M12-25A10-3T','M12-25A10-3T','25','1.3','35','M12xP1.75','12.5',3,'9','A9...1035...'],
    ['00-99805-M12-25A10','M12-25A10','25','1.3','20','M12xP1.75','12.5',3,'9','A9...1035...']
  ], { dimensional_unit:'mm', angle_unit:'degree', Z_meaning_zh:'刃數', DPM_note_zh:'原表欄名 DPM；示意圖也有 MPD/DPM 字樣，保留表頭，不推定為其他標準名稱。', extension_reference:'extension-bars-p164', ramp_limit_note:'p145: Ramping angle should be under α°.' });

// C 系列長、短 screw-fit 的 Type 可相同；完整料號分別保留 99802 與 99805。
const cCyl = table('c-cylindrical', 146, 'cylindrical_shank', 'Cylindrical Shank',
  ['part_no','type','D_mm','d_h6_mm','d1_mm','ramp_angle_deg','L1_mm','L_mm','Z'], [
    ['00-99802-BC12-12C5','BC12-12C5','12','12','10.5','8.0','30','100',2],
    ['00-99802-BC16-16C5','BC16-16C5','16','16','14.5','5.5','40','120',3],
    ['00-99802-BC20-20C5','BC20-20C5','20','20','18','4.0','50','130',3],
    ['00-99802-BC25-25C5','BC25-25C5','25','25','23','3.0','60','150',4]
  ], { dimensional_unit:'mm', angle_unit:'degree', d_tolerance:'h6', Z_meaning_zh:'刃數', insert_types:['C9MT05T105','C9MT05T110H'], Ap_mm:null, note_zh:'此刀體表無 Ap 欄，未沿用 A 系列 Ap。' });
const cScrew = table('c-screw-fit', 146, 'screw_fit', 'Screw-Fit Type',
  ['part_no','type','D_mm','ramp_angle_deg','L_mm','M','DPM_mm','Z','insert_group','table_segment'], [
    ['00-99802-M05-10C4','M05-10C4','10','8','15','M5xP0.8','5.5',2,'C04','upper_99802'],
    ['00-99802-M05-11C4','M05-11C4','11','6','15','M5xP0.8','5.5',2,'C04','upper_99802'],
    ['00-99802-M06-12C5','M06-12C5','12','8','25','M6xP1.0','6.5',2,'C05','upper_99802'],
    ['00-99802-M06-13C5','M06-13C5','13','7.5','25','M6xP1.0','6.5',2,'C05','upper_99802'],
    ['00-99802-M08-16C5','M08-16C5','16','5.5','25','M8xP1.25','8.5',3,'C05','upper_99802'],
    ['00-99802-M08-17C5','M08-17C5','17','5','25','M8xP1.25','8.5',3,'C05','upper_99802'],
    ['00-99802-M10-20C5','M10-20C5','20','4','30','M10xP1.5','10.5',3,'C05','upper_99802'],
    ['00-99802-M10-21C5','M10-21C5','21','3.5','30','M10xP1.5','10.5',3,'C05','upper_99802'],
    ['00-99802-M12-25C5','M12-25C5','25','3','35','M12xP1.75','12.5',4,'C05','upper_99802'],
    ['00-99802-M12-26C5','M12-26C5','26','2.5','35','M12xP1.75','12.5',4,'C05','upper_99802'],
    ['00-99805-M05-11C5','M05-11C5','11','10','13','M5xP0.8','5.5',2,'C05','lower_99805'],
    ['00-99805-M06-12C5','M06-12C5','12','8','13','M6xP1.0','6.5',2,'C05','lower_99805'],
    ['00-99805-M06-13C5','M06-13C5','13','7.5','13','M6xP1.0','6.5',2,'C05','lower_99805'],
    ['00-99805-M08-16C5','M08-16C5','16','5.5','15','M8xP1.25','8.5',3,'C05','lower_99805'],
    ['00-99805-M08-17C5','M08-17C5','17','5','15','M8xP1.25','8.5',3,'C05','lower_99805'],
    ['00-99805-M10-20C5','M10-20C5','20','4','15','M10xP1.5','10.5',3,'C05','lower_99805'],
    ['00-99805-M10-21C5','M10-21C5','21','3.5','15','M10xP1.5','10.5',3,'C05','lower_99805'],
    ['00-99805-M12-25C5','M12-25C5','25','3','20','M12xP1.75','12.5',4,'C05','lower_99805'],
    ['00-99805-M12-26C5','M12-26C5','26','2.5','20','M12xP1.75','12.5',4,'C05','lower_99805']
  ], { dimensional_unit:'mm', angle_unit:'degree', Z_meaning_zh:'刃數', insert_groups:{C04:['C9MT040105','C9MT040110'],C05:['C9MT05T105','C9MT05T110H']}, Ap_mm:null, extension_reference:'extension-bars-p164', note_zh:'upper_99802、lower_99805 為原表位置標識，並非新增的產品系列。C 表給 α°，未自行把 p145 A 系列減進給註記套用到 C 系列。' });

const aInsert06 = {
  id:'a-insert-06', source:source(144,{section:'Insert / size 06'}), insert_size_catalog:'06',
  dimensional_unit:'mm', common_dimensions:{L_mm:'6.5',W_mm:'4',S_mm:'2.45',Ap_mm:'5'}, assembly_id:'assembly-a06',
  fields:['part_no','Re_mm','variants'], rows:[
    {part_no:'A9MT060205',Re_mm:'0.5',variants:[{grade_code:'NC5072',coating_catalog:'TiAlN',iso_grade:'P40'}]},
    {part_no:'A9GT060201U',Re_mm:'0.1',variants:[{grade_code:'NC2032',coating_catalog:'TiAlN',iso_grade:'K20F'}]},
    {part_no:'A9GT060202U',Re_mm:'0.2',variants:[{grade_code:'NC2032',coating_catalog:'TiAlN',iso_grade:'K20F'}]},
    {part_no:'A9GT060205U',Re_mm:'0.5',variants:[{grade_code:'NC2032',coating_catalog:'TiAlN',iso_grade:'K20F'}]},
    {part_no:'A9GT060201H',Re_mm:'0.1',variants:[{grade_code:'NC2033',coating_catalog:'TiAlN',iso_grade:'K20F'},{grade_code:'NC9031',coating_catalog:'TiN',iso_grade:'K20F'}]},
    {part_no:'A9GT060202H',Re_mm:'0.2',variants:[{grade_code:'NC2033',coating_catalog:'TiAIN',coating_normalized:null,coating_note_zh:'原文字層為 TiAIN；此處保留字形，不默認大小寫 I 為小寫 l。',iso_grade:'K20F'},{grade_code:'NC9031',coating_catalog:'TiN',iso_grade:'K20F'}]},
    {part_no:'A9GT060205H',Re_mm:'0.5',variants:[{grade_code:'NC2033',coating_catalog:'TiAIN',coating_normalized:null,coating_note_zh:'原文字層為 TiAIN；此處保留字形，不默認大小寫 I 為小寫 l。',iso_grade:'K20F'},{grade_code:'NC9031',coating_catalog:'TiN',iso_grade:'K20F'}]},
    {part_no:'A9GT060210H',Re_mm:'1.0',variants:[{grade_code:'NC2033',coating_catalog:'TiAIN',coating_normalized:null,coating_note_zh:'原文字層為 TiAIN；此處保留字形，不默認大小寫 I 為小寫 l。',iso_grade:'K20F'}]}
  ], sku_note_zh:'本表 Parts No. 與牌號分開列示；part_no + grade_code 可作資料鍵，不憑空建立原廠完整 SKU。'
};
const aInsert10 = {
  id:'a-insert-10', source:source(144,{section:'Insert / size 10'}), insert_size_catalog:'10',
  dimensional_unit:'mm', common_dimensions:{L_mm:'10',W_mm:'6.6',S_mm:'3.5',Ap_mm:'9'}, assembly_id:'assembly-a10',
  rows:[
    {part_no:'A9MT1035',Re_mm:'0.4',variants:[{grade_code:'NC2032',coating_catalog:'TiAIN',coating_normalized:null,coating_note_zh:'原文字層為 TiAIN；未自行正規化字形。',iso_grade:'K20F'}]},
    {part_no:'A9GT103505H',Re_mm:'0.5',variants:[{grade_code:'NC9031',coating_catalog:'TiN',iso_grade:'K20F'}]}
  ], sku_note_zh:'本表 Parts No. 與牌號分開列示；part_no + grade_code 可作資料鍵，不憑空建立原廠完整 SKU。'
};
const cInsert = {
  id:'c-inserts',source:source(147,{section:'Insert'}),dimensional_unit:'mm',
  coating_catalog:'AITiN',coating_normalized:null,coating_note_zh:'原文字層為 AITiN；I/l 字形容易混淆，保留來源字形，尚未正規化為化學鍍層名稱。',
  rows:[
    {sku:'C9MT040105-NC30',part_no:'C9MT040105',grade_code:'NC30',iso_grade:'K10F',L_mm:'4',S_mm:'1.59',Re_mm:'0.5',assembly_id:'assembly-c04'},
    {sku:'C9MT040110-NC30',part_no:'C9MT040110',grade_code:'NC30',iso_grade:'K10F',L_mm:'4',S_mm:'1.59',Re_mm:'1.0',assembly_id:'assembly-c04'},
    {sku:'C9MT05T105-NC30',part_no:'C9MT05T105',grade_code:'NC30',iso_grade:'K10F',L_mm:'5',S_mm:'2.0',Re_mm:'0.5',assembly_id:'assembly-c05'},
    {sku:'C9MT05T110H-NC2032',part_no:'C9MT05T110H',grade_code:'NC2032',iso_grade:'K20F',L_mm:'5',S_mm:'2.0',Re_mm:'1.0',assembly_id:'assembly-c05'}
  ], dimensions_not_listed:{W_mm:null,Ap_mm:null}, note_zh:'此表未提供 W 與 Ap；切削 Ap 範圍見 C 系列專屬 cutting-data。'
};
for(const group of [aInsert06,aInsert10,cInsert]) group.rows.forEach((r,i)=>{r.source_row=i+1;});

const product = {
  schema_version:'1.0',status:'research_only_not_published',prepared_on:'2026-11-12',source_file:sourceFile,
  scope:{pdf_pages:[1,2,3,4,5,6],printed_pages:[142,143,144,145,146,147],note_zh:'依已備文字、表格與六頁 PNG 逐頁核對；未查詢網站，未建立前端頁面。'},
  conventions:{source_inheritance_zh:'series、table、insert group 的 source 適用其所有子資料；source_row 表示該來源表從第一筆產品列起算。',numeric_values_zh:'尺寸、角度、切削值以原數字字串保留小數位；Z 為刃數整數。null 表示未提供或待確認，不能視為 0。',quote_policy_zh:'英文字串保留原型錄用語與可辨認錯字，不擅自修正文案。',units:{dimensions:'mm',angle:'degree',torque:'Nm'}},
  overview:{source:source(142),title:'Power Mill',subtitle:'Indexable Milling Cutter 10mm',claim:'Patented dual relief angle insert!',material_class_icons:['P','K'],claims:['Higher Feed Rate.','Higher Wearing Resistance!','Fast Chip Removal!'],series:[{id:'A',name:'Shoulder Face Mills',diameter_range_catalog:'Ø10 ~ Ø25mm',shoulder_angle_deg:'90'},{id:'C',name:'Torus Radius Mills',diameter_range_catalog:'Ø10 ~ Ø26mm',radius_symbol:'R'}],application_diagrams:{count_per_series:5,labels:null,note_zh:'應用圖未逐一印文字名稱；保留頁面位置供後續製圖或命名確認。'}},
  series:[
    {id:'A',name:'Shoulder Face Mills',source:source(143),features:['Strong insert with high positive geometry and helical cutting edges.','Shoulder mill with good cutting performance and cutting edge strength. which produce perfect 90° shoulders.'],holder_tables:[aCyl,aScrew],insert_tables:[aInsert06,aInsert10],insert_features:{source:source(144),general:['U type insert is fully ground for reducing the cutting resistance during the cutting, best choice for long shank cutter.','H type with high positive rake angle, shape edge.'],grade_notes:[
      {grade_code:'NC5072',label:'NC5072',notes:['High rigidity, special edge honing, resistance of impact during milling operation.','Special chip breaker design for high removal rate.','P40 tougher grade for smooth cutting, good for all kinds of steel.']},
      {grade_code:'NC2032',label:'U-NC2032',notes:['High rigidity, special edge honing, resistance of impact during milling operation.','For all kinds of steel from < 50 HRC, carbon steel, alloy steel, cast iron, aluminum and non-ferrous metal.']},
      {grade_code:'NC2033',label:'H-NC2033',notes:['Sharp cutting edge and high positive rake angle, good for finishing milling and surface roughness.','Re 0.5 and Re1.0 for your option.','Sutiable for all kinds of steel.']},
      {grade_code:'NC9031',label:'H-NC9031',notes:['Sharp cutting edge and high positive rake angle, low friction coefficient for non-ferrous metal.','Good for Al, Al-alloy, Copper, Copper alloy and Non-Ferrous metal.']},
      {grade_code:'NC2032',label:'NC2032',scope:'size 10 description',notes:['High rigidity, special edge honing, resistance of impact during milling operation.','Special chip breaker design for high removal rate.','Good for hard cutting carbon steel and alloy steel.']}
    ]}},
    {id:'C',name:'Torus Radius Mills',source:source(146),features:['Good for corner finishing.','Series C is developed for replacement of the other milling cutters with ramp feed.'],holder_tables:[cCyl,cScrew],insert_tables:[cInsert],insert_features:{source:source(147),general:['Submicron carbide inserts are fully ground.','Special design milling cutter and ground insert for semi-finishing 3D surface milling for mold industry.'],dual_relief:{title:'Dual Relief Angle Insert',angles_deg:['7','15'],diagram_Re_mm:'1.0',diagram_axes:['X','Y'],claims:['Higher feed rate!','Higher wearing resistance!']},grade_notes:[{grade_code:'NC30',notes:['Flat cutting edge design, universal type for all kind of materials.']},{grade_code:'NC2032',notes:['High positive angle, special chip breaker design, higher wearing resistance.','Good for hardened material.']}]}}
  ],
  assemblies:[
    {id:'assembly-a06',source:source(144,{section:'Insert / size 06 / Screw-Key'}),screw:'NS-18037',screw_catalog:'*NS-18037',torque_Nm:'0.6',key:'NK-T6',note:'Torque screwdriver is recommended.'},
    {id:'assembly-a10',source:source(144,{section:'Insert / size 10 / Screw-Key'}),screw:'NS-25060',screw_catalog:'*NS-25060',torque_Nm:'0.9',key:'NK-T7',note:'Torque screwdriver is recommended.'},
    {id:'assembly-c04',source:source(147,{section:'Insert / C9MT04 / Screw-Key'}),screw:'NS-18037',screw_catalog:'*NS-18037',torque_Nm:'0.6',key:'NK-T6',note:'Torque screwdriver is recommended.'},
    {id:'assembly-c05',source:source(147,{section:'Insert / C9MT05 / Screw-Key'}),screw:'NS-20045',screw_catalog:'*NS-20045',torque_Nm:'0.6',key:'NK-T6',note:'Torque screwdriver is recommended.'}
  ],
  external_references:[{id:'extension-bars-p164',printed_page:164,pdf_page:null,mentioned_at:[source(143),source(146)],subject:'extension bars',status:'outside_provided_6_pages',resolved_file:null,resolved_products:null,note_zh:'僅保存型錄交叉引用；未載入 p164，未虛構延長桿料號或裝配配對。'}],
  counts:{holder_rows:46,A_holder_rows:23,A_cylindrical:11,A_screw_fit:12,C_holder_rows:23,C_cylindrical:4,C_screw_fit:19,insert_part_numbers:14,A_insert_part_numbers:10,C_insert_part_numbers:4,insert_grade_variants:17,A_insert_grade_variants:13,C_insert_grade_variants:4,assembly_groups:4},
  unresolved:[{id:'coating-glyphs',source:[source(144),source(147)],field:'coating_catalog',value:null,note_zh:'TiAlN / TiAIN 與 AITiN 的 I/l 字形不全一致；資料保留所見文字，不自行做化學名稱合併。'}, {id:'extension-match',source:[source(143),source(146)],value:null,note_zh:'p164 延長桿及其配對未在六頁來源中。'}, {id:'application-labels',source:source(142),value:null,note_zh:'應用圖未印文字標籤，待使用者確認命名或取得官方圖說。'}]
};

// 切削表兩個不同示意圖的 Ap 必須分開保存，不能簡化成一個 Ap 欄。
function aCutTable(id, size, holderRange, rows){
  const fields=['iso_material_group','work_material','sample_code_JIS','Vc_m_per_min','fz_mm_per_tooth','diagram_1_Ap_mm','diagram_2_Ap_mm','diagram_2_Ae_mm','insert_grades'];
  return {id,series_id:'A',source:source(145,{section:`Insert Size: ${size}mm (Holder ${holderRange})`}),insert_size_mm:size,holder_diameter_range_catalog:holderRange,
    operation_diagrams:[{id:'diagram_1',position:'first Ap column after fz',dimensions:['Ap_mm'],operation_name:null,note_zh:'原表第一張工法示意圖，僅標 Ap；未印工法名稱，不自行命名。'},{id:'diagram_2',position:'second Ap column and following Ae column',dimensions:['Ap_mm','Ae_mm'],operation_name:null,note_zh:'原表第二張工法示意圖，同時標 Ap、Ae；與第一張圖分開。'}],
    rows:rows.map((v,i)=>{const row=Object.fromEntries(fields.map((f,j)=>[f,v[j]]));return {source_row:i+1,...row};})};
}
const cutting = {
  schema_version:'1.0',status:'research_only_not_published',source_file:sourceFile,
  conventions:{source_inheritance_zh:'每個 table 的 source 適用其所有 rows；source_row 由第一筆材質列起算。',range_format:'原型錄 ~ 範圍字串；未以中間值代替。',units:{Vc:'m/min',fz:'mm/tooth',Ap:'mm',Ae:'mm'},null_zh:'未列示之樣本代碼為 null；不推測材料等級。'},
  series_A:{source:source(145),notes:[{text:'Reduce the feed rate 30% from the below table for slotting operation.',applies_to:'series A / both insert-size tables',feed_reduction_percent:30,remaining_feed_factor:'0.70'},{text:'Ramping angle should be under α°. (Please refer to holder specifications)',applies_to:'series A',limit:{operator:'<',field:'holder.ramp_angle_deg',unit:'degree'},holder_source:source(143)}],tables:[
    aCutTable('a-cutting-6p5','6.5','Ø10~Ø17mm',[
      ['P','Carbon Steel','P5','80~150','0.03~0.07','1.5','4','1.5',['NC5072','NC2033']],
      ['P','Low alloy steel','SCM440','80~150','0.03~0.07','1.5','4','1',['NC5072','NC2033']],
      ['P','High alloy steel','SKD11','60~120','0.03~0.07','1','2.5','1',['NC5072','NC2033']],
      ['M','Stainless steel','SUS304','60~120','0.01~0.05','0.5','2','1',['NC5072','NC2033']],
      ['K','Cast Iron','FC25','60~120','0.03~0.07','1','2.5','1',['NC5072','NC2033']],
      ['K','Malleable Cast Iron',null,'100~150','0.03~0.07','1.5','4','1.5',['NC5072','NC2033']],
      ['N','Non-ferrous metal','A6061','200~500','0.03~0.07','2','4','2',['NC9031']]
    ]),
    aCutTable('a-cutting-10','10','Ø16~Ø25mm',[
      ['P','Carbon Steel','P5','150~250','0.08~0.15','3','8','3',['NC2032']],
      ['P','Low alloy steel','SCM440','150~250','0.08~0.15','3','8','2',['NC2032']],
      ['P','High alloy steel','SKD11','120~200','0.08~0.15','2','4','2',['NC2032']],
      ['M','Stainless Steel','SUS304','80~120','0.04~0.08','1','4','2',['NC2032']],
      ['K','Cast Iron','FC25','120~200','0.08~0.12','2','5','2',['NC2032']],
      ['K','Malleable Cast Iron',null,'100~150','0.06~0.10','3','8','3',['NC2032']],
      ['N','Non-ferrous metal','A6061','200~500','0.03~0.07','5','8','3',['NC9031']]
    ])],
    surface_roughness_comparison:{source:source(145,{section:'Surface Roughness Comparison'}),claim:'Nine9 A series shoulder face mill insert receive a better result of surface finish.',unit:'µm',metric_name:null,comparisons:[{label:'Competitor B',value:'32'},{label:'Competitor A',value:'20.2'},{label:'Nine9',value:'14.5',insert_caption:'A9MT1035 NC2033'}],vertical_positions_mm:['0','7','14','21','28'],test_conditions:null,note_zh:'圖未註明 Ra/Rz 或完整測試條件，不據此標成特定粗糙度指標。圖中 A9MT1035 NC2033 與 p144 尺寸10產品表的 NC2032 不同，保留圖說，不以此新增販售 SKU。'}
  },
  series_C:{source:source(147),notes:[{text:'Recommand Ae below 2.5mm.',applies_to:'series C',Ae_limit:{operator:'<',value:'2.5',unit:'mm'}}],tables:[{id:'c-cutting',series_id:'C',source:source(147,{section:'Cutting Data'}),operation_diagram:{dimensions:['Ap_mm'],operation_name:null,note_zh:'原圖只有 Ap 標註；Ae 限制來自表上方註記。'},rows:[
    {source_row:1,iso_material_group:'P',work_material:'Carbon Steel',sample_code_JIS:'P5',Vc_m_per_min:'150~300',fz_mm_per_tooth:'0.2~0.5',Ap_mm:'0.2~0.5',insert_grades:['NC30','NC2032']},
    {source_row:2,iso_material_group:'P',work_material:'Alloy Steel',sample_code_JIS:'SCM440',Vc_m_per_min:'120~250',fz_mm_per_tooth:'0.2~0.5',Ap_mm:'0.2~0.5',insert_grades:['NC30','NC2032']},
    {source_row:3,iso_material_group:'M',work_material:'Stanless Steel',work_material_normalized:'Stainless Steel',sample_code_JIS:'SUS304',Vc_m_per_min:'120~200',fz_mm_per_tooth:'0.2~0.4',Ap_mm:'0.2~0.4',insert_grades:['NC30','NC2032']},
    {source_row:4,iso_material_group:'H',work_material:'Hardened steel < HRC52',sample_code_JIS:'SKD61',hardness_limit:{operator:'<',value:'52',unit:'HRC'},Vc_m_per_min:'100~150',fz_mm_per_tooth:'0.1~0.3',Ap_mm:'0.1~0.3',insert_grades:['NC2032']}
  ]}],note_zh:'C 系列只使用 p147 自有四列切削資料；未套用 A 系列 p145 表，也未自行套用其 slotting 減進給註記。'},
  counts:{A_tables:2,A_material_rows:14,C_tables:1,C_material_rows:4,total_material_rows:18},
  unresolved:[{id:'a-operation-diagram-names',source:source(145),value:null,note_zh:'兩張工法圖未印名稱；保留 diagram_1、diagram_2 與各自 Ap/Ae。'}, {id:'roughness-test-conditions',source:source(145),value:null,note_zh:'比較圖未列完整工況與粗糙度指標；圖說 NC2033 與 p144 尺寸10表之 NC2032 應於正式製頁前確認。'}]
};

const pageMap = {
  schema_version:'1.0',status:'preparation_only',source_file:sourceFile,total_pdf_pages:6,printed_page_range:[142,147],
  pages:[
    {printed_page:142,pdf_page:1,title:'Power Mill',sections:['產品概覽','A / C 系列應用與直徑範圍'],image:'verification/page-1.png',text:'verification/visible-page-01.txt',data_locations:['product-data.json:overview'],assets_to_prepare_later:['產品主視覺','A/C 系列應用示意圖'],note_zh:'標題為 Indexable Milling Cutter 10mm；A 系列也有 06 / 6.5mm 刀片資料，不以標題排除。'},
    {printed_page:143,pdf_page:2,title:'A Series Shoulder Face Mills',sections:['Features','Cylindrical Shank','Screw-Fit Type'],image:'verification/page-2.png',text:'verification/visible-page-02.txt',tables:[{id:'a-cylindrical',data_rows:11},{id:'a-screw-fit',data_rows:12}],data_locations:['product-data.json:series[A].holder_tables'],external_refs:[164]},
    {printed_page:144,pdf_page:3,title:'A Series Shoulder Face Mills / Insert',sections:['Insert / geometry and grade notes','Insert size 06','Insert size 10','Screw / Key / torque'],image:'verification/page-3.png',text:'verification/visible-page-03.txt',tables:[{id:'a-insert-06',part_numbers:8,grade_variants:11},{id:'a-insert-10',part_numbers:2,grade_variants:2}],data_locations:['product-data.json:series[A].insert_tables','product-data.json:series[A].insert_features','product-data.json:assemblies[assembly-a06/assembly-a10]']},
    {printed_page:145,pdf_page:4,title:'Cutting Data',sections:['A series 6.5mm cutting data','A series 10mm cutting data','Surface Roughness Comparison','slotting / ramping notes'],image:'verification/page-4.png',text:'verification/visible-page-04.txt',tables:[{id:'a-cutting-6p5',material_rows:7},{id:'a-cutting-10',material_rows:7}],data_locations:['cutting-data.json:series_A'],note_zh:'兩個不同工法圖各有 Ap；第二圖另有 Ae，不可展平成單一 Ap。'},
    {printed_page:146,pdf_page:5,title:'C Series Torus Radius Mills',sections:['Features','Cylindrical Shank','Screw-Fit Type'],image:'verification/page-5.png',text:'verification/visible-page-05.txt',tables:[{id:'c-cylindrical',data_rows:4},{id:'c-screw-fit',data_rows:19,upper_99802_rows:10,lower_99805_rows:9}],data_locations:['product-data.json:series[C].holder_tables'],external_refs:[164],note_zh:'上下段 Type 有八組重複，完整料號前綴不同；L25 / L13 等長度不能合併或擇一。'},
    {printed_page:147,pdf_page:6,title:'C Series Torus Radius Mills / Insert / Cutting Data',sections:['Dual Relief Angle Insert','Insert','Screw / Key / torque','C series cutting data'],image:'verification/page-6.png',text:'verification/visible-page-06.txt',tables:[{id:'c-inserts',part_numbers:4,grade_variants:4},{id:'c-cutting',material_rows:4}],data_locations:['product-data.json:series[C].insert_tables','product-data.json:series[C].insert_features','product-data.json:assemblies[assembly-c04/assembly-c05]','cutting-data.json:series_C'],note_zh:'Ae < 2.5mm；淬硬鋼 < 52HRC。'}
  ],
  future_content_plan_zh:[
    {section:'系列總覽',data:'product-data.json:overview',sources:[142]},
    {section:'A 系列刀體與刀片規格',data:'product-data.json:series[A]',sources:[143,144]},
    {section:'A 系列切削條件與使用註記',data:'cutting-data.json:series_A',sources:[145]},
    {section:'C 系列刀體與刀片規格',data:'product-data.json:series[C]',sources:[146,147]},
    {section:'C 系列切削條件與使用註記',data:'cutting-data.json:series_C',sources:[147]},
    {section:'裝配與延長桿',data:'product-data.json:assemblies / external_references',sources:[143,144,146,147],external_page:164,status:'延長桿部分待補'}
  ],
  frontend_status_zh:'未建立任何 HTML/CSS/JS 前端頁面，未修改正式頁面，未發布。PNG 僅為來源驗證材料，尚未裁切成正式網站資產。'
};

const notes = `Power Mill 型錄資料整理筆記
整理日期：2026-11-12
範圍：sources/12_Power Mill_p142-147.pdf，PDF 共 6 頁，印刷頁 142-147。
方法：讀取已備妥的 visible-page-01 至 06.txt、raw-tables.json，逐頁檢視 page-1 至 6.png；未重新抽取原 PDF、未安裝套件、未上網查補。
狀態：僅本機研究資料，不建頁、不改正式頁、不發布、不 commit。

資料檔
- product-data.json：概覽、A/C 兩系列刀體、刀片料號與牌號、尺寸、Z 刃數、ramp α°、裝配與來源。
- cutting-data.json：A 系列 6.5 / 10mm 兩組與 C 系列獨立切削表、工法圖欄位、註記及表面品質比較。
- page-map.json：印刷頁/PDF頁對照、頁面內容、資料指向、未來內容區塊計畫。
- verification/validation-report.txt：結構、數量、必要界限與路徑檢查結果。
- verification/build-data.cjs：本次人工核對結果的可重現資料編製程式；僅研究用，非網站程式。

已核對數量
- 刀體 46 列：A 23（圓柱柄 11 + screw-fit 12）；C 23（圓柱柄 4 + screw-fit 19）。
- A 刀片：尺寸06 有 8 個料號、11 個料號/牌號組合；尺寸10 有 2 個料號、2 個組合。
- C 刀片：4 個完整 SKU、4 個料號/牌號組合。總計 14 個刀片料號、17 個組合。
- 裝配規格 4 組；切削表 3 張、材質列 18（A 7+7；C 4）。

重要規則與判讀
1. A 與 C 分群保存，不能把 p145 的 A 系列表用到 C 系列。C 切削表在 p147。
2. p143 尺寸06 的刀體 Ap=5；尺寸10 Ap=9。p144 刀片 size 06 對應 L=6.5mm；保留兩種原標示，不把06誤當6.0mm。
3. p145 各表有兩張不同工法示意圖。第一圖只有 Ap；第二圖有 Ap 與 Ae。各自保存為 diagram_1_Ap、diagram_2_Ap、diagram_2_Ae；原表未印工法名稱，不自行猜測名稱。
4. p145 fz 單位 mm/tooth；slotting 進給減少30%（剩70%），ramping 必須小於各 A 刀體的 α°，不是任一系列通用角度。
5. p146 screw-fit 上段10列 00-99802，下段9列 00-99805；八組 Type 名稱相同，完整料號不同。例：00-99802-M06-12C5 的 L=25；00-99805-M06-12C5 的 L=13。保留各列 occurrence_id，不以 Type 去重，也不擇一。
6. p146 M05-10C4、M05-11C4 對應 C9MT04 系列刀片，其餘 C5 對應 C9MT05。C 刀體表未列 Ap，保持 null，不能套 A 系列值。
7. p147 C 切削註記 Ae below 2.5mm，保存為嚴格小於；淬硬鋼列為 Hardened steel < HRC52，保存為 HRC<52。
8. p144 刀片 Parts No. 與牌號分欄；保留兩欄，不創造原廠完整 SKU。p147 完整 SKU 包含 -NC30 或 -NC2032，照原文保存。
9. 每個群組有 printed_page / pdf_page；source_row 由該表第一個資料列起算，群組來源由子列繼承。
10. 數值以字串保存小數位與 ~ 範圍；Z 為整數，null 表示未提供/待確認，不能用0代替。

來源不確定與缺口
- p143/p146 指向 p164 extension bars。p164 不在本6頁範圍，未建立延長桿型號或配對，resolved_file / resolved_products 為 null。
- p144 鍍層文字有 TiAlN / TiAIN 字形差異，p147 為 AITiN。I/l 容易混淆；保留來源字串，相關 coating_normalized 為 null，正式產品文案正規化前應確認原廠名稱。
- p145 表面品質圖寫 Nine9 A9MT1035 NC2033；p144 尺寸10刀片表寫 A9MT1035 NC2032。圖說與產品表分別照錄，不建立額外NC2033販售品項。圖未明示 Ra/Rz 或完整測試條件，metric_name / test_conditions 為 null。
- p144 H-NC2033 文案提 Re 0.5、1.0，尺寸06規格表另列0.1、0.2；文案與規格各自保留，未刪除小圓角規格。
- p142 應用圖每系列5個但未逐一印圖名，尚未將工法名稱寫死；p145 兩張工法圖也尚未命名。
- 英文原稿包含 Sutiable、Stanless、Recommand、shape edge 等拼字/用語；原文保存於資料，不把字串修正當作來源事實。
- 未另建正式網站圖片；verification 全頁PNG只用於核對。後續若裁圖或重繪，需再檢視實際視覺與權限範圍。

建頁前所需補充
- 確認 p164 延長桿資料是否需列入及對應型號。
- 確認鍍層 I/l 字形與表面品質比較圖的牌號。
- 確認是否保留沒有完整工況的表面品質比較圖，及應用/工法圖要用的官方名稱。
- 正式網站或樣板需另依專案規範實作，這次資料準備不代表設計確認或發布授權。
`;

// 基本驗證：檢查數量、來源、單位、分群與所有研究檔案路徑；不更動其他工作。
const allHolderTables = product.series.flatMap(s=>s.holder_tables);
const allHolderRows = allHolderTables.flatMap(t=>t.rows);
assert.equal(allHolderRows.length,46);
assert.deepEqual(allHolderTables.map(t=>t.rows.length),[11,12,4,19]);
assert.equal(new Set(allHolderRows.map(r=>r.occurrence_id)).size,46);
assert.equal(new Set(allHolderRows.map(r=>r.part_no)).size,46);
const inserts=product.series.flatMap(s=>s.insert_tables);
assert.equal(inserts.reduce((n,g)=>n+g.rows.length,0),14);
assert.equal(inserts.reduce((n,g)=>n+g.rows.reduce((v,r)=>v+(r.variants?.length||1),0),0),17);
const typeGroups = Map.groupBy(cScrew.rows,r=>r.type);
const repeatedTypes = [...typeGroups].filter(([_,rows])=>rows.length>1);
assert.equal(repeatedTypes.length,8);
assert.equal(cScrew.rows.filter(r=>r.table_segment==='upper_99802').length,10);
assert.equal(cScrew.rows.filter(r=>r.table_segment==='lower_99805').length,9);
const m06 = cScrew.rows.filter(r=>r.type==='M06-12C5');
assert.deepEqual(m06.map(r=>[r.part_no,r.L_mm]),[['00-99802-M06-12C5','25'],['00-99805-M06-12C5','13']]);
for(const t of allHolderTables){assert.equal(t.source.pdf_page,t.source.printed_page-141);for(const r of t.rows){assert.ok(Number.isInteger(r.Z)&&r.Z>0);assert.ok(Number(r.ramp_angle_deg)>0);assert.ok(Number(r.D_mm)>0);}}
const aCut=cutting.series_A.tables;
assert.deepEqual(aCut.map(t=>t.rows.length),[7,7]);
assert.equal(cutting.series_C.tables[0].rows.length,4);
assert.equal(cutting.series_C.source.printed_page,147);
assert.equal(cutting.series_C.notes[0].Ae_limit.operator,'<');
assert.equal(cutting.series_C.tables[0].rows[3].hardness_limit.value,'52');
assert.equal(cutting.series_C.tables[0].rows[3].hardness_limit.operator,'<');
assert.equal(cutting.series_A.notes[0].feed_reduction_percent,30);
assert.equal(cutting.series_A.notes[0].remaining_feed_factor,'0.70');
assert.equal(cutting.series_A.notes[1].limit.operator,'<');
for(const t of aCut)for(const r of t.rows){assert.ok(r.diagram_1_Ap_mm);assert.ok(r.diagram_2_Ap_mm);assert.ok(r.diagram_2_Ae_mm);assert.ok(!Object.hasOwn(r,'Ap_mm'));}
for(const p of pageMap.pages){assert.equal(p.printed_page,p.pdf_page+141);assert.ok(fs.existsSync(path.join(root,p.image)));assert.ok(fs.existsSync(path.join(root,p.text)));}
assert.ok(fs.existsSync(path.join(root,sourceFile)));
for(const [name,data] of [['product-data.json',product],['cutting-data.json',cutting],['page-map.json',pageMap]]){
  fs.writeFileSync(path.join(root,name),JSON.stringify(data,null,2)+'\n','utf8');
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(root,name),'utf8')),data);
}
fs.writeFileSync(path.join(root,'research-notes.txt'),notes,'utf8');
const report = `Power Mill validation report
Date: 2026-11-12
Result: PASS - structured research data and required boundaries validated.
Source: ${sourceFile} (PDF pages 1-6 / printed pages 142-147)
Visual review: all six prepared PNG pages inspected; visible text and raw tables cross-checked.

Counts
PASS holders total: 46 rows / 46 occurrence IDs / 46 distinct full part numbers.
PASS A holders: cylindrical 11 + screw-fit 12 = 23.
PASS C holders: cylindrical 4 + screw-fit 19 = 23.
PASS C screw-fit upper 99802: 10; lower 99805: 9; repeated Types: 8 pairs.
PASS insert part numbers: A06 8 + A10 2 + C 4 = 14.
PASS part/grade variants: A06 11 + A10 2 + C 4 = 17.
PASS assembly groups: 4.
PASS cutting tables: A 2 (7+7 material rows), C 1 (4 material rows); total 18.

Data integrity
PASS JSON round-trip parse for product-data.json, cutting-data.json, page-map.json.
PASS every holder row retains original part number, Type, diameter, lengths, Z, ramp angle and row occurrence.
PASS all holder Z values positive integers; diameters and ramp angles positive.
PASS table source printed_page and pdf_page mappings (pdf_page = printed_page - 141).
PASS source PDF, all 6 validation PNGs and all 6 visible-text files exist.
PASS A cutting first-diagram Ap and second-diagram Ap/Ae are distinct fields.
PASS fz unit preserved as mm/tooth; Vc m/min; Ap/Ae mm.
PASS A slotting reduction 30 percent (remaining factor 0.70).
PASS A ramp angle strict less-than holder alpha, source p143 and p145.
PASS C independent p147 table; Ae < 2.5 mm; hardened steel < 52 HRC.
PASS example separate occurrences: 00-99802-M06-12C5 L25; 00-99805-M06-12C5 L13.
PASS p164 extension-bar reference remains external/unresolved; no invented SKU or matching.

Review limitations / open items
OPEN coating I/l glyph spelling is retained; ambiguous normalized values null.
OPEN p145 roughness illustration caption A9MT1035 NC2033 differs from p144 table A9MT1035 NC2032.
OPEN roughness metric (Ra/Rz), test conditions and unnamed application/operation diagrams remain null.
OPEN extension bars on printed p164 outside supplied 6 pages.
NOTE dimensional numbers are strings to preserve printed decimals and ranges; they are not silently rounded.
NOTE source_row represents logical data rows, with shared/merged cells preserved through parent fields.

Artifacts written (research only)
product-data.json
cutting-data.json
page-map.json
research-notes.txt
verification/validation-report.txt
verification/build-data.cjs (reproducible research-data authoring script)
No frontend page, no publishing and no commit performed by this script.
`;
fs.writeFileSync(path.join(root,'verification','validation-report.txt'),report,'utf8');
console.log(JSON.stringify({status:'PASS',holder_rows:46,insert_part_numbers:14,insert_grade_variants:17,cutting_material_rows:18,repeated_C_types:8,files_written:6}));
