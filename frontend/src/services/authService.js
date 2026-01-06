import api from './api';

export const authService = {
    async login(email, password) {
        const response = await api.post('/auth/login', { email, password });
        return response.data;
    },

    async register(data) {
        const response = await api.post('/auth/register', data);
        return response.data;
    },

    async getCurrentUser() {
        const response = await api.get('/auth/me');
        return response.data;
    },

    async refreshToken(refreshToken) {
        const response = await api.post('/auth/refresh', { refresh_token: refreshToken });
        return response.data;
    },

    setTokens(accessToken, refreshToken) {
        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('refresh_token', refreshToken);
    },

    clearTokens() {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
    },

    getAccessToken() {
        return localStorage.getItem('access_token');
    },

    isAuthenticated() {
        return !!this.getAccessToken();
    },
};
