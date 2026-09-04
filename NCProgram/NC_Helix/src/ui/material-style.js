/*
 * NC Helix - 材料選單樣式
 * 用意：依 ISO 材料群組更新選單與提示色彩。
 */

function updateSelectColor() {
        const sel = document.getElementById('selectMaterial'), opt = sel.options[sel.selectedIndex];
        if (!opt) return;
        const color = opt.dataset.color || '', group = opt.dataset.group || '';
        sel.style.backgroundColor = color;
        sel.style.color = ['#0066CC', '#FF0000', '#00B050', '#E6007E'].includes(color) ? '#fff' : '#000';
        document.getElementById('materialHint').textContent = group ? `${LangCtl.get('form.material.isoHint', 'ISO group')}: ${group}` : `${LangCtl.get('form.material.isoHint', 'ISO group')}: –`;

        updateSuggestedParameters(); // ★ 在此處觸發新函數
      }
      // ▼▼▼ 修改：將 updateCuttingSpeed() 呼叫移到 updateSelectColor 內部 ▼▼▼
      document.addEventListener('DOMContentLoaded', () => { updateSelectColor(); });
      // ▲▲▲ 修改 ▲▲▲
