/*
 * NC Helix - 多語系控制
 * 用意：管理中英文詞典、語系切換與欄位文字更新。
 */

(() => {
      const DICT = {
        'en-US': {
          'nav.lang': 'Language/Region',
          'nav.main': 'Main menu',
          'nav.home': 'Home',
          'nav.search': 'Search',
          'nav.toggle': 'Toggle navigation',
          'nav.region.apac': 'Asia / Pacific',
          'nav.region.americas_europe': 'Americas & Europe',

          'helix.title': 'NC Program Generator for NC Helix Drill',

          'form.partNo.title': 'Select Part No.',
          'form.partNo.group1': 'Part No. (99321 Series)',
          'form.partNo.group2': 'Part No. (99323 Series)',
          'form.partNo.extBarLabel': 'Select Extension Bar',
          'form.partNo.status.none': 'No Part No. selected.',
          'form.partNo.status.selected': 'Selected Part No.',
          'form.partNo.extBarStatus.none': 'No extension bar selected.',
          'form.partNo.extBarStatus.selected': 'Selected extension bar',

          'form.material.label': 'Workpiece material',
          'form.material.isoHint': 'ISO group',

          'form.mode.mode1': 'Mode 1',
          'form.mode.mode2': 'Mode 2',
          'form.mode.mode3': 'Mode 3',

          'form.modeDesc.mode1': 'On solid surface, Helical interpolation',
          'form.modeDesc.mode2': 'On solid surface, 1st hole/2nd: Helical interpolation',
          'form.modeDesc.mode3': 'Pre-bore / thin wall, boring + helical interpolation',

          'form.params.preBore': 'Pre-bore diameter',
          'form.params.machiningDia': 'Machining Diameter',
          'form.params.depth': 'Depth of Cut',
          'form.params.pitch': 'Pitch',

          'form.others.toolDia': 'Tool Diameter ØDc',
          'form.others.cuttingSpeed': 'Cutting Speed',
          'form.others.spindleSpeed': 'Spindle Speed',
          'form.others.teeth': 'Number of Teeth',
          'form.others.feedPerTooth': 'Feed per Tooth',
          'form.others.feedRate': 'Feed Rate',
          'form.others.toolNo': 'Tool Number',
          'form.others.coorSystem': 'Coordinate System',
          'form.others.coorX': 'Coordinate X',
          'form.others.coorY': 'Coordinate Y',
          'form.others.safeZ': 'Safe Height Z',
          'form.others.surfaceZ': 'Surface Coordinate Z',

          'form.actions.addTool': 'Add Tool',
          'form.actions.generate': 'Generate',
          'form.actions.export': 'Export',
          'form.actions.clear': 'Clear',

          'form.common.select': 'Please select...',
          'form.common.clear': 'Clear',

          'form.placeholders.mm': 'mm',
          'form.placeholders.m_min': 'm/min',
          'form.placeholders.rpm': 'RPM',
          'form.placeholders.mm_tooth': 'mm/tooth',
          'form.placeholders.mm_min': 'mm/min',
          'form.placeholders.selectTool': 'Please Select Tool',

          // Spindle power (added)
          'form.power.label': 'Spindle Power',
          'form.power.low': '< 12 kW (Low / Conservative)',
          'form.power.medium': '12–20 kW (Medium)',
          'form.power.high': '> 20 kW (High)',

          // Result (added)
          'form.results.machiningTime': 'Estimated Machining Time: {time} sec'
        }

      };


      const STORAGE_KEY = 'site.lang';
      let currentLang = 'en-US';
      function getInitialLang() {
        const q = new URL(window.location.href).searchParams.get('lang');
        return q || localStorage.getItem(STORAGE_KEY) || 'en-US';
      }

      function get(key, fallback = '') {
        const dict = DICT[currentLang] || DICT['en-US'];
        return dict[key] || fallback || `[${key}]`;
      }

      function setLang(lang) {
        currentLang = DICT[lang] ? lang : 'en-US';
        const dict = DICT[currentLang];

        document.querySelectorAll('[data-i18n], [data-i18n-placeholder]').forEach(el => {
          const key = el.getAttribute('data-i18n');
          if (key && dict[key]) {
            el.textContent = dict[key];
          }
          const placeholderKey = el.getAttribute('data-i18n-placeholder');
          if (placeholderKey && dict[placeholderKey]) {
            el.setAttribute('placeholder', dict[placeholderKey]);
          }
        });

        // Update arbitrary attributes via data-i18n-attrs (e.g., title, aria-label, value)
        document.querySelectorAll('[data-i18n-attrs]').forEach(el => {
          const attrs = el.getAttribute('data-i18n-attrs').split(',').map(s => s.trim()).filter(Boolean);
          attrs.forEach(attr => {
            const key = el.getAttribute(`data-i18n-${attr}`);
            if (key && dict[key]) el.setAttribute(attr, dict[key]);
          });
        });
        localStorage.setItem(STORAGE_KEY, currentLang);

        // Manually trigger updates for dynamic elements that might need it
        if (typeof window.onPartSelect === 'function' && document.getElementById('partsGroup1')) {
          const activeSelect = document.getElementById('partsGroup1').selectedIndex > 0
            ? document.getElementById('partsGroup1')
            : document.getElementById('partsGroup2');
          onPartSelect(activeSelect);
        }
        if (typeof window.setMode === 'function' && typeof window.currentMode !== 'undefined') {
          setMode(window.currentMode);
        }
      }

      function initLangMenu() {
        document.querySelectorAll('.country-item:not(.disabled)').forEach(a => {
          a.addEventListener('click', e => {
            e.preventDefault();
            const lang = a.getAttribute('data-lang');
            if (lang) setLang(lang);
          });
        });
      }


      document.addEventListener('DOMContentLoaded', () => {
        setLang(getInitialLang());
        initLangMenu();
      });

      window.LangCtl = { setLang, get };
    })();
