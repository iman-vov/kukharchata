// Кухарчата — дані гри: інгредієнти, рецепти, кухні, карта світу, історія.
// Стани інгредієнта: r — сирий, c — нарізаний, b — варений, f — смажений, k — запечений, x — згорілий.

export const STATE_NAME = { r: 'сирий', c: 'нарізаний', b: 'варений', f: 'смажений', k: 'запечений', x: 'згорілий' };

// icon: емодзі або власний значок (рисуємо на canvas), col — колір 3D-моделі, shape — форма моделі.
// chop — чи ріжеться; pot/pan/oven — з якого стану його можна класти в каструлю / пательню / піч.
export const ING = {
  tomato:    { name: 'Помідор',   icon: '🍅', col: 0xe8412c, shape: 'ball',   chop: true, pot: 'c', oven: 'c' },
  lettuce:   { name: 'Салат',     icon: '🥬', col: 0x6cc24a, shape: 'leaf',   chop: true },
  cucumber:  { name: 'Огірок',    icon: '🥒', col: 0x3f9b3a, shape: 'stick',  chop: true },
  onion:     { name: 'Цибуля',    icon: '🧅', col: 0xe9c79a, shape: 'ball',   chop: true, pot: 'c' },
  beet:      { name: 'Буряк',     icon: '@beet', col: 0x8e1b4f, shape: 'ball', chop: true, pot: 'c' },
  cabbage:   { name: 'Капуста',   icon: '@cabbage', col: 0xc4e3a0, shape: 'ball', chop: true, pot: 'c' },
  potato:    { name: 'Картопля',  icon: '🥔', col: 0xc79a5b, shape: 'egg',    chop: true, pot: 'c', pan: 'c' },
  meat:      { name: 'Мʼясо',     icon: '🥩', col: 0xd65a5a, shape: 'slab',   chop: true, pan: 'c' },
  fish:      { name: 'Рибка',     icon: '🐟', col: 0x7fb4d9, shape: 'fish',   chop: true },
  sausage:   { name: 'Сосиска',   icon: '@sausage', col: 0xc8553d, shape: 'stick', pan: 'r' },
  bun:       { name: 'Булочка',   icon: '🍞', col: 0xe0a85a, shape: 'bun' },
  cheese:    { name: 'Сир',       icon: '🧀', col: 0xf5c84a, shape: 'wedge',  chop: true, oven: 'c' },
  mushroom:  { name: 'Гриби',     icon: '🍄', col: 0xc9a27e, shape: 'mush',   chop: true, pot: 'c', oven: 'c' },
  dough:     { name: 'Тісто',     icon: '@dough', col: 0xf3e6c8, shape: 'disc', pot: 'r', oven: 'r' },
  rice:      { name: 'Рис',       icon: '🍚', col: 0xf7f7f2, shape: 'sack',   pot: 'r' },
  pasta:     { name: 'Макарони',  icon: '@pasta', col: 0xf2cf63, shape: 'sack', pot: 'r' },
  noodles:   { name: 'Локшина',   icon: '@noodles', col: 0xf0d58a, shape: 'sack', pot: 'r' },
  nori:      { name: 'Норі',      icon: '@nori', col: 0x1f3d2b, shape: 'sheet' },
  tortilla:  { name: 'Тортилья',  icon: '🫓', col: 0xe8c98b, shape: 'disc' },
  sourcream: { name: 'Сметана',   icon: '@cream', col: 0xfbfbf5, shape: 'jar' },
};

export const COOKER = {
  pot:  { name: 'Каструля', cap: 3, per: 4.0, burn: 13, out: 'b' },
  pan:  { name: 'Пательня', cap: 1, per: 5.0, burn: 11, out: 'f' },
  oven: { name: 'Піч',      cap: 4, per: 3.2, burn: 12, out: 'k' },
};
export const COOK_OF_STATE = { b: 'pot', f: 'pan', k: 'oven' };

// Рецепти: components — 'інгредієнт:стан'
export const RECIPES = {
  salad:     { name: 'Салат',             icon: '🥗', c: ['lettuce:c', 'tomato:c'] },
  salad3:    { name: 'Овочевий салат',    icon: '🥗', c: ['lettuce:c', 'tomato:c', 'cucumber:c'] },
  deruny:    { name: 'Деруни зі сметаною', icon: '🥞', c: ['potato:f', 'sourcream:r'] },
  tsoup:     { name: 'Томатний суп',      icon: '🍲', c: ['tomato:b', 'tomato:b', 'tomato:b'] },
  borshch:   { name: 'Борщ',              icon: '🍲', c: ['beet:b', 'cabbage:b', 'potato:b'] },
  varenyky:  { name: 'Вареники',          icon: '🥟', c: ['dough:b', 'potato:b'] },
  pizza:     { name: 'Піца Маргарита',    icon: '🍕', c: ['dough:k', 'tomato:k', 'cheese:k'] },
  pizzam:    { name: 'Піца з грибами',    icon: '🍕', c: ['dough:k', 'tomato:k', 'cheese:k', 'mushroom:k'] },
  pasta:     { name: 'Паста з томатами',  icon: '🍝', c: ['pasta:b', 'tomato:b'] },
  pastam:    { name: 'Паста з грибами',   icon: '🍝', c: ['pasta:b', 'mushroom:b'] },
  sushi:     { name: 'Рол з рибкою',      icon: '🍣', c: ['rice:b', 'fish:c', 'nori:r'] },
  sushic:    { name: 'Рол з огірком',     icon: '🍙', c: ['rice:b', 'cucumber:c', 'nori:r'] },
  ramen:     { name: 'Рамен',             icon: '🍜', c: ['noodles:b', 'meat:f', 'onion:c'] },
  taco:      { name: 'Тако',              icon: '🌮', c: ['tortilla:r', 'meat:f', 'tomato:c'] },
  burrito:   { name: 'Буріто',            icon: '🌯', c: ['tortilla:r', 'rice:b', 'meat:f', 'lettuce:c'] },
  burger:    { name: 'Бургер',            icon: '🍔', c: ['bun:r', 'meat:f', 'lettuce:c'] },
  cheeseb:   { name: 'Чизбургер',         icon: '🍔', c: ['bun:r', 'meat:f', 'cheese:c', 'tomato:c'] },
  hotdog:    { name: 'Хот-дог',           icon: '🌭', c: ['bun:r', 'sausage:f'] },
};

/* Кухні. Позначки:
   ' ' порожнеча   . підлога   @ старт кухаря   # стійка
   C дошка   S плита з каструлею   F плита з пательнею   O піч
   W мийка   P тарілки   D видача   T смітник   E вогнегасник на стійці
   1–9 ящики з продуктами (див. crates)   > < ^ v стрічка-конвеєр               */
export const COUNTRIES = {
  ua: { name: 'Україна',  flag: ['#2f6fd6', '#ffd23f'], theme: 'ua' },
  it: { name: 'Італія',   flag: ['#2f9e44', '#ffffff', '#d63a3a'], theme: 'it' },
  jp: { name: 'Японія',   flag: ['#ffffff', '#d63a3a'], theme: 'jp' },
  mx: { name: 'Мексика',  flag: ['#1f8a4c', '#ffffff', '#c8343a'], theme: 'mx' },
  us: { name: 'США',      flag: ['#3355aa', '#ffffff', '#cc3344'], theme: 'us' },
};

const B = 'baba', R = 'racc', K = 'kids';

export const LEVELS = [
  { id: 'kyiv', country: 'ua', city: 'Київ', title: 'Перша зміна',
    recipes: ['salad'], crates: { 1: 'lettuce', 2: 'tomato' },
    dur: 150, ordT: 75, iv: 20, maxO: 2, fire: false, wash: false, plates: 4,
    grid: [
      '#####DD#P####',
      '#...........#',
      '1..@.....@..C',
      '#....###....#',
      '2..@.###.@..C',
      '#...........#',
      '###T##C######',
    ],
    intro: [[B, 'Ой лишенько! Хтось поцупив сторінки з моєї Книги рецептів!'],
            [R, 'Хі-хі! Це я, Єнот Шкодько! Я стану найкращим кухарем світу, а сторінки тепер мої!'],
            [B, 'Кухарчата, рятуйте! Почнімо з простого: салатик для киян. Ріжте на дошці, кладіть на тарілку й несіть до віконця.']],
    outro: [[B, 'Молодці! Шкодько впустив першу сторінку. Слід веде до Львова!']] },

  { id: 'lviv', country: 'ua', city: 'Львів', title: 'Кавʼярня з деруном',
    recipes: ['deruny', 'salad3'], crates: { 1: 'potato', 2: 'sourcream', 3: 'lettuce', 4: 'tomato', 5: 'cucumber' },
    dur: 180, ordT: 80, iv: 22, maxO: 2, fire: false, wash: false, plates: 4,
    grid: [
      '###F#F##DD#P###',
      '#.............#',
      '1.@....#....@.C',
      '#......#......#',
      '2..@...C...@..3',
      '#.............#',
      '4.@....#....@.5',
      '#.............#',
      '####T###C######',
    ],
    intro: [[R, 'Тут пахне кавою, а деруни шкварчать! Спробуйте мене наздогнати!'],
            [B, 'Картоплю наріжте й підсмажте на пательні, а тоді на тарілку зі сметанкою. І не забудьте про салат!']],
    outro: [[B, 'Ще одна сторінка наша! А Шкодько вже мчить потягом до Одеси.']] },

  { id: 'odesa', country: 'ua', city: 'Одеса', title: 'Борщ біля моря',
    recipes: ['borshch', 'varenyky'], crates: { 1: 'beet', 2: 'cabbage', 3: 'potato', 4: 'dough' },
    dur: 200, ordT: 95, iv: 26, maxO: 2, fire: true, wash: false, plates: 4,
    grid: [
      '##S#S#S##DD#P##',
      '#.............#',
      '1.@...........C',
      '#....#####....#',
      '2..@.#####.@..C',
      '#....#####....#',
      '3.@...........C',
      '#.............#',
      '##4##T##E######',
    ],
    intro: [[R, 'Біля моря борщ смачніший! Але плити тут гарячі, стережіться пожежі!'],
            [B, 'Якщо каструля перегріється і спалахне, хапайте вогнегасник 🧯 і гасіть. Згорілу страву викидайте в смітник.']],
    outro: [[B, 'Сторінка з борщем повернулась! А Шкодько сів на повітряну кулю й полетів до Італії. Заводьте фургончик!']] },

  { id: 'napoli', country: 'it', city: 'Неаполь', title: 'Справжня піца',
    recipes: ['pizza'], crates: { 1: 'dough', 2: 'tomato', 3: 'cheese' },
    dur: 180, ordT: 90, iv: 24, maxO: 2, fire: true, wash: false, plates: 4,
    grid: [
      '###O#O#O##DD#P#',
      '#.............#',
      '1.@....#....@.C',
      '#......#......#',
      '2..@...#...@..C',
      '#......#......#',
      '3.@.........@.C',
      '#.............#',
      '####T####E#####',
    ],
    intro: [[R, 'Mamma mia! Піца — це мистецтво, а я в нього митець!'],
            [B, 'Тісто, нарізані томати й сир — усе в піч. Коли спечеться, перекладайте на тарілку.']],
    outro: [[B, 'Ось і сторінка про піцу! Шкодько побіг до Рима.']] },

  { id: 'roma', country: 'it', city: 'Рим', title: 'Гора посуду',
    recipes: ['pasta', 'pizza'], crates: { 1: 'pasta', 2: 'tomato', 3: 'dough', 4: 'cheese' },
    dur: 210, ordT: 95, iv: 24, maxO: 3, fire: true, wash: true, plates: 3,
    grid: [
      '##S#S##O#O#DD##',
      '#.............#',
      '1.@.....#...@.C',
      '#.......#.....#',
      '2..@....#..@..C',
      '#.............#',
      '3.@.....#...@.P',
      '#.......#.....#',
      '#4##T####WE####',
    ],
    intro: [[R, 'Усі дороги ведуть до Рима… і до мийки! Ха-ха!'],
            [B, 'Тарілки тепер повертаються брудні. Несіть їх до мийки й помийте, бо не буде в що накладати.']],
    outro: [[B, 'Ще сторінка! А Шкодько поплив гондолою до Венеції.']] },

  { id: 'venezia', country: 'it', city: 'Венеція', title: 'Кухня над каналом',
    recipes: ['pasta', 'pastam', 'pizzam'], crates: { 1: 'pasta', 2: 'tomato', 3: 'mushroom', 4: 'dough', 5: 'cheese' },
    dur: 220, ordT: 100, iv: 26, maxO: 3, fire: true, wash: true, plates: 3,
    gates: [{ at: [[5, 4]], period: 20, closed: 6 }], // розвідний місток
    grid: [
      '############DD#',
      '1....#S#S#O#..P',
      '#.@..#........#',
      '2....#..@.....#',
      'C.............W',
      '3.@..#..@.....#',
      'C....#........#',
      '4....#O#S###..#',
      '#5#T########TE#',
    ],
    intro: [[R, 'Тут канали! Передавайте продукти через стійку, якщо встигнете!'],
            [B, 'Кухню розділяє вода і лише вузенький місток. Одні ріжуть, інші варять: передавайте одне одному через стійку.']],
    outro: [[B, 'Італію пройдено! Шкодько полетів літаком аж до Японії.']] },

  { id: 'tokyo', country: 'jp', city: 'Токіо', title: 'Суші на стрічці',
    recipes: ['sushi', 'sushic'], crates: { 1: 'rice', 2: 'fish', 3: 'nori', 4: 'cucumber' },
    dur: 200, ordT: 95, iv: 24, maxO: 3, fire: true, wash: false, plates: 4,
    grid: [
      '###S#S###DD#P##',
      '#.............#',
      '1.@.....@.....C',
      '#..>>>>>>>v...#',
      '2..^<<<<<<<...C',
      '#.@.....@.....#',
      '3.............C',
      '#4##T####E#####',
    ],
    intro: [[R, 'Коннічіва! Тут продукти катаються по стрічці!'],
            [B, 'Рис зваріть, рибку чи огірок наріжте, візьміть лист норі — і рол готовий. Стрічка допоможе передавати.']],
    outro: [[B, 'Сторінка з ролами наша! Шкодько втік швидкісним потягом до Осаки.']] },

  { id: 'osaka', country: 'jp', city: 'Осака', title: 'Гарячий рамен',
    recipes: ['ramen', 'sushi'], crates: { 1: 'noodles', 2: 'meat', 3: 'onion', 4: 'rice', 5: 'fish', 6: 'nori' },
    dur: 220, ordT: 100, iv: 25, maxO: 3, fire: true, wash: true, plates: 3,
    grid: [
      '##S#S#F#F##DD##',
      '#.............P',
      '1.@...........#',
      '#....##.##....C',
      '2..@.##.##.@..C',
      '#.............#',
      '3.@...........W',
      '#....##.##....#',
      '4..@.##.##.@..#',
      '#.............#',
      '#5##T##6##E####',
    ],
    intro: [[R, 'Рамен — моя улюблена страва! Але сторінку я не віддам!'],
            [B, 'Локшину варимо, мʼясо ріжемо й смажимо, цибульку ріжемо. Усе в одну миску!']],
    outro: [[B, 'Ще одна сторінка! Шкодько сховався в саду Кіото.']] },

  { id: 'kyoto', country: 'jp', city: 'Кіото', title: 'Сад і хаос',
    recipes: ['ramen', 'sushi', 'sushic'], crates: { 1: 'fish', 2: 'cucumber', 3: 'nori', 4: 'rice', 5: 'onion', 6: 'noodles', 7: 'meat' },
    dur: 230, ordT: 105, iv: 26, maxO: 3, fire: true, wash: true, plates: 3,
    gates: [{ at: [[4, 7]], period: 18, closed: 5 }, { at: [[9, 2], [9, 4]], period: 14, closed: 5, offset: 7 }], // розсувні двері
    grid: [
      '#####S#S#F#DD##',
      '1...#.........P',
      '#.@.#...@.....7',
      '2...>>>>>.....C',
      '#.@.#.........W',
      '3...<<<<<.@...C',
      'C...#.........6',
      '4.......F#S...#',
      '#5#C#T######E##',
    ],
    intro: [[R, 'Тихий сад, а на кухні справжній хаос! Хі-хі!'],
            [B, 'Дві половини кухні зʼєднують стрічки й місток унизу. Ліві ріжуть рибку, праві варять і смажать.']],
    outro: [[B, 'Японію пройдено! Шкодько сів на корабель до Мексики.']] },

  { id: 'mexico', country: 'mx', city: 'Мехіко', title: 'Фієста тако',
    recipes: ['taco', 'burrito'], crates: { 1: 'tortilla', 2: 'meat', 3: 'tomato', 4: 'rice', 5: 'lettuce' },
    dur: 220, ordT: 100, iv: 24, maxO: 3, fire: true, wash: false, plates: 4,
    grid: [
      '###F#F#S#S##DD#',
      '#.............#',
      '1.@....#....@.P',
      '#......#......#',
      '2..@...C...@..C',
      '#......#......#',
      '3.@....#....@.C',
      '#.............#',
      '#4##T##5###E###',
    ],
    intro: [[R, '¡Hola! Тако — це просто, а буріто — справжній виклик!'],
            [B, 'Тортилья, смажене мʼясо і свіжі овочі. Для буріто ще й рис зваріть.']],
    outro: [[B, 'Сторінка наша! Шкодько втік на пляжі Канкуна.']] },

  { id: 'cancun', country: 'mx', city: 'Канкун', title: 'Пляжна кухня',
    recipes: ['taco', 'burrito'], crates: { 1: 'tortilla', 2: 'meat', 3: 'tomato', 4: 'rice', 5: 'lettuce' },
    dur: 230, ordT: 100, iv: 22, maxO: 3, fire: true, wash: true, plates: 3,
    grid: [
      '#1#2#3#F#F#S#S#',
      '#.............#',
      '#.@..#####..@.#',
      'T....#####....D',
      '#.@..#####..@.D',
      '#.............#',
      '4.............P',
      '#..>>>>>>>v...W',
      '5..^<<<<<<<...C',
      '#.............C',
      '#######E#######',
    ],
    intro: [[R, 'Пляж, сонце і… гора брудного посуду!'],
            [B, 'Тут і пожежі, і миття, і стрічка. Діліть роботу: хтось ріже, хтось смажить, а хтось миє.']],
    outro: [[B, 'Мексику пройдено! Шкодько полетів до Нью-Йорка.']] },

  { id: 'newyork', country: 'us', city: 'Нью-Йорк', title: 'Місто бургерів',
    recipes: ['burger', 'cheeseb'], crates: { 1: 'bun', 2: 'meat', 3: 'lettuce', 4: 'cheese', 5: 'tomato' },
    dur: 220, ordT: 95, iv: 22, maxO: 3, fire: true, wash: true, plates: 3,
    gates: [{ at: [[7, 3], [7, 5]], period: 16, closed: 6 }], // двері метро
    grid: [
      '##F#F#F###DD###',
      '#.............#',
      '1.@...#.#...@.P',
      '#.....#.#.....#',
      '2..@..C.C..@..W',
      '#.....#.#.....#',
      '3.@...#.#...@.C',
      '#.............#',
      '#4#5#T###E#####',
    ],
    intro: [[R, 'Місто, яке ніколи не спить і не перестає їсти бургери!'],
            [B, 'Булочка, смажена котлета й зелень. А для чизбургера ще сир і томат.']],
    outro: [[B, 'Сторінка з бургерами наша! Шкодько чкурнув до вітряного Чикаго.']] },

  { id: 'chicago', country: 'us', city: 'Чикаго', title: 'Вітряне місто',
    recipes: ['hotdog', 'burger'], crates: { 1: 'bun', 2: 'sausage', 3: 'meat', 4: 'lettuce', 5: 'bun' },
    dur: 220, ordT: 90, iv: 21, maxO: 3, fire: true, wash: true, plates: 3,
    wind: { period: 16, dur: 5, force: 2.6 }, // пориви вітру
    grid: [
      '###F#F#F##DD###',
      '#.............#',
      '1.@....>>>>v..P',
      '#......^###v..C',
      '2..@...^###v..W',
      '#......^###v..#',
      '3.@....^<<<<..C',
      '#.............#',
      '#4##T###5##E###',
    ],
    intro: [[R, 'Тут вітряно, тримайте свої хот-доги!'],
            [B, 'Сосиски смажте на пательні й кладіть у булочку. Стрічка везе продукти довкола.']],
    outro: [[B, 'Залишилась остання сторінка! Шкодько в Сан-Франциско.']] },

  { id: 'sanfran', country: 'us', city: 'Сан-Франциско', title: 'Остання сторінка',
    recipes: ['burger', 'cheeseb', 'hotdog'], crates: { 1: 'bun', 2: 'meat', 3: 'lettuce', 4: 'cheese', 5: 'tomato', 6: 'sausage' },
    dur: 240, ordT: 100, iv: 22, maxO: 3, fire: true, wash: true, plates: 3,
    gates: [{ at: [[7, 7]], period: 22, closed: 7 }, { at: [[3, 3], [3, 5], [11, 2], [11, 6]], period: 15, closed: 5, offset: 5 }], // землетрус
    grid: [
      '########F#F#FDD',
      '1......#.......',
      '#.@....#....@.P',
      '2......>>>>>>.#',
      'C......#......W',
      '3..@...<<<<<<.C',
      '#......#......C',
      '4.@...........#',
      '#5##T###6####E#',
    ],
    intro: [[R, 'Остання сторінка! Спіймайте мене, якщо зможете!'],
            [B, 'Ліворуч продукти, праворуч плити. Стрічки возять туди й назад, а внизу є прохід.']],
    outro: [[R, 'Ой… ви мене спіймали. Я просто дуже хотів навчитися готувати…'],
            [B, 'То поїхали з нами до Києва! Разом приготуємо великий бенкет.']] },

  { id: 'feast', country: 'ua', city: 'Київ', title: 'Бабусин бенкет', finale: true,
    recipes: ['borshch', 'varenyky', 'pizza', 'burger'],
    crates: { 1: 'beet', 2: 'cabbage', 3: 'potato', 4: 'dough', 5: 'tomato', 6: 'cheese', 7: 'bun', 8: 'meat', 9: 'lettuce' },
    dur: 260, ordT: 110, iv: 22, maxO: 4, fire: true, wash: true, plates: 4,
    gates: [{ at: [[8, 6], [8, 7]], period: 20, closed: 6, offset: 10 }],
    grid: [
      '###S#S#S#O#O#F#F#',
      '1...............#',
      '#.@....###....@.D',
      '2......###......D',
      '#...@..###..@...#',
      '3...............P',
      '#.@..##...##..@.W',
      '4....##...##....C',
      '#...............C',
      '5...............C',
      '##6#7#8#9###T#E##',
    ],
    intro: [[B, 'Усі сторінки повернулися додому! Готуймо великий сімейний бенкет!'],
            [R, 'А я допомагатиму! Чесно-чесно, нічого не поцуплю!']],
    outro: [[B, 'Найсмачніше, коли готуємо разом. Дякую вам, мої Кухарчата! ❤️']] },
];

// Розташування на карті світу: острови країн і міста (x, z на мапі)
export const MAP = {
  islands: {
    us: { x: -15, z: -2, r: 6.2 },
    mx: { x: -11, z: 8.5, r: 4.6 },
    it: { x: 2, z: 3, r: 5.0 },
    ua: { x: 9, z: -6, r: 5.6 },
    jp: { x: 18, z: 4, r: 4.8 },
  },
  // порядок рівнів: позиції міст
  cities: {
    kyiv: [9.5, -7.5], lviv: [6.4, -6.0], odesa: [10.6, -3.6],
    napoli: [3.4, 4.6], roma: [1.6, 2.2], venezia: [0.8, -0.2],
    tokyo: [19.2, 2.0], osaka: [17.6, 4.6], kyoto: [16.6, 6.6],
    mexico: [-11.2, 8.0], cancun: [-8.6, 9.6],
    newyork: [-11.6, -3.6], chicago: [-15.4, -4.6], sanfran: [-19.4, -1.0],
    feast: [8.4, -8.8],
  },
};

export const SPEAKERS = {
  baba: { name: 'Бабуся Ганна', face: '👵' },
  racc: { name: 'Єнот Шкодько', face: '🦝' },
  kids: { name: 'Кухарчата', face: '🧑‍🍳' },
};

// Кольори кухарів (до 6) і бота
export const COOK_COLORS = [
  { name: 'Червоний', c: 0xe5484d }, { name: 'Синій', c: 0x3d7be0 }, { name: 'Зелений', c: 0x3cb371 },
  { name: 'Жовтий', c: 0xf2b829 }, { name: 'Фіолетовий', c: 0x9b59d0 }, { name: 'Помаранчевий', c: 0xf07c2a },
];
export const HATS = ['ковпак', 'бандана', 'кепка', 'корона', 'вушка', 'квітка'];
