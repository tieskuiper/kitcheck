/**
 * Hand-written copy for the kit item and condition pages. The numbers on those pages
 * (temperature ranges, kit tables) are generated from kitLogic; keep the copy free of
 * hard thresholds so it can't drift from the calculator.
 */
import type { RiderInput } from './kitLogic'

export interface Faq { q: string; a: string }

export interface KitItemPage {
  slug: string
  /** Short label for navigation and cards ("Arm warmers") */
  label: string
  zone: 'head' | 'torso' | 'hands' | 'legs' | 'feet'
  /** Lower-case item name as used in sentences ("arm warmers") */
  name: string
  /** Plural or mass noun? Decides "they're" vs "it's" in generated sentences */
  plural: boolean
  match: (itemName: string) => boolean
  /** A second item covered on the same page (leg warmers on the bib tights page) */
  extra?: { label: string; name: string; plural: boolean; match: (itemName: string) => boolean }
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
    slug: 'when-to-wear-arm-and-knee-warmers',
    label: 'Arm & knee warmers',
    zone: 'torso',
    name: 'arm and knee warmers',
    plural: true,
    match: n => n === 'Arm warmers' || n === 'Knee warmers',
    title: 'When to wear arm and knee warmers cycling',
    metaTitle: 'When to Wear Arm and Knee Warmers Cycling | kitcheck.cc',
    description: 'At what temperature do you need arm and knee warmers on the bike? Ranges in °C and °F per effort level, plus when to switch to long sleeves or leg warmers.',
    intro: [
      "Arm and knee warmers turn summer kit into spring kit. You start with them on, and when the sun comes through or the road goes up, you push them down or take them off and put them in a back pocket. That makes them the most useful pieces of kit for the in-between months.",
      "They come in together: the temperature where your arms want cover is about where your knees do too. Knees have almost no muscle or fat around them, which is why many riders keep them covered on cool days. Below this range, a long-sleeve jersey and leg warmers take over.",
    ],
    tips: [
      'Push arm warmers down to your wrists before taking them off. Pulling them over your gloves while riding is how they end up in the road.',
      'Put knee warmers on before your bib shorts and pull the shorts over the top, so the grippers stay put.',
      'Thermal (fleece-backed) warmers for cold mornings, thin Lycra ones for summer mornings and long descents.',
    ],
    faq: [
      { q: 'Arm warmers or a long-sleeve jersey?', a: 'A long-sleeve jersey is warmer and more comfortable when it stays cold all ride. Arm warmers win when the temperature changes: a cold start that warms up, or a ride with a long climb and descent. If you expect to take something off during the ride, take arm warmers.' },
      { q: 'Knee warmers or leg warmers?', a: 'Leg warmers for the colder end, knee warmers when it is mild. Leg warmers cover the whole leg and are the step before bib tights; knee warmers are the step before bare legs.' },
      { q: 'Do I need warmers if I ride hard?', a: 'Less often. A hard effort makes it feel several degrees warmer on the bike, so the range moves to colder temperatures. The ranges on this page show how much.' },
    ],
  },
  {
    slug: 'bib-tights-or-bib-shorts',
    label: 'Bib tights or shorts',
    zone: 'legs',
    name: 'bib tights',
    plural: true,
    match: n => n.toLowerCase().includes('bib tights'),
    extra: { label: 'Leg warmers', name: 'leg warmers', plural: true, match: n => n === 'Leg warmers' },
    title: 'Bib tights, leg warmers or bib shorts?',
    metaTitle: 'Bib Tights or Bib Shorts? When to Switch | kitcheck.cc',
    description: 'At what temperature should you wear bib tights, bib shorts with leg warmers, or just bib shorts? Switch points in °C and °F per effort level.',
    intro: [
      "Your legs go through three steps as it gets colder: bib shorts, then bib shorts with leg warmers, then bib tights. Leg warmers are the flexible middle step: full coverage on a cool morning, and you can take them off if it warms up, as long as you can get them over your shoes.",
      "Bib tights are the default for winter: no gap at the thigh, and usually a fleece-backed fabric that holds heat. Thermal bib tights go a step further for the coldest days, sometimes with windproof panels on the front.",
    ],
    tips: [
      'Take leg warmers off before you get properly warm: pulling them over cycling shoes on the side of the road only gets harder when you are sweating.',
      'Tights without a chamois can go over your summer bib shorts, which is cheaper if you already own good shorts.',
      'On the warm end of the tights range, bib shorts with leg warmers give you a way out.',
    ],
    faq: [
      { q: 'Leg warmers or bib tights?', a: 'Bib tights when it stays cold the whole ride, leg warmers when it might warm up. Tights are warmer and more comfortable; leg warmers give you the option to take them off.' },
      { q: 'Thermal bib tights or regular bib tights?', a: 'Thermal bib tights for the coldest days, roughly around freezing and below at a moderate pace. Regular, fleece-backed bib tights cover the rest of the cold range.' },
      { q: 'Can I wear bib tights over bib shorts?', a: 'Yes, if the tights have no chamois. Two chamois on top of each other is uncomfortable; tights without a pad over your normal bib shorts work well.' },
    ],
  },
  {
    slug: 'when-to-wear-a-base-layer-cycling',
    label: 'Base layer',
    zone: 'torso',
    name: 'a base layer',
    plural: false,
    match: n => n.toLowerCase().includes('base layer'),
    title: 'When to wear a base layer cycling',
    metaTitle: 'When to Wear a Base Layer Cycling | kitcheck.cc',
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
    label: 'Overshoes',
    zone: 'feet',
    name: 'overshoes',
    plural: true,
    match: n => /overshoes|toe covers/i.test(n),
    title: 'When to wear overshoes cycling',
    metaTitle: 'When to Wear Overshoes Cycling | kitcheck.cc',
    description: 'At what temperature do you need overshoes or toe covers on the bike? Ranges in °C and °F, and which kind of overshoe for which conditions.',
    intro: [
      'Cycling shoes are built to let air through, which is great in summer and terrible in the cold. Your feet barely move, sit right in the wind and warm up much less from effort than your body does. That makes overshoes one of the most important pieces of cold-weather kit.',
      'There are three kinds, and the temperature decides which: toe covers for cool mornings, light overshoes for the cool range, and thermal or waterproof neoprene overshoes for winter and cold rain.',
    ],
    tips: [
      'Put overshoes on before you leave, and wear them all ride. Nobody wants to stop and pull them on halfway, and you only have one pair with you.',
      'In mild rain, light rain overshoes keep your shoes and socks dry. That counts double on a multi-day trip.',
      'Thermal socks inside the shoe plus overshoes outside is warmer than very thick socks in a tight shoe.',
    ],
    faq: [
      { q: 'Toe covers or full overshoes?', a: 'Toe covers for cool, dry rides where only your toes get cold; full thermal or waterproof overshoes when it is cold or wet. kitcheck.cc lists toe covers as optional on the warm edge of the range, light overshoes or toe covers below that, and thermal overshoes from about 6°C (43°F) down.' },
      { q: 'Do I need overshoes when I ride hard?', a: 'Usually yes. Effort warms your body, but your feet benefit only a little, so the overshoe range shifts much less with intensity than the range for jackets or arm warmers.' },
    ],
  },
  {
    slug: 'when-to-wear-winter-cycling-gloves',
    label: 'Winter gloves',
    zone: 'hands',
    name: 'winter gloves',
    plural: true,
    match: n => /winter gloves/i.test(n),
    title: 'When to wear winter cycling gloves',
    metaTitle: 'When to Wear Winter Cycling Gloves | kitcheck.cc',
    description: 'At what temperature do you need thermal or waterproof winter gloves on the bike? Ranges in °C and °F per effort level.',
    intro: [
      "Hands are the first thing to go numb on a cold ride. They're in the wind the whole time, you barely move them, and riding hard barely warms them. Cold fingers also make braking and shifting harder, which is a safety problem, not just a comfort one.",
      "kitcheck.cc uses three steps for full-finger gloves: light cycling gloves for the cool range, thermal winter gloves when it's cold (even well below freezing, if it's dry), and waterproof winter gloves when it's cold and wet.",
    ],
    tips: [
      'Gloves stay on all ride. If the ride gets colder later on, start in the warmer pair: you only have one pair with you.',
      'Thin liner gloves under winter gloves add warmth without the bulk of lobster gloves.',
      'Put your gloves on inside, where your hands are still warm. Warming up cold hands inside cold gloves takes a long time.',
    ],
    faq: [
      { q: 'At what temperature do I need full-finger gloves?', a: 'Light full-finger gloves come in a few degrees above the winter glove range, in the cool band where fingerless gloves let too much wind through. The calculator shows the right pair for your ride.' },
      { q: 'Waterproof or thermal winter gloves?', a: 'Waterproof winter gloves when rain is likely in the cold: wet hands lose heat very fast. Thermal gloves for cold, dry rides, even below freezing.' },
    ],
  },
]

export interface ConditionPage {
  slug: string
  label: string
  icon: 'rain' | 'wind' | 'snow' | 'sun' | 'clock'
  /** One line for cards */
  teaser: string
  /** Three key numbers for the hero — they mirror constants in kitLogic, update them together */
  facts: { value: string; text: string }[]
  title: string
  metaTitle: string
  description: string
  intro: string
  sections: { heading: string; body: string[] }[]
  /** FAQ lead line; defaults to "What riders ask about cycling in the <label>." */
  faqLead?: string
  /** Generated kit table: one row per temperature, with these conditions */
  table?: { heading: string; caption: string; temps: number[]; overrides: Partial<RiderInput> }
  faq: Faq[]
  /** Item pages worth linking from here */
  related: string[]
}

export const CONDITION_PAGES: ConditionPage[] = [
  {
    slug: 'what-to-wear-cycling-in-the-rain',
    label: 'Rain',
    icon: 'rain',
    teaser: 'Rain clothing scaled to the temperature: when you need waterproofs, and when a packable jacket will do.',
    facts: [
      { value: '60%', text: 'chance of rain: rain is likely, full rain kit scaled to the temperature' },
      { value: '40%', text: 'chance of showers: a packable rain jacket as an option' },
      { value: '15°C', text: '59°F: below this at a moderate pace, a proper waterproof jacket' },
    ],
    title: 'What to wear cycling in the rain: kit by temperature',
    metaTitle: 'What to Wear Cycling in the Rain: Kit by Temperature | kitcheck.cc',
    description: 'Rain clothing for road cycling, scaled to the temperature: waterproof jacket or packable, gloves, overshoes, legs, head and eyes, plus bike prep and riding in the wet.',
    intro: "What to wear cycling in the rain depends mostly on how cold it is. In cold rain you want a proper waterproof jacket, waterproof gloves and waterproof overshoes; in mild rain a packable rain jacket and light rain overshoes are enough; in warm rain the jacket is optional. Your legs follow the temperature, not the rain. Cold rain is the most dangerous weather for a road cyclist, because wet hands and feet go numb fast, so the real question is: how cold will it be when I'm wet?",
    sections: [
      {
        heading: 'Cold rain: waterproof everything',
        body: [
          'When it is cold and rain is likely, wear a waterproof jacket over your normal cold-weather layers, waterproof winter gloves and waterproof overshoes. In real cold, add thermal socks under the overshoes. Keeping your hands and feet dry matters most: once they are wet and cold, they stay that way for the rest of the ride.',
          'Keep a base layer under the jacket. Even a breathable waterproof traps some sweat, and a base layer moves it away from your skin so you do not get cold when you slow down.',
        ],
      },
      {
        heading: 'Mild rain: a packable jacket',
        body: [
          'In the mild range, a packable rain jacket is enough. It is lighter and breathes better than a winter rain jacket, and fits in a jersey pocket when the rain stops. Light rain overshoes keep your shoes and socks dry for longer, and thin full-finger gloves help your grip on wet bar tape.',
        ],
      },
      {
        heading: 'Warm rain: optional',
        body: [
          'When it is warm, many riders skip the jacket and accept getting wet: you warm up quickly and a wet summer jersey dries fast. Take a packable jacket in your pocket anyway for descents, a long stop or a drop in temperature.',
        ],
      },
      {
        heading: 'Your legs in the rain',
        body: [
          'kitcheck.cc does not change your leg kit for rain: bib shorts, warmers or bib tights follow the temperature, exactly as on a dry day. Your legs keep moving and stay warm even when wet.',
          'On long, cold, wet rides, water-repellent bib tights or leg warmers keep the spray off for longer. Full waterproof trousers are rarely worth it on a road bike: they flap, rub and make you sweat.',
        ],
      },
      {
        heading: 'Head and eyes',
        body: [
          'A cycling cap with a peak under your helmet keeps rain out of your eyes; pick a synthetic one, because cotton soaks up water and goes cold. In cold rain, a thermal cap also covers your ears.',
          'Glasses with clear or light lenses keep spray and grit out of your eyes. Dark lenses make a grey, wet day even darker.',
        ],
      },
      {
        heading: 'Showers or rain likely?',
        body: [
          'When the forecast gives a moderate chance of rain, kitcheck.cc lists a packable rain jacket as optional. Once rain is likely, it adds the full rain kit for the temperature, as in the table on this page.',
          'Rain often starts or stops during a ride. The calculator checks every hour of your ride and tells you when rain is expected or when it turns dry. With a GPX route, it also shows where along the route rain becomes likely. Gloves and overshoes are chosen for the whole ride, so a dry start that turns wet gets waterproof ones from the start.',
        ],
      },
      {
        heading: 'Get the bike ready',
        body: [
          'Mudguards (fenders) do as much for your comfort as any piece of clothing: they keep spray off your back and feet, and off the rider behind you. Run your tyres a little softer than usual for more grip, and use lights front and rear, even in daylight.',
          'After the ride, rinse the grit off and dry and lube the chain. Stuff wet shoes with newspaper, and wash your rain jacket now and then with a cleaner made for waterproofs, so the water keeps beading off.',
        ],
      },
      {
        heading: 'Riding in the wet',
        body: [
          'Brakes need longer to bite in the wet, especially rim brakes, so brake earlier and more gently. Corner more upright and a bit slower, and keep your speed in check on descents.',
          'Painted lines, metal covers, wet leaves and the first rain after a dry spell are the slippery bits. Ride around puddles when you can: they hide potholes.',
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
      { q: 'What should I wear cycling in the rain?', a: 'It depends on the temperature. In cold rain: a waterproof jacket over your warm layers, waterproof winter gloves and waterproof overshoes. In mild rain: a packable rain jacket and light rain overshoes. In warm rain the jacket is optional. Your legs follow the temperature, as on a dry day. The table on this page shows the full kit per temperature.' },
      { q: 'Do I need a waterproof jacket or is a packable one enough?', a: 'A waterproof jacket when it is cold, a packable rain jacket when it is mild, and optional when it is warm. At a moderate pace the switch to a proper waterproof jacket is around 15°C (59°F).' },
      { q: 'What should I wear cycling in light rain or drizzle?', a: 'A packable rain jacket you can take off when it stops, plus light rain overshoes if it is cool. Drizzle soaks you slowly, so on a long ride it counts as rain. If it is warm, a jersey is fine and you will dry quickly.' },
      { q: 'How do I keep my feet dry cycling in the rain?', a: 'Waterproof overshoes over your shoes, and mudguards on the bike. In mild rain, light rain overshoes are enough; in warm rain most riders accept wet feet. Nothing keeps feet dry for hours in heavy rain, so in the cold add thermal socks: warm and wet is better than cold and wet.' },
      { q: 'Do I need waterproof gloves for cycling in the rain?', a: 'When it is cold, yes: wet hands lose heat fast and get numb, which also makes braking harder. In mild rain, thin full-finger gloves are enough for grip, and in warm rain you can ride without.' },
      { q: 'Should I ride in the rain at all?', a: 'In warm rain, there is little reason not to. In cold rain, keep the ride shorter and closer to home, and be careful on painted lines, metal covers and the first wet minutes after a dry spell, when roads are slippery.' },
    ],
    related: ['when-to-wear-overshoes-cycling', 'when-to-wear-winter-cycling-gloves', 'bib-tights-or-bib-shorts', 'when-to-wear-a-base-layer-cycling'],
  },
  {
    slug: 'what-to-wear-cycling-in-wind',
    label: 'Wind',
    icon: 'wind',
    teaser: 'Why wind makes it feel colder on the bike, and the one layer that helps most.',
    facts: [
      { value: '25 km/h', text: '16 mph: from here a wind gilet is suggested' },
      { value: 'GPX', text: 'routes: wind is judged against your riding direction' },
      { value: '35 km/h', text: '22 mph wind feels a few degrees colder on the bike: kit near a switch point goes a step warmer' },
    ],
    title: 'What to wear cycling in the wind',
    metaTitle: 'What to Wear Cycling in Strong Wind | kitcheck.cc',
    description: 'How wind changes what to wear on the bike: why it feels colder than the forecast, when a gilet helps, and what changes at each temperature.',
    intro: "Wind makes a ride feel colder in two ways. The forecast's feels-like temperature already includes wind chill, but on a bike you also ride into it: a headwind adds your own speed to the wind speed. That's why a windy 15°C (59°F) can feel like a cool spring morning.",
    sections: [
      {
        heading: 'What changes in the wind',
        body: [
          "kitcheck.cc uses the forecast's feels-like temperature and then adds a small extra penalty for strong wind, for the airflow of riding into it. In practice it feels a few degrees colder: kit close to a switch point goes a step warmer, and a wind gilet becomes an option when the wind is strong.",
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
      { q: 'How much colder does wind make a bike ride feel?', a: "It depends on the temperature and wind speed, and the forecast's feels-like temperature already accounts for most of it. On the bike, riding into a strong headwind adds a few degrees on top. On a windy day, if you are between two kit choices, take the warmer one." },
      { q: 'Gilet or rain jacket?', a: 'A gilet for wind, a rain jacket for rain. A gilet is not waterproof and does nothing for your arms in the rain. If showers are possible, a packable rain jacket in your pocket does both jobs, just less breathably.' },
      { q: 'Should I ride into the wind first?', a: 'Yes, if you can. Start into the wind and finish with it behind you, so you are not fighting a headwind when you are tired and riding slower.' },
    ],
    related: ['when-to-wear-arm-and-knee-warmers', 'when-to-wear-overshoes-cycling'],
  },
  {
    slug: 'winter-cycling-clothing',
    label: 'Winter',
    icon: 'snow',
    teaser: 'Layering, gloves and overshoes from 8°C (46°F) down to freezing.',
    facts: [
      { value: '3 layers', text: 'below freezing: base layer, winter jersey and an insulated jacket' },
      { value: '8°C', text: '46°F: below this, bib tights at a moderate pace' },
      { value: '1 pair', text: 'gloves and overshoes for the whole ride: start with the warmer pair' },
    ],
    title: 'Winter cycling clothing: what to wear in the cold',
    metaTitle: 'Winter Cycling Clothing: What to Wear | kitcheck.cc',
    description: 'What to wear for road cycling in winter, from 8°C (46°F) down to freezing and below: layers, gloves, overshoes and what changes with effort.',
    intro: 'Winter riding is all about layers and extremities. Your body stays warm if you dress it right and keep moving; your hands, feet and ears are what decide how long you can stay out. Here is what to wear from the cool end of winter down to freezing.',
    sections: [
      {
        heading: 'Layering your upper body',
        body: [
          'Below freezing, three layers is the classic setup: a thermal base layer that moves sweat away from your skin, a winter jersey for insulation, and an insulated jacket on top. When it is a bit milder, two layers do it: a thermal base layer under a winter jersey or a softshell.',
          'Do not overdress. If you are warm when you walk out of the door, you will be sweating ten minutes into the ride, and wet layers get cold on the first descent.',
        ],
      },
      {
        heading: 'Hands, feet and head',
        body: [
          'Effort warms your body, but your hands and feet barely benefit from it. That is why, when you ride hard or run warm, kitcheck.cc lightens your body layers but keeps the gloves and overshoes warm.',
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
      { q: 'What should I wear cycling below freezing?', a: 'Below 0°C (32°F) at a moderate pace: a thermal skull cap, a thermal long-sleeve base layer, a winter jersey and an insulated jacket, thermal winter gloves, thermal bib tights, and thermal overshoes over thermal socks (waterproof gloves and overshoes if rain is likely). At around 0°C a cycling cap, a thermal base layer under a winter jersey or softshell and thermal gloves and overshoes are enough. The table on this page shows the full kit per temperature.' },
      { q: 'How do I keep my hands and feet warm cycling in winter?', a: 'Choose gloves and overshoes for the coldest part of the ride and put them on before you leave. Thin liner gloves and thermal socks add warmth without making things tight; tight shoes and gloves cut off circulation and make it worse.' },
      { q: 'How many layers should I wear cycling in winter?', a: 'Below freezing, three on your upper body: a thermal base layer, a winter jersey and an insulated jacket. In milder winter weather, two layers (a thermal base layer under a winter jersey or softshell) are enough.' },
    ],
    related: ['bib-tights-or-bib-shorts', 'when-to-wear-winter-cycling-gloves', 'when-to-wear-overshoes-cycling', 'when-to-wear-a-base-layer-cycling'],
  },
  {
    slug: 'summer-cycling-clothing',
    label: 'Summer',
    icon: 'sun',
    teaser: 'From fresh summer mornings to real heat: when the warmers stay home, plus drinking, sun and timing.',
    facts: [
      { value: '18°C', text: '64°F: summer jersey and bib shorts, the arm and knee warmers can stay home' },
      { value: '27°C', text: '81°F feels-like: extra bottle and sunscreen' },
      { value: 'Early', text: 'or late: ride outside the hottest hours' },
    ],
    title: 'Summer cycling clothing: what to wear in the heat',
    metaTitle: 'Summer Cycling Clothing: What to Wear | kitcheck.cc',
    description: 'What to wear for road cycling in summer, from fresh mornings to 30°C (86°F) heat: jerseys, warmers, sun protection, drinking and timing.',
    intro: 'Summer kit is simple; the choices are at the edges. On a fresh morning, arm and knee warmers are still worth taking. Once it is properly warm, it is the lightest jersey you own and bib shorts, and what makes or breaks the ride is everything around the kit: when you ride, what you drink and how you deal with the sun.',
    sections: [
      {
        heading: 'Fresh mornings and long descents',
        body: [
          'At the cool end of summer, a normal jersey with arm and knee warmers is the most flexible setup: they come off once you are warm and fit in a back pocket. On an Alpine descent or an early start, a gilet or packable jacket does the same job for your chest.',
        ],
      },
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
        heading: 'Sun and summer rain',
        body: [
          'Sunscreen on your arms, legs, neck and the backs of your knees, and reapply it on long rides. Sunglasses help against glare and keep insects out of your eyes.',
          'A summer shower needs no more than a packable rain jacket, and once it is properly warm kitcheck.cc lists even that as optional: you warm up quickly and a wet summer jersey dries fast.',
        ],
      },
    ],
    table: {
      heading: 'Summer kit by temperature',
      caption: 'Moderate pace, light wind, no rain.',
      temps: [15, 18, 20, 22, 25, 30],
      overrides: {},
    },
    faq: [
      { q: 'Do I need arm warmers in summer?', a: 'On fresh mornings and long descents, yes. At a moderate pace kitcheck.cc lists arm and knee warmers as optional up to about 18°C (64°F); above that, a summer jersey and bib shorts are enough.' },
      { q: 'What is too hot for cycling?', a: 'There is no single limit, and it depends on humidity, how used you are to the heat and how hard you ride. Above about 30°C (86°F), ride early, shorten the route, plan water stops and stop if you feel dizzy or stop sweating.' },
      { q: 'Should I wear a base layer in hot weather?', a: 'Some riders like a thin mesh base layer in the heat because it moves sweat away from the skin. It is a personal choice; kitcheck.cc does not list one when it is warm.' },
    ],
    related: ['when-to-wear-arm-and-knee-warmers'],
  },
  {
    slug: 'best-time-to-start-a-bike-ride',
    label: 'Timing',
    icon: 'clock',
    teaser: 'When to set off: how wind, temperature and rain change over the day, and what that does to your kit.',
    facts: [
      { value: 'Hourly', text: 'forecast for every hour you ride: notes when warmers can come off or rain arrives' },
      { value: '1 pair', text: 'gloves and overshoes chosen for the coldest or wettest hour of the ride' },
      { value: '12 km/h', text: '7 mph: with a GPX route, from here a stretch shows up as headwind' },
    ],
    title: 'Best time to start a bike ride: wind, temperature and rain',
    metaTitle: 'Best Time to Start a Bike Ride: Wind and Weather | kitcheck.cc',
    description: 'How to pick your departure time on a road bike: how wind, temperature and rain change over the day, which way to ride into the wind, and how the start time changes your kit.',
    intro: "The best time to start a ride is when the hours you are actually on the bike line up with the weather: lighter wind, no rain front, and a temperature you can dress for. On most days the wind is lightest early and late, it is coldest around sunrise and warmest in the afternoon, and summer showers build later in the day. Moving your start by an hour or two can mean a dry ride instead of a wet one, or one layer less to carry.",
    sections: [
      {
        heading: 'Temperature over the day',
        body: [
          'It is coldest around sunrise and warmest in the middle of the afternoon. On a clear spring or autumn day the difference can easily be ten degrees, which is the gap between winter gloves and none.',
          'An early start means dressing for the cold start and carrying warmers once it warms up. kitcheck.cc sets your body kit for the start hour and tells you when arm or leg warmers can come off. Gloves and overshoes are chosen for the coldest hour, because you keep one pair for the whole ride.',
        ],
      },
      {
        heading: 'Wind over the day',
        body: [
          'On fair-weather days over land, wind is usually lightest around dawn and in the evening and strongest in the afternoon, when the sun heats the ground and mixes faster air down to road level. Near the coast, a sea breeze often picks up in the afternoon in summer.',
          'A passing front or storm ignores that pattern, so check the hourly wind in the forecast, not just the daily figure. If the wind is forecast to drop later, a later start can be the easier ride.',
        ],
      },
      {
        heading: 'Into the wind first',
        body: [
          'The classic rule: ride out into the wind and home with it behind you. You do the hard part while you are fresh, and you do not get cold on the way back when you are tired and slower.',
          'The exception is a wind that is forecast to drop or turn. Then starting with a tailwind and coming home once it has eased can work, but you are relying on the forecast being right.',
        ],
      },
      {
        heading: 'Rain over the day',
        body: [
          'Rain from a weather front arrives at a fairly predictable time: look at the hourly rain chance and ride before it, or after it has passed. Summer showers and thunderstorms work differently: they build in the warm afternoon, so a morning ride is the safer bet.',
          'kitcheck.cc checks every hour of your ride and tells you when rain is expected or when it turns dry, so you can see whether an earlier or later start avoids it.',
        ],
      },
      {
        heading: 'Temperature during the ride',
        body: [
          'On a longer ride the temperature changes for three reasons: the time of day, the altitude and where you are. It gets colder as you climb, roughly 0.6°C (1°F) per 100 m on average, and a long descent adds a lot of wind chill on top.',
          "With a GPX route, kitcheck.cc doesn't guess: it takes the forecast for points along the route, at the time you are expected to pass each one, for that point's own height. It then dresses you for the coldest, windiest and wettest moment of each ride hour, and notes the coldest point and the biggest descent.",
        ],
      },
      {
        heading: 'Compare start times in the calculator',
        body: [
          'kitcheck.cc does not pick a departure time for you, but comparing a few takes seconds: move the start time and watch the kit card and the forecast for your ride window change.',
          'With a GPX route, each start time also shows the longest headwind stretch, judged against your riding direction, and where along the route rain becomes likely. If the headwind stretch sits at the end of the ride, try the loop the other way round or a different start time.',
        ],
      },
      {
        heading: 'Winter: start later',
        body: [
          'In winter, the early morning is the worst time to ride: the coldest air, frost and black ice on shaded corners and bridges, which can last until late morning. A late-morning start gives you the warmest, safest part of the day.',
          'Days are short, so plan to be home before dark, and use lights front and rear anyway.',
        ],
      },
      {
        heading: 'Summer: start early',
        body: [
          'In summer, the heat and the afternoon showers both argue for an early start. You get the coolest hours, often the lightest wind, and you are home before the hottest part of the day. A late-evening ride works too, once the heat has eased.',
        ],
      },
    ],
    table: {
      heading: 'How kit changes as the day warms up',
      caption: 'An example spring day, from about 2°C (36°F) at dawn to 18°C (64°F) in the afternoon. Moderate pace, light wind, no rain.',
      temps: [2, 6, 10, 14, 18],
      overrides: {},
    },
    faq: [
      { q: 'What is the best time of day to ride a bike?', a: 'It depends on the season and the forecast. In summer, early morning: cooler, often less wind, and before afternoon showers. In winter, late morning to early afternoon: the warmest part of the day, after frost and ice have gone. In between, look at the hourly wind and rain and pick the window with the least of both.' },
      { q: 'Is the wind lighter in the morning?', a: 'Often, yes. On fair-weather days over land, wind is usually lightest around dawn and in the evening and picks up in the afternoon. A weather front or storm overrides this, so check the hourly forecast for your ride.' },
      { q: 'Should I ride into the wind first or last?', a: 'First, if you can: ride out into the wind and come home with it behind you, when you are tired. Only start with a tailwind when the wind is forecast to drop or turn before you head home.' },
      { q: 'How much colder is it at the top of a climb?', a: 'On average about 0.6°C (1°F) per 100 m of climbing, so a 1,000 m climb can be 6°C (11°F) colder at the top, before the wind chill of the descent. With a GPX route, kitcheck.cc uses the forecast for each point at its own height.' },
      { q: 'How does kitcheck.cc work out the temperature during my ride?', a: 'Without a route, it uses the hourly forecast at your start location for every hour you ride. With a GPX route, it takes the forecast for points along the route at the time you are expected to pass each one, works out the headwind against your riding direction, and dresses you for the coldest, windiest and wettest moment of each hour.' },
      { q: 'Can kitcheck.cc find the best departure time for me?', a: 'Not automatically. Move the start time in the calculator and compare: the kit card, the rain and wind notes and, with a GPX route, the longest headwind stretch all update straight away.' },
    ],
    faqLead: 'What riders ask about timing a ride around the weather.',
    related: ['when-to-wear-arm-and-knee-warmers', 'when-to-wear-winter-cycling-gloves'],
  },
]
