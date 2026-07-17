// ==========================================
// js/systems/adaptive-selector.js
// ==========================================

function selectNextQuestions(topicKey, allQuestionsForTopic, userProgress, count = 5) {
  if (!userProgress.skillStats) userProgress.skillStats = {};

  const skillsInTopic = [...new Set(allQuestionsForTopic.map(q => q.skill || 'общее'))];

  if (skillsInTopic.length < 3 || allQuestionsForTopic.length <= count) {
    return shuffle(allQuestionsForTopic).slice(0, count);
  }

  const skillWeakness = {};
  for (const skill of skillsInTopic) {
    const statKey = topicKey + '_' + skill;
    const stats = userProgress.skillStats[statKey] || { correct: 0, wrong: 0 };
    const total = stats.correct + stats.wrong;
    if (total === 0) {
      skillWeakness[skill] = 0.5;
    } else {
      skillWeakness[skill] = stats.wrong / (total + 1);
    }
  }

  const sortedSkills = Object.entries(skillWeakness)
    .sort((a, b) => b[1] - a[1])
    .map(([skill]) => skill);

  const weakSkills = sortedSkills.slice(0, 2);
  const otherSkills = sortedSkills.slice(2);

  const selected = [];
  const weakCount = Math.ceil(count * 0.6);
  const questionsFromWeak = allQuestionsForTopic.filter(q => weakSkills.includes(q.skill));
  selected.push(...pickRandom(questionsFromWeak, weakCount));

  const remainingCount = count - selected.length;
  if (remainingCount > 0 && otherSkills.length > 0) {
    const questionsFromOthers = allQuestionsForTopic.filter(q => otherSkills.includes(q.skill));
    selected.push(...pickRandom(questionsFromOthers, remainingCount));
  }

  if (selected.length < count) {
    const alreadySelectedIds = new Set(selected.map(q => q.text));
    const rest = allQuestionsForTopic.filter(q => !alreadySelectedIds.has(q.text));
    selected.push(...shuffle(rest).slice(0, count - selected.length));
  }

  const uniqueSelected = [];
  const seenTexts = new Set();
  for (const q of selected) {
    if (!seenTexts.has(q.text)) {
      seenTexts.add(q.text);
      uniqueSelected.push(q);
    }
  }

  return shuffle(uniqueSelected).slice(0, count);
}

function updateSkillStats(topicKey, skill, wasCorrect) {
  if (!userProgress.skillStats) userProgress.skillStats = {};
  const statKey = topicKey + '_' + (skill || 'общее');
  const stats = userProgress.skillStats[statKey] || { correct: 0, wrong: 0, lastSeen: null };
  if (wasCorrect) {
    stats.correct++;
  } else {
    stats.wrong++;
  }
  stats.lastSeen = new Date().toISOString().slice(0, 10);
  userProgress.skillStats[statKey] = stats;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickRandom(arr, count) {
  return shuffle(arr).slice(0, count);
}