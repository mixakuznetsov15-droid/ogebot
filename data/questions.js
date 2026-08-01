// ==========================================
//  ФАЙЛ ТЕМ И ПОДТЕМ (ОГЭ ГЕОГРАФИЯ)
// ==========================================

// Основные вопросы (практика) для каждой подтемы
var QUESTIONS_FILES = [
  // Раздел 1: Топографические карты
  { title: "1. Что такое топографические карты", key: "topo_01", questions: "data/questions_topo_01.json" },
  { title: "2. Масштаб", key: "topo_02", questions: "data/questions_topo_02.json" },
  { title: "3. Условные знаки", key: "topo_03", questions: "data/questions_topo_03.json" },
  { title: "4. Рельеф", key: "topo_04", questions: "data/questions_topo_04.json" },
  { title: "5. Азимут и стороны горизонта", key: "topo_05", questions: "data/questions_topo_05.json" },
  { title: "6. Географические координаты", key: "topo_06", questions: "data/questions_topo_06.json" },
  { title: "7. Построение маршрута", key: "topo_07", questions: "data/questions_topo_07.json" },
  { title: "8. Комплексные задания (топо)", key: "topo_08", questions: "data/questions_topo_08.json" },

  // Раздел 2: Градусная сеть и географические координаты
  { title: "1. Параллели и меридианы", key: "grid_01", questions: "data/questions_grid_01.json" },
  { title: "2. Экватор и нулевой меридиан", key: "grid_02", questions: "data/questions_grid_02.json" },
  { title: "3. Градусная сеть", key: "grid_03", questions: "data/questions_grid_03.json" },
  { title: "4. Географическая широта", key: "grid_04", questions: "data/questions_grid_04.json" },
  { title: "5. Географическая долгота", key: "grid_05", questions: "data/questions_grid_05.json" },
  { title: "6. Определение координат точки", key: "grid_06", questions: "data/questions_grid_06.json" },
  { title: "7. Поиск объекта по координатам", key: "grid_07", questions: "data/questions_grid_07.json" },
  { title: "8. Комплексные задания (координаты)", key: "grid_08", questions: "data/questions_grid_08.json" },

  // Будущие разделы можно добавлять сюда
];

// Теоретические карточки (микроуроки)
var THEORY_FILES = [
  // Раздел 1
  {
    title: "Топографические карты",
    icon: "mapPin",
    subtopics: [
      { title: "Что такое топографические карты", icon: "mapPin", file: "topo_what_is.json", key: "topo_01", questions: "data/questions_topo_01.json" },
      { title: "Масштаб", icon: "ruler", file: "topo_scale.json", key: "topo_02", questions: "data/questions_topo_02.json" },
      { title: "Условные знаки", icon: "book", file: "topo_symbols.json", key: "topo_03", questions: "data/questions_topo_03.json" },
      { title: "Рельеф", icon: "mountain", file: "topo_relief.json", key: "topo_04", questions: "data/questions_topo_04.json" },
      { title: "Азимут и стороны горизонта", icon: "compass", file: "topo_azimuth.json", key: "topo_05", questions: "data/questions_topo_05.json" },
      { title: "Географические координаты", icon: "globe", file: "topo_coordinates.json", key: "topo_06", questions: "data/questions_topo_06.json" },
      { title: "Построение маршрута", icon: "mapPin", file: "topo_route.json", key: "topo_07", questions: "data/questions_topo_07.json" },
      { title: "Комплексные задания", icon: "star", file: "topo_complex.json", key: "topo_08", questions: "data/questions_topo_08.json" },
    ]
  },

  // Раздел 2
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

  // Будущие разделы
];