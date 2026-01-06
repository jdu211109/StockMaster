# StockMaster

**Inventory Management System for small companies with stores or warehouses.**

A modern, full-stack inventory management solution built with **Python (FastAPI)** and **JavaScript (React)**.

![Dashboard](https://via.placeholder.com/800x400?text=StockMaster+Dashboard)

## ✨ Features

- **🔐 Authentication** - JWT-based auth with role-based access control (Admin, Manager, Staff)
- **📦 Product Management** - Full CRUD with SKU, pricing, categories, and suppliers
- **📊 Inventory Tracking** - Real-time stock levels across multiple locations
- **🏪 Multi-Location Support** - Manage stores and warehouses independently
- **📥 Transactions** - Track stock in/out, transfers, and adjustments
- **⚠️ Low Stock Alerts** - Automatic alerts when inventory falls below reorder levels
- **📈 Dashboard Analytics** - Visual charts and key metrics at a glance

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, Vite, React Router, TanStack Query, Zustand, Recharts |
| **Backend** | FastAPI, SQLAlchemy 2.0, Pydantic, JWT |
| **Database** | PostgreSQL |
| **Styling** | Custom CSS with glassmorphism design |

## 🚀 Quick Start

### Option 1: Docker (Recommended)

```bash
# Start all services
docker-compose up -d

# Access the application
# Frontend: http://localhost:5173
# Backend API: http://localhost:8000/docs
```

### Option 2: Manual Setup

#### Backend
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment
cp .env.example .env
# Edit .env with your database credentials

# Run the server
uvicorn app.main:app --reload
```

#### Frontend
```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

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

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register new user |
| POST | `/api/v1/auth/login` | Login and get tokens |
| GET | `/api/v1/products` | List products |
| GET | `/api/v1/inventory` | List inventory |
| GET | `/api/v1/inventory/low-stock` | Get low stock alerts |
| POST | `/api/v1/transactions` | Create stock movement |

**Full API documentation available at:** `http://localhost:8000/docs`

## 👥 User Roles

| Role | Permissions |
|------|-------------|
| **Admin** | Full access to all features |
| **Manager** | Create/edit products, manage inventory |
| **Staff** | View inventory, create transactions |

## 📝 License

MIT License
x`
Email	admin@stockmaster.com
Password	admin123