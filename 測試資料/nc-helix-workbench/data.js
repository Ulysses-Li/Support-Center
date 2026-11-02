/* NC Helix Drill 樣板資料：逐列核對官方 Cutting Data 三張原表。
 * 核對日期：2026-11-02。官方圖片未標版次，不將下載日期冒稱型錄版次。
 * 只提供原表直徑節點，不把鄰近節點或內部舊資料當成官方插值規則。
 * 每列保留 Vc/grade，因 020-2540 部分材料與其他刀具不同。
 */
const HELIX_DATA = (() => {
  const materials = [
    {id:"carbon025",label:"Carbon steel · 0.25% C",iso:"P",color:"#0067ad",vc:{"99321":120,"99323":200},grade:"NC2032"},
    {id:"carbon045",label:"Carbon steel · 0.45% C",iso:"P",color:"#0067ad",vc:{"99321":120,"99323":200},grade:"NC2032"},
    {id:"carbon060",label:"Carbon steel · 0.60% C",iso:"P",color:"#0067ad",vc:{"99321":100,"99323":150},grade:"NC5075"},
    {id:"lowAlloy",label:"Low alloy steel",iso:"P",color:"#0067ad",vc:{"99321":70,"99323":120},grade:"NC5072"},
    {id:"highAlloy",label:"High alloy steel",iso:"P",color:"#0067ad",vc:{"99321":60,"99323":90},grade:"NC5072"},
    {id:"stainless",label:"Stainless steel",iso:"M",color:"#edc632",vc:{"99321":60,"99323":90},grade:"NC5072"},
    {id:"castIron",label:"Cast iron",iso:"K",color:"#df3845",vc:{"99321":70,"99323":120},grade:"NC2032"},
    {id:"aluminium",label:"Aluminium",iso:"N",color:"#14974a",vc:{"99321":345,"99323":500},grade:"NC2032"},
    {id:"copper",label:"Copper",iso:"N",color:"#14974a",vc:{"99321":200,"99323":400},grade:"NC2032"},
    {id:"nickel",label:"Nickel alloy",iso:"S",color:"#c9277c",vc:{"99321":20,"99323":28},grade:"NC5075"},
    {id:"titanium",label:"Titanium",iso:"S",color:"#c9277c",vc:{"99321":40,"99323":60},grade:"NC5072"},
    {id:"hardened",label:"Hardened steel · < 50 HRC",iso:"H",color:"#747d87",vc:{"99321":60,"99323":90},grade:"NC5075"}
  ];

  // 每個四元組依次為 fz、低／中／高功率 Pitch；各刀具依原表節點列出。
  const rows010 = {
    carbon025:[.025,.60,.80,1.00, .055,.90,1.20,1.50, .080,1.20,1.60,2.00],
    carbon045:[.025,.60,.80,1.00, .055,.90,1.20,1.50, .080,1.20,1.60,2.00],
    carbon060:[.025,.60,.75,.90, .050,.80,1.10,1.35, .070,1.00,1.40,1.80],
    lowAlloy:[.020,.50,.65,.80, .050,.70,.95,1.20, .060,1.00,1.30,1.60],
    highAlloy:[.020,.50,.65,.80, .050,.70,.95,1.20, .060,1.00,1.30,1.60],
    stainless:[.020,.50,.65,.80, .050,.70,.95,1.20, .060,1.00,1.30,1.60],
    castIron:[.025,.60,.80,1.00, .055,.90,1.20,1.50, .080,1.20,1.60,2.00],
    aluminium:[.025,.90,1.20,1.50, .055,1.30,1.80,2.25, .080,1.80,2.40,3.00],
    copper:[.025,.70,.95,1.20, .055,1.00,1.40,1.80, .080,1.40,1.90,2.40],
    nickel:[.010,.50,.65,.80, .015,.70,.95,1.20, .030,.90,1.30,1.60],
    titanium:[.010,.50,.65,.80, .015,.70,.95,1.20, .030,.90,1.30,1.60],
    hardened:[.020,.50,.65,.80, .050,.70,.95,1.20, .060,1.00,1.30,1.60]
  };
  const rows012 = {
    carbon025:[.035,1.20,1.60,2.00, .065,1.50,2.00,2.50, .090,1.80,2.40,3.00],
    carbon045:[.035,1.20,1.60,2.00, .065,1.50,2.00,2.50, .090,1.80,2.40,3.00],
    carbon060:[.030,1.10,1.50,1.80, .060,1.30,1.78,2.25, .080,1.60,2.15,2.70],
    lowAlloy:[.025,1.00,1.30,1.60, .050,1.20,1.60,2.00, .070,1.40,1.90,2.40],
    highAlloy:[.025,1.00,1.30,1.60, .050,1.20,1.60,2.00, .070,1.40,1.90,2.40],
    stainless:[.025,1.00,1.30,1.60, .050,1.20,1.60,2.00, .070,1.40,1.90,2.40],
    castIron:[.035,1.20,1.60,2.00, .065,1.30,1.90,2.50, .090,1.80,2.40,3.00],
    aluminium:[.035,1.80,2.00,2.20, .065,2.20,2.98,3.75, .090,2.70,3.60,4.30],
    copper:[.035,1.40,1.90,2.20, .065,1.80,2.40,3.00, .090,2.10,2.85,3.60],
    nickel:[.0125,1.00,1.30,1.60, .0225,1.20,1.60,2.00, .030,1.40,1.90,2.40],
    titanium:[.0125,1.00,1.30,1.60, .0225,1.20,1.60,2.00, .030,1.40,1.90,2.40],
    hardened:[.025,1.00,1.30,1.60, .050,1.20,1.60,2.00, .070,1.40,1.90,2.40]
  };
  const rows016 = {
    carbon025:[.040,1.80,2.40,3.00, .080,2.10,2.80,3.50, .105,2.40,3.20,4.00],
    carbon045:[.040,1.80,2.40,3.00, .080,2.10,2.80,3.50, .105,2.40,3.20,4.00],
    carbon060:[.035,1.60,2.15,2.70, .070,1.90,2.55,3.20, .090,2.10,2.85,3.60],
    lowAlloy:[.030,1.40,1.90,2.40, .065,1.60,2.20,2.80, .080,1.90,2.55,3.20],
    highAlloy:[.030,1.40,1.90,2.40, .065,1.60,2.20,2.80, .080,1.90,2.55,3.20],
    stainless:[.030,1.40,1.90,2.40, .065,1.60,2.20,2.80, .080,1.90,2.55,3.20],
    castIron:[.040,1.80,2.40,3.00, .080,2.10,2.80,3.50, .105,2.40,3.20,4.00],
    aluminium:[.040,2.70,3.00,3.40, .080,3.10,4.05,5.00, .105,3.60,4.80,5.60],
    copper:[.040,2.10,2.85,3.40, .080,2.50,3.35,4.20, .105,2.80,3.80,4.80],
    nickel:[.015,1.40,1.90,2.40, .030,1.60,2.20,2.80, .040,1.90,2.55,3.20],
    titanium:[.015,1.40,1.90,2.40, .030,1.60,2.20,2.80, .040,1.90,2.55,3.20],
    hardened:[.030,1.40,1.90,2.40, .065,1.60,2.20,2.80, .080,1.90,2.55,3.20]
  };
  const rows020 = {
    carbon025:[.050,1.80,2.40,3.00, .095,2.40,3.20,4.00, .120,3.00,4.00,5.00],
    carbon045:[.050,1.80,2.40,3.00, .095,2.40,3.20,4.00, .120,3.00,4.00,5.00],
    carbon060:[.040,1.60,2.15,2.70, .080,2.20,2.90,3.60, .110,2.70,3.60,4.50],
    lowAlloy:[.035,1.40,1.90,2.40, .070,1.90,2.55,3.20, .095,2.40,3.20,4.00],
    highAlloy:[.035,1.40,1.90,2.40, .070,1.90,2.55,3.20, .095,2.40,3.20,4.00],
    stainless:[.035,1.40,1.90,2.40, .070,1.90,2.55,3.20, .095,2.40,3.20,4.00],
    castIron:[.050,1.80,2.40,3.00, .095,2.40,3.20,4.00, .120,3.00,4.00,5.00],
    aluminium:[.050,2.70,3.00,3.40, .095,3.60,4.80,6.00, .120,4.50,6.00,7.50],
    copper:[.050,2.10,2.85,3.40, .095,2.90,3.85,4.80, .120,3.60,4.80,6.00],
    nickel:[.020,1.40,1.90,2.40, .035,1.90,2.55,3.20, .045,2.40,3.20,4.00],
    titanium:[.020,1.40,1.90,2.40, .035,1.90,2.55,3.20, .045,2.40,3.20,4.00],
    hardened:[.035,1.40,1.90,2.40, .070,1.90,2.55,3.20, .095,2.40,3.20,4.00]
  };
  const rows025 = {
    carbon025:[.055,2.40,3.00,3.40, .120,3.00,4.00,5.00, .135,3.60,4.80,6.00],
    carbon045:[.055,2.40,3.00,3.40, .120,3.00,4.00,5.00, .135,3.60,4.80,6.00],
    carbon060:[.050,2.20,2.90,3.40, .100,2.70,3.60,4.50, .120,3.20,4.30,5.40],
    lowAlloy:[.040,1.90,2.55,3.20, .090,2.40,3.20,4.00, .110,2.90,3.85,4.80],
    highAlloy:[.040,1.90,2.55,3.20, .090,2.40,3.20,4.00, .110,2.90,3.85,4.80],
    stainless:[.040,1.90,2.55,3.20, .090,2.40,3.20,4.00, .110,2.90,3.85,4.80],
    castIron:[.055,2.40,3.00,3.40, .115,3.00,4.00,5.00, .135,3.60,4.80,6.00],
    aluminium:[.055,2.50,3.00,3.40, .115,4.50,6.00,7.50, .135,5.40,7.20,9.00],
    copper:[.055,2.50,3.00,3.40, .115,3.60,4.80,6.00, .135,4.30,5.75,7.20],
    nickel:[.020,1.90,2.55,3.20, .045,2.40,3.20,4.00, .055,2.90,3.85,4.80],
    titanium:[.020,1.90,2.55,3.20, .045,2.40,3.20,4.00, .055,2.90,3.85,4.80],
    hardened:[.040,1.90,2.55,3.20, .090,2.40,3.20,4.00, .110,2.90,3.85,4.80]
  };

  // 相同刀徑的直柄／螺紋刀頭共用 fz/Pitch；Vc 仍依原表系列欄位取值。
  function makeTable(diameters, rows, overrides = {}) {
    return diameters.map((diameter, index) => ({diameter, values:Object.fromEntries(materials.map(material => {
      const values = rows[material.id].slice(index * 4, index * 4 + 4);
      return [material.id, {fz:values[0],pitches:values.slice(1),vc:overrides[material.id] || material.vc,grade:material.grade}];
    }))}));
  }
  const groups = [
    {suffix:"010-1320",dc:11,dmin:13,dmax:20,depth:[30,80],insert:"N9MX04T002",sourceImage:1,table:makeTable([13,16,20],rows010)},
    {suffix:"012-1525",dc:13,dmin:15,dmax:25,depth:[36,85],insert:"N9MX05T103",sourceImage:1,table:makeTable([15,20,25],rows012)},
    {suffix:"016-2030",dc:17,dmin:20,dmax:30,depth:[50,105],insert:"N9MX070204",sourceImage:2,table:makeTable([20,25,30],rows016)},
    {suffix:"020-2540",dc:22,dmin:25,dmax:40,depth:[60,130],insert:"N9MX100306",sourceImage:2,table:makeTable([25,32,40],rows020,{
      stainless:{"99321":80,"99323":90},nickel:{"99321":40,"99323":50},titanium:{"99321":80,"99323":90},hardened:{"99321":80,"99323":90}
    })},
    {suffix:"025-3050",dc:27,dmin:30,dmax:50,depth:[75,160],insert:"N9MX12T308",sourceImage:3,table:makeTable([30,40,50],rows025)}
  ];
  const tools = groups.flatMap(group => ["99321","99323"].map((series, index) => ({
    id:`${series}-${group.suffix}`,series,suffix:group.suffix,dc:group.dc,dmin:group.dmin,dmax:group.dmax,maxDepth:group.depth[index],
    insert:group.insert,teeth:2,coolant:series === "99323" ? "internal" : "external",rampMax:20,
    // 刀片規格表的最大每圈下降量，與螺旋角限制分別檢查。
    maxPitch:{"010-1320":3,"012-1525":4.5,"016-2030":6,"020-2540":7.5,"025-3050":9}[group.suffix],
    table:group.table,sourceUrl:`./sources/cutting-data-${group.sourceImage}.jpg`,
    // 2 為公式圖示的初值；應由使用者確認實際組裝的作用齒數，不能由可翻面刃數推論。
    teethNote:"Confirm the active teeth on the assembled tool.",
    depthNote:series === "99323" ? "Catalog upper limit; confirm extension-bar reach, overhang and interference." : "Catalog maximum drilling depth; confirm actual tool reach."
  })));
  return {
    source:{title:"Nine9 NC Helix Drill · Cutting Data",localUrl:"./sources/cutting-data-1.jpg",originalUrl:"https://nine9.jic-tools.com.tw/cutting-formula.htm?related_pc=8",checked:"2026-11-02",note:"Official website images; no revision is printed on the source tables."},
    materials,tools,
    powers:[{id:"low",label:"< 12 kW",index:0},{id:"medium",label:"12–20 kW",index:1},{id:"high",label:"> 20 kW",index:2}]
  };
})();
if (typeof module !== "undefined") module.exports = HELIX_DATA;
