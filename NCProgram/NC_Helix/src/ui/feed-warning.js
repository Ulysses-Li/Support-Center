/*
 * NC Helix - 進給提示
 * 用意：缺少 fz 且已有轉速時，以閃爍提示使用者補齊參數。
 */

(function () {
        // fz 閃爍功能的所有程式碼都放在這裡
        const fz = document.getElementById('fz');
        let timer = null; // <--- 這個 'timer' 變數被關在小房間裡

        function shouldBlink() {
          const fzVal = parseFloat(fz.value); const isFzMissing = isNaN(fzVal) || fzVal <= 0;
          const hasN = parseFloat(document.getElementById('n').value) > 0;
          return isFzMissing && hasN;
        }
        function sync() { if (shouldBlink()) { if (!timer) timer = setInterval(() => fz.classList.toggle('blink'), 650); } else { if (timer) { clearInterval(timer); timer = null; } fz.classList.remove('blink'); } }

        window.syncFzBlink = sync; // 唯一對外開放的窗戶

        fz.addEventListener('input', sync);
        document.addEventListener('DOMContentLoaded', sync);
      })();
