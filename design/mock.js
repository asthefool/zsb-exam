/* ============================================================
   静态设计稿交互脚本（仅用于设计稿演示，不进生产代码）
   1. 注入 SVG 图标精灵（避免四页重复内联）
   2. 侧边栏移动端抽屉开合
   3. 右侧详情抽屉开合
   4. 答题选项选择 / 筛选胶囊 / Tab / 任务打卡 / 密码可见性
   ============================================================ */
(function () {
  'use strict';

  /* ---------- 图标精灵 ---------- */
  var S = 'fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"';
  var SPRITE =
    '<svg xmlns="http://www.w3.org/2000/svg" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true"><defs>' +

    /* 品牌 / AI：六芒星芒（Claude 招牌记号的抽象化） */
    '<symbol id="i-spark" viewBox="0 0 24 24"><g fill="currentColor">' +
      '<path d="M12 1.4c.95 4.3 1.5 7.55 0 10.6-1.5-3.05-.95-6.3 0-10.6Z"/>' +
      '<path d="M12 1.4c.95 4.3 1.5 7.55 0 10.6-1.5-3.05-.95-6.3 0-10.6Z" transform="rotate(60 12 12)"/>' +
      '<path d="M12 1.4c.95 4.3 1.5 7.55 0 10.6-1.5-3.05-.95-6.3 0-10.6Z" transform="rotate(120 12 12)"/>' +
      '<path d="M12 12c1.5 3.05.95 6.3 0 10.6-.95-4.3-1.5-7.55 0-10.6Z"/>' +
      '<path d="M12 12c1.5 3.05.95 6.3 0 10.6-.95-4.3-1.5-7.55 0-10.6Z" transform="rotate(60 12 12)"/>' +
      '<path d="M12 12c1.5 3.05.95 6.3 0 10.6-.95-4.3-1.5-7.55 0-10.6Z" transform="rotate(120 12 12)"/>' +
    '</g></symbol>' +

    '<symbol id="i-plan" viewBox="0 0 24 24"><g ' + S + '><rect x="3.2" y="4.8" width="17.6" height="16" rx="2.4"/>' +
      '<path d="M3.2 9.6h17.6M8 3.2v3.2M16 3.2v3.2M8.4 14.6l2 2 3.6-4"/></g></symbol>' +

    '<symbol id="i-book" viewBox="0 0 24 24"><g ' + S + '><path d="M4 5.2A2 2 0 0 1 6 3.2h5.2v17.6H6a2 2 0 0 1-2-2Z"/>' +
      '<path d="M20 5.2a2 2 0 0 0-2-2h-5.2v17.6H18a2 2 0 0 0 2-2Z"/></g></symbol>' +

    '<symbol id="i-exam" viewBox="0 0 24 24"><g ' + S + '><circle cx="12" cy="13.2" r="8"/>' +
      '<path d="M12 8.8v4.4l3 1.8M9 2.4h6M12 2.4v2.8"/></g></symbol>' +

    '<symbol id="i-mark" viewBox="0 0 24 24"><g ' + S + '><path d="M6.4 3.6h11.2a1 1 0 0 1 1 1v16.2l-6.6-4.2-6.6 4.2V4.6a1 1 0 0 1 1-1Z"/></g></symbol>' +

    '<symbol id="i-chart" viewBox="0 0 24 24"><g ' + S + '><path d="M4 20h16M6.5 20V11M12 20V4.5M17.5 20v-6"/></g></symbol>' +

    '<symbol id="i-user" viewBox="0 0 24 24"><g ' + S + '><circle cx="12" cy="8.4" r="3.8"/>' +
      '<path d="M4.8 20.2a7.2 7.2 0 0 1 14.4 0"/></g></symbol>' +

    '<symbol id="i-shield" viewBox="0 0 24 24"><g ' + S + '><path d="M12 3 5 5.8v5.4c0 4.4 2.9 8.2 7 9.4 4.1-1.2 7-5 7-9.4V5.8Z"/>' +
      '<path d="M9.4 12.2l1.9 1.9 3.5-3.8"/></g></symbol>' +

    '<symbol id="i-check" viewBox="0 0 24 24"><g ' + S + ' stroke-width="2.4"><path d="M4.8 12.6l4.6 4.6L19.2 7"/></g></symbol>' +

    '<symbol id="i-x" viewBox="0 0 24 24"><g ' + S + ' stroke-width="2"><path d="M6 6l12 12M18 6 6 18"/></g></symbol>' +

    '<symbol id="i-chev-d" viewBox="0 0 24 24"><g ' + S + ' stroke-width="2"><path d="M6 9.5l6 6 6-6"/></g></symbol>' +
    '<symbol id="i-chev-r" viewBox="0 0 24 24"><g ' + S + ' stroke-width="2"><path d="M9.5 6l6 6-6 6"/></g></symbol>' +
    '<symbol id="i-chev-l" viewBox="0 0 24 24"><g ' + S + ' stroke-width="2"><path d="M14.5 6l-6 6 6 6"/></g></symbol>' +
    '<symbol id="i-arrow-r" viewBox="0 0 24 24"><g ' + S + ' stroke-width="1.9"><path d="M4.5 12h15M13.5 6l6 6-6 6"/></g></symbol>' +

    '<symbol id="i-menu" viewBox="0 0 24 24"><g ' + S + ' stroke-width="1.9"><path d="M4 7h16M4 12h16M4 17h16"/></g></symbol>' +

    '<symbol id="i-refresh" viewBox="0 0 24 24"><g ' + S + '><path d="M20 12a8 8 0 1 1-2.6-5.9"/>' +
      '<path d="M20.2 4v4.4h-4.4"/></g></symbol>' +

    '<symbol id="i-search" viewBox="0 0 24 24"><g ' + S + '><circle cx="11" cy="11" r="6.4"/><path d="M15.8 15.8 20 20"/></g></symbol>' +

    '<symbol id="i-eye" viewBox="0 0 24 24"><g ' + S + '><path d="M2.6 12S6 6.2 12 6.2 21.4 12 21.4 12 18 17.8 12 17.8 2.6 12 2.6 12Z"/>' +
      '<circle cx="12" cy="12" r="2.8"/></g></symbol>' +

    '<symbol id="i-eye-off" viewBox="0 0 24 24"><g ' + S + '><path d="M4 4.4l15.6 15.6M9.6 9.7A2.8 2.8 0 0 0 12 14.8c.7 0 1.4-.3 1.9-.7"/>' +
      '<path d="M6.4 6.9C4 8.5 2.6 12 2.6 12S6 17.8 12 17.8c1.6 0 3-.4 4.2-1M18.6 15c1.7-1.4 2.8-3 2.8-3S18 6.2 12 6.2c-.7 0-1.4.1-2 .2"/></g></symbol>' +

    '<symbol id="i-target" viewBox="0 0 24 24"><g ' + S + '><circle cx="12" cy="12" r="8.4"/><circle cx="12" cy="12" r="4.4"/>' +
      '<circle cx="12" cy="12" r=".9" fill="currentColor" stroke="none"/></g></symbol>' +

    '<symbol id="i-bulb" viewBox="0 0 24 24"><g ' + S + '><path d="M9.2 17.4a6 6 0 1 1 5.6 0v1.8a1.4 1.4 0 0 1-1.4 1.4h-2.8a1.4 1.4 0 0 1-1.4-1.4Z"/>' +
      '<path d="M9.6 21h4.8"/></g></symbol>' +

    '<symbol id="i-alert" viewBox="0 0 24 24"><g ' + S + '><path d="M12 3.8 2.8 19.6h18.4Z"/><path d="M12 9.6v4.2M12 16.6v.1"/></g></symbol>' +

    '<symbol id="i-tag" viewBox="0 0 24 24"><g ' + S + '><path d="M11.4 3.4H20v8.6l-8.8 8.8a1.4 1.4 0 0 1-2 0l-6.6-6.6a1.4 1.4 0 0 1 0-2Z"/>' +
      '<circle cx="16.2" cy="7.6" r="1.3"/></g></symbol>' +

    '<symbol id="i-clock" viewBox="0 0 24 24"><g ' + S + '><circle cx="12" cy="12" r="8.6"/><path d="M12 7v5.2l3.4 2"/></g></symbol>' +

    '<symbol id="i-flame" viewBox="0 0 24 24"><g ' + S + '><path d="M12 21.4c3.6 0 6.2-2.5 6.2-5.9 0-4.3-3.6-5.9-4.4-10.9-2.6 1.4-3.6 3.9-3.6 5.9 0 1.2.5 2 .5 2.7 0 1-.8 1.6-1.7 1.6-1.1 0-1.8-.9-1.9-2.2-1 1.2-1.3 2.6-1.3 4 0 3 2.4 4.8 6.2 4.8Z"/></g></symbol>' +

    '<symbol id="i-layers" viewBox="0 0 24 24"><g ' + S + '><path d="M12 3.4 3.4 8 12 12.6 20.6 8Z"/><path d="M3.4 12.6 12 17.2l8.6-4.6M3.4 16.8 12 21.4l8.6-4.6"/></g></symbol>' +

    '<symbol id="i-doc" viewBox="0 0 24 24"><g ' + S + '><path d="M13.6 3.4H7a1.6 1.6 0 0 0-1.6 1.6v14a1.6 1.6 0 0 0 1.6 1.6h10a1.6 1.6 0 0 0 1.6-1.6V8.4Z"/>' +
      '<path d="M13.6 3.4v5h5M8.6 13h6.8M8.6 16.6h4.6"/></g></symbol>' +

    '<symbol id="i-inbox" viewBox="0 0 24 24"><g ' + S + '><path d="M3.4 13.4 6 5.2a1.6 1.6 0 0 1 1.5-1.1h9a1.6 1.6 0 0 1 1.5 1.1l2.6 8.2v4.4a1.6 1.6 0 0 1-1.6 1.6H5a1.6 1.6 0 0 1-1.6-1.6Z"/>' +
      '<path d="M3.4 13.4h4.2l1.2 2.4h6.4l1.2-2.4h4.2"/></g></symbol>' +

    '</defs></svg>';

  document.body.insertAdjacentHTML('afterbegin', SPRITE);

  /* ---------- 移动端侧边栏 ---------- */
  var sidebar = document.querySelector('.sidebar');
  var sideScrim = document.getElementById('sideScrim');

  function closeSidebar() {
    if (!sidebar) return;
    sidebar.classList.remove('open');
    if (sideScrim) sideScrim.hidden = true;
  }

  document.querySelectorAll('[data-burger]').forEach(function (b) {
    b.addEventListener('click', function () {
      if (!sidebar) return;
      var open = sidebar.classList.toggle('open');
      if (sideScrim) sideScrim.hidden = !open;
    });
  });
  if (sideScrim) sideScrim.addEventListener('click', closeSidebar);

  /* ---------- 抽屉 ---------- */
  function bindDrawer(root) {
    var panel = root.querySelector('[data-drawer]');
    var mask = root.querySelector('[data-drawer-scrim]');
    if (!panel) return;
    function open() { panel.hidden = false; if (mask) mask.hidden = false; document.body.style.overflow = 'hidden'; }
    function close() { panel.hidden = true; if (mask) mask.hidden = true; document.body.style.overflow = ''; }
    root.querySelectorAll('[data-drawer-open]').forEach(function (t) { t.addEventListener('click', open); });
    root.querySelectorAll('[data-drawer-close]').forEach(function (t) { t.addEventListener('click', close); });
    if (mask) mask.addEventListener('click', close);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden) close(); });
    /* 设计稿默认展开，便于评审 */
    if (panel.hasAttribute('data-drawer-start-open')) open();
  }
  bindDrawer(document);

  /* ---------- 单选/多选答题 ---------- */
  document.querySelectorAll('[data-opts]').forEach(function (group) {
    var multi = group.getAttribute('data-opts') === 'multi';
    if (group.classList.contains('locked')) return;
    group.addEventListener('click', function (e) {
      var opt = e.target.closest('.opt');
      if (!opt || group.contains(opt) === false) return;
      if (multi) opt.classList.toggle('selected');
      else {
        group.querySelectorAll('.opt').forEach(function (o) { o.classList.remove('selected'); });
        opt.classList.add('selected');
      }
      group.querySelectorAll('input').forEach(function (i) { i.checked = i.closest('.opt').classList.contains('selected'); });
      /* 有选择后放开提交按钮 */
      var form = group.closest('[data-q-form]');
      if (form) {
        var submit = form.querySelector('[data-submit-btn]');
        if (submit) submit.disabled = !group.querySelector('.opt.selected');
      }
    });
  });

  /* ---------- 互斥高亮：胶囊 / Tab / 题号 ---------- */
  function bindGroup(sel, itemSel, activeCls) {
    document.querySelectorAll(sel).forEach(function (group) {
      group.addEventListener('click', function (e) {
        var item = e.target.closest(itemSel);
        if (!item || !group.contains(item)) return;
        group.querySelectorAll(itemSel).forEach(function (i) { i.classList.remove(activeCls); });
        item.classList.add(activeCls);
      });
    });
  }
  bindGroup('[data-exclusive]', '.pill', 'active');
  bindGroup('[data-tabs]', '.tab', 'active');

  /* ---------- 任务打卡 ---------- */
  document.querySelectorAll('[data-task]').forEach(function (t) {
    t.addEventListener('click', function () {
      t.classList.toggle('done');
      var badge = t.querySelector('[data-task-badge]');
      if (badge) badge.textContent = t.classList.contains('done') ? '已完成' : '打卡';
      badge.className = 'tag ' + (t.classList.contains('done') ? 'tag-sage' : 'tag-coral');
    });
  });

  /* ---------- 密码可见性 ---------- */
  document.querySelectorAll('[data-eye]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var input = document.getElementById(btn.getAttribute('data-eye'));
      if (!input) return;
      var show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      btn.querySelector('use').setAttribute('href', show ? '#i-eye-off' : '#i-eye');
    });
  });

  /* ---------- 侧边栏当前项：按文件名高亮 ---------- */
  var file = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  document.querySelectorAll('.nav-item[data-page]').forEach(function (a) {
    if (a.getAttribute('data-page').toLowerCase() === file) {
      a.closest('.nav').querySelectorAll('.nav-item').forEach(function (i) { i.classList.remove('active'); });
      a.classList.add('active');
    }
  });
})();
