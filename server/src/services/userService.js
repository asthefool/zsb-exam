const { CODES, BizError } = require('../utils/errors');
const userDao = require('../dao/userDao');

// 个人中心（F7）
async function getProfile(userId) {
  const user = await userDao.findById(userId);
  if (!user) throw new BizError(CODES.NOT_FOUND, '用户不存在');
  return user;
}

async function updateProfile(userId, { nickname }) {
  if (!nickname || nickname.length > 32) {
    throw new BizError(CODES.BAD_REQUEST, '昵称必填且不超过 32 字');
  }
  return userDao.updateProfile(userId, { nickname });
}

module.exports = { getProfile, updateProfile };
