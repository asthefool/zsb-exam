const answerDao = require('../dao/answerDao');
const questionDao = require('../dao/questionDao');
const wrongDao = require('../dao/wrongDao');

// 掌握度 = 近期加权正确率，参数集中在此
const WINDOW_DAYS = 14;      // 近 14 天内的作答权重为 1
const HALF_LIFE_DAYS = 30;   // 之后每 30 天权重减半
const RETRY_CREDIT = 1.1;    // 错题回炉答对计 1.1 分（一次做对计 1 分）
const MIN_SAMPLE = 10;       // 做过的题不足 10 道，不给百分比
const SUBJECT_FULL = 100;    // 单科满分，综合预估分 = Σ 科目掌握度 × 单科满分
const TREND_WEEKS = 7;       // 预估分趋势回溯周数（含本周）
const DAY_MS = 86400000;
const Q_TYPES = ['single', 'multiple', 'judge'];

function weightOf(ageDays) {
  if (ageDays <= WINDOW_DAYS) return 1;
  return Math.pow(0.5, (ageDays - WINDOW_DAYS) / HALF_LIFE_DAYS);
}

// records 须按作答时间升序
function aggregate(records, bankTotal, wrongCount, now) {
  const answered = new Set();
  const unresolved = new Set(); // 答错且尚未回炉答对的题
  let weightSum = 0;
  let creditSum = 0;
  for (const r of records) {
    answered.add(r.question_id);
    const ageDays = Math.max(0, (now - new Date(r.answered_at).getTime()) / DAY_MS);
    const w = weightOf(ageDays);
    let credit = 0;
    if (r.is_correct) {
      credit = unresolved.delete(r.question_id) ? RETRY_CREDIT : 1;
    } else {
      unresolved.add(r.question_id);
    }
    weightSum += w;
    creditSum += w * credit;
  }
  const n = answered.size;
  const base = {
    answered: n,
    bank_total: bankTotal,
    coverage: bankTotal ? Math.min(100, Math.round((n / bankTotal) * 100)) : 0,
    wrong_count: wrongCount
  };
  if (n < MIN_SAMPLE) return { ...base, mastery: null, need_more: MIN_SAMPLE - n };
  const mastery = weightSum ? Math.min(100, Math.round((creditSum / weightSum) * 100)) : 0;
  return { ...base, mastery, need_more: 0 };
}

// 在给定时刻 now 上，按科目 / 题型汇总掌握度
function buildRows(subjects, bank, unmastered, records, now) {
  const bankMap = new Map();
  const wrongMap = new Map();
  const recMap = new Map();
  const add = (map, key, v) => map.set(key, (map.get(key) || 0) + v);
  const pushRec = (key, r) => {
    if (!recMap.has(key)) recMap.set(key, []);
    recMap.get(key).push(r);
  };

  for (const b of bank) add(bankMap, `${b.subject_id}|${b.q_type}`, Number(b.total));
  for (const w of unmastered) add(wrongMap, `${w.subject_id}|${w.q_type}`, Number(w.wrong_total));
  for (const r of records) {
    pushRec(`${r.subject_id}`, r);
    pushRec(`${r.subject_id}|${r.q_type}`, r);
  }

  return subjects.map((s) => {
    const chapters = Q_TYPES.map((t) => {
      const key = `${s.id}|${t}`;
      return {
        q_type: t,
        ...aggregate(recMap.get(key) || [], bankMap.get(key) || 0, wrongMap.get(key) || 0, now)
      };
    });
    const bankTotal = chapters.reduce((a, c) => a + c.bank_total, 0);
    const wrongCount = chapters.reduce((a, c) => a + c.wrong_count, 0);
    return {
      subject_id: s.id,
      name: s.name,
      full: SUBJECT_FULL,
      ...aggregate(recMap.get(`${s.id}`) || [], bankTotal, wrongCount, now),
      chapters
    };
  });
}

function estimateOf(rows) {
  const evaluated = rows.filter((r) => r.mastery !== null);
  return {
    score: Math.round(evaluated.reduce((a, r) => a + (r.mastery * r.full) / 100, 0)),
    max: rows.length * SUBJECT_FULL,
    evaluated: evaluated.length
  };
}

// 每周末时点：只使用当时已作答的记录，并以该时刻为「现在」重算预估分（口径与 estimate 相同）
// 不满足计算条件（无科目达到 MIN_SAMPLE）的周记为 score: null
function weeklyTrend(subjects, bank, records, now) {
  const points = [];
  for (let k = TREND_WEEKS - 1; k >= 0; k--) {
    const at = now - k * 7 * DAY_MS;
    const upTo = records.filter((r) => new Date(r.answered_at).getTime() <= at);
    const est = estimateOf(buildRows(subjects, bank, [], upTo, at));
    points.push({
      weeks_ago: k,
      score: est.evaluated ? est.score : null,
      evaluated: est.evaluated
    });
  }
  return points;
}

// 学情口径汇总：科目掌握度、题型章节掌握度、综合预估分、预估分周趋势（首页 / 题库 / 报告共用）
async function summary(userId) {
  const [subjects, bank, records, unmastered] = await Promise.all([
    questionDao.listSubjects(),
    questionDao.bankStats(),
    answerDao.listWithQuestion(userId),
    wrongDao.unmasteredBySubjectType(userId)
  ]);
  const now = Date.now();
  const rows = buildRows(subjects, bank, unmastered, records, now);
  return {
    subjects: rows,
    estimate: estimateOf(rows),
    trend: weeklyTrend(subjects, bank, records, now)
  };
}

module.exports = { summary };
