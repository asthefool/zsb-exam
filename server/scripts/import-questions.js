// 批量导题：node scripts/import-questions.js [题目JSON文件路径]
// 默认导入 scripts/seed-questions.json（随附的示例题库，用于开发联调与答辩演示）
// 文件格式：[{ "subject": "大学英语", "q_type": "single", "content": "题干",
//              "options": [{"key":"A","text":"..."}], "answer": "A",
//              "analysis": "解析", "difficulty": 2 }]
const fs = require('fs');
const path = require('path');
const pool = require('../src/dao/pool');

(async () => {
  const conn = await pool.getConnection();
  try {
    const file = process.argv[2] || path.join(__dirname, 'seed-questions.json');
    // 限制只能读取 scripts 目录内文件，避免任意路径读取
    const resolved = path.resolve(file);
    if (!resolved.startsWith(path.resolve(__dirname) + path.sep) && resolved !== path.resolve(__dirname, 'seed-questions.json')) {
      throw new Error('题目文件须位于 scripts/ 目录内');
    }
    const items = JSON.parse(fs.readFileSync(resolved, 'utf8'));
    if (!Array.isArray(items) || !items.length) throw new Error('题目文件为空或格式错误');
    const [subjects] = await conn.query('SELECT id, name FROM subjects');
    const subjectMap = new Map(subjects.map((s) => [String(s.name).trim(), s.id]));
    const Q_TYPES = ['single', 'multiple', 'judge'];
    let inserted = 0;
    let skipped = 0;
    await conn.beginTransaction();
    for (const q of items) {
      const subjectName = String(q.subject || '').trim();
      const subjectId = subjectMap.get(subjectName);
      if (!subjectId) throw new Error(`科目不存在：${q.subject}（请先在 subjects 表中添加）`);
      // 复用管理端同口径校验，避免脏数据入库
      if (!Q_TYPES.includes(q.q_type)) throw new Error(`题型不合法：${q.q_type}`);
      const content = String(q.content || '').trim();
      if (!content) throw new Error('存在空题干，已回滚');
      const answer = String(q.answer || '').trim();
      if (!answer) throw new Error(`题目缺少答案：${content.slice(0, 20)}`);
      const difficulty = q.difficulty == null ? 2 : Number(q.difficulty);
      if (!Number.isInteger(difficulty) || difficulty < 1 || difficulty > 5) {
        throw new Error(`难度须为 1～5：${content.slice(0, 20)}`);
      }
      if (q.q_type === 'judge' && !['true', 'false'].includes(answer.toLowerCase())) {
        throw new Error(`判断题答案须为 true/false：${content.slice(0, 20)}`);
      }
      if (q.q_type !== 'judge') {
        if (!Array.isArray(q.options) || q.options.length < 2) throw new Error(`选择题至少 2 个选项：${content.slice(0, 20)}`);
      }
      // 去重：同科目同题干跳过，避免重跑重复插入
      const [[exist]] = await conn.query(
        'SELECT id FROM questions WHERE subject_id = ? AND content = ? LIMIT 1', [subjectId, content]);
      if (exist) { skipped += 1; continue; }
      await conn.query(
        `INSERT INTO questions (subject_id, q_type, content, options, answer, analysis, difficulty, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
        [subjectId, q.q_type, content,
         q.options ? JSON.stringify(q.options) : null,
         answer, q.analysis || null, difficulty]);
      inserted += 1;
    }
    await conn.commit();
    console.log(`导入完成：新增 ${inserted} 道，跳过重复 ${skipped} 道（来源：${path.basename(file)}）`);
    process.exit(0);
  } catch (e) {
    try { await conn.rollback(); } catch (_) { /* ignore */ }
    console.error('导入失败（已回滚）：', e.message);
    process.exit(1);
  } finally {
    try { conn.release(); } catch (_) { /* ignore */ }
    try { await pool.end(); } catch (_) { /* ignore */ }
  }
})();
