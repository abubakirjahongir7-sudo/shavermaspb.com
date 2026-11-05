// Frontend'dagi src/data/menuItems.ts bilan bir xil bo'lishi kerak.
// TODO: kelajakda bitta manba (masalan baza jadvali yoki umumiy paket)ga ko'chirish kerak.
export const menuItems = [
  // Шаверма
  { id: "sh-spb-v-pite", category: "shaverma", name: "Шаверма в пите", price: 320 },
  { id: "sh-mazhor", category: "shaverma", name: "Шаверма Мажор", price: 480 },
  { id: "sh-sport", category: "shaverma", name: "Шаверма Спорт", price: 360 },
  { id: "sh-klassicheskaya", category: "shaverma", name: "Шаверма классическая", price: 320 },
  { id: "sh-s-gribami", category: "shaverma", name: "Шаверма с грибами", price: 370 },
  { id: "sh-zelen-syr", category: "shaverma", name: "Шаверма с зеленью и сыром", price: 340 },
  { id: "sh-na-tarelke", category: "shaverma", name: "Шаверма на тарелке", price: 450 },
  { id: "shg-v-pite", category: "shaverma", name: "Шаверма из говядины в пите", price: 390 },
  { id: "shg-na-tarelke", category: "shaverma", name: "Шаверма из говядины на тарелке", price: 550 },
  { id: "shg-zelen-syr", category: "shaverma", name: "Шаверма из говядины с зеленью и сыром", price: 420 },
  { id: "shg-govyadina-fri", category: "shaverma", name: "Шаверма с говядиной и фри", price: 450 },

  // Супы
  { id: "khrushchevskiy", category: "supy", name: "Хрущевский", price: 350 },
  { id: "lagman", category: "supy", name: "Лагман", price: 350 },
  { id: "pelmeni-domashnie", category: "supy", name: "Пельмени домашние", price: 350 },
  { id: "shurpa-govyadina", category: "supy", name: "Шурпа из говядины", price: 350 },
  { id: "shurpa-baranina", category: "supy", name: "Шурпа из баранины", price: 350 },
  { id: "borshch", category: "supy", name: "Борщ", price: 300 },

  // Горячие блюда
  { id: "kazan-kebab", category: "goryachee", name: "Казан кебаб из говядины", price: 550 },
  { id: "plov", category: "goryachee", name: "Плов из говядины", price: 400 },
  { id: "manty", category: "goryachee", name: "Манты с говядиной", price: 450 },
  { id: "pelmeni", category: "goryachee", name: "Пельмени", price: 340 },

  // Салаты
  { id: "tsezar-kuritsa", category: "salaty", name: "Цезарь с курицей", price: 350 },
  { id: "tsezar-krevetki", category: "salaty", name: "Цезарь с креветками", price: 370 },
  { id: "tsezar-semga", category: "salaty", name: "Цезарь с сёмгой", price: 370 },
  { id: "shakarob", category: "salaty", name: "Шакароб", price: 270 },

  // Пицца
  { id: "pitstsa-pepperoni", category: "pitstsa", name: "Пицца Пепперони 30 см", price: 599 },
  { id: "pitstsa-margarita", category: "pitstsa", name: "Пицца Маргарита 30 см", price: 599 },
  { id: "pitstsa-kuritsa-griby", category: "pitstsa", name: "Пицца Курица с грибами 30 см", price: 599 },

  // Роллы
  { id: "roll-filadelfiya-chiz", category: "rolly", name: "Филадельфия чиз", price: 720 },
  { id: "roll-filadelfiya-ugor", category: "rolly", name: "Филадельфия с угрем", price: 680 },
  { id: "roll-filadelfiya", category: "rolly", name: "Филадельфия", price: 690 },
  { id: "roll-zapechenniy-losos", category: "rolly", name: "Запеченный с лососем", price: 690 },

  // Сеты
  { id: "set-tempura-mini", category: "sety", name: "Сет Темпура мини", price: 1800 },
  { id: "set-dva-plyus-tri", category: "sety", name: "Сет Два плюс три", price: 2950 },
  { id: "set-zapechenniy-miks", category: "sety", name: "Сет Запеченный микс", price: 2800 },

  // Хот-доги
  { id: "hot-dog-datskiy", category: "hot-dogi", name: "Хот-дог Датский", price: 270 },
  { id: "hot-dog-frantsuzskiy", category: "hot-dogi", name: "Хот-дог Французский", price: 250 },

  // Закуски
  { id: "stripsy", category: "zakuski", name: "Стрипсы с соусом 6 шт", price: 380 },
  { id: "naggetsy", category: "zakuski", name: "Наггетсы с соусом 6 шт", price: 270 },
  { id: "syrnye-palochki", category: "zakuski", name: "Сырные палочки 6 шт", price: 250 },
  { id: "kartofel-po-derevenski", category: "zakuski", name: "Картофель по-деревенски", price: 190 },
  { id: "krevetki", category: "zakuski", name: "Креветки в панировке 6 шт", price: 380 },
  { id: "kartoshka-fri", category: "zakuski", name: "Картошка фри с соусом", price: 190 },

  // Напитки
  { id: "mogoh-abrikos", category: "napitki", name: "Могох Абрикосовый 0,5 л", price: 189 },
  { id: "mogoh-yabloko", category: "napitki", name: "Могох Яблочный 0,5 л", price: 189 },
  { id: "mogoh-persik", category: "napitki", name: "Могох Персиковый 0,5 л", price: 189 },
  { id: "crystal-grusha", category: "napitki", name: "Crystal Berry Груша 0,5 л", price: 179 },
  { id: "crystal-ananas", category: "napitki", name: "Crystal Berry Ананас 0,5 л", price: 179 },
  { id: "crystal-klubnika-banan", category: "napitki", name: "Crystal Berry Клубника-банан 0,5 л", price: 179 },
  { id: "flavis-granat", category: "napitki", name: "Flavis Гранат 0,5 л", price: 150 },
  { id: "rc-green-apple", category: "napitki", name: "RC Refresher Зелёное яблоко 1 л", price: 200 },
  { id: "rc-cola-1l", category: "napitki", name: "RC Cola 1 л", price: 200 },
  { id: "rc-cola-05l", category: "napitki", name: "RC Cola 0,5 л", price: 150 },

  // Горячие напитки
  { id: "zeleniy-chay", category: "goryachie-napitki", name: "Зелёный чай", price: 60 },
  { id: "cherniy-chay", category: "goryachie-napitki", name: "Чёрный чай", price: 60 },
  { id: "espresso", category: "goryachie-napitki", name: "Эспрессо", price: 80 },
  { id: "amerikano", category: "goryachie-napitki", name: "Американо", price: 120 },
  { id: "kapuchino", category: "goryachie-napitki", name: "Капучино", price: 160 },
  { id: "latte", category: "goryachie-napitki", name: "Латте", price: 160 },
  // Добавки
  { id: "sous-ketchup", category: "dobavki", name: "Соус кетчуп", price: 50 },
  { id: "sous-chesnochniy", category: "dobavki", name: "Соус чесночный", price: 50 },
  { id: "sous-syrniy", category: "dobavki", name: "Соус сырный", price: 50 },
  { id: "khalapeno", category: "dobavki", name: "Халапеньо", price: 50 },
  { id: "sous-adzhika", category: "dobavki", name: "Соус аджика", price: 50 },
  { id: "kartofel-fri-dobavka", category: "dobavki", name: "Картофель фри", price: 50 },
];

export function findMenuItem(id) {
  return menuItems.find((item) => item.id === id);
}
