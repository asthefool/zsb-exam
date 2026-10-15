const { CODES, BizError } = require('../utils/errors');
const questionDao = require('../dao/questionDao');

// 题库（F3）：科目字典与题目检索，考生端不返回答案与解析
async function listSubjects() {
  return questionDao.listSubjects();
}

async function listQuestions(params) {
  return questionDao.listQuestions(params);
}

async function getQuestion(id) {
  const q = await questionDao.findById(id);
  if (!q || q.status !== 1 || q.deleted_at) throw new BizError(CODES.NOT_FOUND, '题目不存在或已下架');
  // 详情同样不携带答案与解析，判分后再展示
  return {
    id: q.id, subject_id: q.subject_id, q_type: q.q_type,
    content: q.content, options: q.options, difficulty: q.difficulty
  };
}

module.exports = { listSubjects, listQuestions, getQuestion };
