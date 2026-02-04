# Biashara Core - Implementation Plan

## 🎯 Objective
Extract the core reusable logic from **Eddu** (Proof of Concept) into a robust, scalable infrastructure (**Biashara Core**) that powers the entire ecosystem of informal business apps (Eddu, Boda, Sokoni, Chama).

---

## 📂 Repository Structure

| Repository | Role | Tech Stack |
|:--- |:--- |:--- |
| **`biashara-infra`** | **Infrastructure as Code** | Terraform / Pulumi, Docker, GitHub Actions |
| **`biashara-api`** | **Backend Services** | Node.js (Express/Nest), Supabase, Redis |
| **`biashara-platform`** | **Mobile/Web SDK** | TypeScript, React Native (Expo Module) |
| **`biashara-cli`** | **Developer Tooling** | Node.js CL (oclif/commander) |
| **`biashara-docs`** | **Documentation** | Docusaurus / GitBook |

---

## 📅 Roadmap & Phases

### Phase 1: Foundation (Weeks 1-2)
*Goal: Set up the environment and documentation standards.*

1.  **Docs First (`biashara-docs`)**
    *   Initialize Docusaurus project.
    *   Port existing `ARCHITECTURE.md` and `README.md` from Eddu.
    *   Define API standards (OpenAPI spec draft).

2.  **Infrastructure Setup (`biashara-infra`)**
    *   Set up Supabase project (Auth, Database, Storage).
    *   Configure CI/CD pipelines (GitHub Actions) for all repos.
    *   Set up staging and production environments.

### Phase 2: Core Backend (`biashara-api`)
*Goal: Centralize logic that shouldn't live on the phone.*

1.  **Identity Service**
    *   Unified user table (linking Eddu, Boda, etc.).
    *   Auth flow (Phone OTP via Africa's Talking).

2.  **Reputation Engine**
    *   Calculate Trust Scores (LOT) based on transaction history.
    *   API endpoints: `GET /trust/:userId`.

3.  **Payment Gateway**
    *   M-Pesa STK Push integration.
    *   Payment verification webhook handlers.
    *   Ledger system for tracking cross-app transactions.

### Phase 3: The Platform SDK (`biashara-platform`)
*Goal: The "Brain" that lives inside every app.*

1.  **Extract Logic from Eddu**
    *   Identify reusable hooks (e.g., `useAuth`, `usePayment`, `useSync`).
    *   Move `OfflineSync` logic from `AppContext.tsx` into the SDK.

2.  **Package Development**
    *   Create npm package `@biashara/core`.
    *   Modules:
        *   `@biashara/auth`: Login screen, session management.
        *   `@biashara/sync`: Offline-first generic data sync.
        *   `@biashara/ui`: Shared design system (colors, fonts, buttons - "Mayhem" theme).

### Phase 4: Eddu Refactoring (Week 7+)
*Goal: Prove the platform works by upgrading the first tenant.*

1.  **Install SDK**
    *   Replace local `contexts/AppContext.tsx` with `@biashara/core` providers.
    *   Replace local styles with `@biashara/ui` components.

2.  **Data Migration**
    *   Migrate generic local AsyncStorage data to structured Biashara schemas.

### Phase 5: Expansion & Tooling (`biashara-cli`)
*Goal: Scale to new apps rapidly.*

1.  **Scaffolding Tool**
    *   `biashara create app <name>`
    *   Generates a new Expo app pre-configured with the SDK.

---

## 🛠️ Immediate Next Steps

1.  **Clone all 5 repositories** to your workstation.
2.  **Initialize `biashara-docs`** and push the Architecture diagram.
3.  **Audit Eddu's `AppContext.tsx`** to list exactly which functions move to the SDK.
