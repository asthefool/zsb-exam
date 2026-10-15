const jwt = require('jsonwebtoken');
const config = require('../config');

// 签发 JWT：载荷含用户 id 与角色，供鉴权与授权使用
function sign(user) {
  return jwt.sign({ uid: user.id, role: user.role }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn
  });
}

function verify(token) {
  return jwt.verify(token, config.jwt.secret);
}

module.exports = { sign, verify };
