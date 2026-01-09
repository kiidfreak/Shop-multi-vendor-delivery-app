import { Stack, router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { User, Store, Plus, Edit2, Trash2, DollarSign, Settings as SettingsIcon, BarChart3 } from "lucide-react-native";
import React, { useState, useEffect } from "react";
import { ScrollView, StyleSheet, Text, View, TouchableOpacity, Modal, TextInput, Alert, Pressable, Switch, Image } from "react-native";
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "@/contexts/AppContext";
import Colors from "@/constants/colors";
import type { Shop, Seller, InventoryItem } from "@/types";

export default function ProfileScreen() {
    const { shops, sellers, inventory, settings, saveShops, saveSellers, saveInventory, saveSettings } = useApp();
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

    const [showProfileModal, setShowProfileModal] = useState(false);
    const [tempUserName, setTempUserName] = useState(settings.userName);
    const [tempBusinessName, setTempBusinessName] = useState(settings.businessName);

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

    const openPriceModal = (item: InventoryItem) => {
        setEditingItem(item);
        setItemName(item.name);
        setItemPrice(item.price.toString());
        setItemThreshold(item.lowStockThreshold.toString());
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
            Alert.alert("Error", "Please fill all required fields");
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
    };

    const handleSaveSeller = async () => {
        if (!sellerName) {
            Alert.alert("Error", "Please enter seller name");
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
    };

    const handleSavePrice = async () => {
        if (!editingItem || !itemPrice || !itemThreshold || !itemName) {
            Alert.alert("Error", "Please fill all fields");
            return;
        }

        const price = parseFloat(itemPrice);
        const threshold = parseInt(itemThreshold);

        if (isNaN(price) || isNaN(threshold)) {
            Alert.alert("Error", "Please enter valid numbers");
            return;
        }

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const updatedInventory = inventory.map((item) =>
            item.id === editingItem.id ? { ...item, name: itemName, price, lowStockThreshold: threshold } : item
        );
        await saveInventory(updatedInventory);
        setShowPriceModal(false);
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
            Alert.alert("Error", "Please fill all fields");
            return;
        }

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await saveSettings({ ...settings, userName: tempUserName, businessName: tempBusinessName });
        setShowProfileModal(false);
    };

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            <Stack.Screen
                options={{
                    headerShown: true,
                    title: "Profile & Settings",
                    headerStyle: { backgroundColor: Colors.background },
                    headerTintColor: Colors.text,
                }}
            />
            <ScrollView style={styles.scrollView}>
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
                </View>
            </ScrollView>

            <Modal visible={showShopModal} animationType="slide" transparent={true} onRequestClose={() => setShowShopModal(false)}>
                <View style={styles.modalOverlay}>
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
                </View>
            </Modal>

            <Modal visible={showSellerModal} animationType="slide" transparent={true} onRequestClose={() => setShowSellerModal(false)}>
                <View style={styles.modalOverlay}>
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
                </View>
            </Modal>

            <Modal visible={showPriceModal} animationType="slide" transparent={true} onRequestClose={() => setShowPriceModal(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Edit {editingItem?.name}</Text>

                        <Text style={styles.inputLabel}>Item Name</Text>
                        <TextInput style={styles.input} placeholder="Item Name" value={itemName} onChangeText={setItemName} />

                        <Text style={styles.inputLabel}>Price (KES)</Text>
                        <TextInput style={styles.input} placeholder="Price" value={itemPrice} onChangeText={setItemPrice} keyboardType="numeric" />

                        <Text style={styles.inputLabel}>Low Stock Alert Threshold</Text>
                        <TextInput style={styles.input} placeholder="Threshold" value={itemThreshold} onChangeText={setItemThreshold} keyboardType="numeric" />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={styles.modalCancelButton} onPress={() => setShowPriceModal(false)}>
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalSaveButton} onPress={handleSavePrice}>
                                <Text style={styles.modalSaveText}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal visible={showProfileModal} animationType="slide" transparent={true} onRequestClose={() => setShowProfileModal(false)}>
                <View style={styles.modalOverlay}>
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
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
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
        marginBottom: 10,
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
        marginLeft: 12,
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
        backgroundColor: "rgba(0, 0, 0, 0.5)",
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
});
