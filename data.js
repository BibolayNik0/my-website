// Static game data: species, evolutions, types, moves, items.
const SPECIES = [
  { id: 1, name: 'Бульбазавр', type: 'Трава', rarity: 2 },
  { id: 2, name: 'Ивизавр', type: 'Трава', rarity: 3 },
  { id: 3, name: 'Венузавр', type: 'Трава', rarity: 4 },
  { id: 4, name: 'Чармандер', type: 'Огонь', rarity: 2 },
  { id: 5, name: 'Чармелеон', type: 'Огонь', rarity: 3 },
  { id: 6, name: 'Чаризард', type: 'Огонь', rarity: 4 },
  { id: 7, name: 'Сквиртл', type: 'Вода', rarity: 2 },
  { id: 8, name: 'Вартортл', type: 'Вода', rarity: 3 },
  { id: 9, name: 'Бластойз', type: 'Вода', rarity: 4 },
  { id: 10, name: 'Катерпи', type: 'Жук', rarity: 1 },
  { id: 11, name: 'Метапод', type: 'Жук', rarity: 2 },
  { id: 12, name: 'Баттерфри', type: 'Жук', rarity: 3 },
  { id: 13, name: 'Видл', type: 'Жук', rarity: 1 },
  { id: 14, name: 'Какуна', type: 'Жук', rarity: 2 },
  { id: 15, name: 'Бидрилл', type: 'Жук', rarity: 3 },
  { id: 16, name: 'Пиджи', type: 'Летающий', rarity: 1 },
  { id: 17, name: 'Пиджеотто', type: 'Летающий', rarity: 2 },
  { id: 18, name: 'Пиджеот', type: 'Летающий', rarity: 3 },
  { id: 19, name: 'Раттата', type: 'Нормальный', rarity: 1 },
  { id: 20, name: 'Рэтикейт', type: 'Нормальный', rarity: 2 },
  { id: 21, name: 'Спироу', type: 'Летающий', rarity: 1 },
  { id: 22, name: 'Фироу', type: 'Летающий', rarity: 2 },
  { id: 23, name: 'Эканс', type: 'Яд', rarity: 1 },
  { id: 24, name: 'Эрбок', type: 'Яд', rarity: 2 },
  { id: 25, name: 'Пикачу', type: 'Электро', rarity: 2 },
  { id: 26, name: 'Райчу', type: 'Электро', rarity: 3 },
  { id: 27, name: 'Сэндшру', type: 'Земля', rarity: 1 },
  { id: 28, name: 'Сэндслэш', type: 'Земля', rarity: 2 },
  { id: 29, name: 'Нидоран♀', type: 'Яд', rarity: 1 },
  { id: 30, name: 'Нидорина', type: 'Яд', rarity: 2 },
  { id: 31, name: 'Нидоквин', type: 'Яд', rarity: 3 },
  { id: 32, name: 'Нидоран♂', type: 'Яд', rarity: 1 },
  { id: 33, name: 'Нидорино', type: 'Яд', rarity: 2 },
  { id: 34, name: 'Нидокинг', type: 'Яд', rarity: 3 },
  { id: 35, name: 'Клефэйри', type: 'Фея', rarity: 2 },
  { id: 36, name: 'Клефэйбл', type: 'Фея', rarity: 3 },
  { id: 37, name: 'Вульпикс', type: 'Огонь', rarity: 2 },
  { id: 38, name: 'Найнтейлз', type: 'Огонь', rarity: 3 },
  { id: 39, name: 'Джигглипафф', type: 'Фея', rarity: 2 },
  { id: 40, name: 'Вигглитафф', type: 'Фея', rarity: 3 },
  { id: 41, name: 'Зубат', type: 'Яд', rarity: 1, night: true },
  { id: 42, name: 'Голбат', type: 'Яд', rarity: 2, night: true },
  { id: 43, name: 'Оддиш', type: 'Трава', rarity: 1 },
  { id: 44, name: 'Глум', type: 'Трава', rarity: 2 },
  { id: 45, name: 'Вайлплум', type: 'Трава', rarity: 3 },
  { id: 46, name: 'Парас', type: 'Жук', rarity: 1 },
  { id: 47, name: 'Парасект', type: 'Жук', rarity: 2 },
  { id: 48, name: 'Венонат', type: 'Жук', rarity: 1 },
  { id: 49, name: 'Веномот', type: 'Жук', rarity: 2 },
  { id: 50, name: 'Диглетт', type: 'Земля', rarity: 1 },
  { id: 51, name: 'Дагтрио', type: 'Земля', rarity: 2 },
  { id: 52, name: 'Мяут', type: 'Нормальный', rarity: 1 },
  { id: 53, name: 'Персиан', type: 'Нормальный', rarity: 2 },
  { id: 54, name: 'Псайдак', type: 'Вода', rarity: 1 },
  { id: 55, name: 'Голдак', type: 'Вода', rarity: 2 },
  { id: 56, name: 'Манки', type: 'Боевой', rarity: 1 },
  { id: 57, name: 'Праймейп', type: 'Боевой', rarity: 2 },
  { id: 58, name: 'Гроулит', type: 'Огонь', rarity: 2 },
  { id: 59, name: 'Арканайн', type: 'Огонь', rarity: 4 },
  { id: 60, name: 'Поливаг', type: 'Вода', rarity: 1 },
  { id: 61, name: 'Поливирл', type: 'Вода', rarity: 2 },
  { id: 62, name: 'Поливрат', type: 'Вода', rarity: 3 },
  { id: 63, name: 'Абра', type: 'Психический', rarity: 2 },
  { id: 64, name: 'Кадабра', type: 'Психический', rarity: 3 },
  { id: 65, name: 'Алаказам', type: 'Психический', rarity: 4 },
  { id: 66, name: 'Мачоп', type: 'Боевой', rarity: 1 },
  { id: 67, name: 'Мачок', type: 'Боевой', rarity: 2 },
  { id: 68, name: 'Мачамп', type: 'Боевой', rarity: 3 },
  { id: 69, name: 'Беллспраут', type: 'Трава', rarity: 1 },
  { id: 70, name: 'Випинбелл', type: 'Трава', rarity: 2 },
  { id: 71, name: 'Виктрибел', type: 'Трава', rarity: 3 },
  { id: 72, name: 'Тентакул', type: 'Вода', rarity: 1 },
  { id: 73, name: 'Тентакруэль', type: 'Вода', rarity: 2 },
  { id: 74, name: 'Джеодуд', type: 'Камень', rarity: 1 },
  { id: 75, name: 'Гравелер', type: 'Камень', rarity: 2 },
  { id: 76, name: 'Голем', type: 'Камень', rarity: 3 },
  { id: 77, name: 'Понита', type: 'Огонь', rarity: 2 },
  { id: 78, name: 'Рапидэш', type: 'Огонь', rarity: 3 },
  { id: 79, name: 'Слоупок', type: 'Вода', rarity: 1 },
  { id: 80, name: 'Слоубро', type: 'Вода', rarity: 2 },
  { id: 81, name: 'Магнемайт', type: 'Электро', rarity: 1 },
  { id: 82, name: 'Магнетон', type: 'Электро', rarity: 2 },
  { id: 83, name: 'Фарфетчд', type: 'Летающий', rarity: 2 },
  { id: 84, name: 'Додуо', type: 'Летающий', rarity: 1 },
  { id: 85, name: 'Додрио', type: 'Летающий', rarity: 2 },
  { id: 86, name: 'Сил', type: 'Вода', rarity: 1 },
  { id: 87, name: 'Дьюгонг', type: 'Лёд', rarity: 2 },
  { id: 88, name: 'Граймер', type: 'Яд', rarity: 1 },
  { id: 89, name: 'Мак', type: 'Яд', rarity: 2 },
  { id: 90, name: 'Шеллдер', type: 'Вода', rarity: 1 },
  { id: 91, name: 'Клойстер', type: 'Лёд', rarity: 2 },
  { id: 92, name: 'Гастли', type: 'Призрак', rarity: 1, night: true },
  { id: 93, name: 'Хонтер', type: 'Призрак', rarity: 2, night: true },
  { id: 94, name: 'Генгар', type: 'Призрак', rarity: 3, night: true },
  { id: 95, name: 'Оникс', type: 'Камень', rarity: 2 },
  { id: 96, name: 'Дроузи', type: 'Психический', rarity: 1 },
  { id: 97, name: 'Гипно', type: 'Психический', rarity: 2 },
  { id: 98, name: 'Крабби', type: 'Вода', rarity: 1 },
  { id: 99, name: 'Кинглер', type: 'Вода', rarity: 2 },
  { id: 100, name: 'Волторб', type: 'Электро', rarity: 1 },
  { id: 101, name: 'Электрод', type: 'Электро', rarity: 2 },
  { id: 102, name: 'Экзеггут', type: 'Трава', rarity: 2 },
  { id: 103, name: 'Экзеггутор', type: 'Трава', rarity: 3 },
  { id: 104, name: 'Кьюбон', type: 'Земля', rarity: 2 },
  { id: 105, name: 'Маровак', type: 'Земля', rarity: 2 },
  { id: 106, name: 'Хитмонли', type: 'Боевой', rarity: 2 },
  { id: 107, name: 'Хитмончан', type: 'Боевой', rarity: 2 },
  { id: 108, name: 'Ликитунг', type: 'Нормальный', rarity: 2 },
  { id: 109, name: 'Коффинг', type: 'Яд', rarity: 1 },
  { id: 110, name: 'Визинг', type: 'Яд', rarity: 2 },
  { id: 111, name: 'Райхорн', type: 'Земля', rarity: 2 },
  { id: 112, name: 'Райдон', type: 'Земля', rarity: 3 },
  { id: 113, name: 'Ченси', type: 'Нормальный', rarity: 2 },
  { id: 114, name: 'Танджела', type: 'Трава', rarity: 2 },
  { id: 115, name: 'Кангасхан', type: 'Нормальный', rarity: 2 },
  { id: 116, name: 'Хорси', type: 'Вода', rarity: 1 },
  { id: 117, name: 'Сидра', type: 'Вода', rarity: 2 },
  { id: 118, name: 'Голдин', type: 'Вода', rarity: 1 },
  { id: 119, name: 'Сикинг', type: 'Вода', rarity: 2 },
  { id: 120, name: 'Старью', type: 'Вода', rarity: 1 },
  { id: 121, name: 'Старми', type: 'Вода', rarity: 2 },
  { id: 122, name: 'Мистер Майм', type: 'Психический', rarity: 2 },
  { id: 123, name: 'Сайтер', type: 'Жук', rarity: 2 },
  { id: 124, name: 'Джинкс', type: 'Лёд', rarity: 2 },
  { id: 125, name: 'Электабазз', type: 'Электро', rarity: 2 },
  { id: 126, name: 'Магмар', type: 'Огонь', rarity: 2 },
  { id: 127, name: 'Пинсир', type: 'Жук', rarity: 2 },
  { id: 128, name: 'Таурос', type: 'Нормальный', rarity: 2 },
  { id: 129, name: 'Мэджикарп', type: 'Вода', rarity: 1 },
  { id: 130, name: 'Гаярдос', type: 'Вода', rarity: 3 },
  { id: 131, name: 'Лапрас', type: 'Лёд', rarity: 3 },
  { id: 132, name: 'Дитто', type: 'Нормальный', rarity: 2 },
  { id: 133, name: 'Иви', type: 'Нормальный', rarity: 2 },
  { id: 134, name: 'Вапореон', type: 'Вода', rarity: 3 },
  { id: 135, name: 'Джолтеон', type: 'Электро', rarity: 3 },
  { id: 136, name: 'Флареон', type: 'Огонь', rarity: 3 },
  { id: 137, name: 'Поригон', type: 'Нормальный', rarity: 2 },
  { id: 138, name: 'Оманайт', type: 'Камень', rarity: 2 },
  { id: 139, name: 'Омастар', type: 'Камень', rarity: 3 },
  { id: 140, name: 'Кабуто', type: 'Камень', rarity: 2 },
  { id: 141, name: 'Кабутопс', type: 'Камень', rarity: 3 },
  { id: 142, name: 'Аэродактиль', type: 'Камень', rarity: 3 },
  { id: 143, name: 'Снорлакс', type: 'Нормальный', rarity: 3 },
  { id: 144, name: 'Артикуно', type: 'Лёд', rarity: 5 },
  { id: 145, name: 'Запдос', type: 'Электро', rarity: 5 },
  { id: 146, name: 'Молтрес', type: 'Огонь', rarity: 5 },
  { id: 147, name: 'Дратини', type: 'Дракон', rarity: 2 },
  { id: 148, name: 'Драгонэйр', type: 'Дракон', rarity: 3 },
  { id: 149, name: 'Драгонайт', type: 'Дракон', rarity: 4 },
  { id: 150, name: 'Мьюту', type: 'Психический', rarity: 5 },
  { id: 151, name: 'Мью', type: 'Психический', rarity: 5 },
];

// [from, to, candy cost]
const EVO = [[1,2,25],[2,3,100],[4,5,25],[5,6,100],[7,8,25],[8,9,100],[10,11,12],[11,12,50],[13,14,12],[14,15,50],
  [16,17,12],[17,18,50],[19,20,25],[21,22,50],[23,24,50],[25,26,50],[27,28,50],[29,30,25],[30,31,100],[32,33,25],[33,34,100],
  [35,36,50],[37,38,50],[39,40,50],[41,42,50],[43,44,25],[44,45,100],[46,47,50],[48,49,50],[50,51,50],[52,53,50],[54,55,50],
  [56,57,50],[58,59,50],[60,61,25],[61,62,100],[63,64,25],[64,65,100],[66,67,25],[67,68,100],[69,70,25],[70,71,100],[72,73,50],
  [74,75,25],[75,76,100],[77,78,50],[79,80,50],[81,82,50],[84,85,50],[86,87,50],[88,89,50],[90,91,50],[92,93,25],[93,94,100],
  [96,97,50],[98,99,50],[100,101,50],[102,103,50],[104,105,50],[109,110,50],[111,112,50],[116,117,50],[118,119,50],[120,121,50],
  [129,130,200],[133,134,25],[133,135,25],[133,136,25],[138,139,50],[140,141,50],[147,148,25],[148,149,100]];

const TYPE_COLORS = { 'Трава': '#3fa34d', 'Огонь': '#e8622c', 'Вода': '#3d8be0', 'Жук': '#8fae1b', 'Летающий': '#7f9be6', 'Нормальный': '#9a9a72',
  'Яд': '#a040a0', 'Электро': '#e0b000', 'Земля': '#c9a14a', 'Фея': '#e889a3', 'Боевой': '#c03028', 'Психический': '#f05888',
  'Камень': '#a8902e', 'Лёд': '#5cc6c6', 'Призрак': '#705898', 'Дракон': '#6a38f0' };

// attacker type -> { strong: [...], weak: [...], immune: [...] }
const TYPE_CHART = {
  'Нормальный':  { strong: [], weak: ['Камень'], immune: ['Призрак'] },
  'Огонь':       { strong: ['Трава', 'Лёд', 'Жук'], weak: ['Огонь', 'Вода', 'Камень', 'Дракон'] },
  'Вода':        { strong: ['Огонь', 'Земля', 'Камень'], weak: ['Вода', 'Трава', 'Дракон'] },
  'Трава':       { strong: ['Вода', 'Земля', 'Камень'], weak: ['Огонь', 'Трава', 'Яд', 'Летающий', 'Жук', 'Дракон'] },
  'Электро':     { strong: ['Вода', 'Летающий'], weak: ['Электро', 'Трава', 'Дракон'], immune: ['Земля'] },
  'Лёд':         { strong: ['Трава', 'Земля', 'Летающий', 'Дракон'], weak: ['Огонь', 'Вода', 'Лёд'] },
  'Боевой':      { strong: ['Нормальный', 'Лёд', 'Камень'], weak: ['Яд', 'Летающий', 'Психический', 'Жук', 'Фея'], immune: ['Призрак'] },
  'Яд':          { strong: ['Трава', 'Фея'], weak: ['Яд', 'Земля', 'Камень', 'Призрак'] },
  'Земля':       { strong: ['Огонь', 'Электро', 'Яд', 'Камень'], weak: ['Трава', 'Жук'], immune: ['Летающий'] },
  'Летающий':    { strong: ['Трава', 'Боевой', 'Жук'], weak: ['Электро', 'Камень'] },
  'Психический': { strong: ['Боевой', 'Яд'], weak: ['Психический'] },
  'Жук':         { strong: ['Трава', 'Психический'], weak: ['Огонь', 'Боевой', 'Яд', 'Летающий', 'Призрак', 'Фея'] },
  'Камень':      { strong: ['Огонь', 'Лёд', 'Летающий', 'Жук'], weak: ['Боевой', 'Земля'] },
  'Призрак':     { strong: ['Призрак', 'Психический'], weak: [], immune: ['Нормальный'] },
  'Дракон':      { strong: ['Дракон'], weak: [], immune: ['Фея'] },
  'Фея':         { strong: ['Боевой', 'Дракон'], weak: ['Огонь', 'Яд'] },
};
function typeEff(atk, def) {
  const c = TYPE_CHART[atk];
  if (!c) return 1;
  if (c.strong.includes(def)) return 1.6;
  if (c.immune && c.immune.includes(def)) return 0.39;
  if (c.weak.includes(def)) return 0.625;
  return 1;
}

// type -> [fast move, charge move]
const MOVES = {
  'Нормальный': ['Удар', 'Гиперлуч'], 'Огонь': ['Угли', 'Огнемёт'], 'Вода': ['Водяная пушка', 'Гидронасос'],
  'Трава': ['Бритвенный лист', 'Солнечный луч'], 'Электро': ['Искра', 'Молния'], 'Лёд': ['Ледяной осколок', 'Снежная буря'],
  'Боевой': ['Каратэ-удар', 'Динамический удар'], 'Яд': ['Ядовитое жало', 'Грязевая бомба'], 'Земля': ['Грязевой выстрел', 'Землетрясение'],
  'Летающий': ['Крыло', 'Небесная атака'], 'Психический': ['Замешательство', 'Психический удар'], 'Жук': ['Укус жука', 'Жужжание'],
  'Камень': ['Камнепад', 'Каменный край'], 'Призрак': ['Ночная тень', 'Теневой шар'], 'Дракон': ['Дыхание дракона', 'Драконий коготь'],
  'Фея': ['Чары', 'Лунная сила'],
};

const RARITY = {
  1: { label: 'Обычный',     weight: 50,  catchRate: 0.55, flee: 0.08, xp: 100,  color: '#30a46c' },
  2: { label: 'Необычный',   weight: 25,  catchRate: 0.40, flee: 0.12, xp: 150,  color: '#30a46c' },
  3: { label: 'Редкий',      weight: 10,  catchRate: 0.25, flee: 0.18, xp: 300,  color: '#f5d90a' },
  4: { label: 'Эпический',   weight: 3,   catchRate: 0.12, flee: 0.25, xp: 700,  color: '#f76b15' },
  5: { label: 'Легендарный', weight: 0.7, catchRate: 0.06, flee: 0.30, xp: 2000, color: '#e5484d' },
};

const BALLS = {
  basic:   { name: 'Покебол',   icon: '🔴', mult: 1,   css: '',        desc: 'Обычный шанс поимки' },
  great:   { name: 'Грейтбол',  icon: '🔵', mult: 1.5, css: 'great',   desc: 'Шанс поимки ×1.5' },
  ultra:   { name: 'Ультрабол', icon: '🟡', mult: 2,   css: 'ultra',   desc: 'Шанс поимки ×2' },
};
const PREMIER = { name: 'Премьер-бол', icon: '⚪', mult: 1, css: 'premier' };

const ITEMS = {
  berry:   { name: 'Ягода Разз',      icon: '🍓', desc: 'Скорми в бою: следующий бросок ловит в 1.5 раза лучше' },
  incense: { name: 'Ладан',           icon: '🪔', desc: '15 минут покемоны сами приходят к тебе' },
  lucky:   { name: 'Счастливое яйцо', icon: '🍀', desc: '30 минут весь опыт ×2' },
  pass:    { name: 'Рейд-пропуск',    icon: '🎟️', desc: 'Вход в рейд. Один бесплатный каждый день' },
};
const CURRENCY = {
  dust:   { name: 'Звёздная пыль',   icon: '💫' },
  coins:  { name: 'Монеты',          icon: '🪙' },
  pack:   { name: 'Набор карточек',  icon: '🎴' },
  shards: { name: 'Осколки карточек', icon: '🔷' },
};

// Collectible cards: card rarity follows the Pokémon's rarity
const CARD_RARITY = {
  1: { name: 'Обычная',     frame: 'бронзовая',   shards: 5,   craft: 40 },
  2: { name: 'Необычная',   frame: 'серебряная',  shards: 10,  craft: 80 },
  3: { name: 'Редкая',      frame: 'золотая',     shards: 25,  craft: 200 },
  4: { name: 'Эпическая',   frame: 'фиолетовая',  shards: 60,  craft: 500 },
  5: { name: 'Легендарная', frame: 'голографическая', shards: 150, craft: 1200 },
};
const CARD_SHINY_CHANCE = 0.02;
const CARD_SETS = [
  { id: 'starters', name: 'Стартовые',            icon: '🌱', ids: [1, 4, 7],                 reward: { pack: 1, coins: 50 } },
  { id: 'finals',   name: 'Эволюции стартовых',   icon: '🔥', ids: [3, 6, 9],                 reward: { pack: 2, ultra: 5 } },
  { id: 'pika',     name: 'Электромыши',          icon: '⚡', ids: [25, 26],                  reward: { pack: 1, great: 5 } },
  { id: 'eevee',    name: 'Иви и эволюции',       icon: '🦊', ids: [133, 134, 135, 136],      reward: { pack: 2, coins: 100 } },
  { id: 'ghosts',   name: 'Призраки',             icon: '👻', ids: [92, 93, 94],              reward: { pack: 1, incense: 2 } },
  { id: 'fossils',  name: 'Ископаемые',           icon: '🦴', ids: [138, 139, 140, 141, 142], reward: { pack: 2, shards: 300 } },
  { id: 'dragons',  name: 'Драконы',              icon: '🐉', ids: [147, 148, 149],           reward: { pack: 2, ultra: 10 } },
  { id: 'birds',    name: 'Легендарные птицы',    icon: '🦅', ids: [144, 145, 146],           reward: { pack: 3, coins: 300 } },
  { id: 'mew',      name: 'Мьюту и Мью',          icon: '🧬', ids: [150, 151],                reward: { pack: 3, coins: 300 } },
  { id: 'all',      name: 'Полный альбом',        icon: '🏆', ids: 'all',                     reward: { pack: 10, coins: 2000 } },
];

const SHOP = [
  { id: 'balls',   title: '20 Покеболов',     icon: '🔴', price: 100, give: { basic: 20 } },
  { id: 'great',   title: '10 Грейтболов',    icon: '🔵', price: 150, give: { great: 10 } },
  { id: 'ultra',   title: '5 Ультраболов',    icon: '🟡', price: 200, give: { ultra: 5 } },
  { id: 'berry',   title: '10 ягод Разз',     icon: '🍓', price: 80,  give: { berry: 10 } },
  { id: 'incense', title: 'Ладан',            icon: '🪔', price: 150, give: { incense: 1 } },
  { id: 'lucky',   title: 'Счастливое яйцо',  icon: '🍀', price: 150, give: { lucky: 1 } },
  { id: 'pass',    title: 'Рейд-пропуск',     icon: '🎟️', price: 100, give: { pass: 1 } },
  { id: 'egg',     title: 'Яйцо 10 км',       icon: '🥚', price: 250, egg: 10 },
  { id: 'dust',    title: '5000 звёздной пыли', icon: '💫', price: 200, give: { dust: 5000 } },
  { id: 'pack',    title: 'Набор карточек',   icon: '🎴', price: 120, give: { pack: 1 } },
];

// Weather -> boosted types
const WEATHER = {
  clear:  { name: 'Ясно',      icon: '☀️', night: '🌙', types: ['Огонь', 'Трава', 'Земля'] },
  partly: { name: 'Облачно',   icon: '⛅', night: '☁️', types: ['Нормальный', 'Камень'] },
  cloudy: { name: 'Пасмурно',  icon: '☁️', types: ['Фея', 'Боевой', 'Яд'] },
  rain:   { name: 'Дождь',     icon: '🌧️', types: ['Вода', 'Электро', 'Жук'] },
  snow:   { name: 'Снег',      icon: '🌨️', types: ['Лёд'] },
  fog:    { name: 'Туман',     icon: '🌫️', types: ['Призрак', 'Психический'] },
  windy:  { name: 'Ветрено',   icon: '💨', types: ['Дракон', 'Летающий', 'Психический'] },
};

// Biome -> type multipliers
const BIOMES = {
  water: { name: 'У воды', icon: '💧', boost: { 'Вода': 4, 'Лёд': 2, 'Летающий': 1.5 } },
  park:  { name: 'Парк',   icon: '🌳', boost: { 'Трава': 3, 'Жук': 3, 'Фея': 2, 'Нормальный': 1.5, 'Яд': 1.5 } },
  city:  { name: 'Город',  icon: '🏙️', boost: { 'Электро': 2.5, 'Боевой': 2, 'Яд': 1.5, 'Психический': 1.5, 'Камень': 1.5, 'Земля': 1.5, 'Нормальный': 1.3, 'Огонь': 1.3 } },
};

const TRAINER_NAMES = ['Юля', 'Миша', 'Артём', 'Катя', 'Даня', 'Соня', 'Егор', 'Лиза', 'Макс', 'Вика', 'Тимур', 'Аня', 'Гоша', 'Полина'];
const TRAINER_LOOKS = ['🧑‍🎤', '👩‍🦰', '🧑‍🚀', '👨‍🎓', '👩‍🔬', '🧑‍🌾', '🥷', '🧙'];

// Music: 8th-note patterns, MIDI numbers (0 = rest)
const SONGS = {
  map: { bpm: 104,
    lead: [72,0,76,79, 77,76,74,0, 72,0,74,76, 74,0,0,0, 69,0,72,76, 74,72,71,0, 72,0,71,69, 67,0,0,0],
    bass: [48,0,55,0, 53,0,55,0, 48,0,55,0, 50,0,55,0, 45,0,52,0, 50,0,55,0, 48,0,43,0, 48,0,0,0] },
  battle: { bpm: 152,
    lead: [69,72,76,72, 69,72,76,79, 77,76,74,72, 74,76,72,0, 69,72,76,72, 69,72,76,81, 79,77,76,74, 72,71,69,0],
    bass: [45,45,57,45, 45,45,57,45, 41,41,53,41, 43,43,55,43, 45,45,57,45, 45,45,57,45, 41,41,53,41, 40,40,52,40] },
};

// Real height (dm), weight (hg) and gender rate (eighths female, -1 = genderless) from PokéAPI, index = id - 1
const SIZES = [[7,69,1],[10,130,1],[20,1000,1],[6,85,1],[11,190,1],[17,905,1],[5,90,1],[10,225,1],[16,855,1],[3,29,4],[7,99,4],[11,320,4],[3,32,4],[6,100,4],[10,295,4],[3,18,4],[11,300,4],[15,395,4],[3,35,4],[7,185,4],[3,20,4],[12,380,4],[20,69,4],[35,650,4],[4,60,4],[8,300,4],[6,120,4],[10,295,4],[4,70,8],[8,200,8],[13,600,8],[5,90,0],[9,195,0],[14,620,0],[6,75,6],[13,400,6],[6,99,6],[11,199,6],[5,55,6],[10,120,6],[8,75,4],[16,550,4],[5,54,4],[8,86,4],[12,186,4],[3,54,4],[10,295,4],[10,300,4],[15,125,4],[2,8,4],[7,333,4],[4,42,4],[10,320,4],[8,196,4],[17,766,4],[5,280,4],[10,320,4],[7,190,2],[19,1550,2],[6,124,4],[10,200,4],[13,540,4],[9,195,2],[13,565,2],[15,480,2],[8,195,2],[15,705,2],[16,1300,2],[7,40,4],[10,64,4],[17,155,4],[9,455,4],[16,550,4],[4,200,4],[10,1050,4],[14,3000,4],[10,300,4],[17,950,4],[12,360,4],[16,785,4],[3,60,-1],[10,600,-1],[8,150,4],[14,392,4],[18,852,4],[11,900,4],[17,1200,4],[9,300,4],[12,300,4],[3,40,4],[15,1325,4],[13,1,4],[16,1,4],[15,405,4],[88,2100,4],[10,324,4],[16,756,4],[4,65,4],[13,600,4],[5,104,-1],[12,666,-1],[4,25,4],[20,1200,4],[4,65,4],[10,450,4],[15,498,0],[14,502,0],[12,655,4],[6,10,4],[12,95,4],[10,1150,4],[19,1200,4],[11,346,8],[10,350,4],[22,800,8],[4,80,4],[12,250,4],[6,150,4],[13,390,4],[8,345,-1],[11,800,-1],[13,545,4],[15,560,4],[14,406,8],[11,300,2],[13,445,2],[15,550,4],[14,884,0],[9,100,4],[65,2350,4],[25,2200,4],[3,40,-1],[3,65,1],[10,290,1],[8,245,1],[9,250,1],[8,365,-1],[4,75,1],[10,350,1],[5,115,1],[13,405,1],[18,590,1],[21,4600,1],[17,554,-1],[16,526,-1],[20,600,-1],[18,33,4],[40,165,4],[22,2100,4],[20,1220,-1],[4,40,-1]];

// ---------- Trainer ----------
const AVATAR_LOOKS = ['🧑', '👩', '👨', '🧒', '👧', '👦', '🧑‍🦰', '👩‍🦰', '🧑‍🦱', '👩‍🦱', '👱', '👱‍♀️', '🧔', '👩‍🦳', '🧑‍🦲', '🥷'];
const AVATAR_COLORS = ['#3d7dca', '#e5484d', '#30a46c', '#ffcb05', '#8e4ec6', '#f76b15', '#ec4899', '#14b8a6'];
const TEAMS = {
  mystic:   { name: 'Мистик',   icon: '❄️', color: '#3d7dca', bonus: { dust: 10 },   desc: '+10% звёздной пыли' },
  valor:    { name: 'Валор',    icon: '🔥', color: '#e5484d', bonus: { damage: 10 }, desc: '+10% урона в боях' },
  instinct: { name: 'Инстинкт', icon: '⚡', color: '#f5b800', bonus: { xp: 10 },     desc: '+10% опыта' },
};

// ---------- Gear ----------
const GEAR_SLOTS = {
  head:  { name: 'Голова',   icon: '🧢' },
  eyes:  { name: 'Очки',     icon: '👓' },
  body:  { name: 'Одежда',   icon: '👕' },
  hands: { name: 'Руки',     icon: '🧤' },
  feet:  { name: 'Обувь',    icon: '👟' },
  charm: { name: 'Талисман', icon: '🧿' },
};
const GEAR_STATS = {
  catch:  { label: 'к поимке', unit: '%' },
  xp:     { label: 'опыта', unit: '%' },
  dust:   { label: 'звёздной пыли', unit: '%' },
  egg:    { label: 'к пути для яиц', unit: '%' },
  shiny:  { label: 'к шансу блестящих', unit: '%' },
  card:   { label: 'к шансу карточек', unit: '%' },
  damage: { label: 'урона в боях', unit: '%' },
  radius: { label: 'к радиусу действия', unit: ' м' },
  stop:   { label: 'предмет с покестопа', unit: '' },
};
const GEAR_RARITY = {
  1: { name: 'Обычное',     color: '#b07a45', price: 150,  sell: 20 },
  2: { name: 'Необычное',   color: '#9aa6b2', price: 300,  sell: 40 },
  3: { name: 'Редкое',      color: '#d4a017', price: 600,  sell: 100 },
  4: { name: 'Эпическое',   color: '#8e4ec6', price: 1200, sell: 250 },
  5: { name: 'Легендарное', color: '#e5484d', price: 0,    sell: 600 },
};
const GEAR = [
  { id: 'cap',       slot: 'head',  icon: '🧢', name: 'Кепка тренера',        rarity: 1, bonus: { xp: 3 } },
  { id: 'panama',    slot: 'head',  icon: '👒', name: 'Панама путешественника', rarity: 2, bonus: { xp: 5, egg: 3 } },
  { id: 'helmet',    slot: 'head',  icon: '⛑️', name: 'Каска',                rarity: 3, bonus: { damage: 10 } },
  { id: 'tophat',    slot: 'head',  icon: '🎩', name: 'Цилиндр',              rarity: 4, bonus: { xp: 10, dust: 5 } },
  { id: 'crown',     slot: 'head',  icon: '👑', name: 'Корона Канто',         rarity: 5, bonus: { xp: 15, dust: 10 }, exclusive: true },
  { id: 'glasses',   slot: 'eyes',  icon: '👓', name: 'Очки коллекционера',   rarity: 1, bonus: { card: 10 } },
  { id: 'shades',    slot: 'eyes',  icon: '🕶️', name: 'Солнцезащитные очки',  rarity: 2, bonus: { radius: 5 } },
  { id: 'monocle',   slot: 'eyes',  icon: '🔍', name: 'Монокль',              rarity: 3, bonus: { shiny: 15, card: 15 } },
  { id: 'goggles',   slot: 'eyes',  icon: '🥽', name: 'Очки-скаутер',         rarity: 4, bonus: { shiny: 30, radius: 10 } },
  { id: 'tshirt',    slot: 'body',  icon: '👕', name: 'Футболка',             rarity: 1, bonus: { dust: 3 } },
  { id: 'jacket',    slot: 'body',  icon: '🧥', name: 'Куртка',               rarity: 2, bonus: { dust: 6 } },
  { id: 'vest',      slot: 'body',  icon: '🦺', name: 'Жилет следопыта',      rarity: 3, bonus: { stop: 1, egg: 5 } },
  { id: 'kimono',    slot: 'body',  icon: '🥋', name: 'Кимоно',               rarity: 3, bonus: { damage: 12 } },
  { id: 'cape',      slot: 'body',  icon: '🦸', name: 'Плащ чемпиона',        rarity: 5, bonus: { xp: 10, damage: 10, dust: 10 }, exclusive: true },
  { id: 'gloves',    slot: 'hands', icon: '🧤', name: 'Перчатки',             rarity: 1, bonus: { catch: 3 } },
  { id: 'mitts',     slot: 'hands', icon: '✋', name: 'Перчатки ловца',       rarity: 3, bonus: { catch: 7 } },
  { id: 'boxing',    slot: 'hands', icon: '🥊', name: 'Боксёрские перчатки',  rarity: 3, bonus: { damage: 15 } },
  { id: 'pitcher',   slot: 'hands', icon: '🫴', name: 'Рука питчера',         rarity: 4, bonus: { catch: 12 } },
  { id: 'sneakers',  slot: 'feet',  icon: '👟', name: 'Кроссовки',            rarity: 1, bonus: { egg: 10 } },
  { id: 'boots',     slot: 'feet',  icon: '🥾', name: 'Походные ботинки',     rarity: 2, bonus: { egg: 20 } },
  { id: 'skates',    slot: 'feet',  icon: '🛼', name: 'Ролики',               rarity: 4, bonus: { egg: 35 } },
  { id: 'jetboots',  slot: 'feet',  icon: '🚀', name: 'Реактивные ботинки',   rarity: 5, bonus: { egg: 50, radius: 10 }, exclusive: true },
  { id: 'daisy',     slot: 'charm', icon: '🌼', name: 'Ромашка',              rarity: 1, bonus: { catch: 2, xp: 2 } },
  { id: 'evileye',   slot: 'charm', icon: '🧿', name: 'Оберег',               rarity: 2, bonus: { catch: 5 } },
  { id: 'hamsa',     slot: 'charm', icon: '🪬', name: 'Амулет',               rarity: 3, bonus: { xp: 8 } },
  { id: 'orb',       slot: 'charm', icon: '🔮', name: 'Хрустальный шар',      rarity: 3, bonus: { card: 50 } },
  { id: 'gem',       slot: 'charm', icon: '💎', name: 'Кристалл',             rarity: 4, bonus: { dust: 20 } },
  { id: 'seasonstar', slot: 'charm', icon: '🌟', name: 'Звезда сезона',       rarity: 5, bonus: { shiny: 50, catch: 5 }, exclusive: true },
];

// ---------- Battle pass ----------
const PASS_EPOCH = new Date(2026, 9, 1).getTime();   // season 1 starts on 1 Oct 2026
const PASS_DAYS = 28;
const PASS_TIERS = 30;
const PASS_XP = 1000;                                 // pass XP per tier
const PASS_PRICE = 600;                               // coins for the premium track
const PASS_NAMES = ['Канто', 'Огонь и вода', 'Гроза', 'Тени', 'Драконы', 'Легенды'];
const PASS_REWARDS = Array.from({ length: PASS_TIERS }, (_, i) => {
  const t = i + 1;
  const free = { 15: { gear: 'shades' }, 30: { pack: 2, coins: 100 } }[t]
    || (t % 5 === 0 ? { pack: 1 } : t % 3 === 0 ? { great: 3 } : t % 2 === 0 ? { basic: 10 } : { berry: 2 });
  const prem = { 1: { pack: 1, coins: 50 }, 10: { gear: 'crown' }, 20: { gear: 'cape' }, 25: { gear: 'jetboots' }, 30: { gear: 'seasonstar', pack: 3 } }[t]
    || (t % 5 === 0 ? { pack: 2 } : t % 4 === 0 ? { ultra: 3 } : t % 3 === 0 ? { coins: 40 } : t % 2 === 0 ? { dust: 1500 } : { great: 5, lucky: t % 7 === 0 ? 1 : 0 });
  return { free, prem };
});
const PASS_POINTS = { catch: 50, excellent: 25, spin: 50, hatch: 200, trainer: 300, raid: 600, quest: 400, km: 100, evolve: 100, streak: 200, pack: 30 };

// ---------- Pokéstops on real places ----------
const POI_ICONS = {
  museum: '🏛️', art_gallery: '🎨', arts_centre: '🎨', theatre: '🎭', cinema: '🎬', library: '📚', monument: '🗿', memorial: '🗿',
  castle: '🏰', fountain: '⛲', attraction: '🎡', viewpoint: '🔭', zoo: '🦁', aquarium: '🐠', park: '🌳', garden: '🌷', playground: '🛝',
  place_of_worship: '⛪', church: '⛪', cafe: '☕', restaurant: '🍽️', fast_food: '🍔', ice_cream: '🍦', bar: '🍺', beer: '🍺', pub: '🍺',
  bakery: '🥐', shop: '🛍️', clothing_store: '👗', grocery: '🛒', books: '📚', music: '🎵', stadium: '🏟️', sports_centre: '🏟️',
  swimming: '🏊', college: '🎓', school: '🎓', university: '🎓', town_hall: '🏛️', post: '✉️', railway: '🚉', bus: '🚌', harbor: '⚓',
  hospital: '🏥', pharmacy: '💊', lodging: '🏨', hotel: '🏨', bank: '🏦', atm: '🏧', fuel: '⛽', toilets: '🚻', cemetery: '🕯️',
};
const STOP_FALLBACK = [
  ['🎨', 'Граффити на стене'], ['🪑', 'Старая скамейка'], ['⛲', 'Маленький фонтанчик'], ['🖼️', 'Мурал'], ['🗿', 'Скульптура во дворе'],
  ['🛝', 'Детская площадка'], ['🏛️', 'Арка'], ['📮', 'Почтовый ящик'], ['🪧', 'Памятная табличка'], ['🏮', 'Старинный фонарь'],
  ['🧩', 'Мозаика'], ['⛺', 'Беседка'], ['🌷', 'Клумба'], ['🐈', 'Кошачий двор'], ['🌳', 'Большое дерево'], ['🚲', 'Велопарковка'],
];
