// 题库与错题域路由（F3/F4）
const router = require('express').Router();
const { ok, wrap, requireFields, pager } = require('../utils/response');
const questionService = require('../services/questionService');
const answerService = require('../services/answerService');
const wrongService = require('../services/wrongService');
const { verifyToken } = require('../middleware/auth');

// ---- 题库（F3）----
router.get('/subjects', verifyToken, wrap(async (req, res) => {
  ok(res, await questionService.listSubjects());
}));

router.get('/questions', verifyToken, wrap(async (req, res) => {
  const p = pager(req.query);
  const data = await questionService.listQuestions({
    subjectId: req.query.subject_id, qType: req.query.q_type, ...p
  });
  ok(res, { ...data, page: p.page, size: p.size });
}));

router.get('/questions/:id', verifyToken, wrap(async (req, res) => {
  ok(res, await questionService.getQuestion(Number(req.params.id)));
}));

// 提交作答并判分：事务内写答题记录并归集错题（AC2/AC3）
router.post('/answers', verifyToken, wrap(async (req, res) => {
  requireFields(req.body, ['question_id', 'user_answer']);
  ok(res, await answerService.submit(req.user.id, req.body));
}));

// ---- 错题本（F4）----
router.get('/wrong-questions', verifyToken, wrap(async (req, res) => {
  const p = pager(req.query);
  const data = await wrongService.list(req.user.id, {
    subjectId: req.query.subject_id, mastered: req.query.mastered, ...p
  });
  ok(res, data);
}));

router.get('/wrong-questions/:id', verifyToken, wrap(async (req, res) => {
  ok(res, await wrongService.detail(req.user.id, Number(req.params.id)));
}));

router.post('/wrong-questions/:id/repractice', verifyToken, wrap(async (req, res) => {
  requireFields(req.body, ['user_answer']);
  ok(res, await wrongService.repractice(req.user.id, Number(req.params.id), req.body));
}));

router.patch('/wrong-questions/:id/mastered', verifyToken, wrap(async (req, res) => {
  requireFields(req.body, ['mastered']);
  ok(res, await wrongService.markMastered(req.user.id, Number(req.params.id), req.body));
}));

module.exports = router;
