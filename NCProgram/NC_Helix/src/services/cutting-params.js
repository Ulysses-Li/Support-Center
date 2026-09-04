/*
 * NC Helix - 切削參數建議
 * 用意：依刀具、材料、加工直徑與主軸功率提供 Vc、fz 與 Pitch。
 */

// 輔助函數：取得目前選中的 PartNo
      function getSelectedPartNo() { return document.getElementById('partsGroup2').value || document.getElementById('partsGroup1').value || ""; }
      // 輔助函數：取得 99321 or 99323
      function getSeriesFromPart(partNo) { if (/^00-99323-/.test(partNo)) return "99323"; if (/^00-99321-/.test(partNo)) return "99321"; return null; }

// 依據 Part No. 判斷使用哪一個群組（回傳 group key 或 null）
      function getGroupKey(partNo) {
        if (!partNo) return null;
        if (partNo.includes('010-1320')) return 'group_010-1320';
        if (partNo.includes('012-1525')) return 'group_012-1525';
        if (partNo.includes('016-2030')) return 'group_016-2030';
        if (partNo.includes('020-2540')) return 'group_020-2540';
        if (partNo.includes('025-3050')) return 'group_025-3050';
        if (partNo.includes('025-4265')) return 'group_025-4265';
        return null;
      }

      // 依群組決定直徑落在哪個 O 值（回傳 materialData.Oxx）
      // replaced by generalized version above
      function getParamsForDiameter(dia, materialData, groupKey) {
        if (isNaN(dia) || !materialData || !groupKey) return null;
        switch (groupKey) {
          case 'group_010-1320': { // O13 / O16 / O20
            if (dia <= 14.5) return materialData.O13;
            if (dia <= 18.0) return materialData.O16;
            return materialData.O20;
          }
          case 'group_012-1525': { // O15 / O20 / O25
            if (dia <= 17.5) return materialData.O15;
            if (dia <= 22.5) return materialData.O20;
            return materialData.O25;
          }
          case 'group_016-2030': { // O20 / O25 / O30
            if (dia <= 22.5) return materialData.O20;
            if (dia <= 27.5) return materialData.O25;
            return materialData.O30;
          }
          case 'group_020-2540': { // O25 / O32 / O40
            if (dia <= 28.5) return materialData.O25;
            if (dia <= 36.0) return materialData.O32;
            return materialData.O40;
          }
          case 'group_025-3050': { // O30 / O40 / O50
            if (dia <= 35.0) return materialData.O30;
            if (dia <= 45.0) return materialData.O40;
            return materialData.O50;
          }
          case 'group_025-4265': { // O42 / O55 / O65
            if (dia <= 48.5) return materialData.O42;
            if (dia <= 60.5) return materialData.O55;
            return materialData.O65;
          }
        }
        return null;
      }


      // 1) 核心新函數：自動更新所有參數（支援所有群組＋Mode3）
      function updateSuggestedParameters() {
        const partNo = getSelectedPartNo();
        const groupKey = getGroupKey(partNo);
        const material = document.getElementById("selectMaterial").value;
        const power = document.getElementById("selectPower").value; // "low" | "medium" | "high"

        const dia1 = parseFloat(document.getElementById("machiningDia1")?.value);
        const dia2 = parseFloat(document.getElementById("machiningDia2")?.value);
        const dia3 = parseFloat(document.getElementById("machiningDia3")?.value);  // ★ 新增

        const vcInput = document.getElementById("vc");
        const fzInput = document.getElementById("fz");
        const pitch1Input = document.getElementById("pitch1");
        const pitch2Input = document.getElementById("pitch2");
        const pitch3Input = document.getElementById("pitch3");                     // ★ 新增

        // 清除舊樣式（含 pitch3）
        clearSuggestions();

        // 使用智慧資料庫（若群組與材料皆可用）
        if (groupKey && material && window.CUTTING_DB && window.CUTTING_DB[groupKey]) {
          const materialData = window.CUTTING_DB[groupKey][material];
          if (!materialData) {
            fallbackUpdate(partNo, material);
            updateSpindleSpeed();
            return;
          }

          // 1) Vc：依系列 99321 / 99323 取值
          const series = getSeriesFromPart(partNo);
          const vc = (series === "99323") ? materialData.vc_99323 : materialData.vc_99321;
          vcInput.value = vc ?? '';
          if (vc) vcInput.classList.add("is-suggested");

          // 2) fz 推導：優先用 Mode 對應的直徑
          //    - 若在 Mode3（或 dia1 空）就用 dia3 來推 fz；否則用 dia1
          let fzSet = false;
          if (!isNaN(dia1)) {
            const p1 = getParamsForDiameter(dia1, materialData, groupKey);
            if (p1?.fz != null) { fzInput.value = p1.fz; fzInput.classList.add("is-suggested"); fzSet = true; }
            // pitch1
            if (p1?.pitch && p1.pitch[power] != null) { pitch1Input.value = p1.pitch[power]; pitch1Input.classList.add("is-suggested"); }
          }
          if (!fzSet && !isNaN(dia3)) {                        // ★ Mode3 或 dia1 未填時，用 dia3 推 fz
            const p3_for_fz = getParamsForDiameter(dia3, materialData, groupKey);
            if (p3_for_fz?.fz != null) { fzInput.value = p3_for_fz.fz; fzInput.classList.add("is-suggested"); }
          }

          // 3) pitch2：依 Dia2 推
          if (!isNaN(dia2)) {
            const p2 = getParamsForDiameter(dia2, materialData, groupKey);
            if (p2?.pitch && p2.pitch[power] != null) {
              pitch2Input.value = p2.pitch[power];
              pitch2Input.classList.add("is-suggested");
            }
          }

          // 4) pitch3：依 Dia3 推（★ 新增）
          if (!isNaN(dia3) && pitch3Input) {
            const p3 = getParamsForDiameter(dia3, materialData, groupKey);
            if (p3?.pitch && p3.pitch[power] != null) {
              pitch3Input.value = p3.pitch[power];
              pitch3Input.classList.add("is-suggested");
            }
          }

        } else {
          // 非智慧資料庫範圍 → 舊邏輯
          fallbackUpdate(partNo, material);
        }

        // 最後更新 N / Vf
        updateSpindleSpeed();
      }

      // 2) 清除建議樣式（把 pitch3 一起列入）
      function clearSuggestions() {
        ['vc', 'fz', 'pitch1', 'pitch2', 'pitch3'].forEach(id => {
          const el = document.getElementById(id);
          if (el) el.classList.remove('is-suggested');
        });
      }

      // 3) 舊邏輯 fallback（也把 pitch3 清空邏輯補上）
      function fallbackUpdate(partNo, material) {
        const series = getSeriesFromPart(partNo) || "99321";
        const data = cuttingSpeedMapBySeries[series]?.[material];
        const vcInput = document.getElementById("vc");
        vcInput.value = data?.vc ?? "";
        if (data?.vc) vcInput.classList.add("is-suggested");

        // 清除 fz 和 pitch（若非建議狀態）
        const fz = document.getElementById("fz");
        if (fz && !fz.classList.contains('is-suggested')) fz.value = '';

        ['pitch1', 'pitch2', 'pitch3'].forEach(id => {
          const el = document.getElementById(id);
          if (el && !el.classList.contains('is-suggested')) el.value = '';
        });
      }

      // 保留舊介面
      function updateCuttingSpeed() { updateSuggestedParameters(); }
      // --- ▲▲▲ 新增：核心參數建議函數 ▲▲▲ ---
