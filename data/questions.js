// ==========================================
//  ФАЙЛ ТЕМ И ПОДТЕМ (ОГЭ ГЕОГРАФИЯ)
// ==========================================

var QUESTIONS_FILES = [
  // Раздел 1: Топографические карты
  { title: "Что такое топографические карты", key: "topo_01", questions: "data/questions_topo_01.json" },
  { title: "Масштаб", key: "topo_02", questions: "data/questions_topo_02.json" },
  { title: "Условные знаки", key: "topo_03", questions: "data/questions_topo_03.json" },
  { title: "Рельеф", key: "topo_04", questions: "data/questions_topo_04.json" },
  { title: "Азимут и стороны горизонта", key: "topo_05", questions: "data/questions_topo_05.json" },
  { title: "Географические координаты", key: "topo_06", questions: "data/questions_topo_06.json" },
  { title: "Построение маршрута", key: "topo_07", questions: "data/questions_topo_07.json" },
  { title: "Комплексные задания (топо)", key: "topo_08", questions: "data/questions_topo_08.json" },

  // Раздел 2: Градусная сеть и географические координаты
  { title: "Параллели и меридианы", key: "grid_01", questions: "data/questions_grid_01.json" },
  { title: "Экватор и нулевой меридиан", key: "grid_02", questions: "data/questions_grid_02.json" },
  { title: "Градусная сеть", key: "grid_03", questions: "data/questions_grid_03.json" },
  { title: "Географическая широта", key: "grid_04", questions: "data/questions_grid_04.json" },
  { title: "Географическая долгота", key: "grid_05", questions: "data/questions_grid_05.json" },
  { title: "Определение координат точки", key: "grid_06", questions: "data/questions_grid_06.json" },
  { title: "Поиск объекта по координатам", key: "grid_07", questions: "data/questions_grid_07.json" },
  { title: "Комплексные задания (координаты)", key: "grid_08", questions: "data/questions_grid_08.json" },

  // Раздел 3: Земля как планета Солнечной системы
  { title: "Форма и размеры Земли", key: "earth_01", questions: "data/questions_earth_01.json" },
  { title: "Движение Земли вокруг оси", key: "earth_02", questions: "data/questions_earth_02.json" },
  { title: "Движение Земли вокруг Солнца", key: "earth_03", questions: "data/questions_earth_03.json" },
  { title: "Смена дня и ночи", key: "earth_04", questions: "data/questions_earth_04.json" },
  { title: "Смена времён года", key: "earth_05", questions: "data/questions_earth_05.json" },
  { title: "Часовые пояса", key: "earth_06", questions: "data/questions_earth_06.json" },
  { title: "Комплексные задания ОГЭ", key: "earth_07", questions: "data/questions_earth_07.json" },

  // Раздел 4: Литосфера и рельеф
  { title: "Внутреннее строение Земли", key: "lith_01", questions: "data/questions_lith_01.json" },
  { title: "Горные породы и полезные ископаемые", key: "lith_02", questions: "data/questions_lith_02.json" },
  { title: "Рельеф суши и дна океана", key: "lith_03", questions: "data/questions_lith_03.json" },
  { title: "Вулканы и землетрясения", key: "lith_04", questions: "data/questions_lith_04.json" },
  { title: "Равнины и горы", key: "lith_05", questions: "data/questions_lith_05.json" },
  { title: "Профили рельефа", key: "lith_06", questions: "data/questions_lith_06.json" },

  // Раздел 5: Атмосфера и климат (новый)
  { title: "Состав и свойства атмосферы", key: "atm_01", questions: "data/questions_atm_01.json" },
  { title: "Температура и давление", key: "atm_02", questions: "data/questions_atm_02.json" },
  { title: "Ветер", key: "atm_03", questions: "data/questions_atm_03.json" },
  { title: "Влажность и осадки", key: "atm_04", questions: "data/questions_atm_04.json" },
  { title: "Климатообразующие факторы", key: "atm_05", questions: "data/questions_atm_05.json" },
  { title: "Климатограммы и карты погоды", key: "atm_06", questions: "data/questions_atm_06.json" },
  { title: "Комплексные задания ОГЭ по атмосфере", key: "atm_07", questions: "data/questions_atm_07.json" },

  // Раздел 6: Гидросфера (новый)
  { title: "Мировой океан", key: "hydro_01", questions: "data/questions_hydro_01.json" },
  { title: "Моря, заливы, проливы", key: "hydro_02", questions: "data/questions_hydro_02.json" },
  { title: "Реки", key: "hydro_03", questions: "data/questions_hydro_03.json" },
  { title: "Озёра", key: "hydro_04", questions: "data/questions_hydro_04.json" },
  { title: "Ледники", key: "hydro_05", questions: "data/questions_hydro_05.json" },
  { title: "Подземные воды", key: "hydro_06", questions: "data/questions_hydro_06.json" },
  { title: "Речной режим и питание рек", key: "hydro_07", questions: "data/questions_hydro_07.json" },
  { title: "Комплексные задания ОГЭ по гидросфере", key: "hydro_08", questions: "data/questions_hydro_08.json" },

  // Раздел 7: Биосфера и почвы (новый)
  { title: "Почвообразование", key: "bio_01", questions: "data/questions_bio_01.json" },
  { title: "Типы почв", key: "bio_02", questions: "data/questions_bio_02.json" },
  { title: "Природные зоны", key: "bio_03", questions: "data/questions_bio_03.json" },
  { title: "Растительный и животный мир", key: "bio_04", questions: "data/questions_bio_04.json" },
  { title: "Приспособленность организмов", key: "bio_05", questions: "data/questions_bio_05.json" },
  { title: "Охрана природы", key: "bio_06", questions: "data/questions_bio_06.json" },
  { title: "Комплексные задания ОГЭ по биосфере и почвам", key: "bio_07", questions: "data/questions_bio_07.json" },

  // Будущие разделы (заглушки)
  { title: "Человечество на Земле", key: "mankind", comingSoon: true },
  { title: "Взаимодействие природы и общества", key: "nature_society", comingSoon: true },
  { title: "География России", key: "russia", comingSoon: true },
];

var THEORY_FILES = [
  // Раздел 1: Топографические карты
  {
    title: "Топографические карты",
    icon: "mapPin",
    subtopics: [
      { title: "Что такое топографические карты", icon: "mapPin", file: "theory_topo_01.json", key: "topo_01", questions: "data/questions_topo_01.json" },
      { title: "Масштаб", icon: "ruler", file: "theory_topo_02.json", key: "topo_02", questions: "data/questions_topo_02.json" },
      { title: "Условные знаки", icon: "book", file: "theory_topo_03.json", key: "topo_03", questions: "data/questions_topo_03.json" },
      { title: "Рельеф", icon: "mountain", file: "theory_topo_04.json", key: "topo_04", questions: "data/questions_topo_04.json" },
      { title: "Азимут и стороны горизонта", icon: "compass", file: "theory_topo_05.json", key: "topo_05", questions: "data/questions_topo_05.json" },
      { title: "Географические координаты", icon: "globe", file: "theory_topo_06.json", key: "topo_06", questions: "data/questions_topo_06.json" },
      { title: "Построение маршрута", icon: "mapPin", file: "theory_topo_07.json", key: "topo_07", questions: "data/questions_topo_07.json" },
      { title: "Комплексные задания", icon: "star", file: "theory_topo_08.json", key: "topo_08", questions: "data/questions_topo_08.json" },
    ]
  },

  // Раздел 2: Градусная сеть и географические координаты
  {
    title: "Градусная сеть и географические координаты",
    icon: "globe",
    subtopics: [
      { title: "Параллели и меридианы", icon: "globe", file: "theory_grid_01.json", key: "grid_01", questions: "data/questions_grid_01.json" },
      { title: "Экватор и нулевой меридиан", icon: "globe", file: "theory_grid_02.json", key: "grid_02", questions: "data/questions_grid_02.json" },
      { title: "Градусная сеть", icon: "globe", file: "theory_grid_03.json", key: "grid_03", questions: "data/questions_grid_03.json" },
      { title: "Географическая широта", icon: "ruler", file: "theory_grid_04.json", key: "grid_04", questions: "data/questions_grid_04.json" },
      { title: "Географическая долгота", icon: "compass", file: "theory_grid_05.json", key: "grid_05", questions: "data/questions_grid_05.json" },
      { title: "Определение координат точки", icon: "mapPin", file: "theory_grid_06.json", key: "grid_06", questions: "data/questions_grid_06.json" },
      { title: "Поиск объекта по координатам", icon: "search", file: "theory_grid_07.json", key: "grid_07", questions: "data/questions_grid_07.json" },
      { title: "Комплексные задания", icon: "star", file: "theory_grid_08.json", key: "grid_08", questions: "data/questions_grid_08.json" },
    ]
  },

  // Раздел 3: Земля как планета Солнечной системы
  {
    title: "Земля как планета Солнечной системы",
    icon: "globe",
    subtopics: [
      { title: "Форма и размеры Земли", icon: "globe", file: "theory_earth_01.json", key: "earth_01", questions: "data/questions_earth_01.json" },
      { title: "Движение Земли вокруг оси", icon: "refresh", file: "theory_earth_02.json", key: "earth_02", questions: "data/questions_earth_02.json" },
      { title: "Движение Земли вокруг Солнца", icon: "globe", file: "theory_earth_03.json", key: "earth_03", questions: "data/questions_earth_03.json" },
      { title: "Смена дня и ночи", icon: "globe", file: "theory_earth_04.json", key: "earth_04", questions: "data/questions_earth_04.json" },
      { title: "Смена времён года", icon: "globe", file: "theory_earth_05.json", key: "earth_05", questions: "data/questions_earth_05.json" },
      { title: "Часовые пояса", icon: "clock", file: "theory_earth_06.json", key: "earth_06", questions: "data/questions_earth_06.json" },
      { title: "Комплексные задания ОГЭ", icon: "target", file: "theory_earth_07.json", key: "earth_07", questions: "data/questions_earth_07.json" },
    ]
  },

  // Раздел 4: Литосфера и рельеф
  {
    title: "Литосфера и рельеф",
    icon: "mountain",
    subtopics: [
      { title: "Внутреннее строение Земли", icon: "globe", file: "theory_lith_01.json", key: "lith_01", questions: "data/questions_lith_01.json" },
      { title: "Горные породы и полезные ископаемые", icon: "mountain", file: "theory_lith_02.json", key: "lith_02", questions: "data/questions_lith_02.json" },
      { title: "Рельеф суши и дна океана", icon: "globe", file: "theory_lith_03.json", key: "lith_03", questions: "data/questions_lith_03.json" },
      { title: "Вулканы и землетрясения", icon: "globe", file: "theory_lith_04.json", key: "lith_04", questions: "data/questions_lith_04.json" },
      { title: "Равнины и горы", icon: "mountain", file: "theory_lith_05.json", key: "lith_05", questions: "data/questions_lith_05.json" },
      { title: "Профили рельефа", icon: "chart", file: "theory_lith_06.json", key: "lith_06", questions: "data/questions_lith_06.json" },
    ]
  },

  // Раздел 5: Атмосфера и климат
  {
    title: "Атмосфера и климат",
    icon: "globe",
    subtopics: [
      { title: "Состав и свойства атмосферы", icon: "globe", file: "theory_atm_01.json", key: "atm_01", questions: "data/questions_atm_01.json" },
      { title: "Температура и давление", icon: "globe", file: "theory_atm_02.json", key: "atm_02", questions: "data/questions_atm_02.json" },
      { title: "Ветер", icon: "compass", file: "theory_atm_03.json", key: "atm_03", questions: "data/questions_atm_03.json" },
      { title: "Влажность и осадки", icon: "droplet", file: "theory_atm_04.json", key: "atm_04", questions: "data/questions_atm_04.json" },
      { title: "Климатообразующие факторы", icon: "globe", file: "theory_atm_05.json", key: "atm_05", questions: "data/questions_atm_05.json" },
      { title: "Климатограммы и карты погоды", icon: "chart", file: "theory_atm_06.json", key: "atm_06", questions: "data/questions_atm_06.json" },
      { title: "Комплексные задания ОГЭ по атмосфере", icon: "star", file: "theory_atm_07.json", key: "atm_07", questions: "data/questions_atm_07.json" },
    ]
  },

  // Раздел 6: Гидросфера
  {
    title: "Гидросфера",
    icon: "droplet",
    subtopics: [
      { title: "Мировой океан", icon: "droplet", file: "theory_hydro_01.json", key: "hydro_01", questions: "data/questions_hydro_01.json" },
      { title: "Моря, заливы, проливы", icon: "mapPin", file: "theory_hydro_02.json", key: "hydro_02", questions: "data/questions_hydro_02.json" },
      { title: "Реки", icon: "droplet", file: "theory_hydro_03.json", key: "hydro_03", questions: "data/questions_hydro_03.json" },
      { title: "Озёра", icon: "droplet", file: "theory_hydro_04.json", key: "hydro_04", questions: "data/questions_hydro_04.json" },
      { title: "Ледники", icon: "droplet", file: "theory_hydro_05.json", key: "hydro_05", questions: "data/questions_hydro_05.json" },
      { title: "Подземные воды", icon: "droplet", file: "theory_hydro_06.json", key: "hydro_06", questions: "data/questions_hydro_06.json" },
      { title: "Речной режим и питание рек", icon: "droplet", file: "theory_hydro_07.json", key: "hydro_07", questions: "data/questions_hydro_07.json" },
      { title: "Комплексные задания ОГЭ по гидросфере", icon: "star", file: "theory_hydro_08.json", key: "hydro_08", questions: "data/questions_hydro_08.json" },
    ]
  },

  // Раздел 7: Биосфера и почвы
  {
    title: "Биосфера и почвы",
    icon: "tree",
    subtopics: [
      { title: "Почвообразование", icon: "globe", file: "theory_bio_01.json", key: "bio_01", questions: "data/questions_bio_01.json" },
      { title: "Типы почв", icon: "globe", file: "theory_bio_02.json", key: "bio_02", questions: "data/questions_bio_02.json" },
      { title: "Природные зоны", icon: "globe", file: "theory_bio_03.json", key: "bio_03", questions: "data/questions_bio_03.json" },
      { title: "Растительный и животный мир", icon: "tree", file: "theory_bio_04.json", key: "bio_04", questions: "data/questions_bio_04.json" },
      { title: "Приспособленность организмов", icon: "zap", file: "theory_bio_05.json", key: "bio_05", questions: "data/questions_bio_05.json" },
      { title: "Охрана природы", icon: "flag", file: "theory_bio_06.json", key: "bio_06", questions: "data/questions_bio_06.json" },
      { title: "Комплексные задания ОГЭ по биосфере и почвам", icon: "star", file: "theory_bio_07.json", key: "bio_07", questions: "data/questions_bio_07.json" },
    ]
  },

  // Будущие разделы (заглушки)
  { title: "Человечество на Земле", icon: "user", comingSoon: true, subtopics: [] },
  { title: "Взаимодействие природы и общества", icon: "refresh", comingSoon: true, subtopics: [] },
  { title: "География России", icon: "mapPin", comingSoon: true, subtopics: [] }
];