import api from './api';

export const inventoryService = {
    // Products
    async getProducts(params = {}) {
        const response = await api.get('/products', { params });
        return response.data;
    },

    async getProduct(id) {
        const response = await api.get(`/products/${id}`);
        return response.data;
    },

    async createProduct(data) {
        const response = await api.post('/products', data);
        return response.data;
    },

    async updateProduct(id, data) {
        const response = await api.put(`/products/${id}`, data);
        return response.data;
    },

    async deleteProduct(id) {
        await api.delete(`/products/${id}`);
    },

    // Categories
    async getCategories() {
        const response = await api.get('/categories/all');
        return response.data;
    },

    async createCategory(data) {
        const response = await api.post('/categories', data);
        return response.data;
    },

    // Suppliers
    async getSuppliers(params = {}) {
        const response = await api.get('/suppliers', { params });
        return response.data;
    },

    async createSupplier(data) {
        const response = await api.post('/suppliers', data);
        return response.data;
    },

    // Locations
    async getLocations() {
        const response = await api.get('/locations');
        return response.data;
    },

    async createLocation(data) {
        const response = await api.post('/locations', data);
        return response.data;
    },

    // Inventory
    async getInventory(params = {}) {
        const response = await api.get('/inventory', { params });
        return response.data;
    },

    async getLowStockAlerts() {
        const response = await api.get('/inventory/low-stock');
        return response.data;
    },

    async createInventory(data) {
        const response = await api.post('/inventory', data);
        return response.data;
    },

    async updateInventory(id, data) {
        const response = await api.put(`/inventory/${id}`, data);
        return response.data;
    },

    // Transactions
    async getTransactions(params = {}) {
        const response = await api.get('/transactions', { params });
        return response.data;
    },

    async createTransaction(data) {
        const response = await api.post('/transactions', data);
        return response.data;
    },
};
