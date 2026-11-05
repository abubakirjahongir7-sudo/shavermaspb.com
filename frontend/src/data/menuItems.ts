export type MenuCategory =
  | "shaverma"
  | "supy"
  | "goryachee"
  | "salaty"
  | "pitstsa"
  | "rolly"
  | "sety"
  | "hot-dogi"
  | "zakuski"
  | "napitki"
  | "goryachie-napitki"
  | "dobavki";

export interface CategoryInfo {
  id: MenuCategory;
  label: string;
  // "grid" — rasmli kartochkalar; "list" — rasmsiz, ixcham qator ko'rinishi.
  layout: "grid" | "list";
  // Tab tugmasi rangi: "orange" (standart) yoki "blue".
  accent?: "orange" | "blue";
}

// Menyu tartibi kafe menyusidagi bo'limlar bo'yicha. "dobavki" toifasi hozir
// bo'sh — kafe qo'shimchalar (sous, lavash...) bersa, shu yerga qo'shiladi va
// savatdagi "Добавки" tugmasi o'zi paydo bo'ladi.
export const categories: CategoryInfo[] = [
  { id: "shaverma", label: "Шаверма", layout: "grid" },
  { id: "supy", label: "Супы", layout: "grid" },
  { id: "goryachee", label: "Горячие блюда", layout: "grid" },
  { id: "salaty", label: "Салаты", layout: "grid" },
  { id: "pitstsa", label: "Пицца", layout: "grid" },
  { id: "rolly", label: "Роллы", layout: "grid" },
  { id: "sety", label: "Сеты", layout: "grid" },
  { id: "hot-dogi", label: "Хот-доги", layout: "grid" },
  { id: "zakuski", label: "Закуски", layout: "grid" },
  { id: "napitki", label: "Напитки", layout: "grid" },
  { id: "goryachie-napitki", label: "Горячие напитки", layout: "grid" },
];

export interface MenuItem {
  id: string;
  category: MenuCategory;
  name: string;
  description?: string;
  weight?: string;
  price: number;
  image?: string;
}

// Narxlar kafe menyusidan (PDF) olingan. Bir xil rasmli pozitsiyalar (masalan
// tovuqli shaverma turlari) — menyuda alohida fotosi yo'q, umumiy rasm ishlatiladi.
export const menuItems: MenuItem[] = [
  // Шаверма
  {
    id: "sh-spb-v-pite",
    category: "shaverma",
    name: "Шаверма в пите",
    description: "Из курицы",
    price: 320,
    image: "/images/menu/shaverma-v-pite.jpg",
  },
  {
    id: "sh-mazhor",
    category: "shaverma",
    name: "Шаверма Мажор",
    description: "Из курицы",
    price: 480,
    image: "/images/menu/shaverma-mazhor.jpg",
  },
  {
    id: "sh-sport",
    category: "shaverma",
    name: "Шаверма Спорт",
    description: "Из курицы",
    price: 360,
    image: "/images/menu/shaverma-sport.jpg",
  },
  {
    id: "sh-klassicheskaya",
    category: "shaverma",
    name: "Шаверма классическая",
    description: "Из курицы",
    price: 320,
    image: "/images/menu/shaverma-klassicheskaya.jpg",
  },
  {
    id: "sh-s-gribami",
    category: "shaverma",
    name: "Шаверма с грибами",
    description: "Из курицы",
    price: 370,
    image: "/images/menu/shaverma-s-gribami.jpg",
  },
  {
    id: "sh-zelen-syr",
    category: "shaverma",
    name: "Шаверма с зеленью и сыром",
    description: "Из курицы",
    price: 340,
    image: "/images/menu/shaverma-zelen-syr.jpg",
  },
  {
    id: "sh-na-tarelke",
    category: "shaverma",
    name: "Шаверма на тарелке",
    description: "Из курицы",
    price: 450,
    image: "/images/menu/shaverma-na-tarelke.jpg",
  },
  {
    id: "shg-v-pite",
    category: "shaverma",
    name: "Шаверма из говядины в пите",
    description: "Из говядины",
    price: 390,
    image: "/images/menu/shaverma-govyadina.jpg",
  },
  {
    id: "shg-na-tarelke",
    category: "shaverma",
    name: "Шаверма из говядины на тарелке",
    description: "Из говядины",
    price: 550,
    image: "/images/menu/shaverma-govyadina-na-tarelke.jpg",
  },
  {
    id: "shg-zelen-syr",
    category: "shaverma",
    name: "Шаверма из говядины с зеленью и сыром",
    description: "Из говядины",
    price: 420,
    image: "/images/menu/shaverma-govyadina-zelen-syr.jpg",
  },
  {
    id: "shg-govyadina-fri",
    category: "shaverma",
    name: "Шаверма с говядиной и фри",
    description: "Из говядины",
    price: 450,
    image: "/images/menu/shaverma-govyadina-fri.jpg",
  },

  // Супы
  {
    id: "khrushchevskiy",
    category: "supy",
    name: "Хрущевский",
    price: 350,
    image: "/images/menu/khrushchevskiy.jpg",
  },
  {
    id: "lagman",
    category: "supy",
    name: "Лагман",
    price: 350,
    image: "/images/menu/lagman.jpg",
  },
  {
    id: "pelmeni-domashnie",
    category: "supy",
    name: "Пельмени домашние",
    description: "Суп с домашними пельменями",
    price: 350,
    image: "/images/menu/pelmeni-domashnie.jpg",
  },
  {
    id: "shurpa-govyadina",
    category: "supy",
    name: "Шурпа из говядины",
    price: 350,
    image: "/images/menu/shurpa-govyadina.jpg",
  },
  {
    id: "shurpa-baranina",
    category: "supy",
    name: "Шурпа из баранины",
    price: 350,
    image: "/images/menu/shurpa-baranina.jpg",
  },
  {
    id: "borshch",
    category: "supy",
    name: "Борщ",
    price: 300,
    image: "/images/menu/borshch.jpg",
  },

  // Горячие блюда
  {
    id: "kazan-kebab",
    category: "goryachee",
    name: "Казан кебаб из говядины",
    price: 550,
    image: "/images/menu/kazan-kebab.jpg",
  },
  {
    id: "plov",
    category: "goryachee",
    name: "Плов из говядины",
    price: 400,
    image: "/images/menu/plov.jpg",
  },
  {
    id: "manty",
    category: "goryachee",
    name: "Манты с говядиной",
    price: 450,
    image: "/images/menu/manty.jpg",
  },
  {
    id: "pelmeni",
    category: "goryachee",
    name: "Пельмени",
    price: 340,
    image: "/images/menu/pelmeni.jpg",
  },

  // Салаты
  {
    id: "tsezar-kuritsa",
    category: "salaty",
    name: "Цезарь с курицей",
    price: 350,
    image: "/images/menu/tsezar-kuritsa.jpg",
  },
  {
    id: "tsezar-krevetki",
    category: "salaty",
    name: "Цезарь с креветками",
    price: 370,
    image: "/images/menu/tsezar-krevetki.jpg",
  },
  {
    id: "tsezar-semga",
    category: "salaty",
    name: "Цезарь с сёмгой",
    price: 370,
    image: "/images/menu/tsezar-semga.jpg",
  },
  {
    id: "shakarob",
    category: "salaty",
    name: "Шакароб",
    price: 270,
    image: "/images/menu/shakarob.jpg",
  },

  // Пицца
  {
    id: "pitstsa-pepperoni",
    category: "pitstsa",
    name: "Пицца Пепперони",
    weight: "30 см",
    price: 599,
    image: "/images/menu/pitstsa-pepperoni.jpg",
  },
  {
    id: "pitstsa-margarita",
    category: "pitstsa",
    name: "Пицца Маргарита",
    weight: "30 см",
    price: 599,
    image: "/images/menu/pitstsa-margarita.jpg",
  },
  {
    id: "pitstsa-kuritsa-griby",
    category: "pitstsa",
    name: "Пицца Курица с грибами",
    weight: "30 см",
    price: 599,
    image: "/images/menu/pitstsa-kuritsa-griby.jpg",
  },

  // Роллы
  {
    id: "roll-filadelfiya-chiz",
    category: "rolly",
    name: "Филадельфия чиз",
    price: 720,
    image: "/images/menu/roll-filadelfiya-chiz.jpg",
  },
  {
    id: "roll-filadelfiya-ugor",
    category: "rolly",
    name: "Филадельфия с угрем",
    price: 680,
    image: "/images/menu/roll-filadelfiya-ugor.jpg",
  },
  {
    id: "roll-filadelfiya",
    category: "rolly",
    name: "Филадельфия",
    price: 690,
    image: "/images/menu/roll-filadelfiya.jpg",
  },
  {
    id: "roll-zapechenniy-losos",
    category: "rolly",
    name: "Запеченный с лососем",
    price: 690,
    image: "/images/menu/roll-zapechenniy-losos.jpg",
  },

  // Сеты
  {
    id: "set-tempura-mini",
    category: "sety",
    name: "Сет Темпура мини",
    price: 1800,
    image: "/images/menu/set-tempura-mini.jpg",
  },
  {
    id: "set-dva-plyus-tri",
    category: "sety",
    name: "Сет Два плюс три",
    price: 2950,
    image: "/images/menu/set-dva-plyus-tri.jpg",
  },
  {
    id: "set-zapechenniy-miks",
    category: "sety",
    name: "Сет Запеченный микс",
    price: 2800,
    image: "/images/menu/set-zapechenniy-miks.jpg",
  },

  // Хот-доги
  {
    id: "hot-dog-datskiy",
    category: "hot-dogi",
    name: "Хот-дог Датский",
    price: 270,
    image: "/images/menu/hot-dog-datskiy.jpg",
  },
  {
    id: "hot-dog-frantsuzskiy",
    category: "hot-dogi",
    name: "Хот-дог Французский",
    price: 250,
    image: "/images/menu/hot-dog-frantsuzskiy.jpg",
  },

  // Закуски
  {
    id: "stripsy",
    category: "zakuski",
    name: "Стрипсы с соусом",
    weight: "6 шт",
    price: 380,
    image: "/images/menu/stripsy.jpg",
  },
  {
    id: "naggetsy",
    category: "zakuski",
    name: "Наггетсы с соусом",
    weight: "6 шт",
    price: 270,
    image: "/images/menu/naggetsy.jpg",
  },
  {
    id: "syrnye-palochki",
    category: "zakuski",
    name: "Сырные палочки",
    weight: "6 шт",
    price: 250,
    image: "/images/menu/syrnye-palochki.jpg",
  },
  {
    id: "kartofel-po-derevenski",
    category: "zakuski",
    name: "Картофель по-деревенски",
    price: 190,
    image: "/images/menu/kartofel-po-derevenski.jpg",
  },
  {
    id: "krevetki",
    category: "zakuski",
    name: "Креветки в панировке",
    weight: "6 шт",
    price: 380,
    image: "/images/menu/krevetki.jpg",
  },
  {
    id: "kartoshka-fri",
    category: "zakuski",
    name: "Картошка фри с соусом",
    price: 190,
    image: "/images/menu/kartoshka-fri.jpg",
  },

  // Напитки
  {
    id: "mogoh-abrikos",
    category: "napitki",
    name: "Могох Абрикосовый",
    weight: "0,5 л",
    price: 189,
    image: "/images/menu/mogoh-abrikos.jpg",
  },
  {
    id: "mogoh-yabloko",
    category: "napitki",
    name: "Могох Яблочный",
    weight: "0,5 л",
    price: 189,
    image: "/images/menu/mogoh-yabloko.jpg",
  },
  {
    id: "mogoh-persik",
    category: "napitki",
    name: "Могох Персиковый",
    weight: "0,5 л",
    price: 189,
    image: "/images/menu/mogoh-persik.jpg",
  },
  {
    id: "crystal-grusha",
    category: "napitki",
    name: "Crystal Berry Груша",
    weight: "0,5 л",
    price: 179,
    image: "/images/menu/crystal-grusha.jpg",
  },
  {
    id: "crystal-ananas",
    category: "napitki",
    name: "Crystal Berry Ананас",
    weight: "0,5 л",
    price: 179,
    image: "/images/menu/crystal-ananas.jpg",
  },
  {
    id: "crystal-klubnika-banan",
    category: "napitki",
    name: "Crystal Berry Клубника-банан",
    weight: "0,5 л",
    price: 179,
    image: "/images/menu/crystal-klubnika-banan.jpg",
  },
  {
    id: "flavis-granat",
    category: "napitki",
    name: "Flavis Гранат",
    weight: "0,5 л",
    price: 150,
    image: "/images/menu/flavis-granat.jpg",
  },
  {
    id: "rc-green-apple",
    category: "napitki",
    name: "RC Refresher Зелёное яблоко",
    weight: "1 л",
    price: 200,
    image: "/images/menu/rc-green-apple.jpg",
  },
  {
    id: "rc-cola-1l",
    category: "napitki",
    name: "RC Cola",
    weight: "1 л",
    price: 200,
    image: "/images/menu/rc-cola-1l.jpg",
  },
  {
    id: "rc-cola-05l",
    category: "napitki",
    name: "RC Cola",
    weight: "0,5 л",
    price: 150,
    image: "/images/menu/rc-cola-05l.jpg",
  },

  // Горячие напитки — rasmlari va narxlari kafening o'ziniki bilan almashtiriladi.
  {
    id: "zeleniy-chay",
    category: "goryachie-napitki",
    name: "Зелёный чай",
    weight: "200 мл",
    price: 60,
    image: "/images/menu/chay.jpg",
  },
  {
    id: "cherniy-chay",
    category: "goryachie-napitki",
    name: "Чёрный чай",
    weight: "200 мл",
    price: 60,
    image: "/images/menu/chay.jpg",
  },
  {
    id: "espresso",
    category: "goryachie-napitki",
    name: "Эспрессо",
    weight: "50 мл",
    price: 80,
    image: "/images/menu/espresso.jpg",
  },
  {
    id: "amerikano",
    category: "goryachie-napitki",
    name: "Американо",
    weight: "200 мл",
    price: 120,
    image: "/images/menu/amerikano.jpg",
  },
  {
    id: "kapuchino",
    category: "goryachie-napitki",
    name: "Капучино",
    weight: "200 мл",
    price: 160,
    image: "/images/menu/kapuchino.jpg",
  },
  {
    id: "latte",
    category: "goryachie-napitki",
    name: "Латте",
    weight: "200 мл",
    price: 160,
    image: "/images/menu/latte.jpg",
  },
  // Добавки — savatdagi "Добавки" tugmasi orqali qo'shiladi.
  {
    id: "sous-ketchup",
    category: "dobavki",
    name: "Соус кетчуп",
    price: 50,
  },
  {
    id: "sous-chesnochniy",
    category: "dobavki",
    name: "Соус чесночный",
    price: 50,
  },
  {
    id: "sous-syrniy",
    category: "dobavki",
    name: "Соус сырный",
    price: 50,
  },
  {
    id: "khalapeno",
    category: "dobavki",
    name: "Халапеньо",
    price: 50,
  },
  {
    id: "sous-adzhika",
    category: "dobavki",
    name: "Соус аджика",
    price: 50,
  },
  {
    id: "kartofel-fri-dobavka",
    category: "dobavki",
    name: "Картофель фри",
    price: 50,
  },
];
