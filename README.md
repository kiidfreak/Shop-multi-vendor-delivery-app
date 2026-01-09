# Eddu - Multi-Vendor Delivery & Inventory Management

Eddu is a premium, high-performance mobile application designed for businesses managing multi-vendor deliveries, shop balances, and inventory in real-time. Built with a focus on speed, aesthetics, and reliability, Eddu empowers business owners like Edwin to track sales, manage sellers, and maintain healthy inventory levels effortlessly.

## 🚀 Key Features

### 📦 Dynamic Inventory Management
- Real-time stock tracking with low-stock alerts.
- Quick adjustments and price management for all items (Tea, Uji, Mandazi, Chapati, etc.).
- Visual status indicators for out-of-stock items.

### 🏪 Multi-Vendor Shop Tracking
- Comprehensive shop database with owner details and locations.
- **Partial Payment Logic**: Visual distinction between paid, partially paid (Orange), and unpaid (Red) shop balances.
- "Hide Paid Shops" setting to keep your focus on pending collections.

### 👥 Seller Performance & Analytics
- Track daily sales performance by individual sellers.
- Detailed analytics showing customer count, delivery volume, and total pending collections per seller.
- Real-time data synchronization across all dashboard tiles.

### 🎨 Premium User Experience
- **Interactive Dashboard**: Modern swiped cards for today's sales overview and seller performance.
- **Smart UI**: Context-aware greetings with Sun/Moon icons based on the time of day.
- **Personalization**: Customize your business name and profile picture to make the app truly yours.
- **Floating Action Button (FAB)**: A consistent, vibrant orange FAB for instant delivery recording.
- **Smooth Bottom Sheets**: Native-feeling slide-up forms for a fluid user interaction.

## 🛠 Tech Stack

- **Framework**: [Expo](https://expo.dev/) (React Native)
- **Navigation**: [Expo Router](https://docs.expo.dev/router/introduction/) (Next.js-style file-based routing)
- **State Management**: Custom Context API with [AsyncStorage](https://react-native-async-storage.github.io/async-storage/) for robust offline persistence.
- **Icons**: [Lucide React Native](https://lucide.dev/guide/packages/lucide-react-native)
- **Haptics**: [Expo Haptics](https://docs.expo.dev/versions/latest/sdk/haptics/) for tactile feedback.
- **Styling**: Vanilla React Native StyleSheet with a custom-themed color palette.
- **Animations**: native `Animated` & `Modal` transitions for smooth performance.

## 📱 User Interaction Flow

1. **Dashboard Home**: Get a bird's-eye view of your business. Swipe through today's sales and seller summaries.
2. **Record a Delivery**: Tap the floating orange `+` button to pull up the delivery sheet. Select the seller, the shop, and the items. Mark it as paid or enter a partial amount.
3. **Manage Shops**: Switch to the **Shops** tab to see who owes what. Tap any shop to record a quick payment.
4. **Inventory Control**: Keep your items in stock. Edit prices and set alert thresholds in the **Profile** section.
5. **Personal Settings**: Upload your profile picture and set your business name (e.g., "Edwin's Business") to personalize the experience.

## 💾 Local-First Architecture

Eddu is designed to work flawlessly in any environment. All data is saved directly to your device's storage, ensuring that you never lose a record even when the network is unstable.

---

*Developed with ❤️ for Edwin Business.*
