  /* ---------- The 13-week block ---------- */
  var PHASES = ['', 'build', 'build', 'build', 'build', 'deload', 'build2', 'build2', 'build2', 'deload', 'peak', 'peak', 'peak', 'test'];
  var PH = {
    build: { l: 'Build', d: 'Limit bouldering at V4–V5, power at V2–V4, Tindeq pulls at 80%. Lifts leave 2–3 reps in reserve.' },
    deload: { l: 'Deload', d: 'Half volume on everything: same lifts and weights with about half the sets, no limit bouldering and no Tindeq training pulls. Test, then retest your problems.' },
    build2: { l: 'Strength', d: 'Limit bouldering one grade above your hardest send, power at V4–V5, Tindeq pulls at 85–90%. Lifts leave 2 reps in reserve.' },
    peak: { l: 'Peak', d: 'Power endurance. Lifting drops to maintenance, the power session becomes 4x4s, Saturday becomes traverse intervals and Sunday links crack laps.' },
    test: { l: 'Test', d: 'Climb and lift easy apart from the tests, and record every result.' },
    off: { l: 'Open training', d: 'No block is running this week, so sessions use the Build targets.' }
  };
  function phaseOf(w) { return PHASES[w] || 'off'; }
  function phKey(w) { var p = phaseOf(w); return p === 'off' ? 'build' : p; }

  var WARM = 'Climbing warm-up, about 25 min: 5 min general (light cardio, band pull-aparts 2 × 15, band external rotations 2 × 10, scapular pull-ups 2 × 8), 6–8 min easy traversing, feet-on hangs at 50% and 70% (add 85% once the warm-up stops pumping you), then 3–4 board problems at V0–V2.';
  var COOL = '3–5 min easy traversing, then reverse wrist curls 2 × 15 and finger-extensor bands 2 × 20, then stretch forearms, lats and hip flexors.';
  var LIFTWARM = '5 min of easy cardio and band pull-aparts. Ankle work: knee-to-wall rocks 2 × 10 each side, then a heel-elevated goblet squat hold 2 × 30 s. Then 2–3 lighter ramp-up sets before the first lift.';

  // [name, targets by phase, rest label, rest seconds, cue, weight label]
  var LIFT = {
    lift1: { t: 'Lift 1: heavy pull', short: 'Lift 1', focus: 'Full body, built around heavy pull-ups. They go first while you are fresh, since they carry over to climbing more than any other lift.', rows: [
      ['Fast pull-up (bodyweight)', { peak: '3 × 3, as fast as possible' }, '2–3 min', 150, 'Explosive on the way up, controlled on the way down. These prime the weighted sets.', ''],
      ['Pull-up', { build: '4 × 6–8', deload: '2 × 6–8', build2: '5 × 4–6', deload9: '3 × 4–6', peak: '3 × 4–6 at your week 8 weight', test: 'Test: max bodyweight reps, then work up to a 3-rep max' }, '2–3 min', 150, 'Full hang at the bottom, chest toward the bar, no kipping. Add weight once every set hits the top of the range.', 'lb added'],
      ['Seated dumbbell shoulder press', { build: '3 × 8–10', deload: '2 × 8–10', build2: '3 × 6–8', deload9: '2 × 6–8', peak: '2 × 6–8 at your week 8 weight' }, '90 s–2 min', 105, 'Press with your palms facing each other if a shoulder pinches.', 'lb per hand'],
      ['High-box step-up', { build: '3 × 8 each leg', deload: '2 × 8 each leg', build2: '3 × 6–8 each leg', deload9: '2 × 6–8 each leg', peak: '2 × 6–8 each leg at your week 8 weight' }, '90 s–2 min', 105, 'Box around knee height. Drive through the whole foot on the box and do not push off the bottom foot. It builds the strength a high step asks for.', 'lb per hand'],
      ['Barbell row', { build: '3 × 10–12', deload: '2 × 10–12', build2: '3 × 8–10', deload9: '2 × 8–10', peak: '2 × 8–10 at your week 8 weight' }, '90 s–2 min', 105, 'Hinge to about 45° with a flat back and pull the bar to your lower ribs. Straps are fine if grip is tired.', 'lb'],
      ['Hanging knee raise', { build: '3 × 10–12', deload: '2 × 10–12' }, '45–75 s', 60, 'No swinging. Pause at the top and lower slowly.', ''],
      ['Toes-to-bar', { build2: '3 × 6–8', deload9: '2 × 6–8', peak: '2 × 8–10' }, '45–75 s', 60, 'Trains the body tension that keeps your feet on steep terrain. Lying leg raises if your grip is cooked.', ''],
      ['Cable external rotation', { build: '2 × 12–15 each arm', deload: '1 × 12–15 each arm', build2: '2 × 12–15 each arm', deload9: '1 × 12–15 each arm', peak: '2 × 12–15 each arm' }, '45–60 s', 50, 'Elbow pinned to your side, rotate out slowly. Rotator cuff work that keeps shoulders healthy under heavier pulling.', 'lb']
    ] },
    lift3: { t: 'Lift 3: heavy legs and push', short: 'Lift 3', focus: 'Heavy lower-body and pressing work first. It follows your hardest finger day, so the only pulling is a few easy pull-ups.', rows: [
      ['Romanian deadlift', { build: '3 × 8–10', deload: '2 × 8–10', build2: '4 × 6–8', deload9: '2 × 6–8', peak: '3 × 6–8 at your week 8 weight', test: 'Test: work up to a 5-rep max' }, '2–3 min', 150, 'Hips back first, then hinge until you feel the hamstring stretch. Weights close to your legs, back flat. Use straps: grip is not the point here.', 'lb per hand'],
      ['Bench press', { build: '3 × 8–10', deload: '2 × 8–10', build2: '4 × 5–6', deload9: '2 × 5–6', peak: '3 × 5–6 at your week 8 weight', test: 'Test: work up to a 5-rep max' }, '2–3 min', 150, 'Before the bar, 2 × 15 band pull-aparts and 2 × 10 scap push-ups set your shoulder blades back and down.', 'lb'],
      ['Pendulum squat', { build: '2 × 10–12', deload: '1 × 10–12', build2: '2 × 8–10', deload9: '1 × 8–10', peak: '2 × 8–10 at your week 8 weight' }, '90 s–2 min', 105, 'Lower for 3 seconds, pause for 2 at the bottom with heels flat, then stand up smoothly. Loaded mobility, not a max-effort leg day.', 'lb'],
      ['Pull-up, bodyweight (easy)', { build: '3 × 5–8', deload: '2 × 5–8', build2: '3 × 5–8', deload9: '2 × 5–8', peak: '3 × 5–8' }, '90 s–2 min', 105, 'No added weight, and stop 3 or more reps short of failure. Lat pulldowns instead if your fingers are sore.', ''],
      ['Rear delt fly', { build: '3 × 15', deload: '2 × 15', build2: '3 × 15', deload9: '2 × 15', peak: '2 × 15' }, '45–75 s', 60, 'Machine or dumbbells, light weight.', 'lb'],
      ['Lateral raise', { build: '3 × 12–15', deload: '2 × 12–15', build2: '3 × 12–15', deload9: '2 × 12–15', peak: '2 × 12–15' }, '45–75 s', 60, 'Light, no swinging, lead with your elbows.', 'lb'],
      ['Side plank', { build: '3 × 30 s each side', deload: '2 × 30 s each side', build2: '3 × 40 s each side', deload9: '2 × 40 s each side', peak: '3 × 45 s each side' }, '45–60 s', 50, 'A straight line from head to heels. Once 40 s is steady, add a top-leg raise instead of more time.', ''],
      ['Hollow body hold', { test: 'Test: one max hold, in seconds' }, '3–4 min', 210, 'After the deadlift and bench tests.', '']
    ] }
  };
  var LIFT_EFFORT = { build: 'Leave 2–3 reps in reserve on every set.', deload: 'Same weights, about half the sets.', build2: 'Leave 2 reps in reserve. No singles or max attempts.', peak: 'Maintenance: about two-thirds of the sets at your week 8 weights, 2–3 reps in reserve.', test: 'Tested lifts only. Keep anything else easy.' };

  function parseTarget(t) {
    var m = /(\d+) × (\d+)(?:–(\d+))?/.exec(t || '');
    return m ? { sets: +m[1], lo: +m[2], hi: +(m[3] || m[2]) } : { sets: 1, lo: 0, hi: 0 };
  }
  function liftRows(sid, w, variant) {
    var ph = phKey(w), out = [];
    LIFT[sid].rows.forEach(function (r) {
      var t = (ph === 'deload' && w === 9 && r[1].deload9) || r[1][ph];
      if (!t) return;
      if (sid === 'lift3' && variant === 'out') {
        if (r[0] === 'Pull-up, bodyweight (easy)') return;
        if (r[0] === 'Romanian deadlift') t = '2 × 8–10, no new weight';
        if (r[0] === 'Pendulum squat') t = '1 × 10–12';
      }
      if (sid === 'lift3' && variant === 'tue' && r[0] === 'Pull-up, bodyweight (easy)') t = '2 × 5–8';
      var p = parseTarget(t);
      out.push({ n: r[0], target: t, sets: p.sets, lo: p.lo, hi: p.hi, rest: r[2], restSec: r[3], cue: r[4], wl: r[5] });
    });
    return out;
  }

  /* Board, endurance and crack sessions by phase. parts: [heading, text, rest label, rest seconds] */
  var SESS = {
    kpower: function (w) {
      var ph = phKey(w), main, rest = ['2–3 min between tries', 180], t = 'Kilter power', short = 'Power', tags = ['pow'];
      if (ph === 'build') main = 'Any 4–6 problems at V2–V4 that look fun and have big or committing moves. 2–3 real tries each, then move on. Stop when moves slow down.';
      else if (ph === 'deload') main = 'Half volume: any 2–3 fun problems at ' + (w === 9 ? 'V4–V5' : 'V2–V4') + ', 1–2 tries each.';
      else if (ph === 'build2') main = 'Any 4–6 problems at V4–V5 that look fun and have big or committing moves. 2–3 real tries each, then move on. Stop when moves slow down.';
      else if (ph === 'peak') { main = '4x4s: any 4 problems at V1–V3 you can climb without falling. Climb the same 4 back to back each round, 4 rounds. If round 4 falls apart before the last problem, drop a grade next week; if it is all clean, add one harder problem.'; rest = ['4 min between rounds', 240]; t = 'Kilter 4x4s'; short = '4x4s'; tags = ['end', 'pow']; }
      else main = 'Easy: 2–3 problems well below your limit.';
      return { t: t, short: short, mins: 75, kind: 'board', tags: tags, focus: ph === 'peak' ? 'Power endurance: keep pulling hard moves while pumped.' : 'Explosive but controlled movement on the board at 40°, on problems at or below your flash level. Deadpoints and long, controlled moves beat big jumps and cuts.',
        parts: [['Warm-up', WARM + ' Finish with 2–3 big moves on good holds at about 80%, then rest 8–10 min.'], ['Main set', main, rest[0], rest[1]], ['Cool-down', COOL]] };
    },
    kstrength: function (w) {
      var ph = phKey(w), parts = [], main;
      if ((ph === 'build' && w >= 2) || ph === 'off') parts.push(['Tindeq, the evening before', 'At home: ramp up at 50%, 70% and 85%, then 3 × 7–10 s per hand at 80% of your max on the 20 mm edge, half crimp. Skip it if your fingers feel tweaky.', '2–3 min before the same hand', 150]);
      if (ph === 'build2') parts.push(['Tindeq, the evening before', 'At home: ramp up, then 3–5 × 7–10 s per hand at 85–90% of your latest test if your fingers are pain-free. Otherwise stay at 80%.', '2–3 min before the same hand', 150]);
      if (ph === 'peak') parts.push(['Tindeq, the evening before', 'At home: ramp up, then 3 × 7–10 s per hand at 85–90% of your latest test.', '2–3 min before the same hand', 150]);
      parts.push(['Warm-up', WARM + ' Then rest 8–10 min.']);
      if (ph === 'deload') main = 'No main set. Retest your 3 retest problems, fresh.';
      else if (ph === 'test') main = 'Retest your hardest board sends and your retest problems.';
      else if (w === 4) main = 'Your retest set: the 3 problems you saved in week 1. 4–6 tries each, about 20–25 attempts in total.';
      else if (w === 8) main = 'Your second retest set, saved in week 6. 4–6 tries each, about 20–25 attempts in total.';
      else if (ph === 'build') main = '3–4 crimpy, static problems at V4–V5 that you cannot send yet. 4–6 tries each, about 20–25 attempts in total. Skip problems whose moves tweak your wrists or shoulders.';
      else main = '3–4 problems one grade above your hardest board send. 4–6 tries each, about 20–25 attempts in total. Skip problems whose moves tweak your wrists or shoulders.';
      parts.push(['Main set', main + (ph === 'deload' || ph === 'test' ? '' : ' Stop when two tries in a row get worse.'), '3–5 min between tries', 240]);
      if (w === 1) parts.push(['Retest problems', 'Pick 3 V5s you cannot do yet, save them and leave them alone until week 4.']);
      if (w === 6) parts.push(['Retest problems', 'Pick 3 new retest problems and leave them alone until week 8.']);
      parts.push(['Cool-down', COOL]);
      return { t: 'Kilter strength', short: 'Strength', mins: 90, kind: 'board', tags: ['fing', 'pow'], focus: 'Your main finger-strength day: limit problems with full rest on crimps and small feet, the closest the board gets to face climbing outside.', parts: parts };
    },
    sat: function (w, force) {
      var ph = phKey(w), parts = [['Warm-up', 'Step 1 of the climbing warm-up, then 5–10 min of easy traversing. Finish at pump 1–2.']], laps, trav, rest = ['1–2 min between sets', 90], kind;
      var LAPS = '4–6 rounds on the least steep wall: climb an easy problem (V0–V2), down-climb it and climb it again without stepping off, about 2–3 min on the wall. Straight arms, quiet feet, pump at 3 out of 10 or less.';
      if (ph === 'deload' || ph === 'test' || w === 1) parts.push(['Tindeq test', 'At home before the gym: best of 3 max pulls per hand on the 20 mm edge, half crimp. Record both hands under Progress.', '2–3 min before the same hand', 150]);
      if (ph === 'deload') { laps = 'Optional: 2–3 easy up-and-down laps.'; trav = 'Easy traverse with no real pump.'; kind = 'easy'; }
      else if (ph === 'test') { laps = ''; trav = 'Time your longest nonstop traverse.'; kind = 'test'; }
      else if (ph === 'peak') { laps = LAPS.replace('4–6', '3–4'); trav = 'Intervals: 1 min on harder holds, 1 min rest, for 6–8 rounds.'; rest = ['1 min between rounds', 60]; kind = 'intervals'; }
      else {
        laps = LAPS;
        var endur = force ? force === 'endurance' : (w % 2 === 1 || w === 6 || w === 8) && w !== 7;
        if (endur) { var tgt = w >= 8 ? '2 × 12 min with 3 min rest' : w >= 6 ? '3 × 8 min with 2 min rest' : '4 × 6 min with 1–2 min rest'; trav = 'Endurance: ' + tgt + ', on a planned loop with 2 rest jugs. Pump no higher than 3–4 out of 10. Cap set 1 at the target time and rate your pump for each set.'; kind = 'endurance'; rest = w >= 8 ? ['3 min between sets', 180] : w >= 6 ? ['2 min between sets', 120] : rest; }
        else { trav = 'Technique, one drill per 4–5 min block: minimum grip, silent feet, glued feet, small feet only, side-on and frog positions, then reverse the loop. Pump 2–3.'; kind = 'technique'; rest = ['2 min between blocks', 120]; }
      }
      if (laps) parts.push(['Boulder laps', laps, '2–3 min between rounds', 150]);
      parts.push(['Traverse', trav, rest[0], rest[1]]);
      parts.push(['Cool-down', 'Stretch forearms, lats and hip flexors for 30 s each, plus 2 × 60 s frog stretch.']);
      return { t: 'Laps and traverse', short: kind === 'technique' ? 'Technique' : kind === 'intervals' ? 'Intervals' : 'Endurance', mins: 90, kind: 'endur', tags: kind === 'technique' ? ['foot', 'end'] : ['end', 'foot'], trav: kind, focus: 'The endurance and footwork the board does not build: easy boulder laps, then the traverse.', parts: parts };
    },
    cracks: function (w) {
      var ph = phKey(w), main;
      if (ph === 'deload' || ph === 'test') main = '2–3 easy laps.';
      else if (ph === 'peak') main = 'Link 2 laps back to back without resting, for 3–4 rounds.';
      else main = '4–6 laps at a comfortable grade. Cover fingers, hands and fists, with extra laps on off-fingers (#.75).';
      return { t: 'Crack mileage', short: 'Cracks', mins: 60, kind: 'crack', tags: ['crack'], focus: 'Easy crack volume, outside when you can. Yesterday was a climbing day too, so stay at comfortable grades. Skip it first if the week feels heavy.',
        parts: [['Warm-up', 'Step 1 of the climbing warm-up, then 1–2 easy laps.'], ['Cracks', main + ' Quiet, precise jams that hold without overgripping.', '2–3 min between laps', 150], ['Cool-down', 'Stretch forearms, lats and hip flexors.']] };
    },
    rest: function () { return { t: 'Rest day', short: 'Rest', mins: 0, kind: 'rest', tags: [], focus: 'A full rest day, so the next hard finger session starts fresh.', parts: [['Today', 'No climbing and no lifting.'], ['This evening', 'If tomorrow is Kilter strength, do the Tindeq pulls listed under that session.'], ['Any time', 'Home stretches: forearms, lats and hip flexors, 30 s each.']] }; },
    travel: function () { return { t: 'Travel day', short: 'Travel', mins: 0, kind: 'rest', tags: [], focus: 'Get there fresh.', parts: [['Before you leave', '10 min of mobility: half-kneeling hip flexor stretch, frog stretch, knee-to-wall ankle rocks.'], ['On the road', 'Stretch breaks on the drive, a real dinner with carbs, and water.']] }; },
    outside: function (w, day2) { return { t: day2 ? 'Outside, day 2' : 'Outside day', short: 'Outside', mins: 300, kind: 'out', tags: [], focus: day2 ? 'Your fingers are on their second day: pick juggy, steep endurance routes over crimpy ones, at most 1–2 hard tries, and finish in time for the drive.' : 'Real rock. Warm up longer than in the gym, then climb your goal routes late morning while you are fresh.',
      parts: [['Warm-up', 'Step 1 of the climbing warm-up, then 2–3 easy routes that build gradually. Cold rock and cold fingers are when tendons get tweaked.'], ['Hard climbing', 'Pick 1–2 goal routes and rest 20–30 min between hard tries.', '20–30 min between tries', 1200], ['When to stop', 'Switch to easy routes if a finger twinges, your skin gets thin, or two tries in a row get worse.'], ['Finish', '1–2 easy routes, then finger-extensor bands 2 × 20 and stretch.']] }; },
    /* Area sessions */
    k4x4: function () { var s = SESS.kpower(10); s.why = 'end'; return s; },
    ksteep: function () { return { t: 'Steep limit bouldering', short: 'Steep limit', mins: 90, kind: 'board', tags: ['pow', 'end'], focus: 'Limit problems on the holds steep sport routes are made of: pinches, slopers and big moves between good holds.',
      parts: [['Warm-up', WARM + ' Then rest 8–10 min.'], ['Main set', '3–4 problems you cannot send yet at 40°. Choose pinches, slopers and long pulls between jugs over tiny crimps. 4–6 attempts per problem. If the gym has set pockets, add 2 pocket problems below your limit, open-handed.', '3–5 min between tries', 240], ['Finisher', 'One problem two grades down, climbed 3 times in a row with 1 min rest.', '1 min', 60], ['Cool-down', COOL]] }; },
    crackhard: function () { return { t: 'Crack strength', short: 'Hard cracks', mins: 60, kind: 'crack', tags: ['crack'], focus: 'Short, hard efforts on your weakest crack sizes.',
      parts: [['Warm-up', '2 easy laps on hands.'], ['Hard burns', '5–6 hard burns on your hardest size, 6–10 moves each, so every one is high quality. Then 2 burns on thin hands (#1) and 2 on cupped hands (#3).', '3–4 min between burns', 210], ['Cool-down', 'Stretch forearms, lats and hip flexors.']] }; },
    cracklaps: function () { return { t: 'Linked crack laps', short: 'Crack laps', mins: 75, kind: 'crack', tags: ['crack', 'end'], focus: 'Size-specific endurance: stay in the crack long after it stops feeling good.',
      parts: [['Warm-up', '1–2 easy laps.'], ['Linked laps', 'Link 2 laps back to back without resting, for 3–4 rounds. Rotate the size each round: hands, thin hands, off-fingers, cupped hands. Shake out on a jam, not a face hold.', '3–4 min between rounds', 210], ['Flush', '10 min of easy traversing.']] }; },
    longday: function () { return { t: 'Long-day mileage', short: 'Mileage', mins: 90, kind: 'endur', tags: ['multi', 'end', 'foot'], focus: 'Stay moving for as long as a long route keeps you moving.',
      parts: [['Warm-up', '5–10 min of easy traversing.'], ['Mileage', '6 × 10 min of continuous easy climbing: up and down V0–V2, or the traverse, without stepping off. Pump at 3 out of 10 or less. Eat and drink at the rests the way you will at belays.', '2 min between blocks', 120], ['Cool-down', 'Stretch forearms, lats and hip flexors.']] }; },
    pump2: function () { return { t: 'Easy route simulation', short: 'Route sim', mins: 45, kind: 'endur', tags: ['end'], focus: 'A second, gentler pump session that feels like a long sport pitch.',
      parts: [['Warm-up', '5–10 min of easy traversing.'], ['Links', 'Link 3 easy problems (V0–V2) without stepping off: up one, down the next, across to a third. 4–5 rounds, pump at 5 out of 10 or less. Pause to clip an imaginary draw every few moves.', '3 min between rounds', 180], ['Cool-down', 'Stretch forearms, lats and hip flexors.']] }; }
  };
  var ORDER = {
    normal: ['lift1', 'kpower', 'rest', 'kstrength', 'lift3', 'sat', 'cracks'],
    tue: ['lift1', 'rest', 'kstrength', 'lift3', 'kpower', 'sat', 'cracks'],
    out: ['lift1', 'kstrength', 'rest', 'lift3', 'travel', 'outside', 'outside']
  };
  var KIND_LABEL = { lift: 'Lifts', board: 'Board', endur: 'Endurance', crack: 'Cracks', out: 'Outside', other: 'Other' };
  function kindOf(sid) { return sid === 'lift1' || sid === 'lift3' || sid === 'lift2' ? 'lift' : SESS[sid] ? SESS[sid](1).kind : 'other'; }
