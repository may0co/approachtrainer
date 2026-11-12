  /* ---------- State and storage ---------- */
  function blank() { return { settings: null, ticks: {}, checks: {}, weeks: {}, kilter: { items: [] }, tests: { rows: {} } }; }
  var S = blank();
  var mode = 'loading', pending = 0, chains = {}, saveMsg = '', rev = 0, cache = {};
  var LS_KEY = 'approach-v2';
  var ui = { tf: { band: 'all', type: 'all', status: 'all' }, D: null, armed: null, planWeek: null, openDay: null, rest: null, sample: false, logFilter: 'all', ciEdit: false, toast: '' };

  function touch() { rev++; cache = {}; }
  function applyDocs(map) {
    var n = blank();
    Object.keys(map).forEach(function (id) {
      var d = map[id]; if (!d) return;
      if (id === 'settings') n.settings = d;
      else if (id === 'kilter') n.kilter = { items: d.items || [] };
      else if (id === 'tests') n.tests = { rows: d.rows || {} };
      else if (id.indexOf('ticks_') === 0) n.ticks[id.slice(6)] = d.r || {};
      else if (id.indexOf('checks_') === 0) n.checks[id.slice(7)] = d.c || {};
      else if (id.indexOf('w_') === 0) n.weeks[id.slice(2)] = { s: d.s || {}, c: d.c || {}, p: d.p || {} };
    });
    S = n; touch();
  }
  function allDocs() {
    var m = {};
    if (S.settings) m.settings = S.settings;
    if (S.kilter.items.length) m.kilter = S.kilter;
    if (Object.keys(S.tests.rows).length) m.tests = S.tests;
    Object.keys(S.ticks).forEach(function (k) { m['ticks_' + k] = { r: S.ticks[k] }; });
    Object.keys(S.checks).forEach(function (k) { m['checks_' + k] = { c: S.checks[k] }; });
    Object.keys(S.weeks).forEach(function (k) { m['w_' + k] = S.weeks[k]; });
    return m;
  }
  /* Storage: this browser first, with optional sync to a Supabase project named in config.js. */
  var CFG = window.APPROACH_CONFIG || {}, AUTH_KEY = 'approach-auth', sess = null;
  function cloud() { return !!(CFG.supabaseUrl && CFG.supabaseKey); }
  function cacheLocal() { try { localStorage.setItem(LS_KEY, JSON.stringify(allDocs())); if (mode === 'memory') mode = 'local'; } catch (e) { if (!cloud()) mode = 'memory'; } }
  function setSess(x) { sess = x; try { if (x) localStorage.setItem(AUTH_KEY, JSON.stringify(x)); else localStorage.removeItem(AUTH_KEY); } catch (e) { /* stays in memory */ } }
  function call(path, opt, retried) {
    opt = opt || {};
    var h = Object.assign({ apikey: CFG.supabaseKey, 'Content-Type': 'application/json' }, opt.headers || {});
    if (sess && !opt.noAuth) h.Authorization = 'Bearer ' + sess.access_token;
    return fetch(CFG.supabaseUrl.replace(/\/$/, '') + path, { method: opt.method || 'GET', headers: h, body: opt.body ? JSON.stringify(opt.body) : undefined }).then(function (r) {
      if (r.status === 401 && sess && sess.refresh_token && !retried && !opt.noAuth) {
        return call('/auth/v1/token?grant_type=refresh_token', { method: 'POST', noAuth: true, body: { refresh_token: sess.refresh_token } }).then(function (j) { setSess({ access_token: j.access_token, refresh_token: j.refresh_token, email: sess.email }); return call(path, opt, true); });
      }
      return r.text().then(function (t) { var j = t ? JSON.parse(t) : null; if (!r.ok) throw new Error((j && (j.msg || j.error_description || j.message)) || 'Request failed (' + r.status + ')'); return j; });
    });
  }
  function persist(id, data) {
    touch();
    if (ui.sample) return;
    cacheLocal();
    if (!cloud() || !sess) return;
    pending++;
    var copy = data === null ? null : JSON.parse(JSON.stringify(data));
    var prev = chains[id] || Promise.resolve();
    chains[id] = prev.then(function () {
      return copy === null ? call('/rest/v1/docs?id=eq.' + encodeURIComponent(id), { method: 'DELETE' })
        : call('/rest/v1/docs?on_conflict=user_id,id', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: { id: id, data: copy } });
    }).catch(function () { saveMsg = 'That change is saved on this device but did not sync. Check your connection; it will be sent with your next change to the same item.'; })
      .then(function () { pending--; if (saveMsg) render(); });
  }
  function saveSettings() { persist('settings', S.settings); }
  function weekDoc(monS) { if (!S.weeks[monS]) S.weeks[monS] = { s: {}, c: {}, p: {} }; return S.weeks[monS]; }
  function saveWeek(monS) { persist('w_' + monS, S.weeks[monS]); }
  function pull() {
    if (!cloud() || !sess || ui.sample) return Promise.resolve();
    return call('/rest/v1/docs?select=id,data').then(function (rows) {
      if (pending > 0 || ui.sample) return;
      var m = {}; rows.forEach(function (r) { m[r.id] = r.data; });
      var before = JSON.stringify(allDocs());
      applyDocs(m); cacheLocal(); ui.synced = Date.now();
      if (JSON.stringify(allDocs()) !== before) render();
    }).catch(function (e) { if (/JWT|token|401/i.test(e.message)) { setSess(null); mode = 'signedout'; render(); } });
  }
  function signIn(email, pw, create) {
    ui.authMsg = ''; ui.authBusy = true; render();
    var p = create ? call('/auth/v1/signup', { method: 'POST', noAuth: true, body: { email: email, password: pw } }) : call('/auth/v1/token?grant_type=password', { method: 'POST', noAuth: true, body: { email: email, password: pw } });
    p.then(function (j) {
      ui.authBusy = false;
      if (!j || !j.access_token) { ui.authMsg = 'Account created. Open the confirmation email, then sign in here.'; render(); return; }
      setSess({ access_token: j.access_token, refresh_token: j.refresh_token, email: email });
      var local = allDocs(), had = Object.keys(local).length > 0;
      mode = 'db'; render();
      call('/rest/v1/docs?select=id,data').then(function (rows) {
        if (rows.length || !had) { var m = {}; rows.forEach(function (r) { m[r.id] = r.data; }); applyDocs(m); cacheLocal(); }
        else Object.keys(local).forEach(function (id) { persist(id, local[id]); });
        ui.synced = Date.now(); render();
      });
    }).catch(function (e) { ui.authBusy = false; ui.authMsg = e.message; render(); });
  }
  function signOut() { setSess(null); S = blank(); touch(); try { localStorage.removeItem(LS_KEY); } catch (e) { /* nothing cached */ } mode = 'signedout'; render(); }
  function importDocs(map) {
    var n = 0;
    Object.keys(map).forEach(function (id) { if (/^(settings|kilter|tests|ticks_[a-z]+|checks_[a-z]+|w_\d{4}-\d{2}-\d{2})$/.test(id) && map[id] && typeof map[id] === 'object') n++; else delete map[id]; });
    if (!n) return 0;
    var merged = Object.assign(allDocs(), map);
    applyDocs(merged);
    Object.keys(map).forEach(function (id) { persist(id, map[id]); });
    return n;
  }
  function init() {
    try { var raw = localStorage.getItem(LS_KEY); if (raw) applyDocs(JSON.parse(raw)); mode = 'local'; } catch (e) { mode = 'memory'; }
    if (cloud()) {
      try { sess = JSON.parse(localStorage.getItem(AUTH_KEY) || 'null'); } catch (e) { sess = null; }
      mode = sess ? 'db' : 'signedout';
      if (sess) pull();
      document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') pull(); });
    }
    render();
  }

  /* ---------- Helpers ---------- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function pad(n) { return String(n).padStart(2, '0'); }
  function ymd(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function parse(s) { var p = String(s).split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]); }
  function today0() { var d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function addDays(d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function monday(d) { return addDays(d, -((d.getDay() + 6) % 7)); }
  function monOf(s) { return ymd(monday(parse(s))); }
  function dayDiff(a, b) { return Math.round((a - b) / 864e5); }
  function fmt(s, o) { return parse(s).toLocaleDateString(undefined, o || { month: 'short', day: 'numeric' }); }
  function slug(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  function num(v) { var n = parseFloat(v); return isFinite(n) ? n : null; }
  function r1(n) { return Math.round(n * 10) / 10; }
  function avg(a) { return a.length ? a.reduce(function (x, y) { return x + y; }, 0) / a.length : null; }
  function curArea() { return S.settings && AREA[S.settings.areaId] ? AREA[S.settings.areaId] : null; }
  function topDims(a, n) { return DIMS.map(function (d, i) { return { k: d[0], l: d[1], v: a.s[i] }; }).sort(function (x, y) { return y.v - x.v; }).slice(0, n); }
  function dimScore(a, k) { return a.s[DIMS.findIndex(function (d) { return d[0] === k; })]; }
  function band(g) { var m = /5\.(\d+)/.exec(g); var n = m ? Number(m[1]) : 0; return n <= 9 ? '9' : n >= 12 ? '12' : String(n); }
  var BAND_LABEL = { '9': '5.9 and under', '10': '5.10', '11': '5.11', '12': '5.12' };
  var DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  function restWord() { return (S.settings && S.settings.restLabel) || 'Tuesday rest'; }

  /* ---------- Block and plan ---------- */
  function blockStart() { return S.settings && S.settings.block ? S.settings.block : null; }
  function weekNo(d) { var st = blockStart(); if (!st) return 0; return Math.floor(dayDiff(monday(d), parse(st)) / 7) + 1; }
  function weekMon(w) { return addDays(parse(blockStart()), (w - 1) * 7); }
  function weekType(monS) { return (S.settings && S.settings.wt && S.settings.wt[monS]) || 'normal'; }
  function tripInfo() {
    var st = S.settings, a = curArea();
    if (!a) return { k: 'none' };
    if (!st.start) return { k: 'nodate', a: a };
    var t = today0(), s = parse(st.start), e = st.end ? parse(st.end) : s, days = dayDiff(s, t);
    if (t > e) return { k: 'past', a: a, days: days };
    if (days <= 0) return { k: 'on', a: a, days: days };
    return { k: 'ahead', a: a, days: days };
  }
  // How specific a given week should be to the area: off far out, on from 8 weeks, taper in the last week.
  function specificity(mon) {
    var st = S.settings, a = curArea();
    if (!a) return { on: false };
    if (!st.start) return { on: true, label: 'Area sessions are on. Add trip dates and they will switch on 8 weeks out and taper in the final week.' };
    var s = parse(st.start), e = st.end ? parse(st.end) : s, days = dayDiff(s, mon);
    if (mon > e) return { on: false, label: 'The trip is done, so this week runs the plain block.' };
    if (days > 56) return { on: false, label: 'The trip is ' + Math.round(days / 7) + ' weeks from this week. Build general strength for now: area sessions switch on ' + fmt(ymd(addDays(s, -56))) + ', 8 weeks out.' };
    if (days <= 6) return { on: true, taper: true, label: 'Trip week. Half the volume, nothing to failure, and make your last hard session 4 days before you leave.' };
    return { on: true, label: Math.ceil(days / 7) + ' weeks to the trip from this week: area sessions are on.' };
  }
  function areaSwap(a, sid, ph) {
    if (ph === 'deload' || ph === 'test') return null;
    var end = a.s[0], fing = a.s[1], crack = a.s[3], foot = a.s[4], multi = a.s[5];
    if (sid === 'lift1') {
      if (crack >= 4) return { add: 'Add 3 × 10–12 biceps curls and 2 × 15 reverse wrist curls. Jamming leans on both.', why: 'crack' };
      if (end >= 4) return { add: 'Push the knee raises toward toes-to-bar. Body tension keeps your feet on steep rock.', why: 'end' };
      if (foot >= 4 || multi >= 4) return { add: 'Raise the step-up box toward mid-thigh. It builds the high step vertical face climbing asks for.', why: foot >= 4 ? 'foot' : 'multi' };
    }
    if (sid === 'kpower') {
      if (crack >= 5) return { add: 'Cap the main set at 4 problems. Cracks are the priority, and this session only keeps your power topped up.', why: 'crack' };
      if (end >= 4 && ph !== 'peak') return { sid: 'k4x4', why: 'end' };
    }
    if (sid === 'kstrength') {
      if (crack >= 5) return { sid: 'crackhard', why: 'crack' };
      if (end >= 4 && fing < 4) return { sid: 'ksteep', why: 'end' };
      if (fing >= 4) return { add: 'This is the session that matters most for this area. Protect it: arrive rested and take the full rests.', why: 'fing' };
    }
    if (sid === 'sat' && ph !== 'peak') {
      if (crack >= 5) return { sid: 'cracklaps', why: 'crack' };
      if (end >= 4) return { force: 'endurance', why: 'end' };
      if (multi >= 4) return { sid: 'longday', why: 'multi' };
      if (foot >= 4) return { force: 'technique', why: 'foot' };
    }
    if (sid === 'cracks') {
      if (crack >= 4) return { add: 'Your key session for this area. Add one lap through your hardest size only.', why: 'crack' };
      if (crack < 3 && end >= 4) return { sid: 'pump2', why: 'end' };
    }
    return null;
  }
  function liftContent(sid, w, type) {
    var L = LIFT[sid];
    return { t: L.t, short: L.short, mins: 60, kind: 'lift', tags: sid === 'lift1' ? ['pow'] : [], focus: L.focus, rows: liftRows(sid, w, type), effort: LIFT_EFFORT[phKey(w)] };
  }
  function planWeek(mon) {
    var monS = ymd(mon), k = 'plan' + monS;
    if (cache[k]) return cache[k];
    var w = weekNo(mon), type = weekType(monS), order = ORDER[type], a = curArea(), spec = specificity(mon), ph = phKey(w), wd = S.weeks[monS] || { p: {} }, seenOut = false;
    var out = order.map(function (base, i) {
      var o = { i: i, d: DOW[i], date: ymd(addDays(mon, i)), w: w, base: base, sid: base, type: type, key: false, why: '', add: '', coach: (wd.p || {})[base] || null };
      var sw = a && spec.on && type !== 'out' ? areaSwap(a, base, ph) : null, force;
      if (sw) {
        if (sw.sid) { o.sid = sw.sid; o.swapped = true; }
        if (sw.force) force = sw.force;
        if (sw.add) o.add = sw.add;
        if (sw.why) o.why = (a.short || a.name) + ' rates ' + DIM_LABEL[sw.why].toLowerCase() + ' ' + dimScore(a, sw.why) + ' out of 5.';
      }
      if (LIFT[o.sid]) o.c = liftContent(o.sid, w, type);
      else if (o.sid === 'outside') { o.c = SESS.outside(w, seenOut); seenOut = true; }
      else o.c = SESS[o.sid](w, force);
      if (type === 'out' && base === 'lift3') o.add = 'Cut down for the trip: nothing that leaves your legs or forearms sore two days before you climb.';
      if (type === 'tue' && base === 'lift3') o.add = 'Easy pull-ups are cut to 2 sets, because limit bouldering was yesterday and power is tomorrow.';
      if (spec.taper && o.c.kind !== 'rest') o.add = (o.add ? o.add + ' ' : '') + 'Taper: half the volume, nothing to failure.';
      o.key = ['kpower', 'kstrength', 'sat'].indexOf(base) >= 0 || (sw && sw.why === 'crack' && base === 'cracks');
      return o;
    });
    return (cache[k] = out);
  }
  function todaySlot() { var t = today0(); return planWeek(monday(t))[(t.getDay() + 6) % 7]; }

  /* ---------- Sessions and stats ---------- */
  function allSessions() {
    if (cache.all) return cache.all;
    var out = [];
    Object.keys(S.weeks).forEach(function (m) { var s = S.weeks[m].s || {}; Object.keys(s).forEach(function (id) { out.push(Object.assign({ id: id }, s[id])); }); });
    out.sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : (a.id < b.id ? 1 : -1); });
    return (cache.all = out);
  }
  function sessionsOn(dateS) { return allSessions().filter(function (s) { return s.date === dateS; }); }
  function sKind(s) { return s.kind || kindOf(s.sid); }
  function lastEx(name, beforeDate, skipId) {
    var all = allSessions();
    for (var i = 0; i < all.length; i++) {
      var s = all[i];
      if (s.id === skipId || (beforeDate && s.date > beforeDate) || !s.ex) continue;
      for (var j = 0; j < s.ex.length; j++) if (s.ex[j].n === name && (s.ex[j].sets || []).some(function (v) { return v !== '' && v != null; })) return { e: s.ex[j], date: s.date };
    }
    return null;
  }
  function exLine(e) {
    var sets = (e.sets || []).filter(function (v) { return v !== '' && v != null; });
    var w = e.w !== '' && e.w != null ? (e.wl === 'lb added' ? '+' : '') + e.w + ' × ' : '';
    return w + sets.join(', ') + (e.rir !== '' && e.rir != null ? ' · ' + e.rir + ' in reserve' : '');
  }
  function probLine(p) { return p.n + (p.g ? ' ' + p.g : '') + (p.sent ? ' ✓' : '') + (p.tries ? ' (' + p.tries + (p.tries === 1 ? ' try' : ' tries') + ')' : ''); }
  function weekStats(monS) {
    var k = 'ws' + monS; if (cache[k]) return cache[k];
    var wd = S.weeks[monS] || { s: {}, c: {} }, ss = Object.keys(wd.s || {}).map(function (id) { return wd.s[id]; });
    var st = { lifts: 0, climbs: 0, load: 0, mins: 0, trav: 0, travMax: 0, top: {}, sends: 0, tries: 0 };
    var liftSeen = {};
    ss.forEach(function (s) {
      var kd = sKind(s);
      if (kd === 'lift') { if (s.sid === 'lift1' || s.sid === 'lift3') liftSeen[s.sid] = 1; }
      else if (kd !== 'other' && kd !== 'rest') st.climbs++;
      if (s.mins) st.mins += +s.mins;
      if (s.mins && s.rpe) st.load += s.mins * s.rpe;
      if (s.trav && s.trav.sets) s.trav.sets.forEach(function (x) { var m = num(x.m); if (m) { st.trav += m; st.travMax = Math.max(st.travMax, m); } });
      (s.ex || []).forEach(function (e) { var w = num(e.w); if (w != null && (e.sets || []).some(function (v) { return v !== '' && v != null; })) st.top[e.n] = Math.max(st.top[e.n] || 0, w); });
      (s.probs || []).forEach(function (p) { if (!p.warm) { st.tries += +p.tries || 0; if (p.sent) st.sends++; } });
    });
    st.lifts = Object.keys(liftSeen).length;
    var cs = Object.keys(wd.c || {}).map(function (d) { return wd.c[d]; });
    function col(f) { return cs.map(function (c) { return num(c[f]); }).filter(function (v) { return v != null; }); }
    st.sleep = avg(col('sleep')); st.energy = avg(col('energy')); st.sore = avg(col('sore'));
    var pains = col('pain'); st.pain = pains.length ? Math.max.apply(null, pains) : null;
    var bws = col('bw'); st.bw = bws.length ? bws[bws.length - 1] : null;
    return (cache[k] = st);
  }
  function blockWeeks() {
    if (!blockStart()) return [];
    var out = [];
    for (var w = 1; w <= 13; w++) { var m = weekMon(w); out.push({ w: w, mon: m, monS: ymd(m), ph: phaseOf(w), st: weekStats(ymd(m)) }); }
    return out;
  }
  function chartWeeks() {
    var bw = blockWeeks(); if (bw.length) return bw;
    var out = [], mon = monday(today0());
    for (var i = 7; i >= 0; i--) { var m = addDays(mon, -7 * i); out.push({ w: 0, mon: m, monS: ymd(m), ph: 'off', st: weekStats(ymd(m)) }); }
    return out;
  }
  function checkin(dateS) { var wd = S.weeks[monOf(dateS)]; return wd && wd.c ? wd.c[dateS] || null : null; }
  function last7(field, fn) {
    var t = today0(), v = [];
    for (var i = 0; i < 7; i++) { var c = checkin(ymd(addDays(t, -i))); if (c && num(c[field]) != null) v.push(num(c[field])); }
    return fn ? fn(v) : avg(v);
  }
  function coverage(a) {
    var from = ymd(addDays(today0(), -27)), recent = allSessions().filter(function (s) { return s.date >= from; });
    var target = { 5: 8, 4: 6, 3: 4 };
    return DIMS.map(function (d, i) {
      var need = target[a.s[i]]; if (!need) return null;
      return { l: d[1], got: recent.filter(function (s) { return (s.tags || []).indexOf(d[0]) >= 0; }).length, need: need };
    }).filter(Boolean);
  }
  function tickCounts(id) {
    var r = S.ticks[id] || {}, sent = 0, tried = 0;
    Object.keys(r).forEach(function (k) { if (r[k] === 's') sent++; else if (r[k] === 't') tried++; });
    return { sent: sent, tried: tried, total: DETAIL[id] ? DETAIL[id].routes.length : 0 };
  }
  function readiness(c) {
    if (!c) return null;
    if (num(c.pain) >= 4 || (num(c.energy) != null && num(c.energy) <= 2)) return { k: 'bad', t: 'Back off today', d: (num(c.pain) >= 4 ? 'Pain is 4 or more' + (c.where ? ' (' + c.where + ')' : '') + '.' : 'Energy is 2 or less.') + ' Rest, or keep it easy and skip anything that loads the sore area.' };
    if (num(c.pain) === 3) return { k: 'warn', t: 'Train with care', d: 'Pain at 3 is the most to train through. Skip moves that load it and stop if it climbs.' };
    return { k: 'good', t: 'Good to train', d: '' };
  }

  /* ---------- Sample data (never saved) ---------- */
  function makeSample() {
    var s = blank(), t = today0(), start = addDays(monday(t), -14);
    s.settings = { areaId: 'rrg', start: ymd(addDays(t, 30)), end: ymd(addDays(t, 33)), block: ymd(start), wt: {} };
    S = s; touch();
    var W = { 'Pull-up': 10, 'Seated dumbbell shoulder press': 35, 'High-box step-up': 25, 'Barbell row': 115, 'Cable external rotation': 10, 'Romanian deadlift': 45, 'Bench press': 125, 'Pendulum squat': 140, 'Rear delt fly': 10, 'Lateral raise': 12.5 };
    var names = ['Slow Burn', 'Paper Crane', 'Left Hook', 'Granite Kiss', 'Night Shift', 'Tall Order'], n = 0;
    for (var d = new Date(start); d < t; d = addDays(d, 1)) {
      var dS = ymd(d), mS = monOf(dS), wk = Math.floor(dayDiff(d, start) / 7), slot = planWeek(monday(d))[(d.getDay() + 6) % 7], wd = weekDoc(mS), c = slot.c;
      wd.c[dS] = { sleep: 6.5 + (n % 3) * 0.5, energy: 3 + (n % 3), sore: n % 3, pain: 0 };
      if (c.kind === 'rest') { n++; continue; }
      var x = { date: dS, sid: slot.sid, title: c.t, kind: c.kind, tags: c.tags, mins: c.mins - 10 + (n % 3) * 10, rpe: 5 + (n % 4), notes: '', areaId: 'rrg' };
      if (c.kind === 'lift') x.ex = c.rows.map(function (r) { return { n: r.n, wl: r.wl, target: r.target, w: W[r.n] != null ? W[r.n] + wk * 5 : '', sets: Array(r.sets).fill(Math.min(r.hi, r.lo + wk)), rir: 2 }; });
      if (c.kind === 'board') x.probs = [0, 1, 2, 3].map(function (i) { return { n: names[(n + i) % 6], g: 'V' + (3 + ((n + i) % 3)), tries: 2 + (i % 3), sent: (n + i) % 2 === 0 }; });
      if (c.kind === 'endur') { x.trav = { kind: 'endurance', sets: [{ m: 5 + wk, p: 3 }, { m: 5 + wk, p: 4 }, { m: 4 + wk, p: 4 }] }; x.laps = { rounds: 4, grade: 'V1' }; }
      if (c.kind === 'crack') x.cracks = { laps: 4 + wk, sizes: ['Hands', 'Off-fingers'] };
      wd.s['s' + n] = x; n++;
    }
    s.kilter.items = names.map(function (nm, i) { return { n: nm, g: 'V' + (3 + (i % 3)), list: 'Logged', status: i % 2 ? 'Projecting' : 'Sent', sessions: 2 }; });
    s.tests.rows = { pull: { w1: '12' }, pull3: { w1: '25' }, trav: { w1: '5' } };
    touch();
    return s;
  }
