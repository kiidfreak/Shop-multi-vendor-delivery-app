import { Stack, useRouter } from "expo-router";
import { User, Moon, Settings as SettingsIcon, Shield, Monitor, Bike, UserPlus, Box, Unlock } from "lucide-react-native";
import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, View, Switch, Image, TouchableOpacity, Alert, Modal, TextInput, Pressable, Vibration } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "@/contexts/AppContext";
import * as Haptics from "expo-haptics";
import { Role } from "@/types";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker';
import { Camera, Edit2 } from "lucide-react-native";

export default function ProfileScreen() {
    // Note: removed switchRole, added attemptLogin
    const { settings, colors: Colors, activeRole, attemptLogin, logoutRole, riders, currentRider, updateRider, currentUser, logoutUser, updateUser, toggleDarkMode, searchUsers, banUser } = useApp();
    const router = useRouter();
    const styles = React.useMemo(() => createStyles(Colors), [Colors]);

    const [modalVisible, setModalVisible] = useState(false);
    const [pin, setPin] = useState("");
    const [nameEditVisible, setNameEditVisible] = useState(false);
    const [newName, setNewName] = useState(currentUser?.name || "");

    // --- Ban Modal State ---
    const [banModalVisible, setBanModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const handleLogout = () => {
        logoutRole();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };

    const handleFullLogout = () => {
        Alert.alert(
            "Logging Out?",
            "You'll need to enter your phone again to access your orders.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Sign Out",
                    style: "destructive",
                    onPress: async () => {
                        await logoutUser();
                        router.replace("/onboarding");
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    }
                }
            ]
        );
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5, // limit size
        });

        if (!result.canceled && result.assets[0].uri) {
            updateUser({ avatar: result.assets[0].uri });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
    };

    const handleUpdateName = () => {
        if (newName.trim()) {
            updateUser({ name: newName.trim() });
            setNameEditVisible(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
    };

    const handleAccessRequest = () => {
        setPin("");
        setModalVisible(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        try {
            const results = await searchUsers(searchQuery);
            setSearchResults(results);
        } catch (err) {
            console.error(err);
        } finally {
            setIsSearching(false);
        }
    };

    const handleBan = (userId: string, userName: string) => {
        Alert.alert(
            "BAN HAMMER 🔨",
            `Are you SURE you want to ban ${userName || 'this user'}? They will be locked out immediately.`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "BAN THEM",
                    style: "destructive",
                    onPress: async () => {
                        await banUser(userId);
                        handleSearch(); // Refresh results
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    }
                }
            ]
        );
    };


    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={styles.header}>
                <TouchableOpacity onPress={pickImage} style={styles.profileIconWrapper}>
                    <View style={[styles.profileIconContainer, { borderColor: activeRole === "ADMIN" ? Colors.accent : activeRole === "RIDER" ? Colors.secondary : Colors.primary }]}>
                        <Image source={currentUser?.avatar ? { uri: currentUser.avatar } : require("@/assets/images/icon.png")} style={styles.profileImage} />
                    </View>
                    <View style={[styles.cameraIcon, { backgroundColor: Colors.primary }]}>
                        <Camera size={14} color="#FFF" />
                    </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.nameRow} onPress={() => { setNewName(currentUser?.name || ""); setNameEditVisible(true); }}>
                    <Text style={styles.title}>{currentUser?.name || (currentUser?.isGuest ? "Guest User" : "Famous Fam")}</Text>
                    <Edit2 size={16} color={Colors.textLight} style={{ marginLeft: 8 }} />
                </TouchableOpacity>

                {currentUser?.phone && <Text style={styles.subtitle}>{currentUser.phone}</Text>}
                <Text style={[styles.roleBadge, { color: activeRole === "ADMIN" ? Colors.accent : activeRole === "RIDER" ? Colors.secondary : Colors.primary }]}>
                    {activeRole === "USER" ? (currentUser?.isGuest ? "STASHING ANONYMOUSLY 🎭" : "Stay High, Stay Fly 🌿") : activeRole === "ADMIN" ? "GOD MODE" : "ON DUTY"}
                </Text>
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

                {/* Guest Upgrade Banner */}
                {currentUser?.isGuest && activeRole === "USER" && (
                    <View style={[styles.guestBanner, { backgroundColor: Colors.primary + '20', borderColor: Colors.primary }]}>
                        <Text style={{ color: Colors.text, fontWeight: 'bold', marginBottom: 4 }}>Wanna keep your history? 🔥</Text>
                        <Text style={{ color: Colors.textLight, fontSize: 12, marginBottom: 12 }}>Create an account to track your orders across all devices.</Text>
                        <TouchableOpacity style={[styles.upgradeButton, { backgroundColor: Colors.primary }]} onPress={() => router.push("/onboarding")}>
                            <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Register Now</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Access Level removed from main view as requested */}

                {/* Admin Controls */}
                {activeRole === "ADMIN" && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: Colors.accent }]}>God Mode Controls</Text>

                        <TouchableOpacity
                            style={[styles.adminButton, { borderColor: Colors.border }]}
                            onPress={() => router.push("/riders")}
                        >
                            <UserPlus size={24} color={Colors.text} />
                            <View style={{ marginLeft: 12 }}>
                                <Text style={[styles.adminButtonText, { color: Colors.text }]}>Manage Riders ({riders.length})</Text>
                                <Text style={{ color: Colors.textLight, fontSize: 12 }}>Add, remove, or edit rider pins</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.adminButton, { borderColor: Colors.border }]}
                            onPress={() => setBanModalVisible(true)}
                        >
                            <Shield size={24} color={Colors.accent} />
                            <View style={{ marginLeft: 12 }}>
                                <Text style={[styles.adminButtonText, { color: Colors.text }]}>Ban Hammer 🔨</Text>
                                <Text style={{ color: Colors.textLight, fontSize: 12 }}>Search & ban problematic accounts</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.adminButton, { borderColor: Colors.border }]}
                            onPress={() => router.push("/inventory")}
                        >
                            <Box size={24} color={Colors.text} />
                            <View style={{ marginLeft: 12 }}>
                                <Text style={[styles.adminButtonText, { color: Colors.text }]}>Manage Stock</Text>
                                <Text style={{ color: Colors.textLight, fontSize: 12 }}>Update prices & availability</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Rider Info */}
                {activeRole === "RIDER" && riders.find(r => r.id === riders.find(r2 => r2.id === riders.find(r3 => r3.id === riders.find(r4 => r4.id === riders.find(r5 => r5.name === settings.userName)?.id)?.id)?.id)?.id)?.id ? (
                    // Logic fix: accessing current Rider from hook would be better, but we already have `currentRider` in AppContext
                    /* Just using currentRider from context would be cleaner */
                    <View></View>
                ) : null}

                {activeRole === "RIDER" && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: Colors.secondary }]}>Rider Ops</Text>

                        {/* Status Toggle */}
                        <View style={[styles.settingItem, { backgroundColor: Colors.card }]}>
                            <Bike size={24} color={Colors.secondary} />
                            <View style={styles.settingContent}>
                                <Text style={[styles.settingTitle, { color: Colors.text }]}>
                                    Status: {currentRider?.status || "Unknown"}
                                </Text>
                                <Text style={styles.settingSubtitle}>
                                    {currentRider?.status === "Available" ? "You are visible to dispatch." : "You are hidden."}
                                </Text>
                            </View>
                            <Switch
                                value={currentRider?.status === "Available"}
                                onValueChange={(val) => {
                                    if (currentRider) {
                                        updateRider(currentRider.id, { status: val ? "Available" : "Offline" });
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                    }
                                }}
                                trackColor={{ false: Colors.border, true: Colors.secondary }}
                            />
                        </View>

                        {/* Simple Stats */}
                        <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                            <View style={[styles.statCard, { backgroundColor: Colors.card, borderColor: Colors.secondary }]}>
                                <Text style={[styles.statValue, { color: Colors.text }]}>{currentRider?.ordersCompleted || 0}</Text>
                                <Text style={{ color: Colors.textLight, fontSize: 12 }}>Runs</Text>
                            </View>
                            <View style={[styles.statCard, { backgroundColor: Colors.card, borderColor: Colors.secondary }]}>
                                <Text style={[styles.statValue, { color: Colors.text }]}>{currentRider?.rating || 5.0} ★</Text>
                                <Text style={{ color: Colors.textLight, fontSize: 12 }}>Rating</Text>
                            </View>
                        </View>

                    </View>
                )}

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Preferences</Text>
                    </View>
                    <View style={styles.settingItem}>
                        <Moon size={20} color={Colors.primary} />
                        <View style={styles.settingContent}>
                            <Text style={styles.settingTitle}>Dark Mode</Text>
                            <Text style={styles.settingSubtitle}>{settings.darkMode ? "Stay High, Stay Dark 🌙" : "Light mode is active ☀️"}</Text>
                        </View>
                        <Switch
                            value={settings.darkMode}
                            onValueChange={toggleDarkMode}
                            trackColor={{ false: Colors.border, true: Colors.primary }}
                            thumbColor={Colors.card}
                        />
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: Colors.error || '#FF3B30' }]}>Account</Text>
                    <TouchableOpacity style={[styles.settingItem, { backgroundColor: 'rgba(255, 59, 48, 0.1)' }]} onPress={handleFullLogout}>
                        <Ionicons name="log-out-outline" size={20} color={Colors.error || '#FF3B30'} />
                        <View style={styles.settingContent}>
                            <Text style={[styles.settingTitle, { color: Colors.error || '#FF3B30' }]}>Sign Out</Text>
                            <Text style={styles.settingSubtitle}>Log out of this device</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                <View style={styles.section}>
                    <Text style={{ color: Colors.textLight, textAlign: "center", fontSize: 12 }}>Version 4.2.0 (Mayhem Edition)</Text>
                    {activeRole === "USER" && (
                        <TouchableOpacity
                            onLongPress={handleAccessRequest}
                            delayLongPress={3000}
                            style={{ marginTop: 20 }}
                        >
                            <Text style={{ color: Colors.background, textAlign: "center", fontSize: 10 }}>.</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </ScrollView>

            {/* Name Edit Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={nameEditVisible}
                onRequestClose={() => setNameEditVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <BlurView intensity={40} style={StyleSheet.absoluteFill} tint="dark" />
                    <View style={[styles.modalContent, { backgroundColor: Colors.card, borderColor: Colors.border }]}>
                        <Text style={[styles.modalTitle, { color: Colors.text }]}>Update Name</Text>
                        <TextInput
                            style={[styles.pinInput, { color: Colors.text, borderColor: Colors.primary, fontSize: 20, letterSpacing: 0, height: 50 }]}
                            value={newName}
                            onChangeText={setNewName}
                            autoFocus
                            placeholder="Your Name"
                            placeholderTextColor={Colors.textLight}
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={[styles.modalButton, { backgroundColor: Colors.card }]} onPress={() => setNameEditVisible(false)}>
                                <Text style={{ color: Colors.text }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalButton, { backgroundColor: Colors.primary }]} onPress={handleUpdateName}>
                                <Text style={{ color: "#FFF", fontWeight: "bold" }}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* PIN Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <BlurView intensity={40} style={StyleSheet.absoluteFill} tint="dark" />
                    <View style={[styles.modalContent, { backgroundColor: Colors.card, borderColor: Colors.border }]}>
                        <Text style={[styles.modalTitle, { color: Colors.text }]}>Security Clearance</Text>
                        <TextInput
                            style={[styles.pinInput, { color: Colors.text, borderColor: Colors.primary }]}
                            value={pin}
                            onChangeText={setPin}
                            keyboardType="number-pad"
                            maxLength={8}
                            secureTextEntry
                            autoFocus
                            placeholder="****"
                            placeholderTextColor={Colors.textLight}
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={[styles.modalButton, { backgroundColor: Colors.card }]} onPress={() => setModalVisible(false)}>
                                <Text style={{ color: Colors.text }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalButton, { backgroundColor: Colors.primary }]} onPress={async () => {
                                const success = await attemptLogin(pin);
                                if (success) {
                                    setModalVisible(false);
                                    setPin("");
                                } else {
                                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                                    Alert.alert("Access Denied", "Wrong PIN.");
                                }
                            }}>
                                <Text style={{ color: "#FFF", fontWeight: "bold" }}>Access</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Ban Hammer Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={banModalVisible}
                onRequestClose={() => setBanModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <BlurView intensity={60} style={StyleSheet.absoluteFill} tint="dark" />
                    <View style={[styles.modalContent, { backgroundColor: Colors.card, width: '90%', height: '80%' }]}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 20 }}>
                            <Text style={[styles.modalTitle, { color: Colors.accent, marginBottom: 0 }]}>BAN HAMMER 🔨</Text>
                            <TouchableOpacity onPress={() => setBanModalVisible(false)}>
                                <Ionicons name="close" size={24} color={Colors.text} />
                            </TouchableOpacity>
                        </View>

                        <View style={{ flexDirection: 'row', width: '100%', marginBottom: 20 }}>
                            <TextInput
                                style={[styles.pinInput, { flex: 1, height: 50, fontSize: 16, textAlign: 'left', paddingHorizontal: 15, marginBottom: 0, letterSpacing: 0 }]}
                                placeholder="Search by name or phone..."
                                placeholderTextColor={Colors.textLight}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                returnKeyType="search"
                                onSubmitEditing={handleSearch}
                            />
                            <TouchableOpacity
                                style={{ backgroundColor: Colors.primary, paddingHorizontal: 20, borderRadius: 12, justifyContent: 'center', marginLeft: 10 }}
                                onPress={handleSearch}
                            >
                                <Ionicons name="search" size={20} color="#FFF" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={{ width: '100%' }}>
                            {isSearching ? (
                                <Text style={{ color: Colors.text, textAlign: 'center' }}>Searching users...</Text>
                            ) : searchResults.length > 0 ? (
                                searchResults.map(user => (
                                    <View key={user.id} style={{ flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, marginBottom: 10 }}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ color: Colors.text, fontWeight: 'bold' }}>{user.name || 'No Name'}</Text>
                                            <Text style={{ color: Colors.textLight, fontSize: 12 }}>{user.phone}</Text>
                                            {user.isBanned && <Text style={{ color: Colors.accent, fontSize: 10, fontWeight: 'bold', marginTop: 2 }}>BANNED ACCOUNT 🚫</Text>}
                                        </View>
                                        {!user.isBanned && (
                                            <TouchableOpacity
                                                style={{ backgroundColor: Colors.accent, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 }}
                                                onPress={() => handleBan(user.id, user.name)}
                                            >
                                                <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 12 }}>BAN</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                ))
                            ) : searchQuery && !isSearching ? (
                                <Text style={{ color: Colors.textLight, textAlign: 'center' }}>No users found for "{searchQuery}"</Text>
                            ) : (
                                <Text style={{ color: Colors.textLight, textAlign: 'center' }}>Enter a name or phone to start tracking.</Text>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const createStyles = (Colors: any) => StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    scrollView: { flex: 1, padding: 20 },
    header: { alignItems: "center", marginBottom: 30, marginTop: 20 },
    profileIconWrapper: { position: 'relative' },
    cameraIcon: { position: 'absolute', bottom: 5, right: 0, width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.card },
    profileIconContainer: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, overflow: "hidden", marginBottom: 5 },
    profileImage: { width: "100%", height: "100%" },
    nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
    title: { fontSize: 24, fontWeight: "bold", color: Colors.text },
    subtitle: { fontSize: 14, color: Colors.textLight, marginBottom: 4 },
    roleBadge: { fontSize: 14, fontWeight: "bold", marginTop: 4, letterSpacing: 1 },
    section: { marginBottom: 24 },
    sectionHeader: { marginBottom: 12 },
    sectionTitle: { fontSize: 18, fontWeight: "bold", color: Colors.text, marginBottom: 12 },
    settingItem: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.card, padding: 16, borderRadius: 12, marginBottom: 10 },
    settingContent: { flex: 1, marginLeft: 12 },
    settingTitle: { fontSize: 14, fontWeight: "600", color: Colors.text },
    settingSubtitle: { fontSize: 12, color: Colors.textLight },

    // Access Control
    accessCard: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 16, borderRadius: 12, borderWidth: 1, gap: 10 },
    accessText: { fontWeight: "bold", fontSize: 16 },

    // Admin
    adminButton: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.card, padding: 16, borderRadius: 12, marginBottom: 10, borderWidth: 1 },
    adminButtonText: { fontWeight: "bold", fontSize: 16 },

    // Modal
    modalContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" },
    modalContent: { width: "80%", padding: 24, borderRadius: 24, borderWidth: 1, alignItems: "center" },
    modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 20, letterSpacing: 1 },
    pinInput: { width: "100%", height: 60, borderWidth: 1, borderRadius: 12, fontSize: 32, textAlign: "center", marginBottom: 20, letterSpacing: 6, fontWeight: "bold" },
    modalButtons: { flexDirection: "row", gap: 10, width: "100%" },
    modalButton: { flex: 1, padding: 16, borderRadius: 12, alignItems: "center", justifyContent: "center" },
    statCard: { flex: 1, padding: 16, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
    statValue: { fontSize: 24, fontWeight: "bold", marginBottom: 4 },

    // Guest Banner
    guestBanner: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 24 },
    upgradeButton: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10, alignSelf: 'flex-start' },
});
