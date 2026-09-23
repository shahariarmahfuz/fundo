# Fundo Foundation Management & Public Platform

A production-ready, high-performance platform engineered for philanthropic foundations, humanitarian trusts, and ethical community financing institutions.

---

## 🏛 Architecture Overview

Built as a **modular monolith** with clear architectural boundaries:

```
Browser
  ↓
Next.js 14 (App Router, Server Components by Default, Light-Mode Aesthetic)
  ↓
FastAPI Backend (Async SQLAlchemy 2.x, Pydantic v2, JWT Security, RBAC)
  ↓
Neon PostgreSQL (ACID Ledger, Append-Only Audit Trail, Multi-Fund Accounting)
  ↓ [Optional Cache Acceleration]
Redis / In-Memory Graceful Fallback
```

> **Security Rule**: The frontend never connects directly to PostgreSQL. All operations pass through the versioned FastAPI backend.

---

## 📦 Directory Structure

```
/root/fundo/
├── backend/
│   ├── app/
│   │   ├── core/                  # Engine, pooling, config, security, caching
│   │   ├── modules/
│   │   │   ├── users/             # RBAC auth (Superadmin, Admin, Staff, Viewer)
│   │   │   ├── public/            # Dynamic CMS (sections, projects, stories, inquiries)
│   │   │   ├── members/           # Community member lifecycle & enrollment
│   │   │   ├── beneficiaries/     # Verified aid recipient registry & criteria
│   │   │   ├── groups/            # Savings circles & mutual accountability clusters
│   │   │   ├── contributions/     # Member savings, equity dues & atomic postings
│   │   │   ├── loans/             # Qard Hasan zero-interest micro-finance pool
│   │   │   ├── finance/           # Multi-fund balances, donations, txs & ledgers
│   │   │   ├── reports/           # Real-time dashboard analytics & trial balance
│   │   │   └── settings/          # Global parameters & public disclosures
│   │   ├── main.py                # FastAPI entrypoint & router aggregation
│   │   ├── seed.py                # Database seeder with production baseline
│   │   └── init_db.py             # DDL table creation and seed orchestration
│   ├── requirements.txt
│   └── .env
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── (public)/          # 15 Public foundation sections (Home, About, ...)
    │   │   └── admin/             # 13 Secure management modules & dashboard
    │   ├── components/
    │   │   ├── ui/                # Light-mode buttons, inputs, cards, badges
    │   │   ├── public/            # Public navbar, footer, project cards
    │   │   └── admin/             # Admin sidebar, header, metric cards
    │   ├── lib/                   # API client, formatting utils, auth tokens
    │   └── types/                 # TypeScript interfaces
    ├── package.json
    ├── tailwind.config.js
    └── tsconfig.json
```

---

## 🚀 Running the Platform

### Backend (FastAPI)
```bash
cd backend
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```
- API Documentation (Swagger): `http://localhost:8000/docs`
- Health Check: `http://localhost:8000/health`

### Frontend (Next.js)
```bash
cd frontend
npm run dev
# or for production:
npm run build && npm start
```
- Public Platform: `http://localhost:3000`
- Management Portal: `http://localhost:3000/admin`

### Default Administrative Credentials
- **Email**: `admin@fundo.org`
- **Password**: `admin123456`
- **Role**: `superadmin`
