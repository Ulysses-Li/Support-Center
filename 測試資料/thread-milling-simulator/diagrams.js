/* SVG 繪圖層：靜態幾何只在條件改變時建立，播放時僅更新刀位與已走過的軌跡。 */
window.ThreadDiagrams = (() => {
  const el = id => document.getElementById(id);
  const n = value => Number(value.toFixed(3));
  let state;

  // 配對圖示與動畫共用 MCC 刀片外形：窄頂、斜肩、中央凹槽、外擴刀齒與底部倒角。
  // 原點維持在刀具底部，外側刀齒仍落在 ±radius，保留既有刀徑與刀位對應。
  function insertArtwork({ radius: r, pitch, toothDepth, angle = 60, prefix, shankHeight = 0 }) {
    const apex = -pitch / 2, top = apex - .76 * r, shoulderY = apex - .56 * r;
    const root = r - toothDepth, shoulderX = Math.min(.67 * r, root * .95);
    const topX = Math.min(.36 * r, shoulderX * .6), bottomX = Math.max(shoulderX * .9, root * .78);
    const flat = pitch / 8, halfTooth = Math.min(.44 * pitch, flat / 2 + toothDepth * Math.tan(angle * Math.PI / 360));
    const points = [[topX, top], [shoulderX, shoulderY], [root, apex - halfTooth], [r, apex - flat / 2], [r, apex + flat / 2], [root, apex + halfTooth], [bottomX, 0]];
    const outline = points.concat(points.slice().reverse().map(([x, y]) => [-x, y]));
    const polygon = coords => `M${coords.map(([x, y]) => `${n(x)},${n(y)}`).join(' L')}Z`;
    const facet = sign => polygon([[sign * topX, top], [sign * shoulderX, shoulderY], [sign * root, apex - halfTooth], [sign * bottomX, 0], [sign * .49 * r, 0], [sign * .49 * r, apex - .13 * r], [sign * .35 * r, shoulderY]]);
    const tooth = sign => polygon([[sign * root, apex - halfTooth], [sign * r, apex - flat / 2], [sign * r, apex + flat / 2], [sign * root, apex + halfTooth]]);
    const pocketTop = top + .13 * r, pocketBottom = Math.min(-.07 * r, apex + .2 * r);
    const shank = Math.max(topX, .44 * r);
    return `<defs>
      <linearGradient id="${prefix}-metal" x1="0" x2="1"><stop stop-color="#8195a4"/><stop offset=".25" stop-color="#b8c6d0"/><stop offset=".52" stop-color="#dce5eb"/><stop offset=".76" stop-color="#a9b9c5"/><stop offset="1" stop-color="#6e8697"/></linearGradient>
      <linearGradient id="${prefix}-pocket" x1="0" x2="1"><stop stop-color="#526b7c"/><stop offset=".2" stop-color="#8197a7"/><stop offset=".75" stop-color="#9eafbb"/><stop offset="1" stop-color="#566e7f"/></linearGradient>
      <linearGradient id="${prefix}-edge" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#ffc18b"/><stop offset=".5" stop-color="#f78b3e"/><stop offset="1" stop-color="#df5a16"/></linearGradient>
    </defs>
    ${shankHeight ? `<path data-tool-part="shank" d="M${n(-shank)},${n(top)}V${n(top - shankHeight)}H${n(shank)}V${n(top)}" fill="#dce7ee" fill-opacity=".4" stroke="#8faabd" stroke-width="1" stroke-dasharray="4 3"/>` : ''}
    <g stroke-linejoin="round">
      <path data-tool-part="body" d="${polygon(outline)}" fill="url(#${prefix}-metal)" stroke="#526c7f" stroke-width="1.4"/>
      <path d="${facet(-1)}" fill="#536d7f" fill-opacity=".45" stroke="#6d8596" stroke-width=".7"/>
      <path d="${facet(1)}" fill="#60798b" fill-opacity=".45" stroke="#6d8596" stroke-width=".7"/>
      <path d="M${n(-topX)},${n(top)}H${n(topX)}L${n(shoulderX)},${n(shoulderY)}H${n(shoulderX - .14 * r)}L${n(topX - .1 * r)},${n(top + .1 * r)}H${n(-topX + .1 * r)}L${n(-shoulderX + .14 * r)},${n(shoulderY)}H${n(-shoulderX)}Z" fill="#d9e3e9" fill-opacity=".85" stroke="#7991a3" stroke-width=".7"/>
      <path d="M${n(-.23 * r)},${n(pocketTop)}H${n(.23 * r)}V${n(pocketBottom)}L0,${n(pocketBottom + .08 * r)}L${n(-.23 * r)},${n(pocketBottom)}Z" fill="url(#${prefix}-pocket)" stroke="#536e81" stroke-width=".9"/>
      <path d="M${n(-.16 * r)},${n(pocketTop + .04 * r)}V${n(pocketBottom - .04 * r)}M${n(.19 * r)},${n(pocketTop + .04 * r)}V${n(pocketBottom - .04 * r)}" fill="none" stroke="#d2dfe7" stroke-width=".8" opacity=".85"/>
      <path d="M${n(-.34 * r)},${n(top + .13 * r)}V${n(shoulderY)}L${n(-.58 * r)},${n(apex)}V${n(-.08 * r)}M${n(.34 * r)},${n(top + .13 * r)}V${n(shoulderY)}L${n(.58 * r)},${n(apex)}V${n(-.08 * r)}" fill="none" stroke="#557387" stroke-width="1" stroke-dasharray="2 2" opacity=".65"/>
      <path data-tool-part="teeth" d="${tooth(-1)} ${tooth(1)}" fill="url(#${prefix}-edge)" stroke="#d65b18" stroke-width="1"/>
      <path d="M${n(-bottomX)},0H${n(bottomX)}" stroke="#526e80" stroke-width="1.2"/>
    </g>`;
  }

  function insertIcon(index) {
    return `<svg class="insert-artwork" viewBox="-31 -32 62 39" aria-hidden="true">${insertArtwork({ radius: 26, pitch: 10, toothDepth: 4, prefix: `insert-card-${index}`, shankHeight: 6 })}</svg>`;
  }

  function grid(prefix) {
    return `<defs><pattern id="${prefix}-grid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" fill="none" stroke="#dceaf3" stroke-width=".6"/></pattern><pattern id="${prefix}-hatch" width="12" height="12" patternTransform="rotate(40)" patternUnits="userSpaceOnUse"><rect width="12" height="12" fill="#e7f0f7"/><path d="M0 0V12" stroke="#b7cddd" stroke-width="1.2"/></pattern><linearGradient id="${prefix}-tool" x1="0" x2="1"><stop stop-color="#7c94a7"/><stop offset=".45" stop-color="#e5eef4"/><stop offset="1" stop-color="#8da3b3"/></linearGradient><marker id="${prefix}-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5 0 10Z" fill="#6e99b6"/></marker><clipPath id="${prefix}-clip"><rect x="24" y="24" width="432" height="306" rx="3"/></clipPath></defs><rect x="24" y="24" width="432" height="306" fill="url(#${prefix}-grid)"/>`;
  }

  function prepare(motion, angle) {
    const p = motion.input, tooth = (p.od - p.tapDrill) / 2;
    const scaleAx = Math.min(218 / (p.depth + p.pitch * 1.5), 230 / (p.od + p.toolDiameter + 3));
    const axX = x => 238 + x * scaleAx, axY = z => 79 - z * scaleAx;
    const maxRadius = Math.max(p.od / 2, ...motion.points.filter(q => q.phase === 'cut').map(q => Math.hypot(q.x, q.y) + p.toolDiameter / 2));
    const scaleRd = 116 / Math.max(1, maxRadius), rdX = x => 240 + x * scaleRd, rdY = y => 177 - y * scaleRd;
    const path = (points, project) => points.map((q, i) => `${i ? 'L' : 'M'}${project(q)}`).join(' ');
    const projectAx = q => `${n(axX(q.x))},${n(axY(q.z))}`, projectRd = q => `${n(rdX(q.x))},${n(rdY(q.y))}`;
    state = { motion, axX, axY, rdX, rdY, projectAx, projectRd, path };

    // 牙型為名義剖面，左右相差半個螺距；錐牙以 1:16 直徑錐度顯示。
    const wall = side => {
      const coords = [], s = side === 'left' ? -1 : 1;
      const radialAt = (depth, major) => (major ? p.od / 2 : p.tapDrill / 2) - (motion.tapered ? Math.max(0, depth) / 32 : 0);
      const add = (depth, major) => coords.push(`${n(axX(s * radialAt(depth, major)))},${n(axY(-depth))}`);
      add(0, false);
      const width = Math.min(.44 * p.pitch, tooth * Math.tan(angle * Math.PI / 360) + p.pitch / 16);
      const offset = side === 'left' ? p.pitch / 2 : 0;
      for (let y = offset; y < p.depth + p.pitch; y += p.pitch) {
        [[y - width, false], [y - p.pitch / 16, true], [y + p.pitch / 16, true], [y + width, false]].forEach(([d, major]) => { if (d > 0 && d < p.depth + p.pitch / 2) add(d, major); });
      }
      const bottom = p.depth + p.pitch / 2;
      add(bottom, false);
      const outer = side === 'left' ? 100 : 376;
      return `M${outer},79 L${coords.join(' L')} L${outer},${n(axY(-bottom))} Z`;
    };
    const cr = p.toolDiameter / 2 * scaleAx;
    el('axialView').innerHTML = `${grid('ax')}
      <g clip-path="url(#ax-clip)"><path d="M238 28V323" stroke="#9ab7ca" stroke-dasharray="6 5"/><path d="${wall('left')} ${wall('right')}" fill="url(#ax-hatch)" stroke="#6b95b0" stroke-width="1.4"/>
      <path d="M90 79H386" stroke="#4d829f" stroke-width="1.1"/><path d="M90 ${n(axY(-p.depth))}H386" stroke="#a4becf" stroke-dasharray="4 5"/>
      <path d="${path(motion.points, projectAx)}" fill="none" stroke="#9fb8cb" stroke-width="1.1" stroke-dasharray="4 5" opacity=".6"/>
      <path id="axTravel" class="travel-path"/><path id="axCut" class="cut-path"/>
      <g id="axTool">${insertArtwork({ radius: cr, pitch: p.pitch * scaleAx, toothDepth: tooth * scaleAx, angle, prefix: 'ax-insert', shankHeight: 180 })}<circle r="1.8" fill="#f05a1a" stroke="#fff"/></g></g>
      <path d="M70 83V${n(axY(-p.depth) - 4)}" fill="none" stroke="#6e99b6" marker-start="url(#ax-arrow)" marker-end="url(#ax-arrow)"/>
      <text x="61" y="${n((79 + axY(-p.depth)) / 2)}" text-anchor="middle" transform="rotate(-90 61 ${n((79 + axY(-p.depth)) / 2)})" class="diagram-measure">${n(p.depth)} mm</text>
      <text x="102" y="64" class="diagram-label">工件表面 Z0</text><text x="397" y="83" class="diagram-label">X</text><text x="245" y="37" class="diagram-label">Z+</text><text x="360" y="328" class="diagram-label">${motion.tapered ? '錐度 1:16' : '平行螺紋'}</text>`;

    const major = p.od / 2 * scaleRd, minor = p.tapDrill / 2 * scaleRd, toolR = p.toolDiameter / 2 * scaleRd;
    const workpiece = `M105 42H375V312H105Z M${240 - minor},177a${minor},${minor} 0 1,0 ${2 * minor},0a${minor},${minor} 0 1,0 ${-2 * minor},0Z`;
    const dir = motion.tapered ? -1 : 1, arrowR = Math.max(23, major + 20), angle0 = -.8, angle1 = angle0 + dir * 1.15;
    el('radialView').innerHTML = `${grid('rd')}
      <g clip-path="url(#rd-clip)"><path d="${workpiece}" fill="url(#rd-hatch)" fill-rule="evenodd" opacity=".8" stroke="#a5c0d3"/>
      <path d="M46 177H434M240 30V324" stroke="#94b2c6" stroke-dasharray="6 5"/>
      <circle cx="240" cy="177" r="${n(major)}" fill="none" stroke="#0067ad" stroke-width="1.2" stroke-dasharray="5 4"/>
      <path d="${path(motion.points, projectRd)}" fill="none" stroke="#9cb6c9" stroke-dasharray="4 5" stroke-width="1.2"/>
      <path id="rdTravel" class="travel-path"/><path id="rdCut" class="cut-path"/>
      <g id="rdTool"><circle r="${n(toolR)}" fill="#f6b782" fill-opacity=".52" stroke="#f05a1a" stroke-width="1.7"/><circle r="${n(toolR * .72)}" fill="none" stroke="#e88a4d" stroke-width="1" stroke-dasharray="5 4"/><path d="M-6 0H6M0-6V6" stroke="#c3571b" stroke-width="1.2"/><circle r="4" fill="#f05a1a" stroke="#fff" stroke-width="1.3"/></g>
      <path d="M${n(240 + arrowR * Math.cos(angle0))},${n(177 - arrowR * Math.sin(angle0))}A${n(arrowR)},${n(arrowR)} 0 0 ${dir < 0 ? 1 : 0} ${n(240 + arrowR * Math.cos(angle1))},${n(177 - arrowR * Math.sin(angle1))}" fill="none" stroke="#6e99b6" stroke-width="2" marker-end="url(#rd-arrow)"/>
      </g><text x="417" y="169" class="diagram-label">X+</text><text x="249" y="39" class="diagram-label">Y+</text>
      <rect x="148" y="294" width="184" height="30" rx="15" fill="#f8fcff"/><text x="240" y="315" text-anchor="middle" class="diagram-measure">螺紋 Ø${n(p.od)}</text>`;
  }

  function draw(time) {
    if (!state) return null;
    const { motion, axX, axY, rdX, rdY, projectAx, projectRd } = state;
    const current = window.ThreadMotion.sample(motion, time);
    const drawn = motion.points.slice(0, current.index + 1).filter(q => q.pass === current.pass);
    drawn.push(current);
    const traces = { cut: [], travel: [] };
    for (let i = 1; i < drawn.length; i++) {
      const q = drawn[i], previous = drawn[i - 1], group = q.phase === 'cut' ? 'cut' : 'travel';
      traces[group].push([previous, q]);
    }
    for (const [group, segments] of Object.entries(traces)) {
      // 同一階段合併為一條折線，避免每個線段都增加 SVG 節點。
      let ax = '', rd = '', last;
      for (const [a, b] of segments) {
        ax += (last === a ? ' L' : ` M${projectAx(a)} L`) + projectAx(b);
        rd += (last === a ? ' L' : ` M${projectRd(a)} L`) + projectRd(b);
        last = b;
      }
      el(group === 'cut' ? 'axCut' : 'axTravel').setAttribute('d', ax);
      el(group === 'cut' ? 'rdCut' : 'rdTravel').setAttribute('d', rd);
    }
    el('axTool').setAttribute('transform', `translate(${n(axX(current.x))},${n(axY(current.z))})`);
    el('rdTool').setAttribute('transform', `translate(${n(rdX(current.x))},${n(rdY(current.y))})`);
    return current;
  }
  return { prepare, draw, insertIcon };
})();
