import api from "./api";

export const inventoryService = {
  // Products
  async getProducts(params = {}) {
    const response = await api.get("/products", { params });
    return response.data;
  },

  async getProduct(id) {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  async createProduct(data) {
    const response = await api.post("/products", data);
    return response.data;
  },

  async updateProduct(id, data) {
    const response = await api.put(`/products/${id}`, data);
    return response.data;
  },

  async deleteProduct(id) {
    await api.delete(`/products/${id}`);
  },

  async exportProductsCSV() {
    const response = await api.get("/products/export/csv", {
      responseType: "blob",
    });
    return response.data;
  },

  // Inventory - Low Stock
  async getLowStockAlerts() {
    const response = await api.get("/inventory/low-stock");
    return response.data;
  },

  // Transactions
  async getTransactions(params = {}) {
    const response = await api.get("/transactions", { params });
    return response.data;
  },

  async createTransaction(data) {
    const response = await api.post("/transactions", data);
    return response.data;
  },

  async exportTransactionsCSV() {
    const response = await api.get("/transactions/export/csv", {
      responseType: "blob",
    });
    return response.data;
  },
};
