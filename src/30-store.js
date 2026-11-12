
  /* ---------- Helpers ---------- */
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var DAYN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var DAYL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function pad(n) { return String(n).padStart(2, '0'); }
  function ymd(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function parse(s) { var p = String(s).split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]); }
  function today0() { var d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function todayS() { return ymd(today0()); }
  function addDays(d, n) { var x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() + n); return x; }
  function addS(s, n) { return ymd(addDays(parse(s), n)); }
  function daysBetween(a, b) { return Math.round((parse(b) - parse(a)) / 864e5); }
  function fmtD(s) { var d = parse(s); return DAYN[d.getDay()] + ' ' + MON[d.getMonth()] + ' ' + d.getDate(); }
  function fmtMD(s) { var d = parse(s); return MON[d.getMonth()] + ' ' + d.getDate(); }
  function slug(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  function num(v) { return v === '' || v == null || isNaN(Number(v)) ? null : Number(v); }
  function fmtN(v) { if (v == null) return '–'; var r = Math.round(v * 100) / 100; return String(r).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function setPath(o, path, val) { var p = path.split('.'); for (var i = 0; i < p.length - 1; i++) { var k = p[i]; if (o[k] == null) o[k] = /^\d+$/.test(p[i + 1]) ? [] : {}; o = o[k]; } o[p[p.length - 1]] = val; }
  function getPath(o, path) { var p = path.split('.'); for (var i = 0; i < p.length && o != null; i++) o = o[p[i]]; return o; }
  function restSecs(str) {
    var out = [], m, re = /(\d+)\s*(s|min)?\s*–\s*(\d+)\s*(s|min)|(\d+)\s*(s|min)/g;
    function sec(n, u) { return Number(n) * (u === 'min' ? 60 : 1); }
    while ((m = re.exec(str || ''))) {
      if (m[5]) out.push(sec(m[5], m[6])); else { out.push(sec(m[1], m[2] || m[4])); out.push(sec(m[3], m[4])); }
    }
    return out.filter(function (s, i) { return s >= 30 && s <= 1800 && out.indexOf(s) === i; }).slice(0, 2);
  }
  function mmss(s) { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + pad(s % 60); }

  /* ---------- Store ---------- */
  // One flat map of documents, id -> data. Saved per person in the artifact's database, or on this device when there is none.
  var DOCS = {}, col = null, mode = 'loading', busy = {}, dirty = {}, timers = {}, pendingCount = 0, incoming = null, rev = 0, saveErr = '';
  var LS_KEY = 'approach-v2';
  var memo = {}, memoRev = -1;
  function cached(key, fn) { if (memoRev !== rev) { memo = {}; memoRev = rev; } if (!(key in memo)) memo[key] = fn(); return memo[key]; }
  function doc(id) { return DOCS[id]; }
  function put(id, data, now) { DOCS[id] = data; touch(id, now); }
  function del(id) { delete DOCS[id]; touch(id, true); }
  function touch(id, now) {
    rev++;
    clearTimeout(timers[id]);
    if (now) flush(id); else timers[id] = setTimeout(function () { flush(id); }, 600);
  }
  function saveLocal() { try { localStorage.setItem(LS_KEY, JSON.stringify(DOCS)); } catch (e) { mode = 'memory'; setSync(); } }
  function flush(id) {
    clearTimeout(timers[id]); delete timers[id];
    if (!col) { if (mode === 'local') saveLocal(); return; }
    if (busy[id]) { dirty[id] = true; return; }
    busy[id] = true; pendingCount++; setSync();
    var data = DOCS[id], p;
    try { p = data === undefined ? col.doc(id).delete() : col.doc(id).set(clone(data)); } catch (e) { p = Promise.reject(e); }
    Promise.resolve(p).then(function () { saveErr = ''; }, function () { saveErr = 'A change didn’t save. Check your connection; it will retry on your next edit.'; })
      .then(function () {
        busy[id] = false; pendingCount--;
        if (dirty[id]) { dirty[id] = false; flush(id); return; }
        setSync(); applyIncoming();
      });
  }
  function flushAll() { Object.keys(timers).forEach(flush); }
  function isTyping() { var a = document.activeElement; return !!(a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) && app.contains(a)); }
  function applyIncoming() {
    if (!incoming || pendingCount > 0 || Object.keys(timers).length) return;
    if (isTyping()) return;
    var next = incoming; incoming = null;
    if (JSON.stringify(next) === JSON.stringify(DOCS)) return;
    DOCS = next; rev++; render(true);
  }
  function setSync() {
    var el = document.getElementById('sync'); if (!el) return;
    var t = mode === 'loading' ? 'Loading' : saveErr ? 'Not saved' : mode === 'db' ? (pendingCount ? 'Saving' : 'Synced') : mode === 'local' ? 'On this device' : 'Not saved';
    el.className = 'sync' + (mode === 'db' && !saveErr ? '' : ' off');
    el.innerHTML = '<i></i>' + t;
    el.title = mode === 'db' ? 'Your log is saved to your account.' : mode === 'local' ? 'Your log is saved in this browser only.' : mode === 'memory' ? 'Changes are not saved in this view.' : '';
  }
  function useLocal() {
    col = null;
    try { var raw = localStorage.getItem(LS_KEY); if (raw) DOCS = JSON.parse(raw) || {}; localStorage.setItem(LS_KEY, JSON.stringify(DOCS)); mode = 'local'; }
    catch (e) { mode = 'memory'; }
    rev++; setSync(); render();
  }
  function connect() {
    var C = window.claude;
    if (!C || typeof C.use !== 'function') { useLocal(); return; }
    Promise.all([C.use('db'), C.use('user')]).then(function (r) {
      var db = r[0], user = r[1];
      if (!db || !user) { useLocal(); return; }
      return Promise.resolve(user.id()).then(function (id) {
        if (!id) { useLocal(); return; }
        col = db.collection('data/users/' + id);
        var timer = setTimeout(function () { if (mode === 'loading') useLocal(); }, 10000);
        col.onSnapshot(function (snap) {
          clearTimeout(timer);
          if (!col) return;
          var m = {};
          snap.docs.forEach(function (d) { m[d.id] = d.data(); });
          if (mode === 'loading') { mode = 'db'; DOCS = m; rev++; setSync(); render(); return; }
          incoming = m; applyIncoming();
        }, function () { clearTimeout(timer); if (mode === 'loading') useLocal(); });
      });
    }).catch(function () { useLocal(); });
  }

  /* ---------- Reading the store ---------- */
  function ids(prefix) { return cached('ids:' + prefix, function () { return Object.keys(DOCS).filter(function (k) { return k.indexOf(prefix) === 0; }).sort(); }); }
  function settings() { return DOCS.settings || null; }
  function sessions() { return cached('sess', function () { return ids('s_').map(function (id) { return { id: id, d: DOCS[id] }; }).sort(function (a, b) { return a.d.date < b.d.date ? -1 : a.d.date > b.d.date ? 1 : 0; }); }); }
  function done() { return cached('done', function () { return sessions().filter(function (s) { return s.d.done; }); }); }
  function sessionsOn(date) { return sessions().filter(function (s) { return s.d.date === date; }); }
  function trips() { return cached('trips', function () { return ids('trip_').map(function (id) { return { id: id, d: DOCS[id] }; }).sort(function (a, b) { return a.d.start < b.d.start ? -1 : 1; }); }); }
  function kilter() { return cached('kil', function () { return ids('k_').map(function (id) { return { id: id, d: DOCS[id] }; }); }); }
  function tripOn(date) { var t = trips(); for (var i = 0; i < t.length; i++) if (t[i].d.start <= date && date <= (t[i].d.end || t[i].d.start)) return t[i]; return null; }
  function nextTrip() { var t = trips(), td = todayS(); for (var i = 0; i < t.length; i++) if ((t[i].d.end || t[i].d.start) >= td) return t[i]; return null; }
  function targetArea() { var s = settings(), nt = nextTrip(); if (s && s.areaId && AREA[s.areaId]) return AREA[s.areaId]; return nt && AREA[nt.d.areaId] ? AREA[nt.d.areaId] : null; }
  function targetTrip() { var a = targetArea(), td = todayS(); if (!a) return null; var t = trips().filter(function (x) { return x.d.areaId === a.id && (x.d.end || x.d.start) >= td; }); return t[0] || null; }

  /* ---------- Schedule ---------- */
  function blockStart() { var s = settings(); return s && s.blockStart ? s.blockStart : null; }
  function weekNo(date) { var b = blockStart(); if (!b) return 0; return Math.floor(daysBetween(b, date) / 7) + 1; }
  function weekStart(w) { return addS(blockStart(), (w - 1) * 7); }
  function isAkron(w) { var s = settings(); return !!(s && s.akron && s.akron.indexOf(w) >= 0); }
  function weekPlan(w) {
    return cached('wp:' + w, function () {
      var ws = weekStart(w), dates = [0, 1, 2, 3, 4, 5, 6].map(function (i) { return addS(ws, i); });
      var out = dates.map(function (d) { return tripOn(d); });
      var ak = isAkron(w), shape = '', cut = -1;
      var kinds = ak ? ['lift1', 'rest', 'kstrength', 'lift3', 'kpower', 'sat', 'cracks'] : ['lift1', 'kpower', 'rest', 'kstrength', 'lift3', 'sat', 'cracks'];
      if (out[5] && out[6]) {
        if (out[4]) { shape = 'Fri–Sun trip'; kinds = ak ? ['lift1', 'rest', 'kstrength', 'travel', 'x', 'x', 'x'] : ['lift1', 'kstrength', 'lift3', 'travel', 'x', 'x', 'x']; cut = ak ? -1 : 2; }
        else { shape = 'Sat–Sun trip'; kinds = ak ? ['lift1', 'rest', 'kstrength', 'lift3', 'travel', 'x', 'x'] : ['lift1', 'kstrength', 'rest', 'lift3', 'travel', 'x', 'x']; cut = 3; }
      }
      return dates.map(function (d, i) {
        var kind = out[i] ? 'outside' : kinds[i];
        var dp = { date: d, w: w, i: i, kind: kind, akron: ak, trip: out[i], shape: shape, cut: i === cut, ak2: ak && !shape && kind === 'lift3' };
        if (out[i]) dp.dayN = daysBetween(out[i].d.start, d) + 1;
        return dp;
      }).map(function (dp, i, arr) { if (dp.kind === 'rest') dp.pulls = !!(arr[i + 1] && arr[i + 1].kind === 'kstrength' && hasPulls(w)); return dp; });
    });
  }
  function dayPlan(date) { var w = weekNo(date); if (w < 1 || w > 13) return null; return weekPlan(w)[daysBetween(weekStart(w), date)]; }
  function sid(date, kind) { return 's_' + date + '_' + kind; }
  function blankSession(dp, kind) {
    var d = { date: dp.date, kind: kind, wk: dp.w };
    if (LIFT[kind]) {
      var ov = doc('p_' + dp.date) || {};
      d.ex = exercises(kind, dp).map(function (e) { var o = (ov.ex || {})[e.n] || {}; return { n: e.n, t: o.target || e.t, w: o.w != null ? o.w : null, sets: Array.apply(null, Array(e.sets)).map(function () { return null; }), rir: null }; });
    }
    if (kind === 'kpower' || kind === 'kstrength' || kind === 'outside') d.probs = [];
    if (kind === 'sat') d.sets = [];
    if (kind === 'outside' && dp.trip) d.areaId = dp.trip.d.areaId;
    return d;
  }
  function sessionFor(dp, kind) { return doc(sid(dp.date, kind)) || blankSession(dp, kind); }
  function editSession(date, kind) {
    var id = sid(date, kind);
    if (!DOCS[id]) { var dp = dayPlan(date) || { date: date, w: weekNo(date), kind: kind }; DOCS[id] = blankSession(dp, kind); }
    return DOCS[id];
  }
  function load(d) { return d.rpe != null && d.mins != null ? d.rpe * d.mins : null; }
  function tagsOf(s) {
    var d = s.d || s;
    if (d.kind === 'kpower' && d.wk && phaseOf(d.wk) && phaseOf(d.wk).k === 'pe') return ['end', 'pow'];
    if (d.kind === 'outside') { var a = AREA[d.areaId]; var t = a ? topDims(a, 2).map(function (x) { return x.k; }) : ['end', 'foot']; if (t.indexOf('multi') < 0) t.push('multi'); return t; }
    return (KIND[d.kind] || KIND.other).tags;
  }
  function topDims(a, n) { return DIMS.map(function (d, i) { return { k: d[0], l: d[1], v: a.s[i] }; }).sort(function (x, y) { return y.v - x.v; }).slice(0, n); }

  /* ---------- Numbers the charts and tiles read ---------- */
  var NEED = { 5: 8, 4: 6, 3: 4, 2: 2, 1: 1 };
  function recentCounts() {
    return cached('rc', function () {
      var from = addS(todayS(), -27), c = {};
      DIMS.forEach(function (d) { c[d[0]] = 0; });
      done().forEach(function (s) { if (s.d.date >= from && s.d.date <= todayS()) tagsOf(s).forEach(function (t) { c[t]++; }); });
      return c;
    });
  }
  function coverage(a) {
    var c = recentCounts();
    return DIMS.map(function (d, i) { var need = NEED[a.s[i]], got = c[d[0]]; return { k: d[0], l: d[1], score: a.s[i], need: need, got: got, ratio: Math.min(1, got / need) }; });
  }
  function fit(a) { var cov = coverage(a), n = 0, dsum = 0; cov.forEach(function (c) { n += c.score * c.ratio; dsum += c.score; }); return Math.round(n / dsum * 100); }
  function weekSessions(w) { var a = weekStart(w), b = addS(a, 6); return done().filter(function (s) { return s.d.date >= a && s.d.date <= b; }); }
  function weekStats(w) {
    return cached('ws:' + w, function () {
      var ss = weekSessions(w), o = { lifts: 0, climbs: 0, load: 0, mins: 0, hasLoad: false, trav: 0, travMax: 0, sends: 0 };
      ss.forEach(function (s) {
        var d = s.d, cat = (KIND[d.kind] || KIND.other).cat;
        if (cat === 'lift') o.lifts++; else if (cat === 'climb') o.climbs++;
        var l = load(d); if (l != null) { o.load += l; o.hasLoad = true; }
        if (d.mins) o.mins += d.mins;
        (d.sets || []).forEach(function (x) { if (x && x.m) { o.trav += x.m; o.travMax = Math.max(o.travMax, x.m); } });
        (d.probs || []).forEach(function (p) { if (p.s) o.sends++; });
      });
      var a = weekStart(w), ci = [];
      for (var i = 0; i < 7; i++) { var c = doc('c_' + addS(a, i)); if (c) ci.push(c); }
      function avg(k) { var v = ci.map(function (c) { return c[k]; }).filter(function (x) { return x != null; }); return v.length ? v.reduce(function (p, q) { return p + q; }, 0) / v.length : null; }
      o.sleep = avg('sleep'); o.energy = avg('energy'); o.sore = avg('sore');
      var pains = ci.map(function (c) { return c.pain; }).filter(function (x) { return x != null; });
      o.pain = pains.length ? Math.max.apply(null, pains) : null;
      return o;
    });
  }
  function topWeight(name, w) {
    var best = null;
    weekSessions(w).forEach(function (s) { (s.d.ex || []).forEach(function (e) { if (e.n === name && e.w != null && (e.sets || []).some(function (x) { return x != null; })) best = best == null ? e.w : Math.max(best, e.w); }); });
    return best;
  }
  function lastEx(name, before) {
    var all = done();
    for (var i = all.length - 1; i >= 0; i--) {
      var d = all[i].d; if (d.date >= before || !d.ex) continue;
      for (var j = 0; j < d.ex.length; j++) if (d.ex[j].n === name && (d.ex[j].sets || []).some(function (x) { return x != null; })) return { date: d.date, e: d.ex[j] };
    }
    return null;
  }
  function gradeVal(g) { var m = /V(\d+)(\+)?/.exec(g || ''); return m ? Number(m[1]) + (m[2] ? .5 : 0) : -1; }
