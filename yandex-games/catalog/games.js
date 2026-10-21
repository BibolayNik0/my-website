// Каталог 100 игр. Распределение по жанрам и темам — по анализу рынка (MARKET_ANALYSIS.md).
// Формат: G(жанр, slug, [ru, en], набор_коллекции, палитра, [описание ru, en], спрайты, параметры)
(function () {
  const P = {
    night:  ['#1d2b64', '#0f1734', '#ffb300'], grape:  ['#5b247a', '#1b1464', '#ff6ec4'], ocean: ['#0f4c75', '#0a1f3a', '#3fc1c9'],
    lime:   ['#2f7336', '#123118', '#c6ff00'], fire:   ['#c0392b', '#3b0d0d', '#ffcc00'], candy: ['#ff6fb5', '#7a1f5c', '#fff36b'],
    sunset: ['#ff7e5f', '#5a1e3c', '#feb47b'], ice:    ['#4facfe', '#123a6b', '#e0f7ff'], gold:  ['#8e6d1f', '#2b1d05', '#ffd700'],
    toxic:  ['#2c3e1f', '#0b1408', '#7cff4f'], royal:  ['#41295a', '#2f0743', '#ffcf40'], mint:  ['#11998e', '#0b3d35', '#38ef7d'],
    steel:  ['#3a4a5c', '#111821', '#00e5ff'], blood:  ['#4a0000', '#120000', '#ff5252'], pastel: ['#a18cd1', '#5b4a8b', '#fbc2eb'],
    sky:    ['#56ccf2', '#2f80ed', '#ffe259'], forest: ['#3a6b35', '#1a2f1a', '#e3b448'], pumpkin: ['#ff7518', '#2b1100', '#ffd36b'],
    space:  ['#0b0c2a', '#000004', '#a259ff'], sand:   ['#c79a5a', '#4a3214', '#fff1c1']
  };
  const list = [];
  function G(genre, slug, title, set, pal, desc, sp, p) {
    list.push({ id: list.length + 1, genre, slug, title: { ru: title[0], en: title[1] }, set, pal: P[pal], desc: { ru: desc[0], en: desc[1] }, sp: sp || {}, p: p || {} });
  }

  // ===== Кликеры / айдл-тайкуны (12) — самый «донатный» жанр: рост чисел, оффлайн-доход, буст за рекламу =====
  G('clicker', 'meme-clicker', ['Мем-Кликер: Абсурд-вселенная', 'Meme Clicker: Absurd Verse'], 'memes', 'grape', ['Тапай мемных существ и строй абсурдную империю!', 'Tap meme creatures and build an absurd empire!'],
    { hero: '🗿', item: '🤌' }, { gens: ['🐸|Лягух-фабрика|Froggo Factory', '🦈|Акулья обувная|Shark Shoes', '☕|Кофейня ниндзя|Ninja Café', '🐊|Крокодилий аэродром|Croco Airfield', '🍌|Банановый банк|Banana Bank', '🌌|Мем-галактика|Meme Galaxy'] });
  G('clicker', 'cat-cafe-tycoon', ['Котокафе Тайкун', 'Cat Café Tycoon'], 'cats', 'pastel', ['Корми котиков, нанимай персонал и открывай котокафе по всему миру.', 'Feed kitties, hire staff and open cat cafés worldwide.'],
    { hero: '😺', item: '🐟' }, { gens: ['🥛|Миска молока|Milk Bowl', '🧶|Клубочный цех|Yarn Shop', '🛋️|Когтеточка-лаунж|Scratch Lounge', '🍰|Кондитерская|Bakery', '🏨|Котоотель|Cat Hotel', '🏯|Кошачий дворец|Cat Palace'] });
  G('clicker', 'billionaire', ['Стань миллиардером', 'Become a Billionaire'], 'money', 'gold', ['От ларька с лимонадом до собственной корпорации.', 'From a lemonade stand to your own megacorp.'],
    { hero: '💰', item: '💎' }, { gens: ['🍋|Лимонадный ларёк|Lemonade Stand', '🚚|Доставка|Delivery', '🏪|Супермаркет|Supermarket', '🏭|Завод|Factory', '🏦|Банк|Bank', '🚀|Космокорпорация|Space Corp'], costMul: 1.2, cpsMul: 1.3 });
  G('clicker', 'space-miner', ['Космический шахтёр', 'Space Miner'], 'space', 'space', ['Добывай руду на астероидах и колонизируй галактику.', 'Mine asteroids and colonize the galaxy.'],
    { hero: '🪐', item: '☄️' }, { gens: ['⛏️|Кирка|Pickaxe', '🤖|Дрон-шахтёр|Mining Drone', '🛰️|Орбитальная станция|Orbital Station', '🚀|Грузовой флот|Cargo Fleet', '🌑|Лунная база|Moon Base', '🌌|Сфера Дайсона|Dyson Sphere'] });
  G('clicker', 'pizza-empire', ['Пиццерия Империя', 'Pizza Empire'], 'food', 'fire', ['Пеки пиццу тапами, открывай филиалы и стань королём фастфуда.', 'Bake pizza by tapping, open branches, rule fast food.'],
    { hero: '🍕', item: '🧀' }, { gens: ['👨‍🍳|Повар|Chef', '🛵|Курьер|Courier', '🔥|Дровяная печь|Wood Oven', '🏪|Филиал|Branch', '🚚|Фудтрак-флот|Food Truck Fleet', '🌍|Мировая сеть|Global Chain'] });
  G('clicker', 'farm-idle', ['Ферма-кликер', 'Idle Farm'], 'farm', 'lime', ['Собирай урожай, покупай технику и расширяй угодья.', 'Harvest crops, buy machinery, expand your land.'],
    { hero: '🌽', item: '🥚' }, { gens: ['🐔|Курятник|Henhouse', '🥕|Грядки|Garden Beds', '🐄|Коровник|Cowshed', '🚜|Трактор|Tractor', '🏭|Сыроварня|Creamery', '🛩️|Агроавиация|Crop Duster'] });
  G('clicker', 'dragon-hoard', ['Сокровища дракона', "Dragon's Hoard"], 'fantasy', 'royal', ['Помоги дракону собрать самую большую сокровищницу королевства.', 'Help a dragon amass the biggest hoard in the realm.'],
    { hero: '🐉', item: '👑' }, { gens: ['🧚|Феи-сборщицы|Fairy Gatherers', '🧙|Алхимик|Alchemist', '⛏️|Гномья шахта|Dwarf Mine', '🏰|Замок|Castle', '🔮|Портал|Portal', '🌋|Драконий вулкан|Dragon Volcano'] });
  G('clicker', 'car-factory', ['Автозавод Тайкун', 'Car Factory Tycoon'], 'cars', 'steel', ['Собирай машины, автоматизируй конвейер и выпускай суперкары.', 'Build cars, automate the line, ship supercars.'],
    { hero: '🏎️', item: '🔧' }, { gens: ['🔧|Гараж|Garage', '⚙️|Конвейер|Assembly Line', '🤖|Роботы-сборщики|Robot Arms', '🏁|Тест-трек|Test Track', '🚢|Экспорт|Export', '🚀|Ракетомобили|Rocket Cars'] });
  G('clicker', 'candy-factory', ['Фабрика конфет', 'Candy Factory'], 'candy', 'candy', ['Вари карамель, лей шоколад и корми весь город сладостями.', 'Boil caramel, pour chocolate, feed the whole city sweets.'],
    { hero: '🍭', item: '🍬' }, { gens: ['🍯|Котёл с карамелью|Caramel Pot', '🍫|Шоколадная река|Chocolate River', '🍩|Пончиковая|Donut Shop', '🎂|Тортовый цех|Cake Lab', '🏭|Мегафабрика|Megafactory', '🏰|Сладкое королевство|Sweet Kingdom'] });
  G('clicker', 'zombie-lab', ['Лаборатория зомби', 'Zombie Lab'], 'zombie', 'toxic', ['Изобретай вакцину, пока мир катится в апокалипсис.', 'Invent the cure while the world falls apart.'],
    { hero: '🧟', item: '💉' }, { gens: ['🧪|Пробирки|Test Tubes', '🩺|Медпункт|Infirmary', '🔬|Микроскоп|Microscope', '🚁|Эвакуация|Evac Chopper', '🏥|Госпиталь|Hospital', '☢️|Реактор|Reactor'] });
  G('clicker', 'pop-star', ['Путь к славе: Поп-звезда', 'Road to Fame: Pop Star'], 'music', 'sunset', ['Пиши хиты, собирай фанатов и выступай на стадионах.', 'Write hits, gain fans, play stadiums.'],
    { hero: '🎤', item: '⭐' }, { gens: ['🎸|Гараж-бэнд|Garage Band', '📻|Радио|Radio', '🎬|Клип|Music Video', '📀|Альбом|Album', '🏟️|Стадион|Stadium', '🌍|Мировой тур|World Tour'] });
  G('clicker', 'diamond-mine', ['Алмазная шахта', 'Diamond Mine'], 'jewels', 'night', ['Копай глубже, находи самоцветы и стань ювелирным магнатом.', 'Dig deeper, find gems, become a jewel tycoon.'],
    { hero: '💎', item: '🪙' }, { gens: ['⛏️|Шахтёр|Miner', '🛒|Вагонетка|Mine Cart', '💥|Динамит|Dynamite', '🚂|Рудовоз|Ore Train', '💍|Ювелирня|Jeweler', '🏦|Хранилище|Vault'] });

  // ===== Мерж (10) — коллекционный азарт «что будет дальше» =====
  G('merge', 'merge-memes', ['Мерж мемов', 'Merge Memes'], 'memes', 'grape', ['Соединяй мемы и открой самого абсурдного персонажа!', 'Merge memes to unlock the most absurd creature!'], { hero: '🗿', gen: '📦' });
  G('merge', 'merge-cats', ['Мерж котиков', 'Merge Cats'], 'cats', 'pastel', ['Объединяй котиков и выведи королевского кота.', 'Merge kitties into the Royal Cat.'], { hero: '😻', gen: '🧺' });
  G('merge', 'dino-evolution', ['Эволюция динозавров', 'Dino Evolution'], 'dinos', 'forest', ['От яйца до Тираннозавра Рекса — проведи эволюцию!', 'From egg to T-Rex — drive evolution!'], { hero: '🦖', gen: '🥚' });
  G('merge', 'merge-cars', ['Мерж машин', 'Merge Cars'], 'cars', 'steel', ['Собирай из старых машин золотой суперкар.', 'Merge old cars into a golden supercar.'], { hero: '🏎️', gen: '🔧' }, { size: 4 });
  G('merge', 'merge-robots', ['Мерж роботов', 'Merge Robots'], 'robots', 'steel', ['Из болтов и шестерёнок — в мегатитана.', 'From bolts and gears to a Megatitan.'], { hero: '🤖', gen: '⚙️' });
  G('merge', 'sweet-merge', ['Сладкий мерж', 'Sweet Merge'], 'candy', 'candy', ['Объединяй сладости и построй пряничный замок.', 'Merge sweets into a gingerbread castle.'], { hero: '🍭', gen: '🎁' }, { auto: 2.2 });
  G('merge', 'magic-merge', ['Мерж магии', 'Magic Merge'], 'fantasy', 'royal', ['Сливай артефакты и призови древнего дракона.', 'Merge artifacts and summon the Elder Dragon.'], { hero: '🧙', gen: '🔮' });
  G('merge', 'kitchen-merge', ['Кулинарный мерж', 'Kitchen Merge'], 'food', 'fire', ['Из бургера — в королевский пир.', 'From a burger to a royal feast.'], { hero: '👨‍🍳', gen: '🍳' }, { size: 6, auto: 2.0 });
  G('merge', 'ocean-merge', ['Мерж океана', 'Ocean Merge'], 'sea', 'ocean', ['Объединяй морских жителей до трезубца Посейдона.', 'Merge sea life up to Poseidon\'s trident.'], { hero: '🐬', gen: '🫧' });
  G('merge', 'business-merge', ['Мерж бизнеса', 'Business Merge'], 'money', 'gold', ['Сливай деньги и стань владельцем мегакорпорации.', 'Merge cash into a megacorp.'], { hero: '💼', gen: '🏧' }, { size: 6 });

  // ===== Три в ряд (10) — классика для широкой аудитории 25+ =====
  G('match3', 'pharaoh-jewels', ['Сокровища фараона', "Pharaoh's Jewels"], 'jewels', 'sand', ['Собирай самоцветы в гробнице фараона.', "Match gems in the pharaoh's tomb."], { hero: '🏺' });
  G('match3', 'candy-blast', ['Конфетный взрыв', 'Candy Blast'], 'candy', 'candy', ['Сладкие комбо и каскады конфет.', 'Sweet combos and candy cascades.'], { hero: '🍬' }, { moves: 22 });
  G('match3', 'fruit-farm-match', ['Фруктовая ферма: 3 в ряд', 'Fruit Farm Match'], 'fruits', 'lime', ['Собирай урожай тройками.', 'Harvest fruit in threes.'], { hero: '🍓' });
  G('match3', 'underwater-match', ['Подводный мир', 'Underwater World'], 'sea', 'ocean', ['Собери обитателей рифа в линии.', 'Line up reef dwellers.'], { hero: '🐠' }, { kinds: 5, moves: 20 });
  G('match3', 'pumpkin-night', ['Ночь тыкв', 'Pumpkin Night'], 'halloween', 'pumpkin', ['Жуткие комбо в ночь Хэллоуина.', 'Spooky combos on Halloween night.'], { hero: '🎃' });
  G('match3', 'winter-tale', ['Зимняя сказка', 'Winter Tale'], 'winter', 'ice', ['Новогодние каскады снежинок и подарков.', 'New Year cascades of snowflakes and gifts.'], { hero: '⛄' });
  G('match3', 'flower-garden', ['Цветочный сад', 'Flower Garden'], 'flowers', 'pastel', ['Выращивай сад цветочными комбинациями.', 'Grow a garden with flower combos.'], { hero: '🌷' }, { moves: 28 });
  G('match3', 'star-express', ['Звёздный экспресс', 'Star Express'], 'space', 'space', ['Космические тройки на пути к галактике.', 'Cosmic matches on the way to the galaxy.'], { hero: '🚀' }, { size: 7 });
  G('match3', 'village-match', ['Деревенька', 'Little Village'], 'farm', 'forest', ['Уютная деревенская головоломка.', 'A cozy village puzzle.'], { hero: '🐮' }, { kinds: 5 });
  G('match3', 'bug-meadow', ['Жучиный луг', 'Bug Meadow'], 'bugs', 'mint', ['Собери букашек в линии на летнем лугу.', 'Line up bugs on a summer meadow.'], { hero: '🐞' });

  // ===== Раннеры (9) — короткие сессии, много межстраничной рекламы и возрождений =====
  G('runner', 'zombie-escape', ['Побег от зомби', 'Zombie Escape'], 'zombie', 'toxic', ['Беги, пока орда не догнала!', 'Run before the horde catches you!'], { hero: '🏃', enemies: ['🧟', '🧟‍♀️', '🚧', '☣️'], item: '🥫' });
  G('runner', 'city-race', ['Городская гонка', 'City Race'], 'cars', 'steel', ['Уходи от трафика на полной скорости.', 'Dodge traffic at full speed.'], { hero: '🏎️', enemies: ['🚗', '🚕', '🚌', '🚚', '🚓'], item: '🪙' }, { speed: 300, lanes: 4 });
  G('runner', 'ninja-dash', ['Бег ниндзя', 'Ninja Dash'], 'ninja', 'blood', ['Скользи между ловушками клана теней.', 'Slip past shadow clan traps.'], { hero: '🥷', enemies: ['🗡️', '🏮', '🎋', '👺'], item: '🍙' }, { accel: 8 });
  G('runner', 'space-dash', ['Космический рывок', 'Space Dash'], 'space', 'space', ['Пролети сквозь астероидный пояс.', 'Fly through the asteroid belt.'], { hero: '🚀', enemies: ['☄️', '🪨', '🛸', '🌑'], item: '⭐' }, { lanes: 5, speed: 280 });
  G('runner', 'cat-escape', ['Кот-беглец', 'Runaway Cat'], 'cats', 'pastel', ['Котик сбежал из дома — помоги ему!', 'A cat ran away — help it!'], { hero: '🐈', enemies: ['🐕', '🧹', '🚿', '🛁'], item: '🐟' });
  G('runner', 'dino-run', ['Динозавр бежит', 'Dino Run'], 'dinos', 'forest', ['Убегай от метеорита сквозь джунгли.', 'Outrun the meteor through the jungle.'], { hero: '🦖', enemies: ['🌋', '🪨', '🌵', '🐊'], item: '🦴' });
  G('runner', 'pirate-chase', ['Пиратская погоня', 'Pirate Chase'], 'pirates', 'ocean', ['Уходи от королевского флота с сокровищами.', 'Escape the royal navy with your loot.'], { hero: '⛵', enemies: ['💣', '🪨', '🐙', '🦈'], item: '🪙' }, { lanes: 4 });
  G('runner', 'meme-run', ['Мемный забег', 'Meme Run'], 'memes', 'grape', ['Самый абсурдный забег во вселенной.', 'The most absurd run in the universe.'], { hero: '🐸', enemies: ['🗿', '🦈', '🐊', '🌵'], item: '🍌' }, { accel: 9 });
  G('runner', 'knight-charge', ['Рыцарский рывок', 'Knight Charge'], 'knights', 'royal', ['Скачи к замку, уворачиваясь от врагов.', 'Ride to the castle dodging foes.'], { hero: '🏇', enemies: ['🛡️', '🪓', '🏹', '🐲'], item: '🪙' });

  // ===== Башни (7) — гиперказуал на рекорд + лидерборды =====
  G('stack', 'skyscraper', ['Небоскрёб', 'Skyscraper'], 'money', 'sky', ['Строй самый высокий небоскрёб в городе.', 'Build the tallest skyscraper in town.'], { hero: '👷', deco: '🪟' }, { colors: ['#90a4ae', '#b0bec5', '#78909c', '#cfd8dc'] });
  G('stack', 'cake-tower', ['Торт до небес', 'Sky-High Cake'], 'candy', 'candy', ['Собери самый высокий торт в мире.', 'Stack the tallest cake in the world.'], { hero: '🍒', deco: '🍓' }, { colors: ['#f8bbd0', '#fff59d', '#bcaaa4', '#f48fb1', '#ffffff'] });
  G('stack', 'castle-builder', ['Строим замок', 'Castle Builder'], 'knights', 'royal', ['Возведи неприступную крепость.', 'Raise an impregnable fortress.'], { hero: '🤴', deco: '🛡️' }, { colors: ['#8d6e63', '#a1887f', '#795548', '#bcaaa4'], speed: 200 });
  G('stack', 'ice-tower', ['Ледяная башня', 'Ice Tower'], 'winter', 'ice', ['Скользкие блоки — точный тап!', 'Slippery blocks — tap precisely!'], { hero: '🐧', deco: '❄️' }, { colors: ['#e1f5fe', '#b3e5fc', '#81d4fa', '#4fc3f7'], speed: 230 });
  G('stack', 'pancake-mountain', ['Гора блинов', 'Pancake Mountain'], 'food', 'sunset', ['Сложи бесконечную стопку блинов.', 'Stack an endless pancake pile.'], { hero: '🧈', deco: '🍯' }, { colors: ['#ffcc80', '#ffb74d', '#ffa726', '#ffe0b2'] });
  G('stack', 'space-elevator', ['Лифт в космос', 'Space Elevator'], 'space', 'space', ['Дострой башню до орбиты!', 'Build the tower all the way to orbit!'], { hero: '👨‍🚀', deco: '⭐' }, { colors: ['#7c4dff', '#536dfe', '#448aff', '#40c4ff'], speed: 210 });
  G('stack', 'jungle-totem', ['Тотем джунглей', 'Jungle Totem'], 'bugs', 'forest', ['Собери древний тотем племени.', 'Assemble the ancient tribal totem.'], { hero: '🐒', deco: '🌿' }, { colors: ['#6d4c41', '#8bc34a', '#ff7043', '#ffca28'] });

  // ===== Змейки (7) =====
  G('snake', 'fruit-snake', ['Змейка: Фруктовый пир', 'Snake: Fruit Feast'], 'fruits', 'lime', ['Классическая змейка с сочными фруктами.', 'Classic snake with juicy fruit.'], { hero: '🐍' });
  G('snake', 'space-snake', ['Космическая змейка', 'Space Snake'], 'space', 'space', ['Собирай звёзды, проходя сквозь края галактики.', 'Collect stars and wrap around the galaxy.'], { hero: '🛸' }, { wrap: true });
  G('snake', 'sweet-tooth', ['Сладкоежка', 'Sweet Tooth'], 'candy', 'candy', ['Змейка-сладкоежка ест всё подряд.', 'A sweet-toothed snake eats everything.'], { hero: '🐛' }, { step: 0.14 });
  G('snake', 'dragon-snake', ['Дракон-змей', 'Serpent Dragon'], 'fantasy', 'royal', ['Вырасти дракона, поглощая магию.', 'Grow your dragon by devouring magic.'], { hero: '🐲' }, { cols: 13 });
  G('snake', 'sea-serpent', ['Морской змей', 'Sea Serpent'], 'sea', 'ocean', ['Легендарный змей бороздит океан.', 'The legendary serpent roams the ocean.'], { hero: '🐉' }, { wrap: true, cols: 17 });
  G('snake', 'farm-caterpillar', ['Гусеница на ферме', 'Farm Caterpillar'], 'farm', 'forest', ['Прожорливая гусеница на огороде.', 'A hungry caterpillar in the garden.'], { hero: '🐛' }, { step: 0.18 });
  G('snake', 'meme-snake', ['Змейка мемов', 'Meme Snake'], 'memes', 'grape', ['Собирай мемы и стань легендой.', 'Collect memes and become legendary.'], { hero: '🐸' }, { step: 0.13 });

  // ===== 2048-эволюции (7) — каждая плитка = предмет коллекции =====
  G('g2048', 'cats-2048', ['2048: Эволюция котов', '2048: Cat Evolution'], 'cats', 'pastel', ['Сливай котиков до королевского кота.', 'Merge cats into the Royal Cat.'], { hero: '👑' });
  G('g2048', 'dino-2048', ['2048: Динозавры', '2048: Dinosaurs'], 'dinos', 'forest', ['От яйца до Тираннозавра.', 'From egg to T-Rex.'], { hero: '🦖' });
  G('g2048', 'space-2048', ['2048: Космос', '2048: Space'], 'space', 'space', ['От луны до императора галактики.', 'From moon to Galaxy Emperor.'], { hero: '🪐' });
  G('g2048', 'fastfood-2048', ['2048: Фастфуд', '2048: Fast Food'], 'food', 'fire', ['От бургера до королевского пира.', 'From burger to royal feast.'], { hero: '🍔' }, { size: 5 });
  G('g2048', 'treasure-2048', ['2048: Сокровища', '2048: Treasures'], 'jewels', 'gold', ['Сливай камни до сердца звезды.', 'Merge gems up to the Star Heart.'], { hero: '💎' });
  G('g2048', 'memes-2048', ['2048: Мемы', '2048: Memes'], 'memes', 'grape', ['Мемная эволюция в 2048.', 'Meme evolution in 2048.'], { hero: '🗿' });
  G('g2048', 'birds-2048', ['2048: Птицы', '2048: Birds'], 'birds', 'sky', ['От воробья до райской птицы.', 'From sparrow to bird of paradise.'], { hero: '🦚' }, { size: 5 });

  // ===== Сортировки (8) — топ-жанр по удержанию взрослой аудитории =====
  G('sort', 'fruit-sort', ['Сортировка фруктов', 'Fruit Sort'], 'fruits', 'lime', ['Разложи фрукты по корзинам.', 'Sort fruit into baskets.'], { hero: '🧺' });
  G('sort', 'candy-sort', ['Конфетная сортировка', 'Candy Sort'], 'candy', 'candy', ['Разложи конфеты по банкам.', 'Sort candy into jars.'], { hero: '🍬' });
  G('sort', 'gem-sort', ['Сортировка камней', 'Gem Sort'], 'jewels', 'night', ['Самоцветы по шкатулкам.', 'Gems into caskets.'], { hero: '💍' }, { time: 35 });
  G('sort', 'bug-jars', ['Жуки по банкам', 'Bug Jars'], 'bugs', 'mint', ['Рассади жучков по баночкам.', 'Put bugs into jars.'], { hero: '🫙' });
  G('sort', 'sport-sort', ['Спорт-сортировка', 'Sport Sort'], 'sport', 'sky', ['Разложи мячи по корзинам.', 'Sort balls into baskets.'], { hero: '⚽' });
  G('sort', 'potion-sort', ['Зелья алхимика', "Alchemist's Potions"], 'fantasy', 'royal', ['Рассортируй ингредиенты алхимика.', "Sort the alchemist's ingredients."], { hero: '🧪' }, { cap: 5, time: 50 });
  G('sort', 'aquarium-sort', ['Аквариум-сортировка', 'Aquarium Sort'], 'sea', 'ocean', ['Рассели рыбок по аквариумам.', 'Sort fish into tanks.'], { hero: '🐠' });
  G('sort', 'bouquet-sort', ['Букеты', 'Bouquets'], 'flowers', 'pastel', ['Собери идеальные букеты.', 'Make perfect bouquets.'], { hero: '💐' }, { cap: 3, time: 30 });

  // ===== Флаппи (8) =====
  G('flappy', 'flappy-sparrow', ['Летучий воробей', 'Flappy Sparrow'], 'birds', 'sky', ['Маши крыльями и пролетай между трубами.', 'Flap through the pipes.'], { hero: '🐦', enemy: '🌵', item: '🌾' });
  G('flappy', 'rocket-hop', ['Ракета-попрыгун', 'Rocket Hop'], 'space', 'space', ['Ракета скачет между астероидами.', 'Hop your rocket between asteroids.'], { hero: '🚀', enemy: '☄️', item: '⭐' }, { gravity: 1200 });
  G('flappy', 'castle-ghost', ['Призрак в замке', 'Castle Ghost'], 'halloween', 'pumpkin', ['Призрак летит по жуткому замку.', 'A ghost flies through a spooky castle.'], { hero: '👻', enemy: '🕯️', item: '🍬' });
  G('flappy', 'dragon-flight', ['Полёт дракона', 'Dragon Flight'], 'fantasy', 'royal', ['Дракончик учится летать.', 'A baby dragon learns to fly.'], { hero: '🐲', enemy: '🏰', item: '💎' }, { speed: 190 });
  G('flappy', 'busy-bee', ['Пчела Жужа', 'Busy Bee'], 'bugs', 'mint', ['Пчёлка собирает нектар.', 'A bee gathers nectar.'], { hero: '🐝', enemy: '🌻', item: '🍯' }, { gap: 185 });
  G('flappy', 'flying-fish', ['Летучая рыба', 'Flying Fish'], 'sea', 'ocean', ['Рыбка выпрыгивает над волнами.', 'A fish leaps over waves.'], { hero: '🐟', enemy: '🪸', item: '🫧' });
  G('flappy', 'santa-sleigh', ['Сани Деда Мороза', "Santa's Sleigh"], 'winter', 'ice', ['Развези подарки до Нового года!', 'Deliver gifts before New Year!'], { hero: '🛷', enemy: '🎄', item: '🎁' });
  G('flappy', 'flying-doge', ['Летающий Доге', 'Flying Doge'], 'memes', 'grape', ['Мемный пёс покоряет небо.', 'A meme dog conquers the sky.'], { hero: '🐕', enemy: '🗿', item: '🍌' }, { speed: 185 });

  // ===== Арканоиды (7) =====
  G('breakout', 'fruit-breaker', ['Фруктовый арканоид', 'Fruit Breaker'], 'fruits', 'lime', ['Разбивай фруктовые блоки.', 'Smash fruity blocks.'], { hero: '🥥', item: '🍒' });
  G('breakout', 'space-breaker', ['Космический арканоид', 'Space Breaker'], 'space', 'space', ['Разрушай вражеские станции.', 'Destroy enemy stations.'], { hero: '🌕', item: '⭐' }, { pattern: 'holes' });
  G('breakout', 'candy-breaker', ['Конфетный арканоид', 'Candy Breaker'], 'candy', 'candy', ['Сладкие блоки ждут удара.', 'Sweet blocks await.'], { hero: '🍬', item: '🍭' }, { cols: 6 });
  G('breakout', 'monster-smash', ['Монстробой', 'Monster Smash'], 'monsters', 'blood', ['Выбей монстров из подземелья.', 'Knock monsters out of the dungeon.'], { hero: '💀', item: '🪙' }, { speed: 390 });
  G('breakout', 'sport-breaker', ['Спортарканоид', 'Sport Breaker'], 'sport', 'sky', ['Мяч разбивает всё на пути к кубку.', 'The ball smashes its way to the cup.'], { hero: '⚽', item: '🏅' });
  G('breakout', 'treasure-breaker', ['Арканоид сокровищ', 'Treasure Breaker'], 'jewels', 'gold', ['Выбивай драгоценности из стен.', 'Knock jewels out of the walls.'], { hero: '🪙', item: '💎' }, { pattern: 'holes', cols: 8 });
  G('breakout', 'robo-breaker', ['Робоарканоид', 'Robo Breaker'], 'robots', 'steel', ['Ломай киберармию одним шаром.', 'Break the cyber army with one ball.'], { hero: '⚙️', item: '🔋' });

  // ===== Оборона (8) — мидкор: волны, боссы, прокачка пушки =====
  G('defense', 'zombie-defense', ['Оборона от зомби', 'Zombie Defense'], 'zombie', 'toxic', ['Не пусти орду к убежищу!', "Don't let the horde reach the shelter!"], { hero: '🔫', enemies: ['🧟', '🧟‍♀️', '🧟‍♂️', '🧠'], boss: '☣️', base: '🏚️' });
  G('defense', 'alien-invasion', ['Вторжение пришельцев', 'Alien Invasion'], 'space', 'space', ['Защити Землю от НЛО.', 'Defend Earth from UFOs.'], { hero: '🛰️', enemies: ['👾', '👽', '🛸', '🌑'], boss: '🪐', base: '🌍' });
  G('defense', 'kingdom-defense', ['Защита королевства', 'Kingdom Defense'], 'knights', 'royal', ['Держи стены замка до последнего.', 'Hold the castle walls to the end.'], { hero: '🏹', enemies: ['🐺', '👹', '🧌', '🐲'], boss: '🐉', base: '🏰' });
  G('defense', 'monster-hunter', ['Охотник на монстров', 'Monster Hunter'], 'monsters', 'blood', ['Монстры лезут из тьмы — тапай!', 'Monsters crawl from the dark — tap!'], { hero: '🗡️', enemies: ['👻', '🦇', '🕷️', '🧛'], boss: '👿', base: '⛪' });
  G('defense', 'fort-defense', ['Защита форта', 'Fort Defense'], 'pirates', 'ocean', ['Пираты штурмуют форт!', 'Pirates storm the fort!'], { hero: '💣', enemies: ['🏴‍☠️', '⛵', '🦜', '🐙'], boss: '🦑', base: '🏯' });
  G('defense', 'bug-swarm', ['Нашествие жуков', 'Bug Swarm'], 'bugs', 'mint', ['Спаси огород от насекомых.', 'Save the garden from bugs.'], { hero: '🧴', enemies: ['🐜', '🪳', '🦗', '🕷️'], boss: '🦂', base: '🌻' });
  G('defense', 'spooky-night', ['Ночь нечисти', 'Spooky Night'], 'halloween', 'pumpkin', ['Отбивайся от нечисти до рассвета.', 'Fend off evil until dawn.'], { hero: '🕯️', enemies: ['🎃', '👻', '🦇', '🧙‍♀️'], boss: '💀', base: '🏚️' });
  G('defense', 'machine-uprising', ['Восстание машин', 'Machine Uprising'], 'robots', 'steel', ['Роботы вышли из-под контроля!', 'Robots went rogue!'], { hero: '🧲', enemies: ['🤖', '🛰️', '🦾', '💻'], boss: '🦿', base: '🏢' });

  // ===== Мемори (7) — детская и семейная аудитория =====
  G('memory', 'memory-animals', ['Мемори: Зверята', 'Memory: Animals'], 'animals', 'forest', ['Найди пары зверят.', 'Find the animal pairs.'], { hero: '🦁' });
  G('memory', 'memory-cats', ['Мемори: Котики', 'Memory: Cats'], 'cats', 'pastel', ['Запомни всех котиков.', 'Remember every kitty.'], { hero: '😸' });
  G('memory', 'memory-space', ['Мемори: Космос', 'Memory: Space'], 'space', 'space', ['Космическая тренировка памяти.', 'Cosmic memory training.'], { hero: '👨‍🚀' });
  G('memory', 'memory-food', ['Мемори: Вкусняшки', 'Memory: Treats'], 'food', 'sunset', ['Найди пары вкусностей.', 'Find pairs of treats.'], { hero: '🍰' });
  G('memory', 'memory-music', ['Мемори: Музыка', 'Memory: Music'], 'music', 'grape', ['Музыкальная память.', 'Musical memory.'], { hero: '🎧' });
  G('memory', 'memory-flowers', ['Мемори: Цветы', 'Memory: Flowers'], 'flowers', 'pastel', ['Цветочные пары.', 'Flower pairs.'], { hero: '🌸' }, { time: 35 });
  G('memory', 'memory-sport', ['Мемори: Спорт', 'Memory: Sport'], 'sport', 'sky', ['Спортивная тренировка памяти.', 'Sporty memory training.'], { hero: '🏆' });

  // Значения по умолчанию: игровые плитки берутся из коллекции — игрок видит предметы, которые может собрать.
  const SETS = (typeof window !== 'undefined' ? window : global).YG_SETS;
  list.forEach((g) => {
    const em = SETS[g.set].items.map((s) => s.split('|')[0]);
    const sp = g.sp;
    if (!sp.tiles) sp.tiles = g.genre === 'match3' ? em.slice(0, 6) : em.slice(0, g.genre === 'sort' ? 10 : 16);
    if (!sp.tiers) sp.tiers = g.genre === 'merge' ? [0, 2, 4, 6, 8, 10, 12, 13, 14, 15].map((i) => em[i]) : em;
    if (!sp.foods) sp.foods = em.slice(0, 8);
    if (!sp.power) sp.power = { clicker: '👆', merge: '🍀', match3: '👣', runner: '🧲', stack: '🎯', snake: '🐢', g2048: '🚀', sort: '⏱️', flappy: '↕️', breakout: '↔️', defense: '🔫', memory: '👀' }[g.genre];
  });

  (typeof window !== 'undefined' ? window : global).YG_GAMES = list;
})();
