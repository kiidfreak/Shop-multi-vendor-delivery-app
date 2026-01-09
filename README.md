# Eddu - Multi-Vendor Delivery & Inventory Management

Eddu is a premium, high-performance mobile application designed for businesses managing multi-vendor deliveries, shop balances, and inventory in real-time. Built with a focus on speed, aesthetics, and reliability, Eddu empowers business owners to track sales, manage sellers, and maintain healthy inventory levels effortlessly.

> **Version 1.0** - Local-First Architecture

## 🚀 Key Features

### 📦 Dynamic Inventory Management
- Real-time stock tracking with low-stock alerts
- Quick adjustments and price management for all items
- Visual status indicators and progress bars for stock levels

### 🏪 Multi-Vendor Shop Tracking
- Comprehensive shop database with owner details and locations
- **Partial Payment Logic**: Visual distinction between paid, partially paid (Orange), and unpaid (Red) shop balances
- **Quick Add Shop**: Add new clients instantly from the delivery form
- **Smart Filtering**: Filter shops by payment status (All, Unpaid, Partial, Paid)
- Shops sorted by pending balance (highest first for priority)
- "Hide Paid Shops" setting to focus on pending collections

### 👥 Seller Performance & Analytics
- Track daily sales performance by individual sellers
- **Historical Data**: Browse previous days' sales with date navigation
- Detailed analytics showing delivery volume and pending collections per seller
- Real-time data synchronization across all dashboard tiles

### 🎨 Premium User Experience
- **Interactive Dashboard**: Modern swiped cards for today's sales overview and seller performance
- **Sticky Headers**: Important information stays visible while scrolling
- **Smart UI**: Context-aware greetings with Sun/Moon icons based on time of day
- **Personalization**: Customize your business name and profile picture
- **Floating Action Button (FAB)**: Bouncy, vibrant orange FAB with spring animation
- **Smooth Bottom Sheets**: Native-feeling slide-up forms for fluid interaction
- **Rounded Tab Bar**: Premium floating tab bar with rounded corners
- **Dark Mode Toggle**: Switch between light and dark themes (UI ready)
- **Toast Notifications**: Non-blocking feedback for all actions

## 🛠 Tech Stack

- **Framework**: [Expo](https://expo.dev/) (React Native)
- **Navigation**: [Expo Router](https://docs.expo.dev/router/introduction/) (file-based routing)
- **State Management**: Custom Context API with [AsyncStorage](https://react-native-async-storage.github.io/async-storage/) for offline persistence
- **Icons**: [Lucide React Native](https://lucide.dev/guide/packages/lucide-react-native)
- **Haptics**: [Expo Haptics](https://docs.expo.dev/versions/latest/sdk/haptics/) for tactile feedback
- **Styling**: Vanilla React Native StyleSheet with custom color palette
- **Animations**: Native `Animated` API with spring physics

## 📱 User Interaction Flow

1. **Dashboard Home**: Get a bird's-eye view of your business. Swipe through today's sales and seller summaries. Sticky greeting stays visible while scrolling.
2. **Record a Delivery**: Tap the floating orange `+` button to pull up the delivery sheet. Select the seller, the shop (or quick-add a new one), and the items. Mark it as paid or enter a partial amount.
3. **Manage Shops**: Switch to the **Shops** tab to see who owes what. Use filters to find unpaid or partial payments. Tap any shop to record a quick payment.
4. **Inventory Control**: Keep your items in stock. Edit item names, prices, and set alert thresholds.
5. **Analytics**: View detailed sales performance by date. Navigate to previous days to see historical records.
6. **Personal Settings**: Upload your profile picture, set your business name, toggle dark mode, and manage shops/sellers/inventory.

## 💾 Local-First Architecture (v1)

Eddu v1 is designed to work flawlessly in any environment. All data is saved directly to your device's storage using AsyncStorage, ensuring that you never lose a record even when the network is unstable.

### Data Persistence
- Shops, sellers, deliveries, inventory, and settings stored locally
- Instant data access with no network dependency
- Automatic data loading on app startup

## 🔮 Roadmap (v2)

### Supabase Integration
- Cloud database for cross-device sync
- Admin dashboard for profile creation
- Multi-user support with role-based access
- Real-time sync across devices
- Backup and restore functionality


### Enhanced Features
- **STK Push Integration**: Automatic payment requests to shops' unpaid phone numbers for easier collection tracking
- PDF/Export reports
- Monthly/Weekly analytics summaries
- Push notifications for low stock alerts
- Custom inventory categories
- Delivery route optimization

---

## 🏃 Getting Started

```bash
# Install dependencies
npm install

# Start development server
npx expo start

# Run on device
npx expo start --android  # or --ios
```

## 📦 Building

```bash
# Build for Android
eas build --platform android

# Build for iOS
eas build --platform ios
```

---

*Developed with ❤️ by the Eddu Team*
