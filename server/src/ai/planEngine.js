// mock 计划规则引擎：按剩余天数、错题科目分布与每日时长生成任务序列
// 无需任何外部依赖，输出结构与 llm 模式一致（task_date / time_slot / content / ref_question_ids）
const SLOT_ROTATION = ['上午', '下午', '晚上'];

function fmt(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * @param {object} ctx
 *  daysLeft: 剩余天数；subjects: [{id, name}] 目标科目；
 *  wrongDist: [{subject_id, subject_name, wrong_total}]；wrongSample: [{question_id, subject_id}]；
 *  dailyMinutes: 每日时长
 * @returns 任务数组
 */
function buildTasks(ctx) {
  const days = Math.min(Math.max(ctx.daysLeft || 14, 1), 30);
  const subjects = ctx.subjects.length ? ctx.subjects : [{ id: null, name: '综合复习' }];
  // 错题量加权：错题多的科目被排到更多天
  const weightOf = (sid) => {
    const hit = ctx.wrongDist.find((w) => w.subject_id === sid);
    return hit ? Math.max(1, hit.wrong_total) : 1;
  };
  const pool = [];
  subjects.forEach((s) => {
    for (let i = 0; i < weightOf(s.id); i += 1) pool.push(s);
  });

  const tasks = [];
  const today = new Date();
  for (let i = 0; i < days; i += 1) {
    const date = new Date(today.getTime() + (i + 1) * 86400000);
    const subject = pool[i % pool.length];
    const slot = SLOT_ROTATION[i % SLOT_ROTATION.length];
    // 该科目的未掌握错题样本（错题重练类任务引用具体题目）
    const refs = ctx.wrongSample
      .filter((w) => w.subject_id === subject.id)
      .slice((i * 2) % 10, ((i * 2) % 10) + 5)
      .map((w) => w.question_id);

    let content;
    if (refs.length >= 3 && i % 3 === 1) {
      content = `【错题重练】${subject.name}：重练 ${refs.length} 道未掌握错题，做到能独立讲清解题步骤。`;
    } else if (i % 5 === 4) {
      content = `【阶段复盘】回顾本周 ${subject.name} 学习内容，整理知识框架笔记（约 ${ctx.dailyMinutes || 60} 分钟）。`;
    } else {
      content = `【知识学习】${subject.name}：按考纲推进一个章节，配套完成 10-15 道练习题（约 ${ctx.dailyMinutes || 60} 分钟）。`;
    }
    tasks.push({
      task_date: fmt(date),
      time_slot: slot,
      content,
      ref_question_ids: refs.length >= 3 && i % 3 === 1 ? refs : null
    });
  }
  return tasks;
}

module.exports = { buildTasks };
