// MySQL 连接池（mysql2/promise）：创建池不立即连接，首次查询时才建立连接
const mysql = require('mysql2/promise');
const config = require('../config');

const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.name,
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4',
  // DATE/DATETIME 以字符串返回，避免 res.json 走 toISOString 变 UTC 导致东八区差一天
  dateStrings: true
});

module.exports = pool;
