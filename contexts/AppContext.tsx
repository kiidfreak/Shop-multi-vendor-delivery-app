import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import { useEffect, useState, useCallback, useMemo } from "react";
import { Alert } from "react-native";
import type { Product, Order, Rider, AppSettings, OrderItem, Role, UserAccount } from "@/types";
import { LightColors, DarkColors } from "@/constants/colors";
import * as Haptics from "expo-haptics";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

const STORAGE_KEYS = {
    ORDERS: "mayhem_orders",
    SETTINGS: "mayhem_settings",
    RIDERS: "mayhem_riders",
    PRODUCTS: "mayhem_products",
    USER: "mayhem_user",
};

const ADMIN_PHONE = "0700000000";

// Mocks removed to enforce DB usage.

const DEFAULT_SETTINGS: AppSettings = {
    userName: "Fam",
    darkMode: true, // Default to dark for the vibe
};

export const [AppProvider, useApp] = createContextHook(() => {
    const [products, setProducts] = useState<Product[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [cart, setCart] = useState<OrderItem[]>([]);
    const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
    const [riders, setRiders] = useState<Rider[]>([]);
    const [currentRider, setCurrentRider] = useState<Rider | null>(null);
    const [activeRole, setActiveRole] = useState<Role>("USER");
    const [isLoaded, setIsLoaded] = useState(false);
    const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    // REAL-TIME UPDATES FROM SUPABASE
    useEffect(() => {
        if (!isSupabaseConfigured() || !currentUser || currentUser.isGuest) return;

        const channel = supabase
            .channel('orders-db-changes')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'orders',
                    filter: `user_id=eq.${currentUser.id}`
                },
                (payload) => {
                    const updatedOrder = payload.new as Order;
                    setOrders(prev => {
                        const exists = prev.find(o => o.id === updatedOrder.id);
                        if (exists) {
                            return prev.map(o => o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o);
                        }
                        return [updatedOrder, ...prev];
                    });

                    // Trigger specific haptic patterns for status change
                    if (payload.old && (payload.old as any).status !== updatedOrder.status) {
                        if (updatedOrder.status === "OnTheWay") {
                            // Triple pulse for 'On the Way'
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                            setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 100);
                            setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 200);
                        } else if (updatedOrder.status === "Delivered") {
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        } else {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        }
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentUser]);

    // REAL-TIME UPDATES (Listen to orders)
    useEffect(() => {
        if (!isSupabaseConfigured()) return;

        const channel = supabase
            .channel('admin-ops-changes')
            .on(
                'postgres_changes',
                {
                    event: '*', // Listen to INSERT, UPDATE, DELETE
                    schema: 'public',
                    table: 'orders',
                },
                (payload) => {
                    const newOrder = payload.new as Order;
                    setOrders(prev => {
                        if (payload.eventType === 'INSERT') {
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); // Alert for new order
                            return [newOrder, ...prev];
                        }
                        if (payload.eventType === 'UPDATE') {
                            const oldOrder = prev.find(o => o.id === newOrder.id);

                            // 1. Rider Fee Suggestion Alert (For Admin)
                            // Note: newOrder here is raw DB shape (snake_case). We need to map or check carefully.
                            // However, typescript thinks it is Order. Let's assume mapped or check properties manually.
                            const feeSuggested = (newOrder as any).fee_suggested || newOrder.feeSuggested;
                            const deliveryFee = (newOrder as any).delivery_fee || newOrder.deliveryFee;
                            const riderId = (newOrder as any).rider_id || newOrder.riderId;

                            if (feeSuggested && (!oldOrder?.feeSuggested || oldOrder.deliveryFee !== deliveryFee)) {
                                if (activeRole === "ADMIN") {
                                    Alert.alert("Fee Proposal 💸", `Rider suggested KES ${deliveryFee} for Order #${newOrder.id.slice(-4)}`);
                                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                                }
                            }

                            // 2. New Assignment Alert (For Rider)
                            if (activeRole === "RIDER" && currentRider && riderId === currentRider.id && oldOrder?.riderId !== currentRider.id) {
                                Alert.alert("New Duty Assigned 🏍️", `Order #${newOrder.id.slice(-4)} is yours!`);
                                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            }

                            // 3. Customer Updates Alert (For User)
                            const userId = (newOrder as any).user_id || newOrder.userId; // user_id in DB
                            if (activeRole === "USER" && currentUser && userId === currentUser.id) {
                                if (newOrder.status === "Delivered" && oldOrder?.status !== "Delivered") {
                                    Alert.alert("Stash Dropped! ✅", "Enjoy the vibes. Rate your rider?");
                                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                                } else if (newOrder.status === "OnTheWay" && oldOrder?.status !== "OnTheWay") {
                                    Alert.alert("Incoming! 🚀", `Rider is ${newOrder.deliveryEstimate || 'minutes'} away.`);
                                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                                } else if (newOrder.status === "Accepted" && oldOrder?.status !== "Accepted") {
                                    Alert.alert("Order Accepted 👍", "A rider has been assigned.");
                                }
                            }
                        }
                        return prev.map(o => o.id === newOrder.id ? { ...o, ...newOrder } : o);
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [activeRole]);

    const loadData = async () => {
        try {
            const [ordersData, settingsData, ridersData, productsData, userData] = await Promise.all([
                AsyncStorage.getItem(STORAGE_KEYS.ORDERS),
                AsyncStorage.getItem(STORAGE_KEYS.SETTINGS),
                AsyncStorage.getItem(STORAGE_KEYS.RIDERS),
                AsyncStorage.getItem(STORAGE_KEYS.PRODUCTS),
                AsyncStorage.getItem(STORAGE_KEYS.USER),
            ]);

            setOrders(ordersData ? JSON.parse(ordersData) : []);
            setSettings(settingsData ? JSON.parse(settingsData) : DEFAULT_SETTINGS);
            if (ridersData) setRiders(JSON.parse(ridersData));
            if (productsData) setProducts(JSON.parse(productsData));

            let loadedUser: UserAccount | null = null;
            if (userData) {
                loadedUser = JSON.parse(userData);
                setCurrentUser(loadedUser);
            }

            setIsLoaded(true);

            // CLOUD FETCH IF LOGGED IN
            if (isSupabaseConfigured()) {
                if (loadedUser && !loadedUser.isGuest) {
                    // Fetch user's orders
                    supabase.from('orders').select('*').eq('user_id', loadedUser.id).order('created_at', { ascending: false })
                        .then(({ data, error }) => {
                            if (data && !error) setOrders(data);
                        });
                } else if (activeRole !== "USER") {
                    // Admin/Rider fetches ALL active orders
                    supabase.from('orders').select('*').neq('status', 'Delivered').order('created_at', { ascending: false })
                        .then(({ data, error }) => {
                            if (data && !error) setOrders(prev => {
                                // Merge logic: prioritize cloud for active orders
                                const nonDelivered = data;
                                const delivered = prev.filter(o => o.status === 'Delivered');
                                return [...nonDelivered, ...delivered];
                            });
                        });
                }

                // Fetch Riders and Products from Cloud
                supabase.from('riders').select('*').then(({ data, error }) => {
                    if (data && !error) setRiders(data);
                });
                supabase.from('products').select('*').then(({ data, error }) => {
                    if (data && !error) setProducts(data);
                });
            }
        } catch (error) {
            console.error("Error loading data:", error);
            setIsLoaded(true);
        }
    };

    const addToCart = useCallback((product: Product) => {
        setCart((prev) => {
            const existing = prev.find((p) => p.productId === product.id);
            if (existing) {
                return prev.map((p) =>
                    p.productId === product.id ? { ...p, quantity: p.quantity + 1 } : p
                );
            }
            return [...prev, { productId: product.id, quantity: 1, price: product.price }];
        });
    }, []);

    const removeFromCart = useCallback((productId: string) => {
        setCart((prev) => {
            const existing = prev.find((p) => p.productId === productId);
            if (existing && existing.quantity > 1) {
                return prev.map((p) =>
                    p.productId === productId ? { ...p, quantity: p.quantity - 1 } : p
                );
            }
            return prev.filter((p) => p.productId !== productId);
        });
    }, []);

    const clearCart = useCallback(() => setCart([]), []);

    const placeOrder = useCallback(async (deliveryDetails?: { name: string; phone: string; location: string }) => {
        if (cart.length === 0) return;

        const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

        const newOrder: Order = {
            id: Date.now().toString(),
            userId: currentUser?.id,
            items: [...cart],
            totalAmount,
            status: "Pending",
            createdAt: new Date().toISOString(),
            deliveryDetails,
        };

        const updatedOrders = [newOrder, ...orders];
        setOrders(updatedOrders);
        await AsyncStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(updatedOrders));

        // SYNC TO SUPABASE IF CONFIGURED & NOT GUEST
        if (isSupabaseConfigured() && currentUser && !currentUser.isGuest) {
            try {
                // Ensure user exists in cloud first to satisfy foreign key
                await supabase.from('users').upsert({
                    id: currentUser.id,
                    phone: currentUser.phone,
                    name: currentUser.name,
                    is_guest: false,
                    avatar: currentUser.avatar,
                    created_at: currentUser.createdAt
                });

                const { error } = await supabase.from('orders').insert({
                    id: newOrder.id,
                    user_id: currentUser.id,
                    items: newOrder.items,
                    total_amount: newOrder.totalAmount, // mapped to total_amount
                    status: newOrder.status,
                    delivery_details: newOrder.deliveryDetails, // mapped to delivery_details
                    created_at: newOrder.createdAt
                });
                if (error) console.error("Supabase sync error:", error);
            } catch (err) {
                console.error("Failed to sync order to cloud:", err);
            }
        }

        setCart([]);
    }, [cart, orders, currentUser]);

    const updateOrderStatus = useCallback(async (orderId: string, status: Order["status"], updates?: Partial<Order>) => {
        setOrders((prev) => {
            const updated = prev.map((o) => {
                if (o.id === orderId) {
                    // Auto-update completed orders for rider
                    if (status === "Delivered" && o.riderId && currentRider) {
                        // Note: We should ideally update rider stats here too, but simple for now
                    }
                    return { ...o, status, ...updates };
                }
                return o;
            });
            AsyncStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(updated));

            // SYNC STATUS TO SUPABASE
            if (isSupabaseConfigured()) {
                const supabaseUpdates: any = { status };
                if (updates?.deliveryEstimate) supabaseUpdates.delivery_estimate = updates.deliveryEstimate;
                if (updates?.deliveryFee) supabaseUpdates.delivery_fee = updates.deliveryFee;
                if (updates?.paymentMethod) supabaseUpdates.payment_method = updates.paymentMethod;
                if (updates?.feeSuggested !== undefined) supabaseUpdates.fee_suggested = updates.feeSuggested;
                if (updates?.riderId) supabaseUpdates.rider_id = updates.riderId;

                supabase.from('orders').update(supabaseUpdates).eq('id', orderId).then(({ error }) => {
                    if (error) console.error("Supabase status sync error:", error);
                });

                supabase.from('orders').update(supabaseUpdates).eq('id', orderId).then(({ error }) => {
                    if (error) console.error("Supabase status sync error:", error);
                });
            }

            return updated;
        });
    }, [currentRider, riders]);

    const reOrder = useCallback((orderId: string) => {
        const order = orders.find((o) => o.id === orderId);
        if (order) {
            setCart(order.items);
        }
    }, [orders]);

    const colors = settings.darkMode ? DarkColors : LightColors;

    const normalizePhone = (p: string) => {
        let phone = p.replace(/\s+/g, '').replace(/[^\d+]/g, '');
        // Expand normalization to handle common Kenya formats
        if (phone.startsWith('+254')) phone = '0' + phone.slice(4);
        if (phone.startsWith('254')) phone = '0' + phone.slice(3);
        return phone;
    };

    const checkPhoneRole = useCallback((phone: string): Role => {
        const normalized = normalizePhone(phone);

        // Admin Phone check
        if (normalized === ADMIN_PHONE) return "ADMIN";

        const isRider = riders.some(r => normalizePhone(r.phone) === normalized);
        if (isRider) return "RIDER";

        return "USER";
    }, [riders]);

    const attemptLogin = useCallback(async (pin: string, phone?: string): Promise<boolean> => {
        const normalizedPhone = phone ? normalizePhone(phone) : undefined;

        // Admin Check (Hardcoded for now, but could be moved to DB)
        if (pin === "0000" && (!normalizedPhone || normalizedPhone === ADMIN_PHONE)) {
            setActiveRole("ADMIN");
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            return true;
        }

        // Rider Check - Try Local First
        const localRider = riders.find(r => r.pin === pin && (!normalizedPhone || normalizePhone(r.phone) === normalizedPhone));
        if (localRider) {
            setActiveRole("RIDER");
            setCurrentRider(localRider);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            return true;
        }

        // Rider Check - Try Supabase (In case local isn't fully synced or PIN changed)
        if (isSupabaseConfigured() && normalizedPhone) {
            try {
                const { data, error } = await supabase.from('riders')
                    .select('*')
                    .eq('phone', normalizedPhone)
                    .eq('pin', pin) // Assuming pin is stored (should be hashed in production)
                    .single();

                if (data && !error) {
                    setActiveRole("RIDER");
                    setCurrentRider(data);
                    // Update local riders list if this one was missing/outdated
                    setRiders(prev => {
                        const exists = prev.find(r => r.id === data.id);
                        if (exists) return prev.map(r => r.id === data.id ? data : r);
                        return [...prev, data];
                    });
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    return true;
                }
            } catch (err) {
                console.error("Supabase login check failed", err);
            }
        }

        // Fail
        return false;
    }, [riders]);

    const logoutRole = useCallback(() => {
        setActiveRole("USER");
        setCurrentRider(null);
    }, []);

    // --- Admin Functions ---
    const addRider = useCallback((rider: Rider) => {
        setRiders(prev => {
            // Check for duplicates by ID or Phone
            if (prev.some(r => r.id === rider.id || r.phone === rider.phone)) {
                console.warn("Rider already exists, skipping add.");
                return prev;
            }
            const updated = [...prev, rider];
            AsyncStorage.setItem(STORAGE_KEYS.RIDERS, JSON.stringify(updated));

            // SYNC TO SUPABASE
            if (isSupabaseConfigured()) {
                supabase.from('riders').insert({
                    id: rider.id,
                    name: rider.name,
                    phone: rider.phone,
                    pin: rider.pin,
                    status: rider.status,
                    rating: rider.rating,
                    status_summary: rider.statusSummary,
                    orders_completed: rider.ordersCompleted,
                    avatar: rider.avatar
                }).then(({ error }) => {
                    if (error) console.error("Rider add error:", error);
                });
            }

            return updated;
        });
    }, []);

    const updateRider = useCallback((riderId: string, updates: Partial<Rider>) => {
        setRiders(prev => {
            const riderIndex = prev.findIndex(r => r.id === riderId);
            if (riderIndex === -1) return prev;

            const updatedRider = { ...prev[riderIndex], ...updates };
            const updated = [...prev];
            updated[riderIndex] = updatedRider;

            AsyncStorage.setItem(STORAGE_KEYS.RIDERS, JSON.stringify(updated));

            // SYNC TO SUPABASE
            if (isSupabaseConfigured()) {
                const dbUpdates: any = {};
                if (updates.name !== undefined) dbUpdates.name = updates.name;
                if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
                if (updates.pin !== undefined) dbUpdates.pin = updates.pin;
                if (updates.status !== undefined) dbUpdates.status = updates.status;
                if (updates.rating !== undefined) dbUpdates.rating = updates.rating;
                if (updates.statusSummary !== undefined) dbUpdates.status_summary = updates.statusSummary;
                if (updates.ordersCompleted !== undefined) dbUpdates.orders_completed = updates.ordersCompleted;
                if (updates.avatar !== undefined) dbUpdates.avatar = updates.avatar;

                supabase.from('riders').update(dbUpdates).eq('id', riderId).then(({ error }) => {
                    if (error) console.error("Rider sync error:", error);
                });
            }

            // Update currentRider if it's the one logged in
            if (currentRider?.id === riderId) {
                setCurrentRider(updatedRider);
            }

            return updated;
        });
    }, [currentRider]);

    const addProduct = useCallback((product: Product) => {
        setProducts(prev => {
            const updated = [...prev, product];
            AsyncStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updated));

            // SYNC TO SUPABASE
            if (isSupabaseConfigured()) {
                supabase.from('products').insert({
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    category: product.category,
                    description: product.description,
                    is_popular: product.isPopular,
                    in_stock: product.inStock
                }).then(({ error }) => {
                    if (error) console.error("Product add error:", error);
                });
            }

            return updated;
        });
    }, []);

    const updateProduct = useCallback((productId: string, updates: Partial<Product>) => {
        setProducts(prev => {
            const updated = prev.map(p => p.id === productId ? { ...p, ...updates } : p);
            AsyncStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updated));
            // SYNC TO SUPABASE
            if (isSupabaseConfigured()) {
                const dbUpdates: any = { ...updates };
                // Map camelCase to snake_case for DB
                if (updates.inStock !== undefined) {
                    dbUpdates.in_stock = updates.inStock;
                    delete dbUpdates.inStock;
                }
                if (updates.isPopular !== undefined) {
                    dbUpdates.is_popular = updates.isPopular;
                    delete dbUpdates.isPopular;
                }

                supabase.from('products').update(dbUpdates).eq('id', productId).then(({ error }) => {
                    if (error) console.error("Product sync error:", error);
                });
            }
            return updated;
        });
    }, []);

    const assignRiderToOrder = useCallback((orderId: string, riderId: string) => {
        const rider = riders.find(r => r.id === riderId);
        if (!rider) return;

        setOrders(prev => {
            const updated = prev.map(o => {
                if (o.id === orderId) {
                    return { ...o, riderId: riderId, status: "Accepted" as const }; // Accepted = Assigned
                }
                return o;
            });
            AsyncStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(updated));

            // SYNC TO SUPABASE
            if (isSupabaseConfigured()) {
                supabase.from('orders').update({
                    rider_id: riderId,
                    status: "Accepted"
                }).eq('id', orderId).then(({ error }) => {
                    if (error) console.error("Rider assign sync error:", error);
                });
            }

            return updated;
        });
    }, [riders]);

    // --- User Account Management ---
    const createUserAccount = useCallback(async (phone: string, name?: string) => {
        // CHECK IF BANNED IN CLOUD FIRST
        if (isSupabaseConfigured()) {
            const { data, error } = await supabase.from('users').select('*').eq('phone', phone).single();
            if (data && data.is_banned) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                throw new Error("ACCOUNT_BANNED");
            }

            // CHECK IF IT'S A RIDER NUMBER
            const { data: riderData } = await supabase.from('riders').select('*').eq('phone', phone).single();
            if (riderData) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                throw new Error("IS_RIDER");
            }

            // If user already exists, just load them
            if (data) {
                const existingUser: UserAccount = {
                    id: data.id,
                    phone: data.phone,
                    name: data.name,
                    avatar: data.avatar,
                    createdAt: data.created_at,
                    isGuest: data.is_guest,
                    isBanned: data.is_banned
                };
                setCurrentUser(existingUser);
                await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(existingUser));
                return existingUser;
            }
        }

        const newUser: UserAccount = {
            id: Date.now().toString(),
            phone,
            name,
            createdAt: new Date().toISOString(),
            isGuest: false,
        };
        setCurrentUser(newUser);
        await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(newUser));

        // SYNC TO SUPABASE
        if (isSupabaseConfigured()) {
            supabase.from('users').insert({
                id: newUser.id,
                phone: newUser.phone,
                name: newUser.name,
                is_guest: false,
                created_at: newUser.createdAt
            }).then(({ error }) => {
                if (error) console.error("User sync error:", error);
            });
        }

        // Update settings with name if provided
        if (name) {
            setSettings(prev => {
                const updated = { ...prev, userName: name };
                AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
                return updated;
            });
        }
        return newUser;
    }, []);

    const banUser = useCallback(async (userId: string) => {
        if (!isSupabaseConfigured()) return;
        const { error } = await supabase.from('users').update({ is_banned: true }).eq('id', userId);
        if (error) {
            console.error("Ban sync error:", error);
            throw error;
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, []);

    const searchUsers = useCallback(async (query: string) => {
        if (!isSupabaseConfigured()) return [];
        const { data, error } = await supabase.from('users').select('*')
            .or(`phone.ilike.%${query}%,name.ilike.%${query}%`)
            .limit(10);

        if (error) {
            console.error("Search users error:", error);
            return [];
        }
        return data.map((u: any) => ({
            id: u.id,
            phone: u.phone,
            name: u.name,
            isGuest: u.is_guest,
            isBanned: u.is_banned,
            createdAt: u.created_at,
            avatar: u.avatar
        }));
    }, []);

    const loginAsGuest = useCallback(async () => {
        const guestUser: UserAccount = {
            id: `guest_${Date.now()}`,
            phone: '',
            createdAt: new Date().toISOString(),
            isGuest: true,
        };
        setCurrentUser(guestUser);
        await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(guestUser));
        return guestUser;
    }, []);

    const logoutUser = useCallback(async () => {
        setCurrentUser(null);
        setActiveRole("USER");
        setCurrentRider(null);
        await AsyncStorage.removeItem(STORAGE_KEYS.USER);
    }, []);

    const updateUser = useCallback(async (updates: Partial<UserAccount>) => {
        if (!currentUser) return;
        const updatedUser = { ...currentUser, ...updates };
        setCurrentUser(updatedUser);
        await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));

        // SYNC TO SUPABASE
        if (isSupabaseConfigured() && !currentUser.isGuest) {
            supabase.from('users').update({
                name: updatedUser.name,
                avatar: updatedUser.avatar,
                phone: updatedUser.phone
            }).eq('id', currentUser.id).then(({ error }) => {
                if (error) console.error("User update sync error:", error);
            });
        }

        // Keep settings in sync if name changed
        if (updates.name) {
            setSettings(prev => ({ ...prev, userName: updates.name as string }));
        }
    }, [currentUser]);

    const toggleDarkMode = useCallback(() => {
        setSettings(prev => {
            const updated = { ...prev, darkMode: !prev.darkMode };
            AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
            return updated;
        });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, []);



    return useMemo(() => ({
        products,
        orders,
        cart,
        settings,
        currentRider,
        activeRole,
        isLoaded,
        colors,
        currentUser,
        addToCart,
        removeFromCart,
        clearCart,
        placeOrder,
        reOrder,
        updateOrderStatus,
        attemptLogin,
        logoutRole,
        riders,
        addRider,
        updateRider,
        addProduct,
        updateProduct,
        assignRiderToOrder,
        createUserAccount,
        loginAsGuest,
        logoutUser,
        updateUser,
        toggleDarkMode,
        banUser,
        searchUsers,
        checkPhoneRole,
        refreshData: loadData,
    }), [products, orders, cart, settings, currentRider, activeRole, isLoaded, colors, riders, currentUser, addToCart, removeFromCart, clearCart, placeOrder, reOrder, updateOrderStatus, attemptLogin, logoutRole, addRider, updateRider, addProduct, updateProduct, assignRiderToOrder, createUserAccount, loginAsGuest, logoutUser, updateUser, toggleDarkMode, banUser, searchUsers, checkPhoneRole, loadData]);

});
