import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  SafeAreaView, Alert, ActivityIndicator, Platform, Image, 
  StatusBar, KeyboardAvoidingView, ScrollView, Switch
} from 'react-native';
import { updateProfile, sendPasswordResetEmail, deleteUser, signOut } from 'firebase/auth';
import * as ImagePicker from 'expo-image-picker';
import { auth } from '../config/firebase.js';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen({ navigation }) {
  const user = auth.currentUser;
  
  // Profile State
  const [name, setName] = useState(user?.displayName || '');
  const [profilePic, setProfilePic] = useState(user?.photoURL || null);
  const [loading, setLoading] = useState(false);

  // Preferences State
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'We need camera roll permissions to change your avatar.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, 
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setProfilePic(result.assets[0].uri);
    }
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      Alert.alert('Hold up!', 'Your nickname cannot be empty.');
      return;
    }

    setLoading(true);
    try {
      await updateProfile(user, { displayName: name, photoURL: profilePic });
      Alert.alert('Success!', 'Your profile has been updated.');
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    try {
      await sendPasswordResetEmail(auth, user.email);
      Alert.alert("Email Sent", `We sent a password reset link to ${user.email}. Check your inbox!`);
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you absolutely sure? This will erase all your high scores and cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete Forever", 
          style: "destructive", 
          onPress: async () => {
            try {
              await deleteUser(user);
              // If successful, Firebase automatically signs them out!
            } catch (error) {
              // Firebase requires a "fresh" login to delete an account for security
              if (error.code === 'auth/requires-recent-login') {
                Alert.alert(
                  "Security Check", 
                  "To protect your account, Firebase requires you to log out and log back in before deleting it.",
                  [
                    { text: "Cancel", style: "cancel" },
                    { text: "Log Out Now", onPress: () => signOut(auth) }
                  ]
                );
              } else {
                Alert.alert("Error", error.message);
              }
            }
          } 
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex: 1}}>
        
        {/* TOP NAV HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={{width: 44}} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* PROFILE PICTURE EDIT */}
          <View style={styles.pfpWrapper}>
            <TouchableOpacity style={styles.pfpContainer} onPress={pickImage} activeOpacity={0.8}>
              {profilePic ? (
                <Image source={{ uri: profilePic }} style={styles.pfpImage} />
              ) : (
                <View style={styles.pfpPlaceholder}>
                  <Text style={styles.pfpInitial}>{name ? name.charAt(0).toUpperCase() : '?'}</Text>
                </View>
              )}
              <View style={styles.pfpBadge}>
                <Ionicons name="camera" size={16} color="#fff" />
              </View>
            </TouchableOpacity>
          </View>

          {/* SECTION: PROFILE */}
          <Text style={styles.sectionTitle}>MY PROFILE</Text>
          <View style={styles.cardGroup}>
            <View style={styles.inputWrapper}>
              <Ionicons name="person" size={20} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Nickname"
                placeholderTextColor="#9CA3AF"
                value={name}
                onChangeText={setName}
              />
            </View>
            <TouchableOpacity 
              style={[styles.primaryButton3D, loading && styles.buttonDisabled]} 
              onPress={handleSaveProfile} 
              disabled={loading} 
              activeOpacity={0.8}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>UPDATE PROFILE</Text>}
            </TouchableOpacity>
          </View>

          {/* SECTION: GAME EXPERIENCE */}
          <Text style={styles.sectionTitle}>GAME EXPERIENCE</Text>
          <View style={styles.cardGroup}>
            <View style={[styles.settingRow, styles.rowBorder]}>
              <View style={styles.settingIconText}>
                <View style={[styles.iconBox, {backgroundColor: '#DBEAFE'}]}><Ionicons name="volume-high" size={20} color="#3B82F6" /></View>
                <Text style={styles.settingText}>Sound Effects</Text>
              </View>
              <Switch value={soundEnabled} onValueChange={setSoundEnabled} trackColor={{ false: "#D1D5DB", true: "#10B981" }} />
            </View>
            
            <View style={[styles.settingRow, styles.rowBorder]}>
              <View style={styles.settingIconText}>
                <View style={[styles.iconBox, {backgroundColor: '#FEF3C7'}]}><Ionicons name="musical-notes" size={20} color="#F59E0B" /></View>
                <Text style={styles.settingText}>Background Music</Text>
              </View>
              <Switch value={musicEnabled} onValueChange={setMusicEnabled} trackColor={{ false: "#D1D5DB", true: "#10B981" }} />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingIconText}>
                <View style={[styles.iconBox, {backgroundColor: '#F3E8FF'}]}><Ionicons name="phone-portrait" size={20} color="#8B5CF6" /></View>
                <Text style={styles.settingText}>Haptic Feedback</Text>
              </View>
              <Switch value={hapticsEnabled} onValueChange={setHapticsEnabled} trackColor={{ false: "#D1D5DB", true: "#10B981" }} />
            </View>
          </View>

          {/* SECTION: ACCOUNT SECURITY */}
          <Text style={styles.sectionTitle}>ACCOUNT & SECURITY</Text>
          <View style={styles.cardGroup}>
            <TouchableOpacity style={[styles.settingRow, styles.rowBorder]} onPress={handleResetPassword} activeOpacity={0.7}>
              <View style={styles.settingIconText}>
                <View style={[styles.iconBox, {backgroundColor: '#E5E7EB'}]}><Ionicons name="key" size={20} color="#4B5563" /></View>
                <Text style={styles.settingText}>Reset Password</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingRow} onPress={handleDeleteAccount} activeOpacity={0.7}>
              <View style={styles.settingIconText}>
                <View style={[styles.iconBox, {backgroundColor: '#FEE2E2'}]}><Ionicons name="trash" size={20} color="#EF4444" /></View>
                <Text style={[styles.settingText, {color: '#EF4444'}]}>Delete Account</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* APP VERSION */}
          <Text style={styles.versionText}>DialectDash v1.0.0</Text>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', paddingTop: Platform.OS === 'android' ? 40 : 0 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15 },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#1F2937' },
  
  scrollContent: { paddingHorizontal: 20, paddingBottom: 50 },
  
  pfpWrapper: { alignItems: 'center', marginVertical: 20 },
  pfpContainer: { position: 'relative', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  pfpPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: '#BFDBFE' },
  pfpImage: { width: 100, height: 100, borderRadius: 50, borderWidth: 4, borderColor: '#3B82F6' },
  pfpInitial: { fontSize: 40, fontWeight: '900', color: '#fff' },
  pfpBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#10B981', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#fff' },

  sectionTitle: { fontSize: 13, fontWeight: '900', color: '#9CA3AF', marginBottom: 10, marginTop: 25, letterSpacing: 1.5, marginLeft: 10 },
  
  cardGroup: { backgroundColor: '#fff', borderRadius: 24, padding: 15, borderWidth: 2, borderColor: '#E5E7EB', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 2 },
  
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 16, paddingHorizontal: 20, paddingVertical: 15, marginBottom: 15 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: '#1F2937', fontWeight: '800' },
  
  primaryButton3D: { backgroundColor: '#3B82F6', paddingVertical: 15, borderRadius: 16, alignItems: 'center', borderBottomWidth: 4, borderBottomColor: '#2563EB' },
  buttonDisabled: { backgroundColor: '#9CA3AF', borderBottomColor: '#6B7280' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 1.2 },

  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  settingIconText: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  settingText: { fontSize: 16, fontWeight: '700', color: '#1F2937' },

  versionText: { textAlign: 'center', color: '#D1D5DB', fontWeight: '700', marginTop: 40, marginBottom: 20 }
});