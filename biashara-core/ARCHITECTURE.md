# Biashara Core - Architecture

## System Design

### Layer Model

```
┌─────────────────────────────────────────────────────────────────┐
│  APPLICATIONS                                                    │
│  Eddu • Boda • Sokoni • Chama • WhatsApp Bot                   │
├─────────────────────────────────────────────────────────────────┤
│  BIASHARA SDK (@biashara/*)                                     │
│  Identity • Reputation • Payments • Offline • USSD • Notify    │
├─────────────────────────────────────────────────────────────────┤
│  CORE SERVICES                                                   │
│  Auth Service • Trust Engine • Payment Gateway • Sync Engine   │
├─────────────────────────────────────────────────────────────────┤
│  DATA LAYER                                                      │
│  PostgreSQL (ledger) • Redis (cache) • S3 (media)              │
├─────────────────────────────────────────────────────────────────┤
│  EXTERNAL SERVICES                                               │
│  Africa's Talking • M-Pesa Daraja • FCM • WhatsApp Business    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Models

### Identity

```typescript
interface BiasharaUser {
  id: string;                    // UUID
  phone: string;                 // +254XXXXXXXXX
  phoneVerified: boolean;
  name?: string;
  createdAt: Date;
  
  // Cross-app identity
  linkedApps: {
    eddu?: { userId: string; role: 'distributor' | 'seller' };
    boda?: { userId: string; role: 'rider' | 'sacco' | 'merchant' };
  };
}
```

### Reputation

```typescript
interface TrustScore {
  userId: string;
  app: 'eddu' | 'boda' | 'sokoni' | 'chama';
  
  // Core metrics
  lot: number;                   // Level of Trust (0-100)
  totalTransactions: number;
  successRate: number;           // 0.0 - 1.0
  
  // Verification badges
  badges: ('phone_verified' | 'sacco_verified' | 'elite' | 'trusted')[];
  
  // Computed from all apps
  globalLot?: number;            // Cross-app trust score
}
```

### Payment Ledger

```typescript
interface PaymentEntry {
  id: string;
  type: 'credit' | 'debit';
  amount: number;                // KES
  currency: 'KES';
  
  // Parties
  fromUserId?: string;
  toUserId?: string;
  
  // Context
  app: 'eddu' | 'boda' | 'sokoni' | 'chama';
  referenceId: string;           // Delivery ID, Order ID, etc.
  referenceType: 'delivery' | 'order' | 'payout' | 'deposit';
  
  // M-Pesa details
  mpesaRef?: string;
  mpesaStatus?: 'pending' | 'completed' | 'failed';
  
  // State
  status: 'pending' | 'completed' | 'failed' | 'reversed';
  createdAt: Date;
  completedAt?: Date;
}
```

---

## API Design

### Authentication

```http
POST /api/auth/otp/request
{ "phone": "+254712345678" }

POST /api/auth/otp/verify
{ "phone": "+254712345678", "code": "123456" }

Response:
{ "token": "jwt...", "user": { ... } }
```

### Reputation

```http
GET /api/reputation/:userId
Response:
{
  "lot": 92,
  "badges": ["phone_verified", "trusted"],
  "apps": {
    "eddu": { "lot": 95, "transactions": 342 },
    "boda": { "lot": 89, "transactions": 156 }
  }
}
```

### Payments

```http
POST /api/payments/stk-push
{
  "phone": "+254712345678",
  "amount": 500,
  "reference": "delivery_123",
  "app": "eddu"
}

POST /api/payments/b2c
{
  "phone": "+254712345678",
  "amount": 250,
  "reason": "rider_payout",
  "app": "boda"
}
```

---

## Offline-First Strategy

### Sync Priority

```
1. CRITICAL  - Payments, identity changes (immediate sync)
2. HIGH      - Deliveries, orders (sync within 30s)
3. MEDIUM    - Analytics, preferences (sync within 5m)
4. LOW       - Logs, telemetry (batch sync hourly)
```

### Conflict Resolution

```typescript
// Last-write-wins with app-specific merge
function resolveConflict(local: T, remote: T): T {
  if (local.updatedAt > remote.updatedAt) {
    return local;
  }
  return remote;
}
```

---

## Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| Auth OTP delivery | < 5s | Via Africa's Talking |
| Trust score lookup | < 50ms | Redis cached |
| Payment initiation | < 2s | M-Pesa STK Push |
| Offline queue sync | < 10s/batch | When online |
| USSD response | < 500ms | Session timeout |

---

## Security

- **Auth**: JWT with refresh tokens, phone OTP verification
- **Data**: Encryption at rest (AES-256), in transit (TLS 1.3)
- **Payments**: PCI-DSS compliance for card data (future), M-Pesa API security
- **USSD**: Session-based, timeout after 3 minutes
- **Rate limiting**: 100 req/min per user, 1000 req/min per app

---

## Deployment

### Current (MVP)

```
Eddu:   Expo + AsyncStorage (local-first)
Boda:   Vercel + PostgreSQL (Supabase)
```

### Target (Scale)

```
Apps:   Expo (mobile) + Vercel (web)
API:    Railway / Fly.io (Node.js)
DB:     Supabase (PostgreSQL + Auth)
Cache:  Upstash Redis
Files:  Cloudflare R2
USSD:   Africa's Talking
```
