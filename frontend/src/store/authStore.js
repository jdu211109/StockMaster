import { create } from 'zustand';
import { authService } from '../services/authService';

export const useAuthStore = create((set, get) => ({
    user: null,
    isLoading: true,
    isAuthenticated: false,

    initialize: async () => {
        const token = authService.getAccessToken();
        if (token) {
            try {
                const user = await authService.getCurrentUser();
                set({ user, isAuthenticated: true, isLoading: false });
            } catch (error) {
                authService.clearTokens();
                set({ user: null, isAuthenticated: false, isLoading: false });
            }
        } else {
            set({ isLoading: false });
        }
    },

    login: async (email, password) => {
        const { access_token, refresh_token } = await authService.login(email, password);
        authService.setTokens(access_token, refresh_token);
        const user = await authService.getCurrentUser();
        set({ user, isAuthenticated: true });
        return user;
    },

    register: async (data) => {
        const user = await authService.register(data);
        return user;
    },

    logout: () => {
        authService.clearTokens();
        set({ user: null, isAuthenticated: false });
    },
}));
