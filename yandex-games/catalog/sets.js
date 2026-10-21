// Наборы коллекционных предметов. В каждом 16 предметов:
// 0–7 обычные, 8–11 редкие, 12–14 эпические, 15 легендарный.
// Альбом 1: обычные 0–3, редкие 8–9, эпические 12–13. Альбом 2: всё остальное, включая легендарку.
window.YG_SETS = {
  animals: { albums: ['Лесные жители|Forest Folk', 'Короли саванны|Savanna Kings'], items: [
    '🐶|Пёс|Dog', '🐱|Кот|Cat', '🐭|Мышь|Mouse', '🐰|Кролик|Bunny', '🦊|Лис|Fox', '🐻|Медведь|Bear', '🐼|Панда|Panda', '🐨|Коала|Koala',
    '🦝|Енот|Raccoon', '🦔|Ёж|Hedgehog', '🦓|Зебра|Zebra', '🦒|Жираф|Giraffe',
    '🐯|Тигр|Tiger', '🦄|Единорог|Unicorn', '🐘|Слон|Elephant', '🦁|Король Лев|Lion King'] },
  space: { albums: ['Ближний космос|Near Space', 'Глубокий космос|Deep Space'], items: [
    '🌑|Луна|Moon', '⭐|Звезда|Star', '☄️|Комета|Comet', '🛰️|Спутник|Satellite', '🌍|Земля|Earth', '🪐|Сатурн|Saturn', '🌞|Солнце|Sun', '🌠|Метеор|Meteor',
    '🚀|Ракета|Rocket', '👨‍🚀|Космонавт|Astronaut', '🔭|Телескоп|Telescope', '🌌|Галактика|Galaxy',
    '👽|Пришелец|Alien', '🛸|НЛО|UFO', '🌀|Чёрная дыра|Black Hole', '👾|Император галактики|Galaxy Emperor'] },
  food: { albums: ['Фастфуд|Fast Food', 'Высокая кухня|Haute Cuisine'], items: [
    '🍔|Бургер|Burger', '🍟|Картошка|Fries', '🌭|Хот-дог|Hot Dog', '🍕|Пицца|Pizza', '🥪|Сэндвич|Sandwich', '🌮|Тако|Taco', '🥞|Блины|Pancakes', '🍳|Яичница|Eggs',
    '🍣|Суши|Sushi', '🍜|Рамен|Ramen', '🥩|Стейк|Steak', '🦞|Лобстер|Lobster',
    '🍰|Торт|Cake', '🧁|Капкейк|Cupcake', '🍾|Шампанское|Champagne', '👑|Королевский пир|Royal Feast'] },
  fantasy: { albums: ['Волшебный лес|Enchanted Woods', 'Царство драконов|Dragon Realm'], items: [
    '🧚|Фея|Fairy', '🍄|Гриб|Mushroom', '🌙|Месяц|Crescent', '🔮|Шар|Orb', '📜|Свиток|Scroll', '🧪|Зелье|Potion', '🪄|Палочка|Wand', '🗝️|Ключ|Key',
    '🧙|Маг|Wizard', '🧝|Эльф|Elf', '🧜|Русалка|Mermaid', '🧞|Джинн|Genie',
    '🐲|Дракончик|Drakeling', '🦅|Грифон|Griffin', '🏰|Замок|Castle', '🐉|Древний дракон|Elder Dragon'] },
  sea: { albums: ['Риф|Reef', 'Бездна|The Abyss'], items: [
    '🐟|Рыбка|Fish', '🐠|Клоун|Clownfish', '🐡|Фугу|Puffer', '🦀|Краб|Crab', '🦐|Креветка|Shrimp', '🐚|Ракушка|Shell', '🪸|Коралл|Coral', '🐌|Улитка|Snail',
    '🐙|Осьминог|Octopus', '🦑|Кальмар|Squid', '🐢|Черепаха|Turtle', '🦭|Тюлень|Seal',
    '🐬|Дельфин|Dolphin', '🦈|Акула|Shark', '🐋|Кит|Whale', '🔱|Трезубец Посейдона|Poseidon Trident'] },
  cars: { albums: ['Город|City', 'Трек|Track'], items: [
    '🚗|Седан|Sedan', '🚕|Такси|Taxi', '🚙|Джип|SUV', '🚌|Автобус|Bus', '🚐|Минивэн|Van', '🛻|Пикап|Pickup', '🚚|Грузовик|Truck', '🛵|Мопед|Scooter',
    '🚓|Полиция|Police', '🚑|Скорая|Ambulance', '🚒|Пожарная|Fire Truck', '🏍️|Байк|Motorbike',
    '🏎️|Болид|Racer', '🚀|Ракетокар|Rocket Car', '🚁|Вертолёт|Helicopter', '🏆|Золотой суперкар|Golden Supercar'] },
  dinos: { albums: ['Травоядные|Herbivores', 'Хищники|Predators'], items: [
    '🥚|Яйцо|Egg', '🦎|Ящер|Lizard', '🐊|Крокодил|Croc', '🐢|Протоцератопс|Protoceratops', '🌿|Папоротник|Fern', '🌋|Вулкан|Volcano', '🦴|Кость|Bone', '🪨|Окаменелость|Fossil',
    '🦕|Диплодок|Diplodocus', '🦤|Додо|Dodo', '🐍|Титанобоа|Titanoboa', '🦣|Мамонт|Mammoth',
    '🦖|Раптор|Raptor', '🐲|Птеродактиль|Pterodactyl', '☄️|Метеорит|Meteorite', '👑|Тираннозавр Рекс|T-Rex King'] },
  candy: { albums: ['Сладости|Sweets', 'Кондитерская|Bakery'], items: [
    '🍬|Конфета|Candy', '🍭|Леденец|Lollipop', '🍫|Шоколад|Chocolate', '🍩|Пончик|Donut', '🍪|Печенье|Cookie', '🧃|Сок|Juice', '🍮|Пудинг|Pudding', '🍯|Мёд|Honey',
    '🍦|Мороженое|Ice Cream', '🥧|Пирог|Pie', '🧇|Вафля|Waffle', '🥨|Крендель|Pretzel',
    '🎂|Торт|Birthday Cake', '🍡|Данго|Dango', '🧁|Кекс|Muffin', '🏰|Пряничный замок|Gingerbread Castle'] },
  monsters: { albums: ['Милые монстры|Cute Monsters', 'Жуткие монстры|Scary Monsters'], items: [
    '👻|Призрак|Ghost', '👹|Óни|Oni', '👺|Тэнгу|Tengu', '🤡|Клоун|Clown', '👾|Пиксель|Pixel', '💀|Череп|Skull', '🎃|Тыквоголов|Pumpkinhead', '🦇|Нетопырь|Bat',
    '🧟|Зомби|Zombie', '🧛|Вампир|Vampire', '🕷️|Паук|Spider', '🐺|Оборотень|Werewolf',
    '😈|Бесёнок|Imp', '🐙|Ктулху|Cthulhu', '🦑|Кракен|Kraken', '👿|Повелитель тьмы|Dark Lord'] },
  robots: { albums: ['Мастерская|Workshop', 'Киберармия|Cyber Army'], items: [
    '🔩|Болт|Bolt', '⚙️|Шестерня|Gear', '🔋|Батарея|Battery', '💡|Лампа|Bulb', '🔌|Вилка|Plug', '🧲|Магнит|Magnet', '💾|Дискета|Floppy', '🖲️|Трекбол|Trackball',
    '🤖|Робот|Robot', '🦾|Манипулятор|Arm', '📡|Антенна|Antenna', '💻|Компьютер|Computer',
    '🛰️|Дрон|Drone', '🧠|ИИ-ядро|AI Core', '⚡|Реактор|Reactor', '🦿|Мегатитан|Megatitan'] },
  fruits: { albums: ['Сад|Orchard', 'Тропики|Tropics'], items: [
    '🍎|Яблоко|Apple', '🍐|Груша|Pear', '🍒|Вишня|Cherry', '🍓|Клубника|Strawberry', '🍇|Виноград|Grapes', '🍋|Лимон|Lemon', '🍊|Мандарин|Tangerine', '🫐|Черника|Blueberry',
    '🍌|Банан|Banana', '🍉|Арбуз|Watermelon', '🍑|Персик|Peach', '🥝|Киви|Kiwi',
    '🍍|Ананас|Pineapple', '🥭|Манго|Mango', '🥥|Кокос|Coconut', '🌈|Радужный фрукт|Rainbow Fruit'] },
  jewels: { albums: ['Самоцветы|Gemstones', 'Сокровищница|Treasury'], items: [
    '🔴|Рубин|Ruby', '🔵|Сапфир|Sapphire', '🟢|Изумруд|Emerald', '🟡|Топаз|Topaz', '🟣|Аметист|Amethyst', '🟠|Янтарь|Amber', '⚪|Жемчуг|Pearl', '🟤|Агат|Agate',
    '💍|Кольцо|Ring', '📿|Чётки|Beads', '🪙|Монета|Coin', '🏺|Амфора|Amphora',
    '💎|Бриллиант|Diamond', '👑|Корона|Crown', '🔱|Скипетр|Scepter', '🌟|Сердце звезды|Star Heart'] },
  ninja: { albums: ['Додзё|Dojo', 'Клан теней|Shadow Clan'], items: [
    '🥋|Кимоно|Gi', '🎋|Бамбук|Bamboo', '🍙|Онигири|Onigiri', '🏮|Фонарь|Lantern', '🎐|Колокольчик|Wind Chime', '🪭|Веер|Fan', '🍵|Чай|Tea', '⛩️|Тории|Torii',
    '🥷|Ниндзя|Ninja', '🗡️|Кинжал|Dagger', '🏯|Крепость|Fortress', '🐉|Дух дракона|Dragon Spirit',
    '⚔️|Катаны|Katanas', '🌸|Сакура|Sakura', '🌊|Великая волна|Great Wave', '👺|Сёгун теней|Shadow Shogun'] },
  pirates: { albums: ['Порт|Harbor', 'Открытое море|High Seas'], items: [
    '⚓|Якорь|Anchor', '🧭|Компас|Compass', '🗺️|Карта|Map', '🦜|Попугай|Parrot', '🍺|Кружка|Mug', '🪝|Крюк|Hook', '🛶|Лодка|Boat', '🏝️|Остров|Island',
    '🏴‍☠️|Флаг|Jolly Roger', '💣|Ядро|Cannonball', '🔭|Подзорка|Spyglass', '🪙|Дублон|Doubloon',
    '⛵|Бриг|Brig', '🐙|Морское чудище|Sea Beast', '💰|Сундук|Treasure', '☠️|Капитан Флинт|Captain Flint'] },
  zombie: { albums: ['Выживание|Survival', 'Апокалипсис|Apocalypse'], items: [
    '🔦|Фонарик|Flashlight', '🥫|Консервы|Canned Food', '🪓|Топор|Axe', '🧰|Ящик|Toolbox', '🩹|Пластырь|Bandage', '🧯|Огнетушитель|Extinguisher', '📻|Радио|Radio', '🚧|Баррикада|Barricade',
    '🧟|Зомби|Zombie', '🧟‍♀️|Зомбиха|Zombie Girl', '🪖|Каска|Helmet', '🛡️|Щит|Shield',
    '💉|Вакцина|Vaccine', '🚁|Эвакуация|Evac', '☣️|Биоугроза|Biohazard', '🧠|Альфа-зомби|Alpha Zombie'] },
  farm: { albums: ['Огород|Garden', 'Скотный двор|Barnyard'], items: [
    '🥕|Морковь|Carrot', '🌽|Кукуруза|Corn', '🥔|Картофель|Potato', '🍅|Томат|Tomato', '🥒|Огурец|Cucumber', '🌾|Пшеница|Wheat', '🥬|Капуста|Cabbage', '🎃|Тыква|Pumpkin',
    '🐔|Курица|Chicken', '🐷|Свинка|Pig', '🐮|Корова|Cow', '🐑|Овечка|Sheep',
    '🐴|Лошадь|Horse', '🚜|Трактор|Tractor', '🏡|Усадьба|Farmhouse', '🦄|Золотой пони|Golden Pony'] },
  sport: { albums: ['Мяч|Ball Games', 'Чемпионат|Championship'], items: [
    '⚽|Футбол|Soccer', '🏀|Баскетбол|Basketball', '🏐|Волейбол|Volleyball', '🎾|Теннис|Tennis', '⚾|Бейсбол|Baseball', '🏉|Регби|Rugby', '🏓|Пинг-понг|Ping Pong', '🏸|Бадминтон|Badminton',
    '🥊|Перчатки|Gloves', '⛸️|Коньки|Skates', '🏒|Клюшка|Stick', '🛹|Скейт|Skateboard',
    '🥇|Золото|Gold Medal', '🏅|Орден|Medal', '🎖️|Знак отличия|Honor', '🏆|Кубок мира|World Cup'] },
  music: { albums: ['Репетиция|Rehearsal', 'Мировой тур|World Tour'], items: [
    '🎵|Нота|Note', '🎶|Мелодия|Melody', '🥁|Барабан|Drum', '🪘|Бонго|Bongo', '🎺|Труба|Trumpet', '🎷|Саксофон|Sax', '🪗|Аккордеон|Accordion', '🪈|Флейта|Flute',
    '🎸|Гитара|Guitar', '🎹|Синтезатор|Synth', '🎻|Скрипка|Violin', '🎤|Микрофон|Mic',
    '🎧|Наушники|Headphones', '📀|Платина|Platinum', '🎙️|Студия|Studio', '🌟|Суперзвезда|Superstar'] },
  halloween: { albums: ['Ночь страха|Night of Fear', 'Проклятый особняк|Cursed Manor'], items: [
    '🍬|Конфета|Candy', '🕯️|Свеча|Candle', '🕸️|Паутина|Web', '🌕|Полнолуние|Full Moon', '🧹|Метла|Broom', '🐈‍⬛|Чёрный кот|Black Cat', '🪦|Надгробие|Tombstone', '🦉|Сова|Owl',
    '🎃|Джек|Jack', '👻|Полтергейст|Poltergeist', '🦇|Летучая мышь|Bat', '🕷️|Тарантул|Tarantula',
    '🧙‍♀️|Ведьма|Witch', '🧛|Граф|Count', '⚰️|Гроб|Coffin', '💀|Король мёртвых|Lich King'] },
  winter: { albums: ['Зимние забавы|Winter Fun', 'Новый год|New Year'], items: [
    '❄️|Снежинка|Snowflake', '⛄|Снеговик|Snowman', '🧤|Варежки|Mittens', '🧣|Шарф|Scarf', '🛷|Санки|Sled', '⛷️|Лыжник|Skier', '🏂|Сноуборд|Snowboard', '☕|Какао|Cocoa',
    '🎄|Ёлка|Tree', '🎁|Подарок|Gift', '🦌|Олень|Reindeer', '🔔|Колокол|Bell',
    '🎅|Дед Мороз|Santa', '🧊|Ледяной дворец|Ice Palace', '🎆|Салют|Fireworks', '🌟|Звезда Рождества|Christmas Star'] },
  memes: { albums: ['Мемная классика|Meme Classics', 'Абсурд-вселенная|Absurd Verse'], items: [
    '🗿|Моаи|Moai', '🐸|Лягух|Froggo', '🐕|Доге|Doggo', '😹|Хохочущий кот|LOL Cat', '🤌|Мамма-мия|Mamma Mia', '🦆|Утка-шпион|Spy Duck', '🥖|Багет-рыцарь|Baguette Knight', '🧃|Сок-бро|Juice Bro',
    '🦈|Акула в кедах|Sneaker Shark', '🐊|Крокобомбер|Crocobomber', '☕|Капучино-ниндзя|Cappuccino Ninja', '🌵|Кактус-слон|Cactus Elephant',
    '🍌|Банан-шимпанзини|Banana Chimp', '🐒|Обезьяна-самолёт|Monkey Plane', '🪵|Бревно-барабанщик|Drum Log', '👑|Король мемов|Meme King'] },
  cats: { albums: ['Домашние котики|House Cats', 'Котики-герои|Hero Cats'], items: [
    '🐱|Мурзик|Whiskers', '😺|Улыбака|Smiley', '😸|Хохотун|Giggles', '😻|Влюблёнка|Lovebug', '😼|Хитрюга|Sly', '😽|Чмоки|Kissy', '🙀|Паникёр|Panic', '😿|Плакса|Crybaby',
    '🐈|Охотник|Hunter', '🐈‍⬛|Чернушка|Shadow', '🦁|Львёнок|Cub', '🐯|Тигрик|Tigger',
    '😾|Ворчун|Grumpy', '🐆|Леопард|Leopard', '🧙|Кот-маг|Wizard Cat', '👑|Королевский кот|Royal Cat'] },
  bugs: { albums: ['Луг|Meadow', 'Джунгли|Jungle'], items: [
    '🐜|Муравей|Ant', '🐞|Божья коровка|Ladybug', '🐝|Пчела|Bee', '🐛|Гусеница|Caterpillar', '🦗|Кузнечик|Cricket', '🪲|Жук|Beetle', '🪳|Таракан|Roach', '🪰|Муха|Fly',
    '🦋|Бабочка|Butterfly', '🐌|Улитка|Snail', '🪱|Червяк|Worm', '🦟|Комар|Mosquito',
    '🕷️|Паук|Spider', '🦂|Скорпион|Scorpion', '🐸|Жаба|Toad', '👑|Королева улья|Hive Queen'] },
  flowers: { albums: ['Клумба|Flowerbed', 'Ботанический сад|Botanic Garden'], items: [
    '🌼|Ромашка|Daisy', '🌻|Подсолнух|Sunflower', '🌷|Тюльпан|Tulip', '🌱|Росток|Sprout', '🍀|Клевер|Clover', '🌿|Мята|Mint', '🍁|Клён|Maple', '🌵|Кактус|Cactus',
    '🌹|Роза|Rose', '🌺|Гибискус|Hibiscus', '🪷|Лотос|Lotus', '🪻|Гиацинт|Hyacinth',
    '🌸|Сакура|Sakura', '💐|Букет|Bouquet', '🌳|Древо|Great Tree', '🌈|Цветок радуги|Rainbow Bloom'] },
  knights: { albums: ['Оружейная|Armory', 'Королевство|Kingdom'], items: [
    '🗡️|Меч|Sword', '🛡️|Щит|Shield', '🏹|Лук|Bow', '🪓|Секира|Axe', '🐴|Конь|Steed', '🍖|Окорок|Ham', '🪖|Шлем|Helm', '🧱|Стена|Wall',
    '🤺|Фехтовальщик|Fencer', '🏰|Крепость|Keep', '⚔️|Дуэль|Duel', '🐲|Виверна|Wyvern',
    '🤴|Принц|Prince', '👸|Принцесса|Princess', '🧙‍♂️|Мерлин|Merlin', '👑|Король Артур|King Arthur'] },
  money: { albums: ['Стартап|Startup', 'Империя|Empire'], items: [
    '🪙|Монета|Coin', '💵|Доллар|Dollar', '💶|Евро|Euro', '💴|Иена|Yen', '🧾|Чек|Receipt', '💳|Карта|Card', '📈|График|Chart', '🏪|Ларёк|Shop',
    '🏦|Банк|Bank', '💼|Портфель|Briefcase', '🏢|Офис|Office', '🛥️|Яхта|Yacht',
    '💰|Мешок золота|Gold Sack', '🏝️|Свой остров|Private Island', '🛩️|Джет|Jet', '💎|Корпорация|Megacorp'] },
  birds: { albums: ['Двор|Backyard', 'Небеса|Skies'], items: [
    '🐦|Воробей|Sparrow', '🐤|Цыплёнок|Chick', '🐧|Пингвин|Penguin', '🦆|Утка|Duck', '🕊️|Голубь|Dove', '🐓|Петух|Rooster', '🦃|Индюк|Turkey', '🪿|Гусь|Goose',
    '🦉|Филин|Owl', '🦩|Фламинго|Flamingo', '🦜|Ара|Macaw', '🦢|Лебедь|Swan',
    '🦅|Орёл|Eagle', '🦚|Павлин|Peacock', '🔥|Феникс|Phoenix', '🌈|Райская птица|Bird of Paradise'] }
};
