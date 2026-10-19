<script setup>
// AI 服务管理（任务书 F8-6）：管理大模型调用与 AI 服务
// 服务配置（模式/模型/密钥等，保存即生效）+ 连通性测试 + 调用统计 + 调用记录审计
import { ref, reactive, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  adminGetAiConfig, adminUpdateAiConfig, adminTestAi, adminAiStats,
  adminListAiGenerations, adminGetAiGeneration
} from '../../api';

const GEN_TYPE_LABEL = { explain: '错题讲解', plan: '复习计划' };

const config = reactive({
  provider: 'mock', model: '', base_url: '', timeout_ms: 30000,
  rate_limit_per_min: 5, api_key_set: false, api_key_masked: '', source: 'env',
  available: true, message: ''
});
// 表单：api_key 留空表示保持不变；点「清除密钥」后保存才清空
const form = reactive({
  provider: 'mock', model: '', base_url: '', api_key: '',
  timeout_ms: 30000, rate_limit_per_min: 5
});
const clearKey = ref(false);
const saving = ref(false);
const testing = ref(false);
const testResult = ref(null); // { ok, message, duration_ms, model }

const stats = reactive({
  overall: { total: 0, success: 0, failed: 0, today: 0, avg_duration_ms: null },
  by_type: [], by_provider: [], trend: []
});

const list = ref([]);
const total = ref(0);
const loading = ref(false);
const loadError = ref(false);
const query = reactive({ page: 1, size: 10, keyword: '', kwInput: '', gen_type: '', status: '' });
const pages = computed(() => Math.max(1, Math.ceil(total.value / query.size)));

const drawerVisible = ref(false);
const drawerLoading = ref(false);
const record = ref(null);

function formatTime(v) {
  return v ? String(v).replace('T', ' ').slice(0, 16) : '—';
}
function formatDuration(ms) {
  if (ms == null) return '—';
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)} 秒` : `${ms} 毫秒`;
}
const successRate = computed(() => {
  const t = stats.overall.total;
  return t ? `${Math.round((stats.overall.success / t) * 100)}%` : '—';
});

// 超时在表单中以秒展示，提交时换算回毫秒
const timeoutSec = computed({
  get: () => Math.round(form.timeout_ms / 1000),
  set: (v) => { form.timeout_ms = Number(v) * 1000; }
});

async function loadConfig() {
  try {
    const data = (await adminGetAiConfig()) || {};
    Object.assign(config, data);
    form.provider = data.provider || 'mock';
    form.model = data.model || '';
    form.base_url = data.base_url || '';
    form.timeout_ms = data.timeout_ms || 30000;
    form.rate_limit_per_min = data.rate_limit_per_min || 5;
    form.api_key = '';
    clearKey.value = false;
  } catch (e) {
    /* 失败由全局拦截器提示 */
  }
}

async function loadStats() {
  try {
    Object.assign(stats, (await adminAiStats()) || {});
  } catch (e) { /* 统计失败不影响其余区块 */ }
}

let listSeq = 0;
async function load() {
  const seq = ++listSeq;
  loading.value = true;
  loadError.value = false;
  try {
    const res = await adminListAiGenerations({
      keyword: query.keyword || undefined,
      gen_type: query.gen_type || undefined,
      status: query.status || undefined,
      page: query.page,
      size: query.size
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

function search() {
  query.keyword = query.kwInput.trim();
  query.page = 1;
  load();
}

async function onSave() {
  if (saving.value) return;
  if (!form.model.trim()) {
    ElMessage.warning('请填写模型名称');
    return;
  }
  try {
    await ElMessageBox.confirm(
      form.provider === 'llm'
        ? '保存后 AI 功能将切换为真实大模型调用（较慢，约 30 秒以上），确认保存？'
        : '保存后 AI 功能将切换为内置模拟模式（mock），确认保存？',
      '配置保存确认',
      { type: 'warning', confirmButtonText: '保存', cancelButtonText: '取消' }
    );
  } catch (e) { return; }
  saving.value = true;
  try {
    const payload = {
      provider: form.provider,
      model: form.model.trim(),
      base_url: form.base_url.trim(),
      timeout_ms: Number(form.timeout_ms),
      rate_limit_per_min: Number(form.rate_limit_per_min)
    };
    if (clearKey.value) payload.api_key = '';
    else if (form.api_key.trim()) payload.api_key = form.api_key.trim();
    await adminUpdateAiConfig(payload);
    ElMessage.success('AI 配置已保存并生效');
    testResult.value = null;
    await loadConfig();
  } catch (e) {
    /* 失败由全局拦截器提示 */
  } finally {
    saving.value = false;
  }
}

async function onTest() {
  if (testing.value) return;
  testing.value = true;
  testResult.value = null;
  try {
    testResult.value = await adminTestAi();
  } catch (e) {
    testResult.value = { ok: false, message: '连通性测试请求失败，请检查服务状态' };
  } finally {
    testing.value = false;
  }
}

async function openDetail(row) {
  drawerVisible.value = true;
  drawerLoading.value = true;
  record.value = null;
  try {
    record.value = await adminGetAiGeneration(row.id);
  } catch (e) {
    /* 失败由全局拦截器提示 */
  } finally {
    drawerLoading.value = false;
  }
}

onMounted(async () => {
  await Promise.all([loadConfig(), loadStats(), load()]);
});
</script>

<template>
  <div class="page-pad">
    <div class="page-head">
      <div>
        <h1>AI 服务管理</h1>
        <p class="sub">管理大模型调用与 AI 服务，配置保存后立即生效。</p>
      </div>
    </div>

    <div class="stat-grid">
      <section class="panel stat-card">
        <div class="label">累计调用</div>
        <div class="value-row"><span class="value">{{ stats.overall.total }}</span><span class="unit">次</span></div>
        <div class="note">讲解与计划生成合计</div>
      </section>
      <section class="panel stat-card">
        <div class="label">成功率</div>
        <div class="value-row"><span class="value">{{ successRate }}</span></div>
        <div class="note">失败 {{ stats.overall.failed }} 次</div>
      </section>
      <section class="panel stat-card">
        <div class="label">今日调用</div>
        <div class="value-row"><span class="value">{{ stats.overall.today }}</span><span class="unit">次</span></div>
        <div class="note">今天发起的生成请求</div>
      </section>
      <section class="panel stat-card">
        <div class="label">平均耗时</div>
        <div class="value-row"><span class="value">{{ stats.overall.avg_duration_ms == null ? '—' : formatDuration(stats.overall.avg_duration_ms) }}</span></div>
        <div class="note">历史调用平均值</div>
      </section>
    </div>

    <!-- 服务配置 -->
    <section class="panel">
      <div class="panel-head">
        <h2>服务配置</h2>
        <span class="tag" :class="config.provider === 'llm' ? 'tag-brand' : 'tag-muted'">
          {{ config.provider === 'llm' ? '大模型模式' : '模拟模式' }}
        </span>
      </div>
      <div class="config-body">
        <div>
          <div class="form-label"><span>AI 模式</span></div>
          <div class="btn-row">
            <button class="type-btn" :class="{ active: form.provider === 'mock' }" @click="form.provider = 'mock'">
              mock（内置模拟）
            </button>
            <button class="type-btn" :class="{ active: form.provider === 'llm' }" @click="form.provider = 'llm'">
              llm（真实大模型）
            </button>
          </div>
        </div>

        <div class="form-grid">
          <div>
            <div class="form-label"><span>模型名称</span></div>
            <input v-model="form.model" class="field" placeholder="如 mimo-v2.6-flash、gpt-4o-mini" />
          </div>
          <div>
            <div class="form-label"><span>接口地址</span></div>
            <input v-model="form.base_url" class="field" placeholder="OpenAI 兼容端点，到 /v1 为止" />
          </div>
          <div class="form-wide">
            <div class="form-label"><span>API Key</span></div>
            <div class="key-row">
              <input
                v-model="form.api_key"
                class="field"
                type="password"
                :placeholder="clearKey ? '保存后将清除密钥' : '留空保持不变，填写则替换'"
                :disabled="clearKey"
              />
              <button class="btn btn-text" @click="clearKey = !clearKey; form.api_key = ''">
                {{ clearKey ? '取消清除' : '清除密钥' }}
              </button>
            </div>
            <p class="field-hint">{{ config.api_key_set ? `当前已配置（${config.api_key_masked}）` : '当前未配置' }}</p>
          </div>
          <div>
            <div class="form-label"><span>单次超时</span></div>
            <div class="unit-field">
              <input v-model.number="timeoutSec" class="field" type="number" min="1" max="600" />
              <span class="unit">秒</span>
            </div>
          </div>
          <div>
            <div class="form-label"><span>每分钟调用上限</span></div>
            <input v-model.number="form.rate_limit_per_min" class="field" type="number" min="1" max="1000" />
          </div>
        </div>

        <div class="config-acts">
          <button class="btn btn-primary" :disabled="saving" @click="onSave">
            {{ saving ? '保存中…' : '保存配置' }}
          </button>
          <button class="btn btn-ghost" :disabled="testing" @click="onTest">
            {{ testing ? '测试中…' : '连通性测试' }}
          </button>
          <span class="text-xs muted">
            生效来源：{{ config.source === 'runtime' ? '后台配置（覆盖 .env）' : '.env 环境变量' }}
          </span>
        </div>

        <div v-if="testResult" class="alert" :class="testResult.ok ? 'alert-ok' : ''">
          <span class="alert-main">
            {{ testResult.ok ? '连通正常' : '连通失败' }}：{{ testResult.message }}
            <template v-if="testResult.duration_ms">（耗时 {{ formatDuration(testResult.duration_ms) }}）</template>
          </span>
        </div>
        <div class="notice">
          <span aria-hidden>ⓘ</span>
          {{ config.message }}
        </div>
      </div>
    </section>

    <!-- 调用记录 -->
    <section class="panel" v-loading="loading">
      <div class="panel-head">
        <h2>调用记录</h2>
      </div>
      <div class="toolbar">
        <input
          v-model="query.kwInput"
          class="field field-search"
          placeholder="按考生账号或错误信息搜索"
          @keyup.enter="search"
        />
        <el-select v-model="query.gen_type" class="field-w140" placeholder="功能类型" aria-label="功能类型">
          <el-option label="全部类型" value="" />
          <el-option label="错题讲解" value="explain" />
          <el-option label="复习计划" value="plan" />
        </el-select>
        <el-select v-model="query.status" class="field-w140" placeholder="调用状态" aria-label="调用状态">
          <el-option label="全部状态" value="" />
          <el-option label="成功" value="success" />
          <el-option label="失败" value="failed" />
        </el-select>
        <button class="btn btn-ghost" @click="search">查询</button>
      </div>

      <div v-if="loadError" class="alert" style="margin: 0 20px 16px">
        <span class="alert-main">调用记录加载失败</span>
        <button class="btn btn-ghost" @click="load()">重新加载</button>
      </div>

      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>ID</th><th>考生</th><th>类型</th><th>提供方</th><th>状态</th>
              <th>耗时</th><th>生成时间</th><th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="g in list" :key="g.id">
              <td class="muted">{{ g.id }}</td>
              <td class="name">{{ g.nickname || g.username || '—' }}</td>
              <td><span class="tag tag-muted">{{ GEN_TYPE_LABEL[g.gen_type] || g.gen_type }}</span></td>
              <td>{{ g.provider }}</td>
              <td>
                <span class="tag" :class="g.status === 'success' ? 'tag-ok' : 'tag-bad'">
                  {{ g.status === 'success' ? '成功' : '失败' }}
                </span>
              </td>
              <td>{{ formatDuration(g.duration_ms) }}</td>
              <td class="muted">{{ formatTime(g.created_at) }}</td>
              <td class="cell-actions">
                <button class="btn btn-ghost btn-xs" @click="openDetail(g)">查看详情</button>
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

    <!-- 调用详情 -->
    <el-drawer v-model="drawerVisible" :title="`AI 调用记录 #${record ? record.id : ''}`" size="520px">
      <div v-loading="drawerLoading">
        <template v-if="record">
          <dl class="info-list">
            <div class="info-row"><dt>考生</dt><dd>{{ record.nickname || record.username || '—' }}</dd></div>
            <div class="info-row"><dt>类型</dt><dd>{{ GEN_TYPE_LABEL[record.gen_type] || record.gen_type }}</dd></div>
            <div class="info-row"><dt>提供方</dt><dd>{{ record.provider }}</dd></div>
            <div class="info-row">
              <dt>状态</dt>
              <dd>
                <span class="tag" :class="record.status === 'success' ? 'tag-ok' : 'tag-bad'">
                  {{ record.status === 'success' ? '成功' : '失败' }}
                </span>
              </dd>
            </div>
            <div class="info-row"><dt>耗时</dt><dd>{{ formatDuration(record.duration_ms) }}</dd></div>
            <div class="info-row"><dt>生成时间</dt><dd>{{ formatTime(record.created_at) }}</dd></div>
            <div v-if="record.error_msg" class="info-row"><dt>错误信息</dt><dd class="text-bad">{{ record.error_msg }}</dd></div>
          </dl>

          <div class="divider-title"><span class="t">生成内容</span><span class="line"></span></div>
          <pre class="code-block">{{ record.content || '（无）' }}</pre>

          <div class="divider-title"><span class="t">提示词</span><span class="line"></span></div>
          <pre class="code-block">{{ record.prompt || '（无）' }}</pre>
        </template>
      </div>
    </el-drawer>
  </div>
</template>

<style scoped>
.config-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
}
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px 24px;
}
.form-grid .form-wide { grid-column: 1 / -1; }
@media (max-width: 767px) {
  .form-grid { grid-template-columns: minmax(0, 1fr); }
}
.field-hint { margin-top: 6px; font-size: 12px; color: var(--text-2); }
.unit-field { display: flex; align-items: center; gap: 8px; }
.unit-field .field { flex: 1; min-width: 0; }
.unit { flex-shrink: 0; font-size: 14px; color: var(--text-2); }
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
.field-w140 { width: 140px; }
.key-row { display: flex; align-items: center; gap: 8px; }
.key-row .field { flex: 1; min-width: 0; }
.config-acts { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; }
.alert-ok {
  border-color: rgba(18, 128, 92, 0.2);
  background: var(--green-soft);
  color: var(--green);
}
.notice {
  display: flex;
  gap: 8px;
  border-radius: 8px;
  background: var(--bg);
  padding: 12px;
  font-size: 12px;
  line-height: 1.625;
  color: var(--text-2);
}
.field-search { width: 240px; }
.name { font-weight: 500; white-space: nowrap; }
.cell-actions { white-space: nowrap; }
.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 0 20px 16px;
}
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

.info-list { margin: 0; border-top: 1px solid var(--border); }
.info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 0;
  border-bottom: 1px solid var(--border);
  font-size: 14px;
}
.info-row dt { color: var(--text-2); margin: 0; flex-shrink: 0; }
.info-row dd { margin: 0; text-align: right; word-break: break-all; }
.code-block {
  margin: 0;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg);
  font-size: 12px;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 260px;
  overflow: auto;
}
</style>
