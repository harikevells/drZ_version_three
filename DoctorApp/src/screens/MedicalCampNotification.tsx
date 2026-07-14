import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Switch, Image, Alert, Modal, ActivityIndicator } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { launchImageLibrary } from 'react-native-image-picker';
import { Calendar } from 'react-native-calendars';
import { API_BASE_URL } from '../config';

export default function MedicalCampNotification() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const [loading, setLoading] = useState(false);
    const [userData, setUserData] = useState<any>(null);

    const [campTitle, setCampTitle] = useState('');
    const [campDescription, setCampDescription] = useState('');
    const [campFromDate, setCampFromDate] = useState('');
    const [campToDate, setCampToDate] = useState('');
    const [campActiveStatus, setCampActiveStatus] = useState(true);
    const [showCalendar, setShowCalendar] = useState<'from' | 'to' | 'editFrom' | 'editTo' | null>(null);
    const [campImage, setCampImage] = useState<any>(null);

    const [viewMode, setViewMode] = useState<'create' | 'list'>(route.params?.defaultMode || 'create');
    const [campsList, setCampsList] = useState<any[]>([]);
    const [seenCamps, setSeenCamps] = useState<string[]>([]);

    const [editModalVisible, setEditModalVisible] = useState(false);
    const [selectedCampId, setSelectedCampId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editFromDate, setEditFromDate] = useState('');
    const [editToDate, setEditToDate] = useState('');
    const [editActiveStatus, setEditActiveStatus] = useState(true);
    const [editImage, setEditImage] = useState<any>(null);

    const fetchCamps = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_BASE_URL}/push-notifications`);
            setCampsList(response.data);
            
            const storedData = await AsyncStorage.getItem('userData');
            const user = storedData ? JSON.parse(storedData) : null;
            const seenKey = user?.email ? `seenMedicalCampIds_${user.email}` : 'seenMedicalCampIds';

            const seenStr = await AsyncStorage.getItem(seenKey);
            if (seenStr) {
                setSeenCamps(JSON.parse(seenStr));
            }
        } catch (error) {
            console.error("Failed to fetch camps", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (viewMode === 'list') {
            fetchCamps();
        }
    }, [viewMode]);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const storedData = await AsyncStorage.getItem('userData');
                if (storedData) {
                    let parsedData = JSON.parse(storedData);
                    try {
                        const res = await axios.get(`${API_BASE_URL}/doctors`);
                        const fullProfile = res.data.find((d: any) => d.email === parsedData.email);
                        if (fullProfile) {
                            parsedData = { ...parsedData, ...fullProfile };
                        }
                    } catch (apiError) {
                        console.error('Failed to fetch full doctor profile', apiError);
                    }
                    setUserData(parsedData);
                }
            } catch (error) {
                console.error("Failed to load user data", error);
            }
        };
        fetchUserData();
    }, []);

    const markAsRead = async (campId: string) => {
        if (!seenCamps.includes(campId)) {
            const updatedSeen = [...seenCamps, campId];
            setSeenCamps(updatedSeen);
            const seenKey = userData?.email ? `seenMedicalCampIds_${userData.email}` : 'seenMedicalCampIds';
            await AsyncStorage.setItem(seenKey, JSON.stringify(updatedSeen));
        }
    };

    const onDayPress = (day: any) => {
        const [year, month, dayPart] = day.dateString.split('-');
        const formatted = `${dayPart}/${month}/${year}`;

        if (showCalendar === 'from') {
            setCampFromDate(formatted);
        } else if (showCalendar === 'to') {
            setCampToDate(formatted);
        } else if (showCalendar === 'editFrom') {
            setEditFromDate(formatted);
        } else if (showCalendar === 'editTo') {
            setEditToDate(formatted);
        }
        setShowCalendar(null);
    };

    const handleImageUpload = async () => {
        try {
            const result = await launchImageLibrary({
                mediaType: 'photo',
                quality: 0.8,
                includeBase64: true,
            });

            if (result.assets && result.assets.length > 0) {
                setCampImage(result.assets[0]);
            }
        } catch (error: any) {
            console.error("ImagePicker Error: ", error);
            Alert.alert("Upload Error", "Image picker failed.");
        }
    };

    const handleSaveMedicalCamp = async () => {
        if (!campTitle || !campDescription || !campFromDate || !campToDate) {
            Alert.alert("Error", "Please fill all required fields.");
            return;
        }

        setLoading(true);
        let base64Image = '';
        if (campImage) {
            base64Image = campImage.base64 ? `data:${campImage.type};base64,${campImage.base64}` : campImage.uri;
        }

        try {
            const payload = {
                title: campTitle,
                description: campDescription,
                fromDate: campFromDate,
                toDate: campToDate,
                activeStatus: campActiveStatus,
                image: base64Image,
                role: 'doctor',
                doctorName: userData?.doctorName || ''
            };

            await axios.post(`${API_BASE_URL}/push-notifications`, payload);
            Alert.alert("Success", "Medical Camp notification created.");
            setCampTitle('');
            setCampDescription('');
            setCampFromDate('');
            setCampToDate('');
            setCampImage(null);
            setViewMode('list');
        } catch (error) {
            console.error("Error saving medical camp:", error);
            Alert.alert("Error", "Failed to save medical camp notification.");
        } finally {
            setLoading(false);
        }
    };

    const handleEditImageUpload = async () => {
        try {
            const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8, includeBase64: true });
            if (result.assets && result.assets.length > 0) {
                setEditImage(result.assets[0]);
            }
        } catch (error) {
            Alert.alert("Error", "Failed to pick image");
        }
    };

    const openEditModal = (camp: any) => {
        setSelectedCampId(camp._id);
        setEditTitle(camp.title);
        setEditDescription(camp.description);
        setEditFromDate(camp.fromDate);
        setEditToDate(camp.toDate);
        setEditActiveStatus(camp.activeStatus);
        setEditImage({ uri: camp.image }); // prefill with existing image
        setEditModalVisible(true);
    };

    const handleUpdateCamp = async () => {
        if (!selectedCampId) return;
        setLoading(true);
        let base64Image = typeof editImage?.uri === 'string' && editImage.uri.startsWith('http') ? editImage.uri : '';
        if (editImage && editImage.base64) {
            base64Image = `data:${editImage.type};base64,${editImage.base64}`;
        } else if (editImage && !editImage.base64) {
            base64Image = editImage.uri;
        }

        try {
            const payload = {
                title: editTitle,
                description: editDescription,
                fromDate: editFromDate,
                toDate: editToDate,
                activeStatus: editActiveStatus,
                image: base64Image
            };
            await axios.put(`${API_BASE_URL}/push-notifications/${selectedCampId}`, payload);
            Alert.alert("Success", "Medical Camp updated successfully.");
            setEditModalVisible(false);
            fetchCamps();
        } catch (error) {
            console.error("Update error:", error);
            Alert.alert("Error", "Failed to update camp.");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCamp = (id: string) => {
        Alert.alert("Delete", "Are you sure you want to delete this notification?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete", style: "destructive", onPress: async () => {
                    setLoading(true);
                    try {
                        await axios.delete(`${API_BASE_URL}/push-notifications/${id}`);
                        fetchCamps();
                    } catch (error) {
                        console.error("Delete error:", error);
                        Alert.alert("Error", "Failed to delete camp.");
                    } finally {
                        setLoading(false);
                    }
                }
            }
        ]);
    };

    return (
        <View style={styles.container}>
            <View style={styles.blueTopBackground} />
            <View style={styles.customHeader}>
                <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                    <Text style={styles.headerTitle}>Medical Camp Notification</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                    <View style={styles.headerRow}>
                        <Text style={styles.pushMsgText}>{viewMode === 'create' ? 'Push Messages:' : 'All Medical Camps:'}</Text>
                        <TouchableOpacity onPress={() => setViewMode(viewMode === 'create' ? 'list' : 'create')}>
                            <Text style={styles.viewToggleText}>{viewMode === 'create' ? 'View' : 'Create New'}</Text>
                        </TouchableOpacity>
                    </View>

                    {viewMode === 'create' ? (
                        <>
                            <View style={styles.inputWrapper}>
                                <Text style={[styles.floatingLabel, { width: 45 }]}>Title</Text>
                                <TextInput style={styles.inputField} value={campTitle} onChangeText={setCampTitle} />
                            </View>

                            <View style={styles.dateRow}>
                                <View style={[styles.inputWrapper, { flex: 0.48 }]}>
                                    <Text style={[styles.floatingLabel, { width: 75 }]}>From Date</Text>
                                    <TouchableOpacity onPress={() => setShowCalendar('from')} style={styles.dateInputTouchable}>
                                        <TextInput style={styles.dateInputField} value={campFromDate} editable={false} pointerEvents="none" />
                                        <Ionicons name="calendar-outline" size={20} color="#0D6EFD" />
                                    </TouchableOpacity>
                                </View>
                                <View style={[styles.inputWrapper, { flex: 0.48 }]}>
                                    <Text style={[styles.floatingLabel, { width: 65 }]}>To Date</Text>
                                    <TouchableOpacity onPress={() => setShowCalendar('to')} style={styles.dateInputTouchable}>
                                        <TextInput style={styles.dateInputField} value={campToDate} editable={false} pointerEvents="none" />
                                        <Ionicons name="calendar-outline" size={20} color="#0D6EFD" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={[styles.inputWrapper, { height: 100 }]}>
                                <Text style={[styles.floatingLabel, { width: 85 }]}>Description</Text>
                                <TextInput
                                    style={[styles.inputField, { height: 100, textAlignVertical: 'top', paddingTop: 10 }]}
                                    multiline
                                    value={campDescription}
                                    onChangeText={setCampDescription}
                                />
                            </View>

                            <View style={styles.uploadRow}>
                                <Text style={styles.uploadLabel}>Image Upload</Text>
                                <TouchableOpacity style={styles.uploadBox} onPress={handleImageUpload}>
                                    {campImage ? (
                                        <Image source={{ uri: campImage.uri }} style={{ width: '100%', height: 100, borderRadius: 8 }} resizeMode="cover" />
                                    ) : (
                                        <View style={styles.uploadBoxInner}>
                                            <Ionicons name="image-outline" size={30} color="#5C74FF" />
                                            <Text style={styles.uploadDesc}>Click the button below to upload your files.</Text>
                                            <View style={styles.chooseFileBtn}>
                                                <Text style={styles.chooseFileBtnText}>Choose File</Text>
                                            </View>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            </View>

                            <View style={styles.statusRow}>
                                <Text style={styles.statusLabel}>Active Status</Text>
                                <Switch
                                    value={campActiveStatus}
                                    onValueChange={setCampActiveStatus}
                                    trackColor={{ false: '#D3D3D3', true: '#34C759' }}
                                    thumbColor={'#FFF'}
                                    style={{ transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }] }}
                                />
                            </View>

                            <TouchableOpacity style={styles.submitBtn} onPress={handleSaveMedicalCamp} disabled={loading}>
                                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>Submit</Text>}
                            </TouchableOpacity>
                        </>
                    ) : (
                        <View style={styles.listContainer}>
                            {campsList.length === 0 && !loading && (
                                <Text style={{ textAlign: 'center', color: '#999', marginTop: 20 }}>No medical camps found.</Text>
                            )}
                            {campsList.map((camp: any) => {
                                const isMyCamp = camp.role === 'doctor' && camp.doctorName === userData?.doctorName;
                                const isUnseen = !isMyCamp && !seenCamps.includes(camp._id);
                                return (
                                    <TouchableOpacity 
                                        key={camp._id} 
                                        style={[styles.campCard, isUnseen && styles.unseenCampCard]} 
                                        activeOpacity={0.9}
                                        onPress={() => isUnseen && markAsRead(camp._id)}
                                    >
                                        {isUnseen && <View style={styles.newBadge}><Text style={styles.newBadgeText}>New</Text></View>}
                                        <View style={styles.cardHeader}>
                                            <View style={styles.cardHeaderLeft}>
                                                <Ionicons name="notifications" size={20} color="#5C74FF" />
                                                <Text style={styles.cardTitle}>{camp.title}</Text>
                                        </View>
                                        <Text style={[styles.cardActiveText, { color: camp.activeStatus ? '#34C759' : '#FF3B30' }]}>
                                            {camp.activeStatus ? 'Active' : 'Inactive'}
                                        </Text>
                                    </View>
                                    <Text style={styles.cardDescription}>
                                        {camp.description} available date {camp.fromDate} to {camp.toDate}
                                    </Text>
                                    {camp.image ? (
                                        <Image source={{ uri: camp.image }} style={styles.cardImage} resizeMode="cover" />
                                    ) : null}
                                    <Text style={styles.cardCreator}>
                                        Created by: {camp.role === 'admin' ? 'Admin' : camp.doctorName || 'Doctor'}
                                    </Text>
                                    {camp.role === 'doctor' && camp.doctorName === userData?.doctorName && (
                                        <View style={styles.cardActions}>
                                            <TouchableOpacity style={styles.editBtn} onPress={() => openEditModal(camp)}>
                                                <Ionicons name="create-outline" size={16} color="#666" />
                                                <Text style={styles.editBtnText}>Edit</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteCamp(camp._id)}>
                                                <Ionicons name="trash-outline" size={16} color="#FF3B30" />
                                                <Text style={styles.deleteBtnText}>Delete</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </TouchableOpacity>
                                );
                            })}
                        </View>
                    )}

                </ScrollView>
            </View>



            {/* Edit Modal */}
            <Modal visible={editModalVisible} transparent={true} animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContainer, { width: '90%', maxHeight: '85%' }]}>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
                                <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#333' }}>Edit Medical Camp</Text>
                                <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                                    <Ionicons name="close" size={24} color="#666" />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.inputWrapper}>
                                <Text style={[styles.floatingLabel, { width: 45 }]}>Title</Text>
                                <TextInput style={styles.inputField} value={editTitle} onChangeText={setEditTitle} />
                            </View>

                            <View style={styles.dateRow}>
                                <View style={[styles.inputWrapper, { flex: 0.48 }]}>
                                    <Text style={[styles.floatingLabel, { width: 75 }]}>From Date</Text>
                                    <TouchableOpacity onPress={() => setShowCalendar('editFrom')} style={styles.dateInputTouchable}>
                                        <TextInput style={styles.dateInputField} value={editFromDate} editable={false} pointerEvents="none" />
                                        <Ionicons name="calendar-outline" size={20} color="#0D6EFD" />
                                    </TouchableOpacity>
                                </View>
                                <View style={[styles.inputWrapper, { flex: 0.48 }]}>
                                    <Text style={[styles.floatingLabel, { width: 65 }]}>To Date</Text>
                                    <TouchableOpacity onPress={() => setShowCalendar('editTo')} style={styles.dateInputTouchable}>
                                        <TextInput style={styles.dateInputField} value={editToDate} editable={false} pointerEvents="none" />
                                        <Ionicons name="calendar-outline" size={20} color="#0D6EFD" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={[styles.inputWrapper, { height: 100 }]}>
                                <Text style={[styles.floatingLabel, { width: 85 }]}>Description</Text>
                                <TextInput
                                    style={[styles.inputField, { height: 100, textAlignVertical: 'top', paddingTop: 10 }]}
                                    multiline
                                    value={editDescription}
                                    onChangeText={setEditDescription}
                                />
                            </View>

                            <View style={styles.uploadRow}>
                                <Text style={styles.uploadLabel}>Image Upload</Text>
                                <TouchableOpacity style={styles.uploadBox} onPress={handleEditImageUpload}>
                                    {editImage ? (
                                        <Image source={{ uri: editImage.uri }} style={{ width: '100%', height: 100, borderRadius: 8 }} resizeMode="cover" />
                                    ) : (
                                        <View style={styles.uploadBoxInner}>
                                            <Ionicons name="image-outline" size={30} color="#5C74FF" />
                                            <Text style={styles.uploadDesc}>Click to change image.</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            </View>

                            <View style={styles.statusRow}>
                                <Text style={styles.statusLabel}>Active Status</Text>
                                <Switch
                                    value={editActiveStatus}
                                    onValueChange={setEditActiveStatus}
                                    trackColor={{ false: '#D3D3D3', true: '#34C759' }}
                                    thumbColor={'#FFF'}
                                    style={{ transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }] }}
                                />
                            </View>

                            <TouchableOpacity style={styles.submitBtn} onPress={handleUpdateCamp} disabled={loading}>
                                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>Update</Text>}
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Calendar Modal */}
            <Modal visible={!!showCalendar} transparent={true} animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.calendarContainer}>
                        <Calendar
                            onDayPress={onDayPress}
                            theme={{
                                selectedDayBackgroundColor: '#0D6EFD',
                                todayTextColor: '#0D6EFD',
                                arrowColor: '#0D6EFD',
                            }}
                        />
                        <TouchableOpacity style={styles.closeCalendarBtn} onPress={() => setShowCalendar(null)}>
                            <Text style={styles.closeCalendarText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    blueTopBackground: {
        position: 'absolute', top: 0, left: 0, right: 0, height: 200,
        backgroundColor: '#0D6EFD', borderBottomLeftRadius: 60, borderBottomRightRadius: 60,
    },
    customHeader: {
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 30, paddingBottom: 20,
    },
    headerBtn: { flexDirection: 'row', alignItems: 'center' },
    headerTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
    content: {
        position: 'absolute', top: 85, bottom: 0, alignSelf: 'center',
        backgroundColor: '#FFF', borderTopLeftRadius: 30, borderTopRightRadius: 30,
        width: '95%', paddingHorizontal: 20, paddingTop: 30,
    },
    scrollContent: { paddingBottom: 40 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
    pushMsgText: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    viewToggleText: { fontSize: 14, fontWeight: 'bold', color: '#0D6EFD', textDecorationLine: 'underline' },
    statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', marginBottom: 30, paddingHorizontal: 5 },
    statusLabel: { fontSize: 14, fontWeight: 'bold', color: '#333', marginRight: 15 },

    inputWrapper: {
        position: 'relative',
        borderWidth: 1,
        borderColor: '#CCC',
        borderRadius: 8,
        marginBottom: 25,
        paddingHorizontal: 15,
        height: 50,
        justifyContent: 'center'
    },
    floatingLabel: {
        position: 'absolute',
        top: -10,
        left: 15,
        backgroundColor: '#FFF',
        paddingHorizontal: 5,
        fontSize: 12,
        color: '#666',
    },
    inputField: {
        flex: 1,
        fontSize: 14,
        color: '#333',
        paddingVertical: 0,
    },
    dateRow: { flexDirection: 'row', justifyContent: 'space-between' },
    dateInputTouchable: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    dateInputField: { flex: 1, fontSize: 14, color: '#333', paddingVertical: 0 },

    uploadRow: { flexDirection: 'column', alignItems: 'flex-start', marginBottom: 30 },
    uploadLabel: { fontSize: 14, color: '#666', marginBottom: 15 },
    uploadBox: {
        width: '100%',
        borderWidth: 1,
        borderColor: '#EEE',
        borderRadius: 10,
        borderStyle: 'dashed',
        padding: 15,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 120,
        backgroundColor: '#FAFAFA'
    },
    uploadBoxInner: { alignItems: 'center' },
    uploadDesc: { fontSize: 10, color: '#999', textAlign: 'center', marginVertical: 8 },
    chooseFileBtn: { backgroundColor: '#5C74FF', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 5 },
    chooseFileBtnText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },

    submitBtn: { backgroundColor: '#34C759', paddingVertical: 14, borderRadius: 8, alignItems: 'center', alignSelf: 'center', width: 120 },
    submitBtnText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },



    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContainer: { backgroundColor: '#FFF', borderRadius: 15, padding: 20 },
    calendarContainer: { backgroundColor: '#FFF', borderRadius: 10, padding: 20, width: '90%' },
    closeCalendarBtn: { marginTop: 15, alignItems: 'center', padding: 10, backgroundColor: '#0D6EFD', borderRadius: 8 },
    closeCalendarText: { color: '#FFF', fontWeight: 'bold' },

    // List Styles
    listContainer: { paddingBottom: 20 },
    campCard: { backgroundColor: '#F8F9FA', borderRadius: 15, padding: 15, marginBottom: 20, elevation: 4, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, position: 'relative' },
    unseenCampCard: { backgroundColor: '#EBF0FF' },
    newBadge: { position: 'absolute', top: -10, left: 15, backgroundColor: '#FF3B30', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, zIndex: 1 },
    newBadgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, marginTop: 5 },
    cardHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
    cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#5C74FF', marginLeft: 8 },
    cardActiveText: { fontSize: 12, fontWeight: 'bold' },
    cardDescription: { fontSize: 13, color: '#555', lineHeight: 18, marginBottom: 12 },
    cardImage: { width: '100%', height: 120, borderRadius: 8, marginBottom: 10 },
    cardCreator: { fontSize: 12, color: '#888', fontStyle: 'italic', marginBottom: 15 },
    cardActions: { flexDirection: 'row', justifyContent: 'flex-start' },
    editBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E0E0E0', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, marginRight: 15 },
    editBtnText: { fontSize: 12, fontWeight: 'bold', color: '#666', marginLeft: 5 },
    deleteBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFD6D6', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
    deleteBtnText: { fontSize: 12, fontWeight: 'bold', color: '#FF3B30', marginLeft: 5 },
});
