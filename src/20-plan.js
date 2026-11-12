
  /* ---------- The 13-week block ---------- */
  var PHASES = [
    { k: 'build', name: 'Build', from: 1, to: 4, sum: 'Kilter strength at V4–V5, power at V2–V4 and Tindeq pulls at 80%. Lifts leave 2–3 reps in reserve.' },
    { k: 'deload', name: 'Deload', from: 5, to: 5, base: 'build', sum: 'Half volume on everything: the same lifts and weights with about half the sets, no Kilter strength main set and no Tindeq training pulls. The Tindeq test and your retest problems close the week.' },
    { k: 'strength', name: 'Strength', from: 6, to: 8, sum: 'Kilter strength one grade above your hardest send, power at V4–V5 and Tindeq pulls at 85–90%. Lifts get heavier and leave 2 reps in reserve.' },
    { k: 'deload', name: 'Deload', from: 9, to: 9, base: 'strength', sum: 'Same as week 5. Then choose weeks 10–12: power endurance, or repeat the strength phase if your outdoor season is still months away.' },
    { k: 'pe', name: 'Power endurance', from: 10, to: 12, sum: 'Lifting drops to maintenance. Tuesday becomes 4x4s, Saturday becomes laps and traverse intervals, and Sunday links crack laps back to back.' },
    { k: 'test', name: 'Test', from: 13, to: 13, base: 'pe', sum: 'Climb and lift easy apart from the tests: lifting retest, Tindeq test, hardest Kilter sends and retest problems, and your longest nonstop traverse.' }
  ];
  function phaseOf(w) { for (var i = 0; i < PHASES.length; i++) if (w >= PHASES[i].from && w <= PHASES[i].to) return PHASES[i]; return null; }

  var KIND = {
    lift1: { t: 'Lift 1: heavy pull', s: 'Lift 1', cat: 'lift', mins: '45–60 min', tags: ['pow'],
      focus: 'Full body, built around heavy pull-ups. They go first while you are fresh, because they carry over to climbing more than any other lift.' },
    kpower: { t: 'Kilter power', s: 'Kilter power', cat: 'climb', mins: '75 min', key: 1, tags: ['pow'],
      focus: 'Explosive but controlled movement on the Kilter Original 8x12 at 40°, on problems at or below your flash level.' },
    rest: { t: 'Rest day', s: 'Rest', cat: 'rest', tags: [],
      focus: 'A full rest day, for recovery and room for life, so the next board session stays fresh.' },
    kstrength: { t: 'Kilter strength', s: 'Kilter strength', cat: 'climb', mins: '90 min', key: 1, tags: ['fing', 'pow'],
      focus: 'Your main finger-strength day: limit problems with full rest on crimpy terrain with small feet, the closest the board gets to face climbing outside.' },
    lift3: { t: 'Lift 3: heavy legs and push', s: 'Lift 3', cat: 'lift', mins: '45–60 min', tags: [],
      focus: 'Heavy lower-body and pressing work first. It follows your hardest finger day, so the only pulling is a few easy pull-ups.' },
    sat: { t: 'Boulder laps and traverse', s: 'Laps + traverse', cat: 'climb', mins: '90 min', key: 1, tags: ['end', 'foot'],
      focus: 'The endurance and footwork the board does not build: boulder laps first, then the traverse.' },
    cracks: { t: 'Cracks', s: 'Cracks', cat: 'climb', mins: '45–90 min', tags: ['crack'],
      focus: 'Crack mileage, outside when you can. Saturday is a climbing day too, so stay at comfortable grades.' },
    travel: { t: 'Travel day', s: 'Travel', cat: 'rest', tags: [],
      focus: 'No training. Arrive loose, fed and rested.' },
    outside: { t: 'Outside', s: 'Outside', cat: 'climb', tags: ['multi'],
      focus: 'Real rock. Warm up longer than in the gym, do the hard climbing late morning, and stop while your skin and fingers are still good.' },
    lift2: { t: 'Lift 2 (retired)', s: 'Lift 2', cat: 'other', tags: [], focus: 'The old Wednesday lift. Wednesday is now a full rest day.' },
    other: { t: 'Other session', s: 'Other', cat: 'other', tags: [], focus: '' }
  };
  var DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // name, sets x reps by phase, rest, cue, unit
  var LIFT = {
    lift1: [
      ['Pull-up', { build: [4, '6–8'], strength: [5, '4–6'], pe: [3, '4–6'] }, { build: '2–3 min', strength: '3–4 min', pe: '3–4 min' }, 'Full hang at the bottom, chest toward the bar, no kipping. Add weight once every set hits the top of the range.', 'added lb'],
      ['Seated dumbbell shoulder press', { build: [3, '8–10'], strength: [3, '6–8'], pe: [2, '6–8'] }, '90 s–2 min', 'Press with your palms facing each other if your shoulder pinches.', 'lb per hand'],
      ['High-box step-up', { build: [3, '8'], strength: [3, '6–8'], pe: [2, '6–8'] }, '90 s–2 min', 'Reps are per leg. Drive through the whole foot on the box and don’t push off the bottom foot.', 'lb per hand'],
      ['Barbell row', { build: [3, '10–12'], strength: [3, '8–10'], pe: [2, '8–10'] }, '90 s–2 min', 'Hinge to about 45° with a flat back and pull the bar to your lower ribs.', 'lb'],
      ['Hanging knee raise', { build: [3, '10–12'], strength: [3, '6–8'], pe: [2, '8–10'] }, '45–75 s', 'No swinging. From week 6 this becomes toes-to-bar, which trains the body tension that keeps feet on steep terrain.', ''],
      ['Cable external rotation', { build: [2, '12–15'], strength: [2, '12–15'], pe: [2, '12–15'] }, '45–60 s', 'Reps are per arm. Keep your elbow pinned to your side and rotate out slowly.', 'lb']
    ],
    lift3: [
      ['Romanian deadlift', { build: [3, '8–10'], strength: [4, '6–8'], pe: [3, '6–8'] }, '2–3 min', 'Hips back first, then hinge until you feel the hamstring stretch, weights close to your legs. Use straps: grip is not the point here.', 'lb per hand'],
      ['Bench press', { build: [3, '8–10'], strength: [4, '5–6'], pe: [3, '5–6'] }, { build: '2–3 min', strength: '3–4 min', pe: '3–4 min' }, 'Before the bar: 2 × 15 band pull-aparts and 2 × 10 scap push-ups to set your shoulder blades back and down.', 'lb'],
      ['Pendulum squat', { build: [2, '10–12'], strength: [2, '8–10'], pe: [2, '8–10'] }, '90 s–2 min', 'Lower for 3 seconds, pause for 2 at the bottom with your heels flat, then stand up smoothly. Loaded mobility, not a max-effort leg day.', 'lb'],
      ['Pull-up, bodyweight (easy)', { build: [3, '5–8'], strength: [3, '5–8'], pe: [3, '5–8'] }, '90 s–2 min', 'No added weight, and stop 3 or more reps short of failure. Lat pulldowns instead if your fingers are sore.', ''],
      ['Rear delt fly', { build: [3, '15'], strength: [3, '15'], pe: [2, '15'] }, '45–75 s', 'Machine or dumbbells, light weight. Keeps shoulders healthy.', 'lb'],
      ['Lateral raise', { build: [3, '12–15'], strength: [3, '12–15'], pe: [2, '12–15'] }, '45–75 s', 'Light, no swinging, lead with your elbows.', 'lb'],
      ['Side plank', { build: [3, '30–40 s'], strength: [3, '40 s'], pe: [3, '45 s'] }, '45–60 s', 'Times are per side. Keep a straight line from head to heels.', '']
    ]
  };
  var EFFORT = { build: 'Leave 2–3 reps in reserve on every set.', strength: 'Leave 2 reps in reserve, and 1 only on the last pull-up set.', pe: 'Maintenance: about two-thirds of the sets at your week 8 weights, 2–3 reps in reserve. Climbing comes first this phase.', deload: 'Deload: the same weights with about half the sets.', test: 'Test week: lift easy apart from the retests, and write the numbers in Progress.' };

  function exercises(kind, dp) {
    var rows = LIFT[kind]; if (!rows) return [];
    var ph = phaseOf(dp.w), base = ph.base || ph.k, half = ph.k === 'deload' || ph.k === 'test';
    var out = [];
    rows.forEach(function (r) {
      var sr = r[1][base], sets = sr[0], reps = sr[1], name = r[0];
      if (name === 'Hanging knee raise' && dp.w >= 6) name = 'Toes-to-bar';
      if (name === 'Pendulum squat' && dp.w < 2) return;
      if (name === 'Lateral raise' && dp.w < 2) return;
      if (half) sets = Math.max(1, Math.ceil(sets / 2));
      if (half && name === 'Pendulum squat') sets = 1;
      var note = '';
      if (dp.cut) {
        if (name === 'Romanian deadlift') { sets = Math.min(sets, 2); note = 'Trip week: 2 sets at last week’s weight, 3 in reserve, no new weight.'; }
        if (name === 'Pendulum squat') { sets = 1; note = 'Trip week: 1 set.'; }
        if (name === 'Pull-up, bodyweight (easy)') return;
      }
      if (dp.ak2 && name === 'Pull-up, bodyweight (easy)') { sets = Math.min(sets, 2); note = 'Akron week: 2 sets, because Kilter strength was yesterday and Kilter power is tomorrow.'; }
      var rest = typeof r[2] === 'string' ? r[2] : r[2][base];
      out.push({ n: name, sets: sets, reps: reps, t: sets + ' × ' + reps + (/step-up/.test(name) ? ' each leg' : /rotation/.test(name) ? ' each arm' : /plank/.test(name) ? ' each side' : ''), rest: rest, cue: r[3], unit: r[4], note: note });
    });
    return out;
  }

  var WARM = 'Climbing warm-up, steps 1–4 (see Library), then rest 8–10 min before the main set.';
  var COOL = '3–5 min easy traversing, then reverse wrist curls 2 × 15 and finger-extensor bands 2 × 20, then stretch forearms, lats and hip flexors.';
  var TRAV = { 2: 'tech', 3: 'end', 4: 'tech', 6: 'end', 7: 'tech', 8: 'end' };
  var TRAV_END = { 3: '4 × 6 min with 1–2 min rest', 6: '3 × 8 min with 2 min rest', 8: '2 × 12 min with 3 min rest' };

  function tindeqText(ph) {
    if (ph.k === 'build') return 'Ramp-up at about 50%, 70% and 85%, then 3 × 7–10 s per hand at 80% of your tested max, on the 20 mm edge in a half crimp, standing on the footboard. Skip it if your fingers feel tweaky.';
    if (ph.k === 'strength') return 'Ramp-up, then 3–5 × 7–10 s per hand at 85–90% of your latest test if your fingers are pain-free. Otherwise stay at 80%.';
    return 'Ramp-up, then 3 × 7–10 s per hand at 85–90% of your latest test.';
  }
  function hasPulls(w) { var ph = phaseOf(w); return w >= 2 && (ph.k === 'build' || ph.k === 'strength' || ph.k === 'pe'); }

  // The ordered parts of a session: { k, t, target, rest }
  function parts(kind, dp) {
    var w = dp.w, ph = phaseOf(w), k = ph.k, P = [];
    function add(key, title, target, rest) { P.push({ k: key, t: title, target: target, rest: rest || '' }); }
    if (kind === 'lift1' || kind === 'lift3') {
      add('warm', 'Lifting warm-up', '5 min of easy cardio and band pull-aparts, then ankle work (knee-to-wall rocks 2 × 10 each side, heel-elevated goblet squat hold 2 × 30 s), then 2–3 lighter ramp-up sets.');
    } else if (kind === 'kpower') {
      add('warm', 'Warm-up', WARM + ' Finish with 2–3 big moves on good holds at about 80% effort.', '8–10 min');
      if (k === 'pe') add('main', '4x4s', 'Any 4 problems at V1–V3 you can climb without falling. Climb the same 4 back to back each round, for 4 rounds. If round 4 falls apart before the last problem, drop a grade next week; if it is all clean, add one harder problem.', '4 min between rounds');
      else if (k === 'deload') add('main', 'Main set, half volume', 'Any 2–3 fun problems in your usual range, 1–2 tries each.', '2–3 min between tries');
      else if (k === 'test') add('main', 'Main set, easy', '2–3 problems well below your limit.', '2–3 min between tries');
      else add('main', 'Main set', 'Any 4–6 problems at ' + (k === 'strength' ? 'V4–V5' : 'V2–V4') + ' that look fun and have big or committing moves. 2–3 real tries each, then move on. Pick deadpoints and long, controlled moves over jumps and cuts. Stop when moves slow down or you start missing holds by more.', '2–3 min between tries');
      add('cool', 'Cool-down', COOL);
    } else if (kind === 'kstrength') {
      if (hasPulls(w)) add('tindeq', 'Tindeq pulls, the evening before at home', tindeqText(ph), '2–3 min before the same hand');
      add('warm', 'Warm-up', WARM, '8–10 min');
      if (k === 'deload') add('main', 'Retest problems', 'No main set. After the full warm-up, retest your 3 retest problems, fresh.', '3–5 min between tries');
      else if (k === 'test') add('main', 'Retest', 'Retest your hardest Kilter sends and your retest problems.', '3–5 min between tries');
      else if (w === 4 || w === 8) add('main', 'Main set: retest set ' + (w === 4 ? 1 : 2), 'Your retest set, 4–6 tries each, about 20–25 attempts in total. Skip problems whose moves tweak your wrists or shoulders.', '3–5 min between tries');
      else add('main', 'Main set', '3–4 problems you can’t send yet' + (k === 'build' ? ' at V4–V5' : ', one grade above your hardest Kilter send') + ': crimpy, static, small footholds. 4–6 tries each, about 20–25 in total. Stuck? Work single moves, then link them. Stop when two tries in a row get worse.', '3–5 min between tries');
      add('cool', 'Cool-down', COOL);
    } else if (kind === 'sat') {
      add('warm', 'Warm-up', 'Step 1 of the climbing warm-up, then 5–10 min of easy traversing.');
      if (w === 1 || k === 'deload' || k === 'test') add('tindeq', 'Tindeq test, at home before you head out', 'Ramp-up at 50%, 70% and 85%, then the best of 3 max pulls per hand on the 20 mm edge in a half crimp. It sets your training targets. Skip it if your fingers feel tweaky.', '2–3 min before the same hand');
      if (k === 'test') add('laps', 'Boulder laps', 'Skip them this week to stay fresh for the traverse test.');
      else if (k === 'deload') add('laps', 'Boulder laps, optional', '2–3 easy up-and-down laps, well below your max.', '2–3 min between rounds');
      else add('laps', 'Boulder laps', (k === 'pe' ? '3–4' : '4–6') + ' rounds on the least steep wall: climb an easy problem (about V0–V2), down-climb it and climb it again without stepping off, about 2–3 min on the wall. Straight arms, quiet feet, and read the next moves before you go. Pump 3 out of 10 or less.', '2–3 min between rounds');
      if (k === 'test') add('trav', 'Traverse test', 'Time your longest nonstop traverse.');
      else if (k === 'deload') add('trav', 'Traverse, easy', 'An easy traverse with no real pump.');
      else if (k === 'pe') add('trav', 'Traverse intervals', '1 min on harder holds, then 1 min rest, for 6–8 rounds.', '1 min between rounds');
      else if (TRAV[w] === 'end') add('trav', 'Traverse: endurance', TRAV_END[w] + '. Pump no higher than 3–4 out of 10, on a planned loop with 2 rest jugs. Cap set 1 at the target time even when you feel great, and rate your pump for each set.', w === 3 ? '1–2 min between sets' : w === 6 ? '2 min between sets' : '3 min between sets');
      else if (TRAV[w] === 'tech') add('trav', 'Traverse: technique', 'On a planned loop of easy holds with 2 rest jugs, one drill per pass: minimum grip, silent feet, glued feet, small feet only, side-on and frog, then reverse.', '2 min between passes');
      else add('trav', 'Traverse: endurance', '4 × 5 min at a light pump.', '1–2 min between sets');
      add('cool', 'Cool-down', 'Stretch forearms, lats and hip flexors for 30 s each, plus 2 × 60 s frog stretch.');
    } else if (kind === 'cracks') {
      add('warm', 'Warm-up', 'Step 1 of the climbing warm-up, then 1–2 easy laps.');
      if (k === 'pe') add('main', 'Linked crack laps', 'Link 2 laps back to back without resting, for 3–4 rounds. Tape up or wear crack gloves.', '2–3 min between rounds');
      else if (k === 'deload' || k === 'test') add('main', 'Cracks, easy', '2–3 easy laps.', '2–3 min between laps');
      else add('main', 'Cracks', '4–6 laps at a comfortable grade: fingers, hands and fists, with extra laps on off-fingers (#.75), your hardest size. Quiet, precise jams that hold without overgripping.', '2–3 min between laps');
      add('cool', 'Cool-down', 'Stretch forearms, lats and hip flexors.');
    } else if (kind === 'rest') {
      add('rest', 'Rest', 'No climbing and no lifting.');
      if (dp.pulls) add('tindeq', 'This evening at home: Tindeq pulls', 'For tomorrow’s Kilter strength session, after step 1 of the climbing warm-up. ' + tindeqText(ph), '2–3 min before the same hand');
      add('stretch', 'Home stretches', 'The 10-minute routine plus the rest-day add-ons, about 20 min (see Library).');
    } else if (kind === 'travel') {
      add('mob', 'Mobility', '10 min before you leave or at camp: half-kneeling hip flexor stretch, frog stretch and knee-to-wall ankle rocks.');
      add('fuel', 'On the road', 'Stretch breaks on the drive, a real dinner with carbs, and water.');
    } else if (kind === 'outside') {
      add('warm', 'Warm-up', 'Longer than in the gym: step 1 of the climbing warm-up, then 2–3 easy routes that build gradually, all well below your limit. Cold rock and cold fingers are when tendons get tweaked.');
      if (dp.dayN > 1) add('main', 'Day ' + dp.dayN, 'Your fingers are on another day: pick juggy, steep endurance routes over crimpy ones, 1–2 hard tries at most, and finish in time for the drive.', '20–30 min between hard tries');
      else add('main', 'Hard climbing', 'Late morning, once you are warm and still fresh. Pick 1–2 goal routes and rest 20–30 min between hard tries. Shake out at every rest, clip from good holds and keep moving through the cruxes.', '20–30 min between hard tries');
      add('stop', 'When to stop', 'Switch to easy routes for the rest of the day if a finger twinges, your skin gets thin, or two tries in a row get worse.');
      add('cool', 'Finish', '1–2 easy routes, then finger-extensor bands 2 × 20 and stretch forearms, lats and hip flexors. File calluses in the evening.');
    }
    return P;
  }

  function kindTitle(dp) {
    var kind = dp.kind, K = KIND[kind];
    if (kind === 'kpower' && phaseOf(dp.w).k === 'pe') return 'Kilter 4x4s';
    if (kind === 'rest' && dp.akron) return 'Rest day (Akron)';
    if (kind === 'outside') { var a = dp.trip && AREA[dp.trip.d.areaId]; return (a ? a.name : (dp.trip && dp.trip.d.name) || 'Outside') + ', day ' + dp.dayN; }
    return K.t;
  }

  // How the area you are training for bends a session. These are the app's suggestions, layered on the block.
  function areaFocus(kind, a) {
    if (!a) return '';
    var s = a.s, end = s[0], fing = s[1], crack = s[3], foot = s[4], multi = s[5], nm = a.short || a.name;
    if (kind === 'kpower') {
      if (crack >= 5) return 'Cap it at 4 problems. For ' + nm + ', crack mileage matters more than board power this block.';
      if (end >= 4) return nm + ' is decided by pump. After the main set, climb your two easiest problems back to back for 3 rounds with 2 min rest. In the last 3 weeks before the trip, run this session as 4x4s.';
      if (fing >= 4 || foot >= 4) return 'Pick long deadpoints between small holds over jumps to jugs. That reachy, precise power is what ' + nm + ' cruxes ask for.';
      if (multi >= 4) return 'Keep it to 4 problems and leave fresh. ' + nm + ' rewards all-day stamina more than peak power.';
      return '';
    }
    if (kind === 'kstrength') {
      if (crack >= 5) return 'Trade your last problem for 4 hard burns on off-fingers at the static cracks. Jamming strength carries further at ' + nm + ' than crimp strength.';
      if (fing >= 4) return 'Your most trip-specific session: crimpy, static problems on small feet are ' + nm + ' in miniature. Protect it by arriving rested.';
      if (end >= 4) return 'Swap one crimp problem for a steep pinch or sloper problem with big moves between good holds, the way ' + nm + ' climbs.';
      return '';
    }
    if (kind === 'sat') {
      if (crack >= 5) return 'Do the laps on the static cracks instead: link 2 laps without resting, and change size each round.';
      if (end >= 4) return 'The session that matters most for ' + nm + '. Treat rest jugs like clipping stances: shake, breathe, then move. Add a set once every set stays at pump 4 or below.';
      if (multi >= 4) return 'Stretch your time on the wall: finish with one extra 10 min block of easy climbing, the way a long route keeps you moving.';
      if (foot >= 4) return 'Lean on the footwork drills, small feet only and glued feet, and climb the laps at full extension. ' + nm + ' punishes sloppy feet before weak fingers.';
      return '';
    }
    if (kind === 'cracks') {
      if (crack >= 4) return 'Trip-specific mileage. Put extra laps on the sizes ' + nm + ' uses most, and down-climb where you can for endurance.';
      if (crack === 3) return 'Useful for the trad lines at ' + nm + '. Keep the laps smooth and practise placing your feet in the crack.';
      return nm + ' needs little crack technique, so keep Sunday social and easy. For something trip-specific, finish with 3 rounds of linking two easy problems without stepping off.';
    }
    if (kind === 'lift1') {
      if (end >= 4) return 'The knee raises matter most here: body tension keeps your feet on steep rock at ' + nm + '.';
      if (foot >= 4 || multi >= 4) return 'Take the step-ups seriously: high steps on vertical rock are everywhere at ' + nm + '.';
      if (crack >= 4) return 'Rows and pull-ups carry straight over to laybacks and steep jamming at ' + nm + '.';
    }
    return '';
  }
