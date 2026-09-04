/*
 * NC Helix - 刀具選擇畫面
 * 用意：依 Part No. 更新刀徑、接桿選項與畫面顯示狀態。
 */

function applyInsertDiameterByPart(partNo) {
        // const td = document.getElementById('toolDiameter');
        // td.value = PART_TO_DIAMETER[partNo]?.toFixed(1) || '';
        // if (typeof updateSpindleSpeed === 'function') { try { updateSpindleSpeed(); } catch (e) { } }

        const td = document.getElementById('toolDiameter');
        td.value = PART_TO_DIAMETER[partNo]?.toFixed(1) || '';
        // if (typeof updateSpindleSpeed === 'function') { try { updateSpindleSpeed(); } catch (e) { } }
      }

      // ... 您的 buildExtensionOptions, hideExtensionBar, updateUIByPart ...
      function buildExtensionOptions(partNo) {
        const extSelect = document.getElementById('extensionBarSelect');
        const allowed = PART_TO_BARS[partNo] || Object.keys(BAR_DB);
        extSelect.innerHTML = `<option value="" selected disabled>${LangCtl.get('form.common.select')}</option>`;
        allowed.forEach(code => {
          const meta = BAR_DB[code] || { type: "", torque: "" };
          const opt = document.createElement('option');
          opt.value = code; opt.dataset.type = meta.type; opt.dataset.torque = meta.torque;
          const label = [code]; if (meta.type) label.push(meta.type); if (meta.torque) label.push(`Torque: ${meta.torque}`);
          opt.textContent = label.join(' | ');
          extSelect.appendChild(opt);
        });
      }
      function hideExtensionBar() {
        document.getElementById('extensionBarBlock').classList.add('d-none');
        document.getElementById('extensionBarSelect').innerHTML = `<option value="" selected disabled>${LangCtl.get('form.common.select')}</option>`;
        const extStatus = document.getElementById('extensionBarStatus');
        extStatus.textContent = LangCtl.get('form.partNo.extBarStatus.none');
        extStatus.className = 'mt-2 text-muted';
      }
      function updateUIByPart(partNo) {
        applyInsertDiameterByPart(partNo);
        if (!/^00-99323-/.test(partNo)) { hideExtensionBar(); return; }
        const extBlock = document.getElementById('extensionBarBlock');
        const extStatus = document.getElementById('extensionBarStatus');
        buildExtensionOptions(partNo);
        extBlock.classList.remove('d-none');
        extStatus.textContent = LangCtl.get('form.partNo.extBarStatus.none');
        extStatus.className = 'mt-2 text-muted';
      }

      // 您的 extensionBarSelect 事件 (保持不變)
      // document.getElementById('extensionBarSelect').addEventListener('change', function () {
      //   const opt = this.options[this.selectedIndex];
      //   const status = document.getElementById('extensionBarStatus');
      //   if (opt && opt.value) {
      //     const bits = [opt.value, opt.dataset.type, opt.dataset.torque && `Torque: ${opt.dataset.torque}`].filter(Boolean);
      //     status.textContent = `${LangCtl.get('form.partNo.extBarStatus.selected')}: ${bits.join(' | ')}`;
      //     status.className = 'mt-2 fw-bold text-success';
      //   } else {
      //     status.textContent = LangCtl.get('form.partNo.extBarStatus.none');
      //     status.className = 'mt-2 text-muted';
      //   }
      // });
      const extSel = document.getElementById('extensionBarSelect');
      if (extSel) {
        extSel.addEventListener('change', function () {
          const opt = this.options[this.selectedIndex];
          const status = document.getElementById('extensionBarStatus');
          if (opt && opt.value) {
            const bits = [opt.value, opt.dataset.type, opt.dataset.torque && `Torque: ${opt.dataset.torque}`].filter(Boolean);
            status.textContent = `${LangCtl.get('form.partNo.extBarStatus.selected')}: ${bits.join(' | ')}`;
            status.className = 'mt-2 fw-bold text-success';
          } else {
            status.textContent = LangCtl.get('form.partNo.extBarStatus.none');
            status.className = 'mt-2 text-muted';
          }
        });
      }

      // --- ▼▼▼ 修改：onPartSelect 函數 ▼▼▼ ---

      function onPartSelect(sel) {
        const g1 = document.getElementById('partsGroup1'), g2 = document.getElementById('partsGroup2'), pickedInfo = document.getElementById('pickedPartInfo');
        if (sel.id === 'partsGroup1') { g2.selectedIndex = 0; } else { g1.selectedIndex = 0; }
        const val = sel.value || sel.options[sel.selectedIndex]?.text;
        if (val) {
          pickedInfo.textContent = `${LangCtl.get('form.partNo.status.selected')}: ${val}`;
          pickedInfo.className = 'mt-3 text-success fw-bold';
        } else {
          pickedInfo.textContent = LangCtl.get('form.partNo.status.none');
          pickedInfo.className = 'mt-3 muted';
        }
        if (val) updateUIByPart(val);
        if (typeof updateCuttingSpeed === 'function') updateCuttingSpeed();
        if (typeof window.syncFzBlink === 'function') window.syncFzBlink();
      }

      // --- ▲▲▲ 修改：onPartSelect 函數 ▲▲▲ ---
