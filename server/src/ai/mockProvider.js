// mock Provider：内置规则模板生成讲解与计划，无外部依赖
// 输出明确标注「模拟讲解」，供无 API Key 时开发联调与答辩演示
const planEngine = require('./planEngine');

const Q_TYPE_TEXT = { single: '单选题', multiple: '多选题', judge: '判断题' };

function optionsText(ctx) {
  if (!ctx.options) return '（无选项）';
  let opts = ctx.options;
  if (typeof opts === 'string') {
    try { opts = JSON.parse(opts); } catch (e) { return String(opts); }
  }
  if (!Array.isArray(opts) || !opts.length) return '（无选项）';
  return opts.map((o) => (typeof o === 'object' ? `${o.key}. ${o.text}` : String(o))).join('；');
}

function explain(ctx) {
  const typeText = Q_TYPE_TEXT[ctx.q_type] || ctx.q_type;
  const lines = [];
  lines.push('【模拟讲解】当前为内置规则生成的讲解（mock 模式，配置真实大模型 API Key 后切换为模型讲解），仅供参考。');
  lines.push('');
  lines.push('## 一、错因分析');
  lines.push(`本题是${ctx.subject_name || ''}${typeText}。你的答案是「${ctx.user_answer || '未作答'}」，正确答案是「${ctx.answer}」。`);
  const wasWrong = ctx.user_answer && String(ctx.user_answer).toUpperCase() !== String(ctx.answer).toUpperCase();
  if (wasWrong) {
    if (ctx.q_type === 'multiple') {
      lines.push('多选题常见错因是漏选或错选：请逐项核对每个选项的正误依据，避免凭印象勾选。');
    } else if (ctx.q_type === 'judge') {
      lines.push('判断题常见错因是对概念边界记忆模糊：注意题干中的绝对化表述（如「一定」「所有」）是否成立。');
    } else {
      lines.push('单选答错通常是知识点掌握不牢或审题偏差：请对照下面的解题步骤，定位卡壳的环节。');
    }
  } else {
    lines.push('你最近一次作答与正确答案一致。本讲解用于巩固：请仍按下面步骤复盘思路，确认是「会做」而不是「蒙对」。');
  }
  if (ctx.wrong_count > 1) lines.push(`注意：这道题你已累计答错 ${ctx.wrong_count} 次，建议加入重点复习。`);
  lines.push('');
  lines.push('## 二、解题思路与步骤');
  lines.push(ctx.analysis ? ctx.analysis : '本题题库暂未收录解析，请结合教材对应章节核对正确选项的依据。');
  lines.push('');
  lines.push('## 三、知识点提示');
  lines.push(`本题考查「${ctx.subject_name || '本科目'}」相关知识点。建议回到考纲对应章节重新梳理概念，再找 3-5 道同类题巩固，两天后重练本题检验掌握情况。`);
  return lines.join('\n');
}

async function generate(type, context) {
  if (type === 'explain') {
    // 服务层统一以 { prompt, context } 信封传参，此处兼容信封与裸 context 两种形态
    const ctx = context && context.context ? context.context : context;
    return { content: explain(ctx), provider: 'mock' };
  }
  if (type === 'plan') {
    // mock 模式下服务层直接调用 planEngine；此处兜底返回 JSON 字符串
    return { content: JSON.stringify(planEngine.buildTasks(context.planContext)), provider: 'mock' };
  }
  throw new Error(`mock provider 不支持的类型：${type}`);
}

module.exports = { generate };
