# 🎓 College Discovery Platform

A modern web application built with **Next.js**, **Prisma**, and **TypeScript** to search, compare, and explore top engineering colleges across India with real-time placement, fee, and course metrics.

---

## ✨ Features

* **Comprehensive College Directory:** Explore 200+ top Indian engineering institutions (IITs, NITs, IIITs, and Premier State/Private Universities).
* **Key Metrics:** View annual tuition fees, average package (CTC), highest package, placement percentages, and top recruiters.
* **Course Insights:** Breakdown of offered B.Tech disciplines, durations, and fee structures.
* **User Authentication & Reviews:** Secure login system allowing users to post reviews, leave ratings, and bookmark saved colleges.
* **Live Search Sync (Optional):** Background integration using **Tavily Search API** and **Groq AI** to dynamically fetch and parse updated internet data.

---

## 🛠️ Tech Stack

* **Framework:** Next.js (App Router, Server Components)
* **Language:** TypeScript
* **Database & ORM:** PostgreSQL / SQLite with Prisma ORM
* **Authentication:** Bcrypt password hashing / NextAuth
* **AI & Data Enrichment:** Groq AI (`llama-3.1-8b-instant`), Tavily Web Search API

---

## Getting Started

### 1. Prerequisites
Ensure you have Node.js (v18+) and `npm` installed on your machine.

### 2. Clone & Install

```bash
git clone https://github.com/YakshJakharia06/College-Discovery.git
```
```
cd college-discovery-platform
npm install
```