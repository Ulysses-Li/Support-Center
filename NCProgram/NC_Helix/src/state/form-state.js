/*
 * NC Helix - 模式欄位狀態
 * 用意：安全讀寫欄位，並讓不同加工模式共用參數建議流程。
 */

// 小工具：安全取值/回填
      function getVal(id) { const el = document.getElementById(id); return el ? el.value : ''; }
      function setVal(id, v) { const el = document.getElementById(id); if (el) el.value = v; }

      // 小適配器：讓 Mode3 也能用原本的 updateSuggestedParameters() 智慧建議
      function updateSuggestedParameters_forActiveMode() {
        if (typeof updateSuggestedParameters !== 'function') return;

        const mode = (window.currentMode || 'Mode1');

        if (mode === 'Mode3') {
          // 1) 備份 group1 原值
          const backup = {
            preBore1: getVal('preBore1'),
            machiningDia1: getVal('machiningDia1'),
            depthDia1: getVal('depthDia1'),
            pitch1: getVal('pitch1'),
          };

          // 2) 用 group3 的值暫時覆寫 group1
          setVal('preBore1', getVal('preBore3'));
          setVal('machiningDia1', getVal('machiningDia3'));
          setVal('depthDia1', getVal('depthDia3'));
          setVal('pitch1', getVal('pitch3'));

          // 3) 呼叫你的智慧建議主函式
          updateSuggestedParameters();

          // 4) 把計算結果回填到 group3（fz/vc 是共用欄位已更新；這裡回填 pitch）
          setVal('pitch3', getVal('pitch1'));
          // 如需同步其他建議欄位可在此加：例 setVal('depthDia3', getVal('depthDia1'));

          // 5) 還原 group1
          setVal('preBore1', backup.preBore1);
          setVal('machiningDia1', backup.machiningDia1);
          setVal('depthDia1', backup.depthDia1);
          setVal('pitch1', backup.pitch1);
        } else {
          // Mode1 / Mode2 直接跑原本的
          updateSuggestedParameters();
        }
      }
