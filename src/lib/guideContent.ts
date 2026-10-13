/**
 * Hand-written copy for the kit item and condition pages. The numbers on those pages
 * (temperature ranges, kit tables) are generated from kitLogic; keep the copy free of
 * hard thresholds so it can't drift from the calculator.
 */
import type { RiderInput } from './kitLogic'

export interface Faq { q: string; a: string }

export interface KitItemPage {
  slug: string
  /** Lower-case item name as used in sentences ("arm warmers") */
  name: string
  /** Plural or mass noun? Decides "they're" vs "it's" in generated sentences */
  plural: boolean
  match: (itemName: string) => boolean
  /** Conditions the item depends on (wind for a gilet, rain for a rain jacket) */
  overrides?: Partial<RiderInput>
  /** "in strong wind (…)": goes into the generated sentence and the table description */
  condition?: string
  title: string
  metaTitle: string
  description: string
  intro: string[]
  tips: string[]
  faq: Faq[]
}

export const KIT_ITEM_PAGES: KitItemPage[] = [
  {
    slug: 'when-to-wear-arm-warmers',
    name: 'arm warmers',
    plural: true,
    match: n => n === 'Arm warmers',
    title: 'When to wear arm warmers cycling',
    metaTitle: 'When to Wear Arm Warmers Cycling (Temperature Guide) | kitcheck.cc',
    description: 'At what temperature do you need arm warmers on the bike? Ranges in °C and °F per effort level, from easy rides to racing.',
    intro: [
      "Arm warmers turn a short-sleeve jersey into a long-sleeve one, and back again without stopping. That's why they're the most useful piece of kit for spring and autumn: you start with them on, and when the sun comes through or the road goes up, you push them down to your wrists or take them off and put them in a back pocket.",
      "Below their range you're better off in a proper long-sleeve jersey, which is warmer and doesn't leave a cold gap at the shoulders. Above it, they're dead weight.",
    ],
    tips: [
      'Push them down to your wrists before taking them off. Pulling them off over your gloves while riding is how they end up in the road.',
      'Thermal (fleece-backed) arm warmers for cold mornings, thin Lycra ones for summer mornings and long descents.',
      'Make sure the gripper sits under the jersey sleeve. A gap at the biceps lets cold air straight in.',
    ],
    faq: [
      { q: 'Arm warmers or a long-sleeve jersey?', a: 'A long-sleeve jersey is warmer and more comfortable when it stays cold all ride. Arm warmers win when the temperature changes: a cold start that warms up, or a ride with a long climb and descent. If you expect to take something off during the ride, take arm warmers.' },
      { q: 'Do I need arm warmers if I ride hard?', a: 'Less often. A hard effort makes it feel several degrees warmer on the bike, so the range where you need arm warmers moves to colder temperatures. The table above shows how much.' },
    ],
  },
  {
    slug: 'when-to-wear-knee-warmers',
    name: 'knee warmers',
    plural: true,
    match: n => n === 'Knee warmers',
    title: 'When to wear knee warmers cycling',
    metaTitle: 'When to Wear Knee Warmers Cycling (Temperature Guide) | kitcheck.cc',
    description: 'At what temperature should you wear knee warmers on the bike? Ranges in °C and °F per effort level, plus knee warmers vs leg warmers.',
    intro: [
      "Your knees have almost no muscle or fat around them, and they move through the air the whole ride. That's why they get cold before the rest of your legs do, and why many riders and coaches like to keep them covered on cool days. Knee warmers do exactly that, without the bulk of leg warmers or tights.",
      'They cover the mild band: too warm for leg warmers, too cool for bare knees, especially at the start of a ride or on a descent.',
    ],
    tips: [
      'Put them on before your bib shorts, then pull the shorts over the top so the gripper stays put.',
      'They roll down to fit in a back pocket, but most riders keep them on once they are on: knees rarely overheat.',
      'If you are unsure between knee and leg warmers, look at the start temperature: leg warmers when it is the colder side of the range, knee warmers when it will warm up quickly.',
    ],
    faq: [
      { q: 'Knee warmers or leg warmers?', a: 'Leg warmers for the colder end of the range, knee warmers when it is mild. Leg warmers cover the whole leg and are the step before bib tights; knee warmers are the step before bare legs.' },
      { q: 'Should I always cover my knees below a certain temperature?', a: "Many road cyclists keep their knees covered on cool days because the joint has little natural insulation. kitcheck.cc recommends knee or leg warmers over the whole range where bare knees would get cold, and makes them optional on the warm edge of that range." },
    ],
  },
  {
    slug: 'when-to-wear-leg-warmers',
    name: 'leg warmers',
    plural: true,
    match: n => n === 'Leg warmers',
    title: 'When to wear leg warmers cycling',
    metaTitle: 'When to Wear Leg Warmers Cycling (Temperature Guide) | kitcheck.cc',
    description: 'At what temperature do you need leg warmers on the bike? Ranges in °C and °F per effort level, and when to switch to bib tights.',
    intro: [
      "Leg warmers sit between bib shorts and bib tights. With bib shorts they give you full leg coverage on a cool morning, and unlike tights you can take them off if it warms up, as long as you can get them over your shoes.",
      "Below their range, bib tights are the better choice: no gap at the thigh, and a warmer, often windproof fabric.",
    ],
    tips: [
      'Take them off before you get properly warm. Pulling leg warmers over cycling shoes on the side of the road is fiddly, and that only gets worse when you are sweating.',
      'Fleece-lined leg warmers are nearly as warm as tights. Thin ones are closer to knee warmers with extra coverage.',
      'With leg warmers your knees are covered too, so you never need knee warmers on top.',
    ],
    faq: [
      { q: 'Leg warmers or bib tights?', a: 'Bib tights when it stays cold the whole ride, leg warmers when it might warm up. Tights are warmer and more comfortable; leg warmers give you the option to take them off.' },
      { q: 'Do leg warmers count as winter kit?', a: 'Not really. They are for the cool months either side of winter. In real winter conditions bib tights or thermal bib tights keep you warmer and drier.' },
    ],
  },
  {
    slug: 'bib-tights-or-bib-shorts',
    name: 'bib tights',
    plural: true,
    match: n => n.toLowerCase().includes('bib tights'),
    title: 'Bib tights or bib shorts: at what temperature?',
    metaTitle: 'Bib Tights or Bib Shorts? The Temperature to Switch | kitcheck.cc',
    description: 'At what temperature should you wear bib tights instead of bib shorts? The switch point in °C and °F per effort level, and when thermal tights make sense.',
    intro: [
      "Bib tights are the default for winter riding: full leg coverage, no gaps, and usually a fleece-backed fabric that holds heat. Thermal bib tights go a step further with a heavier lining, sometimes with windproof panels on the front.",
      "Above their range it's bib shorts, first with leg warmers, then knee warmers, then nothing. The table below shows where each step starts.",
    ],
    tips: [
      'Bib tights with a chamois are the simplest option. Tights without a chamois can be worn over your summer bib shorts, which is cheaper if you already own good shorts.',
      'Windproof panels on the front of thermal tights help a lot when it is freezing, and are too warm for anything milder.',
      'If you are in doubt on the warm end of the range, bib shorts with leg warmers give you a way out.',
    ],
    faq: [
      { q: 'Thermal bib tights or regular bib tights?', a: 'Thermal bib tights for the coldest days, roughly around freezing and below at a moderate pace. Regular, fleece-backed bib tights cover the rest of the cold range.' },
      { q: 'Can I wear bib tights over bib shorts?', a: 'Yes, if the tights have no chamois. Two chamois on top of each other is uncomfortable; tights without a pad over your normal bib shorts work well.' },
    ],
  },
  {
    slug: 'when-to-wear-a-base-layer-cycling',
    name: 'a base layer',
    plural: false,
    match: n => n.toLowerCase().includes('base layer'),
    title: 'When to wear a base layer cycling',
    metaTitle: 'When to Wear a Base Layer Cycling (Temperature Guide) | kitcheck.cc',
    description: 'At what temperature do you need a base layer on the bike? Ranges in °C and °F per effort level, and when a thermal base layer makes sense.',
    intro: [
      "A base layer does two jobs: it keeps a thin layer of warm air against your skin, and it moves sweat away from you so you don't get cold when you slow down. That second job is why many riders wear a thin base layer all year, even under a summer jersey.",
      "In kitcheck.cc's recommendations, a base layer is listed when it adds meaningful warmth: required in the cold, optional in the cool range where it depends on how warm you run.",
    ],
    tips: [
      'Merino stays warm when wet and smells less; synthetic dries faster. Both work.',
      'Long-sleeve thermal base layers are for real winter; short-sleeve or sleeveless ones are enough under a long-sleeve jersey.',
      'If you sweat a lot, a base layer under your jersey usually keeps you warmer than a thicker jacket over it.',
    ],
    faq: [
      { q: 'Should I wear a base layer in summer?', a: 'A thin mesh base layer in summer is about moving sweat, not warmth, and it is a personal choice. kitcheck.cc only lists a base layer when you need it for warmth.' },
      { q: 'Thermal base layer or regular base layer?', a: 'A thermal (thicker, often long-sleeve) base layer for proper winter riding, a regular one for cool days. The ranges above show when each is recommended.' },
    ],
  },
  {
    slug: 'when-to-wear-overshoes-cycling',
    name: 'overshoes',
    plural: true,
    match: n => /overshoes|toe covers/i.test(n),
    title: 'When to wear overshoes cycling',
    metaTitle: 'When to Wear Overshoes Cycling (Temperature Guide) | kitcheck.cc',
    description: 'At what temperature do you need overshoes or toe covers on the bike? Ranges in °C and °F, and which kind of overshoe for which conditions.',
    intro: [
      'Cycling shoes are built to let air through, which is great in summer and terrible in the cold. Your feet barely move, sit right in the wind and warm up much less from effort than your body does. That makes overshoes one of the most important pieces of cold-weather kit.',
      'There are three kinds, and the temperature decides which: toe covers for cool mornings, light overshoes for the cool range, and thermal or waterproof neoprene overshoes for winter and cold rain.',
    ],
    tips: [
      'Put overshoes on before you leave, and wear them all ride. Nobody wants to stop and pull them on halfway, and you only have one pair with you.',
      'In the rain, light rain overshoes keep your shoes dry even when it is warm. That counts double on a multi-day trip.',
      'Thermal socks inside the shoe plus overshoes outside is warmer than very thick socks in a tight shoe.',
    ],
    faq: [
      { q: 'Toe covers or full overshoes?', a: 'Toe covers for cool, dry rides where only your toes get cold. Full overshoes when it is cold or wet. kitcheck.cc lists toe covers as optional on the warm edge of the range and full overshoes below it.' },
      { q: 'Do I need overshoes when I ride hard?', a: 'Usually yes. Effort warms your body, but your feet benefit only a little, so the overshoe range shifts much less with intensity than the range for jackets or arm warmers.' },
    ],
  },
  {
    slug: 'when-to-wear-winter-cycling-gloves',
    name: 'winter gloves',
    plural: true,
    match: n => /winter gloves/i.test(n),
    title: 'When to wear winter cycling gloves',
    metaTitle: 'When to Wear Winter Cycling Gloves (Temperature Guide) | kitcheck.cc',
    description: 'At what temperature do you need thermal or waterproof winter gloves on the bike? Ranges in °C and °F per effort level.',
    intro: [
      "Hands are the first thing to go numb on a cold ride. They're in the wind the whole time, you barely move them, and riding hard barely warms them. Cold fingers also make braking and shifting harder, which is a safety problem, not just a comfort one.",
      "kitcheck.cc uses three steps for full-finger gloves: light cycling gloves for the cool range, thermal winter gloves when it's cold, and waterproof winter gloves when it's freezing or cold and wet.",
    ],
    tips: [
      'Gloves stay on all ride. If the ride gets colder later on, start in the warmer pair: you only have one pair with you.',
      'Thin liner gloves under winter gloves add warmth without the bulk of lobster gloves.',
      'Put your gloves on inside, where your hands are still warm. Warming up cold hands inside cold gloves takes a long time.',
    ],
    faq: [
      { q: 'At what temperature do I need full-finger gloves?', a: 'Light full-finger gloves come in a few degrees above the winter glove range, in the cool band where fingerless gloves let too much wind through. The calculator shows the right pair for your ride.' },
      { q: 'Waterproof or thermal winter gloves?', a: 'Waterproof winter gloves when it is freezing or when rain is likely in the cold: wet hands lose heat very fast. Thermal gloves for cold, dry rides.' },
    ],
  },
  {
    slug: 'when-to-wear-a-cycling-gilet',
    name: 'a gilet',
    plural: false,
    match: n => n === 'Wind gilet',
    overrides: { windspeed: 30 },
    condition: 'in strong wind (30 km/h, 19 mph)',
    title: 'When to wear a cycling gilet',
    metaTitle: 'When to Wear a Cycling Gilet (Wind Vest) | kitcheck.cc',
    description: 'When is a cycling gilet or wind vest worth it? Temperatures in °C and °F, why wind matters more than temperature, and gilet vs rain jacket.',
    intro: [
      'A gilet (or wind vest) blocks the wind on your chest and stomach and leaves your arms free, so you stay warm without overheating. It packs into a jersey pocket, which makes it the go-to layer for windy days, early starts and long descents.',
      "Wind is what decides it, more than the temperature. That's why kitcheck.cc lists a gilet as optional when the wind is strong, and leaves it out on calm days. If rain is likely, a rain jacket replaces it.",
    ],
    tips: [
      'Put it on at the top of a climb, before the descent, not halfway down.',
      'A gilet with a mesh back lets heat out on the climbs; a full windproof one is warmer on the flat into a headwind.',
      'If you only take one extra layer on a changeable day, a gilet is usually the best choice.',
    ],
    faq: [
      { q: 'Gilet or rain jacket?', a: 'A gilet for wind, a rain jacket for rain. A gilet is not waterproof and does nothing for your arms in the rain. If showers are possible, a packable rain jacket in your pocket does both jobs, just less breathably.' },
      { q: 'Do I need a gilet in summer?', a: 'For long Alpine descents or early starts, often yes. On a warm, calm day at home, no.' },
    ],
  },
]

export interface ConditionPage {
  slug: string
  title: string
  metaTitle: string
  description: string
  intro: string
  sections: { heading: string; body: string[] }[]
  /** Generated kit table: one row per temperature, with these conditions */
  table?: { heading: string; caption: string; temps: number[]; overrides: Partial<RiderInput> }
  faq: Faq[]
  /** Item pages worth linking from here */
  related: string[]
}

export const CONDITION_PAGES: ConditionPage[] = [
  {
    slug: 'what-to-wear-cycling-in-the-rain',
    title: 'What to wear cycling in the rain',
    metaTitle: 'What to Wear Cycling in the Rain (by Temperature) | kitcheck.cc',
    description: 'Rain kit for road cycling, scaled to the temperature: when you need a waterproof jacket, gloves and overshoes, and when a packable jacket is enough.',
    intro: "How much rain kit you need depends mostly on the temperature. Cold rain is the most dangerous weather for a road cyclist: wet hands and feet go numb fast, and a soaked jersey keeps cooling you down. Warm rain is mostly a nuisance. So the question isn't just \"will it rain?\" but \"how cold will it be when I'm wet?\"",
    sections: [
      {
        heading: 'Cold rain: waterproof everything',
        body: [
          'When it is cold and rain is likely, you want a proper waterproof jacket, waterproof winter gloves and waterproof overshoes. Keeping your hands and feet dry matters most: once they are wet and cold, they stay that way for the rest of the ride.',
          'Mudguards (fenders) do as much for your comfort as any piece of clothing: they keep the spray off your back and feet, and your riding partners will thank you.',
        ],
      },
      {
        heading: 'Mild rain: a packable jacket',
        body: [
          'In the mild range, a packable rain jacket is enough. It is lighter and breathes better than a winter rain jacket, and fits in a jersey pocket when the rain stops. Thin rain overshoes keep your shoes and socks dry.',
        ],
      },
      {
        heading: 'Warm rain: optional',
        body: [
          'When it is warm, many riders skip the jacket entirely and accept getting wet: you warm up quickly and a wet summer jersey dries fast. Take a packable jacket in your pocket anyway for descents or if the temperature drops.',
        ],
      },
      {
        heading: 'Chance of showers',
        body: [
          "When the forecast gives a moderate chance of rain (40–59%), kitcheck.cc lists a packable rain jacket as optional. From a 60% chance, it treats rain as likely and adds the full rain kit for the temperature. With a GPX route, the calculator also tells you if the rain arrives or stops during your ride.",
        ],
      },
    ],
    table: {
      heading: 'Rain kit by temperature',
      caption: 'Rain likely (60% chance or more), moderate pace, light wind.',
      temps: [0, 5, 10, 15, 20, 25],
      overrides: { precipProb: 80 },
    },
    faq: [
      { q: 'Do I need a waterproof jacket or is a packable one enough?', a: 'A waterproof jacket when it is cold, a packable rain jacket when it is mild, and optional when it is warm. The table on this page shows the switch points for a moderate pace.' },
      { q: 'How do I keep my feet dry cycling in the rain?', a: 'Waterproof overshoes over your shoes, and mudguards on the bike. In warm rain, thin rain overshoes are enough. Nothing keeps feet dry for hours in heavy rain, so in the cold add thermal socks: warm and wet is better than cold and wet.' },
      { q: 'Should I ride in the rain at all?', a: 'In warm rain, there is little reason not to. In cold rain, keep the ride shorter and closer to home, and be careful on painted lines, metal covers and the first wet minutes after a dry spell, when roads are slippery.' },
    ],
    related: ['when-to-wear-overshoes-cycling', 'when-to-wear-winter-cycling-gloves', 'when-to-wear-a-cycling-gilet'],
  },
  {
    slug: 'what-to-wear-cycling-in-wind',
    title: 'What to wear cycling in the wind',
    metaTitle: 'What to Wear Cycling in Strong Wind | kitcheck.cc',
    description: 'How wind changes what to wear on the bike: why it feels colder than the forecast, when a gilet helps, and what changes at each temperature.',
    intro: "Wind makes a ride feel colder in two ways. The forecast's feels-like temperature already includes wind chill, but on a bike you also ride into it: a headwind adds your own speed to the wind speed. That's why a windy 15°C (59°F) can feel like a cool spring morning.",
    sections: [
      {
        heading: 'What changes in the wind',
        body: [
          "kitcheck.cc uses the forecast's feels-like temperature and then adds a small extra penalty for strong wind, for the airflow of riding into it. In practice that means one step warmer kit in the cool range, and a wind gilet as an option when the wind is strong.",
          'With a GPX route, the calculator goes further: it compares the wind direction with your riding direction along the route. A headwind counts fully, a tailwind barely, and the longest headwind stretch shows up in the notes.',
        ],
      },
      {
        heading: 'A gilet or windproof jacket',
        body: [
          'The single most useful thing on a windy day is a windproof layer on your chest: a gilet when it is mild, a windproof jacket or softshell when it is cold. Your arms and legs matter less, because they are moving.',
        ],
      },
      {
        heading: 'Plan the route around the wind',
        body: [
          'Ride out into the wind and home with it behind you. You get the hard part done while you are fresh, and you do not get cold on the way back when you are tired and slower.',
        ],
      },
    ],
    table: {
      heading: 'Kit in strong wind by temperature',
      caption: 'Wind 35 km/h (22 mph), moderate pace, no rain.',
      temps: [0, 5, 10, 15, 20],
      overrides: { windspeed: 35 },
    },
    faq: [
      { q: 'How much colder does wind make a bike ride feel?', a: "It depends on the temperature and wind speed, and the forecast's feels-like temperature already accounts for most of it. On the bike, riding into a strong headwind adds a few degrees on top. On a windy day, plan for kit one step warmer than the plain temperature suggests." },
      { q: 'Should I ride into the wind first?', a: 'Yes, if you can. Start into the wind and finish with it behind you, so you are not fighting a headwind when you are tired and riding slower.' },
    ],
    related: ['when-to-wear-a-cycling-gilet', 'when-to-wear-arm-warmers', 'when-to-wear-overshoes-cycling'],
  },
  {
    slug: 'winter-cycling-clothing',
    title: 'Winter cycling clothing: what to wear in the cold',
    metaTitle: 'Winter Cycling Clothing: What to Wear in the Cold | kitcheck.cc',
    description: 'What to wear for road cycling in winter, from 8°C (46°F) down to freezing and below: layers, gloves, overshoes and what changes with effort.',
    intro: 'Winter riding is all about layers and extremities. Your body stays warm if you dress it right and keep moving; your hands, feet and ears are what decide how long you can stay out. Here is what to wear from the cool end of winter down to freezing.',
    sections: [
      {
        heading: 'Layering your upper body',
        body: [
          'Three layers is the classic winter setup: a thermal base layer that moves sweat away from your skin, a winter jersey for insulation, and a windproof outer layer. In the coldest conditions that outer layer is an insulated jacket; when it is a bit milder, a softshell can replace both jersey and jacket.',
          'Do not overdress. If you are warm when you walk out of the door, you will be sweating ten minutes into the ride, and wet layers get cold on the first descent.',
        ],
      },
      {
        heading: 'Hands, feet and head',
        body: [
          'Effort warms your body, but your hands and feet barely benefit from it. That is why kitcheck.cc chooses gloves and overshoes a step warmer than the body layers, especially when you ride hard.',
          'A thermal skull cap or cycling cap under your helmet covers your ears and forehead. Gloves and overshoes go on before you leave and stay on: if the ride gets colder later, start with the warmer pair.',
        ],
      },
      {
        heading: 'Ice and short days',
        body: [
          'Below freezing, the road is the bigger risk: black ice on shaded corners, bridges and wet patches. Ride routes you know, use lights even during the day, and keep winter rides shorter and closer to home.',
        ],
      },
    ],
    table: {
      heading: 'Winter kit by temperature',
      caption: 'Moderate pace, light wind, no rain.',
      temps: [-10, -5, 0, 3, 5, 8],
      overrides: {},
    },
    faq: [
      { q: 'What should I wear cycling at freezing temperatures?', a: 'A thermal skull cap, thermal base layer, winter jersey and insulated or windproof jacket, waterproof or thermal winter gloves, thermal bib tights, and full overshoes over thermal socks. The table on this page shows the full kit per temperature.' },
      { q: 'How do I keep my hands and feet warm cycling in winter?', a: 'Choose gloves and overshoes for the coldest part of the ride and put them on before you leave. Thin liner gloves and thermal socks add warmth without making things tight; tight shoes and gloves cut off circulation and make it worse.' },
      { q: 'How many layers should I wear cycling in winter?', a: 'Usually three on your upper body: a base layer, a winter jersey and a windproof or insulated jacket. In milder winter weather, two layers (a thermal base layer under a softshell or winter jersey) are enough.' },
    ],
    related: ['bib-tights-or-bib-shorts', 'when-to-wear-winter-cycling-gloves', 'when-to-wear-overshoes-cycling', 'when-to-wear-a-base-layer-cycling'],
  },
  {
    slug: 'what-to-wear-cycling-in-hot-weather',
    title: 'What to wear cycling in hot weather',
    metaTitle: 'What to Wear Cycling in Hot Weather | kitcheck.cc',
    description: 'Road cycling in the heat: the lightest kit, sun protection, how much to drink and how to plan a ride when it is 25°C (77°F) or hotter.',
    intro: 'Once it is properly warm, your kit is simple: a lightweight summer jersey and bib shorts. What makes or breaks a hot ride is everything around the kit: when you ride, what you drink, and how you deal with the sun.',
    sections: [
      {
        heading: 'Kit for the heat',
        body: [
          'The lightest, thinnest jersey you own, ideally light-coloured and with a full-length zip so you can open it on climbs. Bib shorts, summer socks, and fingerless gloves only if you like them for grip. A thin cycling cap under the helmet keeps sun off your head and sweat out of your eyes.',
        ],
      },
      {
        heading: 'Drink and plan',
        body: [
          "From a feels-like temperature of 27°C (81°F), kitcheck.cc adds a heat note: take an extra bottle and put on sunscreen. Put electrolytes in at least one bottle, plan a café or water stop on longer rides, and start early in the morning or ride late in the afternoon, when it's cooler.",
          'Ride a notch easier than usual on the climbs. Your body has to work harder to cool down, and pushing your normal pace in the heat costs more than it gives.',
        ],
      },
      {
        heading: 'Sun protection',
        body: [
          "Sunscreen on your arms, legs, neck and the backs of your knees, and reapply it on long rides. Sunglasses help against glare and keep insects out of your eyes.",
        ],
      },
    ],
    faq: [
      { q: 'What is too hot for cycling?', a: 'There is no single limit, and it depends on humidity, how used you are to the heat and how hard you ride. Above about 30°C (86°F), ride early, shorten the route, plan water stops and stop if you feel dizzy or stop sweating.' },
      { q: 'Should I wear a base layer in hot weather?', a: 'Some riders like a thin mesh base layer in the heat because it moves sweat away from the skin. It is a personal choice; kitcheck.cc does not list one when it is warm.' },
    ],
    related: ['when-to-wear-arm-warmers', 'when-to-wear-a-cycling-gilet'],
  },
]
