# StockMaster

**Inventory Management System for small companies with stores or warehouses.**

A modern, full-stack inventory management solution built with **Python (FastAPI)** and **JavaScript (React)**.

## ✨ Features

- **🔐 Admin Login** - JWT-based authentication with role-based access control
- **📦 Product Management** - Create, edit, delete products with SKU, pricing, and stock levels
- **📥 Stock In/Out** - Track incoming and outgoing inventory transactions
- **📊 Automatic Stock Calculation** - Real-time stock levels updated automatically
- **⚠️ Low Stock Alerts** - Dashboard notifications when inventory falls below threshold
- **📤 CSV Export** - Export products and transactions to CSV files

## 🛠️ Tech Stack

| Layer        | Technology                                                      |
| ------------ | --------------------------------------------------------------- |
| **Frontend** | React 18, Vite, React Router, TanStack Query, Zustand, Recharts |
| **Backend**  | FastAPI, SQLAlchemy 2.0, Pydantic, JWT                          |
| **Database** | PostgreSQL                                                      |
| **Styling**  | Custom CSS with glassmorphism design                            |

## 🚀 Quick Start

### Docker (Recommended)

```bash
# Start all services
docker-compose up -d

# Access the application
# Frontend: http://localhost:5173
# Backend API: http://localhost:8000/docs
```

## 🔑 Default Login Credentials

| Field        | Value                 |
| ------------ | --------------------- |
| **Email**    | admin@stockmaster.com |
| **Password** | admin123              |

## 📁 Project Structure

```
StockMaster/
├── backend/
│   ├── app/
│   │   ├── api/          # API routes
│   │   ├── core/         # Config, database, security
│   │   ├── models/       # SQLAlchemy models
│   │   ├── schemas/      # Pydantic schemas
│   │   └── main.py       # FastAPI entry point
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   ├── services/     # API services
│   │   ├── store/        # Zustand stores
│   │   └── App.jsx       # Main app
│   ├── package.json
│   └── Dockerfile
└── docker-compose.yml
```

## 🔑 API Endpoints

| Method | Endpoint                      | Description                     |
| ------ | ----------------------------- | ------------------------------- |
| POST   | `/api/v1/auth/login`          | Login and get tokens            |
| GET    | `/api/v1/products`            | List products                   |
| POST   | `/api/v1/products`            | Create product                  |
| PUT    | `/api/v1/products/{id}`       | Update product                  |
| DELETE | `/api/v1/products/{id}`       | Delete product                  |
| GET    | `/api/v1/inventory/low-stock` | Get low stock alerts            |
| GET    | `/api/v1/transactions`        | List transactions               |
| POST   | `/api/v1/transactions`        | Create stock in/out transaction |

**Full API documentation available at:** `http://localhost:8000/docs`

## 👥 User Roles

| Role        | Permissions                            |
| ----------- | -------------------------------------- |
| **Admin**   | Full access to all features            |
| **Manager** | Create/edit products, manage inventory |
| **Staff**   | View inventory, create transactions    |

## 📝 License

MIT License
