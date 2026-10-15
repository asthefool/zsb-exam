const { CODES, BizError } = require('../utils/errors');
const questionDao = require('../dao/questionDao');
const userDao = require('../dao/userDao');
const aiGenDao = require('../dao/aiGenDao');

const Q_TYPES = ['single', 'multiple', 'judge'];

// 后台管理（F8）：题目增删改查 + 用户管理，仅 admin 角色可进（路由组挂 requireRole）
function validateQuestion(q) {
  if (!q.subject_id) throw new BizError(CODES.BAD_REQUEST, '请选择科目');
  if (!Q_TYPES.includes(q.q_type)) throw new BizError(CODES.BAD_REQUEST, '题型不合法');
  const content = String(q.content || '').trim();
  if (!content) throw new BizError(CODES.BAD_REQUEST, '题干不能为空');
  if (content.length > 10000) throw new BizError(CODES.BAD_REQUEST, '题干过长（上限 10000 字）');
  const answer = String(q.answer || '').trim();
  if (!answer) throw new BizError(CODES.BAD_REQUEST, '正确答案不能为空');
  const difficulty = q.difficulty == null ? 2 : Number(q.difficulty);
  if (!Number.isInteger(difficulty) || difficulty < 1 || difficulty > 5) {
    throw new BizError(CODES.BAD_REQUEST, '难度须为 1～5 的整数');
  }

  if (q.q_type === 'judge') {
    const a = answer.toLowerCase();
    if (!['true', 'false'].includes(a)) {
      throw new BizError(CODES.BAD_REQUEST, '判断题答案须为 true 或 false');
    }
    return;
  }

  if (!Array.isArray(q.options) || q.options.length < 2) {
    throw new BizError(CODES.BAD_REQUEST, '选择题至少需要 2 个选项');
  }
  const keys = [];
  for (const opt of q.options) {
    if (!opt || typeof opt !== 'object' || !opt.key || opt.text == null || String(opt.text).trim() === '') {
      throw new BizError(CODES.BAD_REQUEST, '选项须为含 key/text 的对象数组');
    }
    keys.push(String(opt.key).toUpperCase());
  }
  if (new Set(keys).size !== keys.length) {
    throw new BizError(CODES.BAD_REQUEST, '选项 key 不能重复');
  }
  const ansLetters = answer.toUpperCase().split('').filter(Boolean);
  for (const ch of ansLetters) {
    if (!keys.includes(ch)) throw new BizError(CODES.BAD_REQUEST, '正确答案字母必须存在于选项中');
  }
  if (q.q_type === 'single' && ansLetters.length !== 1) {
    throw new BizError(CODES.BAD_REQUEST, '单选题只能有一个正确答案');
  }
}

async function listQuestions({ keyword, offset, size }) {
  const { list, total } = await questionDao.adminList({ keyword, offset, size });
  return { list, total };
}

async function createQuestion(q) {
  validateQuestion(q);
  const id = await questionDao.create(q);
  return { id };
}

// 修改题目：updated_at 自动更新，旧讲解缓存因版本不一致而自动失效
async function updateQuestion(id, q) {
  const exist = await questionDao.findById(id);
  if (!exist) throw new BizError(CODES.NOT_FOUND, '题目不存在');
  validateQuestion(q);
  await questionDao.update(id, q);
  return { id };
}

// 软删：停用 + 记 deleted_at，考生端不再出现（AC9），历史数据不断链
async function deleteQuestion(id) {
  const exist = await questionDao.findById(id);
  if (!exist) throw new BizError(CODES.NOT_FOUND, '题目不存在');
  await questionDao.softDelete(id);
}

async function listUsers(params) {
  return userDao.list(params);
}

async function setUserStatus(operatorId, id, { status }) {
  if (Number(operatorId) === Number(id)) {
    throw new BizError(CODES.BAD_REQUEST, '不能修改自己的账号状态');
  }
  const v = status === 1 || status === '1' || status === true ? 1 : 0;
  // 显式校验入参合法性，避免 "false"/任意字符串被误判
  const allowed = [1, '1', true, 0, '0', false];
  if (!allowed.includes(status)) {
    throw new BizError(CODES.BAD_REQUEST, '状态值须为 0 或 1');
  }
  const user = await userDao.findById(id);
  if (!user) throw new BizError(CODES.NOT_FOUND, '用户不存在');
  if (user.role === 'admin') {
    throw new BizError(CODES.FORBIDDEN, '不能直接禁用管理员账号，如需处理请联系超级管理员');
  }
  await userDao.setStatus(id, v);
  return { id, status: v };
}

module.exports = { listQuestions, createQuestion, updateQuestion, deleteQuestion, listUsers, setUserStatus };
