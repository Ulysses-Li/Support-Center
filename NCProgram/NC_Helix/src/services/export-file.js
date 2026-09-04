/*
 * NC Helix - 程式輸出與匯出
 * 用意：加入刀具啟動碼、清除輸出並匯出 NC 文字檔。
 */

function addTool() {
        const toolNo = document.getElementById("toolNo").value || '99', spindleSpeed = document.getElementById("n").value || '';
        const gcode = [`G90 G17 G21 G49 G80`, `T${toolNo} M06`, `S${spindleSpeed} M03`, `M08`].join('\n');
        const sys = (document.getElementById("gcode").value || 'G54').trim();
        document.getElementById("result").value += `${gcode}\n${sys}\n\n`;
      }

      // --- ▼▼▼ 修改：clearOutput 函數 ▼▼▼ ---
      function clearOutput() {
        document.getElementById("result").value = "";
        document.getElementById('machiningTimeResult').textContent = '';
        cumulativeMachiningTimeInSeconds = 0; // 將累計時間歸零
      }
      // --- ▲▲▲ 修改：clearOutput 函數 ▲▲▲ ---

      function exportToFile() {
        let content = document.getElementById("result").value || "";
        if (content && !content.endsWith('\n')) content += '\n';
        // 恢復您原始的 G-code 結尾
        const footer = ['M05', 'M09', 'G91 G28 Z0.', 'G91 G28 Y0.', 'M30'].join('\n');
        content += footer + '\n';
        const mode = window.currentMode || 'Mode1', ts = new Date().toISOString().replace(/[:.]/g, '-');
        const a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob([content], { type: "text/plain" }));
        a.download = `NC_Helix_Drill_${mode}_${ts}.txt`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { URL.revokeObjectURL(a.href); document.body.removeChild(a); }, 0);
      }
      function countClick() { }
