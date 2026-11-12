
  /* ---------- Small UI pieces ---------- */
  var app = document.getElementById('app');
  var ui = { week: null, tf: { band: 'all', type: 'all', status: 'all' }, armed: null, kl: 'all', newTrip: {} };
  var STAR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M12 3.5l2.6 5.6 6 .7-4.5 4.1 1.2 6-5.3-3-5.3 3 1.2-6L3.4 9.8l6-.7z"/></svg>';

  var toastT = null;
  function toast(msg) { var el = document.getElementById('toast'); el.textContent = msg; el.hidden = false; clearTimeout(toastT); toastT = setTimeout(function () { el.hidden = true; }, 2400); }

  var tm = { end: 0, total: 0, int: null, off: null, label: 'Rest' };
  function timerEl() { return document.getElementById('timer'); }
  function startTimer(secs, label) {
    var el = timerEl();
    tm.total = secs; tm.end = Date.now() + secs * 1000; tm.label = label || 'Rest';
    el.hidden = false; el.classList.remove('go'); el.querySelector('span').textContent = tm.label;
    clearInterval(tm.int); clearTimeout(tm.off); tm.int = setInterval(tickTimer, 250); tickTimer();
  }
  function tickTimer() {
    var el = timerEl(), left = (tm.end - Date.now()) / 1000;
    if (left <= 0) {
      clearInterval(tm.int); el.classList.add('go'); el.querySelector('b').textContent = 'Go'; el.querySelector('span').textContent = 'Rest is over';
      el.querySelector('.bar').style.width = '100%';
      try { if (navigator.vibrate) navigator.vibrate(200); } catch (e) { /* no vibration here */ }
      tm.off = setTimeout(stopTimer, 9000); return;
    }
    el.querySelector('b').textContent = mmss(Math.ceil(left));
    el.querySelector('.bar').style.width = Math.max(0, 100 - left / tm.total * 100) + '%';
  }
  function stopTimer() { clearInterval(tm.int); clearTimeout(tm.off); timerEl().hidden = true; }
  function chips(restText, label) {
    var s = restSecs(restText); if (!s.length) return '';
    return '<div class="chips">' + s.map(function (x) { return '<button type="button" class="tchip" data-act="timer" data-secs="' + x + '" data-label="' + esc(label || 'Rest') + '">' + mmss(x) + '</button>'; }).join('') + '</div>';
  }

  var tipEl = document.getElementById('tip');
  function showTip(el, x, y) {
    var d; try { d = JSON.parse(el.getAttribute('data-tip')); } catch (e) { return; }
    tipEl.innerHTML = '<b>' + esc(d.t) + '</b>' + (d.r || []).map(function (r) { return '<div><span>' + (r[2] ? '<i style="background:' + r[2] + '"></i>' : '') + esc(r[0]) + '</span><strong>' + esc(r[1]) + '</strong></div>'; }).join('');
    tipEl.hidden = false;
    var w = tipEl.offsetWidth, h = tipEl.offsetHeight, vw = window.innerWidth;
    var left = Math.min(vw - w - 8, Math.max(8, x + 14)), top = y - h - 12; if (top < 8) top = y + 18;
    tipEl.style.left = left + 'px'; tipEl.style.top = top + 'px';
  }
  function tipAttr(title, rows) { return ' data-tip="' + esc(JSON.stringify({ t: title, r: rows })) + '"'; }

  /* ---------- Charts ---------- */
  function ticksFor(max) {
    if (!(max > 0)) max = 1;
    var raw = max / 4, mag = Math.pow(10, Math.floor(Math.log(raw) / Math.LN10)), n = raw / mag;
    var step = (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * mag, t = [];
    for (var v = 0; v <= max + step - 1e-9; v += step) t.push(Math.round(v * 100) / 100);
    return t;
  }
  function tickLabel(v, top) { return top >= 10000 ? (v / 1000) + 'K' : fmtN(v); }
  function frame(W, H, L, R, T, B, ticks, xTitle) {
    var top = ticks[ticks.length - 1], ph = H - T - B, s = '';
    ticks.forEach(function (t) { var y = T + ph - t / top * ph; s += '<line class="' + (t === 0 ? 'ax' : 'gl') + '" x1="' + L + '" x2="' + (W - R) + '" y1="' + y.toFixed(1) + '" y2="' + y.toFixed(1) + '"/><text x="' + (L - 6) + '" y="' + (y + 3.5).toFixed(1) + '" text-anchor="end">' + tickLabel(t, top) + '</text>'; });
    if (xTitle) s += '<text x="' + (W - R) + '" y="' + (H - 2) + '" text-anchor="end">' + esc(xTitle) + '</text>';
    return s;
  }
  // o: { cats, series: [{ name, color, vals }], h, xTitle, now, fmt }
  function colChart(W, o) {
    var H = o.h || 190, L = 36, R = 6, T = 18, B = o.xTitle ? 36 : 24, pw = W - L - R, ph = H - T - B;
    var max = 0; o.series.forEach(function (s) { s.vals.forEach(function (v) { if (v > max) max = v; }); });
    var ticks = ticksFor(Math.max(max, o.min || 0)), top = ticks[ticks.length - 1], n = o.cats.length, band = pw / n, ns = o.series.length;
    var bw = Math.max(3, Math.min(24, (band - 6 - (ns - 1) * 2) / ns)), group = ns * bw + (ns - 1) * 2, y0 = T + ph;
    var fmt = o.fmt || fmtN, s = frame(W, H, L, R, T, B, ticks, o.xTitle), skip = band < 20 ? 2 : 1;
    o.cats.forEach(function (c, i) {
      var gx = L + i * band + (band - group) / 2, rows = [];
      o.series.forEach(function (se, k) {
        var v = se.vals[i]; rows.push([se.name, v == null ? '–' : fmt(v), se.color]);
        if (!(v > 0)) return;
        var h = Math.max(2, v / top * ph), x = gx + k * (bw + 2), y = y0 - h, r = Math.min(4, bw / 2, h);
        s += '<path fill="' + se.color + '" d="M' + x.toFixed(1) + ',' + y0 + 'V' + (y + r).toFixed(1) + 'Q' + x.toFixed(1) + ',' + y.toFixed(1) + ' ' + (x + r).toFixed(1) + ',' + y.toFixed(1) + 'H' + (x + bw - r).toFixed(1) + 'Q' + (x + bw).toFixed(1) + ',' + y.toFixed(1) + ' ' + (x + bw).toFixed(1) + ',' + (y + r).toFixed(1) + 'V' + y0 + 'Z"/>';
        if (ns === 1 || band >= 40) s += '<text class="val" x="' + (x + bw / 2).toFixed(1) + '" y="' + (y - 4).toFixed(1) + '" text-anchor="middle">' + fmt(v) + '</text>';
      });
      if (i % skip === 0 || i === o.now) s += '<text x="' + (L + i * band + band / 2).toFixed(1) + '" y="' + (y0 + 14) + '" text-anchor="middle"' + (i === o.now ? ' style="fill:var(--ink);font-weight:600"' : '') + '>' + esc(c) + '</text>';
      s += '<rect class="hit" tabindex="0" x="' + (L + i * band).toFixed(1) + '" y="' + T + '" width="' + band.toFixed(1) + '" height="' + ph + '"' + tipAttr((o.tipPrefix || '') + c + (o.tipSuffix ? o.tipSuffix(i) : ''), rows) + '/>';
    });
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(o.label) + '">' + s + '</svg>';
  }
  function lineChart(W, o) {
    var H = o.h || 200, L = 36, R = 40, T = 14, B = o.xTitle ? 36 : 24, pw = W - L - R, ph = H - T - B;
    var max = 0; o.series.forEach(function (s) { s.vals.forEach(function (v) { if (v != null && v > max) max = v; }); });
    var ticks = ticksFor(max), top = ticks[ticks.length - 1], n = o.cats.length, step = n > 1 ? pw / (n - 1) : 0, y0 = T + ph;
    var fmt = o.fmt || fmtN, s = frame(W, H, L, R, T, B, ticks, o.xTitle), skip = step < 20 ? 2 : 1, ends = [];
    function X(i) { return L + i * step; } function Y(v) { return y0 - v / top * ph; }
    o.cats.forEach(function (c, i) { if (i % skip === 0 || i === o.now) s += '<text x="' + X(i).toFixed(1) + '" y="' + (y0 + 14) + '" text-anchor="middle"' + (i === o.now ? ' style="fill:var(--ink);font-weight:600"' : '') + '>' + esc(c) + '</text>'; });
    o.series.forEach(function (se) {
      var pts = []; se.vals.forEach(function (v, i) { if (v != null) pts.push([X(i), Y(v), v]); });
      if (!pts.length) return;
      if (pts.length > 1) s += '<polyline fill="none" stroke="' + se.color + '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" points="' + pts.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ') + '"/>';
      pts.forEach(function (p) { s += '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="4" fill="' + se.color + '" stroke="var(--surface)" stroke-width="2"/>'; });
      var e = pts[pts.length - 1]; ends.push({ x: e[0], y: e[1], v: e[2] });
    });
    ends.sort(function (a, b) { return a.y - b.y; });
    for (var i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 12) ends[i].y = ends[i - 1].y + 12;
    ends.forEach(function (e) { s += '<text class="val" x="' + (e.x + 8).toFixed(1) + '" y="' + (e.y + 3.5).toFixed(1) + '">' + fmt(e.v) + '</text>'; });
    o.cats.forEach(function (c, i) {
      var rows = o.series.map(function (se) { return [se.name, se.vals[i] == null ? '–' : fmt(se.vals[i]), se.color]; });
      var hw = Math.max(step, 14);
      s += '<rect class="hit" tabindex="0" x="' + (X(i) - hw / 2).toFixed(1) + '" y="' + T + '" width="' + hw.toFixed(1) + '" height="' + ph + '"' + tipAttr((o.tipPrefix || '') + c, rows) + '/><line class="xh" x1="' + X(i).toFixed(1) + '" x2="' + X(i).toFixed(1) + '" y1="' + T + '" y2="' + y0 + '"/>';
    });
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(o.label) + '">' + s + '</svg>';
  }
  // One small line with its own scale: used as small multiples, never as a second axis.
  function miniLine(W, o) {
    var H = 74, L = 36, R = 34, T = 10, B = 18, pw = W - L - R, ph = H - T - B, n = o.pts.length, step = n > 1 ? pw / (n - 1) : 0, y0 = T + ph;
    var lo = o.lo, hi = o.hi, s = '', last = null, pts = [];
    function Y(v) { return y0 - (v - lo) / (hi - lo) * ph; }
    s += '<line class="ax" x1="' + L + '" x2="' + (W - R) + '" y1="' + y0 + '" y2="' + y0 + '"/><line class="gl" x1="' + L + '" x2="' + (W - R) + '" y1="' + T + '" y2="' + T + '"/>';
    s += '<text x="' + (L - 6) + '" y="' + (y0 + 3.5) + '" text-anchor="end">' + lo + '</text><text x="' + (L - 6) + '" y="' + (T + 3.5) + '" text-anchor="end">' + hi + '</text>';
    o.pts.forEach(function (p, i) { if (p.v != null) { pts.push([L + i * step, Y(p.v)]); last = { x: L + i * step, y: Y(p.v), v: p.v }; } });
    if (pts.length > 1) s += '<polyline fill="none" stroke="' + o.color + '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" points="' + pts.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ') + '"/>';
    if (last) s += '<circle cx="' + last.x.toFixed(1) + '" cy="' + last.y.toFixed(1) + '" r="4" fill="' + o.color + '" stroke="var(--surface)" stroke-width="2"/><text class="val" x="' + (last.x + 8).toFixed(1) + '" y="' + (last.y + 3.5).toFixed(1) + '">' + fmtN(last.v) + '</text>';
    if (n) s += '<text x="' + L + '" y="' + (H - 2) + '">' + esc(o.pts[0].x) + '</text><text x="' + (W - R) + '" y="' + (H - 2) + '" text-anchor="end">' + esc(o.pts[n - 1].x) + '</text>';
    o.pts.forEach(function (p, i) {
      var hw = Math.max(step, 10), x = L + i * step;
      s += '<rect class="hit" tabindex="0" x="' + (x - hw / 2).toFixed(1) + '" y="' + T + '" width="' + hw.toFixed(1) + '" height="' + ph + '"' + tipAttr(p.x, [[o.name, p.v == null ? '–' : fmtN(p.v) + (o.unit || ''), o.color]]) + '/><line class="xh" x1="' + x.toFixed(1) + '" x2="' + x.toFixed(1) + '" y1="' + T + '" y2="' + y0 + '"/>';
    });
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(o.name) + ' by day">' + s + '</svg>';
  }
  function legend(series) { return '<div class="legend">' + series.map(function (s) { return '<span><i class="' + (s.line ? 'ln' : '') + '" style="background:' + s.color + '"></i>' + esc(s.name) + '</span>'; }).join('') + '</div>'; }
  function tableView(head, rows) {
    return '<details class="tbl"><summary></summary><div class="twrap"><table class="t"><thead><tr>' + head.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      rows.map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + esc(c == null ? '–' : c) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div></details>';
  }
  function radar(a) {
    var cov = coverage(a), cx = 150, cy = 118, R = 78, s = '', n = 6;
    function pt(i, r) { var ang = -Math.PI / 2 + i * 2 * Math.PI / n; return [cx + Math.cos(ang) * r, cy + Math.sin(ang) * r]; }
    function poly(f) { return cov.map(function (c, i) { var p = pt(i, f(c) / 5 * R); return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' '); }
    [1, 2, 3, 4, 5].forEach(function (k) { s += '<polygon class="web" points="' + cov.map(function (c, i) { var p = pt(i, k / 5 * R); return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ') + '"/>'; });
    cov.forEach(function (c, i) { var p = pt(i, R), l = pt(i, R + 14); s += '<line class="spoke" x1="' + cx + '" y1="' + cy + '" x2="' + p[0].toFixed(1) + '" y2="' + p[1].toFixed(1) + '"/>';
      var anchor = Math.abs(l[0] - cx) < 4 ? 'middle' : l[0] > cx ? 'start' : 'end';
      var words = c.l.split(' '); s += '<text text-anchor="' + anchor + '" x="' + l[0].toFixed(1) + '" y="' + (l[1] + (i === 0 ? -8 : i === 3 ? 6 : 0)).toFixed(1) + '">' + words.map(function (wd, j) { return '<tspan x="' + l[0].toFixed(1) + '" dy="' + (j ? 11 : 0) + '">' + esc(wd) + '</tspan>'; }).join('') + '</text>'; });
    s += '<polygon class="need" points="' + poly(function (c) { return c.score; }) + '"/><polygon class="have" points="' + poly(function (c) { return c.score * c.ratio; }) + '"/>';
    return '<svg class="radar" viewBox="0 0 300 236" role="img" aria-label="What ' + esc(a.name) + ' asks for against what your last 4 weeks trained">' + s + '</svg>';
  }
  // The block as a route: 13 pitches, ledges on the deload weeks, the summit on test week.
  function topo(W, sel) {
    var H = 236, L = 26, R = 26, step = (W - L - R) / 12, cur = weekNo(todayS()), y = 178, pts = [], s = '';
    for (var w = 1; w <= 13; w++) {
      if (w > 1) { var k = phaseOf(w).k; y -= k === 'deload' ? 0 : k === 'test' ? 10 : 13; }
      pts.push([L + (w - 1) * step, y]);
    }
    s += '<polygon class="ground" points="' + L + ',' + 196 + ' ' + pts.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ') + ' ' + (W - R) + ',196"/>';
    var doneTo = Math.max(1, Math.min(13, cur));
    s += '<polyline class="line todo" points="' + pts.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ') + '"/>';
    if (cur >= 1) s += '<polyline class="line" points="' + pts.slice(0, doneTo).map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ') + '"/>';
    PHASES.forEach(function (p) {
      var x1 = pts[p.from - 1][0] - step * .42, x2 = pts[p.to - 1][0] + step * .42, mid = (x1 + x2) / 2, narrow = p.from === p.to;
      s += '<line class="gl" style="stroke:var(--rule2)" x1="' + x1.toFixed(1) + '" x2="' + x2.toFixed(1) + '" y1="206" y2="206"/>';
      if (!narrow || W > 520) s += '<text class="' + (narrow ? '' : 'ph') + '" x="' + mid.toFixed(1) + '" y="' + (narrow ? 219 : 223) + '" text-anchor="middle">' + (narrow ? (p.k === 'test' ? 'TEST' : 'EASY') : esc(W < 420 && p.k === 'pe' ? 'Power end.' : p.name)) + '</text>';
    });
    var r = Math.min(11, step / 2 - 1.5);
    for (w = 1; w <= 13; w++) {
      var p = pts[w - 1], cls = w < cur ? 'past' : w === cur ? 'now' : 'future';
      if (w === sel) cls += ' sel';
      var st = weekStart(w), hasTrip = false; for (var i = 0; i < 7; i++) if (tripOn(addS(st, i))) hasTrip = true;
      if (hasTrip) s += '<path d="M' + p[0].toFixed(1) + ',' + (p[1] - r - 2).toFixed(1) + 'v-13l9,3.5l-9,3.5" fill="var(--accent)" stroke="var(--accent)" stroke-width="1.5" stroke-linejoin="round"/>';
      if (isAkron(w)) s += '<text x="' + p[0].toFixed(1) + '" y="' + (p[1] + r + 12).toFixed(1) + '" text-anchor="middle" style="font-size:8.5px">AK</text>';
      s += '<a href="#plan" data-act="week" data-w="' + w + '" class="' + cls + '" aria-label="Week ' + w + ', ' + phaseOf(w).name + '"><circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="' + r.toFixed(1) + '"/><text class="wn" x="' + p[0].toFixed(1) + '" y="' + (p[1] + 3.5).toFixed(1) + '" text-anchor="middle">' + w + '</text></a>';
    }
    if (cur >= 1 && cur <= 13) { var c = pts[cur - 1], hasFlag = false; for (i = 0; i < 7; i++) if (tripOn(addS(weekStart(cur), i))) hasFlag = true;
      s += '<text class="here" x="' + c[0].toFixed(1) + '" y="' + (c[1] - r - (hasFlag ? 22 : 8)).toFixed(1) + '" text-anchor="' + (cur > 10 ? 'end' : cur < 3 ? 'start' : 'middle') + '">YOU ARE HERE</text>'; }
    return '<svg class="topo" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="The 13-week block drawn as a route. You are on week ' + cur + '.">' + s + '</svg>';
  }
