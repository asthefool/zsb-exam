// 用户状态：令牌、角色与个人信息（跨页共享部分，页面级状态留在组件内）
import { defineStore } from 'pinia';
import { loginUser, logoutUser, getProfile, updateProfile } from '../api';
import { STORAGE_KEYS } from '../constants.js';

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem(STORAGE_KEYS.token) || '',
    role: localStorage.getItem(STORAGE_KEYS.role) || '',
    profile: null
  }),
  getters: {
    isLoggedIn: (s) => !!s.token,
    isAdmin: (s) => s.role === 'admin'
  },
  actions: {
    async login(payload) {
      const data = await loginUser(payload);
      this.token = data.token;
      this.role = data.user.role;
      localStorage.setItem(STORAGE_KEYS.token, data.token);
      localStorage.setItem(STORAGE_KEYS.role, data.user.role);
      localStorage.setItem(STORAGE_KEYS.userId, data.user.id);
      return data.user;
    },
    async logout() {
      try { await logoutUser(); } catch (e) { /* 令牌失效时忽略 */ }
      this.reset();
    },
    reset() {
      this.token = '';
      this.role = '';
      this.profile = null;
      localStorage.removeItem(STORAGE_KEYS.token);
      localStorage.removeItem(STORAGE_KEYS.role);
      localStorage.removeItem(STORAGE_KEYS.userId);
    },
    async fetchProfile() {
      this.profile = await getProfile();
      return this.profile;
    },
    async saveProfile(payload) {
      const nickname = typeof payload === 'string' ? payload : payload?.nickname;
      this.profile = await updateProfile({ nickname });
      return this.profile;
    }
  }
});
