// 接口封装：按用户 / 题库 / 错题 / 计划 / AI / 管理端分组
import request from './request';
import { TIMEOUT } from '../constants.js';

// ---- 用户域 ----
export const registerUser = (data) => request.post('/auth/register', data);
export const loginUser = (data) => request.post('/auth/login', data);
export const logoutUser = () => request.post('/auth/logout');
export const getProfile = () => request.get('/user/profile');
export const updateProfile = (data) => request.put('/user/profile', data);
export const changePassword = (data) => request.put('/user/password', data);
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

// ---- 管理端：错题管理 ----
export const adminWrongStats = () => request.get('/admin/wrong-questions/stats');
export const adminListWrong = (params) => request.get('/admin/wrong-questions', { params });
export const adminSetWrongMastered = (id, mastered) =>
  request.patch(`/admin/wrong-questions/${id}/mastered`, { mastered });
export const adminDeleteWrong = (id) => request.delete(`/admin/wrong-questions/${id}`);

// ---- 管理端：复习计划管理 ----
export const adminPlanStats = () => request.get('/admin/plans/stats');
export const adminListPlans = (params) => request.get('/admin/plans', { params });
export const adminGetPlan = (id) => request.get(`/admin/plans/${id}`);
export const adminSetPlanStatus = (id, status) => request.patch(`/admin/plans/${id}/status`, { status });
export const adminDeletePlan = (id) => request.delete(`/admin/plans/${id}`);

// ---- 管理端：AI 服务管理 ----
export const adminGetAiConfig = () => request.get('/admin/ai/config');
export const adminUpdateAiConfig = (data) => request.put('/admin/ai/config', data);
export const adminTestAi = () => request.post('/admin/ai/test', null, { timeout: TIMEOUT.ai });
export const adminAiStats = () => request.get('/admin/ai/stats');
export const adminListAiGenerations = (params) => request.get('/admin/ai/generations', { params });
export const adminGetAiGeneration = (id) => request.get(`/admin/ai/generations/${id}`);

// ---- 管理端：数据备份 ----
export const adminBackupOverview = () => request.get('/admin/backup/overview');
export const adminListBackups = (params) => request.get('/admin/backups', { params });
export const adminCreateBackup = () => request.post('/admin/backups', null, { timeout: 120000 });
export const adminVerifyBackup = (id) => request.post(`/admin/backups/${id}/verify`);
export const adminDeleteBackup = (id) => request.delete(`/admin/backups/${id}`);
// 备份下载走浏览器直链（带令牌需走 fetch → Blob，见 BackupManage 页面实现）
