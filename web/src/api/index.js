// 接口封装：按用户 / 题库 / 错题 / 计划 / AI / 管理端分组（对应后端 28 个接口）
import request from './request';

// ---- 用户域 ----
export const registerUser = (data) => request.post('/auth/register', data);
export const loginUser = (data) => request.post('/auth/login', data);
export const logoutUser = () => request.post('/auth/logout');
export const getProfile = () => request.get('/user/profile');
export const updateProfile = (data) => request.put('/user/profile', data);
export const getOverview = () => request.get('/home/overview');

// ---- 题库域 ----
export const getSubjects = () => request.get('/subjects');
export const getQuestions = (params) => request.get('/questions', { params });
export const submitAnswer = (data) => request.post('/answers', data);

// ---- 错题域 ----
export const getWrongQuestions = (params) => request.get('/wrong-questions', { params });
export const getWrongDetail = (id) => request.get(`/wrong-questions/${id}`);
export const repracticeWrong = (id, data) => request.post(`/wrong-questions/${id}/repractice`, data);
export const markMastered = (id, mastered) => request.patch(`/wrong-questions/${id}/mastered`, { mastered });

// ---- 计划域 ----
export const generatePlan = (data) => request.post('/plans/generate', data, { timeout: 35000 });
export const getCurrentPlan = () => request.get('/plans/current');
export const getPlanHistory = () => request.get('/plans');
export const checkInTask = (id) => request.patch(`/plan-tasks/${id}/check-in`);

// ---- AI 服务域 ----
export const getAiConfig = () => request.get('/ai/config');
export const getCachedExplanation = (wrongQuestionId) =>
  request.get('/ai/explanations', { params: { wrong_question_id: wrongQuestionId } });
export const generateExplanation = (wrongQuestionId, force = 0) =>
  request.post('/ai/explanations', { wrong_question_id: wrongQuestionId, force }, { timeout: 35000 });

// ---- 管理端 ----
export const adminListQuestions = (params) => request.get('/admin/questions', { params });
export const adminCreateQuestion = (data) => request.post('/admin/questions', data);
export const adminUpdateQuestion = (id, data) => request.put(`/admin/questions/${id}`, data);
export const adminDeleteQuestion = (id) => request.delete(`/admin/questions/${id}`);
export const adminListUsers = (params) => request.get('/admin/users', { params });
export const adminSetUserStatus = (id, status) => request.patch(`/admin/users/${id}/status`, { status });
