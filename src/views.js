  /* ---------- Shared pieces ---------- */
  var app = document.getElementById('app');
  var CAMS6 = [['Fingers', '.4'], ['Off-fingers', '.75'], ['Thin hands', '1'], ['Hands', '2'], ['Cupped hands', '3'], ['Fists', '4']];
  var TESTS = [['pull', 'Max strict bodyweight pull-ups'], ['pull3', 'Weighted pull-up, 3-rep max (added lb)'], ['rdl', 'Romanian deadlift, 5-rep max (lb)'], ['bench', 'Bench press, 5-rep max (lb)'], ['hollow', 'Hollow body hold (s)'], ['tql', 'Tindeq max pull, left hand'], ['tqr', 'Tindeq max pull, right hand'], ['kilter', 'Hardest board send at 40°'], ['retest', 'Retest problems sent (of 3)'], ['trav', 'Longest nonstop traverse (min)'], ['bw', 'Body weight (lb)'], ['waist', 'Waist at navel (in)']];

  function notes() {
    var o = '';
    if (ui.sample) o += '<div class="banner"><span>Sample data for a made-up climber. Nothing here is saved.</span><button class="link" data-act="sample-off">Exit sample</button></div>';
    if (saveMsg) o += '<p class="msg" role="status">' + esc(saveMsg) + '</p>';
    if (mode === 'memory' && !ui.sample) o += '<p class="msg" role="status">This browser is blocking storage, so changes will be lost when you close the page. Turn off private browsing, or export a backup from Data before you leave.</p>';
    return o;
  }
  function boltLine(sel, pick) {
    var bw = blockWeeks(), cur = weekNo(today0());
    var cells = bw.map(function (x) {
      var n = x.st.lifts + x.st.climbs, cls = 'bolt';
      if (x.ph === 'deload') cls += ' deload'; if (x.ph === 'test') cls += ' test';
      if (x.w === cur) cls += ' now'; else if (n >= 4) cls += ' done'; else if (n >= 1) cls += ' part';
      if (pick && x.w === sel) cls += ' sel';
      var tip = 'Week ' + x.w + ' · ' + PH[x.ph].l + '\n' + fmt(x.monS) + '\n' + x.st.lifts + ' of 2 lifts, ' + x.st.climbs + ' of 4 climbs';
      return '<button type="button" class="' + cls + '" ' + (pick ? 'data-act="selweek" data-w="' + x.w + '"' : 'data-act="goweek" data-w="' + x.w + '"') + ' data-tip="' + esc(tip) + '" aria-label="Week ' + x.w + ', ' + PH[x.ph].l + '"><i></i></button>';
    }).join('');
    var ph = phaseOf(cur);
    function lab(t, a, b, k) { return '<span style="grid-column:' + a + '/' + (b + 1) + '"' + (cur >= a && cur <= b ? ' class="cur"' : '') + '>' + t + '</span>'; }
    return '<div class="bolts"><div class="bolt-row">' + cells + '</div><div class="bolt-labels">' + lab('Build', 1, 4) + lab('Dl', 5, 5) + lab('Strength', 6, 8) + lab('Dl', 9, 9) + lab('Peak', 10, 12) + lab('Test', 13, 13) + '</div></div>';
  }
  function partsHtml(slot) {
    var c = slot.c, co = slot.coach || {};
    if (c.kind === 'lift') {
      return '<table class="lift"><tbody>' + c.rows.map(function (r) {
        var x = (co.ex || {})[r.n] || {}, last = lastEx(r.n, null);
        var w = x.w != null && x.w !== '' ? (r.wl === 'lb added' ? '+' : '') + x.w + ' lb · ' : '';
        return '<tr><td><b>' + esc(r.n) + '</b>' + (x.coach ? '<small>' + esc(x.coach) + '</small>' : last ? '<small>Last: ' + esc(exLine(last.e)) + '</small>' : '') + '</td><td>' + esc(w + (x.target || r.target)) + '</td></tr>';
      }).join('') + '</tbody></table><p class="small muted">' + esc(c.effort) + '</p>';
    }
    return '<ul class="parts">' + c.parts.map(function (p) {
      var x = (co.parts || {})[p[0]] || {};
      return '<li><b>' + esc(p[0]) + '</b><span>' + esc(x.target || p[1]) + (x.coach ? '<small style="font-family:var(--body);font-size:.84rem">' + esc(x.coach) + '</small>' : '') + (p[2] ? '<small>Rest ' + esc(p[2]) + '</small>' : '') + '</span></li>';
    }).join('') + '</ul>';
  }
  function sessionBody(slot) {
    var c = slot.c, co = slot.coach || {};
    return '<p>' + esc(c.focus) + '</p>' +
      (slot.swapped || slot.why ? '<p class="why">' + (slot.swapped ? 'Area session, in place of ' + esc((LIFT[slot.base] || SESS[slot.base](slot.w)).t) + '. ' : '') + esc(slot.why) + '</p>' : '') +
      (co.focus && !slot.swapped ? '<p class="msg coach"><b>Coach note.</b> ' + esc(co.focus) + '</p>' : '') +
      partsHtml(slot.swapped ? Object.assign({}, slot, { coach: null }) : slot) +
      (slot.add ? '<p class="msg">' + esc(slot.add) + '</p>' : '');
  }
  function areaCard(a, active) {
    var chips = topDims(a, 2).map(function (d) { return '<span class="pill">' + esc(d.l) + ' ' + d.v + '/5</span>'; }).join('');
    return '<a class="card acard" href="#area-' + a.id + '"><div class="row between"><span class="mono muted">' + esc(a.st) + '</span>' + (active ? '<span class="pill solid">Training for</span>' : '') + '</div>' +
      '<h3>' + esc(a.name) + '</h3><p class="small muted">' + esc(a.style) + '</p><div class="chips">' + chips + (DETAIL[a.id] ? '<span class="pill dash">Tick list + trip plan</span>' : '') + '</div></a>';
  }
  function scale(field, lo, hi, val, attr, hot) {
    var o = '<div class="scale' + (hot ? ' hot' : '') + '" role="group">';
    for (var i = lo; i <= hi; i++) o += '<button type="button" ' + attr + ' data-f="' + field + '" data-v="' + i + '" aria-pressed="' + (String(val) === String(i)) + '"' + (hot && i >= hot ? ' class="hi"' : '') + '>' + i + '</button>';
    return o + '</div>';
  }

  /* ---------- Today ---------- */
  function checkinCard() {
    var dS = ymd(today0()), c = checkin(dS);
    if (c && !ui.ciEdit) {
      var r = readiness(c);
      return '<section class="card"><div class="row between"><h3>Morning check-in</h3><span class="pill ' + r.k + '">' + r.t + '</span></div>' +
        '<div class="ci-sum"><div><b>' + esc(c.sleep != null ? c.sleep : '–') + '</b><span>hours of sleep</span></div><div><b>' + esc(c.energy != null ? c.energy : '–') + '</b><span>energy, of 5</span></div><div><b>' + esc(c.sore != null ? c.sore : '–') + '</b><span>soreness, of 5</span></div><div><b>' + esc(c.pain != null ? c.pain : '–') + '</b><span>pain, of 10</span></div></div>' +
        (r.d ? '<p class="small">' + esc(r.d) + '</p>' : '') + (c.note ? '<p class="small muted">' + esc(c.note) + '</p>' : '') + '<div><button class="link" data-act="ci-edit">Edit</button></div></section>';
    }
    var d = ui.ci || (ui.ci = Object.assign({ sleep: 7, energy: '', sore: '', pain: '', where: '', bw: '', hr: '', note: '' }, c || {}));
    return '<section class="card"><div class="row between"><h3>Morning check-in</h3><span class="mono muted">30 seconds</span></div><div class="ci">' +
      '<span>Sleep</span><div class="step"><button type="button" data-act="ci-step" data-v="-0.5" aria-label="Less sleep">−</button><b>' + d.sleep + ' h</b><button type="button" data-act="ci-step" data-v="0.5" aria-label="More sleep">+</button></div>' +
      '<span>Energy</span>' + scale('energy', 1, 5, d.energy, 'data-act="ci-set"') +
      '<span>Soreness</span>' + scale('sore', 0, 5, d.sore, 'data-act="ci-set"') +
      '<span>Pain</span>' + scale('pain', 0, 10, d.pain, 'data-act="ci-set"', 4) +
      (num(d.pain) > 0 ? '<span>Where</span><input id="ci-where" data-ci="where" value="' + esc(d.where) + '" placeholder="Finger, elbow, wrist, shoulder">' : '') +
      '</div><details class="more"><summary>Body weight, resting heart rate, a note</summary><div class="grid2"><label class="f" for="ci-bw">Body weight (lb)<input id="ci-bw" type="number" step="0.1" inputmode="decimal" data-ci="bw" value="' + esc(d.bw) + '"></label><label class="f" for="ci-hr">Resting heart rate<input id="ci-hr" type="number" inputmode="numeric" data-ci="hr" value="' + esc(d.hr) + '"></label></div><label class="f" for="ci-note" style="margin-top:.6rem">Note<input id="ci-note" data-ci="note" value="' + esc(d.note) + '"></label></details>' +
      '<p class="small muted">Pain is for fingers, elbows, wrists and shoulders: 0–2 is fine, 3 is the most to train through, 4 or more means back off.</p>' +
      '<div class="row"><button class="btn" data-act="ci-save">Save check-in</button>' + (c ? '<button class="link" data-act="ci-cancel">Cancel</button>' : '') + '</div></section>';
  }
  function viewHome() {
    if (mode === 'loading') return '<section class="hero"><h1>Approach</h1><p class="muted">Loading your training…</p></section>';
    if (mode === 'signedout') return '<section class="hero"><span class="mono">Approach</span><h1>Sign in</h1><p class="muted small">Your training log syncs to your own account, so it follows you from phone to laptop.</p></section>' +
      '<form class="card" id="authform"><label class="f" for="a-email">Email<input id="a-email" type="email" autocomplete="email" required></label><label class="f" for="a-pw">Password<input id="a-pw" type="password" autocomplete="current-password" minlength="6" required></label>' + (ui.authMsg ? '<p class="msg" role="alert">' + esc(ui.authMsg) + '</p>' : '') +
      '<div class="row"><button class="btn" type="submit" data-mode="in"' + (ui.authBusy ? ' disabled' : '') + '>Sign in</button><button class="btn quiet" type="submit" data-mode="up"' + (ui.authBusy ? ' disabled' : '') + '>Create account</button></div></form>';
    if (!blockStart()) {
      return '<section class="hero"><span class="mono">Approach</span><h1>Train for where you’re going</h1><p class="muted">A 13-week block of board sessions, endurance and lifting that retunes itself to the rock you are headed for, with your tick list and trip prep in the same place.</p>' +
        '<div class="row" style="margin-top:.4rem"><button class="btn" data-act="start-block">Start a block this week</button><button class="btn quiet" data-act="sample-on">Look around with sample data</button></div></section>' + notes() +
        '<section class="stack"><div class="sec-head"><h2>Pick where you’re headed</h2><a href="#areas">All ' + AREAS.length + ' areas</a></div><div class="cards">' + ['rrg', 'nrg', 'ic'].map(function (id) { return areaCard(AREA[id], false); }).join('') + '</div></section>';
    }
    var t = today0(), tS = ymd(t), mon = monday(t), monS = ymd(mon), w = weekNo(t), ph = phaseOf(w), week = planWeek(mon), idx = (t.getDay() + 6) % 7, slot = week[idx], ws = weekStats(monS), trip = tripInfo();
    var done = sessionsOn(tS).length > 0, isRest = slot.c.kind === 'rest';
    var right = trip.k === 'ahead' ? '<div class="bignum">' + trip.days + '<small>days to ' + esc(trip.a.short || trip.a.name) + '</small></div>' : (w >= 1 && w <= 13 ? '<div class="bignum">' + (14 - w) + '<small>weeks left</small></div>' : '');
    var h = '<section class="hero"><span class="mono">' + t.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }) + '</span>' +
      '<div class="hero-row"><h1>' + (w >= 1 && w <= 13 ? 'Week ' + w + '<br>' + esc(PH[ph].l) : w > 13 ? 'Block<br>finished' : 'Block starts<br>' + esc(fmt(blockStart()))) + '</h1>' + right + '</div>' +
      '<p class="muted small">' + esc(PH[ph].d) + '</p>' + boltLine() + '</section>' + notes();
    h += checkinCard();
    h += '<section class="stack"><div class="sec-head"><h2>Today</h2><span class="mono">' + (slot.c.mins ? 'About ' + slot.c.mins + ' min' : weekType(monS) === 'tue' ? esc(restWord()) + ' week' : 'Recover') + '</span></div>' +
      '<div class="card' + (slot.key ? ' key' : '') + '"><div class="row between"><h3>' + esc(slot.c.t) + '</h3>' + (done ? '<span class="pill good">Logged</span>' : slot.key ? '<span class="pill solid">Key session</span>' : '') + '</div>' + sessionBody(slot) +
      (isRest ? '' : '<div class="row"><button class="btn" data-act="start" data-date="' + tS + '">' + (done ? 'Log another session' : 'Start session') + '</button><a class="btn quiet" href="#plan">Whole week</a></div>') + '</div></section>';
    h += '<section class="stack"><div class="sec-head"><h2>This week</h2><span class="mono">' + ws.lifts + ' of 2 lifts · ' + ws.climbs + ' of 4 climbs</span></div><div class="week">' + week.map(function (s, i) {
      var dn = sessionsOn(s.date).length > 0;
      return '<a class="day' + (i === idx ? ' today' : '') + (dn ? ' done' : '') + (s.c.kind === 'rest' && !dn ? ' restd' : '') + '" href="#plan" data-act="openday" data-i="' + i + '"><b>' + s.d + '</b><em>' + parse(s.date).getDate() + '</em><span>' + esc(s.c.short) + '</span></a>';
    }).join('') + '</div></section>';
    var en = last7('energy'), sl = last7('sleep');
    h += '<div class="tiles"><div class="tile"><b>' + (ws.load ? Math.round(ws.load).toLocaleString() : '–') + '</b><span>training load this week (effort × minutes)</span></div><div class="tile"><b>' + (en != null ? r1(en).toFixed(1) : '–') + '<small> /5</small></b><span>energy, last 7 days</span></div><div class="tile"><b>' + (sl != null ? r1(sl).toFixed(1) : '–') + '<small> h</small></b><span>sleep, last 7 days</span></div></div>';
    if (trip.k === 'none') h += '<section class="card"><h3>Tune this block to a trip</h3><p class="small muted">Pick the area you are headed to. Approach swaps in the sessions its rock rewards as the trip gets close, and keeps the tick list and packing notes in one place.</p><div class="row"><a class="btn ghost" href="#areas">Choose an area</a></div></section>';
    else {
      var a = trip.a, cov = coverage(a), d = DETAIL[a.id], tc = tickCounts(a.id);
      h += '<section class="stack"><div class="sec-head"><h2>' + esc(a.name) + '</h2><a href="#area-' + a.id + '">Trip plan</a></div><p class="small muted">' + esc(specificity(mon).label || '') + '</p>' +
        '<div class="card"><p class="small muted">Sessions in the last 4 weeks against what ' + esc(a.short || a.name) + ' asks for. A full bar means you have trained that quality as often as its rating calls for.</p><div class="bars">' + cov.map(function (c) {
          return '<div class="bar"><span>' + esc(c.l) + '</span><div class="track"><i style="width:' + Math.min(100, Math.round(c.got / c.need * 100)) + '%"></i></div><span class="val">' + c.got + ' / ' + c.need + '</span></div>';
        }).join('') + '</div>' + (d ? '<p class="small muted">' + tc.sent + ' sent and ' + tc.tried + ' tried of ' + tc.total + ' routes on the tick list.</p>' : '') + '</div></section>';
    }
    return h;
  }

  /* ---------- Plan ---------- */
  function viewPlan() {
    if (!blockStart()) return '<section class="hero"><h1>Plan</h1><p class="muted">Start a block and the 13 weeks appear here.</p><div class="row"><button class="btn" data-act="start-block">Start a block this week</button></div></section>';
    var cur = weekNo(today0()), w = ui.planWeek || Math.min(13, Math.max(1, cur)), mon = weekMon(w), monS = ymd(mon), ph = phaseOf(w), week = planWeek(mon), type = weekType(monS), a = curArea(), spec = specificity(mon);
    var idx = w === cur ? (today0().getDay() + 6) % 7 : -1, open = ui.openDay != null ? ui.openDay : idx;
    var h = '<section class="hero"><span class="mono">13-week block · started ' + esc(fmt(blockStart())) + '</span><h1>Plan</h1>' + boltLine(w, true) + '</section>' + notes();
    h += '<section class="stack"><div class="row between"><button class="btn quiet sm" data-act="selweek" data-w="' + (w - 1) + '"' + (w <= 1 ? ' disabled' : '') + ' aria-label="Previous week">‹</button><div style="text-align:center"><h2>Week ' + w + ' · ' + esc(PH[ph].l) + '</h2><span class="mono muted">' + esc(fmt(monS)) + ' – ' + esc(fmt(ymd(addDays(mon, 6)))) + (w === cur ? ' · this week' : '') + '</span></div><button class="btn quiet sm" data-act="selweek" data-w="' + (w + 1) + '"' + (w >= 13 ? ' disabled' : '') + ' aria-label="Next week">›</button></div>' +
      '<p class="small muted">' + esc(PH[ph].d) + '</p>' +
      '<div class="row"><div class="seg" role="group" aria-label="Week shape">' + [['normal', 'Normal week'], ['tue', esc(restWord()) + ' week'], ['out', 'Outdoor weekend']].map(function (o) { return '<button type="button" data-act="wtype" data-v="' + o[0] + '" aria-pressed="' + (type === o[0]) + '">' + o[1] + '</button>'; }).join('') + '</div></div>' +
      (type === 'tue' ? '<p class="small muted">The rest day moves to Tuesday. Limit bouldering goes right after it, when fingers are freshest, and stays 48 hours from the power session.</p>' : type === 'out' ? '<p class="small muted">The hardest finger session moves to Tuesday, the second lift moves to Thursday and is cut down, and Friday is travel.</p>' : '') +
      (a ? '<p class="why"><b>' + esc(a.name) + '.</b> ' + esc(spec.label || '') + '</p>' : '<p class="small muted">No area chosen, so this is the plain block. <a href="#areas">Choose an area</a> to tune it.</p>') + '</section>';
    h += '<section class="stack">' + week.map(function (s, i) {
      var dn = sessionsOn(s.date).length > 0;
      return '<details class="card' + (s.key ? ' key' : '') + '" data-day="' + i + '"' + (i === open ? ' open' : '') + '><summary><span class="dow">' + s.d + '<small>' + esc(fmt(s.date)) + '</small></span><span class="sum-main"><b>' + esc(s.c.t) + '</b><span class="small muted">' + (s.c.mins ? 'About ' + s.c.mins + ' min' : 'Recover') + (i === idx ? ' · today' : '') + '</span></span>' + (dn ? '<span class="pill good">Logged</span>' : s.swapped ? '<span class="pill solid">Area</span>' : s.key ? '<span class="pill">Key</span>' : '') + '</summary>' +
        sessionBody(s) + (s.c.kind === 'rest' ? '' : '<div class="row"><button class="btn sm" data-act="start" data-date="' + s.date + '">' + (dn ? 'Log another' : 'Log this session') + '</button></div>') + '</details>';
    }).join('') + '</section>';
    h += '<p class="foot">At least 48 hours between board sessions. Lifting gives way before climbing does: if a lift leaves you tired for the next climbing day, cut it. Skip any session if something hurts.</p>';
    return h;
  }

  /* ---------- Session logger ---------- */
  function timerLabel() { var D = ui.D; if (!D || !D.t0) return '0:00'; var s = Math.floor((Date.now() - D.t0) / 1000); return Math.floor(s / 60) + ':' + pad(s % 60); }
  function restBtn(sec, label) { return sec ? '<button type="button" class="btn quiet sm" data-act="rest" data-sec="' + sec + '">Rest ' + (sec >= 60 ? Math.floor(sec / 60) + ':' + pad(sec % 60) : sec + ' s') + '</button>' : ''; }
  function viewSession() {
    var D = ui.D; if (!D) return viewHome();
    var h = '<section class="hero"><a class="small" href="#home" data-act="discard">Close without saving</a><span class="mono">' + esc(fmt(D.date, { weekday: 'long', month: 'short', day: 'numeric' })) + (D.w >= 1 && D.w <= 13 ? ' · week ' + D.w : '') + '</span><h1>' + esc(D.title) + '</h1>' + (D.focus ? '<p class="muted small">' + esc(D.focus) + '</p>' : '') + '</section>';
    h += '<div class="grid2"><label class="f" for="d-date">Date<input type="date" id="d-date" data-b="date" value="' + esc(D.date) + '"></label><label class="f" for="d-title">Session<input id="d-title" data-b="title" value="' + esc(D.title) + '"></label></div>';
    if (D.coachFocus) h += '<p class="msg coach"><b>Coach note.</b> ' + esc(D.coachFocus) + '</p>';
    if (D.kind === 'lift') {
      h += '<details class="more"><summary>Warm-up</summary><p class="small">' + esc(LIFTWARM) + '</p></details>';
      h += D.ex.map(function (e, i) {
        var filled = e.sets.filter(function (v) { return v !== ''; }), full = e.hi && filled.length === e.sets.length && filled.every(function (v) { return +v >= e.hi; });
        var quick = []; if (e.hi) for (var q = e.lo; q <= e.hi; q++) quick.push(q);
        return '<div class="exo' + (full ? ' full' : '') + '"><div class="exo-head"><h3>' + esc(e.n) + '</h3><span class="mono">' + esc(e.target || '') + '</span></div>' +
          (e.coach ? '<p class="small"><b>Coach:</b> ' + esc(e.coach) + '</p>' : '') +
          (e.last ? '<p class="last">Last time, ' + esc(fmt(e.last.date)) + ': ' + esc(exLine(e.last.e)) + '</p>' : '') +
          '<div class="sets">' + (e.wl ? '<input class="w num" type="number" step="0.5" inputmode="decimal" id="e' + i + 'w" data-b="ex.' + i + '.w" value="' + esc(e.w) + '" aria-label="Weight, ' + esc(e.wl) + '" placeholder="lb"><span class="x">×</span>' : '') +
          e.sets.map(function (v, j) { return '<input class="num" type="number" inputmode="numeric" id="e' + i + 's' + j + '" data-b="ex.' + i + '.sets.' + j + '" value="' + esc(v) + '" placeholder="' + (e.last && e.last.e.sets[j] != null ? esc(e.last.e.sets[j]) : e.hi || '') + '" aria-label="Set ' + (j + 1) + '">'; }).join('') +
          '<button type="button" class="btn quiet sm" data-act="addset" data-i="' + i + '" aria-label="Add a set">+</button></div>' +
          (e.wl ? '<span class="small muted" style="margin-top:-.4rem">' + esc(e.wl) + '</span>' : '') +
          '<div class="row">' + (quick.length && quick.length <= 4 ? '<span class="small muted">All sets at</span>' + quick.map(function (q) { return '<button type="button" class="chip" data-act="fill" data-i="' + i + '" data-v="' + q + '">' + q + '</button>'; }).join('') : '') + restBtn(e.restSec) + '</div>' +
          '<div class="row"><span class="small muted">Reps in reserve</span><div class="seg">' + [0, 1, 2, 3, 4].map(function (r) { return '<button type="button" data-act="rir" data-i="' + i + '" data-v="' + r + '" aria-pressed="' + (String(e.rir) === String(r)) + '">' + (r === 4 ? '4+' : r) + '</button>'; }).join('') + '</div></div>' +
          (full ? '<p class="small" style="color:var(--good)"><b>Ready to go up.</b> Every set hit the top of the range: add weight next time.</p>' : '') +
          '<details class="more"' + (e.note ? ' open' : '') + '><summary>Cue and note</summary><p class="small muted">' + esc(e.cue || '') + '</p><textarea id="e' + i + 'n" data-b="ex.' + i + '.note" rows="2" placeholder="How it felt, what to change">' + esc(e.note) + '</textarea></details></div>';
      }).join('');
      h += '<div class="row"><button type="button" class="btn quiet sm" data-act="addex">Add an exercise</button></div>';
    } else if (D.kind === 'board') {
      var tries = D.probs.reduce(function (n, p) { return n + (+p.tries || 0); }, 0), sends = D.probs.filter(function (p) { return p.sent; }).length;
      h += (D.parts || []).length ? '<details class="more"><summary>Session plan</summary><ul class="parts">' + D.parts.map(function (p) { return '<li><b>' + esc(p[0]) + '</b><span>' + esc(p[1]) + (p[2] ? '<small>Rest ' + esc(p[2]) + '</small>' : '') + '</span></li>'; }).join('') + '</ul></details>' : '';
      h += '<div class="exo"><div class="exo-head"><h3>Problems</h3><span class="mono">' + tries + (tries === 1 ? ' try' : ' tries') + ' · ' + sends + ' sent</span></div>' +
        D.probs.map(function (p, i) {
          return '<div class="prob"><input id="p' + i + 'n" data-b="probs.' + i + '.n" value="' + esc(p.n) + '" placeholder="Problem name" list="plist" aria-label="Problem name"><input id="p' + i + 'g" data-b="probs.' + i + '.g" value="' + esc(p.g) + '" placeholder="V4" aria-label="Grade">' +
            '<div class="ctl"><div class="step"><button type="button" data-act="tries" data-i="' + i + '" data-v="-1" aria-label="One try fewer">−</button><b>' + (p.tries || 0) + (p.tries === 1 ? ' try' : ' tries') + '</b><button type="button" data-act="tries" data-i="' + i + '" data-v="1" aria-label="One more try">+</button></div>' +
            '<button type="button" class="sent-t" data-act="sent" data-i="' + i + '" aria-pressed="' + !!p.sent + '">' + (p.sent ? 'Sent ✓' : 'Sent?') + '</button><button type="button" class="link" data-act="delprob" data-i="' + i + '">Remove</button></div>' +
            '<input style="grid-column:1/-1" id="p' + i + 't" data-b="probs.' + i + '.note" value="' + esc(p.note || '') + '" placeholder="Best go, and what to try next time" aria-label="Note"></div>';
        }).join('') +
        '<div class="row" style="padding-top:.4rem"><button type="button" class="btn sm" data-act="addprob">Add a problem</button>' + restBtn(D.restSec || 180) + '</div>' +
        (D.sugg && D.sugg.length ? '<div class="stack" style="gap:.4rem"><span class="small muted">Your projects</span><div class="chips">' + D.sugg.filter(function (x) { return !D.probs.some(function (p) { return p.n === x.n; }); }).map(function (x) { return '<button type="button" class="chip" data-act="pick" data-n="' + esc(x.n) + '" data-g="' + esc(x.g) + '">' + esc(x.n) + ' ' + esc(x.g) + '</button>'; }).join('') + '</div></div>' : '') + '</div>' +
        '<datalist id="plist">' + S.kilter.items.map(function (x) { return '<option value="' + esc(x.n) + '">'; }).join('') + '</datalist>';
    } else if (D.kind === 'endur') {
      h += '<div class="exo"><div class="exo-head"><h3>Boulder laps</h3><span class="mono">Up, down, up</span></div><div class="grid3"><label class="f" for="l-r">Rounds<input id="l-r" type="number" inputmode="numeric" data-b="laps.rounds" value="' + esc(D.laps.rounds) + '"></label><label class="f" for="l-g">Grades<input id="l-g" data-b="laps.grade" value="' + esc(D.laps.grade) + '" placeholder="V0–V2"></label><label class="f" for="l-p">Pump, 1–10<input id="l-p" type="number" inputmode="numeric" data-b="laps.pump" value="' + esc(D.laps.pump) + '"></label></div><div class="row">' + restBtn(150) + '</div></div>';
      h += '<div class="exo"><div class="exo-head"><h3>Traverse</h3><span class="mono">' + D.trav.sets.reduce(function (n, x) { return n + (num(x.m) || 0); }, 0) + ' min on the wall</span></div><div class="seg">' + ['endurance', 'technique', 'intervals', 'easy'].map(function (k) { return '<button type="button" data-act="travkind" data-v="' + k + '" aria-pressed="' + (D.trav.kind === k) + '">' + k.charAt(0).toUpperCase() + k.slice(1) + '</button>'; }).join('') + '</div>' +
        (D.travTarget ? '<p class="small muted">' + esc(D.travTarget) + '</p>' : '') +
        D.trav.sets.map(function (x, i) { return '<div class="grid3" style="align-items:end"><label class="f" for="t' + i + 'm">Set ' + (i + 1) + ', minutes<input id="t' + i + 'm" type="number" step="0.25" inputmode="decimal" data-b="trav.sets.' + i + '.m" value="' + esc(x.m) + '"></label><label class="f" for="t' + i + 'p">Pump, 1–10<input id="t' + i + 'p" type="number" inputmode="numeric" data-b="trav.sets.' + i + '.p" value="' + esc(x.p) + '"></label><button type="button" class="link" data-act="delset" data-i="' + i + '">Remove</button></div>'; }).join('') +
        '<div class="row"><button type="button" class="btn sm" data-act="addtrav">Add a set</button>' + restBtn(D.restSec || 90) + '</div></div>';
    } else if (D.kind === 'crack') {
      h += '<div class="exo"><div class="exo-head"><h3>Cracks</h3><span class="mono">Laps and sizes</span></div><div class="row"><span class="small muted">Laps</span><div class="step"><button type="button" data-act="claps" data-v="-1" aria-label="One lap fewer">−</button><b>' + (D.cracks.laps || 0) + '</b><button type="button" data-act="claps" data-v="1" aria-label="One more lap">+</button></div>' + restBtn(150) + '</div>' +
        '<div class="chips">' + CAMS6.map(function (c) { return '<button type="button" class="chip" data-act="csize" data-v="' + c[0] + '" aria-pressed="' + (D.cracks.sizes.indexOf(c[0]) >= 0) + '"><i style="background:' + CAM_COLOR[c[1]] + '"></i>' + c[0] + '</button>'; }).join('') + '</div>' +
        '<label class="f" for="c-w">Where<input id="c-w" data-b="cracks.where" value="' + esc(D.cracks.where) + '" placeholder="Crag or gym"></label></div>';
    } else if (D.kind === 'out') {
      var det = D.areaId && DETAIL[D.areaId];
      h += '<div class="exo"><div class="exo-head"><h3>Routes</h3><span class="mono">' + D.routes.filter(function (r) { return r.n; }).length + ' logged</span></div><label class="f" for="o-w">Where<input id="o-w" data-b="where" value="' + esc(D.where) + '"></label>' +
        D.routes.map(function (r, i) { return '<div class="prob"><input id="r' + i + 'n" data-b="routes.' + i + '.n" value="' + esc(r.n) + '" placeholder="Route name" list="rlist" aria-label="Route name"><input id="r' + i + 'g" data-b="routes.' + i + '.g" value="' + esc(r.g) + '" placeholder="5.10b" aria-label="Grade"><div class="ctl"><div class="seg">' + ['Onsight', 'Flash', 'Redpoint', 'Fell', 'Top rope'].map(function (st) { return '<button type="button" data-act="rstyle" data-i="' + i + '" data-v="' + st + '" aria-pressed="' + (r.style === st) + '">' + st + '</button>'; }).join('') + '</div><button type="button" class="link" data-act="delroute" data-i="' + i + '">Remove</button></div></div>'; }).join('') +
        '<div class="row" style="padding-top:.4rem"><button type="button" class="btn sm" data-act="addroute">Add a route</button></div>' + (det ? '<p class="small muted">Routes on your ' + esc(AREA[D.areaId].name) + ' tick list are marked sent or tried when you save.</p><datalist id="rlist">' + det.routes.map(function (r) { return '<option value="' + esc(r[1]) + '">'; }).join('') + '</datalist>' : '') + '</div>';
    }
    h += '<div class="exo"><div class="exo-head"><h3>Wrap up</h3><span class="mono">Effort × minutes = load</span></div><div class="grid2"><label class="f" for="d-mins">Minutes<input id="d-mins" type="number" inputmode="numeric" data-b="mins" value="' + esc(D.mins) + '" placeholder="' + (D.t0 ? Math.max(1, Math.round((Date.now() - D.t0) / 60000)) : '') + '"></label><div class="f"><span>Timer</span><button type="button" class="btn quiet" data-act="timer">' + (D.t0 ? 'Stop at <span class="clock" id="clock" style="margin-left:.4rem">' + timerLabel() + '</span>' : 'Start timer') + '</button></div></div>' +
      '<div class="stack" style="gap:.3rem"><span class="small muted">How hard was it? 1 is nothing, 10 is everything you had.</span>' + scale('rpe', 1, 10, D.rpe, 'data-act="rpe"') + '</div>' +
      '<label class="f" for="d-notes">Notes<textarea id="d-notes" data-b="notes" rows="3" placeholder="Anything that affects the next session: a tweaky finger, poor sleep, a cut set">' + esc(D.notes) + '</textarea></label></div>';
    h += '<div class="savebar"><div class="savebar-in"><button class="btn grow" data-act="save">' + (D.id ? 'Save changes' : 'Save session') + '</button></div></div>';
    return h;
  }

  /* ---------- Log ---------- */
  function sessionDetail(s) {
    var o = '';
    if (s.ex && s.ex.length) o += '<div class="kv">' + s.ex.map(function (e) { return '<div><span><b>' + esc(e.n) + '</b>' + (e.target ? ' <span class="muted small">' + esc(e.target) + '</span>' : '') + (e.note ? '<small>' + esc(e.note) + '</small>' : '') + '</span><span>' + esc(exLine(e)) + '</span></div>'; }).join('') + '</div>';
    if (s.probs && s.probs.length) o += '<div class="kv">' + s.probs.map(function (p) { return '<div><span><b>' + esc(p.n || 'Unnamed') + '</b> ' + esc(p.g || '') + (p.warm ? ' <span class="muted small">warm-up</span>' : '') + (p.note ? '<small>' + esc(p.note) + '</small>' : '') + '</span><span>' + (p.sent ? '✓ sent' : 'no send') + (p.tries ? ' · ' + p.tries + (p.tries === 1 ? ' try' : ' tries') : '') + '</span></div>'; }).join('') + '</div>';
    if (s.laps && (s.laps.rounds || s.laps.grade)) o += '<p>Boulder laps: ' + esc(s.laps.rounds || '?') + ' rounds' + (s.laps.grade ? ' at ' + esc(s.laps.grade) : '') + (s.laps.pump ? ', pump ' + esc(s.laps.pump) : '') + '</p>';
    if (s.trav && s.trav.sets && s.trav.sets.length) o += '<p>Traverse, ' + esc(s.trav.kind || 'endurance') + ': ' + s.trav.sets.map(function (x) { return esc(x.m) + ' min' + (x.p ? ' (pump ' + esc(x.p) + ')' : ''); }).join(' · ') + '</p>';
    if (s.cracks && (s.cracks.laps || (s.cracks.sizes || []).length)) o += '<p>' + (s.cracks.laps ? esc(s.cracks.laps) + ' laps' : 'Cracks') + ((s.cracks.sizes || []).length ? ' · ' + esc(s.cracks.sizes.join(', ')) : '') + (s.cracks.where ? ' · ' + esc(s.cracks.where) : '') + '</p>';
    if (s.routes && s.routes.length) o += '<div class="kv">' + s.routes.map(function (r) { return '<div><span><b>' + esc(r.n) + '</b> ' + esc(r.g || '') + '</span><span>' + esc(r.style || '') + '</span></div>'; }).join('') + '</div>';
    if (s.where && !s.routes) o += '<p>' + esc(s.where) + '</p>';
    if (s.notes) o += '<p class="note">' + esc(s.notes) + '</p>';
    return o;
  }
  function viewLog() {
    var all = allSessions(), f = ui.logFilter, list = f === 'all' ? all : all.filter(function (s) { return sKind(s) === f; });
    var h = '<section class="hero"><span class="mono">' + all.length + ' sessions</span><h1>Log</h1></section>' + notes();
    h += '<div class="card"><h3>Log a session</h3><div class="chips">' + [['today', 'Today’s session'], ['lift1', 'Lift 1'], ['lift3', 'Lift 3'], ['kpower', 'Kilter power'], ['kstrength', 'Kilter strength'], ['sat', 'Laps and traverse'], ['cracks', 'Cracks'], ['outside', 'Outside day'], ['other', 'Something else']].map(function (o) { return '<button type="button" class="chip" data-act="start" data-sid="' + o[0] + '">' + o[1] + '</button>'; }).join('') + '</div></div>';
    h += '<div class="chips" role="group" aria-label="Filter">' + [['all', 'All']].concat(Object.keys(KIND_LABEL).map(function (k) { return [k, KIND_LABEL[k]]; })).map(function (o) { return '<button type="button" class="chip" data-act="logfilter" data-v="' + o[0] + '" aria-pressed="' + (f === o[0]) + '">' + o[1] + '</button>'; }).join('') + '</div>';
    if (!list.length) return h + '<p class="muted">' + (all.length ? 'No sessions of this kind yet.' : 'Nothing logged yet. Start today’s session from the Today tab, or pick one above.') + '</p>';
    var curMon = '';
    list.forEach(function (s) {
      var m = monOf(s.date);
      if (m !== curMon) { curMon = m; var w = weekNo(parse(m)), st = weekStats(m); h += '<div class="wk-head"><h2>' + (w >= 1 && w <= 13 ? 'Week ' + w + ' · ' + PH[phaseOf(w)].l : 'Week of ' + esc(fmt(m))) + '</h2><span class="mono muted">' + (w >= 1 && w <= 13 ? esc(fmt(m)) + ' · ' : '') + (st.load ? 'load ' + Math.round(st.load).toLocaleString() : st.lifts + st.climbs + ' sessions') + '</span></div>'; }
      var meta = []; if (s.mins) meta.push(s.mins + ' min'); if (s.rpe) meta.push('effort ' + s.rpe);
      var sum = s.ex ? s.ex.length + ' exercises' : s.probs ? s.probs.filter(function (p) { return p.sent && !p.warm; }).length + ' of ' + s.probs.filter(function (p) { return !p.warm; }).length + ' sent' : s.trav && s.trav.sets ? r1(s.trav.sets.reduce(function (n, x) { return n + (num(x.m) || 0); }, 0)) + ' min traverse' : s.cracks && s.cracks.laps ? s.cracks.laps + ' laps' : s.routes ? s.routes.length + ' routes' : s.where || '';
      h += '<details class="entry"><summary><span class="d">' + esc(fmt(s.date, { weekday: 'short' })) + '<small>' + esc(fmt(s.date)) + '</small></span><span class="sum-main"><b>' + esc(s.title) + '</b><span class="small muted">' + esc([sum].concat(meta).filter(Boolean).join(' · ')) + '</span></span><span class="pill">' + (KIND_LABEL[sKind(s)] || 'Other') + '</span></summary><div class="body">' + sessionDetail(s) +
        '<div class="row"><button class="btn quiet sm" data-act="edit" data-id="' + s.id + '">Edit</button><button class="link' + (ui.armed === s.id ? ' armed' : '') + '" data-act="del" data-id="' + s.id + '">' + (ui.armed === s.id ? 'Tap again to delete' : 'Delete') + '</button></div></div></details>';
    });
    return h;
  }

  /* ---------- Progress ---------- */
  function barChart(weeks, series, opt) {
    var cur = weekNo(today0()), max = opt.max || 1;
    weeks.forEach(function (x) { series.forEach(function (s) { max = Math.max(max, s.get(x.st) || 0); }); });
    if (!opt.max) { var mag = Math.pow(10, Math.floor(Math.log10(max))); max = Math.ceil(max / mag) * mag; if (max / mag > 5 && max % (2 * mag)) max += mag; }
    var cols = 'grid-template-columns:repeat(' + weeks.length + ',1fr)';
    var h = '<div class="chart" style="' + cols + '" role="img" aria-label="' + esc(opt.label) + '"><div class="gl" style="bottom:100%"><span>' + (opt.fmt ? opt.fmt(max) : max) + '</span></div><div class="gl" style="bottom:50%"><span>' + (opt.fmt ? opt.fmt(max / 2) : max / 2) + '</span></div>';
    h += weeks.map(function (x) {
      var tip = (x.w ? 'Week ' + x.w + ' · ' + PH[x.ph].l + '\n' : '') + 'Week of ' + fmt(x.monS) + '\n' + series.map(function (s) { var v = s.get(x.st); return s.name + ': ' + (v ? (opt.tipFmt ? opt.tipFmt(v) : v) : '–'); }).join('\n');
      return '<div class="col' + (series.length === 1 ? ' one' : '') + (x.w === cur || (!x.w && x.monS === ymd(monday(today0()))) ? ' cur' : '') + '" tabindex="0" data-tip="' + esc(tip) + '">' + series.map(function (s) { var v = s.get(x.st) || 0; return '<i class="' + s.cls + '" style="height:' + (v / max * 100) + '%"></i>'; }).join('') + '</div>';
    }).join('') + '</div><div class="xlab" style="' + cols + '">' + weeks.map(function (x) { return '<span' + (x.w === cur ? ' class="cur"' : '') + '>' + (x.w || parse(x.monS).getDate()) + '</span>'; }).join('') + '</div>';
    if (series.length > 1) h += '<div class="legend">' + series.map(function (s) { return '<span><i class="' + s.cls + '" style="background:var(--' + (s.cls === 'a' ? 's1' : 's2') + ')"></i>' + s.name + '</span>'; }).join('') + '</div>';
    return h;
  }
  function mini(title, weeks, get, unit, o) {
    o = o || {};
    var pts = []; weeks.forEach(function (x, i) { var v = get(x.st, x); if (v != null && v !== 0 || (v === 0 && o.zero)) pts.push({ i: i, v: v, x: x }); });
    var body = '<div class="spark"></div>', val = '–', delta = '';
    if (pts.length) {
      var vs = pts.map(function (p) { return p.v; }), lo = Math.min.apply(null, vs), hi = Math.max.apply(null, vs), span = hi - lo || 1, n = Math.max(3, pts[pts.length - 1].i);
      var xy = pts.map(function (p) { return [p.i / n * 100, 34 - (p.v - lo) / span * 28]; });
      var line = xy.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' ');
      body = '<div class="spark" role="img" aria-label="' + esc(title) + ' by week">' + (pts.length > 1 ? '<svg viewBox="0 0 100 40" preserveAspectRatio="none"><path class="area" d="' + line + ' L' + xy[xy.length - 1][0].toFixed(1) + ' 40 L' + xy[0][0].toFixed(1) + ' 40 Z"/><path d="' + line + '"/></svg>' : '') +
        pts.map(function (p, i) { return '<span class="pt' + (i === pts.length - 1 ? ' end' : '') + '" tabindex="0" style="left:' + xy[i][0].toFixed(1) + '%;top:' + (xy[i][1] / 40 * 100).toFixed(1) + '%" data-tip="' + esc((p.x.w ? 'Week ' + p.x.w : fmt(p.x.monS)) + ': ' + r1(p.v) + (unit ? ' ' + unit : '')) + '"></span>'; }).join('') + '</div>';
      var last = pts[pts.length - 1].v, first = pts[0].v, d = r1(last - first);
      val = (o.plus && last > 0 ? '+' : '') + r1(last);
      delta = pts.length > 1 ? '<span class="d' + (o.good && d * o.good > 0 ? ' up' : '') + '">' + (d > 0 ? '+' : '') + d + ' since week ' + (pts[0].x.w || 1) + '</span>' : '<span class="d">1 week logged</span>';
    }
    return '<div class="mini"><span class="t">' + esc(title) + '</span><span class="v">' + val + '<small>' + esc(unit || '') + '</small></span>' + body + delta + '</div>';
  }
  function viewProgress() {
    var weeks = chartWeeks(), monS = ymd(monday(today0())), ws = weekStats(monS), items = S.kilter.items.filter(function (x) { return x.list !== 'Warm-up circuit'; });
    var sent = items.filter(function (x) { return x.status === 'Sent'; }).length;
    var h = '<section class="hero"><span class="mono">' + (blockStart() ? 'Week ' + Math.max(1, Math.min(13, weekNo(today0()))) + ' of 13' : 'Last 8 weeks') + '</span><h1>Progress</h1><p class="muted small">Deload and test weeks dip by design. Compare Build, Strength and Peak weeks for the real trend.</p></section>' + notes();
    h += '<div class="tiles"><div class="tile"><b>' + ws.lifts + '<small> /2</small></b><span>lifts this week</span></div><div class="tile"><b>' + ws.climbs + '<small> /4</small></b><span>climbs this week</span></div><div class="tile"><b>' + sent + '<small> /' + items.length + '</small></b><span>board problems sent</span></div></div>';
    h += '<section class="stack"><div class="sec-head"><h2>Sessions done</h2><span class="mono">Per week</span></div><div class="card">' + barChart(weeks, [{ name: 'Lifts, of 2', cls: 'a', get: function (s) { return s.lifts; } }, { name: 'Climbs, of 4', cls: 'b', get: function (s) { return s.climbs; } }], { max: 4, label: 'Lifts and climbs done in each week' }) + '</div></section>';
    h += '<section class="stack"><div class="sec-head"><h2>Training load</h2><span class="mono">Effort × minutes</span></div><div class="card">' + barChart(weeks, [{ name: 'Load', cls: 'a', get: function (s) { return s.load; } }], { label: 'Weekly training load', fmt: function (v) { return v >= 1000 ? r1(v / 1000) + 'k' : v; }, tipFmt: function (v) { return Math.round(v).toLocaleString(); } }) + '</div></section>';
    var lifts = [['Pull-up', 'Pull-up, added', true], ['Bench press', 'Bench press'], ['Seated dumbbell shoulder press', 'Shoulder press, per hand'], ['Barbell row', 'Barbell row'], ['Romanian deadlift', 'Romanian deadlift, per hand'], ['High-box step-up', 'Step-up, per hand']];
    h += '<section class="stack"><div class="sec-head"><h2>Top working weight</h2><span class="mono">lb, by week</span></div><div class="minis">' + lifts.map(function (l) { return mini(l[1], weeks, function (s) { return s.top[l[0]] != null ? s.top[l[0]] : null; }, 'lb', { plus: l[2], good: 1 }); }).join('') + '</div><p class="small muted">A lower number is not always a step back: the first week of a block often starts too heavy, and reps count before weight does.</p></section>';
    h += '<section class="stack"><div class="sec-head"><h2>Traverse</h2><span class="mono">Minutes on the wall</span></div><div class="card">' + barChart(weeks, [{ name: 'Total minutes', cls: 'a', get: function (s) { return s.trav; } }, { name: 'Longest set', cls: 'b', get: function (s) { return s.travMax; } }], { label: 'Traverse minutes per week, total and longest set', tipFmt: function (v) { return r1(v) + ' min'; } }) + '</div></section>';
    h += '<section class="stack"><div class="sec-head"><h2>Recovery</h2><span class="mono">Weekly check-in averages</span></div><div class="minis">' + mini('Sleep', weeks, function (s) { return s.sleep; }, 'h', { good: 1 }) + mini('Energy, 1–5', weeks, function (s) { return s.energy; }, '', { good: 1 }) + mini('Soreness, 0–5', weeks, function (s) { return s.sore; }, '', { zero: true, good: -1 }) + mini('Worst pain, 0–10', weeks, function (s) { return s.pain; }, '', { zero: true, good: -1 }) + mini('Body weight', weeks, function (s) { return s.bw; }, 'lb') + '</div></section>';
    // Board pyramid
    var grades = {}; items.forEach(function (x) { var g = x.g || '?'; if (!grades[g]) grades[g] = { s: 0, p: 0 }; if (x.status === 'Sent') grades[g].s++; else grades[g].p++; });
    var gk = Object.keys(grades).sort(function (a, b) { return (parseFloat(b.slice(1)) + (b.indexOf('+') > 0 ? .5 : 0)) - (parseFloat(a.slice(1)) + (a.indexOf('+') > 0 ? .5 : 0)); });
    var gmax = Math.max.apply(null, gk.map(function (g) { return grades[g].s + grades[g].p; }).concat([1]));
    h += '<section class="stack"><div class="sec-head"><h2>Board problems</h2><span class="mono">' + sent + ' sent · ' + (items.length - sent) + ' projecting</span></div>';
    if (!items.length) h += '<p class="muted">Problems you log in board sessions collect here by grade.</p>';
    else {
      h += '<div class="card"><div class="pyr" role="img" aria-label="Problems sent and projecting at each grade">' + gk.map(function (g) { var x = grades[g]; return '<span class="g">' + esc(g) + '</span><div class="bar" tabindex="0" data-tip="' + esc(g + '\nSent: ' + x.s + '\nProjecting: ' + x.p) + '">' + (x.s ? '<i style="width:' + (x.s / gmax * 100) + '%"></i>' : '') + (x.p ? '<i class="pj" style="width:' + (x.p / gmax * 100) + '%"></i>' : '') + '</div><span class="n">' + x.s + ' / ' + (x.s + x.p) + '</span>'; }).join('') + '</div><div class="legend"><span><i style="background:var(--s1)"></i>Sent</span><span><i style="border:1px solid var(--s1);background:repeating-linear-gradient(135deg,var(--s1) 0 2px,transparent 2px 5px)"></i>Projecting</span></div></div>';
      var proj = items.filter(function (x) { return x.status !== 'Sent'; });
      h += '<details class="more"><summary>Show the ' + proj.length + ' projects and their notes</summary><div class="stack">' + proj.map(function (x) { return '<details class="entry"><summary><span class="d">' + esc(x.g || '') + '</span><span class="sum-main"><b>' + esc(x.n) + '</b><span class="small muted">' + esc([x.style, x.list, x.sessions ? x.sessions + (x.sessions === 1 ? ' session' : ' sessions') : ''].filter(Boolean).join(' · ')) + '</span></span><span class="pill dash">Project</span></summary><div class="body"><p class="note">' + esc(x.notes || 'No notes yet.') + '</p></div></details>'; }).join('') + '</div></details>';
    }
    h += '</section>';
    h += '<section class="stack"><div class="sec-head"><h2>Tests</h2><span class="mono">Weeks 1, 5, 9 and 13</span></div><div class="card scrollx"><table class="tests"><thead><tr><th>Test</th><th>Wk 1</th><th>Wk 5</th><th>Wk 9</th><th>Wk 13</th></tr></thead><tbody>' + TESTS.map(function (t) { var r = S.tests.rows[t[0]] || {}; return '<tr><td>' + esc(t[1]) + '</td>' + ['w1', 'w5', 'w9', 'w13'].map(function (k) { return '<td><input id="t-' + t[0] + k + '" data-test="' + t[0] + '.' + k + '" value="' + esc(r[k] || '') + '" aria-label="' + esc(t[1] + ', ' + k.replace('w', 'week ')) + '"></td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div><p class="small muted">Estimate lifting rep maxes from your working sets in week 1 instead of testing to failure.</p></section>';
    return h;
  }

  /* ---------- Areas ---------- */
  function viewAreas() {
    var cur = curArea();
    return '<section class="hero"><span class="mono">' + AREAS.length + ' areas</span><h1>Areas</h1><p class="muted small">Each area is rated on what its rock asks of you. Choose one and the block swaps in the sessions it rewards. Three carry the tick lists and trip plans from your trip boards; the rest follow your <a href="' + URL.gear + '">Climbing Gear</a> pages.</p></section>' + notes() +
      '<div class="cards">' + AREAS.map(function (a) { return areaCard(a, cur && cur.id === a.id); }).join('') + '</div>';
  }
  function viewArea(id) {
    var a = AREA[id]; if (!a) return viewAreas();
    var d = DETAIL[id], cur = curArea(), active = cur && cur.id === id, st = active ? S.settings : {};
    var h = '<section class="hero"><a class="small" href="#areas">All areas</a><span class="mono">' + esc(a.st) + ' · ' + esc(a.rock) + '</span><h1>' + esc(a.name) + '</h1><p class="muted small">' + esc(a.style) + '</p></section>' + notes();
    h += '<section class="card' + (active ? ' key' : '') + '"><div class="row between"><h3>' + (active ? 'You’re training for this area' : 'Train for this area') + '</h3>' + (active ? '<span class="pill solid">Active</span>' : '') + '</div>';
    if (active) h += '<div class="grid2"><label class="f" for="t-start">Trip starts<input type="date" id="t-start" data-trip="start" value="' + esc(st.start || '') + '"></label><label class="f" for="t-end">Trip ends<input type="date" id="t-end" data-trip="end" value="' + esc(st.end || '') + '"></label></div><p class="small muted">' + esc(specificity(monday(today0())).label || '') + '</p><div class="row"><a class="btn" href="#plan">See the plan</a><button class="link" data-act="untrain">Stop training for this area</button></div>';
    else h += '<p class="small muted">The plan switches its key sessions to suit ' + esc(a.short || a.name) + '. Your log stays as it is.</p><div class="row"><button class="btn" data-act="train" data-id="' + id + '">Train for ' + esc(a.short || a.name) + '</button></div>';
    h += '</section>';
    h += '<section class="stack"><div class="sec-head"><h2>What the rock asks for</h2></div><div class="card"><div class="bars">' + DIMS.map(function (dm, i) {
      var p = ''; for (var k = 1; k <= 5; k++) p += '<i' + (k <= a.s[i] ? ' class="on"' : '') + '></i>';
      return '<div class="bar"><span>' + dm[1] + '</span><div class="pips" role="img" aria-label="' + a.s[i] + ' out of 5">' + p + '</div><span class="val">' + a.s[i] + '/5</span></div>';
    }).join('') + '</div></div></section>';
    var sw = ORDER.normal.map(function (sid, i) { var x = areaSwap(a, sid, 'build'); return x ? { d: DOW[i], sid: sid, x: x } : null; }).filter(Boolean);
    h += '<section class="stack"><div class="sec-head"><h2>What it changes in your week</h2></div><div class="card" style="gap:0">' + (sw.length ? sw.map(function (o) {
      var base = (LIFT[o.sid] || SESS[o.sid](1)).t, to = o.x.sid ? SESS[o.x.sid](1).t : o.x.force ? 'Laps and ' + o.x.force + ' traverse, every week' : base;
      return '<div style="padding:.55rem 0;border-top:1px solid var(--rule)"><div class="row between"><span><b class="dow" style="display:inline;font-size:1.15rem">' + o.d + '</b> ' + (o.x.sid || o.x.force ? esc(base) + ' becomes <b>' + esc(to) + '</b>' : '<b>' + esc(base) + '</b>') + '</span>' + (o.x.sid ? '<span class="pill solid">Swap</span>' : '') + '</div>' + (o.x.add ? '<p class="small muted">' + esc(o.x.add) + '</p>' : '') + '</div>';
    }).join('') : '<p class="small muted">Nothing: the block is already built for this style.</p>') + '</div><p class="small muted">Swaps apply in Build and Strength weeks, from 8 weeks before the trip. Deload, Peak and Test weeks keep the block as written.</p></section>';
    if (!d) { h += '<section class="card"><h3>Trip plan</h3><p class="small muted">No tick list for this area yet. Its rack check is on your <a href="' + URL.gear + '">Climbing Gear</a> board, and the <a href="' + URL.camp + '">camping checklist</a> covers camp.</p></section>'; return h; }
    if (d.todo) {
      var ck = S.checks[id] || {};
      h += '<section class="stack"><div class="sec-head"><h2>Before you go</h2><span class="mono">' + d.todo.filter(function (_, i) { return ck[i]; }).length + ' / ' + d.todo.length + '</span></div><div class="card" style="gap:0">' + d.todo.map(function (t, i) {
        return '<label class="check' + (ck[i] ? ' on' : '') + '" for="ck-' + i + '"><input type="checkbox" id="ck-' + i + '" data-check="' + id + '" data-i="' + i + '"' + (ck[i] ? ' checked' : '') + '><span class="stack" style="gap:.1rem"><b>' + esc(t[0]) + '</b><span class="small muted">' + esc(t[1]) + '</span></span><span class="pill' + (t[2] === 'Optional' ? '' : t[2] === 'Confirm' ? ' dash' : ' solid') + '">' + t[2] + '</span></label>';
      }).join('') + '</div></section>';
    }
    h += '<section class="stack"><div class="sec-head"><h2>Rack to carry</h2><a href="' + URL.gear + '">Your full rack</a></div><div class="card"><p class="small muted">' + esc(d.rackNote) + '</p><div class="cams">' + d.carry.map(function (c) { return '<div class="cam"><i style="background:' + CAM_COLOR[c[0]] + '"></i><b>' + (c[0].charAt(0) === '.' ? c[0] : '#' + c[0]) + '</b><span>' + esc(c[1]) + '</span></div>'; }).join('') + '</div></div></section>';
    h += '<section class="stack"><div class="sec-head"><h2>Know before you rack</h2></div><div class="card" style="gap:0">' + d.know.map(function (k) { return '<p class="small" style="padding:.5rem 0;border-top:1px solid var(--rule)">' + esc(k) + '</p>'; }).join('') + '</div></section>';
    if (d.camp) h += '<section class="stack"><div class="sec-head"><h2>Camp</h2><a href="' + URL.camp + '">Camping checklist</a></div><div class="card"><div class="facts">' + d.camp.map(function (f) { return '<div class="fact"><b>' + esc(f[0]) + '</b><span class="muted">' + esc(f[1]) + '</span></div>'; }).join('') + '</div></div></section>';
    var tk = S.ticks[id] || {}, tf = ui.tf, tc = tickCounts(id), hasSport = d.routes.some(function (r) { return r[3] === 'S'; });
    var rows = d.routes.filter(function (r) { var stt = tk[slug(r[1])] || 'w'; return (tf.band === 'all' || band(r[0]) === tf.band) && (tf.type === 'all' || r[3] === tf.type) && (tf.status === 'all' || stt === tf.status); });
    function seg(key, opts) { return '<div class="seg" role="group">' + opts.map(function (o) { return '<button type="button" data-act="tf" data-k="' + key + '" data-v="' + o[0] + '" aria-pressed="' + (tf[key] === o[0]) + '">' + o[1] + '</button>'; }).join('') + '</div>'; }
    h += '<section class="stack" id="ticks"><div class="sec-head"><h2>Tick list</h2><span class="mono">' + tc.sent + ' sent · ' + tc.tried + ' tried · ' + tc.total + ' routes</span></div><div class="row">' + seg('band', [['all', 'All'], ['9', '≤5.9'], ['10', '5.10'], ['11', '5.11'], ['12', '5.12']]) + (hasSport ? seg('type', [['all', 'All'], ['S', 'Sport'], ['T', 'Trad']]) : '') + seg('status', [['all', 'All'], ['w', 'To try'], ['t', 'Tried'], ['s', 'Sent']]) + '</div>';
    if (!rows.length) h += '<p class="muted">No routes match these filters.</p>';
    ['9', '10', '11', '12'].forEach(function (b) {
      var rs = rows.filter(function (r) { return band(r[0]) === b; }); if (!rs.length) return;
      h += '<div class="band"><h3>' + BAND_LABEL[b] + '<small>' + rs.length + (rs.length === 1 ? ' route' : ' routes') + '</small></h3>' + rs.map(function (r) {
        var key = slug(r[1]), stt = tk[key] || 'w';
        return '<div class="route"><span class="g">' + esc(r[0]) + '</span><span class="n"><b>' + esc(r[1]) + '</b><span>' + esc(r[2]) + (hasSport ? ' · ' + (r[3] === 'S' ? 'Sport' : 'Trad') : '') + '</span>' + (r[4] ? '<em>' + esc(r[4]) + '</em>' : '') + '</span><div class="seg status" role="group" aria-label="Status"><button type="button" data-act="tick" data-id="' + id + '" data-key="' + key + '" data-v="t" aria-pressed="' + (stt === 't') + '">Tried</button><button type="button" data-act="tick" data-id="' + id + '" data-key="' + key + '" data-v="s" aria-pressed="' + (stt === 's') + '">Sent</button></div></div>';
      }).join('') + '</div>';
    });
    h += '</section><p class="foot">Routes, rack and camp notes come from your <a href="' + d.board + '">' + esc(a.name) + ' trip board</a>' + (d.extra ? d.extra.map(function (x) { return ' and your <a href="' + x[1] + '">' + esc(x[0]) + '</a>'; }).join('') : '') + '. Check route gear beta before racking up.</p>';
    return h;
  }

  /* ---------- Data ---------- */
  function viewAccount() {
    var n = allSessions().length, where = cloud() ? (sess ? 'Synced to your account, ' + esc(sess.email || '') + '. This device also keeps a copy.' : 'Sign in on the Today tab to sync.') : 'Saved in this browser on this device only. It does not sync to your other devices, and clearing site data erases it, so export a backup now and then.';
    return '<section class="hero"><span class="mono">' + n + ' sessions</span><h1>Data</h1><p class="muted small">' + where + '</p></section>' + notes() + (ui.dataMsg ? '<p class="msg" role="status">' + esc(ui.dataMsg) + '</p>' : '') +
      '<section class="card"><h3>Back up</h3><p class="small muted">Downloads everything in the app as one file: sessions, check-ins, plan notes, problems, tests, tick lists and settings.</p><div class="row"><button class="btn" data-act="export">Export a backup</button></div></section>' +
      '<section class="card"><h3>Import</h3><p class="small muted">Loads a backup or history file. Items in the file replace the same weeks and lists here; everything else stays.</p><label class="f" for="imp">Choose a file<input type="file" id="imp" accept=".json,application/json"></label></section>' +
      '<section class="card"><h3>Move to another device</h3><p class="small muted">Export a backup here, send the file to the other device, and import it there.' + (cloud() ? '' : ' Automatic sync can be switched on later by adding a database to config.js.') + '</p></section>' +
      (cloud() && sess ? '<section class="card"><h3>Account</h3><div class="row"><button class="btn quiet" data-act="signout">Sign out</button></div><p class="small muted">Signing out removes the copy on this device. Your account keeps everything.</p></section>' : '') +
      '<section class="card"><h3>Start over</h3><p class="small muted">Erases everything in the app on this device' + (cloud() && sess ? ' and in your account' : '') + '.</p><div class="row"><button class="link' + (ui.armed === 'wipe' ? ' armed' : '') + '" data-act="wipe">' + (ui.armed === 'wipe' ? 'Tap again to erase everything' : 'Erase all data') + '</button></div></section>';
  }
