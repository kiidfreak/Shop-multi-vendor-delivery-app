export interface Product {
    id: string;
    name: string;
    price: number;
    image?: string;
    category: "Miraa" | "Smoke" | "Munchies";
    description?: string;
    isPopular?: boolean;
    inStock?: boolean;
}

export interface OrderItem {
    productId: string;
    quantity: number;
    price: number;
}

export interface Order {
    id: string;
    userId?: string;
    items: OrderItem[];
    totalAmount: number;
    status: "Pending" | "Accepted" | "OnTheWay" | "Delivered" | "Cancelled";
    riderId?: string;
    createdAt: string;
    deliveryEstimate?: string;
    deliveryDetails?: {
        name: string;
        phone: string;
        location: string;
    };
    paymentMethod?: "Cash" | "Mpesa";
    deliveryFee?: number;
    feeSuggested?: boolean;
}

export type Role = "USER" | "RIDER" | "ADMIN";

export interface Rider {
    id: string;
    name: string;
    avatar?: string;
    rating: number;
    phone: string;
    statusSummary: string; // "Rolling through traffic 😤"
    status: "Available" | "Busy" | "Offline";
    pin?: string; // In real app, this should be hashed
    ordersCompleted: number;
}

export interface UserProfile {
    name: string;
    phone: string;
    address: string;
    avatar?: string;
}

export interface AppSettings {
    userName: string;
    darkMode: boolean;
}

export interface UserAccount {
    id: string;
    phone: string;
    name?: string;
    avatar?: string;
    createdAt: string;
    isGuest: boolean;
    isBanned?: boolean;
}

