// ==========================================
//  ДАННЫЕ: темы, вопросы, награды сундуков
// ==========================================

// Список файлов теории
const THEORY_FILES = [
  // topo теперь разбита на 8 подтем
  { key:'topo_intro',     title:'📌 Топографическая карта',    file:'theory_topo_01.json', tasks:'Что это и где применяется' },
  { key:'topo_scale',     title:'📏 Масштаб',                  file:'theory_topo_02.json', tasks:'Виды, перевод, расчёт' },
  { key:'topo_signs',     title:'🏘 Условные знаки',           file:'theory_topo_03.json', tasks:'Распознавание объектов' },
  { key:'topo_relief',    title:'⛰ Рельеф',                   file:'theory_topo_04.json', tasks:'Горизонтали, высоты, склоны' },
  { key:'topo_azimuth',   title:'🧭 Азимут',                   file:'theory_topo_05.json', tasks:'Стороны горизонта, направление' },
  { key:'topo_coords',    title:'📍 Координаты и объекты',     file:'theory_topo_06.json', tasks:'Поиск по квадратам' },
  { key:'topo_route',     title:'🚶 Маршрут',                  file:'theory_topo_07.json', tasks:'Построение и чтение маршрута' },
  { key:'topo_final',     title:'📝 Комплексные задания',      file:'theory_topo_08.json', tasks:'Задания 1–4 ОГЭ' },

  // остальные темы (без изменений)
  { key:'synoptic', title:'🌀 Синоптические карты', file:'theory_synoptic.json', tasks:'Задания 5-6' },
  { key:'climat', title:'📊 Климат и климатограммы', file:'theory_climat.json', tasks:'Задания 7-8' },
  { key:'nature_russia', title:'🌋 Природа России', file:'theory_nature_russia.json', tasks:'Задания 13-16'},
  { key:'timezone', title:'🕐 Часовые пояса', file:'theory_timezone.json', tasks:'Задание 17' },
  { key:'zones', title:'🌲 Природные зоны', file:'theory_zones.json', tasks:'Задание 28' },
  { key:'population', title:'👥 Население России', file:'theory_population.json', tasks:'Задания 23-25'},
  { key:'economy', title:'🏭 Хозяйство России', file:'theory_economy.json', tasks:'Задание 27' },
  { key:'regions', title:'📍 Регионы России', file:'theory_regions.json', tasks:'Задания 20-21'},
  { key:'world', title:'🌍 Страны и материки', file:'theory_world.json', tasks:'Задания 20-21'},
  { key:'litosphere', title:'⛰ Литосфера и рельеф', file:'theory_litosphere.json', tasks:'Задание 22' },
  { key:'hydro', title:'💧 Гидросфера', file:'theory_hydro.json', tasks:'Задание 22' },
  { key:'ecology', title:'🌱 Экология', file:'theory_ecology.json', tasks:'Задание 15' },
  { key:'geopos', title:'📍 Геогр. положение России', file:'theory_geopos.json', tasks:'Задание 26' }
];

// Список файлов с вопросами
const QUESTIONS_FILES = [
  { key:'topo_intro',     title:'📌 Топографическая карта',    file:'questions_topo_01.json', tasks:'Что это и где применяется' },
  { key:'topo_scale',     title:'📏 Масштаб',                  file:'questions_topo_02.json', tasks:'Виды, перевод, расчёт' },
  { key:'topo_signs',     title:'🏘 Условные знаки',           file:'questions_topo_03.json', tasks:'Распознавание объектов' },
  { key:'topo_relief',    title:'⛰ Рельеф',                   file:'questions_topo_04.json', tasks:'Горизонтали, высоты, склоны' },
  { key:'topo_azimuth',   title:'🧭 Азимут',                   file:'questions_topo_05.json', tasks:'Стороны горизонта, направление' },
  { key:'topo_coords',    title:'📍 Координаты и объекты',     file:'questions_topo_06.json', tasks:'Поиск по квадратам' },
  { key:'topo_route',     title:'🚶 Маршрут',                  file:'questions_topo_07.json', tasks:'Построение и чтение маршрута' },
  { key:'topo_final',     title:'📝 Комплексные задания',      file:'questions_topo_08.json', tasks:'Задания 1–4 ОГЭ' },

  // остальные темы (без изменений)
  { key:'synoptic', title:'🌀 Синоптические карты', file:'questions_synoptic.json', tasks:'Задания 5-6' },
  { key:'climat', title:'📊 Климат и климатограммы', file:'questions_climat.json', tasks:'Задания 7-8' },
  { key:'nature_russia', title:'🌋 Природа России', file:'questions_nature_russia.json', tasks:'Задания 13-16'},
  { key:'timezone', title:'🕐 Часовые пояса', file:'questions_timezone.json', tasks:'Задание 17' },
  { key:'zones', title:'🌲 Природные зоны', file:'questions_zones.json', tasks:'Задание 28' },
  { key:'population', title:'👥 Население России', file:'questions_population.json', tasks:'Задания 23-25'},
  { key:'economy', title:'🏭 Хозяйство России', file:'questions_economy.json', tasks:'Задание 27' },
  { key:'regions', title:'📍 Регионы России', file:'questions_regions.json', tasks:'Задания 20-21'},
  { key:'world', title:'🌍 Страны и материки', file:'questions_world.json', tasks:'Задания 20-21'},
  { key:'litosphere', title:'⛰ Литосфера и рельеф', file:'questions_litosphere.json', tasks:'Задание 22' },
  { key:'hydro', title:'💧 Гидросфера', file:'questions_hydro.json', tasks:'Задание 22' },
  { key:'ecology', title:'🌱 Экология', file:'questions_ecology.json', tasks:'Задание 15' },
  { key:'geopos', title:'📍 Геогр. положение России', file:'questions_geopos.json', tasks:'Задание 26' }
];

// Возможные награды из сундуков
const REWARD_POOL = [
  { type: 'xp', value: 20, label: '+20 XP' },
  { type: 'xp', value: 50, label: '+50 XP' },
  { type: 'xp', value: 100, label: '+100 XP' },
  { type: 'streak_day', value: 1, label: '+1 день серии' },
  { type: 'boost_x2', duration: 15, label: 'Бустер x2 XP на 15 мин' },
  { type: 'free_hint', value: 1, label: 'Бесплатная AI-подсказка' },
  { type: 'badge', id: 'rare_chest', label: 'Редкий бейдж' }
];