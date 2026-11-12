  /* ---------- Drafts ---------- */
  function planParts(c, coach) {
    return (c.parts || []).map(function (p) { var x = ((coach || {}).parts || {})[p[0]] || {}; return [p[0], x.target || p[1], p[2], p[3]]; });
  }
  function newDraft(dateS, sid) {
    var d = parse(dateS), mon = monday(d), week = planWeek(mon), slot = week[(d.getDay() + 6) % 7], w = weekNo(d), c, coach = null, a = curArea();
    if (!sid || sid === 'today' || sid === slot.sid || sid === slot.base) {
      if (slot.c.kind === 'rest') { c = { t: 'Session', kind: 'other', tags: [], focus: '' }; sid = 'other'; }
      else { c = slot.c; sid = slot.sid; coach = slot.swapped ? null : slot.coach; }
    } else if (sid === 'other') c = { t: 'Session', kind: 'other', tags: [], focus: '' };
    else {
      c = LIFT[sid] ? liftContent(sid, w, weekType(ymd(mon))) : SESS[sid](w);
      var m = week.filter(function (s) { return s.base === sid && !s.swapped; })[0]; coach = m ? m.coach : null;
    }
    var D = { id: null, date: dateS, sid: sid, title: c.t, kind: c.kind, tags: c.tags || [], w: w, focus: c.focus, coachFocus: coach && coach.focus || '', mins: '', rpe: '', notes: '', t0: null, areaId: a ? a.id : null };
    if (c.kind === 'lift') D.ex = c.rows.map(function (r) {
      var x = ((coach || {}).ex || {})[r.n] || {}, last = lastEx(r.n, dateS), t = x.target || r.target, p = parseTarget(t);
      return { n: r.n, target: t, lo: p.lo || r.lo, hi: p.hi || r.hi, rest: r.rest, restSec: r.restSec, cue: r.cue, wl: r.wl, w: x.w != null ? x.w : last && last.e.w != null ? last.e.w : '', sets: Array(p.sets || r.sets).fill(''), rir: '', note: '', coach: x.coach || '', last: last };
    });
    if (c.kind === 'board') {
      D.probs = []; D.parts = planParts(c, coach);
      var main = c.parts.filter(function (p) { return p[3]; }).pop(); D.restSec = main ? main[3] : 180;
      D.sugg = S.kilter.items.filter(function (x) { return x.status !== 'Sent' && x.list !== 'Warm-up circuit'; }).slice(0, 14).map(function (x) { return { n: x.n, g: x.g }; });
    }
    if (c.kind === 'endur') {
      var tp = planParts(c, coach).filter(function (p) { return p[0] === 'Traverse' || p[0] === 'Mileage' || p[0] === 'Links'; })[0];
      D.laps = { rounds: '', grade: '', pump: '' }; D.trav = { kind: c.trav || 'endurance', sets: [{ m: '', p: '' }] }; D.travTarget = tp ? tp[1] : ''; D.restSec = tp ? tp[3] : 90;
    }
    if (c.kind === 'crack') D.cracks = { laps: 0, sizes: [], where: '' };
    if (c.kind === 'out') { D.routes = [{ n: '', g: '', style: '' }]; D.where = a ? a.name : ''; }
    return D;
  }
  function draftFromSession(s) {
    var D = JSON.parse(JSON.stringify(s)), w = weekNo(parse(s.date));
    D.kind = sKind(s); D.w = w; D.t0 = null; D.origMon = monOf(s.date);
    D.mins = s.mins != null ? s.mins : ''; D.rpe = s.rpe != null ? s.rpe : ''; D.notes = s.notes || ''; D.tags = s.tags || [];
    if (D.kind === 'lift') {
      var rows = {}; ['lift1', 'lift3'].forEach(function (k) { liftRows(k, w >= 1 && w <= 13 ? w : 1).forEach(function (r) { rows[r.n] = r; }); });
      D.ex = (D.ex || []).map(function (e) { var r = rows[e.n] || {}, p = parseTarget(e.target); return Object.assign({ lo: p.lo, hi: p.hi, restSec: r.restSec || 120, cue: r.cue || '', wl: e.wl != null ? e.wl : (r.wl != null ? r.wl : 'lb'), rir: '', note: '', w: '' }, e, { sets: (e.sets || []).map(function (v) { return v == null ? '' : v; }), last: lastEx(e.n, s.date, s.id) }); });
    }
    if (D.kind === 'board') { D.probs = D.probs || []; D.parts = []; D.sugg = []; D.restSec = 180; }
    if (D.kind === 'endur') { D.laps = Object.assign({ rounds: '', grade: '', pump: '' }, D.laps || {}); D.trav = D.trav || { kind: 'endurance', sets: [{ m: '', p: '' }] }; D.restSec = 90; }
    if (D.kind === 'crack') D.cracks = Object.assign({ laps: 0, sizes: [], where: '' }, D.cracks || {});
    if (D.kind === 'out') { D.routes = D.routes || [{ n: '', g: '', style: '' }]; D.where = D.where || ''; }
    return D;
  }
  function keepDraft() { try { if (ui.D) localStorage.setItem('approach-draft', JSON.stringify(ui.D)); else localStorage.removeItem('approach-draft'); } catch (e) { /* drafts are a convenience */ } }
  function setPath(o, path, v) { var p = path.split('.'); for (var i = 0; i < p.length - 1; i++) o = o[p[i]]; o[p[p.length - 1]] = v; }
  function saveDraft() {
    var D = ui.D, a = curArea();
    if (!D.date) D.date = ymd(today0());
    var mins = num(D.mins); if (mins == null && D.t0) mins = Math.max(1, Math.round((Date.now() - D.t0) / 60000));
    var x = { date: D.date, sid: D.sid, title: (D.title || 'Session').slice(0, 80), kind: D.kind, tags: D.tags, mins: mins, rpe: num(D.rpe), notes: String(D.notes || '').slice(0, 4000), areaId: D.areaId || null };
    if (D.kind === 'lift') x.ex = D.ex.filter(function (e) { return e.sets.some(function (v) { return v !== ''; }); }).map(function (e) { return { n: e.n, target: e.target || '', wl: e.wl || '', w: num(e.w), sets: e.sets.filter(function (v) { return v !== ''; }).map(Number), rir: e.rir === '' ? null : +e.rir, note: e.note || '' }; });
    if (D.kind === 'board') x.probs = D.probs.filter(function (p) { return p.n || p.tries; }).map(function (p) { return { n: p.n || 'Unnamed', g: p.g || '', tries: +p.tries || 0, sent: !!p.sent, note: p.note || '', warm: !!p.warm }; });
    if (D.kind === 'endur') { x.laps = D.laps; x.trav = { kind: D.trav.kind, sets: D.trav.sets.filter(function (s) { return s.m !== ''; }) }; }
    if (D.kind === 'crack') x.cracks = D.cracks;
    if (D.kind === 'out') { x.routes = D.routes.filter(function (r) { return r.n; }); x.where = D.where || ''; }
    var id = D.id || 's' + Date.now().toString(36), monS = monOf(D.date);
    if (D.origMon && D.origMon !== monS && S.weeks[D.origMon]) { delete S.weeks[D.origMon].s[id]; saveWeek(D.origMon); }
    weekDoc(monS).s[id] = x; saveWeek(monS);
    if (D.kind === 'board' && !D.id) {
      x.probs.forEach(function (p) {
        if (p.warm || !p.n || p.n === 'Unnamed') return;
        var it = S.kilter.items.filter(function (i) { return i.n.toLowerCase() === p.n.toLowerCase(); })[0];
        if (!it) { it = { n: p.n, g: p.g, list: 'Logged', status: 'Projecting', sessions: 0, first: fmt(D.date), notes: '' }; S.kilter.items.push(it); }
        it.sessions = (+it.sessions || 0) + 1; if (p.g && !it.g) it.g = p.g;
        if (p.sent) { it.status = 'Sent'; it.sent = it.sent || fmt(D.date); }
        if (p.note) it.notes = fmt(D.date) + ', ' + p.tries + (p.tries === 1 ? ' try' : ' tries') + ': ' + p.note + (it.notes ? '\n' + it.notes : '');
      });
      persist('kilter', S.kilter);
    }
    if (D.kind === 'out' && D.areaId && DETAIL[D.areaId]) {
      var r = Object.assign({}, S.ticks[D.areaId] || {}), keys = {}, changed = false;
      DETAIL[D.areaId].routes.forEach(function (q) { keys[slug(q[1])] = 1; });
      x.routes.forEach(function (q) { var k = slug(q.n); if (!keys[k]) return; var v = ['Onsight', 'Flash', 'Redpoint'].indexOf(q.style) >= 0 ? 's' : 't'; if (r[k] !== 's' && r[k] !== v) { r[k] = v; changed = true; } });
      if (changed) { S.ticks[D.areaId] = r; persist('ticks_' + D.areaId, { r: r }); }
    }
    ui.D = null; keepDraft(); ui.rest = null; drawRest();
    toast(D.id ? 'Changes saved' : 'Session saved');
    location.hash = '#log';
  }

  /* ---------- Rendering ---------- */
  function route() { var h = (location.hash || '#home').slice(1); return h || 'home'; }
  function render() {
    var r = route(), v = r.indexOf('area-') === 0 ? 'areas' : r;
    if (['home', 'plan', 'session', 'log', 'progress', 'areas', 'account'].indexOf(v) < 0) { v = 'home'; r = 'home'; }
    if (v === 'session' && !ui.D) {
      try { var raw = localStorage.getItem('approach-draft'); if (raw && mode !== 'loading') ui.D = JSON.parse(raw); } catch (e) { /* no draft */ }
      if (!ui.D && mode !== 'loading') { v = 'home'; r = 'home'; }
    }
    var a = r.indexOf('area-') === 0 ? AREA[r.slice(5)] : curArea();
    document.body.setAttribute('data-area', a ? a.id : '');
    var tab = v === 'session' ? 'log' : v;
    document.querySelectorAll('#tabs a').forEach(function (el) { if (el.dataset.v === tab) el.setAttribute('aria-current', 'page'); else el.removeAttribute('aria-current'); });
    var w = weekNo(today0()), ctx = document.getElementById('ctx');
    if (ctx) ctx.textContent = 'Data';
    app.innerHTML = r.indexOf('area-') === 0 ? viewArea(r.slice(5)) : v === 'areas' ? viewAreas() : v === 'plan' ? viewPlan() : v === 'session' ? viewSession() : v === 'log' ? viewLog() : v === 'progress' ? viewProgress() : v === 'account' ? viewAccount() : viewHome();
    saveMsg = '';
  }
  function renderKeep() { var y = window.scrollY; render(); window.scrollTo(0, y); }
  var toastT = null;
  function toast(msg) { var el = document.getElementById('toast'); if (!el) return; el.textContent = msg; el.hidden = false; clearTimeout(toastT); toastT = setTimeout(function () { el.hidden = true; }, 2400); }
  function drawRest() {
    var el = document.getElementById('rest'); if (!el) return;
    if (!ui.rest) { el.hidden = true; return; }
    var left = Math.max(0, Math.ceil((ui.rest.end - Date.now()) / 1000)), frac = Math.max(0, (ui.rest.end - Date.now()) / (ui.rest.total * 1000)), C = 2 * Math.PI * 16;
    el.hidden = false; el.classList.toggle('done', left === 0);
    el.innerHTML = '<svg viewBox="0 0 40 40" aria-hidden="true"><circle class="trk" cx="20" cy="20" r="16"/><circle class="arc" cx="20" cy="20" r="16" stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="' + (C * (1 - frac)).toFixed(1) + '"/></svg><span><b>' + (left ? Math.floor(left / 60) + ':' + pad(left % 60) : 'Go') + '</b><small>' + (left ? 'Rest. Tap to stop' : 'Rest is over') + '</small></span>';
    if (left === 0 && Date.now() - ui.rest.end > 6000) { ui.rest = null; el.hidden = true; }
  }
  setInterval(function () {
    if (ui.rest) drawRest();
    var c = document.getElementById('clock'); if (c && ui.D && ui.D.t0) c.textContent = timerLabel();
  }, 250);

  /* ---------- Events ---------- */
  window.addEventListener('hashchange', function () { ui.armed = null; if (route() !== 'plan') ui.openDay = null; ui.ciEdit = false; ui.ci = null; render(); window.scrollTo(0, 0); });
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-act]'); if (!el) return;
    var act = el.dataset.act, D = ui.D, i = +el.dataset.i, v = el.dataset.v, st = S.settings;
    switch (act) {
      case 'start-block': S.settings = Object.assign({ wt: {} }, st || {}, { block: ymd(monday(today0())) }); saveSettings(); render(); break;
      case 'sample-on': ui.sample = true; ui.real = S; makeSample(); render(); window.scrollTo(0, 0); break;
      case 'sample-off': ui.sample = false; S = ui.real || blank(); touch(); render(); break;
      case 'start': ui.D = newDraft(el.dataset.date || ymd(today0()), el.dataset.sid); keepDraft(); if (route() === 'session') { render(); window.scrollTo(0, 0); } else location.hash = '#session'; break;
      case 'edit': var s0 = allSessions().filter(function (s) { return s.id === el.dataset.id; })[0]; if (s0) { ui.D = draftFromSession(s0); keepDraft(); location.hash = '#session'; } break;
      case 'del':
        if (ui.armed === el.dataset.id) { var s1 = allSessions().filter(function (s) { return s.id === ui.armed; })[0]; ui.armed = null; if (s1) { var m = monOf(s1.date); delete S.weeks[m].s[s1.id]; saveWeek(m); toast('Session deleted'); } }
        else ui.armed = el.dataset.id;
        renderKeep(); break;
      case 'discard': ui.D = null; keepDraft(); ui.rest = null; drawRest(); break;
      case 'save': saveDraft(); break;
      case 'selweek': ui.planWeek = Math.min(13, Math.max(1, +el.dataset.w)); ui.openDay = null; renderKeep(); break;
      case 'goweek': ui.planWeek = +el.dataset.w; location.hash = '#plan'; break;
      case 'openday': ui.openDay = i; ui.planWeek = null; break;
      case 'wtype':
        var w = ui.planWeek || Math.min(13, Math.max(1, weekNo(today0()))), ms = ymd(weekMon(w));
        S.settings = Object.assign({}, st, { wt: Object.assign({}, st.wt || {}) }); if (v === 'normal') delete S.settings.wt[ms]; else S.settings.wt[ms] = v;
        saveSettings(); renderKeep(); break;
      case 'ci-edit': ui.ciEdit = true; ui.ci = null; renderKeep(); break;
      case 'ci-cancel': ui.ciEdit = false; ui.ci = null; renderKeep(); break;
      case 'ci-step': ui.ci.sleep = Math.max(0, Math.min(14, (+ui.ci.sleep || 0) + +v)); renderKeep(); break;
      case 'ci-set': ui.ci[el.dataset.f] = String(ui.ci[el.dataset.f]) === v ? '' : +v; renderKeep(); break;
      case 'ci-save':
        var c = ui.ci, dS = ymd(today0()), o = { sleep: num(c.sleep) }; ['energy', 'sore', 'pain', 'bw', 'hr'].forEach(function (k) { if (num(c[k]) != null) o[k] = num(c[k]); }); if (c.where && o.pain) o.where = c.where; if (c.note) o.note = c.note;
        weekDoc(monOf(dS)).c[dS] = o; saveWeek(monOf(dS)); ui.ci = null; ui.ciEdit = false; toast('Check-in saved'); renderKeep(); break;
      case 'rest': ui.rest = { end: Date.now() + +el.dataset.sec * 1000, total: +el.dataset.sec }; drawRest(); break;
      case 'rest-stop': ui.rest = null; drawRest(); break;
      case 'timer': if (D.t0) { D.mins = Math.max(1, Math.round((Date.now() - D.t0) / 60000)); D.t0 = null; } else D.t0 = Date.now(); keepDraft(); renderKeep(); break;
      case 'rpe': D.rpe = String(D.rpe) === v ? '' : +v; keepDraft(); renderKeep(); break;
      case 'addset': D.ex[i].sets.push(''); keepDraft(); renderKeep(); break;
      case 'fill': D.ex[i].sets = D.ex[i].sets.map(function (x) { return x === '' ? +v : x; }); keepDraft(); renderKeep(); break;
      case 'rir': D.ex[i].rir = String(D.ex[i].rir) === v ? '' : +v; keepDraft(); renderKeep(); break;
      case 'addex': D.ex.push({ n: 'New exercise', target: '', lo: 0, hi: 0, restSec: 90, cue: '', wl: 'lb', w: '', sets: ['', '', ''], rir: '', note: '', last: null, custom: true }); keepDraft(); renderKeep(); break;
      case 'tries': D.probs[i].tries = Math.max(0, (+D.probs[i].tries || 0) + +v); keepDraft(); renderKeep(); break;
      case 'sent': D.probs[i].sent = !D.probs[i].sent; if (D.probs[i].sent && !D.probs[i].tries) D.probs[i].tries = 1; keepDraft(); renderKeep(); break;
      case 'delprob': D.probs.splice(i, 1); keepDraft(); renderKeep(); break;
      case 'addprob': D.probs.push({ n: '', g: '', tries: 0, sent: false, note: '' }); keepDraft(); renderKeep(); var f = document.getElementById('p' + (D.probs.length - 1) + 'n'); if (f) f.focus(); break;
      case 'pick': D.probs.push({ n: el.dataset.n, g: el.dataset.g, tries: 1, sent: false, note: '' }); keepDraft(); renderKeep(); break;
      case 'travkind': D.trav.kind = v; keepDraft(); renderKeep(); break;
      case 'addtrav': D.trav.sets.push({ m: '', p: '' }); keepDraft(); renderKeep(); break;
      case 'delset': D.trav.sets.splice(i, 1); keepDraft(); renderKeep(); break;
      case 'claps': D.cracks.laps = Math.max(0, (+D.cracks.laps || 0) + +v); keepDraft(); renderKeep(); break;
      case 'csize': var k = D.cracks.sizes.indexOf(v); if (k >= 0) D.cracks.sizes.splice(k, 1); else D.cracks.sizes.push(v); keepDraft(); renderKeep(); break;
      case 'addroute': D.routes.push({ n: '', g: '', style: '' }); keepDraft(); renderKeep(); break;
      case 'delroute': D.routes.splice(i, 1); keepDraft(); renderKeep(); break;
      case 'rstyle': D.routes[i].style = D.routes[i].style === v ? '' : v; keepDraft(); renderKeep(); break;
      case 'logfilter': ui.logFilter = v; renderKeep(); break;
      case 'train': S.settings = Object.assign({ wt: {} }, st || {}, { areaId: el.dataset.id, start: '', end: '' }); if (!S.settings.block) S.settings.block = ymd(monday(today0())); saveSettings(); render(); break;
      case 'untrain': S.settings = Object.assign({}, st); delete S.settings.areaId; delete S.settings.start; delete S.settings.end; saveSettings(); render(); break;
      case 'tick': var id = el.dataset.id, r = Object.assign({}, S.ticks[id] || {}); if (r[el.dataset.key] === v) delete r[el.dataset.key]; else r[el.dataset.key] = v; S.ticks[id] = r; persist('ticks_' + id, { r: r }); renderKeep(); break;
      case 'tf': ui.tf[el.dataset.k] = v; renderKeep(); break;
      case 'signout': signOut(); break;
      case 'export':
        var blob = new Blob([JSON.stringify(allDocs(), null, 1)], { type: 'application/json' }), link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob); link.download = 'approach-backup-' + ymd(today0()) + '.json'; document.body.appendChild(link); link.click(); link.remove();
        ui.dataMsg = 'Backup downloaded.'; renderKeep(); break;
      case 'wipe':
        if (ui.armed === 'wipe') { ui.armed = null; var ids = Object.keys(allDocs()); S = blank(); touch(); ids.forEach(function (x) { persist(x, null); }); cacheLocal(); ui.dataMsg = 'Everything was erased.'; location.hash = '#home'; }
        else { ui.armed = 'wipe'; renderKeep(); }
        break;
    }
  });
  document.addEventListener('input', function (e) {
    var el = e.target;
    if (el.dataset.b && ui.D) { setPath(ui.D, el.dataset.b, el.value); keepDraft(); }
    else if (el.dataset.ci && ui.ci) ui.ci[el.dataset.ci] = el.value;
  });
  document.addEventListener('change', function (e) {
    var el = e.target;
    if (el.id === 'imp' && el.files && el.files[0]) {
      var fr = new FileReader();
      fr.onload = function () { try { var n = importDocs(JSON.parse(fr.result)); ui.dataMsg = n ? 'Imported ' + n + ' items. Your history is in the Log and Progress tabs.' : 'That file has nothing this app can read.'; } catch (err) { ui.dataMsg = 'That file could not be read. Choose a .json backup or history file.'; } render(); };
      fr.readAsText(el.files[0]); return;
    }
    if (el.dataset.check) {
      var id = el.dataset.check, c = Object.assign({}, S.checks[id] || {}); if (el.checked) c[el.dataset.i] = true; else delete c[el.dataset.i];
      S.checks[id] = c; persist('checks_' + id, { c: c }); renderKeep();
    } else if (el.dataset.trip && S.settings) {
      var s = document.getElementById('t-start').value, en = document.getElementById('t-end').value; if (s && en && en < s) en = s; if (s && !en) en = s;
      S.settings = Object.assign({}, S.settings, { start: s, end: en }); saveSettings(); renderKeep();
    } else if (el.dataset.test) {
      var p = el.dataset.test.split('.'), rows = S.tests.rows; rows[p[0]] = Object.assign({}, rows[p[0]] || {}); if (el.value) rows[p[0]][p[1]] = el.value; else delete rows[p[0]][p[1]];
      persist('tests', S.tests);
    } else if (el.dataset.b === 'date' && ui.D) { ui.D.w = weekNo(parse(el.value || ymd(today0()))); renderKeep(); }
    else if (el.dataset.b && ui.D && /sets\.\d+$|\.w$|\.m$/.test(el.dataset.b)) { var a = document.activeElement && document.activeElement.id; renderKeep(); if (a) { var n = document.getElementById(a); if (n) n.focus(); } }
  });
  document.addEventListener('submit', function (e) {
    if (e.target.id !== 'authform') return; e.preventDefault();
    signIn(document.getElementById('a-email').value.trim(), document.getElementById('a-pw').value, e.submitter && e.submitter.dataset.mode === 'up');
  });
  document.addEventListener('toggle', function (e) { var el = e.target; if (el.dataset && el.dataset.day != null && el.open) ui.openDay = +el.dataset.day; }, true);

  /* Tooltip for chart marks */
  var tipEl = document.getElementById('tip');
  function showTip(el) {
    if (!tipEl) return; tipEl.textContent = el.dataset.tip; tipEl.hidden = false;
    var r = el.getBoundingClientRect(), tw = tipEl.offsetWidth, th = tipEl.offsetHeight, x = Math.min(window.innerWidth - tw - 8, Math.max(8, r.left + r.width / 2 - tw / 2)), y = r.top - th - 8;
    if (y < 8) y = r.bottom + 8;
    tipEl.style.left = x + 'px'; tipEl.style.top = y + 'px';
  }
  document.addEventListener('pointerover', function (e) { var el = e.target.closest && e.target.closest('[data-tip]'); if (el) showTip(el); else if (tipEl) tipEl.hidden = true; });
  document.addEventListener('focusin', function (e) { var el = e.target.closest && e.target.closest('[data-tip]'); if (el) showTip(el); });
  document.addEventListener('focusout', function () { if (tipEl) tipEl.hidden = true; });
  window.addEventListener('scroll', function () { if (tipEl) tipEl.hidden = true; }, { passive: true });

  init();
