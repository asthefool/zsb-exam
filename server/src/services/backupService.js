// 数据备份（F8）：把业务表导出为「结构 + 数据」SQL 脚本，落 server/backups/ 并登记 backups 表
// 备份文件即任务书要求的「MySQL 数据库备份文件（分离式 SQL 脚本）」，可直接 mysql 导入复现数据
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const pool = require('../dao/pool');
const backupDao = require('../dao/backupDao');
const config = require('../config');
const { CODES, BizError } = require('../utils/errors');

const BACKUP_DIR = path.join(__dirname, '..', '..', 'backups');
const INSERT_BATCH = 200; // 单条 INSERT 的行数上限，避免超长语句

// 备份范围：全部业务表（backups 自身不导出，避免备份记录自引用）
const TABLES = [
  'users', 'subjects', 'questions', 'answer_records', 'wrong_questions',
  'review_plans', 'plan_tasks', 'ai_generations', 'system_settings'
];

// 本地墙钟时间字符串（dateStrings:true 下 DATETIME 即该口径，导出与库内一致）
function localNow() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function localStamp() {
  return localNow().replace(/[-: ]/g, '').slice(0, 14);
}

// SQL 字面量转义（mysqldump 口径）：字符串转义特殊字符，其余类型按原值输出
function sqlLiteral(v) {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number') return Number.isFinite(v) ? String(v) : 'NULL';
  if (typeof v === 'boolean') return v ? '1' : '0';
  let s;
  if (typeof v === 'object') s = JSON.stringify(v); // JSON 列由 mysql2 解析为对象，序列化后存回
  else s = String(v);
  return `'${s
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\0/g, '\\0')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\x1a/g, '\\Z')}'`;
}

// 生成备份文件：逐表 SHOW CREATE TABLE + SELECT *，按批 INSERT 拼装
async function create(adminId) {
  await fs.promises.mkdir(BACKUP_DIR, { recursive: true });
  const filename = `${config.db.name}_${localStamp()}.sql`;
  const filePath = path.join(BACKUP_DIR, filename);

  const lines = [
    '-- 专升本智能备考系统 数据备份（表结构 + 数据）',
    `-- 生成时间：${localNow()}    数据库：${config.db.name}`,
    '-- 恢复方式：mysql -u root -p --default-character-set=utf8mb4 zsb_exam < 本文件',
    '-- 说明：backups 表（备份记录）不包含在内；导入前请确认目标库可被覆盖',
    'SET NAMES utf8mb4;',
    'SET FOREIGN_KEY_CHECKS = 0;'
  ];

  let rowCount = 0;
  const summaries = [];
  for (const table of TABLES) {
    const [ddlRows] = await pool.query(`SHOW CREATE TABLE \`${table}\``);
    const ddl = ddlRows[0]['Create Table'];
    const [colRows] = await pool.query(`SHOW COLUMNS FROM \`${table}\``);
    const cols = colRows.map((c) => c.Field);
    const [rows] = await pool.query(`SELECT * FROM \`${table}\``);
    rowCount += rows.length;
    summaries.push({ table, rows: rows.length });

    lines.push('');
    lines.push('-- ----------------------------');
    lines.push(`-- 表 ${table}（${rows.length} 行）`);
    lines.push('-- ----------------------------');
    lines.push(`DROP TABLE IF EXISTS \`${table}\`;`);
    lines.push(`${ddl};`);
    const colSql = cols.map((c) => `\`${c}\``).join(', ');
    for (let i = 0; i < rows.length; i += INSERT_BATCH) {
      const values = rows.slice(i, i + INSERT_BATCH)
        .map((r) => `(${cols.map((c) => sqlLiteral(r[c])).join(', ')})`)
        .join(',\n');
      lines.push(`INSERT INTO \`${table}\` (${colSql}) VALUES\n${values};`);
    }
  }
  lines.push('SET FOREIGN_KEY_CHECKS = 1;');
  const content = `${lines.join('\n')}\n`;

  await fs.promises.writeFile(filePath, content, 'utf8');
  const stat = await fs.promises.stat(filePath);
  const sha256 = crypto.createHash('sha256').update(content).digest('hex');
  const id = await backupDao.create({
    filename,
    file_size: stat.size,
    table_count: TABLES.length,
    row_count: rowCount,
    sha256,
    created_by: adminId || null
  });
  return { ...(await backupDao.findById(id)), tables: summaries };
}

async function list(params) {
  return backupDao.list(params);
}

// 下载前校验文件仍在磁盘，缺失则明确报错（防止记录与文件不一致）
async function prepareDownload(id) {
  const record = await backupDao.findById(id);
  if (!record) throw new BizError(CODES.NOT_FOUND, '备份记录不存在');
  const filePath = path.join(BACKUP_DIR, path.basename(record.filename));
  if (!fs.existsSync(filePath)) {
    throw new BizError(CODES.NOT_FOUND, '备份文件已丢失，请重新备份');
  }
  return { filePath, filename: record.filename };
}

// 完整性校验：重算文件 SHA-256 与记录比对（数据安全要求）
async function verify(id) {
  const record = await backupDao.findById(id);
  if (!record) throw new BizError(CODES.NOT_FOUND, '备份记录不存在');
  const filePath = path.join(BACKUP_DIR, path.basename(record.filename));
  if (!fs.existsSync(filePath)) return { id, ok: false, message: '备份文件已丢失' };
  const buf = await fs.promises.readFile(filePath);
  const sha256 = crypto.createHash('sha256').update(buf).digest('hex');
  return {
    id,
    ok: sha256 === record.sha256,
    sha256,
    expected: record.sha256,
    message: sha256 === record.sha256 ? '文件完整，校验通过' : '文件与记录不一致，可能已损坏或被修改'
  };
}

async function remove(id) {
  const record = await backupDao.findById(id);
  if (!record) throw new BizError(CODES.NOT_FOUND, '备份记录不存在');
  const filePath = path.join(BACKUP_DIR, path.basename(record.filename));
  if (fs.existsSync(filePath)) await fs.promises.unlink(filePath);
  await backupDao.remove(id);
  return { id };
}

// 数据概览：各表行数、库占用、备份次数（备份页顶部维护信息）
async function overview() {
  const tables = [];
  let totalRows = 0;
  for (const table of TABLES) {
    const [r] = await pool.query(`SELECT COUNT(*) AS n FROM \`${table}\``);
    const n = Number(r[0].n);
    tables.push({ table, rows: n });
    totalRows += n;
  }
  const [sizeRows] = await pool.query(
    `SELECT COALESCE(SUM(data_length + index_length), 0) AS bytes
     FROM information_schema.tables WHERE table_schema = DATABASE()`);
  const [cnt] = await pool.query('SELECT COUNT(*) AS total FROM backups');
  let backupBytes = 0;
  if (fs.existsSync(BACKUP_DIR)) {
    for (const f of await fs.promises.readdir(BACKUP_DIR)) {
      try {
        backupBytes += (await fs.promises.stat(path.join(BACKUP_DIR, f))).size;
      } catch (e) { /* 文件可能被并发删除 */ }
    }
  }
  return {
    tables,
    total_rows: totalRows,
    db_bytes: Number(sizeRows[0].bytes),
    backup_count: cnt[0].total,
    backup_bytes: backupBytes,
    backup_dir: 'server/backups'
  };
}

module.exports = { create, list, prepareDownload, verify, remove, overview, BACKUP_DIR };
