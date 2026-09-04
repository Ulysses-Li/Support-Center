/*
 * NC Helix - 欄位清除控制
 * 用意：集中綁定各模式欄位的清除按鈕。
 */

document.addEventListener('DOMContentLoaded', () => {
        const pairs = [
          // group1
          ['preBoreCe1', 'preBore1'],
          ['machiningDiaCe1', 'machiningDia1'],
          ['depthDiaCe1', 'depthDia1'],
          ['pitchCe1', 'pitch1'],
          // group2
          ['preBoreCe2', 'preBore2'],
          ['machiningDiaCe2', 'machiningDia2'],
          ['depthDiaCe2', 'depthDia2'],
          ['pitchCe2', 'pitch2'],
          // group3（新增）
          ['preBoreCe3', 'preBore3'],
          ['machiningDiaCe3', 'machiningDia3'],
          ['depthDiaCe3', 'depthDia3'],
          ['pitchCe3', 'pitch3'],
        ];

        pairs.forEach(([btnId, fieldId]) => {
          const btn = document.getElementById(btnId);
          if (!btn) return;
          btn.addEventListener('click', () => {
            const el = document.getElementById(fieldId);
            if (el) {
              el.value = '';
              el.dispatchEvent(new Event('input', { bubbles: true }));
              el.focus();
            }
            // 清空時即時重算建議值（走 active mode 適配器）
            if (typeof updateSuggestedParameters_forActiveMode === 'function') {
              updateSuggestedParameters_forActiveMode();
            }
          });
        });
      });
