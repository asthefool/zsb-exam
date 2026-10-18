// 前端统一常量：分页 / 题型 / 本地存储键 / 超时
// 新增文件，不改变原有逻辑，各页面可逐步迁移引用
export const PAGE_SIZE = 10;

export const Q_TYPE_LABEL = {
  single: '单选',
  multiple: '多选',
  judge: '判断'
};

// 难度 1-5 → 三档展示，与智能题库推荐练习（1/2/3 = 简单/中等/困难）口径一致
export function difficultyMeta(d) {
  const n = Number(d);
  if (n <= 1) return { label: '简单', cls: 'tag-ok' };
  if (n === 2) return { label: '中等', cls: 'tag-warn' };
  return { label: '困难', cls: 'tag-bad' };
}

export const GENDER_LABEL = {
  secret: '保密',
  male: '男',
  female: '女'
};

export const STORAGE_KEYS = {
  token: 'token',
  role: 'role',
  userId: 'userId'
};

export const TIMEOUT = {
  default: 20000,
  // AI 生成（讲解/计划）等待时间较长：覆盖服务端 60s 超时 × 重试 1 次
  ai: 130000
};
