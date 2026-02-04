import { Stack, router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { User, Store, Plus, Edit2, Trash2, DollarSign, Settings as SettingsIcon, BarChart3, Moon, Package, Lock, ShieldCheck, Delete, X } from "lucide-react-native";
import React, { useState, useEffect, useCallback } from "react";
import { ScrollView, StyleSheet, Text, View, TouchableOpacity, Modal, TextInput, Alert, Pressable, Switch, Image, KeyboardAvoidingView, Platform, RefreshControl, TouchableWithoutFeedback, Vibration } from "react-native";
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "@/contexts/AppContext";
import Toast from "react-native-toast-message";

import type { Shop, Seller, InventoryItem } from "@/types";

export default function ProfileScreen() {
    const { shops, sellers, inventory, settings, saveShops, saveSellers, saveInventory, saveSettings, colors: Colors } = useApp();
    const styles = React.useMemo(() => createStyles(Colors), [Colors]);
    const { action } = useLocalSearchParams();

    const [showShopModal, setShowShopModal] = useState(false);
    const [showAllShops, setShowAllShops] = useState(false);
    const [showSellerModal, setShowSellerModal] = useState(false);
    const [showPriceModal, setShowPriceModal] = useState(false);
    const [editingShop, setEditingShop] = useState<Shop | null>(null);
    const [editingSeller, setEditingSeller] = useState<Seller | null>(null);
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

    const [shopName, setShopName] = useState("");
    const [shopOwner, setShopOwner] = useState("");
    const [shopLocation, setShopLocation] = useState("");
    const [shopPhone, setShopPhone] = useState("");

    const [sellerName, setSellerName] = useState("");
    const [sellerPhone, setSellerPhone] = useState("");

    const [itemPrice, setItemPrice] = useState("");
    const [itemThreshold, setItemThreshold] = useState("");
    const [itemName, setItemName] = useState("");
    const [itemUnit, setItemUnit] = useState("pieces");

    const [showProfileModal, setShowProfileModal] = useState(false);
    const [tempUserName, setTempUserName] = useState(settings.userName);
    const [tempBusinessName, setTempBusinessName] = useState(settings.businessName);
    const [refreshing, setRefreshing] = useState(false);

    // PIN State
    const [showPinModal, setShowPinModal] = useState(false);
    const [pinFlow, setPinFlow] = useState<"setup" | "change" | "disable">("setup");
    const [pinStep, setPinStep] = useState<"verify" | "create" | "confirm">("create");
    const [pinInput, setPinInput] = useState("");
    const [firstPin, setFirstPin] = useState("");
    const [pinError, setPinError] = useState(false);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setTimeout(() => setRefreshing(false), 800);
    }, []);

    // PIN Logic
    const startPinFlow = (type: "setup" | "change" | "disable") => {
        setPinFlow(type);
        setPinInput("");
        setFirstPin("");
        setPinError(false);

        if (type === "setup") setPinStep("create");
        else if (type === "change" || type === "disable") setPinStep("verify");

        setShowPinModal(true);
    };

    const handlePinPress = (digit: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (pinInput.length < 4) {
            setPinInput(prev => prev + digit);
            setPinError(false);
        }
    };

    const handlePinBackspace = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setPinInput(prev => prev.slice(0, -1));
        setPinError(false);
    };

    useEffect(() => {
        if (pinInput.length === 4) {
            processPinStep();
        }
    }, [pinInput]);

    const processPinStep = async () => {
        // Give a small delay for the 4th dot to fill visibly
        await new Promise(resolve => setTimeout(resolve, 100));

        if (pinStep === "verify") {
            if (pinInput === settings.appPin) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                if (pinFlow === "disable") {
                    await saveSettings({ ...settings, appPin: undefined });
                    setShowPinModal(false);
                    Toast.show({ type: "success", text1: "App Lock Disabled", text2: "PIN protection has been removed." });
                } else if (pinFlow === "change") {
                    setPinStep("create");
                    setPinInput("");
                }
            } else {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                Vibration.vibrate();
                setPinError(true);
                setPinInput("");
                Toast.show({ type: "error", text1: "Incorrect PIN", text2: "Please try again." });
            }
        } else if (pinStep === "create") {
            setFirstPin(pinInput);
            setPinStep("confirm");
            setPinInput("");
        } else if (pinStep === "confirm") {
            if (pinInput === firstPin) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                await saveSettings({ ...settings, appPin: pinInput });
                setShowPinModal(false);
                Toast.show({
                    type: "success",
                    text1: pinFlow === "change" ? "PIN Changed" : "App Lock Enabled",
                    text2: "Your app is now secured."
                });
            } else {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                Vibration.vibrate();
                setPinError(true);
                setPinInput("");
                setPinStep("create"); // Restart creation
                Toast.show({ type: "error", text1: "PINs did not match", text2: "Please try again." });
            }
        }
    };

    const openShopModal = (shop?: Shop) => {
        if (shop) {
            setEditingShop(shop);
            setShopName(shop.name);
            setShopOwner(shop.owner);
            setShopLocation(shop.location);
            setShopPhone(shop.phone || "");
        } else {
            setEditingShop(null);
            setShopName("");
            setShopOwner("");
            setShopLocation("");
            setShopPhone("");
        }
        setShowShopModal(true);
    };

    const openSellerModal = (seller?: Seller) => {
        if (seller) {
            setEditingSeller(seller);
            setSellerName(seller.name);
            setSellerPhone(seller.phone || "");
        } else {
            setEditingSeller(null);
            setSellerName("");
            setSellerPhone("");
        }
        setShowSellerModal(true);
    };

    const openPriceModal = (item?: InventoryItem) => {
        if (item) {
            setEditingItem(item);
            setItemName(item.name);
            setItemPrice(item.price.toString());
            setItemThreshold(item.lowStockThreshold.toString());
            setItemUnit(item.unit || "pieces");
        } else {
            setEditingItem(null);
            setItemName("");
            setItemPrice("");
            setItemThreshold(settings.defaultLowStockThreshold?.toString() || "10");
            setItemUnit("pieces");
        }
        setShowPriceModal(true);
    };

    useEffect(() => {
        if (action === "add-shop") {
            openShopModal();
        } else if (action === "add-seller") {
            openSellerModal();
        }
    }, [action]);

    const handleSaveShop = async () => {
        if (!shopName || !shopOwner || !shopLocation) {
            Toast.show({
                type: "error",
                text1: "Missing fields",
                text2: "Please fill all required fields",
            });
            return;
        }

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        if (editingShop) {
            const updatedShops = shops.map((s) =>
                s.id === editingShop.id
                    ? { ...s, name: shopName, owner: shopOwner, location: shopLocation, phone: shopPhone || undefined }
                    : s
            );
            await saveShops(updatedShops);
        } else {
            const newShop: Shop = {
                id: Date.now().toString(),
                name: shopName,
                owner: shopOwner,
                location: shopLocation,
                phone: shopPhone || undefined,
                isActive: true,
            };
            await saveShops([...shops, newShop]);
        }
        setShowShopModal(false);
        Toast.show({
            type: "success",
            text1: editingShop ? "Shop Updated! 🏪" : "Shop Registered! ✨",
            text2: `${shopName} has been saved successfully.`,
        });
    };

    const handleSaveSeller = async () => {
        if (!sellerName) {
            Toast.show({
                type: "error",
                text1: "Missing name",
                text2: "Please enter seller name",
            });
            return;
        }

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        if (editingSeller) {
            const updatedSellers = sellers.map((s) =>
                s.id === editingSeller.id ? { ...s, name: sellerName, phone: sellerPhone || undefined } : s
            );
            await saveSellers(updatedSellers);
        } else {
            const newSeller: Seller = {
                id: Date.now().toString(),
                name: sellerName,
                phone: sellerPhone || undefined,
                isActive: true,
            };
            await saveSellers([...sellers, newSeller]);
        }
        setShowSellerModal(false);
        Toast.show({
            type: "success",
            text1: editingSeller ? "Seller Updated! 👤" : "Seller Added! ✨",
            text2: `${sellerName} is ready to work.`,
        });
    };

    const handleSavePrice = async () => {
        if (!itemName || !itemPrice || !itemThreshold) {
            Toast.show({
                type: "error",
                text1: "Missing fields",
                text2: "Please fill all fields",
            });
            return;
        }

        const price = parseFloat(itemPrice);
        const threshold = parseInt(itemThreshold);

        if (isNaN(price) || isNaN(threshold)) {
            Toast.show({
                type: "error",
                text1: "Invalid input",
                text2: "Please enter valid numbers",
            });
            return;
        }

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        if (editingItem) {
            const updatedInventory = inventory.map((item) =>
                item.id === editingItem.id ? { ...item, name: itemName, price, lowStockThreshold: threshold, unit: itemUnit } : item
            );
            await saveInventory(updatedInventory);
        } else {
            const newItem: InventoryItem = {
                id: Date.now().toString(),
                name: itemName,
                price,
                currentStock: 0,
                unit: itemUnit,
                lowStockThreshold: threshold,
            };
            await saveInventory([...inventory, newItem]);
        }
        setShowPriceModal(false);
        Toast.show({
            type: "success",
            text1: editingItem ? "Item Updated! 📦" : "Item Created! ✨",
            text2: `${itemName} is now ready for use.`,
        });
    };

    const handleDeleteShop = async (shopId: string) => {
        Alert.alert("Archive Shop", "Archive this shop?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Archive",
                style: "destructive",
                onPress: async () => {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    const updatedShops = shops.map((s: Shop) => (s.id === shopId ? { ...s, isActive: false } : s));
                    await saveShops(updatedShops);
                },
            },
        ]);
    };

    const handleDeleteSeller = async (sellerId: string) => {
        Alert.alert("Archive Seller", "Archive this seller?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Archive",
                style: "destructive",
                onPress: async () => {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    const updatedSellers = sellers.map((s: Seller) => (s.id === sellerId ? { ...s, isActive: false } : s));
                    await saveSellers(updatedSellers);
                },
            },
        ]);
    };

    const toggleHideShopsAfterPaid = async (value: boolean) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        await saveSettings({ ...settings, hideShopsAfterPaid: value });
    };

    const pickImage = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled) {
            await saveSettings({ ...settings, profileImage: result.assets[0].uri });
        }
    };

    const handleSaveProfile = async () => {
        if (!tempUserName || !tempBusinessName) {
            Toast.show({
                type: "error",
                text1: "Missing fields",
                text2: "Please fill all profile fields",
            });
            return;
        }

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await saveSettings({ ...settings, userName: tempUserName, businessName: tempBusinessName });
        setShowProfileModal(false);
        Toast.show({
            type: "info",
            text1: "Profile Updated! 👋",
            text2: `Preferences saved for ${tempBusinessName}.`,
        });
    };

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            <Stack.Screen
                options={{
                    headerShown: false,
                }}
            />

            {/* Sticky Header - Profile Section */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.profileIconContainer} onPress={pickImage}>
                    {settings.profileImage ? (
                        <Image source={{ uri: settings.profileImage }} style={styles.profileImage} />
                    ) : (
                        <User size={40} color={Colors.primary} />
                    )}
                    <View style={styles.editBadge}>
                        <Edit2 size={12} color={Colors.card} />
                    </View>
                </TouchableOpacity>
                <Text style={styles.title}>{settings.businessName}</Text>
                <TouchableOpacity
                    style={styles.editProfileButton}
                    onPress={() => {
                        setTempUserName(settings.userName);
                        setTempBusinessName(settings.businessName);
                        setShowProfileModal(true);
                    }}
                >
                    <Text style={styles.editProfileText}>Edit Profile</Text>
                </TouchableOpacity>
            </View>

            {/* Scrollable Content */}
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={Colors.primary}
                        colors={[Colors.primary]}
                        progressBackgroundColor={Colors.card}
                    />
                }
            >
                <Pressable
                    style={({ pressed }) => [styles.analyticsCard, pressed && styles.cardPressed]}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        router.push("/analytics");
                    }}
                >
                    <BarChart3 size={24} color={Colors.primary} />
                    <View style={styles.analyticsTextContainer}>
                        <Text style={styles.analyticsTitle}>View Analytics</Text>
                        <Text style={styles.analyticsSubtitle}>See detailed sales breakdown by seller</Text>
                    </View>
                </Pressable>

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Shops</Text>
                        <Pressable
                            style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]}
                            onPress={() => openShopModal()}
                        >
                            <Plus size={20} color={Colors.card} />
                        </Pressable>
                    </View>

                    {shops
                        .filter((s: Shop) => s.isActive)
                        .slice(0, showAllShops ? undefined : 3)
                        .map((shop: Shop) => (
                            <View key={shop.id} style={styles.listItem}>
                                <Store size={20} color={Colors.primary} />
                                <View style={styles.listItemContent}>
                                    <Text style={styles.listItemTitle}>{shop.name}</Text>
                                    <Text style={styles.listItemSubtitle}>{shop.location}</Text>
                                </View>
                                <TouchableOpacity onPress={() => openShopModal(shop)} style={styles.iconButton}>
                                    <Edit2 size={18} color={Colors.primary} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => handleDeleteShop(shop.id)} style={styles.iconButton}>
                                    <Trash2 size={18} color={Colors.error} />
                                </TouchableOpacity>
                            </View>
                        ))}

                    {shops.filter((s: Shop) => s.isActive).length > 3 && (
                        <TouchableOpacity
                            style={styles.moreButton}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setShowAllShops(!showAllShops);
                            }}
                        >
                            <Text style={styles.moreButtonText}>
                                {showAllShops ? "Show Less" : `Show ${shops.filter((s: Shop) => s.isActive).length - 3} More Shops`}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Sellers</Text>
                        <Pressable
                            style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]}
                            onPress={() => openSellerModal()}
                        >
                            <Plus size={20} color={Colors.card} />
                        </Pressable>
                    </View>

                    {sellers.filter((s: Seller) => s.isActive).map((seller: Seller) => (
                        <View key={seller.id} style={styles.listItem}>
                            <User size={20} color={Colors.primary} />
                            <View style={styles.listItemContent}>
                                <Text style={styles.listItemTitle}>{seller.name}</Text>
                                {seller.phone && <Text style={styles.listItemSubtitle}>{seller.phone}</Text>}
                            </View>
                            <TouchableOpacity onPress={() => openSellerModal(seller)} style={styles.iconButton}>
                                <Edit2 size={18} color={Colors.primary} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleDeleteSeller(seller.id)} style={styles.iconButton}>
                                <Trash2 size={18} color={Colors.error} />
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Item Prices & Thresholds</Text>
                        <TouchableOpacity onPress={() => openPriceModal()} style={styles.addButtonMini}>
                            <Plus size={18} color={Colors.primary} />
                            <Text style={styles.addButtonText}>Add</Text>
                        </TouchableOpacity>
                    </View>

                    {inventory.map((item) => (
                        <Pressable
                            key={item.id}
                            style={({ pressed }) => [styles.listItem, pressed && styles.listItemPressed]}
                            onPress={() => openPriceModal(item)}
                        >
                            <DollarSign size={20} color={Colors.success} />
                            <View style={styles.listItemContent}>
                                <Text style={styles.listItemTitle}>{item.name}</Text>
                                <Text style={styles.listItemSubtitle}>
                                    KES {item.price} • Alert at {item.lowStockThreshold} {item.unit}
                                </Text>
                            </View>
                            <Edit2 size={18} color={Colors.primary} />
                        </Pressable>
                    ))}
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Settings</Text>
                    </View>

                    <View style={styles.settingItem}>
                        <SettingsIcon size={20} color={Colors.primary} />
                        <View style={styles.settingContent}>
                            <Text style={styles.settingTitle}>Hide Paid Shops</Text>
                            <Text style={styles.settingSubtitle}>Hide shops with no pending payments</Text>
                        </View>
                        <Switch
                            value={settings.hideShopsAfterPaid}
                            onValueChange={toggleHideShopsAfterPaid}
                            trackColor={{ false: Colors.border, true: Colors.primary }}
                            thumbColor={Colors.card}
                        />
                    </View>

                    <View style={styles.settingDivider} />

                    <View style={styles.settingItem}>
                        <Moon size={20} color={Colors.primary} />
                        <View style={styles.settingContent}>
                            <Text style={styles.settingTitle}>Dark Mode</Text>
                            <Text style={styles.settingSubtitle}>Switch to dark theme</Text>
                        </View>
                        <Switch
                            value={settings.darkMode}
                            onValueChange={async (value) => {
                                await saveSettings({ ...settings, darkMode: value });
                            }}
                            trackColor={{ false: Colors.border, true: Colors.primary }}
                            thumbColor={Colors.card}
                        />
                    </View>

                    <View style={styles.settingDivider} />

                    <View style={styles.settingItem}>
                        <Package size={20} color={Colors.primary} />
                        <View style={styles.settingContent}>
                            <Text style={styles.settingTitle}>Daily Stock Management</Text>
                            <Text style={styles.settingSubtitle}>Enable profit tracking via daily stock</Text>
                        </View>
                        <Switch
                            value={settings.enableDailyStock}
                            onValueChange={async (value) => {
                                await saveSettings({ ...settings, enableDailyStock: value });
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            }}
                            trackColor={{ false: Colors.border, true: Colors.primary }}
                            thumbColor={Colors.card}
                        />
                    </View>

                    <View style={styles.settingDivider} />

                    <View style={styles.settingItem}>
                        <ShieldCheck size={20} color={Colors.primary} />
                        <View style={styles.settingContent}>
                            <Text style={styles.settingTitle}>App Lock</Text>
                            <Text style={styles.settingSubtitle}>Secure app with a PIN</Text>
                        </View>
                        <Switch
                            value={!!settings.appPin}
                            onValueChange={(value) => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                if (value) startPinFlow("setup");
                                else startPinFlow("disable");
                            }}
                            trackColor={{ false: Colors.border, true: Colors.primary }}
                            thumbColor={Colors.card}
                        />
                    </View>

                    {!!settings.appPin && (
                        <TouchableOpacity
                            style={styles.changePinButton}
                            onPress={() => startPinFlow("change")}
                        >
                            <Text style={styles.changePinText}>Change PIN</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </ScrollView>

            {/* PIN MODAL */}
            <Modal visible={showPinModal} animationType="slide" transparent={false} onRequestClose={() => setShowPinModal(false)}>
                <SafeAreaView style={styles.pinContainer}>
                    <TouchableOpacity style={styles.closePinButton} onPress={() => setShowPinModal(false)}>
                        <X size={24} color={Colors.text} />
                    </TouchableOpacity>

                    <View style={styles.pinHeader}>
                        <View style={styles.pinIconContainer}>
                            <Lock size={32} color={Colors.primary} />
                        </View>
                        <Text style={styles.pinTitle}>
                            {pinStep === "verify" ? "Enter PIN" :
                                pinStep === "create" ? (pinFlow === "change" ? "Enter New PIN" : "Create PIN") :
                                    "Confirm PIN"}
                        </Text>
                        <Text style={styles.pinSubtitle}>
                            {pinStep === "verify" ? "Enter your current PIN to continue" :
                                pinStep === "create" ? "Enter a 4-digit PIN to secure your app" :
                                    "Re-enter your PIN to confirm"}
                        </Text>
                    </View>

                    <View style={styles.pinDotsContainer}>
                        {[1, 2, 3, 4].map((i) => (
                            <View
                                key={i}
                                style={[
                                    styles.pinDot,
                                    pinInput.length >= i && styles.pinDotFilled,
                                    pinError && styles.pinDotError
                                ]}
                            />
                        ))}
                    </View>

                    <View style={styles.keypad}>
                        <View style={styles.keypadRow}>
                            {[1, 2, 3].map((num) => (
                                <TouchableOpacity
                                    key={num}
                                    style={styles.keypadButton}
                                    onPress={() => handlePinPress(num.toString())}
                                >
                                    <Text style={styles.keypadText}>{num}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <View style={styles.keypadRow}>
                            {[4, 5, 6].map((num) => (
                                <TouchableOpacity
                                    key={num}
                                    style={styles.keypadButton}
                                    onPress={() => handlePinPress(num.toString())}
                                >
                                    <Text style={styles.keypadText}>{num}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <View style={styles.keypadRow}>
                            {[7, 8, 9].map((num) => (
                                <TouchableOpacity
                                    key={num}
                                    style={styles.keypadButton}
                                    onPress={() => handlePinPress(num.toString())}
                                >
                                    <Text style={styles.keypadText}>{num}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <View style={styles.keypadRow}>
                            <View style={styles.keypadButtonPlaceholder} />
                            <TouchableOpacity
                                style={styles.keypadButton}
                                onPress={() => handlePinPress("0")}
                            >
                                <Text style={styles.keypadText}>0</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.keypadButton}
                                onPress={handlePinBackspace}
                            >
                                <Delete size={24} color={Colors.text} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </SafeAreaView>
            </Modal>

            <Modal visible={showShopModal} animationType="slide" transparent={true} onRequestClose={() => setShowShopModal(false)}>
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <TouchableWithoutFeedback onPress={() => setShowShopModal(false)}>
                        <View style={styles.modalOverlay}>
                            <TouchableWithoutFeedback onPress={() => { }}>
                                <View style={styles.modalContent}>
                                    <Text style={styles.modalTitle}>{editingShop ? "Edit Shop" : "Add Shop"}</Text>

                                    <TextInput style={styles.input} placeholder="Shop Name *" value={shopName} onChangeText={setShopName} />
                                    <TextInput style={styles.input} placeholder="Owner Name *" value={shopOwner} onChangeText={setShopOwner} />
                                    <TextInput style={styles.input} placeholder="Location *" value={shopLocation} onChangeText={setShopLocation} />
                                    <TextInput style={styles.input} placeholder="Phone (Optional)" value={shopPhone} onChangeText={setShopPhone} keyboardType="phone-pad" />

                                    <View style={styles.modalButtons}>
                                        <TouchableOpacity style={styles.modalCancelButton} onPress={() => setShowShopModal(false)}>
                                            <Text style={styles.modalCancelText}>Cancel</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.modalSaveButton} onPress={handleSaveShop}>
                                            <Text style={styles.modalSaveText}>Save</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </TouchableWithoutFeedback>
                        </View>
                    </TouchableWithoutFeedback>
                </KeyboardAvoidingView>
            </Modal>

            <Modal visible={showSellerModal} animationType="slide" transparent={true} onRequestClose={() => setShowSellerModal(false)}>
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <TouchableWithoutFeedback onPress={() => setShowSellerModal(false)}>
                        <View style={styles.modalOverlay}>
                            <TouchableWithoutFeedback onPress={() => { }}>
                                <View style={styles.modalContent}>
                                    <Text style={styles.modalTitle}>{editingSeller ? "Edit Seller" : "Add Seller"}</Text>

                                    <TextInput style={styles.input} placeholder="Seller Name *" value={sellerName} onChangeText={setSellerName} />
                                    <TextInput style={styles.input} placeholder="Phone (Optional)" value={sellerPhone} onChangeText={setSellerPhone} keyboardType="phone-pad" />

                                    <View style={styles.modalButtons}>
                                        <TouchableOpacity style={styles.modalCancelButton} onPress={() => setShowSellerModal(false)}>
                                            <Text style={styles.modalCancelText}>Cancel</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.modalSaveButton} onPress={handleSaveSeller}>
                                            <Text style={styles.modalSaveText}>Save</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </TouchableWithoutFeedback>
                        </View>
                    </TouchableWithoutFeedback>
                </KeyboardAvoidingView>
            </Modal>

            <Modal visible={showPriceModal} animationType="slide" transparent={true} onRequestClose={() => setShowPriceModal(false)}>
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <TouchableWithoutFeedback onPress={() => setShowPriceModal(false)}>
                        <View style={styles.modalOverlay}>
                            <TouchableWithoutFeedback onPress={() => { }}>
                                <View style={styles.modalContent}>
                                    <Text style={styles.modalTitle}>{editingItem ? `Edit ${editingItem.name}` : "Add New Item"}</Text>

                                    <Text style={styles.inputLabel}>Item Name</Text>
                                    <TextInput style={styles.input} placeholder="e.g. Mandazi, Chapati" value={itemName} onChangeText={setItemName} />

                                    <View style={styles.inputRow}>
                                        <View style={{ flex: 2 }}>
                                            <Text style={styles.inputLabel}>Price (KES)</Text>
                                            <TextInput style={styles.input} placeholder="50" value={itemPrice} onChangeText={setItemPrice} keyboardType="numeric" />
                                        </View>
                                        <View style={{ flex: 1, marginLeft: 12 }}>
                                            <Text style={styles.inputLabel}>Unit</Text>
                                            <TextInput style={styles.input} placeholder="pcs/cup" value={itemUnit} onChangeText={setItemUnit} autoCapitalize="none" />
                                        </View>
                                    </View>

                                    <Text style={styles.inputLabel}>Low Stock Alert Threshold</Text>
                                    <TextInput style={styles.input} placeholder="10" value={itemThreshold} onChangeText={setItemThreshold} keyboardType="numeric" />

                                    <View style={styles.modalButtons}>
                                        <TouchableOpacity style={styles.modalCancelButton} onPress={() => setShowPriceModal(false)}>
                                            <Text style={styles.modalCancelText}>Cancel</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.modalSaveButton} onPress={handleSavePrice}>
                                            <Text style={styles.modalSaveText}>Save</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </TouchableWithoutFeedback>
                        </View>
                    </TouchableWithoutFeedback>
                </KeyboardAvoidingView>
            </Modal>

            <Modal visible={showProfileModal} animationType="slide" transparent={true} onRequestClose={() => setShowProfileModal(false)}>
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <TouchableWithoutFeedback onPress={() => setShowProfileModal(false)}>
                        <View style={styles.modalOverlay}>
                            <TouchableWithoutFeedback onPress={() => { }}>
                                <View style={styles.modalContent}>
                                    <Text style={styles.modalTitle}>Edit Profile</Text>

                                    <Text style={styles.inputLabel}>Your Name</Text>
                                    <TextInput style={styles.input} placeholder="Your Name" value={tempUserName} onChangeText={setTempUserName} />

                                    <Text style={styles.inputLabel}>Business Name</Text>
                                    <TextInput style={styles.input} placeholder="Business Name" value={tempBusinessName} onChangeText={setTempBusinessName} />

                                    <View style={styles.modalButtons}>
                                        <TouchableOpacity style={styles.modalCancelButton} onPress={() => setShowProfileModal(false)}>
                                            <Text style={styles.modalCancelText}>Cancel</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.modalSaveButton} onPress={handleSaveProfile}>
                                            <Text style={styles.modalSaveText}>Save</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </TouchableWithoutFeedback>
                        </View>
                    </TouchableWithoutFeedback>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
}

const createStyles = (Colors: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scrollView: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 20,
        paddingBottom: 20,
        paddingTop: 10,
        alignItems: "center",
        backgroundColor: Colors.background,
    },
    inputRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    profileIconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: Colors.secondary,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
        borderWidth: 3,
        borderColor: Colors.primary,
        overflow: "hidden",
        position: "relative",
    },
    profileImage: {
        width: "100%",
        height: "100%",
    },
    editBadge: {
        position: "absolute",
        bottom: 0,
        right: 0,
        backgroundColor: Colors.primary,
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 2,
        borderColor: Colors.card,
    },
    editProfileButton: {
        marginTop: 8,
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: Colors.secondary,
    },
    editProfileText: {
        color: Colors.primary,
        fontSize: 12,
        fontWeight: "700" as const,
    },
    title: {
        fontSize: 24,
        fontWeight: "700" as const,
        color: Colors.text,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: Colors.textLight,
    },
    analyticsCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Colors.card,
        marginHorizontal: 20,
        marginBottom: 20,
        padding: 16,
        borderRadius: 16,
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 2,
        borderColor: Colors.primary,
    },
    cardPressed: {
        opacity: 0.9,
        transform: [{ scale: 0.98 }],
    },
    analyticsTextContainer: {
        flex: 1,
        marginLeft: 12,
    },
    analyticsTitle: {
        fontSize: 16,
        fontWeight: "700" as const,
        color: Colors.text,
        marginBottom: 4,
    },
    analyticsSubtitle: {
        fontSize: 12,
        color: Colors.textLight,
    },
    section: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "700" as const,
        color: Colors.text,
    },
    addButton: {
        backgroundColor: Colors.primary,
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
    },
    addButtonPressed: {
        opacity: 0.8,
        transform: [{ scale: 0.95 }],
    },
    listItem: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Colors.card,
        padding: 12,
        borderRadius: 12,
        marginBottom: 8,
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 1,
        shadowRadius: 4,
        elevation: 2,
    },
    listItemPressed: {
        opacity: 0.9,
        transform: [{ scale: 0.98 }],
    },
    listItemContent: {
        flex: 1,
    },
    changePinButton: {
        marginLeft: 52, // Align with text content of setting item (icon width + gap)
        marginTop: -10,
        marginBottom: 16,
    },
    changePinText: {
        color: Colors.primary,
        fontWeight: "600",
        fontSize: 14,
    },
    // PIN Modal Styles
    pinContainer: {
        flex: 1,
        backgroundColor: Colors.background,
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 20,
    },
    closePinButton: {
        alignSelf: "flex-end",
        padding: 20,
    },
    pinHeader: {
        alignItems: "center",
        marginTop: 20,
    },
    pinIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: Colors.secondary,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 20,
    },
    pinTitle: {
        fontSize: 24,
        fontWeight: "700",
        color: Colors.text,
        marginBottom: 8,
    },
    pinSubtitle: {
        fontSize: 14,
        color: Colors.textLight,
        textAlign: "center",
        maxWidth: 240,
    },
    pinDotsContainer: {
        flexDirection: "row",
        gap: 24,
        marginBottom: 40,
    },
    pinDot: {
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.textLight,
    },
    pinDotFilled: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    pinDotError: {
        borderColor: Colors.error,
        backgroundColor: Colors.error,
    },
    keypad: {
        width: "100%",
        paddingHorizontal: 40,
        marginBottom: 40,
        gap: 20,
    },
    keypadRow: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    keypadButton: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: Colors.card,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    keypadButtonPlaceholder: {
        width: 72,
        height: 72,
    },
    keypadText: {
        fontSize: 28,
        fontWeight: "600",
        color: Colors.text,
    },
    listItemTitle: {
        fontSize: 14,
        fontWeight: "600" as const,
        color: Colors.text,
        marginBottom: 2,
    },
    listItemSubtitle: {
        fontSize: 12,
        color: Colors.textLight,
    },
    iconButton: {
        padding: 8,
    },
    settingItem: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Colors.card,
        padding: 16,
        borderRadius: 12,
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 1,
        shadowRadius: 4,
        elevation: 2,
    },
    settingContent: {
        flex: 1,
        marginLeft: 12,
    },
    settingTitle: {
        fontSize: 14,
        fontWeight: "600" as const,
        color: Colors.text,
        marginBottom: 2,
    },
    settingSubtitle: {
        fontSize: 12,
        color: Colors.textLight,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        justifyContent: "center",
        padding: 20,
    },
    modalContent: {
        backgroundColor: Colors.background,
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "700" as const,
        color: Colors.text,
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: "600" as const,
        color: Colors.text,
        marginBottom: 8,
        marginTop: 8,
    },
    input: {
        backgroundColor: Colors.background,
        borderRadius: 12,
        padding: 14,
        fontSize: 14,
        color: Colors.text,
        borderWidth: 2,
        borderColor: Colors.border,
        marginBottom: 12,
    },
    modalButtons: {
        flexDirection: "row",
        gap: 12,
        marginTop: 8,
    },
    modalCancelButton: {
        flex: 1,
        padding: 14,
        borderRadius: 12,
        alignItems: "center",
        backgroundColor: Colors.background,
        borderWidth: 2,
        borderColor: Colors.border,
    },
    modalCancelText: {
        color: Colors.text,
        fontSize: 16,
        fontWeight: "600" as const,
    },
    modalSaveButton: {
        flex: 1,
        padding: 14,
        borderRadius: 12,
        alignItems: "center",
        backgroundColor: Colors.primary,
    },
    modalSaveText: {
        color: Colors.card,
        fontSize: 16,
        fontWeight: "700" as const,
    },
    moreButton: {
        alignItems: "center",
        paddingVertical: 12,
        backgroundColor: Colors.secondary,
        borderRadius: 12,
        marginTop: 4,
    },
    moreButtonText: {
        color: Colors.primary,
        fontSize: 14,
        fontWeight: "600" as const,
    },
    settingDivider: {
        height: 1,
        backgroundColor: Colors.border,
        marginVertical: 8,
    },
});
