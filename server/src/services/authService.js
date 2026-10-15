const bcrypt = require('bcryptjs');
const { CODES, BizError } = require('../utils/errors');
const jwtUtil = require('../utils/jwt');
const userDao = require('../dao/userDao');

// 注册：用户名唯一校验（冲突 40901），密码 bcrypt 哈希存储
async function register({ username, password, nickname }) {
  if (!/^[a-zA-Z0-9_]{3,32}$/.test(username || '')) {
    throw new BizError(CODES.BAD_REQUEST, '用户名需为 3-32 位字母、数字或下划线');
  }
  if (!password || password.length < 6) {
    throw new BizError(CODES.BAD_REQUEST, '密码长度至少 6 位');
  }
  const exist = await userDao.findByUsername(username);
  if (exist) throw new BizError(CODES.CONFLICT, '用户名已被注册');
  const passwordHash = await bcrypt.hash(password, 10);
  const id = await userDao.create({ username, passwordHash, nickname });
  return { id, username, nickname: nickname || username, role: 'student' };
}

// 登录：校验密码与账号状态，签发 JWT
async function login({ username, password }) {
  const user = await userDao.findByUsername(username);
  if (!user) throw new BizError(CODES.BAD_CREDENTIAL, '账号或密码错误');
  const match = await bcrypt.compare(password || '', user.password_hash);
  if (!match) throw new BizError(CODES.BAD_CREDENTIAL, '账号或密码错误');
  if (user.status !== 1) throw new BizError(CODES.DISABLED, '账号已被禁用，请联系管理员', 403);
  const token = jwtUtil.sign(user);
  return {
    token,
    user: { id: user.id, username: user.username, nickname: user.nickname, role: user.role }
  };
}

module.exports = { register, login };
