# MAYHEM - Delivery Management System

> **Your plug for fast deliveries** 🔥

MAYHEM is a premium mobile application for managing multi-role delivery operations, real-time order tracking, and inventory management. Built with React Native and Expo, it provides seamless experiences for customers, riders, and admins.

## 🚀 Key Features

### 👥 Multi-Role System
- **User/Customer**: Browse products, place orders, track deliveries in real-time
- **Rider**: Receive assignments, manage deliveries, track earnings
- **Admin**: Oversee operations, manage inventory, assign riders, ban users

### 📦 Real-Time Operations
- **Live Order Updates**: Customers, riders, and admins receive instant notifications via Supabase Realtime
- **Order Tracking**: Real-time status updates (Pending → Accepted → On The Way → Delivered)
- **Pull-to-Refresh**: Manual data sync across all dashboards
- **Offline-First**: Local AsyncStorage with cloud sync when online

### 🛍️ Shopping Experience
- **Category Filtering**: Miraa, Smoke, Munchies with visual icons
- **Quick Reorder**: "Run It Back" feature for past orders
- **Guest Mode**: Browse and order without creating an account
- **Delivery Details**: Name, phone, location for each order

### 🏍️ Rider Features
- **Duty Management**: Go online/offline, view numbered active duties
- **Fee Proposals**: Suggest delivery fees with admin approval
- **Earnings Tracking**: Today's pay and completed runs
- **Contact Integration**: Call customers directly from order details

### 👑 Admin Controls
- **Inventory Management**: Add/edit products, stock levels, pricing
- **Rider Management**: Add riders, set PINs, track performance
- **User Moderation**: Search and ban problematic accounts
- **Revenue Dashboard**: Total sales, active orders, rider stats

## 🎨 Premium UI/UX

- **Dark Mode Optimized**: Eye-friendly color palette
- **Haptic Feedback**: Tactile responses for all interactions
- **Skeleton Loaders**: Smooth loading states
- **Numbered Duties**: Visual priority for rider assignments
- **Color Signals**: Orange/Red highlights for role detection (no intrusive alerts)
- **Floating Action Buttons**: Quick access to critical functions

## 🛠 Tech Stack

- **Framework**: [Expo](https://expo.dev/) (React Native)
- **Backend**: [Supabase](https://supabase.com/) (PostgreSQL + Realtime)
- **State Management**: Context API + AsyncStorage
- **Navigation**: [Expo Router](https://docs.expo.dev/router/introduction/)
- **Icons**: [@expo/vector-icons](https://icons.expo.fyi/), [Lucide React Native](https://lucide.dev/)
- **UI**: Expo Blur, Linear Gradient, Image Picker
- **Haptics**: [Expo Haptics](https://docs.expo.dev/versions/latest/sdk/haptics/)

## 📱 Database Schema

### Tables
- **`users`**: Customer accounts (phone, name, avatar, is_banned)
- **`riders`**: Delivery personnel (phone, PIN, status, rating, orders_completed)
- **`products`**: Inventory items (name, price, category, in_stock, is_popular)
- **`orders`**: Delivery orders (items, total_amount, status, delivery_details, rider_id)

### Real-Time Notifications
- **Customers**: Notified when orders are accepted, on the way, or delivered
- **Riders**: Notified when assigned a new duty
- **Admins**: Notified of fee proposals and new orders

## 🏃 Getting Started

```bash
# Install dependencies
npm install

# Configure Supabase
# Create .env and add:
# EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
# EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Start development server
npx expo start

# Run on device
npx expo start --android  # or --ios
```

## 🗃️ Database Setup

Run the following SQL in your Supabase SQL editor:

```sql
-- Users table
CREATE TABLE public.users (
  id text PRIMARY KEY,
  phone text UNIQUE NOT NULL,
  name text,
  avatar text,
  is_guest boolean DEFAULT false,
  is_banned boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Riders table
CREATE TABLE public.riders (
  id text PRIMARY KEY,
  name text NOT NULL,
  phone text NOT NULL,
  pin text NOT NULL,
  status text DEFAULT 'Available',
  rating numeric DEFAULT 0.0,
  status_summary text,
  orders_completed integer DEFAULT 0,
  avatar text,
  created_at timestamptz DEFAULT now()
);

-- Products table
CREATE TABLE public.products (
  id text PRIMARY KEY,
  name text NOT NULL,
  price integer NOT NULL,
  category text NOT NULL,
  description text,
  is_popular boolean DEFAULT false,
  in_stock boolean DEFAULT true,
  image text,
  created_at timestamptz DEFAULT now()
);

-- Orders table
CREATE TABLE public.orders (
  id text PRIMARY KEY,
  user_id text REFERENCES users(id),
  rider_id text REFERENCES riders(id),
  items jsonb NOT NULL,
  total_amount integer NOT NULL,
  status text NOT NULL,
  delivery_details jsonb,
  delivery_fee integer,
  delivery_estimate text,
  payment_method text,
  fee_suggested boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable Realtime for orders
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
```

## 📦 Building APK

```bash
# Build Android APK
eas build --platform android

# Check build status
eas build:list
```

## 🔐 Default Login

- **Admin**: Any phone + PIN `0000`
- **Rider**: Rider phone number + their assigned PIN
- **User**: Any phone (no PIN required)

## 🎯 User Flow

1. **Onboarding**: Enter phone → Auto-detect role (color signal)
2. **Shopping**: Browse products → Add to cart → Checkout
3. **Delivery**: Rider receives assignment → Picks up → Delivers
4. **Tracking**: Customer sees real-time status updates
5. **Admin**: Monitors all operations from dashboard

---

**Version**: 4.2.0 (Mayhem Edition)  
**Developed with** ❤️ **and vibes** 🔥
