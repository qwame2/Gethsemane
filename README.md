# ✝️ Gethsemane

### Church Management & Member Experience Platform

<p align="center">
  <b>Run your church like a system. Engage your members like a product.</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" />
  <img src="https://img.shields.io/badge/Tailwind-v4-38B2AC?logo=tailwind-css" />
  <img src="https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma" />
  <img src="https://img.shields.io/badge/PostgreSQL-DB-336791?logo=postgresql" />
  <img src="https://img.shields.io/badge/PWA-Installable-009688" />
</p>

---

## 🚀 The Problem

Most churches today operate on:

* spreadsheets
* manual records
* fragmented communication
* zero real-time visibility

This creates:

* financial opacity
* poor engagement
* administrative stress

---

## 💡 The Solution

**Gethsemane** is a dual-platform system that transforms church operations into a **real-time, data-driven ecosystem**.

It consists of:

* 🛡️ **Admin System** → full operational control
* 💎 **Member App** → seamless, mobile-first engagement

---

## ⚡ Core Capabilities

### 💎 Member Portal (Users App)

> Built for daily use — not occasional login.

* 📱 **Installable PWA** (Android & iOS)
* 💰 **Live Financial Dashboard**

  * contributions
  * arrears
  * payment history
* ⚡ **Instant Payments (Paystack)**
* 🔔 **Real-Time Notifications**
* 👤 **Personal Profile & Fellowship Data**
* 🎮 **Engagement Layer (Bible Quest - upcoming)**

  ---

## 🖼️ Product Experience (Real UI)

### 🔐 Authentication

Clean and minimal login experience designed for accessibility and speed.

![Login](./screenshots/login.png)

---

### 📊 Dashboard Overview

A real-time snapshot of member activity, payments, and status.

![Dashboard](./screenshots/dashboard.png)

---

### 💳 Payments & Dues

Flexible payment system with clear breakdown and yearly tracking.

![Payments](./screenshots/payments.png)

---

### 💸 Secure Payment Flow

Seamless mobile money integration with secure transaction handling.

![Payment Modal](./screenshots/payment-modal.png)

---

### ✅ Payment Confirmation

Instant feedback after successful transactions.

![Payment Success](./screenshots/payment-success.png)

---

### 🧾 Digital Receipt

Verified and structured receipt system for transparency.

![Receipt](./screenshots/receipt.png)

---

### 📜 Transactions History

Track all payments with a clean, searchable interface.

![Transactions](./screenshots/transactions.png)

---

### 👤 Profile Management

User account management with clear structure and accessibility.

![Profile](./screenshots/profile.png)

---

### 🚪 Security & Session Control

Clear confirmation flows for sensitive actions like logout.

![Logout](./screenshots/logout.png)

---


---

### 🛡️ Admin Dashboard (Admin App)

> Built for decision-making — not data entry.

* 👥 **Centralized Member Management**
* 🧩 **Fellowship Segmentation**

  * Youth
  * Men
  * Women
  * Children
* 💵 **Financial Intelligence**

  * track payments
  * monitor arrears
* 📅 **Event Management**
* 🔐 **Role-Based Access Control (RBAC)**
* ⚙️ **Structured Onboarding System**

---

## 🧠 System Design (Why it’s built this way)

This is NOT a single app.

It is a **separated system architecture**:

```bash
Gethsemane/
├── Admin/    # Leadership control layer
├── Users/    # Member experience layer
└── Shared/   # Config & utilities
```

👉 Why separation matters:

* independent scaling
* cleaner deployments
* zero cross-breaking changes

---

## 🛠️ Tech Stack

| Layer    | Technology          |
| -------- | ------------------- |
| Frontend | Next.js (React 19)  |
| Styling  | Tailwind CSS v4     |
| Backend  | Next.js API Routes  |
| Database | PostgreSQL          |
| ORM      | Prisma              |
| Payments | Paystack            |
| Auth     | JWT (Jose) + Bcrypt |
| PWA      | next-pwa            |

---

## ⚙️ Quick Start (Under 10 Minutes)

### 1. Clone

```bash
git clone https://github.com/yourusername/Gethsemane.git
cd Gethsemane
```

---

### 2. Setup Admin

```bash
cd Admin
npm install
npx prisma generate
npm run dev
```

---

### 3. Setup Users App

```bash
cd ../Users
npm install
npx prisma generate
npm run dev
```

---

### 4. Environment Setup

Create `.env` in both folders:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/gethsemane
PAYSTACK_SECRET_KEY=your_key
NEXTAUTH_SECRET=your_secret
```

---

## 🌍 Deployment Strategy

Optimized for:

* ⚡ **Vercel (Recommended)**
* 🌐 Edge Runtime
* 📦 PWA caching & offline support

---

## 📊 System Flow (Mental Model)

```
Member → Uses App → Makes Payment → Paystack  
        ↓
Backend validates → Stores in DB  
        ↓
Admin Dashboard → Sees real-time update  
```

👉 No delays. No manual updates. No confusion.

---

## 🎨 Design Philosophy

Inspired by **Samsung One UI**:

* thumb-friendly layouts
* soft gradients
* fluid motion
* high readability

👉 Built to feel like a **premium mobile app**, not a website.

---

## 🔮 Roadmap

* 📡 Real-time WebSocket updates
* 🤖 AI-powered engagement assistant
* 📊 Advanced analytics dashboard
* 📱 Native mobile apps
* 🧾 Automated financial reports

---

## ⚠️ What This Project Is NOT

* ❌ Not a basic CRUD app
* ❌ Not a template
* ❌ Not a school-level system

👉 This is a **scalable platform foundation**

---

## 👑 Final Perspective

Gethsemane shifts churches from:

> managing records → **operating systems**
> collecting money → **tracking impact**
> informing members → **engaging people**

---

## 📄 License

Private & Proprietary
