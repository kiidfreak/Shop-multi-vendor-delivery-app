export interface Shop {
    id: string;
    name: string;
    owner: string;
    location: string;
    phone?: string;
    isActive: boolean;
}

export interface InventoryItem {
    id: string;
    name: string;
    currentStock: number;
    unit: string;
    lowStockThreshold: number;
    price: number;
}

export interface DeliveryItem {
    inventoryItemId: string;
    quantity: number;
    price: number;
    name?: string; // Snapshot of the name at time of sale, or custom name
}

export interface Delivery {
    id: string;
    shopId: string;
    sellerId: string;
    items: DeliveryItem[];
    totalAmount: number;
    paidAmount: number;
    isPaid: boolean;
    deliveryDate: string;
    paymentDate?: string;
    notes?: string;
}

export interface Seller {
    id: string;
    name: string;
    phone?: string;
    isActive: boolean;
}

export interface AppSettings {
    hideShopsAfterPaid: boolean;
    defaultLowStockThreshold: number;
    userName: string;
    businessName: string;
    profileImage?: string;
    darkMode: boolean;
    enableDailyStock: boolean; // Enable daily stock management for profit tracking
    appPin?: string; // Optional PIN to secure the app
}

export interface DailySummary {
    date: string;
    totalSales: number;
    totalPaid: number;
    totalUnpaid: number;
    deliveryCount: number;
}

export interface SellerAnalytics {
    seller: Seller;
    totalSales: number;
    totalPaid: number;
    totalPending: number;
    customerCount: number;
    deliveryCount: number;
}

// Daily stock record for tracking opening inventory each day
export interface DailyStockRecord {
    id: string;
    date: string; // ISO date string YYYY-MM-DD
    items: DailyStockItem[];
    createdAt: string;
}

export interface DailyStockItem {
    inventoryItemId: string;
    openingStock: number;
    closingStock?: number; // Optional, calculated at end of day
}
