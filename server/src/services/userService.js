const bcrypt = require('bcryptjs');
const { CODES, BizError } = require('../utils/errors');
const userDao = require('../dao/userDao');

// 个人中心（F7）：账号信息查看、个人资料维护、修改密码
const GENDERS = ['secret', 'male', 'female'];

async function getProfile(userId) {
  const user = await userDao.findById(userId);
  if (!user) throw new BizError(CODES.NOT_FOUND, '用户不存在');
  return user;
}

// 字段级校验：昵称必填（兼容旧契约），其余字段可选、按各自规则收敛
function validateProfile(patch) {
  const out = {};
  if (patch.nickname !== undefined) {
    const nickname = String(patch.nickname || '').trim();
    if (!nickname) throw new BizError(CODES.BAD_REQUEST, '昵称不能为空');
    if (nickname.length > 32) throw new BizError(CODES.BAD_REQUEST, '昵称不超过 32 字');
    out.nickname = nickname;
  }
  if (patch.gender !== undefined) {
    if (!GENDERS.includes(patch.gender)) throw new BizError(CODES.BAD_REQUEST, '性别取值不合法');
    out.gender = patch.gender;
  }
  if (patch.phone !== undefined) {
    const phone = String(patch.phone || '').trim();
    if (phone && !/^1\d{10}$/.test(phone)) throw new BizError(CODES.BAD_REQUEST, '手机号格式不正确');
    out.phone = phone;
  }
  if (patch.email !== undefined) {
    const email = String(patch.email || '').trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new BizError(CODES.BAD_REQUEST, '邮箱格式不正确');
    if (email.length > 64) throw new BizError(CODES.BAD_REQUEST, '邮箱不超过 64 字');
    out.email = email;
  }
  if (patch.target_school !== undefined) {
    const v = String(patch.target_school || '').trim();
    if (v.length > 64) throw new BizError(CODES.BAD_REQUEST, '目标院校不超过 64 字');
    out.target_school = v;
  }
  if (patch.bio !== undefined) {
    const v = String(patch.bio || '').trim();
    if (v.length > 200) throw new BizError(CODES.BAD_REQUEST, '个性签名不超过 200 字');
    out.bio = v;
  }
  if (patch.avatar !== undefined) {
    const v = String(patch.avatar || '').trim();
    if (v.length > 255) throw new BizError(CODES.BAD_REQUEST, '头像地址过长');
    out.avatar = v;
  }
  return out;
}

async function updateProfile(userId, patch) {
  const data = validateProfile(patch || {});
  if (!Object.keys(data).length) {
    throw new BizError(CODES.BAD_REQUEST, '没有需要更新的字段');
  }
  return userDao.updateProfile(userId, data);
}

// 修改密码：校验原密码后重设（bcrypt 哈希），新密码禁止与原密码相同
async function changePassword(userId, { old_password, new_password }) {
  if (!old_password || !new_password) {
    throw new BizError(CODES.BAD_REQUEST, '原密码与新密码均为必填');
  }
  if (String(new_password).length < 6) {
    throw new BizError(CODES.BAD_REQUEST, '新密码长度至少 6 位');
  }
  const passwordHash = await userDao.findPasswordHash(userId);
  if (!passwordHash) throw new BizError(CODES.NOT_FOUND, '用户不存在');
  const match = await bcrypt.compare(String(old_password), passwordHash);
  if (!match) throw new BizError(CODES.BAD_CREDENTIAL, '原密码不正确');
  if (await bcrypt.compare(String(new_password), passwordHash)) {
    throw new BizError(CODES.BAD_REQUEST, '新密码不能与原密码相同');
  }
  await userDao.updatePassword(userId, await bcrypt.hash(String(new_password), 10));
  return { changed: 1 };
}

module.exports = { getProfile, updateProfile, changePassword };
