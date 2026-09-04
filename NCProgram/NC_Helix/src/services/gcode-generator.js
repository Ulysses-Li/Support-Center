/*
 * NC Helix - NC Helix G-code 產生器
 * 用意：驗證加工條件、建立螺旋刀路並估算加工時間。
 */

// 累計總時間 (移到全域)
      let cumulativeMachiningTimeInSeconds = 0;

      function calculateGCode() {
        const mode = currentMode || 'Mode1';
        const out = [], result = document.getElementById('result');
        const timeResultEl = document.getElementById('machiningTimeResult');

        let currentOperationDistance = 0; // 只計算當前這次操作的路徑

        const num = id => { const v = parseFloat(document.getElementById(id)?.value); return isNaN(v) ? null : v; };
        const txt = id => (document.getElementById(id)?.value ?? "").trim();
        const fmt = (v, dec = 3) => (v == null || isNaN(v)) ? '-' : (+v).toFixed(dec);

        const toolNo = txt('toolNo') || '99', sys = txt('gcode') || 'G54', x0 = num('x') ?? 0, y0 = num('y') ?? 0, zsafe = num('zsafe') ?? 20, zsurf = num('zsurface') ?? 0, Dc = num('toolDiameter'), Vc = num('vc'), N = num('n'), Zteeth = num('z'), Fz = num('fz');
        let Vf = num('vf');

        const partNo = getSelectedPartNo();
        const drillRange = PART_TO_DRILL_RANGE?.[partNo];

        const maxDelta = PART_TO_MAX_AE?.[partNo]; // 解讀為「直徑方向允許最大 Δ」
        const minAe = PART_TO_MIN_AE?.[partNo]; // 解讀為「半徑方向允許最小 Ae」


        if ((Vf == null || isNaN(Vf)) && N && Fz && Zteeth) { Vf = N * Fz * Zteeth; }

        // --- ▼▼▼ 新增：安全驗證 ▼▼▼ ---
        if (Dc == null || Dc <= 0) {
          alert("安全錯誤：\n請先從上方選擇一個有效的「Part No. (刀具料號)」。");
          return;
        }
        if (N == null || Vf == null || Fz == null || Vc == null) {
          alert("安全錯誤：\n請確保 Vc, fz, N, Vf 都有正確的數值。");
          return;
        }

        const machiningDia1 = num('machiningDia1');
        const depth1 = num('depthDia1');
        const pitch1 = num('pitch1');

        if (mode === 'Mode1') {
          if (drillRange) {
            if (machiningDia1 < drillRange.Dmin || machiningDia1 > drillRange.Dmax) {
              alert(`安全錯誤：\n此刀具適用加工孔徑範圍為 ${drillRange.Dmin}–${drillRange.Dmax} mm。\n你輸入的加工孔徑為 ${fmt(machiningDia1, 3)} mm。`);
              return;
            }
          }

          if (machiningDia1 == null || machiningDia1 <= Dc) {
            alert(`安全錯誤 (Mode1)：\n加工孔徑 (Machining Diameter)「${fmt(machiningDia1, 3)}」\n必須大於刀具直徑 (Tool Diameter)「${fmt(Dc, 3)}」。`);
            return;
          }
          if (depth1 == null || depth1 <= 0 || pitch1 == null || pitch1 <= 0) {
            alert("安全錯誤 (Mode1)：\n請輸入有效的「Depth (深度)」和「Pitch (螺距)」。");
            return;
          }

        }

        const machiningDia2 = num('machiningDia2');
        const depth2 = num('depthDia2');
        const pitch2 = num('pitch2');

        if (mode === 'Mode2') {
          if (machiningDia1 == null || machiningDia1 <= Dc) {
            alert(`安全錯誤 (Mode2 - Step1)：\n加工孔徑 (Machining Diameter)「${fmt(machiningDia1, 3)}」\n必須大於刀具直徑 (Tool Diameter)「${fmt(Dc, 3)}」。`);
            return;
          }
          if (machiningDia2 == null || machiningDia2 <= Dc) {
            alert(`安全錯誤 (Mode2 - Step2)：\n加工孔徑 (Machining Diameter)「${fmt(machiningDia2, 3)}」\n必須大於刀具直徑 (Tool Diameter)「${fmt(Dc, 3)}」。`);
            return;
          }
          if (depth1 == null || depth1 <= 0 || pitch1 == null || pitch1 <= 0 || depth2 == null || depth2 <= 0 || pitch2 == null || pitch2 <= 0) {
            alert("安全錯誤 (Mode2)：\n請為 Step1 和 Step2 輸入有效的「Depth (深度)」和「Pitch (螺距)」。");
            return;
          }
          if (drillRange) {
            if (machiningDia1 < drillRange.Dmin || machiningDia1 > drillRange.Dmax) {
              alert(`安全錯誤：\n此刀具適用加工孔徑範圍為 ${drillRange.Dmin}–${drillRange.Dmax} mm。\n你輸入的加工孔徑為 ${fmt(machiningDia1, 3)} mm。`);
              return;
            }
          }
          const diff = machiningDia2 - machiningDia1; // Δ：直徑方向
          const radialAe = diff / 2;                 // Ae：半徑方向

          // 下限：Ae ≥ Min.Ae（若有設定）
          if (Number.isFinite(minAe) && radialAe < minAe) {
            alert(`安全錯誤 (Mode2)：\n半徑側切量 Ae（Δ/2）需 ≥ 最小允許值。\nAe = ${fmt(radialAe, 3)} mm，Min.Ae = ${fmt(minAe, 3)} mm`);
            return;
          }

          // 上限：Δ ≤ MaxΔ（若有設定），否則退回 Δ ≤ Dc
          if (Number.isFinite(maxDelta)) {
            if (radialAe > maxDelta) {
              alert(`安全錯誤 (Mode2)：\n直徑方向吃刀差 Δ 不可超過 MaxΔ。\nΔ = ${fmt(radialAe, 3)} mm，MaxΔ = ${fmt(maxDelta, 3)} mm`);
              return;
            }
          } else {
            if (diff > Dc) {
              alert(`安全錯誤 (Mode2)：\n「加工孔徑 − 預鑽孔徑」需 ≤ 刀具直徑。\nΔ = ${fmt(diff, 3)} mm，Dc = ${fmt(Dc, 3)} mm（需滿足 Δ ≤ Dc）`);
              return;
            }
          }

        }

        if (mode === 'Mode3') {
          // 取 group3 數值
          const machiningDia3 = num('machiningDia3');
          const preBore3 = num('preBore3');
          // 可選：若也需要檢查深度/螺距可再取
          // const depth3 = num('depthDia3');
          // const pitch3 = num('pitch3');

          // 基本檢查
          if (machiningDia3 == null || preBore3 == null) {
            alert("安全錯誤 (Mode3)：\n請輸入「Machining Diameter (加工孔徑)」與「Pre-bore diameter (預鑽孔徑)」。");
            return;
          }
          if (preBore3 >= machiningDia3) {
            alert(`安全錯誤 (Mode3)：\n預鑽孔徑必須小於加工孔徑。\nPre-bore = ${fmt(preBore3, 3)}，Machining = ${fmt(machiningDia3, 3)}`);
            return;
          }

          // 計算 Δ(直徑差) 與 Ae(半徑吃刀量)
          const diff = machiningDia3 - preBore3; // Δ：直徑方向
          const radialAe = diff / 2;                 // Ae：半徑方向

          // const partNo = getSelectedPartNo();
          // const maxDelta = PART_TO_MAX_AE?.[partNo]; // 解讀為「直徑方向允許最大 Δ」
          // const minAe = PART_TO_MIN_AE?.[partNo]; // 解讀為「半徑方向允許最小 Ae」

          // 下限：Ae ≥ Min.Ae（若有設定）
          if (Number.isFinite(minAe) && radialAe < minAe) {
            alert(`安全錯誤 (Mode3)：\n半徑側切量 Ae（Δ/2）需 ≥ 最小允許值。\nAe = ${fmt(radialAe, 3)} mm，Min.Ae = ${fmt(minAe, 3)} mm`);
            return;
          }

          // 上限：Δ ≤ MaxΔ（若有設定），否則退回 Δ ≤ Dc
          if (Number.isFinite(maxDelta)) {
            if (radialAe > maxDelta) {
              alert(`安全錯誤 (Mode3)：\n直徑方向吃刀差 Δ 不可超過 MaxΔ。\nΔ = ${fmt(radialAe, 3)} mm，MaxΔ = ${fmt(maxDelta, 3)} mm`);
              return;
            }
          } else {
            if (diff > Dc) {
              alert(`安全錯誤 (Mode3)：\n「加工孔徑 − 預鑽孔徑」需 ≤ 刀具直徑。\nΔ = ${fmt(diff, 3)} mm，Dc = ${fmt(Dc, 3)} mm（需滿足 Δ ≤ Dc）`);
              return;
            }
          }

          // （如也要檢查深度/螺距）
          // if (depth3 == null || depth3 <= 0 || pitch3 == null || pitch3 <= 0) {
          //   alert("安全錯誤 (Mode3)：\n請輸入有效的「Depth (深度)」與「Pitch (螺距)」。");
          //   return;
          // }
        }







        // --- ▲▲▲ 驗證結束 ▲▲▲ ---


        out.push(`(=== NC Helix Drill / ${mode} ===)`);
        out.push(`(PartNo: ${getSelectedPartNo()})`);
        out.push(`(Tool Dc=${fmt(Dc, 3)} mm, Vc=${fmt(Vc, 1)} m/min, N=${fmt(N, 0)} rpm, z=${fmt(Zteeth, 0)}, fz=${fmt(Fz, 3)} mm/tooth, Vf=${fmt(Vf, 1)} mm/min)`);
        out.push(`${sys} G00 X${fmt(x0, 3)} Y${fmt(y0, 3)} `);
        out.push(`G43 H${toolNo} Z${fmt(zsafe, 3)} `);

        // 內部函數：建立螺旋 G-Code 並計算路徑長度
        function buildHelixSection(label, machiningDia, depth, pitch) {
          let sectionDistance = 0;
          if (machiningDia == null || depth == null || pitch == null) return { gcode: [`(WARN) ${label}: missing required fields, skipped.`], distance: 0 };

          const block = [], R = (machiningDia - Dc) / 2, steps = Math.max(1, Math.ceil(depth / pitch)), effPitch = depth / steps;
          block.push(`(--- ${label} ---)`, `(Target Ø=${fmt(machiningDia, 3)}; Depth L=${fmt(depth, 3)}; Pitch=${fmt(pitch, 3)}; R=${fmt(R, 3)})`, `G00 Z${fmt(zsurf + 2, 3)} `);

          if (R > 1e-4) {
            block.push(`G01 X${fmt(x0 + R, 3)} Z${fmt(zsurf, 3)} F${fmt(Vf || 200, 1)} `);
            sectionDistance += Math.sqrt(R * R + 4); // 假設 Z 從 +2 下到 0

            let currentZ = zsurf;
            for (let i = 1; i <= steps; i++) {
              let targetZ = zsurf - (i * effPitch);
              if (i === steps) targetZ = zsurf - depth; // 確保最後一刀在正確深度

              block.push(`G03 I${fmt(-R, 3)} Z${fmt(targetZ, 3)} F${fmt(Vf || 200, 1)} `);
              let zMove = Math.abs(targetZ - currentZ);
              sectionDistance += Math.sqrt(Math.pow(2 * Math.PI * R, 2) + Math.pow(zMove, 2)); // 螺旋線長
              currentZ = targetZ;
            }
          }
          block.push(`G03 I${fmt(-R, 3)} F${fmt(Vf || 200, 1)} (Make one more turn at bottom)`);
          sectionDistance += 2 * Math.PI * R; // 底部清銑一圈

          block.push(`G01 X${fmt(x0, 3)} Y${fmt(y0, 3)} F${fmt(Vf || 200, 1)} (Back to center)`);
          sectionDistance += R; // 回到中心

          block.push(`G00 Z${fmt(zsafe, 3)} `);
          return { gcode: block, distance: sectionDistance };
        }

        if (mode === 'Mode1') {
          const section = buildHelixSection('Mode1', num('machiningDia1'), num('depthDia1'), num('pitch1'));
          out.push(...section.gcode);
          currentOperationDistance += section.distance;
        } else if (mode === 'Mode2') {
          const section1 = buildHelixSection('Mode2_Step1', num('machiningDia1'), num('depthDia1'), num('pitch1'));
          out.push(...section1.gcode);
          currentOperationDistance += section1.distance;
          const section2 = buildHelixSection('Mode2_Step2', num('machiningDia2'), num('depthDia2'), num('pitch2'));
          out.push(...section2.gcode);
          currentOperationDistance += section2.distance;
        } else if (mode === 'Mode3') {
          const section3 = buildHelixSection(
            'Mode3',
            num('machiningDia3'),
            num('depthDia3'),
            num('pitch3')
          );
          out.push(...section3.gcode);
          currentOperationDistance += section3.distance;
        }

        out.push(`(=== End ===)`);
        if (result.value && !result.value.endsWith('\n')) result.value += '\n';
        result.value += out.join('\n') + '\n\n';
        result.scrollTop = result.scrollHeight;

        // 計算並累加時間
        if (Vf > 0 && currentOperationDistance > 0) {
          const timeForThisOperation = (currentOperationDistance / Vf) * 60;
          cumulativeMachiningTimeInSeconds += timeForThisOperation; // 將本次時間累加到總時間上

          const timeTemplate = LangCtl.get('form.results.machiningTime', 'Estimated Total Time: {time} sec');
          timeResultEl.textContent = timeTemplate.replace('{time}', cumulativeMachiningTimeInSeconds.toFixed(2)); // 顯示累計後的總時間
          timeResultEl.classList.remove('text-muted');
          timeResultEl.classList.add('text-primary');
        }
      }
