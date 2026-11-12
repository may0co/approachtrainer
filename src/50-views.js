
  /* ---------- View pieces ---------- */
  function val(x) { return x == null ? '' : esc(x); }
  function coachBox(label, text) { return text ? '<div class="coach"><span class="mono">' + esc(label) + '</span><p>' + esc(text) + '</p></div>' : ''; }
  function repHigh(t) { var m = /×\s*(\d+)(?:–(\d+))?/.exec(t || ''); return m ? Number(m[2] || m[1]) : null; }
  function exSummary(e) { var sets = (e.sets || []).filter(function (x) { return x != null; }); return (e.w != null ? fmtN(e.w) + ' × ' : '') + sets.join(', ') + (e.rir != null ? ' · RIR ' + e.rir : ''); }
  function areaRoutes(id) { return DETAIL[id] ? DETAIL[id].routes : []; }

  function liftRows(dp, kind, id, log, ov) {
    var tmpl = {}; if (LIFT[kind] && dp.w >= 1 && dp.w <= 13) exercises(kind, dp).forEach(function (e) { tmpl[e.n] = e; });
    var h = LIFT[kind] && phaseOf(dp.w) ? '<p class="small muted">' + EFFORT[phaseOf(dp.w).k] + '</p>' : '';
    (log.ex || []).forEach(function (e, i) {
      var t = tmpl[e.n] || {}, o = (ov.ex || {})[e.n] || {}, last = lastEx(e.n, dp.date), high = repHigh(e.t), sets = e.sets || [];
      var ready = high != null && sets.length > 0 && sets.every(function (x) { return x != null && x >= high; });
      var p = id + '|ex.' + i, eid = 'x-' + kind + '-' + i;
      h += '<div class="ex"><div class="ex-top"><b>' + esc(e.n) + '</b><span>' + esc(e.t || '') + (t.rest ? ' · ' + esc(t.rest) : '') + '</span></div>';
      if (t.note) h += '<p class="small muted">' + esc(t.note) + '</p>';
      if (o.coach && !log.done) h += coachBox('Coach', o.coach); else if (t.cue && !log.done) h += '<p class="last">' + esc(t.cue) + '</p>';
      if (last) h += '<p class="last">Last time, ' + fmtMD(last.date) + ': <b>' + esc(exSummary(last.e)) + '</b></p>';
      h += '<div class="ex-in">' + (t.unit || e.w != null || !LIFT[kind] ? '<label class="f" for="' + eid + '-w">' + esc(t.unit || 'lb') + '<input type="number" id="' + eid + '-w" data-b="' + p + '.w" data-t="n" step="0.5" min="0" inputmode="decimal" value="' + val(e.w) + '"></label>' : '<span class="bw">Body weight</span>') +
        '<div class="stack tight"><span class="xs muted">' + (/plank|hold/i.test(e.n) ? 'Seconds per set' : 'Reps per set') + '</span><div class="sets">' + sets.map(function (r, j) { return '<input type="number" id="' + eid + '-s' + j + '" aria-label="' + esc(e.n) + ', set ' + (j + 1) + '" data-b="' + p + '.sets.' + j + '" data-t="n" min="0" inputmode="numeric" value="' + val(r) + '">'; }).join('') + '</div></div>' +
        '<label class="f" for="' + eid + '-r">RIR<input type="number" id="' + eid + '-r" data-b="' + p + '.rir" data-t="n" min="0" max="10" inputmode="numeric" value="' + val(e.rir) + '"></label></div>';
      h += '<div class="row between">' + (log.done ? '<span></span>' : chips(t.rest, e.n) || '<span></span>') + (ready ? '<span class="pill good">Top of the range: ready to go up</span>' : '') + '</div>';
      h += '<details class="more"' + (e.note ? ' open' : '') + '><summary>Note</summary><textarea id="' + eid + '-n" rows="2" aria-label="Note for ' + esc(e.n) + '" data-b="' + p + '.note">' + val(e.note) + '</textarea></details></div>';
    });
    return h;
  }
  function probRows(dp, kind, id, log, ov) {
    var routes = kind === 'outside', probs = log.probs || [], tries = 0, sent = 0, have = {};
    probs.forEach(function (p) { tries += p.t || 0; if (p.s) sent++; have[slug(p.n || '')] = 1; });
    var h = '<div class="row between"><h4>' + (routes ? 'Routes' : 'Problems') + '</h4><span class="mono muted">' + probs.length + (routes ? ' routes' : ' problems') + ' · ' + tries + ' tries · ' + sent + ' sent</span></div>';
    var sugg = (ov.probs || []).map(function (x) { return x.split('|'); }), names = [];
    if (routes) {
      var aid = log.areaId, st = ((doc('ticks_' + aid) || {}).star) || {};
      areaRoutes(aid).forEach(function (r) { names.push(r[1]); if (st[slug(r[1])]) sugg.push([r[1], r[0]]); });
    } else {
      kilter().forEach(function (k) { names.push(k.d.n); });
      if (!sugg.length) kilter().forEach(function (k) { var pw = /^Power/.test(k.d.list || ''), stl = /^(Strength|Retest)/.test(k.d.list || ''); if (k.d.status !== 'sent' && !k.d.drop && (kind === 'kpower' ? pw : stl)) sugg.push([k.d.n, k.d.g]); });
    }
    sugg = sugg.filter(function (x) { return !have[slug(x[0])]; }).slice(0, 6);
    if (sugg.length && !log.done) h += '<div class="chips">' + sugg.map(function (x) { return '<button type="button" class="tchip add" data-act="addprob" data-id="' + id + '" data-n="' + esc(x[0]) + '" data-g="' + esc(x[1] || '') + '">' + esc(x[0]) + (x[1] ? ' ' + esc(x[1]) : '') + '</button>'; }).join('') + '</div>';
    h += '<datalist id="dl-' + kind + '">' + names.map(function (n) { return '<option value="' + esc(n) + '"></option>'; }).join('') + '</datalist>';
    probs.forEach(function (p, i) {
      var b = id + '|probs.' + i, pid = 'p-' + kind + '-' + i;
      h += '<div class="prow' + (p.s ? ' sent' : '') + '"><input type="text" id="' + pid + '-n" list="dl-' + kind + '" aria-label="Name" placeholder="' + (routes ? 'Route' : 'Problem') + '" data-b="' + b + '.n" data-fill="' + (routes ? 'route' : 'kilter') + '" value="' + val(p.n) + '">' +
        '<input type="text" id="' + pid + '-g" aria-label="Grade" placeholder="' + (routes ? '5.10' : 'V4') + '" data-b="' + b + '.g" value="' + val(p.g) + '">' +
        '<input type="number" id="' + pid + '-t" aria-label="Tries" placeholder="Tries" min="0" inputmode="numeric" data-b="' + b + '.t" data-t="n" value="' + val(p.t) + '">' +
        '<label class="row" style="gap:.3rem;flex-wrap:nowrap" for="' + pid + '-s"><input type="checkbox" id="' + pid + '-s" data-b="' + b + '.s"' + (p.s ? ' checked' : '') + '><span class="xs">Sent</span></label>' +
        '<button type="button" class="x" data-act="delrow" data-id="' + id + '" data-path="probs" data-i="' + i + '" aria-label="Remove ' + esc(p.n || 'row') + '">×</button></div>';
    });
    h += '<div><button type="button" class="btn quiet sm" data-act="addprob" data-id="' + id + '" data-n="" data-g="">Add a ' + (routes ? 'route' : 'problem') + '</button></div>';
    return h;
  }
  function satRows(dp, id, log) {
    var sets = log.sets || [], tot = 0; sets.forEach(function (s) { tot += (s && s.m) || 0; });
    var h = '<div class="fgrid"><label class="f" for="sat-laps">Boulder lap rounds<input type="number" id="sat-laps" min="0" inputmode="numeric" data-b="' + id + '|laps" data-t="n" value="' + val(log.laps) + '"></label>' +
      '<label class="f" for="sat-lapg">Lap grades<input type="text" id="sat-lapg" placeholder="V0–V2" data-b="' + id + '|lapg" value="' + val(log.lapg) + '"></label></div>';
    h += '<div class="row between"><h4>Traverse sets</h4><span class="mono muted">' + fmtN(tot) + ' min on the wall</span></div>';
    sets.forEach(function (s, i) {
      h += '<div class="srow"><span>Set ' + (i + 1) + '</span><input type="number" id="sat-m' + i + '" aria-label="Set ' + (i + 1) + ' minutes" placeholder="Minutes" step="0.25" min="0" inputmode="decimal" data-b="' + id + '|sets.' + i + '.m" data-t="n" value="' + val(s.m) + '">' +
        '<input type="number" id="sat-p' + i + '" aria-label="Set ' + (i + 1) + ' pump, 1 to 10" placeholder="Pump 1–10" min="1" max="10" inputmode="numeric" data-b="' + id + '|sets.' + i + '.p" data-t="n" value="' + val(s.p) + '">' +
        '<button type="button" class="x" data-act="delrow" data-id="' + id + '" data-path="sets" data-i="' + i + '" aria-label="Remove set ' + (i + 1) + '">×</button></div>';
    });
    h += '<div><button type="button" class="btn quiet sm" data-act="addset" data-id="' + id + '">Add a set</button></div>';
    if (dp.w === 1 || (phaseOf(dp.w) && /deload|test/.test(phaseOf(dp.w).k)) || log.tl != null || log.tr != null) {
      h += '<div class="fgrid"><label class="f" for="sat-tl">Tindeq max, left<input type="number" id="sat-tl" step="0.1" min="0" inputmode="decimal" data-b="' + id + '|tl" data-t="n" value="' + val(log.tl) + '"></label><label class="f" for="sat-tr">Tindeq max, right<input type="number" id="sat-tr" step="0.1" min="0" inputmode="decimal" data-b="' + id + '|tr" data-t="n" value="' + val(log.tr) + '"></label></div>';
    }
    return h;
  }
  function crackRows(id, log) {
    return '<div class="fgrid"><label class="f" for="cr-laps">Laps<input type="number" id="cr-laps" min="0" inputmode="numeric" data-b="' + id + '|laps" data-t="n" value="' + val(log.laps) + '"></label>' +
      '<label class="f" for="cr-where">Where<input type="text" id="cr-where" data-b="' + id + '|where" value="' + val(log.where) + '"></label>' +
      '<label class="f" for="cr-sizes">Sizes<input type="text" id="cr-sizes" placeholder=".5 to 3" data-b="' + id + '|sizes" value="' + val(log.sizes) + '"></label></div>';
  }
  function logger(dp, kind, log, ov) {
    if (kind === 'rest' || kind === 'travel') return '';
    var id = sid(dp.date, kind), h = '<div class="logger">';
    h += '<div class="row between"><h3>Log</h3><span class="mono muted">' + (log.done ? 'Logged' : 'Saves as you type') + '</span></div>';
    if (log.ex) h += liftRows(dp, kind, id, log, ov);
    else if (kind === 'kpower' || kind === 'kstrength' || kind === 'outside') h += probRows(dp, kind, id, log, ov);
    else if (kind === 'sat') h += satRows(dp, id, log);
    else if (kind === 'cracks') h += crackRows(id, log);
    var ld = load(log);
    h += '<div class="fgrid"><label class="f" for="lg-rpe-' + kind + '">Effort, RPE 1–10<input type="number" id="lg-rpe-' + kind + '" min="1" max="10" step="0.5" inputmode="decimal" data-b="' + id + '|rpe" data-t="n" value="' + val(log.rpe) + '"></label>' +
      '<label class="f" for="lg-min-' + kind + '">Minutes<input type="number" id="lg-min-' + kind + '" min="0" max="600" inputmode="numeric" data-b="' + id + '|mins" data-t="n" value="' + val(log.mins) + '"></label>' +
      '<div class="f"><span>Training load</span><span class="count" style="font-size:2rem;padding-top:.2rem">' + (ld == null ? '–' : fmtN(ld)) + '</span></div></div>';
    h += '<label class="f" for="lg-notes-' + kind + '">Notes<textarea id="lg-notes-' + kind + '" rows="3" placeholder="What happened, what to change next time" data-b="' + id + '|notes">' + val(log.notes) + '</textarea></label>';
    h += log.done ? '<div class="donebar"><span class="pill good">Logged</span><button type="button" class="link" data-act="undone" data-id="' + id + '">Mark as not done</button><button type="button" class="link' + (ui.armed === id ? ' armed' : '') + '" data-act="delsess" data-id="' + id + '">' + (ui.armed === id ? 'Tap again to delete this log' : 'Delete this log') + '</button></div>'
      : '<div class="donebar"><button type="button" class="btn big" data-act="done" data-id="' + id + '">Save session</button><span class="small muted">Marks it done and counts it in Progress.</span></div>';
    return h + '</div>';
  }
  function sessionBlock(dp, kind, planned) {
    var K = KIND[kind] || KIND.other, id = sid(dp.date, kind), log = sessionFor(dp, kind), ov = (planned && doc('p_' + dp.date)) || {};
    var ovp = ov.parts || {}, a = targetArea(), td = todayS(), title = planned ? kindTitle(dp) : (log.title || K.t), pills = '';
    if (log.done) pills += '<span class="pill good">Logged</span>'; else if (K.key && planned) pills += '<span class="pill solid">Key session</span>';
    if (planned && dp.cut) pills += '<span class="pill dash">Cut down for the trip</span>';
    if (planned && phaseOf(dp.w).k === 'deload') pills += '<span class="pill">Deload</span>';
    var h = '<section class="card sess' + (planned && K.key && !log.done && dp.date === td ? ' key' : '') + '">';
    h += '<div class="sess-head"><div class="stack tight"><span class="mono muted">' + fmtD(dp.date) + (K.mins ? ' · ' + K.mins : '') + '</span><h3>' + esc(title) + '</h3></div><div class="row" style="justify-content:flex-end">' + pills + '</div></div>';
    if (K.focus) h += '<p class="ink2">' + esc(K.focus) + '</p>';
    if (ov.focus) h += coachBox('This week', ov.focus);
    var af = planned && dp.date >= td ? areaFocus(kind, a) : '';
    if (af) h += '<div class="msg"><span class="mono">Area focus · ' + esc(a.name) + '</span><p>' + esc(af) + '</p></div>';
    var P = planned ? parts(kind, dp) : [];
    if (P.length) h += '<div class="parts">' + P.map(function (pt) {
      var o = ovp[pt.k] || {}, on = !!(log.parts && log.parts[pt.k]), pid = 'pt-' + kind + '-' + pt.k;
      return '<div class="part' + (on ? ' on' : '') + '"><input type="checkbox" id="' + pid + '" data-b="' + id + '|parts.' + pt.k + '"' + (on ? ' checked' : '') + '><h4><label for="' + pid + '">' + esc(pt.t) + '</label>' + (pt.rest ? '<span>' + esc(pt.rest) + '</span>' : '') + '</h4>' +
        '<div class="t">' + esc(o.target || pt.target) + coachBox('Coach', o.coach) + (dp.date === td ? chips(pt.rest, pt.t) : '') + '</div></div>';
    }).join('') + '</div>';
    return h + logger(dp, kind, log, ov) + '</section>';
  }
  function dayBlocks(date) {
    var dp = dayPlan(date), h = '', shown = {};
    if (dp) { h += sessionBlock(dp, dp.kind, true); shown[dp.kind] = 1; }
    sessionsOn(date).forEach(function (s) { if (shown[s.d.kind]) return; h += sessionBlock(dp || { date: date, w: weekNo(date), kind: s.d.kind }, s.d.kind, false); });
    return h;
  }
  function segNum(id, path, cur, from, to, label) {
    var h = '<div class="seg" role="group" aria-label="' + label + '">';
    for (var i = from; i <= to; i++) h += '<button type="button" data-act="setv" data-b="' + id + '|' + path + '" data-v="' + i + '" aria-pressed="' + (cur === i) + '">' + i + '</button>';
    return h + '</div>';
  }
  function checkinCard(date) {
    var id = 'c_' + date, c = doc(id) || {}, warn = (c.pain != null && c.pain >= 4) || (c.energy != null && c.energy <= 2);
    var h = '<section class="card"><div class="row between"><h3>Check-in</h3><span class="mono muted">' + fmtD(date) + '</span></div>';
    h += '<div class="fgrid"><label class="f" for="ci-sleep">Sleep, hours<input type="number" id="ci-sleep" step="0.5" min="0" max="14" inputmode="decimal" data-b="' + id + '|sleep" data-t="n" value="' + val(c.sleep) + '"></label>' +
      '<label class="f" for="ci-pain">Pain, 0–10<input type="number" id="ci-pain" min="0" max="10" inputmode="numeric" data-b="' + id + '|pain" data-t="n" value="' + val(c.pain) + '"></label></div>';
    h += '<div class="stack tight"><span class="xs muted">Energy, 1–5</span>' + segNum(id, 'energy', c.energy, 1, 5, 'Energy') + '</div>';
    h += '<div class="stack tight"><span class="xs muted">Soreness, 0–5</span>' + segNum(id, 'sore', c.sore, 0, 5, 'Soreness') + '</div>';
    if (c.pain) h += '<label class="f" for="ci-where">Where is the pain?<input type="text" id="ci-where" placeholder="Finger, elbow, wrist or shoulder" data-b="' + id + '|where" value="' + val(c.where) + '"></label>';
    h += '<label class="f" for="ci-note">Note<input type="text" id="ci-note" data-b="' + id + '|note" value="' + val(c.note) + '"></label>';
    if (warn) h += '<p class="msg warn">Readiness rule: pain at 4 or more, or energy at 2 or less, means rest or an easy day. Sunday’s cracks are the first session to drop.</p>';
    return h + '</section>';
  }
  function weekline(w) {
    var td = todayS();
    return '<nav class="weekline" aria-label="This week">' + weekPlan(w).map(function (dp) {
      var cat = KIND[dp.kind].cat, isDone = sessionsOn(dp.date).some(function (s) { return s.d.done; });
      var cls = dp.date === td ? ' today' : '';
      if (isDone) cls += ' done'; else if (cat === 'rest') cls += ' rest'; else if (dp.date < td) cls += ' skip';
      return '<a class="wl' + cls + '" href="#day-' + dp.date + '" aria-label="' + fmtD(dp.date) + ', ' + esc(kindTitle(dp)) + (isDone ? ', logged' : '') + '"><i></i><b>' + DOW[dp.i] + '</b><span>' + esc(dp.kind === 'outside' ? 'Outside' : KIND[dp.kind].s) + '</span></a>';
    }).join('') + '</nav>';
  }
  function weekPills(w) {
    var wp = weekPlan(w), h = '';
    if (wp[0].akron) h += '<span class="pill">Akron week</span>';
    if (wp[0].shape) h += '<span class="pill solid">' + esc(wp[0].shape) + '</span>';
    return h;
  }
  function gapLine(a) {
    var cov = coverage(a).filter(function (c) { return c.score >= 3; }).sort(function (x, y) { return x.ratio - y.ratio; });
    if (!cov.length) return '';
    var g = cov[0];
    return g.ratio >= 1 ? 'Every quality ' + esc(a.short || a.name) + ' asks for has been trained as often as its rating calls for.' : 'Biggest gap: ' + g.l.toLowerCase() + ', ' + g.got + ' of ' + g.need + ' sessions in the last 4 weeks.';
  }
  function areaCard(a) {
    var cur = targetArea(), active = cur && cur.id === a.id, any = done().length > 0;
    return '<a class="card acard" href="#area-' + a.id + '"><div class="row between"><span class="mono muted">' + esc(a.st) + ' · ' + esc(a.rock) + '</span>' + (active ? '<span class="pill solid">Training for</span>' : any ? '<span class="pill">' + fit(a) + '% fit</span>' : '') + '</div>' +
      '<h3>' + esc(a.name) + '</h3><p class="small muted">' + esc(a.style) + '</p><div class="demand">' + topDims(a, 3).map(function (d) {
        var p = ''; for (var k = 1; k <= 5; k++) p += '<i' + (k <= d.v ? ' class="on"' : '') + '></i>';
        return '<span>' + esc(d.l) + '</span><span class="pips" role="img" aria-label="' + d.v + ' out of 5">' + p + '</span>';
      }).join('') + '</div>' + (DETAIL[a.id] ? '<div><span class="pill dash">Tick list + trip plan</span></div>' : '') + '</a>';
  }
  function onboarding() {
    var mon = ymd(addDays(today0(), -((today0().getDay() + 6) % 7)));
    return '<div class="view"><section class="hero"><span class="mono">Approach</span><h1>Train for where you’re going</h1>' +
      '<p class="muted">A 13-week climbing block you can log in under a minute a day, tuned to the rock on your next trip, with the tick list and trip prep in the same place.</p></section>' +
      '<section class="card key"><h3>Start a block</h3><p class="small muted">Thirteen weeks: build, strength and power endurance, with two easy weeks and a test week. Four climbing days, two lifts and a rest day each week.</p>' +
      '<div class="fgrid"><label class="f" for="ob-start">First Monday<input type="date" id="ob-start" value="' + mon + '"></label></div><div><button type="button" class="btn big" data-act="startblock">Start the block</button></div></section>' +
      '<section class="stack"><div class="sec-head"><h2>Pick a trip</h2><a href="#trips">All ' + AREAS.length + ' areas</a></div><div class="grid2">' + ['rrg', 'nrg', 'ic'].map(function (id) { return areaCard(AREA[id]); }).join('') + '</div></section></div>';
  }

  /* ---------- Views ---------- */
  function viewHome() {
    if (mode === 'loading') return '<div class="view"><section class="hero"><span class="mono">Approach</span><h1>Loading your training</h1><p class="muted">One moment.</p></section></div>';
    if (!blockStart()) return onboarding();
    var td = todayS(), w = weekNo(td);
    if (w < 1 || w > 13) {
      return '<div class="view"><section class="hero"><span class="mono">' + fmtD(td) + '</span><h1>' + (w < 1 ? 'Block starts ' + fmtMD(blockStart()) : 'Block finished') + '</h1><p class="muted">' + (w < 1 ? 'Your first session is on ' + fmtD(blockStart()) + '.' : 'All 13 weeks are behind you. Your numbers are in Progress.') + '</p><div class="row"><a class="btn" href="#plan">See the block</a><a class="btn quiet" href="#progress">Progress</a></div></section>' + dayBlocks(td) + checkinCard(td) + '</div>';
    }
    var dp = dayPlan(td), ph = phaseOf(w), ws = weekStats(w), a = targetArea(), trip = targetTrip(), K = KIND[dp.kind];
    var count = '';
    if (trip) { var dd = daysBetween(td, trip.d.start); count = dd > 0 ? '<div class="count-wrap"><div class="count">' + dd + '<small> day' + (dd === 1 ? '' : 's') + '</small></div><span class="mono muted">to ' + esc(a.short || a.name) + '</span></div>' : '<div class="count-wrap"><div class="count">On<small> the trip</small></div></div>'; }
    var h = '<div class="view"><section class="hero"><div class="kicker"><span class="mono">' + fmtD(td) + ' · Week ' + w + ' of 13 · ' + ph.name + '</span>' + weekPills(w) + '</div>' +
      '<div class="hero-row"><div class="stack tight"><h1>' + esc(kindTitle(dp)) + '</h1><p class="muted">' + (K.cat === 'rest' ? 'Nothing to train today.' : 'Today’s session' + (K.mins ? ', about ' + K.mins : '') + '.') + '</p></div>' + count + '</div>' + weekline(w) + '</section>';
    if (saveErr) h += '<p class="msg bad" role="status">' + esc(saveErr) + '</p>';
    if (mode === 'memory') h += '<p class="msg warn" role="status">Changes aren’t saved in this view. Open the page in Claude while signed in to keep your log.</p>';
    h += '<div class="cols"><div class="stack loose">' + dayBlocks(td) + '</div><div class="stack loose">' + checkinCard(td);
    h += '<section class="stack"><div class="sec-head"><h2>This week</h2><a href="#progress">Progress</a></div><div class="tiles"><div class="tile"><b class="num">' + ws.lifts + '<small>/2</small></b><span>lifts done</span></div><div class="tile"><b class="num">' + ws.climbs + '<small>/4</small></b><span>climbs done</span></div><div class="tile"><b class="num">' + (ws.hasLoad ? fmtN(ws.load) : '–') + '</b><span>training load</span></div></div></section>';
    if (a) {
      h += '<section class="card"><div class="row between"><h3>Training for ' + esc(a.short || a.name) + '</h3><a href="#area-' + a.id + '">Trip plan</a></div><p class="small ink2">' + gapLine(a) + '</p>' +
        coverage(a).filter(function (c) { return c.score >= 3; }).map(function (c) { return '<div class="meter"><span>' + esc(c.l) + '</span><div class="track"><i style="width:' + Math.round(c.ratio * 100) + '%"></i></div><span class="v">' + c.got + ' / ' + c.need + '</span></div>'; }).join('') + '</section>';
    } else {
      h += '<section class="card flat"><h3>Pick a trip to train for</h3><p class="small muted">Choose an area and each session gains an area focus, with a countdown once you add dates.</p><div class="row">' + ['rrg', 'nrg', 'ic'].map(function (id) { return '<a class="btn quiet sm" href="#area-' + id + '">' + esc(AREA[id].name) + '</a>'; }).join('') + '<a class="btn ghost sm" href="#trips">All areas</a></div></section>';
    }
    var tm2 = dayPlan(addS(td, 1));
    if (tm2) h += '<section class="stack"><div class="sec-head"><h2>Tomorrow</h2></div><div class="card" style="padding:.3rem .8rem"><a class="dayrow" href="#day-' + tm2.date + '"><span class="d">' + DOW[tm2.i] + '<span>' + fmtMD(tm2.date) + '</span></span><span class="m"><b>' + esc(kindTitle(tm2)) + '</b><span>' + esc(KIND[tm2.kind].focus) + '</span></span></a></div></section>';
    return h + '</div></div></div>';
  }

  function viewDay(date) {
    var dp = dayPlan(date), w = weekNo(date), td = todayS();
    var h = '<div class="view"><section class="hero"><a class="small" href="#plan" data-act="week" data-w="' + Math.max(1, Math.min(13, w)) + '">Back to the plan</a><span class="mono">' + (dp ? 'Week ' + w + ' of 13 · ' + phaseOf(w).name : 'Outside the block') + (date === td ? ' · Today' : '') + '</span>' +
      '<h1>' + DAYL[parse(date).getDay()] + '</h1><p class="muted">' + MON[parse(date).getMonth()] + ' ' + parse(date).getDate() + ', ' + parse(date).getFullYear() + '</p>' +
      '<div class="daynav"><a href="#day-' + addS(date, -1) + '">← ' + fmtD(addS(date, -1)) + '</a><a href="#day-' + addS(date, 1) + '">' + fmtD(addS(date, 1)) + ' →</a></div></section>';
    var blocks = dayBlocks(date);
    h += '<div class="cols"><div class="stack loose">' + (blocks || '<p class="muted">Nothing planned or logged on this day.</p>') + '</div><div class="stack loose">' + checkinCard(date) + '</div></div>';
    return h + '</div>';
  }

  function dayStatus(dp) {
    var ss = sessionsOn(dp.date).filter(function (s) { return s.d.done; }), K = KIND[dp.kind];
    if (ss.length) { var d = ss[0].d, bits = ['Logged']; if (d.kind !== dp.kind) bits.push((KIND[d.kind] || KIND.other).s); if (d.rpe != null) bits.push('RPE ' + d.rpe); if (d.mins) bits.push(d.mins + ' min');
      var sent = (d.probs || []).filter(function (p) { return p.s; }).length; if (d.probs && d.probs.length) bits.push(sent + ' of ' + d.probs.length + ' sent'); return bits.join(' · '); }
    var ov = doc('p_' + dp.date);
    if (LIFT[dp.kind]) { var e = exercises(dp.kind, dp)[0], o = ov && ov.ex && ov.ex[e.n]; return e.n + ' ' + e.t + (o && o.w != null ? ' at ' + fmtN(o.w) + ' lb' : ''); }
    var P = parts(dp.kind, dp).filter(function (p) { return p.k === 'main' || p.k === 'trav'; })[0];
    return P ? P.t + (K.mins ? ' · ' + K.mins : '') : K.focus;
  }
  function viewPlan() {
    if (mode === 'loading') return viewHome();
    if (!blockStart()) return onboarding();
    var td = todayS(), cur = Math.max(1, Math.min(13, weekNo(td))), sel = ui.week || cur, ph = phaseOf(sel), wp = weekPlan(sel), a = targetArea();
    var h = '<div class="view"><section class="hero"><span class="mono">' + fmtMD(blockStart()) + ' – ' + fmtMD(addS(blockStart(), 90)) + ' · 13 weeks</span><h1>The block</h1>' +
      '<p class="muted">Thirteen pitches. Build, strength and power endurance, with a ledge to rest on at weeks 5 and 9 and the tests at the top. Tap a week to see its days.</p></section>';
    h += '<section class="card"><div data-chart="topo"></div><div class="legend"><span><i style="background:var(--ink);border-radius:50%"></i>Done</span><span><i style="background:var(--accent);border-radius:50%"></i>This week</span><span><i style="background:var(--accent);clip-path:polygon(0 0,100% 50%,0 100%)"></i>Trip</span><span><span class="mono" style="font-size:.6rem">AK</span>Akron week</span></div></section>';
    h += '<section class="stack"><div class="sec-head"><h2>Week ' + sel + ' · ' + ph.name + '</h2><span class="mono muted">' + fmtMD(weekStart(sel)) + ' – ' + fmtMD(addS(weekStart(sel), 6)) + '</span></div>' +
      '<div class="row">' + (sel === cur ? '<span class="pill ink">This week</span>' : '') + weekPills(sel) + '<span class="grow"></span><div class="seg"><button type="button" data-act="week" data-w="' + Math.max(1, sel - 1) + '" aria-label="Previous week"' + (sel === 1 ? ' disabled' : '') + '>←</button><button type="button" data-act="week" data-w="' + cur + '">Now</button><button type="button" data-act="week" data-w="' + Math.min(13, sel + 1) + '" aria-label="Next week"' + (sel === 13 ? ' disabled' : '') + '>→</button></div></div>' +
      '<p class="ink2">' + esc(ph.sum) + '</p>';
    if (wp[0].shape) h += '<p class="msg">Trip week: the hardest finger session moves to Tuesday, Lift 3 moves to ' + (wp[0].shape === 'Fri–Sun trip' ? 'Wednesday' : 'Thursday') + ' and is cut down, and Kilter power is skipped because the rock days cover it.</p>';
    else if (wp[0].akron) h += '<p class="msg">Akron week: the rest day moves to Tuesday. Kilter strength follows on Wednesday, fresh, and Kilter power moves to Friday, still 48 hours apart.</p>';
    h += '<div class="card" style="padding:.3rem .8rem">' + wp.map(function (dp) {
      var isDone = sessionsOn(dp.date).some(function (s) { return s.d.done; }), K = KIND[dp.kind];
      var pill = isDone ? '<span class="pill good">Logged</span>' : dp.date === td ? '<span class="pill solid">Today</span>' : K.key ? '<span class="pill">Key</span>' : '';
      return '<a class="dayrow' + (dp.date === td ? ' today' : '') + '" href="#day-' + dp.date + '"><span class="d">' + DOW[dp.i] + '<span>' + fmtMD(dp.date) + '</span></span><span class="m"><b>' + esc(kindTitle(dp)) + '</b><span>' + esc(dayStatus(dp)) + '</span></span>' + pill + '</a>';
    }).join('') + '</div></section>';
    if (a) {
      var rows = ['kpower', 'kstrength', 'sat', 'cracks', 'lift1'].map(function (k) { var f = areaFocus(k, a); return f ? '<li><span><b>' + esc(KIND[k].s) + '.</b> ' + esc(f) + '</span></li>' : ''; }).join('');
      h += '<section class="stack"><div class="sec-head"><h2>Area focus · ' + esc(a.name) + '</h2><a href="#area-' + a.id + '">Trip plan</a></div><p class="small muted">The block stays as written. These are the app’s suggestions for bending each session toward ' + esc(a.short || a.name) + '.</p><div class="card"><ul class="dots">' + rows + '</ul></div></section>';
    }
    return h + '</div>';
  }

  var TESTS = [['pullups', 'Max strict bodyweight pull-ups'], ['wpu3', 'Weighted pull-up, 3-rep max (added lb)'], ['rdl5', 'Romanian deadlift, 5-rep max (lb)'], ['bench5', 'Bench press, 5-rep max (lb)'], ['hollow', 'Hollow body hold (s)'], ['tindeqL', 'Tindeq max pull, left hand'], ['tindeqR', 'Tindeq max pull, right hand'], ['kilter', 'Hardest Kilter send at 40°'], ['retest', 'Retest problems sent (of 3)'], ['traverse', 'Longest nonstop traverse (min)']];
  var WK = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
  function curWeekIdx() { var w = weekNo(todayS()); return w >= 1 && w <= 13 ? w - 1 : -1; }
  function checkinDays() { var out = [], b = blockStart(), td = todayS(), end = addS(b, 90) < td ? addS(b, 90) : td; for (var d = b; d <= end; d = addS(d, 1)) out.push(d); return out.slice(-42); }
  function kilterByGrade() {
    var m = {}; kilter().forEach(function (k) { var g = k.d.g || '?'; if (!m[g]) m[g] = { g: g, sent: 0, proj: 0 }; if (k.d.status === 'sent') m[g].sent++; else m[g].proj++; });
    return Object.keys(m).map(function (g) { return m[g]; }).sort(function (x, y) { return gradeVal(y.g) - gradeVal(x.g); });
  }
  var CHARTS = {
    topo: function (W) { return topo(W, ui.week || Math.max(1, Math.min(13, weekNo(todayS())))); },
    sessions: function (W) { return colChart(W, { label: 'Lifts and climbs done in each week of the block', cats: WK.map(String), xTitle: 'Week', now: curWeekIdx(), tipPrefix: 'Week ', min: 4, series: [{ name: 'Lifts', color: 'var(--c1)', vals: WK.map(function (w) { return weekStats(w).lifts; }) }, { name: 'Climbs', color: 'var(--c2)', vals: WK.map(function (w) { return weekStats(w).climbs; }) }] }); },
    load: function (W) { return colChart(W, { label: 'Training load in each week', cats: WK.map(String), xTitle: 'Week', now: curWeekIdx(), tipPrefix: 'Week ', series: [{ name: 'Load', color: 'var(--c1)', vals: WK.map(function (w) { var s = weekStats(w); return s.hasLoad ? s.load : null; }) }] }); },
    upper: function (W) { return lineChart(W, { label: 'Top working weight for upper-body lifts by week', cats: WK.map(String), xTitle: 'Week', now: curWeekIdx(), tipPrefix: 'Week ', series: UPPER.map(function (u) { return { name: u[1], color: u[2], vals: WK.map(function (w) { return topWeight(u[0], w); }) }; }) }); },
    lower: function (W) { return lineChart(W, { label: 'Top working weight for lower-body lifts by week', cats: WK.map(String), xTitle: 'Week', now: curWeekIdx(), tipPrefix: 'Week ', series: LOWER.map(function (u) { return { name: u[1], color: u[2], vals: WK.map(function (w) { return topWeight(u[0], w); }) }; }) }); },
    dload: function (W) { var ds = checkinDays(); return colChart(W, { label: 'Training load on each day', h: 170, cats: ds.map(function (d) { return String(parse(d).getDate()); }), tipSuffix: function (i) { return ' · ' + fmtD(ds[i]); }, tipPrefix: 'Day ', series: [{ name: 'Load', color: 'var(--c1)', vals: ds.map(function (d) { var t = null; sessionsOn(d).forEach(function (s) { var l = s.d.done ? load(s.d) : null; if (l != null) t = (t || 0) + l; }); return t; }) }] }); },
    trav: function (W) { return colChart(W, { label: 'Traverse minutes in each week: total and longest set', cats: WK.map(String), xTitle: 'Week', now: curWeekIdx(), tipPrefix: 'Week ', series: [{ name: 'Total', color: 'var(--c1)', vals: WK.map(function (w) { return weekStats(w).trav || null; }) }, { name: 'Longest set', color: 'var(--c2)', vals: WK.map(function (w) { return weekStats(w).travMax || null; }) }] }); },
    bw: function (W) { var t = doc('tests') || {}, b = t.bw || {}; return lineChart(W, { label: 'Body weight by week', h: 170, cats: WK.map(String), xTitle: 'Week', now: curWeekIdx(), tipPrefix: 'Week ', series: [{ name: 'Body weight (lb)', color: 'var(--c1)', vals: WK.map(function (w) { return num(b[w]); }) }] }); },
    sleep: function (W) { return mini(W, 'sleep', 'Sleep', ' h', 4, 10); },
    energy: function (W) { return mini(W, 'energy', 'Energy', '', 1, 5); },
    sore: function (W) { return mini(W, 'sore', 'Soreness', '', 0, 5); },
    pain: function (W) { return mini(W, 'pain', 'Pain', '', 0, 10); }
  };
  var UPPER = [['Pull-up', 'Pull-up (added)', 'var(--c1)'], ['Bench press', 'Bench press', 'var(--c2)'], ['Seated dumbbell shoulder press', 'Shoulder press (per hand)', 'var(--c3)']];
  var LOWER = [['Romanian deadlift', 'Romanian deadlift (per hand)', 'var(--c1)'], ['High-box step-up', 'Step-up (per hand)', 'var(--c2)'], ['Pendulum squat', 'Pendulum squat', 'var(--c3)']];
  function mini(W, key, name, unit, lo, hi) { return miniLine(W, { name: name, unit: unit, lo: lo, hi: hi, color: 'var(--c1)', pts: checkinDays().map(function (d) { var c = doc('c_' + d); return { x: fmtMD(d), v: c && c[key] != null ? c[key] : null }; }) }); }
  function fillCharts() {
    var els = app.querySelectorAll('[data-chart]');
    for (var i = 0; i < els.length; i++) { var el = els[i], W = Math.max(240, Math.floor(el.clientWidth || 320)); var f = CHARTS[el.getAttribute('data-chart')]; if (f) el.innerHTML = f(W); }
  }
  function chartCard(title, sub, key, leg, table, cls) {
    return '<section class="card' + (cls ? ' ' + cls : '') + '"><div class="stack tight"><h3>' + title + '</h3>' + (sub ? '<p class="xs muted">' + sub + '</p>' : '') + '</div>' + (leg || '') + '<div class="chart" data-chart="' + key + '"></div>' + (table || '') + '</section>';
  }
  function viewProgress() {
    if (mode === 'loading') return viewHome();
    if (!blockStart()) return onboarding();
    var td = todayS(), cur = Math.max(1, Math.min(13, weekNo(td))), ws = weekStats(cur), from = addS(td, -6);
    var ci = []; for (var i = 0; i < 7; i++) { var c = doc('c_' + addS(from, i)); if (c) ci.push(c); }
    function avg(k) { var v = ci.map(function (x) { return x[k]; }).filter(function (x) { return x != null; }); return v.length ? (v.reduce(function (p, q) { return p + q; }, 0) / v.length).toFixed(1) : '–'; }
    var l7 = 0, any7 = false; done().forEach(function (s) { if (s.d.date >= from && s.d.date <= td) { var l = load(s.d); if (l != null) { l7 += l; any7 = true; } } });
    var flags = ci.filter(function (x) { return x.pain != null && x.pain >= 4; }).length;
    var ks = kilter(), sent = ks.filter(function (k) { return k.d.status === 'sent'; }).length;
    var h = '<div class="view"><section class="hero"><span class="mono">Week ' + cur + ' of 13 · ' + phaseOf(cur).name + '</span><h1>Progress</h1><p class="muted">Every number here is worked out from your logged sessions and check-ins. Deload and test weeks dip by design, so compare build, strength and power endurance weeks for the real trend.</p></section>';
    h += '<div class="tiles six"><div class="tile"><b class="num">' + ws.lifts + '<small>/2</small></b><span>lifts this week</span></div><div class="tile"><b class="num">' + ws.climbs + '<small>/4</small></b><span>climbs this week</span></div><div class="tile"><b class="num">' + (any7 ? fmtN(l7) : '–') + '</b><span>training load, last 7 days</span></div>' +
      '<div class="tile"><b class="num">' + avg('energy') + '</b><span>energy, last 7 days (1–5)</span></div><div class="tile"><b class="num">' + avg('sleep') + '</b><span>sleep, last 7 days (h)</span></div><div class="tile"><b class="num">' + flags + '</b><span>pain flags (4+), last 7 days</span></div></div>';
    var stats = WK.map(function (w) { return weekStats(w); });
    h += '<div class="pgrid">';
    h += chartCard('Sessions done per week', 'Out of 2 lifts and 4 climbs planned each week.', 'sessions', legend([{ name: 'Lifts', color: 'var(--c1)' }, { name: 'Climbs', color: 'var(--c2)' }]), tableView(['Week', 'Phase', 'Lifts', 'Climbs'], WK.map(function (w, i) { return [w, phaseOf(w).name, stats[i].lifts + '/2', stats[i].climbs + '/4']; })));
    h += chartCard('Weekly training load', 'Effort (RPE) × minutes, summed over the week.', 'load', '', tableView(['Week', 'Load', 'Minutes'], WK.map(function (w, i) { return [w, stats[i].hasLoad ? fmtN(stats[i].load) : null, stats[i].mins || null]; })));
    h += chartCard('Upper body: top working weight', 'Pounds. Pull-up is the weight added.', 'upper', legend(UPPER.map(function (u) { return { name: u[1], color: u[2], line: 1 }; })), tableView(['Week'].concat(UPPER.map(function (u) { return u[1]; })), WK.map(function (w) { return [w].concat(UPPER.map(function (u) { return topWeight(u[0], w); })); })));
    h += chartCard('Lower body: top working weight', 'Pounds.', 'lower', legend(LOWER.map(function (u) { return { name: u[1], color: u[2], line: 1 }; })), tableView(['Week'].concat(LOWER.map(function (u) { return u[1]; })), WK.map(function (w) { return [w].concat(LOWER.map(function (u) { return topWeight(u[0], w); })); })));
    var days = checkinDays();
    h += '<section class="card"><div class="stack tight"><h3>Daily check-in</h3><p class="xs muted">Each line has its own scale, shown at the left.</p></div>' +
      [['sleep', 'Sleep', 'hours'], ['energy', 'Energy', '1–5'], ['sore', 'Soreness', '0–5'], ['pain', 'Pain', '0–10']].map(function (m) { return '<div class="mini"><span>' + m[1] + '<em>' + m[2] + '</em></span><div class="chart" data-chart="' + m[0] + '"></div></div>'; }).join('') +
      tableView(['Day', 'Sleep', 'Energy', 'Soreness', 'Pain'], days.filter(function (d) { return doc('c_' + d); }).map(function (d) { var c = doc('c_' + d); return [fmtD(d), c.sleep, c.energy, c.sore, c.pain]; })) + '</section>';
    h += chartCard('Daily training load', 'Effort (RPE) × minutes for each day of the block so far.', 'dload', '', '');
    h += chartCard('Traverse minutes per week', 'Total time on the wall and the longest single set.', 'trav', legend([{ name: 'Total', color: 'var(--c1)' }, { name: 'Longest set', color: 'var(--c2)' }]), tableView(['Week', 'Total (min)', 'Longest set (min)'], WK.map(function (w, i) { return [w, stats[i].trav || null, stats[i].travMax || null]; })));
    var kg = kilterByGrade(), kmax = 1; kg.forEach(function (g) { kmax = Math.max(kmax, g.sent + g.proj); });
    h += '<section class="card"><div class="row between"><div class="stack tight"><h3>Kilter problems</h3><p class="xs muted">' + sent + ' of ' + ks.length + ' sent, by grade. Original 8x12 at 40°.</p></div><a class="small" href="#library" data-act="ui" data-k="lib" data-v="kilter">All problems</a></div>' + legend([{ name: 'Sent', color: 'var(--c1)' }, { name: 'Projecting', color: 'var(--c2)' }]) +
      (kg.length ? kg.map(function (g) { return '<div class="hbar"><span>' + esc(g.g) + '</span><div class="stack2"' + tipAttr(g.g, [['Sent', String(g.sent), 'var(--c1)'], ['Projecting', String(g.proj), 'var(--c2)']]) + ' tabindex="0">' + (g.sent ? '<i style="width:' + (g.sent / kmax * 100) + '%"></i>' : '') + (g.proj ? '<i style="width:' + (g.proj / kmax * 100) + '%;background:var(--c2)"></i>' : '') + '</div><span class="v">' + g.sent + '/' + (g.sent + g.proj) + '</span></div>'; }).join('') : '<p class="muted small">No problems saved yet. Log a Kilter session and they appear here.</p>') + '</section>';
    var t = doc('tests') || {}, rows = t.rows || {};
    h += '<section class="card wide"><div class="stack tight"><h3>Tests</h3><p class="xs muted">Starting numbers in week 1, the Tindeq and Kilter tests again at the end of weeks 5 and 9, and everything retested in week 13.</p></div><div class="twrap"><table class="t"><thead><tr><th>Test</th><th>Wk 1</th><th>Wk 5</th><th>Wk 9</th><th>Wk 13</th></tr></thead><tbody>' +
      TESTS.map(function (r) { return '<tr><td class="l">' + r[1] + '</td>' + [1, 5, 9, 13].map(function (w) { return '<td><input type="text" id="ts-' + r[0] + '-' + w + '" aria-label="' + r[1] + ', week ' + w + '" data-b="tests|rows.' + r[0] + '.w' + w + '" value="' + val((rows[r[0]] || {})['w' + w]) + '"></td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div></section>';
    var bw = t.bw || {};
    h += chartCard('Body weight', 'Pounds, once a week at the same time of day.', 'bw', '', '<div class="fgrid"><label class="f" for="bw-now">Week ' + cur + '<input type="number" id="bw-now" step="0.1" min="0" inputmode="decimal" data-b="tests|bw.' + cur + '" data-t="n" data-rerender="1" value="' + val(bw[cur]) + '"></label></div>', 'wide');
    return h + '</div></div>';
  }

  function tripRow(t) {
    var a = AREA[t.d.areaId], td = todayS(), past = (t.d.end || t.d.start) < td, n = daysBetween(t.d.start, t.d.end || t.d.start) + 1, logged = 0;
    for (var i = 0; i < n; i++) if (sessionsOn(addS(t.d.start, i)).some(function (s) { return s.d.kind === 'outside' && (s.d.probs || []).length; })) logged++;
    return '<div class="trip"><a href="#area-' + (a ? a.id : '') + '"><b>' + esc(a ? a.name : t.d.name || 'Trip') + '</b></a>' + (past ? '<span class="pill">Done</span>' : '<span class="pill solid">' + Math.max(0, daysBetween(td, t.d.start)) + ' days out</span>') +
      '<span class="small muted">' + fmtD(t.d.start) + (n > 1 ? ' – ' + fmtD(t.d.end) : '') + (t.d.notes ? ' · ' + esc(t.d.notes) : '') + '</span><a class="small" href="#day-' + t.d.start + '">' + (logged ? logged + ' of ' + n + ' days have routes' : past ? 'Log your routes' : 'See the days') + '</a></div>';
  }
  function viewTrips() {
    if (mode === 'loading') return viewHome();
    var ts = trips(), any = done().length > 0;
    var h = '<div class="view"><section class="hero"><span class="mono">' + AREAS.length + ' areas</span><h1>Trips</h1><p class="muted">Every area has a demand profile. Pick the one you are headed to and each session in your block gains an area focus. Three areas carry the tick lists and trip plans from your trip boards.</p></section>';
    if (ts.length) h += '<section class="stack"><div class="sec-head"><h2>Your trips</h2></div><div class="card" style="padding:.3rem 1.1rem">' + ts.slice().reverse().map(tripRow).join('') + '</div></section>';
    if (any) {
      var ranked = AREAS.map(function (a) { return { a: a, f: fit(a) }; }).sort(function (x, y) { return y.f - x.f; }).slice(0, 5);
      h += '<section class="stack"><div class="sec-head"><h2>Where your training points</h2><span class="mono muted">Last 4 weeks</span></div><p class="small muted">How much of what each area asks for your recent sessions have covered.</p><div class="card" style="padding:.3rem 1.1rem">' + ranked.map(function (r, i) { return '<a class="rank" href="#area-' + r.a.id + '"><span class="i">' + (i + 1) + '</span><span><b>' + esc(r.a.name) + '</b><span class="small muted" style="display:block">' + esc(topDims(r.a, 2).map(function (d) { return d.l; }).join(' and ')) + '</span></span><span class="v num">' + r.f + '%</span></a>'; }).join('') + '</div></section>';
    }
    h += '<section class="stack"><div class="sec-head"><h2>Areas</h2></div><div class="grid2">' + AREAS.map(areaCard).join('') + '</div></section>';
    return h + '</div>';
  }

  function viewArea(id) {
    var a = AREA[id]; if (!a) return viewTrips();
    var d = DETAIL[id], cur = targetArea(), active = cur && cur.id === id, td = todayS(), st = settings() || {};
    var h = '<div class="view"><section class="hero"><a class="small" href="#trips">All areas</a><span class="mono">' + esc(a.st) + ' · ' + esc(a.rock) + '</span><h1>' + esc(a.name) + '</h1><p class="muted">' + esc(a.style) + '</p>' +
      '<div class="row">' + (active && st.areaId === id ? '<span class="pill solid">Training for this area</span><button type="button" class="link" data-act="untrain">Stop</button>' : '<button type="button" class="btn" data-act="train" data-id="' + id + '">Train for ' + esc(a.short || a.name) + '</button>') + '</div></section>';
    h += '<div class="cols"><div class="stack loose">';
    var mine = trips().filter(function (t) { return t.d.areaId === id; }), nt = ui.newTrip[id] || {};
    h += '<section class="stack"><div class="sec-head"><h2>Trips here</h2></div><div class="card">' + (mine.length ? '<div>' + mine.map(function (t) {
      return tripRow(t).replace('</div>', '') + '<span></span><button type="button" class="link' + (ui.armed === t.id ? ' armed' : '') + '" data-act="deltrip" data-id="' + t.id + '">' + (ui.armed === t.id ? 'Tap again to remove' : 'Remove trip') + '</button></div>';
    }).join('') + '</div>' : '<p class="small muted">No trips here yet. Add dates and the block reshuffles that week around the trip: the hard finger session moves early, Lift 3 is cut down, and the days outside replace the weekend sessions.</p>') +
      '<div class="fgrid"><label class="f" for="nt-start">First day outside<input type="date" id="nt-start" data-ui="newTrip.' + id + '.start" value="' + val(nt.start) + '"></label><label class="f" for="nt-end">Last day outside<input type="date" id="nt-end" data-ui="newTrip.' + id + '.end" value="' + val(nt.end) + '"></label></div><div><button type="button" class="btn quiet" data-act="addtrip" data-id="' + id + '">Add trip</button></div></div></section>';
    var foc = ['kpower', 'kstrength', 'sat', 'cracks', 'lift1'].map(function (k) { var f = areaFocus(k, a); return f ? '<li><span><b>' + esc(KIND[k].s) + '.</b> ' + esc(f) + '</span></li>' : ''; }).join('');
    h += '<section class="stack"><div class="sec-head"><h2>How your block bends</h2><a href="#plan">The block</a></div><div class="card"><ul class="dots">' + foc + '</ul></div></section>';
    if (d) {
      if (d.todo) {
        var ck = (doc('checks_' + id) || {}).c || {};
        h += '<section class="stack"><div class="sec-head"><h2>Before you go</h2><span class="mono muted">' + d.todo.filter(function (_, i) { return ck[i]; }).length + ' / ' + d.todo.length + '</span></div><div class="card" style="gap:0">' + d.todo.map(function (t, i) {
          return '<label class="check' + (ck[i] ? ' on' : '') + '" for="ck-' + i + '"><input type="checkbox" id="ck-' + i + '" data-b="checks_' + id + '|c.' + i + '" data-rerender="1"' + (ck[i] ? ' checked' : '') + '><span class="stack tight"><b>' + esc(t[0]) + '</b><span class="small muted">' + esc(t[1]) + '</span></span><span class="pill' + (t[2] === 'Optional' ? '' : t[2] === 'Confirm' ? ' dash' : ' solid') + '">' + t[2] + '</span></label>';
        }).join('') + '</div></section>';
      }
      h += '<section class="stack"><div class="sec-head"><h2>Know before you rack</h2></div><div class="card"><ul class="dots">' + d.know.map(function (k) { return '<li><span>' + esc(k) + '</span></li>'; }).join('') + '</ul></div></section>';
    }
    h += '</div><div class="stack loose">';
    h += '<section class="card"><div class="stack tight"><h3>What the rock asks for</h3><p class="xs muted">Against what your last 4 weeks of logged sessions trained.</p></div>' + radar(a) +
      '<div class="legend"><span><i class="need"></i>' + esc(a.short || a.name) + ' asks for</span><span><i class="have"></i>You trained</span></div><p class="small ink2">' + gapLine(a) + '</p>' +
      tableView(['Quality', 'Rating', 'Sessions', 'Target'], coverage(a).map(function (c) { return [c.l, c.score + '/5', c.got, c.need]; })) + '</section>';
    if (d) {
      h += '<section class="card"><div class="row between"><h3>Rack to carry</h3></div><p class="small muted">' + esc(d.rackNote) + '</p><div class="cams">' + d.carry.map(function (c) { return '<div class="cam"><i style="background:' + CAM_COLOR[c[0]] + '"></i><b>' + (c[0].charAt(0) === '.' ? c[0] : '#' + c[0]) + '</b><span>' + esc(c[1]) + '</span></div>'; }).join('') + '</div></section>';
      if (d.camp) h += '<section class="card"><h3>Camp</h3><div class="facts">' + d.camp.map(function (f) { return '<div class="fact"><b>' + esc(f[0]) + '</b><span class="muted">' + esc(f[1]) + '</span></div>'; }).join('') + '</div></section>';
    }
    h += '</div></div>';
    if (d) {
      var tk = doc('ticks_' + id) || {}, r = tk.r || {}, star = tk.star || {}, tf = ui.tf, sent = 0, tried = 0, stars = 0;
      d.routes.forEach(function (x) { var k = slug(x[1]); if (r[k] === 's') sent++; else if (r[k] === 't') tried++; if (star[k]) stars++; });
      var rows = d.routes.filter(function (x) { var k = slug(x[1]), s2 = r[k] || 'w'; return (tf.band === 'all' || band(x[0]) === tf.band) && (tf.type === 'all' || x[3] === tf.type) && (tf.status === 'all' || (tf.status === 'star' ? star[k] : s2 === tf.status)); });
      var seg = function (key, opts) { return '<div class="seg" role="group">' + opts.map(function (o) { return '<button type="button" data-act="tf" data-k="' + key + '" data-v="' + o[0] + '" aria-pressed="' + (tf[key] === o[0]) + '">' + o[1] + '</button>'; }).join('') + '</div>'; };
      var hasSport = d.routes.some(function (x) { return x[3] === 'S'; });
      h += '<section class="stack" id="ticks"><div class="sec-head"><h2>Tick list</h2><span class="mono muted">' + sent + ' sent · ' + tried + ' tried · ' + stars + ' targets · ' + d.routes.length + ' routes</span></div><p class="small muted">Star your targets for the trip. They show up as one-tap suggestions when you log a day outside here.</p><div class="row">' +
        seg('band', [['all', 'All grades'], ['9', '≤5.9'], ['10', '5.10'], ['11', '5.11'], ['12', '5.12']]) + (hasSport ? seg('type', [['all', 'All'], ['S', 'Sport'], ['T', 'Trad']]) : '') + seg('status', [['all', 'All'], ['star', 'Targets'], ['w', 'To try'], ['t', 'Tried'], ['s', 'Sent']]) + '</div>';
      if (!rows.length) h += '<p class="muted">No routes match these filters.</p>';
      ['9', '10', '11', '12'].forEach(function (b) {
        var rs = rows.filter(function (x) { return band(x[0]) === b; }); if (!rs.length) return;
        h += '<div class="band"><h3>' + BAND_LABEL[b] + '<small>' + rs.length + (rs.length === 1 ? ' route' : ' routes') + '</small></h3>' + rs.map(function (x) {
          var key = slug(x[1]), s2 = r[key] || 'w';
          return '<div class="route"><button type="button" class="star" data-act="star" data-id="' + id + '" data-key="' + key + '" aria-pressed="' + !!star[key] + '" aria-label="Target: ' + esc(x[1]) + '">' + STAR + '</button><span class="g">' + esc(x[0]) + '</span><span class="n"><b>' + esc(x[1]) + '</b><span>' + esc(x[2]) + (hasSport ? ' · ' + (x[3] === 'S' ? 'Sport' : 'Trad') : '') + '</span>' + (x[4] ? '<em>' + esc(x[4]) + '</em>' : '') + '</span>' +
            '<div class="seg status" role="group" aria-label="Status"><button type="button" data-act="tick" data-id="' + id + '" data-key="' + key + '" data-v="t" aria-pressed="' + (s2 === 't') + '">Tried</button><button type="button" data-act="tick" data-id="' + id + '" data-key="' + key + '" data-v="s" aria-pressed="' + (s2 === 's') + '">Sent</button></div></div>';
        }).join('') + '</div>';
      });
      h += '</section><p class="foot">Routes, rack and camp notes come from your <a href="' + d.board + '">' + esc(a.name) + ' trip board</a>' + (d.extra ? d.extra.map(function (x) { return ' and your <a href="' + x[1] + '">' + esc(x[0]) + '</a>'; }).join('') : '') + '. Check route gear beta before racking up.</p>';
    } else {
      h += '<p class="foot">No tick list for this area yet. Its rack check is on your Climbing Gear board, linked in Library.</p>';
    }
    return h + '</div>';
  }
  function band(g) { var m = /5\.(\d+)/.exec(g); var n = m ? Number(m[1]) : 0; return n <= 9 ? '9' : n >= 12 ? '12' : String(n); }
  var BAND_LABEL = { '9': '5.9 and under', '10': '5.10', '11': '5.11', '12': '5.12' };

  var STRETCH = [
    ['Couch stretch', '2 × 45 s each side', 'Back knee on a cushion against the couch or a wall, shin up it, front foot flat. Squeeze the back leg’s glute and tuck your pelvis under until you feel the front of the hip.', 'Opens the hip flexors, so you can get your hips in on vertical face and stand up on high steps.'],
    ['Knee-to-wall ankle rocks', '2 × 10 each side', 'Barefoot, toes a few inches from a wall. Drive your knee to the wall with the heel down. Move the foot back as it gets easier.', 'Ankle range keeps a heel down on high steps and smears.'],
    ['Frog stretch', '2 × 60 s', 'Knees wide on a soft surface, shins parallel, ankles in line with your knees. Rock your hips back slowly.', 'Hip turnout for frogging, drop knees and keeping your hips close to the wall.'],
    ['Supported deep squat', '2 × 30–45 s', 'Heels on a thin book, knees out over your toes, holding a doorframe to stay upright. Move to a thinner book every couple of weeks.', 'Builds toward a flat-footed squat: the range for rock-overs and high feet.'],
    ['Doorway chest stretch', '2 × 30 s each side', 'Forearm on the doorframe, elbow at shoulder height. Step through until you feel the front of the chest.', 'Climbing and bench round the shoulders forward. This keeps them open for reaching.'],
    ['Forearm stretch', '2 × 20–30 s each side', 'Arm straight, palm up. Gently pull your fingers back with the other hand. Keep it light on Kilter days.', 'Eases forearm tightness without loading the finger pulleys.'],
    ['Lat stretch', '2 × 45 s', 'Kneel facing the couch, elbows on the seat, hands together behind your head. Sink your chest toward the floor and push your hips back.', 'Pull-ups, rows and climbing tighten the lats, which limits overhead reach.', 1],
    ['Upper-back extension', '2 × 8 slow reps', 'Lie on a foam roller or a rolled towel across your mid-back, hands behind your head. Arch back over it, then move it a few inches and repeat.', 'Lets you reach overhead from the upper back instead of arching your lower back.', 1],
    ['90/90 hip switches', '2 × 8 each side', 'Sit with both knees bent 90°, one leg in front and one to the side. Rotate both knees to the other side without using your hands, staying tall.', 'Hip rotation for drop knees, backsteps and twisting into the wall.', 1],
    ['Hamstring stretch', '2 × 45 s each side', 'Heel on a chair, leg straight, back flat. Hinge forward from the hips until you feel the back of the thigh.', 'Range for heel hooks and high feet, and it helps RDL soreness clear.', 1],
    ['Finger-extensor band', '2 × 20', 'Band around your fingertips, open your hand against it, slowly. Skip it if you already did it after climbing that day.', 'The antagonist work that protects your elbows from all the gripping.', 1]
  ];
  var KLISTS = ['Warm-up circuit', 'Power favorites V2–V4', 'Power favorites V4–V5', 'Strength V4–V5', 'Retest set 1', 'Strength, weeks 6–12', 'Retest set 2', '4x4 favorites'];
  function viewLibrary() {
    if (mode === 'loading') return viewHome();
    var sec = ui.lib || 'kilter', st = settings() || {};
    var tabs = [['kilter', 'Kilter problems'], ['warm', 'Warm-ups'], ['stretch', 'Stretches'], ['rules', 'Week rules'], ['links', 'Sources']];
    var h = '<div class="view"><section class="hero"><span class="mono">Reference</span><h1>Library</h1><p class="muted">The parts of your plan you look up mid-session.</p><div class="seg scroll" role="group" aria-label="Library section">' + tabs.map(function (t) { return '<button type="button" data-act="ui" data-k="lib" data-v="' + t[0] + '" aria-pressed="' + (sec === t[0]) + '">' + t[1] + '</button>'; }).join('') + '</div></section>';
    if (sec === 'kilter') {
      var ks = kilter(), lists = KLISTS.slice(); ks.forEach(function (k) { if (lists.indexOf(k.d.list || 'Other') < 0) lists.push(k.d.list || 'Other'); });
      h += '<p class="small muted">Kilter Original 8x12 at 40°. Problems you log in a Kilter session are added here on their own; a send in a session marks the problem sent.</p>';
      lists.forEach(function (l) {
        var items = ks.filter(function (k) { return (k.d.list || 'Other') === l; }); if (!items.length) return;
        var sent = items.filter(function (k) { return k.d.status === 'sent'; }).length;
        h += '<section class="stack"><div class="sec-head"><h2>' + esc(l) + '</h2><span class="mono muted">Sent ' + sent + ' of ' + items.length + '</span></div><div class="card" style="gap:0">' + items.sort(function (x, y) { return gradeVal(x.d.g) - gradeVal(y.d.g); }).map(function (k) {
          var d = k.d;
          return '<div class="kp"><span class="g">' + esc(d.g || '') + '</span><div class="n"><b>' + esc(d.n) + '</b><span>' + esc([d.style, (d.dates || []).length ? (d.dates || []).length + (d.dates.length === 1 ? ' session' : ' sessions') : '', d.sent ? 'sent ' + (/^\d{4}-/.test(d.sent) ? fmtMD(d.sent) : d.sent) : ''].filter(Boolean).join(' · ')) + '</span>' + (d.note ? '<p>' + esc(d.note) + '</p>' : '') + (d.next && d.status !== 'sent' ? '<p><b>Next time:</b> ' + esc(d.next) + '</p>' : '') + '</div>' +
            '<div class="seg status" role="group" aria-label="Status"><button type="button" data-act="kstatus" data-id="' + k.id + '" data-v="proj" aria-pressed="' + (d.status !== 'sent') + '" data-vv="t">Projecting</button><button type="button" data-act="kstatus" data-id="' + k.id + '" data-v="sent" aria-pressed="' + (d.status === 'sent') + '">Sent</button></div></div>';
        }).join('') + '</div></section>';
      });
      if (!ks.length) h += '<p class="muted">No problems yet. They appear here as you log Kilter sessions.</p>';
    } else if (sec === 'warm') {
      h += '<section class="stack"><div class="sec-head"><h2>Climbing warm-up</h2><span class="mono muted">Kilter days · about 25 min</span></div><div class="card"><p class="small muted">Ramp up gently. A light pump early is fine as long as it fades before your main set.</p><ol class="steps">' +
        '<li><b>General, 5 min</b><ul><li>Light cardio for 2–3 min: jump rope, rowing or jumping jacks</li><li>Band pull-aparts: 2 × 15</li><li>Band external rotations: 2 × 10 each arm</li><li>Scapular pull-ups: 2 × 8</li><li>Wrist circles and opening and closing your hands: 30 s</li></ul></li>' +
        '<li><b>Easy traversing, 6–8 min</b><ul><li>Continuous easy traversing on big holds</li><li>Quiet feet and straight arms</li></ul></li>' +
        '<li><b>Fingers, 5 min</b><ul><li>Feet-on hangs on a medium edge (about 20 mm) or medium Kilter holds</li><li>10 s at about 50%, then 70% effort, with 1 min rest between</li><li>Add a third hang at 85% once the warm-up stops pumping you</li></ul></li>' +
        '<li><b>Kilter ramp-up, 8 min</b><ul><li>3–4 Kilter problems at 40°, V0 to V2, resting 2 min between</li><li>Tuesdays only: finish with 2–3 big moves on good holds at about 80% effort</li></ul></li></ol>' +
        '<p class="msg">Rest 8–10 min before your main set. If you are still pumped, or a warm-up problem felt unusually hard, make it an easy day.</p>' + chips('8–10 min', 'Before the main set') + '</div></section>';
      h += '<section class="stack"><div class="sec-head"><h2>Lifting warm-up</h2><span class="mono muted">About 10 min</span></div><div class="card"><ul class="dots"><li><span>5 min of easy cardio and band pull-aparts.</span></li><li><span>Ankle work, 2–3 min: knee-to-wall rocks 2 × 10 each side (barefoot, heel down), then a heel-elevated goblet squat hold 2 × 30 s with plates under your heels. Use thinner plates every couple of weeks.</span></li><li><span>2–3 lighter ramp-up sets before the first lift.</span></li></ul></div></section>';
      h += '<section class="stack"><div class="sec-head"><h2>Cool-down after climbing</h2><span class="mono muted">About 10 min</span></div><div class="card"><ul class="dots"><li><span>Easy traversing: 3–5 min.</span></li><li><span>After Kilter days: reverse wrist curls 2 × 15 with a light dumbbell, slow on the way down, then finger-extensor bands 2 × 20. This balances the gripping and protects your elbows.</span></li><li><span>Stretch forearms, lats and hip flexors: 30 s each.</span></li><li><span>After Saturday: add 2 × 60 s frog stretch.</span></li></ul></div></section>';
    } else if (sec === 'stretch') {
      h += '<p class="small muted">Ten minutes most evenings, and twenty on rest and travel days. A strong but easy pull, about 5 out of 10, with slow breathing. Not right before limit bouldering or a heavy lift, since long holds can dull power for a while.</p>';
      [[0, 'The 10-minute routine', 'Most evenings, in this order'], [1, 'Rest-day add-ons', 'Rest and travel days']].forEach(function (g) {
        h += '<section class="stack"><div class="sec-head"><h2>' + g[1] + '</h2><span class="mono muted">' + g[2] + '</span></div><div class="card" style="gap:0">' + STRETCH.filter(function (s) { return !!s[4] === !!g[0]; }).map(function (s) { return '<div class="stretch"><b>' + s[0] + '</b><span class="mono muted">' + s[1] + '</span><p>' + s[2] + '</p><p class="why">' + s[3] + '</p></div>'; }).join('') + '</div></section>';
      });
    } else if (sec === 'rules') {
      var ak = st.akron || [];
      h += '<section class="stack"><div class="sec-head"><h2>Akron weeks</h2><span class="mono muted">Tuesday rest</span></div><div class="card"><p class="small muted">In an Akron week the rest day moves from Wednesday to Tuesday and the climbing shifts around it. Tap the weeks you are away.</p>' + (blockStart() ? '<div class="wchips">' + WK.map(function (w) { return '<button type="button" data-act="akron" data-w="' + w + '" aria-pressed="' + (ak.indexOf(w) >= 0) + '" aria-label="Week ' + w + '">' + w + '</button>'; }).join('') + '</div>' : '') +
        '<table class="t"><thead><tr><th>Day</th><th style="text-align:left">Session</th></tr></thead><tbody>' + [['Mon', 'Lift 1, as planned'], ['Tue', 'Rest (Akron). Evening: Tindeq pulls at home'], ['Wed', 'Kilter strength, fresh after the rest day'], ['Thu', 'Lift 3, with the easy pull-ups cut to 2 sets'], ['Fri', 'Kilter power'], ['Sat', 'Boulder laps and traverse. If your fingers still feel Friday, drop one traverse set'], ['Sun', 'Cracks, kept easy: the third climbing day in a row']].map(function (r2) { return '<tr><td>' + r2[0] + '</td><td class="l">' + r2[1] + '</td></tr>'; }).join('') + '</tbody></table></div></section>';
      h += '<section class="stack"><div class="sec-head"><h2>Outdoor weekends</h2><span class="mono muted">Sat–Sun trip</span></div><div class="card"><p class="small muted">Add a trip on its area page and the block applies this for you.</p><table class="t"><thead><tr><th>Day</th><th style="text-align:left">Trip week</th></tr></thead><tbody>' + [['Mon', 'Lift 1, no change'], ['Tue', 'Kilter strength, moved from Thursday: the biggest finger load goes four days before the trip'], ['Wed', 'Rest. No Tindeq training pulls'], ['Thu', 'Lift 3, cut down: RDL 2 sets, pendulum squat 1 set, no pull-ups'], ['Fri', 'Travel, with 10 min of mobility'], ['Sat', 'Outside, day 1'], ['Sun', 'Outside, day 2: shorter and easier']].map(function (r2) { return '<tr><td>' + r2[0] + '</td><td class="l">' + r2[1] + '</td></tr>'; }).join('') + '</tbody></table>' +
        '<ul class="dots"><li><span><b>Fri–Sun trip.</b> Kilter strength Tuesday, Lift 3 cut down on Wednesday, travel Thursday. Keep the third day to easy mileage.</span></li><li><span><b>Deload weeks</b> are a good time for a trip: climb well below your limit, mileage and no projecting.</span></li><li><span><b>Readiness rule.</b> Pain at 4 or more, or energy at 2 or less, means rest or an easy day.</span></li></ul></div></section>';
      h += '<section class="stack"><div class="sec-head"><h2>Spacing rules</h2></div><div class="card"><ul class="dots"><li><span>Keep at least 48 hours between Kilter sessions, and keep Kilter strength off the day after Lift 1.</span></li><li><span>Need more rest? Skip Sunday’s cracks first, then cut Monday’s rows.</span></li><li><span>Lifting gives way before climbing does: if a lift leaves you tired for the next climbing day, cut or hold the lift.</span></li></ul></div></section>';
    } else {
      var links = st.links || [];
      h += '<section class="stack"><div class="sec-head"><h2>Where this came from</h2></div>' + (links.length ? '<div class="stack">' + links.map(function (l) { return '<a class="card lib" href="' + esc(l.u) + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4"/></svg><span><b>' + esc(l.t) + '</b><span class="small muted" style="display:block">' + esc(l.d || '') + '</span></span><span class="mono muted">Open</span></a>'; }).join('') + '</div>' : '<p class="muted">No source documents linked.</p>') + '</section>';
      h += '<section class="stack"><div class="sec-head"><h2>Trip boards</h2></div><div class="stack">' + ['rrg', 'nrg', 'ic'].map(function (id) { return '<a class="card lib" href="' + DETAIL[id].board + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 20l6.5-12 3.5 6 3-5 5 11z"/></svg><span><b>' + esc(AREA[id].name) + ' trip board</b><span class="small muted" style="display:block">Rack, tick list, crags, camp and rain days</span></span><span class="mono muted">Open</span></a>'; }).join('') + '</div></section>';
      if (blockStart()) h += '<section class="stack"><div class="sec-head"><h2>Block</h2></div><div class="card"><div class="fgrid"><label class="f" for="st-start">Block starts (a Monday)<input type="date" id="st-start" data-b="settings|blockStart" data-rerender="1" value="' + val(st.blockStart) + '"></label></div><p class="small muted">Changing this moves every week of the plan. Your logged sessions keep their dates.</p></div></section>';
    }
    return h + '</div>';
  }
