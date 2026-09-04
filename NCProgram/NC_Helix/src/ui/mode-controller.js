/*
 * NC Helix - 加工模式控制
 * 用意：切換 Mode1、Mode2、Mode3 的圖片、欄位群組與提示文字。
 */

const imagesByMode = {
        // Mode1: "https://nine9.jic-tools.com.tw/upload_files/technology/NC_Helix_Drill/icon_helix_fig.01.jpg",
        // Mode2: "https://nine9.jic-tools.com.tw/upload_files/technology/NC_Helix_Drill/icon_helix_fig.02.jpg",
        // Mode3: "https://nine9.jic-tools.com.tw/upload_files/technology/NC_Helix_Drill/icon_helix_fig.02.jpg"
        Mode1: "https://nine9.jic-tools.com.tw/upload_files/Program/Helix_Drill/img/Helix_01_0.jpg",
        Mode2: "https://nine9.jic-tools.com.tw/upload_files/Program/Helix_Drill/img/Helix_02_0.jpg",
        Mode3: "https://nine9.jic-tools.com.tw/upload_files/Program/Helix_Drill/img/Helix_03_0.jpg"
      };

      const imgEl = document.getElementById("galleryImg");
      const modeBtns = document.querySelectorAll(".mode-btn");
      const group1 = document.getElementById("group1");
      const group2 = document.getElementById("group2");
      const group3 = document.getElementById("group3");

      let currentMode = 'Mode1';

      function setMode(mode) {
        currentMode = mode;

        // 圖片
        if (imgEl) imgEl.src = imagesByMode[mode] || imagesByMode.Mode1;

        // 按鈕樣式
        modeBtns.forEach(b => {
          const active = (b.dataset.mode === mode);
          b.classList.toggle("btn-primary", active);
          b.classList.toggle("btn-outline-primary", !active);
        });

        // 版面顯示：
        // Mode1 → 只看 group1（全寬）
        // Mode2 → group1 + group2（各半，跟你原本一樣）
        // Mode3 → 只看 group3（全寬，布局與 Mode1 相同）
        if (mode === 'Mode1') {
          group1?.classList.remove('d-none');
          group3?.classList.add('d-none');
          group2?.classList.add('d-none');
          group1?.classList.add('col-12');
          group1?.classList.remove('col-md-6');
        } else if (mode === 'Mode2') {
          group1?.classList.remove('d-none');
          group2?.classList.remove('d-none');
          group3?.classList.add('d-none');
          group1?.classList.remove('col-12');
          group1?.classList.add('col-md-6');
        } else if (mode === 'Mode3') {
          group3?.classList.remove('d-none');
          group1?.classList.add('d-none');
          group2?.classList.add('d-none');
          group3?.classList.add('col-12');
          group3?.classList.remove('col-md-6');
        }

        // 隱藏的 group 值清空
        const clearGroup = (ids) => ids.forEach(id => {
          const el = document.getElementById(id);
          if (el) {
            el.value = '';
            el.dispatchEvent(new Event('input', { bubbles: true }));
          }
        });
        if (mode === 'Mode1') clearGroup(['preBore2', 'machiningDia2', 'depthDia2', 'pitch2', 'preBore3', 'machiningDia3', 'depthDia3', 'pitch3']);
        if (mode === 'Mode2') clearGroup(['preBore3', 'machiningDia3', 'depthDia3', 'pitch3']);
        if (mode === 'Mode3') clearGroup(['preBore1', 'machiningDia1', 'depthDia1', 'pitch1', 'preBore2', 'machiningDia2', 'depthDia2', 'pitch2']);

        // 模式提示（若有 i18n）
        const hint = document.getElementById("modeHint");
        if (hint && window.LangCtl?.get) {
          hint.textContent = window.LangCtl.get(`form.modeDesc.${mode.toLowerCase()}`, '');
        }

        // 走適配器計算（確保 Mode3 也能吃到建議值）
        if (typeof updateSuggestedParameters_forActiveMode === 'function') {
          updateSuggestedParameters_forActiveMode();
        }
      }

      // 綁定
      modeBtns.forEach(btn => btn.addEventListener('click', () => setMode(btn.dataset.mode)));
      setMode('Mode1');
