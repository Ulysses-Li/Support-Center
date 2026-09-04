/*
 * NC Helix - 轉速與進給計算
 * 用意：依刀徑、Vc、齒數與 fz 計算主軸轉速及進給率。
 */

function updateSpindleSpeed() {
        const d = parseFloat(document.getElementById("toolDiameter").value), vc = parseFloat(document.getElementById("vc").value);
        document.getElementById("n").value = (!isNaN(d) && d > 0 && !isNaN(vc) && vc > 0) ? ((1000 * vc) / (Math.PI * d)).toFixed(0) : "";
        updateFeedRate();
        if (typeof window.syncFzBlink === 'function') window.syncFzBlink();
      }
      function updateFeedRate() {
        const z = parseFloat(document.getElementById("z").value), fz = parseFloat(document.getElementById("fz").value), n = parseFloat(document.getElementById("n").value);
        document.getElementById("vf").value = (!isNaN(z) && !isNaN(fz) && !isNaN(n) && z > 0 && fz > 0 && n > 0) ? (n * fz * z).toFixed(2) : "";
      }
