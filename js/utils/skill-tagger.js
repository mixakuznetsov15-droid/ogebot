// ==========================================
// js/utils/skill-tagger.js
// ==========================================

function migrateQuestionsAddSkills(questions, topicKey) {
  const SKILL_KEYWORDS = {
    topo: {
      'масштаб': ['масштаб', 'расстояние', 'см', 'километр', 'метр', 'линейный', 'численный', 'именованный'],
      'горизонтали': ['горизонталь', 'высота', 'рельеф', 'абсолют', 'относитель', 'бергштрих', 'склон'],
      'азимут': ['азимут', 'направление', 'градус', 'компас', 'ориентир'],
      'условные_знаки': ['условный знак', 'обозначение', 'знак', 'легенда', 'символ']
    }
  };

  const keywords = SKILL_KEYWORDS[topicKey] || {};

  return questions.map(q => {
    if (q.skill) return q;
    const textLower = (q.text || '').toLowerCase();
    let foundSkill = 'общее';
    for (const [skill, words] of Object.entries(keywords)) {
      if (words.some(word => textLower.includes(word))) {
        foundSkill = skill;
        break;
      }
    }
    return { ...q, skill: foundSkill };
  });
}