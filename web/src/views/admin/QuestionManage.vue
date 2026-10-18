<script setup>
// 题目管理（对齐 UI 库 admin/QuestionManage.tsx 结构）：原生表格 + 弹窗表单，真实增删改查（软删）
// 编辑保存后 updated_at 变化会使旧 AI 讲解缓存自动失效
import { ref, reactive, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  getSubjects, adminListQuestions, adminCreateQuestion,
  adminUpdateQuestion, adminDeleteQuestion, adminQuestionStats
} from '../../api';
import { Q_TYPE_LABEL, difficultyMeta } from '../../constants.js';

const typeName = Q_TYPE_LABEL;
const L = 'ABCDEFGH';

const stats = reactive({ total: 0, enabled_total: 0, disabled_total: 0, today_new: 0 });
const subjects = ref([]);
const list = ref([]);
const total = ref(0);
const loading = ref(false);
const loadError = ref(false);
const saving = ref(false);
const deleting = ref(false);

const query = reactive({ page: 1, size: 10, keyword: '', kwInput: '' });
const pages = computed(() => Math.max(1, Math.ceil(total.value / query.size)));

const editingId = ref(null);
const dialogVisible = ref(false);
const err = reactive({});
const emptyForm = () => ({
  subject_id: null, q_type: 'single', content: '', options: [
    { key: 'A', text: '' }, { key: 'B', text: '' }, { key: 'C', text: '' }, { key: 'D', text: '' }
  ],
  answer: '', analysis: '', difficulty: 2, status: 1
});
const form = reactive(emptyForm());

function safeParseOptions(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map((o) => ({ ...o }));
  if (typeof raw !== 'string') return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map((o) => ({ ...o })) : [];
  } catch {
    return [];
  }
}

const formatAnswer = (row) => {
  if (!row) return '—';
  if (row.q_type === 'judge') return row.answer === 'true' ? '对' : row.answer === 'false' ? '错' : (row.answer || '—');
  return row.answer || '—';
};

let listSeq = 0;
async function load() {
  const seq = ++listSeq;
  loading.value = true;
  loadError.value = false;
  try {
    const res = await adminListQuestions({
      keyword: query.keyword || undefined, page: query.page, size: query.size
    });
    if (seq !== listSeq) return;
    list.value = (res && res.list) || [];
    total.value = (res && res.total) || 0;
  } catch (e) {
    if (seq !== listSeq) return;
    loadError.value = true;
    list.value = [];
    total.value = 0;
  } finally {
    if (seq === listSeq) loading.value = false;
  }
}

async function loadStats() {
  try {
    Object.assign(stats, (await adminQuestionStats()) || {});
  } catch (e) { /* 统计失败不影响列表 */ }
}

function search() {
  query.keyword = query.kwInput.trim();
  query.page = 1;
  load();
}

function resetFilters() {
  query.kwInput = '';
  query.keyword = '';
  query.page = 1;
  load();
}

function openDialog(row) {
  Object.keys(err).forEach((k) => delete err[k]);
  if (row) {
    editingId.value = row.id;
    form.subject_id = row.subject_id;
    form.q_type = row.q_type;
    form.content = row.content;
    form.options = safeParseOptions(row.options).length ? safeParseOptions(row.options) : emptyForm().options;
    form.answer = row.answer || '';
    form.analysis = row.analysis || '';
    form.difficulty = row.difficulty || 2;
    form.status = row.status;
  } else {
    editingId.value = null;
    Object.assign(form, emptyForm());
  }
  dialogVisible.value = true;
}

function setQType(t) {
  form.q_type = t;
  form.answer = '';
  if (t !== 'judge' && (!form.options || form.options.length < 2)) {
    form.options = emptyForm().options;
  }
}

function addOption() {
  if (form.options.length >= 8) return;
  form.options.push({ key: L[form.options.length], text: '' });
}
function removeOption(i) {
  form.options.splice(i, 1);
  form.options.forEach((o, k) => { o.key = L[k]; });
  form.answer = '';
}

function validate() {
  Object.keys(err).forEach((k) => delete err[k]);
  if (!form.subject_id) err.subject = '请选择科目';
  if (!String(form.content).trim()) err.content = '题干不能为空';
  if (form.q_type !== 'judge') {
    const opts = form.options.filter((o) => String(o.text || '').trim());
    if (form.options.length < 2 || form.options.some((o) => !String(o.text || '').trim())) {
      err.options = '选择题至少 2 个选项且内容不能为空';
    }
    const a = String(form.answer || '').trim().toUpperCase();
    if (!a) err.answer = '请设置正确答案';
    else if (new Set(a).size !== a.length) err.answer = '正确答案字母不能重复';
    else if ([...a].some((c) => L.indexOf(c) < 0 || L.indexOf(c) >= form.options.length)) {
      err.answer = `答案包含不存在的选项字母：${[...a].find((c) => L.indexOf(c) < 0 || L.indexOf(c) >= form.options.length)}`;
    } else if (form.q_type === 'single' && a.length !== 1) err.answer = '单选题只能有一个正确答案';
    else if (opts.length < 2) err.options = '选择题至少 2 个选项且内容不能为空';
  } else if (!['true', 'false'].includes(form.answer)) {
    err.answer = '判断题请在「正确/错误」中选择一项';
  }
  return !Object.keys(err).length;
}

async function onSave() {
  if (!validate()) return;
  saving.value = true;
  try {
    const payload = {
      subject_id: form.subject_id,
      q_type: form.q_type,
      content: form.content,
      options: form.q_type === 'judge' ? [] : form.options.filter((o) => String(o.text || '').trim()),
      answer: form.q_type === 'judge' ? form.answer : String(form.answer).trim().toUpperCase(),
      analysis: form.analysis,
      difficulty: form.difficulty,
      status: form.status
    };
    if (editingId.value) {
      await adminUpdateQuestion(editingId.value, payload);
      ElMessage.success('题目已更新');
    } else {
      await adminCreateQuestion(payload);
      ElMessage.success('题目已创建');
    }
    dialogVisible.value = false;
    load();
    loadStats();
  } catch (e) {
    /* 失败由全局拦截器提示 */
  } finally {
    saving.value = false;
  }
}

async function onDelete(row) {
  try {
    await ElMessageBox.confirm(
      `删除题目「${String(row.content).slice(0, 20)}…」？软删除后考生端不再展示，历史作答记录保留。`,
      '删除确认',
      { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' }
    );
  } catch (e) { return; }
  deleting.value = true;
  try {
    await adminDeleteQuestion(row.id);
    ElMessage.success('已删除（软删）');
    load();
    loadStats();
  } catch (e) {
    /* 失败由全局拦截器提示 */
  } finally {
    deleting.value = false;
  }
}

onMounted(async () => {
  loadStats();
  try {
    subjects.value = await getSubjects();
  } catch (e) { subjects.value = []; }
  await load();
});
</script>

<template>
  <div class="page-pad">
    <div class="page-head">
      <div>
        <h1>题目管理</h1>
        <p class="sub">维护题库中的题目，支持新建、编辑与软删除，修改后考生端与 AI 讲解自动同步。</p>
      </div>
      <button class="btn btn-primary" @click="openDialog()">新建题目</button>
    </div>

    <div class="stat-grid">
      <section class="panel stat-card">
        <div class="label">题目总数</div>
        <div class="value-row"><span class="value">{{ stats.total }}</span><span class="unit">题</span></div>
        <div class="note">题库中未删除的题目</div>
      </section>
      <section class="panel stat-card">
        <div class="label">启用中</div>
        <div class="value-row"><span class="value">{{ stats.enabled_total }}</span><span class="unit">题</span></div>
        <div class="note">考生端可见的题目</div>
      </section>
      <section class="panel stat-card">
        <div class="label">已停用</div>
        <div class="value-row"><span class="value">{{ stats.disabled_total }}</span><span class="unit">题</span></div>
        <div class="note">暂不向考生展示</div>
      </section>
      <section class="panel stat-card">
        <div class="label">今日新增</div>
        <div class="value-row"><span class="value">{{ stats.today_new }}</span><span class="unit">题</span></div>
        <div class="note">今天录入的题目</div>
      </section>
    </div>

    <section class="panel" v-loading="loading">
      <div class="toolbar">
        <input
          v-model="query.kwInput"
          class="field field-search"
          placeholder="按题干关键词搜索"
          @keyup.enter="search"
        />
        <button class="btn btn-ghost" @click="search">查询</button>
        <button class="btn btn-text" @click="resetFilters">重置</button>
      </div>

      <div v-if="loadError" class="alert" style="margin: 0 20px 16px">
        <span class="alert-main">题目列表加载失败</span>
        <button class="btn btn-ghost" @click="load()">重新加载</button>
      </div>

      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>ID</th><th>科目</th><th>题型</th><th>题干</th><th>正确答案</th><th>难度</th><th>状态</th><th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="q in list" :key="q.id">
              <td class="muted">{{ q.id }}</td>
              <td>{{ q.subject_name }}</td>
              <td><span class="tag tag-muted">{{ typeName[q.q_type] || q.q_type }}</span></td>
              <td class="cell-content" :title="q.content">{{ q.content }}</td>
              <td>{{ formatAnswer(q) }}</td>
              <td><span class="tag" :class="difficultyMeta(q.difficulty).cls" :title="`难度 ${q.difficulty}`">{{ difficultyMeta(q.difficulty).label }}</span></td>
              <td>
                <span class="tag" :class="q.status === 1 ? 'tag-ok' : 'tag-bad'">
                  {{ q.status === 1 ? '启用' : '停用' }}
                </span>
              </td>
              <td class="cell-actions">
                <button class="btn btn-ghost btn-xs" @click="openDialog(q)">编辑</button>
                <button class="btn btn-danger btn-xs" :disabled="deleting" @click="onDelete(q)">删除</button>
              </td>
            </tr>
            <tr v-if="!list.length && !loading" class="empty">
              <td colspan="8">暂无数据</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pager">
        <span>共 {{ total }} 条</span>
        <button class="btn btn-ghost" :disabled="query.page <= 1" @click="query.page--; load()">上一页</button>
        <span class="page-num">{{ query.page }} / {{ pages }}</span>
        <button class="btn btn-ghost" :disabled="query.page >= pages" @click="query.page++; load()">下一页</button>
      </div>
    </section>

    <!-- 编辑/新建弹窗 -->
    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑题目' : '新建题目'" width="680px" destroy-on-close>
      <div class="form">
        <div>
          <div class="form-label"><span>科目</span></div>
          <el-select v-model="form.subject_id" class="field-w60" placeholder="选择科目">
            <el-option v-for="s in subjects" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
          <div v-if="err.subject" class="form-error">{{ err.subject }}</div>
        </div>

        <div>
          <div class="form-label"><span>题型</span></div>
          <div class="btn-row">
            <button
              v-for="(label, key) in typeName"
              :key="key"
              class="type-btn"
              :class="{ active: form.q_type === key }"
              @click="setQType(key)"
            >{{ label }}</button>
          </div>
        </div>

        <div>
          <div class="form-label"><span>题干</span><span class="hint">{{ form.content.length }}/500</span></div>
          <textarea v-model="form.content" class="field" rows="3" maxlength="500"></textarea>
          <div v-if="err.content" class="form-error">{{ err.content }}</div>
        </div>

        <div v-if="form.q_type !== 'judge'">
          <div class="form-label"><span>选项</span></div>
          <div class="opt-edit">
            <div v-for="(o, i) in form.options" :key="i" class="opt-row">
              <span class="opt-key">{{ o.key }}</span>
              <input v-model="o.text" class="field" :placeholder="`选项 ${o.key} 内容`" />
              <button v-if="form.options.length > 2" class="link-del" @click="removeOption(i)">删除</button>
            </div>
            <button v-if="form.options.length < 8" class="link-add" @click="addOption">+ 添加选项</button>
          </div>
          <div v-if="err.options" class="form-error">{{ err.options }}</div>
        </div>

        <div>
          <div class="form-label"><span>{{ form.q_type === 'judge' ? '正确答案' : '正确项' }}</span></div>
          <div v-if="form.q_type === 'judge'" class="btn-row">
            <button class="type-btn" :class="{ active: form.answer === 'true' }" @click="form.answer = 'true'">对</button>
            <button class="type-btn" :class="{ active: form.answer === 'false' }" @click="form.answer = 'false'">错</button>
          </div>
          <input
            v-else
            v-model="form.answer"
            class="field field-w60"
            :placeholder="form.q_type === 'multiple' ? '如 ABD（多选项字母连写）' : '如 A'"
          />
          <div v-if="err.answer" class="form-error">{{ err.answer }}</div>
        </div>

        <div>
          <div class="form-label"><span>解析</span><span class="hint">{{ (form.analysis || '').length }}/500</span></div>
          <textarea v-model="form.analysis" class="field" rows="3" maxlength="500" placeholder="用于判分后展示与 AI 讲解参考"></textarea>
        </div>

        <div class="two-col">
          <div>
            <div class="form-label"><span>难度</span></div>
            <div class="stars">
              <button
                v-for="n in 5"
                :key="n"
                class="star"
                :class="{ on: n <= form.difficulty }"
                :aria-label="`难度 ${n}`"
                @click="form.difficulty = n"
              >★</button>
              <span class="hint">（1 最易 ~ 5 最难）</span>
            </div>
          </div>
          <div>
            <div class="form-label"><span>状态</span></div>
            <button class="switch-row" role="switch" :aria-checked="!!form.status" @click="form.status = form.status ? 0 : 1">
              <span class="switch" :class="{ on: !!form.status }"><i></i></span>
              {{ form.status ? '启用' : '停用' }}
            </button>
          </div>
        </div>
      </div>

      <template #footer>
        <button class="btn btn-ghost" @click="dialogVisible = false">取消</button>
        <button class="btn btn-primary" :disabled="saving" @click="onSave">{{ saving ? '保存中…' : '保存' }}</button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 16px 20px;
}
.field-search { width: 240px; }
.cell-content {
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cell-actions { white-space: nowrap; }
.btn-xs { padding: 6px 14px; font-size: 14px; }
.pager {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  font-size: 14px;
  color: var(--text-2);
}
.page-num { color: var(--text); }

/* 弹窗表单 */
.form { display: flex; flex-direction: column; gap: 20px; }
.field-w60 { width: 240px; }
.btn-row { display: flex; gap: 8px; }
.type-btn {
  border: 1px solid var(--border);
  background: var(--card);
  border-radius: 8px;
  padding: 6px 16px;
  font-size: 14px;
  color: var(--text);
  transition: border-color 0.15s, background-color 0.15s, color 0.15s;
}
.type-btn:hover { border-color: rgba(29, 79, 215, 0.6); }
.type-btn.active { border-color: var(--primary); background: var(--primary-soft); color: var(--primary); }
.opt-edit { display: flex; flex-direction: column; gap: 8px; }
.opt-row { display: flex; align-items: center; gap: 8px; }
.opt-key { width: 20px; font-size: 14px; font-weight: 700; color: var(--text-2); }
.link-del {
  border: none;
  background: none;
  flex-shrink: 0;
  font-size: 14px;
  color: var(--text-2);
}
.link-del:hover { color: var(--red); }
.link-add {
  border: none;
  background: none;
  align-self: flex-start;
  margin-top: 8px;
  font-size: 14px;
  color: var(--primary);
}
.link-add:hover { text-decoration: underline; }
.two-col {
  display: flex;
  flex-wrap: wrap;
  gap: 16px 40px;
}
.stars { display: flex; align-items: center; gap: 4px; }
.star {
  border: none;
  background: none;
  font-size: 20px;
  line-height: 1;
  color: var(--border);
}
.star.on { color: var(--amber); }
.switch-row {
  display: flex;
  align-items: center;
  gap: 8px;
  border: none;
  background: none;
  padding: 0;
  font-size: 14px;
  color: var(--text);
}
.switch {
  position: relative;
  width: 36px;
  height: 20px;
  border-radius: 999px;
  background: var(--border);
  transition: background-color 0.15s;
}
.switch.on { background: var(--primary); }
.switch i {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  border-radius: 999px;
  background: #fff;
  transition: left 0.15s;
}
.switch.on i { left: 18px; }
</style>
