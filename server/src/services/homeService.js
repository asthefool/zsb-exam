const answerDao = require('../dao/answerDao');
const wrongDao = require('../dao/wrongDao');
const planDao = require('../dao/planDao');
const masteryService = require('./masteryService');

// 首页概览（F2）：累计做题、正确率、错题数、今日任务与计划进度、掌握度汇总
async function overview(userId) {
  const stats = await answerDao.statsByUser(userId);
  const wrongCount = await wrongDao.countActive(userId);
  const mastery = await masteryService.summary(userId);
  const todayTasks = await planDao.todayTasks(userId);
  const activePlan = await planDao.findActive(userId);
  let planProgress = null;
  if (activePlan) {
    const p = await planDao.progress(activePlan.id);
    planProgress = {
      plan_id: activePlan.id,
      exam_date: activePlan.exam_date,
      done: Number(p.done),
      total: p.total,
      percent: p.total ? Math.round((Number(p.done) / p.total) * 100) : 0
    };
  }
  return {
    total_answers: stats.total,
    correct_answers: Number(stats.correct),
    accuracy: stats.total ? Math.round((Number(stats.correct) / stats.total) * 100) : 0,
    wrong_count: wrongCount,
    mastery,
    today_tasks: todayTasks,
    plan_progress: planProgress
  };
}

module.exports = { overview };
