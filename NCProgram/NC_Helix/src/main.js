/*
 * NC Helix - 頁面啟動
 * 用意：在 DOM 完成後綁定主軸功率選單等初始化事件。
 */

document.addEventListener('DOMContentLoaded', () => {
      // 綁定主軸功率選單
      const powerSelect = document.getElementById('selectPower');
      if (powerSelect) {
        powerSelect.addEventListener('change', updateSuggestedParameters);
      }
    });
