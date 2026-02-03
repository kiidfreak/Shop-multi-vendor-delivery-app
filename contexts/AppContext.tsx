import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import { useEffect, useState, useCallback, useMemo } from "react";
import type { Delivery, DailySummary, InventoryItem, Shop, Seller, AppSettings, SellerAnalytics, DailyStockRecord } from "@/types";
import { LightColors, DarkColors } from "@/constants/colors";

const STORAGE_KEYS = {
    SHOPS: "shops",
    INVENTORY: "inventory",
    DELIVERIES: "deliveries",
    SELLERS: "sellers",
    SETTINGS: "settings",
    DAILY_STOCK: "daily_stock",
};

const DEFAULT_INVENTORY: InventoryItem[] = [
    { id: "1", name: "Maternity Tea (Thermos)", currentStock: 50, unit: "thermos", lowStockThreshold: 10, price: 50 },
    { id: "2", name: "Uji", currentStock: 30, unit: "cups", lowStockThreshold: 5, price: 20 },
    { id: "3", name: "Mandazi", currentStock: 100, unit: "pieces", lowStockThreshold: 20, price: 10 },
    { id: "4", name: "Chapati", currentStock: 80, unit: "pieces", lowStockThreshold: 15, price: 15 },
];

const DEFAULT_SHOPS: Shop[] = [
    { id: "1", name: "Mama Grace Shop", owner: "Grace Wanjiku", location: "Kawangware", phone: "+254712345678", isActive: true },
    { id: "2", name: "Kilimani Kiosk", owner: "John Kamau", location: "Kilimani", isActive: true },
    { id: "3", name: "Westlands Store", owner: "Mary Akinyi", location: "Westlands", phone: "+254723456789", isActive: true },
];

const DEFAULT_SELLERS: Seller[] = [
    { id: "1", name: "Edwin (Admin)", phone: "+254700000000", isActive: true },
    { id: "2", name: "Jane Mwangi", isActive: true },
    { id: "3", name: "Lucy Njeri", isActive: true },
];

const DEFAULT_SETTINGS: AppSettings = {
    hideShopsAfterPaid: false,
    defaultLowStockThreshold: 10,
    userName: "Name",
    businessName: "Business Name",
    darkMode: false,
    enableDailyStock: false, // Off by default, can enable in settings
};

export const [AppProvider, useApp] = createContextHook(() => {
    const [shops, setShops] = useState<Shop[]>([]);
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [deliveries, setDeliveries] = useState<Delivery[]>([]);
    const [sellers, setSellers] = useState<Seller[]>([]);
    const [dailyStockRecords, setDailyStockRecords] = useState<DailyStockRecord[]>([]);
    const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [shopsData, inventoryData, deliveriesData, sellersData, settingsData, dailyStockData] = await Promise.all([
                AsyncStorage.getItem(STORAGE_KEYS.SHOPS),
                AsyncStorage.getItem(STORAGE_KEYS.INVENTORY),
                AsyncStorage.getItem(STORAGE_KEYS.DELIVERIES),
                AsyncStorage.getItem(STORAGE_KEYS.SELLERS),
                AsyncStorage.getItem(STORAGE_KEYS.SETTINGS),
                AsyncStorage.getItem(STORAGE_KEYS.DAILY_STOCK),
            ]);

            setShops(shopsData ? JSON.parse(shopsData) : DEFAULT_SHOPS);
            setInventory(inventoryData ? JSON.parse(inventoryData) : DEFAULT_INVENTORY);
            setDeliveries(deliveriesData ? JSON.parse(deliveriesData) : []);
            setSellers(sellersData ? JSON.parse(sellersData) : DEFAULT_SELLERS);
            setDailyStockRecords(dailyStockData ? JSON.parse(dailyStockData) : []);
            setSettings(settingsData ? JSON.parse(settingsData) : DEFAULT_SETTINGS);
            setIsLoaded(true);
        } catch (error) {
            console.error("Error loading data:", error);
            setShops(DEFAULT_SHOPS);
            setInventory(DEFAULT_INVENTORY);
            setDeliveries([]);
            setSellers(DEFAULT_SELLERS);
            setSettings(DEFAULT_SETTINGS);
            setIsLoaded(true);
        }
    };



    const saveInventory = useCallback(async (newInventory: InventoryItem[]) => {
        try {
            setInventory(newInventory);
            await AsyncStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(newInventory));
        } catch (error) {
            console.error("Error saving inventory:", error);
        }
    }, []);

    const saveDeliveries = useCallback(async (newDeliveries: Delivery[]) => {
        try {
            setDeliveries(newDeliveries);
            await AsyncStorage.setItem(STORAGE_KEYS.DELIVERIES, JSON.stringify(newDeliveries));
        } catch (error) {
            console.error("Error saving deliveries:", error);
        }
    }, []);

    const addDelivery = useCallback(async (delivery: Delivery) => {
        // Optimistic update for UI speed
        const newDeliveries = [...deliveries, delivery];
        setDeliveries(newDeliveries);

        // Persist to storage in background
        AsyncStorage.setItem(STORAGE_KEYS.DELIVERIES, JSON.stringify(newDeliveries));

        // Update inventory
        const updatedInventory = inventory.map((item) => {
            const deliveryItem = delivery.items.find((di) => di.inventoryItemId === item.id);
            if (deliveryItem) {
                return {
                    ...item,
                    currentStock: item.currentStock - deliveryItem.quantity,
                };
            }
            return item;
        });

        setInventory(updatedInventory);
        AsyncStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(updatedInventory));
    }, [deliveries, inventory]);

    const recordPayment = useCallback(async (deliveryId: string, amount: number) => {
        const updatedDeliveries = deliveries.map((d) => {
            if (d.id === deliveryId) {
                const newPaidAmount = Math.min(d.totalAmount, (d.paidAmount || 0) + amount);
                return {
                    ...d,
                    paidAmount: newPaidAmount,
                    isPaid: newPaidAmount >= d.totalAmount,
                    paymentDate: new Date().toISOString(),
                };
            }
            return d;
        });

        setDeliveries(updatedDeliveries);
        AsyncStorage.setItem(STORAGE_KEYS.DELIVERIES, JSON.stringify(updatedDeliveries));
    }, [deliveries]);

    const getTodaySummary = useCallback((): DailySummary => {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

        const formatDate = (date: Date) => date.toISOString().split("T")[0];
        const todayStr = formatDate(now);

        // Deliveries made today
        const todayDeliveries = deliveries.filter((d) => {
            const deliveryDate = new Date(d.deliveryDate);
            return deliveryDate >= startOfDay && deliveryDate < endOfDay;
        });

        // Payments received today (can be for any delivery date)
        const todayPayments = deliveries.reduce((sum, d) => {
            if (d.paymentDate) {
                const payDate = new Date(d.paymentDate);
                if (payDate >= startOfDay && payDate < endOfDay) {
                    // This is tricky because we only have the last paymentDate and total paidAmount.
                    // For a truly accurate "collected today", we'd need a transaction history.
                    // However, if paymentDate is today, we can at least count the paidAmount 
                    // if it was updated today.
                    // Improving: Use the current paidAmount if paymentDate is today.
                    return sum + (d.paidAmount || 0);
                }
            }
            return sum;
        }, 0);

        const totalSales = todayDeliveries.reduce((sum, d) => sum + d.totalAmount, 0);
        // Pending = total amount of today's deliveries minus whatever has been paid for THEM specifically
        const totalUnpaidForToday = todayDeliveries.reduce((sum, d) => sum + (d.totalAmount - (d.paidAmount || 0)), 0);

        return {
            date: todayStr,
            totalSales,
            totalPaid: todayPayments, // This shows collections made today
            totalUnpaid: totalUnpaidForToday,
            deliveryCount: todayDeliveries.length,
        };
    }, [deliveries]);

    const getUnpaidDeliveriesByShop = useCallback((shopId: string): Delivery[] => {
        return deliveries.filter((d) => d.shopId === shopId && !d.isPaid);
    }, [deliveries]);

    const saveShops = useCallback(async (newShops: Shop[]) => {
        try {
            setShops(newShops);
            await AsyncStorage.setItem(STORAGE_KEYS.SHOPS, JSON.stringify(newShops));
        } catch (error) {
            console.error("Error saving shops:", error);
        }
    }, []);

    const saveSellers = useCallback(async (newSellers: Seller[]) => {
        try {
            setSellers(newSellers);
            await AsyncStorage.setItem(STORAGE_KEYS.SELLERS, JSON.stringify(newSellers));
        } catch (error) {
            console.error("Error saving sellers:", error);
        }
    }, []);

    const saveSettings = useCallback(async (newSettings: AppSettings) => {
        try {
            // Optimistically update state first for immediate UI feedback
            setSettings(newSettings);
            // Then persist to storage
            await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));
        } catch (error) {
            console.error("Error saving settings:", error);
        }
    }, []);

    const saveDailyStockRecord = useCallback(async (record: DailyStockRecord) => {
        try {
            const updatedRecords = dailyStockRecords.filter(r => r.date !== record.date);
            updatedRecords.push(record);
            setDailyStockRecords(updatedRecords);
            await AsyncStorage.setItem(STORAGE_KEYS.DAILY_STOCK, JSON.stringify(updatedRecords));
        } catch (error) {
            console.error("Error saving daily stock record:", error);
        }
    }, [dailyStockRecords]);

    const getTodayStockRecord = useCallback(() => {
        const todayStr = new Date().toISOString().split("T")[0];
        return dailyStockRecords.find(r => r.date === todayStr);
    }, [dailyStockRecords]);

    const getSellerAnalytics = useCallback((): SellerAnalytics[] => {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

        const todayDeliveries = deliveries.filter((d: Delivery) => {
            const deliveryDate = new Date(d.deliveryDate);
            return deliveryDate >= startOfDay && deliveryDate < endOfDay;
        });

        const relevantSellers = sellers.filter(
            (s: Seller) => s.isActive || todayDeliveries.some((d: Delivery) => d.sellerId === s.id)
        );

        return relevantSellers.map((seller: Seller) => {
            const sellerDeliveries = todayDeliveries.filter((d: Delivery) => d.sellerId === seller.id);
            const totalSales = sellerDeliveries.reduce((sum: number, d: Delivery) => sum + d.totalAmount, 0);
            const totalPaid = sellerDeliveries.reduce((sum: number, d: Delivery) => sum + (d.paidAmount || 0), 0);
            const totalPending = totalSales - totalPaid;
            const uniqueShops = new Set(sellerDeliveries.map((d: Delivery) => d.shopId));

            return {
                seller,
                totalSales,
                totalPaid,
                totalPending,
                customerCount: uniqueShops.size,
                deliveryCount: sellerDeliveries.length,
            };
        });
    }, [deliveries, sellers]);

    const getDailyInventorySnapshot = useCallback(() => {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

        const todayDeliveries = deliveries.filter((d: Delivery) => {
            const deliveryDate = new Date(d.deliveryDate);
            return deliveryDate >= startOfDay && deliveryDate < endOfDay;
        });

        // Calculate items delivered today
        const itemsDelivered: { [key: string]: { name: string; quantity: number; revenue: number } } = {};

        todayDeliveries.forEach((delivery) => {
            delivery.items.forEach((item) => {
                const inventoryItem = inventory.find((i) => i.id === item.inventoryItemId);
                const itemName = item.name || inventoryItem?.name;

                if (itemName) {
                    if (!itemsDelivered[item.inventoryItemId]) {
                        itemsDelivered[item.inventoryItemId] = {
                            name: itemName,
                            quantity: 0,
                            revenue: 0,
                        };
                    }
                    itemsDelivered[item.inventoryItemId].quantity += item.quantity;
                    itemsDelivered[item.inventoryItemId].revenue += item.quantity * item.price;
                }
            });
        });

        // Calculate total revenue and "profit" (for now, just showing revenue as we don't track item costs)
        const totalRevenue = Object.values(itemsDelivered).reduce((sum, item) => sum + item.revenue, 0);
        const totalItemsSold = Object.values(itemsDelivered).reduce((sum, item) => sum + item.quantity, 0);

        return {
            itemsDelivered: Object.values(itemsDelivered).sort((a, b) => b.revenue - a.revenue),
            totalRevenue,
            totalItemsSold,
            // Simplified profit estimate (future: track actual item costs)
            estimatedProfit: totalRevenue, // For now, showing revenue as proxy for profit
        };
    }, [deliveries, inventory]);

    const getActiveShops = useCallback((): Shop[] => {
        if (settings.hideShopsAfterPaid) {
            return shops.filter((shop) => {
                const unpaid = getUnpaidDeliveriesByShop(shop.id);
                return shop.isActive && unpaid.length > 0;
            });
        }
        return shops.filter((shop) => shop.isActive);
    }, [shops, settings.hideShopsAfterPaid, getUnpaidDeliveriesByShop]);

    const colors = settings.darkMode ? DarkColors : LightColors;

    return useMemo(() => ({
        shops,
        inventory,
        deliveries,
        sellers,
        settings,
        isLoaded,
        colors,
        addDelivery,
        recordPayment,
        getTodaySummary,
        getUnpaidDeliveriesByShop,
        saveInventory,
        saveShops,
        saveSellers,
        saveSettings,
        saveDailyStockRecord,
        getTodayStockRecord,
        dailyStockRecords,
        getSellerAnalytics,
        getDailyInventorySnapshot,
        getActiveShops,
    }), [
        shops,
        inventory,
        deliveries,
        sellers,
        dailyStockRecords,
        settings,
        isLoaded,
        colors,
        addDelivery,
        recordPayment,
        getTodaySummary,
        getUnpaidDeliveriesByShop,
        saveInventory,
        saveShops,
        saveSellers,
        saveSettings,
        saveDailyStockRecord,
        getTodayStockRecord,
        getSellerAnalytics,
        getDailyInventorySnapshot,
        getActiveShops,
    ]);
});
