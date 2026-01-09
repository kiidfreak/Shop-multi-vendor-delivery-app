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
