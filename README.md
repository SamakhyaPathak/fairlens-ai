# FairLens AI: Ethical Intelligence Auditor

[![Responsible AI](https://img.shields.io/badge/Responsible%20AI-Framework-8A2BE2)](https://ai.google/responsibility/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React-61DAFB)](https://reactjs.org/)
[![Firebase](https://img.shields.io/badge/Database-Firebase-FFCA28)](https://firebase.google.com/)

## Overview

**FairLens AI** is a professional-grade, full-stack auditing platform designed to detect, measure, and remediate algorithmic bias in machine learning datasets. Developed for the **Google Solution Challenge 2026**, it leverages the Gemini 1.5 Pro API for automated ethical analysis and remediation advice, providing data scientists with an end-to-end framework for responsible AI development.

---

## Technical Stack

- **Frontend**: React 18+ (TypeScript), Tailwind CSS (Vite), Framer Motion, Recharts.
- **Backend**: Python 3.11, FastAPI, Pandas, NumPy, Uvicorn.
- **AI Core**: Google Gemini 1.5 Pro (LLM) for context-aware remediation.
- **Persistence**: Firebase (Auth & Firestore) with client-side redundancy.

---

## System Architecture & Security

### Hybrid Persistence Pattern
To ensure 100% data availability even in "cloud-restricted" or offline environments, FairLens AI implements a **Hybrid Persistence Pattern**. 
1. **Primary**: Firebase Firestore provides global sync for authenticated users.
2. **Fallback**: A local storage adapter automatically takes over if the Firebase SDK fails to initialize or the user is unauthenticated.
This allows for immediate auditing without forcing a login, while maintaining cloud history for registered users.

### "Master Gate" Security
Our Firestore security follows a **Master Gate** (RBAC) pattern. Access to any audit record is strictly partitioned by `userId`.
- **Relational Integrity**: Rules enforce that `request.auth.uid == resource.data.userId`.
- **Validation Blueprints**: Every write operation is wrapped in a validation helper that enforces schema integrity and size limits, preventing "Denial of Wallet" attacks through large-payload injections.

---

## Responsible AI Logic

The platform calculates three primary fairness dimensions:
1. **Demographic Parity Gap**: Measures the difference in selection rates between protected and privileged groups.
2. **Disparate Impact Ratio**: A ratio-based test for systemic bias (the "80% rule").
3. **Equalized Odds**: Evaluates True Positive Rate parity across groups to ensure error rates are balanced.

---

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- Gemini API Key

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/fairlens-ai.git
   cd fairlens-ai
   ```

2. **Backend Setup**:
   ```bash
   pip install -r backend/requirements.txt
   ```

3. **Frontend Setup**:
   ```bash
   npm install
   ```

4. **Environment Configuration**:
   Create a `.env` file based on `.env.example` and add your `GEMINI_API_KEY`.

5. **Run Development Server**:
   ```bash
   npm run dev
   ```

---

## Contributing

We strictly follow **SDE-style structured commits** (Conventional Commits). Please ensure your code adheres to:
- **CamelCase** for all Frontend TypeScript variables.
- **Snake_case** for all Backend Python logic.
- **Math Integrity**: Always handle empty groups or division-by-zero scenarios.

---

## License
MIT License - Developed for the Google Solution Challenge 2026.
