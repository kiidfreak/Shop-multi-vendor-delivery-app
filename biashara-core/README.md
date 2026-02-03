# Biashara Core 🌍

**Trust Infrastructure for African Commerce**

Biashara Core is the shared foundation powering a new generation of African business tools. It provides identity, reputation, payments, and offline-first capabilities that any app can plug into.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    BIASHARA CORE (Shared Infra)                 │
├─────────────────────────────────────────────────────────────────┤
│  @biashara/identity    Phone OTP, future DID support           │
│  @biashara/reputation  Trust scores, verification badges       │
│  @biashara/payments    M-Pesa integration, ledger, reconcile   │
│  @biashara/offline     AsyncStorage/SQLite sync patterns       │
│  @biashara/ussd        Africa's Talking USSD gateway           │
│  @biashara/notify      SMS, Push, WhatsApp notifications       │
└─────────────────────────────────────────────────────────────────┘
        ↑               ↑               ↑               ↑
   ┌────┴────┐    ┌────┴────┐    ┌────┴────┐    ┌────┴────┐
   │  Eddu   │    │  Boda   │    │ Sokoni  │    │ Chama   │
   │  Milk   │    │ Riders  │    │ Market  │    │ Savings │
   │ Delivery│    │  Trust  │    │  Place  │    │ Groups  │
   └─────────┘    └─────────┘    └─────────┘    └─────────┘
```

---

## 📦 Modules

### @biashara/identity
Phone-based identity that works on any device.
- OTP verification via SMS
- Session management
- Future: DID/Verifiable Credentials

### @biashara/reputation  
Trust scoring that follows users across apps.
- Level of Trust (LoT) scores (0-100)
- Verification badges (SACCO-verified, Elite, etc.)
- Cross-app reputation portability

### @biashara/payments
M-Pesa-first payment infrastructure.
- STK Push integration
- Payment ledger with reconciliation
- Escrow for COD deliveries
- Automated B2C payouts

### @biashara/offline
Local-first data patterns for unreliable networks.
- AsyncStorage wrappers
- Conflict resolution
- Background sync when online

### @biashara/ussd
USSD gateway for feature phones.
- Africa's Talking integration
- Menu tree builder
- Session state management

### @biashara/notify
Multi-channel notifications.
- SMS (Africa's Talking)
- Push (FCM/APNs)
- WhatsApp Business API
- In-app notifications

---

## 🎯 Apps Using Biashara Core

| App | Status | Description |
|-----|--------|-------------|
| **Eddu** | ✅ Active | Milk/inventory delivery tracking for distributors |
| **Boda Trust** | 🚧 Building | Verified rider network for e-commerce logistics |
| **Sokoni** | 📋 Planned | Marketplace for mama mbogas and small vendors |
| **Chama** | 📋 Planned | Savings groups with automated ledgers |

---

## 🛠️ Tech Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Mobile** | Expo/React Native | Cross-platform, JS ecosystem |
| **Web** | Next.js 14 | App Router, server components |
| **Backend** | Node.js / Rust | Speed where needed |
| **Database** | PostgreSQL + Redis | Reliability + real-time |
| **USSD** | Africa's Talking | Kenya/Africa coverage |
| **Payments** | M-Pesa Daraja API | Mobile money first |

---

## 🗺️ Roadmap

### Phase 1: Extract (Month 1-2)
- [ ] Extract `@biashara/offline` from Eddu
- [ ] Extract `@biashara/reputation` from Boda
- [ ] Create shared TypeScript types
- [ ] Document API contracts

### Phase 2: Unify (Month 2-3)
- [ ] Shared identity across Eddu + Boda
- [ ] Cross-app reputation scoring
- [ ] Unified payment processing
- [ ] USSD menu framework

### Phase 3: Scale (Month 3-6)
- [ ] Add Sokoni marketplace
- [ ] Add Chama savings
- [ ] WhatsApp bot interface
- [ ] Multi-tenant admin dashboard

---

## 💡 Philosophy

**"Stripe for African trust infrastructure"**

We're not building apps. We're building the pipes that make African commerce trustworthy:

1. **Phone-first**: Not everyone has smartphones or stable internet
2. **Trust as data**: Reputation should be portable and verifiable
3. **Offline-ready**: Networks fail; apps shouldn't
4. **Local payments**: M-Pesa is the default, not an afterthought

---

## 🚀 Getting Started

```bash
# Clone the monorepo
git clone https://github.com/continuum-id/biashara-core.git

# Install dependencies
npm install

# Run Eddu (mobile)
cd apps/eddu && npx expo start

# Run Boda (web)
cd apps/boda && npm run dev
```

---

## 📄 License

MIT - Built for African entrepreneurs, by African developers.

---

*© 2026 Continuum ID. Building trust infrastructure for the next billion.*
