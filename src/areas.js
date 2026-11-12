  var DIMS = [['end', 'Steep endurance'], ['fing', 'Finger strength'], ['pow', 'Power'], ['crack', 'Crack technique'], ['foot', 'Footwork'], ['multi', 'Long-day stamina']];
  var DIM_LABEL = {}; DIMS.forEach(function (d) { DIM_LABEL[d[0]] = d[1]; });
  var CAM_COLOR = { '.3': '#2F6DB5', '.4': '#8A8F94', '.5': '#6B4C9A', '.75': '#3E8E4F', '1': '#C8352B', '2': '#D9A520', '3': '#2F6DB5', '4': '#B9BDC2' };
  var URL = {
    gear: 'https://claude.ai/artifact/BA7qVxA4KDh4b6AWGLnwM3',
    strength: 'https://claude.ai/artifact/EQgtmvRXnj1HB19Q4zLqHH',
    kilter: 'https://claude.ai/artifact/7axgeKW4cwXZvauVXNsi6Q',
    camp: 'https://claude.ai/artifact/JqafmBEjxxkAmyvCRUAQRE'
  };

  // s = [steep endurance, fingers, power, crack, footwork, long-day stamina], each 1 to 5
  var AREAS = [
    { id: 'rrg', name: 'Red River Gorge', short: 'The Red', st: 'Kentucky', rock: 'Corbin sandstone', s: [5, 3, 3, 2, 2, 1],
      style: 'Steep sport on pocketed sandstone, with trad lines in the Northern Gorge. Routes are long and overhanging, so pump decides most sends.' },
    { id: 'nrg', name: 'New River Gorge', short: 'The New', st: 'West Virginia', rock: 'Nuttall sandstone', s: [3, 5, 4, 3, 5, 1],
      style: 'Sport and trad on hard, fine-grained sandstone. Small edges, long reaches between them, precise feet and bouldery cruxes.' },
    { id: 'ic', name: 'Indian Creek', short: 'The Creek', st: 'Utah', rock: 'Wingate sandstone', s: [4, 2, 2, 5, 2, 1],
      style: 'Parallel-sided splitters. One crack size for a whole pitch, so jamming technique and size-specific endurance matter more than finger strength.' },
    { id: 'blackcanyon', name: 'Black Canyon', st: 'Colorado', rock: 'Gneiss and pegmatite', s: [3, 3, 2, 4, 4, 5], style: 'Long, committing multi-pitch trad with route finding and big days.' },
    { id: 'cityofrocks', name: 'City of Rocks', st: 'Idaho', rock: 'Granite', s: [2, 4, 2, 3, 5, 2], style: 'Technical granite faces on edges and patina plates, plus short cracks.' },
    { id: 'devilstower', name: 'Devils Tower', st: 'Wyoming', rock: 'Phonolite columns', s: [4, 2, 2, 5, 4, 4], style: 'Sustained cracks and stemming between columns, pitch after pitch.' },
    { id: 'eldorado', name: 'Eldorado Canyon', st: 'Colorado', rock: 'Fountain sandstone', s: [2, 4, 3, 2, 5, 4], style: 'Steep, technical multi-pitch face climbing on edges with thoughtful gear.' },
    { id: 'gunks', name: 'The Gunks', st: 'New York', rock: 'Quartz conglomerate', s: [3, 3, 4, 1, 3, 3], style: 'Horizontal breaks and big roofs. Powerful pulls on good holds.' },
    { id: 'horseshoe', name: 'Horseshoe Canyon Ranch', st: 'Arkansas', rock: 'Sandstone', s: [3, 3, 3, 1, 3, 1], style: 'Friendly sport climbing across every angle on featured sandstone.' },
    { id: 'joshuatree', name: 'Joshua Tree', st: 'California', rock: 'Quartz monzonite', s: [1, 3, 3, 4, 5, 1], style: 'Short, stiff cracks and friction slabs on coarse rock. Footwork and trust.' },
    { id: 'maple', name: 'Maple Canyon', st: 'Utah', rock: 'Cobble conglomerate', s: [5, 2, 3, 1, 2, 1], style: 'Steep cobble pulling. Big holds, big pump.' },
    { id: 'owens', name: 'Owens River Gorge', st: 'California', rock: 'Volcanic tuff', s: [3, 4, 3, 1, 4, 1], style: 'Long, vertical sport routes on edges and pockets.' },
    { id: 'redrock', name: 'Red Rock', st: 'Nevada', rock: 'Aztec sandstone', s: [3, 3, 2, 3, 4, 5], style: 'Long moderate multi-pitch on varnished edges and cracks, plus sport crags.' },
    { id: 'rifle', name: 'Rifle', st: 'Colorado', rock: 'Limestone', s: [5, 3, 4, 1, 3, 1], style: 'Steep, blocky limestone with kneebars and sustained power endurance.' },
    { id: 'seneca', name: 'Seneca Rocks', st: 'West Virginia', rock: 'Tuscarora quartzite', s: [2, 3, 2, 3, 4, 4], style: 'Exposed multi-pitch trad on vertical fins. Old-school grades.' },
    { id: 'shelf', name: 'Shelf Road', st: 'Colorado', rock: 'Limestone', s: [2, 5, 3, 1, 4, 1], style: 'Vertical limestone on small pockets and sharp edges.' },
    { id: 'smith', name: 'Smith Rock', st: 'Oregon', rock: 'Welded tuff', s: [2, 5, 3, 2, 5, 2], style: 'Thin, technical face climbing on nubbins and tiny edges.' },
    { id: 'tensleep', name: 'Ten Sleep', st: 'Wyoming', rock: 'Bighorn dolomite', s: [3, 5, 3, 1, 4, 1], style: 'Vertical to gently overhanging pockets and crimps.' },
    { id: 'tuolumne', name: 'Tuolumne Meadows', st: 'California', rock: 'Granite', s: [1, 3, 1, 2, 5, 4], style: 'Runout knob and friction climbing on domes at altitude.' },
    { id: 'vedauwoo', name: 'Vedauwoo', st: 'Wyoming', rock: 'Sherman granite', s: [2, 1, 2, 5, 3, 1], style: 'Wide cracks and offwidths on rough, coarse granite.' },
    { id: 'yosemite', name: 'Yosemite Valley', st: 'California', rock: 'Granite', s: [3, 3, 2, 5, 4, 5], style: 'Granite cracks of every size and long routes. Jamming plus all-day stamina.' },
    { id: 'zion', name: 'Zion', st: 'Utah', rock: 'Navajo sandstone', s: [4, 2, 2, 5, 3, 5], style: 'Long sandstone crack systems on big walls.' }
  ];
  var AREA = {}; AREAS.forEach(function (a) { AREA[a.id] = a; });

  var DETAIL = {
    rrg: {
      board: 'https://claude.ai/artifact/Dy4yM6rPuARYGf6TjhPVcU',
      rackNote: 'Trad days only. Sport days need no cams.',
      carry: [['.3', '1'], ['.4', '1'], ['.5', '1–2'], ['.75', '1–2'], ['1', '2'], ['2', '2'], ['3', '1–2'], ['4', 'If needed']],
      todo: [
        ['RRGCC waiver', 'Required at PMRP, Miller Fork and Bald Rock. Sign it online before your first day.', 'Waiver'],
        ['Motherlode waiver', 'A second waiver for the Motherlode and the Chocolate Factory, which are private land. Dawn to dusk only.', 'Waiver'],
        ['Muir Valley release + $15', 'Every climber signs the release at muirvalley.org/waiver. Parking is $15 per car per day.', 'Waiver'],
        ['Guidebooks', 'THE RED, 2nd ed. (2022) covers the sport crags. Red River Gorge Trad (2026) covers the gear lines.', 'Buy'],
        ['Stick clip', 'Many first bolts call for one. Pottsville Escarpment at Drive-By is one of them.', 'Confirm'],
        ['Helmet', 'Newer crags still shed holds. Cliffview asks both climber and belayer to wear one.', 'Confirm'],
        ['4WD, or walk the hill', 'The Lode hill and the Miller Fork road want 4WD and clearance. In 2WD, park at the top and walk.', 'Confirm'],
        ['Roadside permit', 'Graining Fork (Roadside) needs a daily permit for each climber. No permit, climb elsewhere.', 'Optional'],
        ['Kneepad', 'Knee bars are part of the steep pocket climbing, like Military Wall’s overhanging classics.', 'Optional'],
        ['Small tricams', 'Bite in shallow pockets and horizontals. The suggested gear for Motha at Roadside.', 'Optional']
      ],
      know: [
        'Lower off sport routes. Overhangs make rappelling and cleaning hard.',
        'Steel permadraws are common on the steep southern routes. They aren’t allowed in the Northern Gorge, so hang your own there.',
        'Never leave aluminum draws on a route. Sandy rock wears them sharp enough to cut a rope.',
        'Many anchors have Mussy hooks. If you’re top-roping or working a route, rig your own gear.',
        'Bring 15+ draws. Boltergeist at Muir is 95 ft with 13 bolts to the chains.',
        'Motherlode routes run up to 40 m. That’s what the 80 m rope is for.',
        'Many trad grades are old school. Expect them to feel stiff.'
      ],
      camp: [
        ['Miguel’s Pizza', 'The climbers’ hub. Open-field camping for about $3 per person a night; register at the gear shop. Crowded and noisy in peak season.'],
        ['Lago Linda’s', 'Quieter car camping, about $6 per person a night, with free hot showers. About 10 minutes from PMRP and Bald Rock.'],
        ['Forest Service sites', 'Koomer Ridge is the developed campground (54 tent sites). Tunnel Ridge Road has primitive sites at least 300 ft from the road.'],
        ['Overnight pass', 'Any car parked overnight in the Gorge (10 pm to 6 am) needs a pass: $5 a night, $7 for 3 nights. Sold at the Shell in Slade.'],
        ['Not at the crags', 'No overnight parking and no open fires on RRGCC land. Muir bans hammocks and dogs.'],
        ['Bears', 'Keep food and trash locked in the car overnight.'],
        ['Groceries', 'Kroger in Stanton has the best selection nearby. Lexington is about an hour away.']
      ],
      routes: [
        ['5.6', 'Bedtime for Bonzo', 'Northern Gorge · Fortress Wall', 'T', '2 pitches'], ['5.7', 'Party Time', 'Northern Gorge · Fortress Wall', 'T', '2 pitches'],
        ['5.7', 'Roadside Attraction', 'Natural Bridge · Roadside Crag', 'T', '2 pitches · permit required'], ['5.7', 'Shock and Awe', 'Muir Valley · Hideout', 'T'],
        ['5.8', 'Whiteout', 'Natural Bridge · Emerald City', 'T', '2 pitches'], ['5.8', 'Cheaper Than a Movie', 'PMRP · Chica Bonita Wall', 'T'],
        ['5.8', '27 Years of Climbing', 'PMRP · Gallery', 'S'], ['5.8', 'Boilerplate', 'PMRP · Crossroads', 'S', 'Rain-day route'],
        ['5.9', 'The Underling', 'Northern Gorge · Eastern Sky Bridge Ridge', 'T'], ['5.9', 'Autumn', 'Northern Gorge · Long Wall', 'T'],
        ['5.9', 'Little Wing', 'MFRP · Secret Garden', 'S'], ['5.9+', 'Pogue Ethics', 'Northern Gorge · Phantasia', 'S'],
        ['5.9+', 'Crack Attack', 'Northern Gorge · Indian Creek', 'T'], ['5.9+', 'Hazel Dormouse', 'BRRP · Hazel Hollow', 'S'],
        ['5.10a', 'Rock Wars', 'Northern Gorge · Long Wall', 'T'], ['5.10a', 'Brown Eyed Girl', 'PMRP · Chica Bonita Wall', 'S', 'Rain-day wall'],
        ['5.10a', 'Plate Tectonics', 'Muir Valley · Tectonic Wall', 'S'], ['5.10a', 'EGBG', 'BRRP · Chocolate Factory', 'S'],
        ['5.10a', 'Motor Booty Pimp Affair', 'PMRP · Chica Bonita Wall', 'S', 'Rain-day wall'], ['5.10a', 'Jungle Beat', 'Northern Gorge · Military Wall', 'T', '2 pitches · trad pick'],
        ['5.10-', 'To Defy the Laws of Tradition', 'Northern Gorge · Left Flank', 'S', 'Stays dry'], ['5.10a/b', 'Boltergeist', 'Muir Valley · Hideout', 'S', '95 ft, 13 bolts'],
        ['5.10b', 'Gettin’ Lucky in Kentucky', 'Muir Valley · Tectonic Wall', 'S'], ['5.10b', 'A Brief History of Climb', 'PMRP · Gallery', 'S'],
        ['5.10b', 'Robotic Thumb', 'BRRP · Chocolate Factory', 'S'], ['5.10c', 'Diamond in the Rough', 'Natural Bridge · Emerald City', 'S'],
        ['5.10c', 'Pre-emptive Strike', 'Muir Valley · Hideout', 'S'], ['5.10c', 'Banjolero', 'PMRP · Crossroads', 'S'],
        ['5.10c', 'Juju Fruit', 'MFRP · Fruit Wall', 'S'], ['5.10c', 'Fairweather Friend', 'PMRP · Crossroads', 'S'],
        ['5.10c/d', 'Return of Manimal', 'Muir Valley · Bruise Brothers Wall', 'S'], ['5.10c/d', 'Breakfast Burrito', 'PMRP · Drive-By Crag', 'S'],
        ['5.10c/d', 'Loompa', 'BRRP · Chocolate Factory', 'S'], ['5.10c/d', 'Lightning Rod Arete', 'PMRP · Velo Crag', 'S'],
        ['5.10c/d', 'Holy Grail', 'MFRP · Camelot', 'S'], ['5.10d', 'Creep Show', 'Northern Gorge · Phantasia', 'S'],
        ['5.10d', 'Fire and Brimstone', 'PMRP · Drive-By Crag', 'S'], ['5.10d', 'K.S.B.', 'PMRP · The Shire', 'S'], ['5.10d', 'Tesseract', 'MFRP · The Portal', 'S'],
        ['5.11a', 'Whip-Stocking', 'PMRP · Drive-By Crag', 'S'], ['5.11a', 'Super Dario', 'Northern Gorge · Eastern Sky Bridge Ridge', 'S'],
        ['5.11a', 'Johnny B. Good', 'PMRP · Gallery', 'S'], ['5.11a', 'Toker', 'PMRP · Bob Marley', 'S'], ['5.11a', 'Air Ride Equipped', 'Muir Valley · Solarium', 'S'],
        ['5.11a', 'Two Women Alone', 'PMRP · Bronaugh Wall', 'S'], ['5.11a', 'Bathtub Mary', 'Muir Valley · Arsenal', 'S'], ['5.11a', 'The Last Supper', 'PMRP · Gallery', 'S'],
        ['5.11a/b', 'The Preacher’s Daughter', 'PMRP · Gallery', 'S'], ['5.11b', 'Prime Directive', 'Northern Gorge · Funk Rock City', 'S'],
        ['5.11b', 'Yellow Brick Road', 'Natural Bridge · Emerald City', 'S'], ['5.11b', 'King Me', 'Northern Gorge · Eastern Sky Bridge Ridge', 'S'],
        ['5.11b', 'Eye of the Needle', 'Northern Gorge · Funk Rock City', 'S'], ['5.11b', 'Amarillo Sunset', 'PMRP · North 40', 'S'],
        ['5.11b', 'Random Precision', 'PMRP · Gallery', 'S'], ['5.11b', 'Hip to the Jive', 'BRRP · Chocolate Factory', 'S'],
        ['5.11b', 'Fuzzy Undercling', 'Northern Gorge · Military Wall', 'S', 'Bouldery start · rain-day wall'], ['5.11c', 'No Place Like Home', 'Natural Bridge · Emerald City', 'S'],
        ['5.11c', 'Spirit Fingers', 'PMRP · Drive-By Crag', 'S'], ['5.11c', 'Banshee', 'Muir Valley · Solarium', 'S'], ['5.11c', 'Witness the Citrus', 'MFRP · Fruit Wall', 'S'],
        ['5.11c', 'Unsportsmanlike Conduct', 'Northern Gorge · Left Flank', 'T', 'Trad pick'], ['5.11d', 'The Return of Chris Snyder', 'Natural Bridge · Roadside Crag', 'S', 'Permit required'],
        ['5.11d', 'Buddha Hole', 'PMRP · Solar Collector', 'S'], ['5.11d', 'Gold Rush', 'PMRP · Gallery', 'S'], ['5.11d', 'The Infidel', 'Northern Gorge · Funk Rock City', 'S'],
        ['5.11d', 'Snozzberries', 'BRRP · Chocolate Factory', 'S'], ['5.11d', 'Starry Night', 'PMRP · Gallery', 'S'],
        ['5.12a', 'Ro Shampo', 'Natural Bridge · Roadside Crag', 'S', 'Permit required'], ['5.12a', 'The Gift', 'Northern Gorge · Long Wall', 'S'],
        ['5.12a', 'Check Your Grip', 'PMRP · Drive-By Crag', 'S'], ['5.12a', 'Twinkie', 'Northern Gorge · Phantasia', 'S'], ['5.12a', 'Dogleg', 'PMRP · Bob Marley', 'S'],
        ['5.12a', 'Supafly', 'PMRP · Solar Collector', 'S'], ['5.12a', 'Break the Scene', 'PMRP · Gallery', 'S'], ['5.12a', 'Hakuna Matata', 'PMRP · Drive-By Crag', 'S'],
        ['5.12a', 'Swedish Fish', 'BRRP · Chocolate Factory', 'S'], ['5.12-', 'Pink Feat', 'Northern Gorge · Military Wall', 'T', 'Trad pick'],
        ['5.12a/b', 'Too Many Puppies', 'Northern Gorge · Left Flank', 'S'], ['5.12a/b', 'Super Best Friends', 'Muir Valley · Solarium', 'S'],
        ['5.12a/b', 'Delicatessen', 'Muir Valley · Solarium', 'S'], ['5.12b', 'Tissue Tiger', 'Northern Gorge · Military Wall', 'S', 'Rain-day wall'],
        ['5.12b', 'Gung Ho', 'Northern Gorge · Military Wall', 'S', 'Rain-day wall'], ['5.12b', 'Mercy, the Huff', 'Northern Gorge · Left Flank', 'S'],
        ['5.12b', 'Ale-8-One', 'BRRP · Motherlode', 'S'], ['5.12b', 'Far From God', 'PMRP · Shady Grove', 'S'], ['5.12b', 'Abiyoyo', 'Muir Valley · Solarium', 'S'],
        ['5.12b', 'Last Rites', 'MFRP · Infirmary', 'S'], ['5.12c', 'Cell Block Six', 'Muir Valley · Midnight Surf', 'S'], ['5.12c', 'Orange Juice', 'Northern Gorge · Funk Rock City', 'S'],
        ['5.12c', 'Mosaic', 'PMRP · Gallery', 'S'], ['5.12c', 'Mirage', 'Muir Valley · Solarium', 'S']
      ]
    },
    nrg: {
      board: 'https://claude.ai/artifact/SAheGSod45jxfxjy5bcNjE',
      rackNote: 'Pack 21 cams, carry about 12. Leave the 40 m rope and the #5 at home.',
      carry: [['.3', '1'], ['.4', '1'], ['.5', '2'], ['.75', '2'], ['1', '2'], ['2', '2'], ['3', '1–2'], ['4', 'If needed']],
      todo: [
        ['Stick clip', 'Expected here. Some first bolts are about 20 ft up.', 'Buy'],
        ['Helmet', 'Not on your gear list yet. Confirm you have one.', 'Confirm'],
        ['Offset nuts', 'Locals swear by them for flared slots.', 'Optional'],
        ['Pink and red tricams', 'Bite in the shallow horizontals cams dislike.', 'Optional'],
        ['Cams below #.3', 'Many horizontals take #.1–#.5. You own one #.3 and one #.4.', 'Optional']
      ],
      know: [
        'Use a stick clip on the first bolt. Some first bolts are very high.',
        'At Endless Wall, some sport routes need a few pieces of gear. Bring a light rack on sport days there.',
        'Lower, don’t rappel, off single-pitch anchors.',
        'Fixed draws and permadraws are illegal in the park.',
        'The 80 m is ideal. Much of the Kaymoor Slabs is taller than half of a 70 m rope.',
        'Endless Wall, Bubba City and Summersville Lake are reached by ladders.'
      ],
      camp: [
        ['AAC campground sites', 'Each has a 10×10 ft wooden tent platform, a picnic table and a parking spot. Make sure your tent fits the platform.'],
        ['AAC washroom', 'Bathrooms have big sinks for dishes. Hot showers are coin-operated.'],
        ['AAC season', 'Late March to early December. Out of season, the showers are locked.'],
        ['Park campgrounds', 'Free, first come first served, with no drinking water and limited restrooms. 14-day limit.'],
        ['Bear habitat', 'Keep food and trash locked in the car overnight.']
      ],
      routes: [
        ['5.7', 'Hippie Dreams', 'Summersville Lake · Orange Oswald Wall', 'S', 'Classic'], ['5.7', 'Sand in My Crack', 'Kaymoor · Rico Suave Buttress', 'T'],
        ['5.8', 'Mrs. Field’s Follies', 'Bubba City · Sandstonia', 'S', 'Classic · very high first bolt'], ['5.8', 'Fantasy', 'Endless Wall · Fantasy Area', 'T', 'Classic · 2 pitches'],
        ['5.8', 'Zag', 'Bridge Area · Bridge Buttress', 'T'], ['5.8', 'Management Wore Masks', 'Cotton Hill · Cotton Club', 'S'],
        ['5.9', 'New Yosemite', 'Junkyard · Junkyard Wall', 'T', 'Classic'], ['5.9', 'Fool Effect', 'Endless Wall · Kaymoor Slabs', 'S', 'Takes 13 draws'],
        ['5.9', 'Two Bag Face', 'Fern Buttress · Workmen’s Buttress', 'T', 'Classic · R: runout'], ['5.9+', 'Four Sheets to the Wind', 'Junkyard · Junkyard Wall', 'T', 'Classic'],
        ['5.9+', 'Chockstone', 'Bridge Area · Bridge Buttress', 'T'], ['5.9+', 'Flight of the Gumbie', 'Kaymoor · Butcher’s Branch', 'S', 'Classic'],
        ['5.9+', 'Super Crack', 'Beauty Mountain · Thunder Buttress', 'T'],
        ['5.10a', 'The Rico Suave Arête', 'Kaymoor · Rico Suave Buttress', 'S', 'Classic · rain-day wall'], ['5.10a', 'Black and Tan', 'Endless Wall · Fantasy Area', 'T', 'Classic'],
        ['5.10a', 'The Entertainer', 'Junkyard · Junkyard Wall', 'T'], ['5.10a', 'Angel’s Arête', 'Bridge Area · Bridge Buttress', 'T', 'R: runout'],
        ['5.10a', 'Orange Oswald', 'Summersville Lake · Orange Oswald Wall', 'S'], ['5.10b', 'The Decameron', 'Bubba City · Sandstonia', 'S', 'Classic'],
        ['5.10b', 'Strike a Scowl', 'Endless Wall · Diamond Point', 'S'], ['5.10b', 'Burning Calves', 'Beauty Mountain · Burning Buttress', 'T', 'Classic'],
        ['5.10b', 'Wham Bam Thanks for the Jam', 'Beauty Mountain · Burning Buttress', 'T'], ['5.10b', 'Party in My Mind', 'Endless Wall · Party Buttress', 'T'],
        ['5.10b', 'Remission', 'Endless Wall · Diamond Point', 'T'], ['5.10c', 'Kinesthetica', 'Bubba City · Sandstonia', 'S'],
        ['5.10c', 'Rapscallion’s Blues', 'Junkyard · Junkyard Wall', 'T', 'Classic'], ['5.10c', 'First Steps', 'Kaymoor · Seven Eleven Wall', 'S'],
        ['5.10d', 'Fairtracer', 'Kaymoor · Seven Eleven Wall', 'T', 'Classic'],
        ['5.11a', 'Legacy', 'Endless Wall · Snake Buttress', 'S', 'Classic'], ['5.11a', 'Stuck in Another Dimension', 'Junkyard · Junkyard Wall', 'T', 'Classic'],
        ['5.11a', 'Mellifluus', 'Endless Wall · Fern Point', 'T', 'Classic'], ['5.11a', 'Raging Waters', 'Endless Wall · Diamond Point', 'T'],
        ['5.11a', 'Handsome and Well-Hung', 'Bridge Area · Bridge Buttress', 'T'], ['5.11a', 'The Shining', 'Kaymoor · White Wall', 'T', 'Rain-day wall'],
        ['5.11a', 'Wild Seed', 'Fern Buttress · Wild Seed Area', 'S'], ['5.11a/b', 'Satisfaction Guaranteed', 'Summersville Lake · Satisfaction Wall', 'S', 'Classic'],
        ['5.11b', 'Discombobulated', 'Endless Wall · Snake Buttress', 'S'], ['5.11b', 'Chasin’ the Wind', 'Beauty Mountain · Middle Beauty', 'T', '2 pitches'],
        ['5.11c', 'Leave It to Jesus', 'Endless Wall · Diamond Point', 'T', 'Classic'], ['5.11c', 'Marionette', 'Bridge Area · Bridge Buttress', 'T'],
        ['5.11c', 'Sancho Belige', 'Kaymoor · Butcher’s Branch', 'S'], ['5.11c', 'Scenic Adult', 'Kaymoor · Seven Eleven Wall', 'S'],
        ['5.11c', 'Aesthetica', 'Endless Wall · Fantasy Area', 'S'], ['5.11d', 'Disturbance', 'Beauty Mountain · The Cave', 'S'],
        ['5.11d', 'Toxic Hueco', 'Lower Meadow · Toxic Hueco Area', 'S'], ['5.11d', 'Flash Point', 'Endless Wall · Flash Point Area', 'S'],
        ['5.11d', 'Agent Orange', 'Bridge Area · Maranatha Area', 'T'],
        ['5.12a', 'Freaky Stylee', 'Endless Wall · Party Buttress', 'S'], ['5.12a', 'Psycho Wrangler', 'Cotton Hill · Cotton Top', 'S', 'Classic'],
        ['5.12a', 'Concertina', 'Beauty Mountain · Thunder Buttress', 'S', 'Classic'], ['5.12a', 'Team Machine', 'Bridge Area · Bridge Buttress', 'S'],
        ['5.12a', 'Lost Souls', 'Kaymoor · Butcher’s Branch', 'S'], ['5.12a', 'Preparation H', 'Kaymoor · Rico Suave Buttress', 'S', 'Rain-day wall'],
        ['5.12a', 'Narcissus', 'Summersville Lake · Narcissus Cave', 'S'], ['5.12a/b', 'Dining at the Altar', 'Kaymoor · White Wall', 'S', 'Rain-day wall'],
        ['5.12a/b', 'Bullet the New Sky', 'Endless Wall · Snake Buttress', 'S'], ['5.12b', 'Thunderstruck', 'Kaymoor · White Wall', 'S', 'Classic · rain-day wall'],
        ['5.12b', 'Jesus and Tequila', 'Endless Wall · Honeymooner’s Area', 'S'], ['5.12b', 'The Gift of Grace', 'Endless Wall · Diamond Point', 'S'],
        ['5.12c', 'Green Envy', 'Beauty Mountain · The Cave', 'S']
      ]
    },
    ic: {
      board: 'https://claude.ai/artifact/4s28S8wCCBGWiug66sKJfC',
      extra: [['Live Creek tick list', 'https://claude.ai/artifact/3bwdrktwsMuw31Mqtfv7ms']],
      rackNote: 'Bring every cam you own plus the full set of nuts. A pitch often takes one size the whole way, so pool racks with your partner.',
      carry: [['.4', 'All'], ['.5', 'All'], ['.75', 'All'], ['1', 'All'], ['2', 'All'], ['3', 'All'], ['4', 'All']],
      know: [
        'Wet sandstone is weak. After rain, let it dry before climbing.',
        'Carry at least 1 gallon of water per person per day.',
        'Crack gloves, with athletic tape as backup.',
        'Sun hoodie, hat and sunscreen for the day; a puffy and warm layers for camp.'
      ],
      routes: [
        ['5.9', 'Binou’s Crack', 'Donnelly Canyon', 'T', 'Classic'], ['5.9', 'Twin Cracks', 'Supercrack Buttress', 'T', 'Classic · .4–#4'], ['5.9+', 'Chocolate Corner', 'Donnelly Canyon', 'T', 'Classic · .4–#2'],
        ['5.10-', 'Blue Sun', 'Way Rambo', 'T', 'Classic · #2'], ['5.10-', 'Generic Crack', 'Donnelly Canyon', 'T', 'Classic · #2–#3'], ['5.10b', 'Country', '4x4 Wall', 'T'],
        ['5.10', '3AM Crack', 'Supercrack Buttress', 'T', 'Classic'], ['5.10', 'Incredible Hand Crack', 'Supercrack Buttress', 'T', 'Classic · #2–#3'], ['5.10', 'Jolly Rancher', 'Pistol Whipped Wall', 'T', 'Classic'],
        ['5.10', 'Run Like Hell', 'The Wall', 'T', 'Classic'], ['5.10', 'Smell the Meat', 'Second Meat Wall', 'T', '.75–#4'], ['5.10', 'Supercrack of the Desert', 'Supercrack Buttress', 'T', 'Classic · #2–#3'],
        ['5.10+', 'Collision Course', '4x4 Wall', 'T', '.5–#4'], ['5.10d', 'Town', '4x4 Wall', 'T'],
        ['5.11-', '4 x 4', '4x4 Wall', 'T', 'Classic · #2–#4'], ['5.11-', 'Coyne Crack Simulator', 'Pistol Whipped Wall', 'T', 'Classic'], ['5.11-', 'Long Bandito Route', '4x4 Wall', 'T', 'Classic · #2–#4'],
        ['5.11-', 'Pente', 'Reservoir Wall', 'T', 'Classic · .75–#2'], ['5.11-', 'Scarface', 'Scarface Wall', 'T', 'Classic · .4–#3'], ['5.11-', 'Soul Fire', 'Optimator Wall', 'T', 'Classic · #1'],
        ['5.11a', 'Crack Attack', 'Battle of the Bulge', 'T', 'Classic · .75–#4'], ['5.11', 'Bloodsport', 'Left Rambo', 'T', '#2–#3'], ['5.11', 'Excuse Station', 'Reservoir Wall', 'T', 'Classic · #1'],
        ['5.11', 'Incisor', 'Broken Tooth', 'T', 'Classic'], ['5.11', 'Sinestra', 'Wall: check guidebook', 'T', '#2'], ['5.11', 'Spaghetti Western', 'Pistol Whipped Wall', 'T', 'Classic'],
        ['5.11', 'Top Sirloin', 'Second Meat Wall', 'T', 'Classic · #1'], ['5.11b', 'Jupiter Crack', 'Sparks Wall', 'T', 'Classic · #2–#4'], ['5.11c', 'Mad Dog', 'Cat Wall', 'T', '.5–#2'],
        ['5.11+', '4x20', '4x4 Wall', 'T', '.3–#4'], ['5.11+', 'Annunaki', 'Optimator Wall', 'T', 'Classic · .4–#3'], ['5.11+', 'Coyne Crack', 'Supercrack Buttress', 'T', 'Classic · .5–#1'],
        ['5.11+', 'Desert Vuarnet', 'Scarface Wall', 'T', 'Classic · .4–#2'], ['5.11+', 'Johnny Cat', 'Cat Wall', 'T', 'Classic · .5'], ['5.11+', 'King Cat', 'Cat Wall', 'T', 'Classic · #2–#3'],
        ['5.11+', 'Monster Truck', '4x4 Wall', 'T', '#1–#4'], ['5.11+', 'Puma', 'Cat Wall', 'T', '.3–.75'], ['5.11+', 'Variety Pack', '4x4 Wall', 'T'],
        ['5.12-', 'Wild Cat', 'Cat Wall', 'T', '.5–.75'], ['5.12-', 'T-Bones Tonight', 'Wall: check guidebook', 'T', '#2–#3'], ['5.12a', 'Sig Sauer', 'Pistol Whipped Wall', 'T', '.3–#2'],
        ['5.12a', 'Swedin-Ringle', 'Battle of the Bulge', 'T', 'Classic'], ['5.12', 'Bad Cat', 'Cat Wall', 'T', '.4–#2'], ['5.12', 'Super Cat of the Desert', 'Cat Wall', 'T', '.4–#4'],
        ['5.12', 'Way Rambo', 'Way Rambo', 'T', 'Classic · .5–#1'],
        ['5.7', 'South Six Shooter, South Face', 'South Six Shooter', 'T', 'Classic · 3 pitches · .3–#3'], ['5.9', 'Castleton, North Chimney', 'Castleton Tower', 'T', 'Multi-pitch'],
        ['5.9+', 'Castleton, Kor-Ingalls', 'Castleton Tower', 'T', 'Classic · 4 pitches'], ['5.11-', 'Lightning Bolt Cracks', 'North Six Shooter', 'T', 'Classic · 3 pitches · .5–#4']
      ]
    }
  };

