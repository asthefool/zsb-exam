// 管理员初始化：node scripts/init-admin.js [--username admin]
// 交互式输入密码并 bcrypt 哈希后写入 users，不在 SQL 中内置弱口令
const readline = require('readline');
const bcrypt = require('bcryptjs');
const userDao = require('../src/dao/userDao');
const pool = require('../src/dao/pool');

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => { rl.close(); resolve(answer.trim()); });
  });
}

(async () => {
  try {
    const username = process.argv.find((a) => a.startsWith('--username='))?.split('=')[1] || 'admin';
    const password = await ask('请输入管理员密码（至少 6 位）：');
    if (!password || password.length < 6) throw new Error('密码长度至少 6 位');
    const exist = await userDao.findByUsername(username);
    const passwordHash = await bcrypt.hash(password, 10);
    if (exist) {
      if (exist.role !== 'admin') throw new Error(`用户 ${username} 已存在且不是管理员`);
      await pool.query('UPDATE users SET password_hash = ?, status = 1 WHERE id = ?', [passwordHash, exist.id]);
      console.log(`管理员 ${username} 密码已重置并恢复启用`);
    } else {
      await userDao.create({ username, passwordHash, nickname: '系统管理员', role: 'admin' });
      console.log(`管理员 ${username} 创建成功`);
    }
    process.exit(0);
  } catch (e) {
    console.error('初始化失败：', e.message);
    process.exit(1);
  }
})();
