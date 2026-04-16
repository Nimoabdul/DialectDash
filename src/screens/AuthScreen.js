import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  SafeAreaView, Alert, ActivityIndicator, KeyboardAvoidingView, 
  Platform, Image, StatusBar
} from 'react-native';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import * as ImagePicker from 'expo-image-picker';
import { auth } from '../config/firebase.js';
import { Ionicons } from '@expo/vector-icons';

export default function AuthScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [profilePic, setProfilePic] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'We need camera roll permissions to upload a profile picture.');
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

  const handleAuth = async () => {
    if (!email || !password || (!isLoginMode && !name)) {
      if (Platform.OS === 'web') {
        window.alert('Please fill in all required fields.');
      } else {
        Alert.alert('Hold up!', 'Please fill in all required fields.');
      }
      return;
    }

    setLoading(true);
    try {
      if (isLoginMode) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, {
          displayName: name,
          photoURL: profilePic
        });
      }
    } catch (error) {
      console.log("🔥 FIREBASE ERROR: ", error.message);
      if (Platform.OS === 'web') {
        window.alert("Authentication Error: " + error.message);
      } else {
        Alert.alert('Authentication Error', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSocialAuth = (provider) => {
    Alert.alert(
      `${provider} Sign-In`, 
      `To make ${provider} login work on a real phone, we need to generate official developer keys in the Google Cloud Console. Want to set that up next?`
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardWrapper}>
        
        {/* TOP BRANDING AREA */}
        <View style={styles.headerArea}>
          <View style={styles.logoShadow}>
            <View style={styles.appIconBg}>
              <Ionicons name="chatbubble-ellipses" size={56} color="#3B82F6" />
              <View style={styles.flashBadge}>
                <Ionicons name="flash" size={20} color="#fff" />
              </View>
            </View>
          </View>
          
          <Text style={styles.title}>
            Dialect<Text style={styles.titleHighlight}>Dash</Text>
          </Text>
          <Text style={styles.subtitle}>Learn a language, play a game.</Text>
        </View>

        {/* BOTTOM FORM CARD */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>{isLoginMode ? 'Welcome Back!' : 'Join the Fun!'}</Text>
          
          {!isLoginMode && (
            <View style={styles.pfpWrapper}>
              <TouchableOpacity style={styles.pfpContainer} onPress={pickImage} activeOpacity={0.8}>
                {profilePic ? (
                  <Image source={{ uri: profilePic }} style={styles.pfpImage} />
                ) : (
                  <View style={styles.pfpPlaceholder}>
                    <Ionicons name="camera" size={32} color="#9CA3AF" />
                  </View>
                )}
                <View style={styles.pfpBadge}>
                  <Ionicons name="add" size={16} color="#fff" />
                </View>
              </TouchableOpacity>
              <Text style={styles.pfpText}>{profilePic ? 'Looking good!' : 'Add Avatar'}</Text>
            </View>
          )}

          <View style={styles.inputGroup}>
            {!isLoginMode && (
              <View style={styles.inputWrapper}>
                <Ionicons name="person" size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="What's your name?"
                  placeholderTextColor="#9CA3AF"
                  value={name}
                  onChangeText={setName}
                />
              </View>
            )}

            <View style={styles.inputWrapper}>
              <Ionicons name="mail" size={20} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email Address"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed" size={20} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
          </View>

          {/* 3D PRIMARY BUTTON */}
          <TouchableOpacity 
            style={[styles.primaryButton, loading && styles.buttonDisabled]} 
            onPress={handleAuth} 
            disabled={loading} 
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="large" />
            ) : (
              <Text style={styles.buttonText}>{isLoginMode ? 'LOG IN' : 'CREATE ACCOUNT'}</Text>
            )}
          </TouchableOpacity>

          {/* DIVIDER */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* SOCIAL BUTTONS */}
          <View style={styles.socialRow}>
            <TouchableOpacity 
              style={styles.socialButtonGoogle} 
              onPress={() => handleSocialAuth('Google')}
              activeOpacity={0.8}
            >
              <Ionicons name="logo-google" size={22} color="#DB4437" />
              <Text style={styles.socialTextGoogle}>Google</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.socialButtonApple} 
              onPress={() => handleSocialAuth('Apple')}
              activeOpacity={0.8}
            >
              <Ionicons name="logo-apple" size={22} color="#fff" />
              <Text style={styles.socialTextApple}>Apple</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            onPress={() => {
              setIsLoginMode(!isLoginMode);
              setEmail(''); setPassword(''); setName(''); setProfilePic(null);
            }}
            style={styles.switchContainer}
            activeOpacity={0.6}
          >
            <Text style={styles.switchTextNormal}>
              {isLoginMode ? "New around here? " : "Already a member? "}
              <Text style={styles.switchTextBold}>{isLoginMode ? "Sign Up" : "Log In"}</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#3B82F6' },
  keyboardWrapper: { flex: 1, justifyContent: 'space-between' },
  
  headerArea: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 30 },
  logoShadow: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 10, marginBottom: 20 },
  appIconBg: { width: 100, height: 100, backgroundColor: '#ffffff', borderRadius: 28, justifyContent: 'center', alignItems: 'center', transform: [{ rotate: '-4deg' }], position: 'relative' },
  flashBadge: { position: 'absolute', bottom: -8, right: -8, backgroundColor: '#F59E0B', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#3B82F6' },
  title: { fontSize: 38, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },
  titleHighlight: { color: '#F59E0B' },
  subtitle: { fontSize: 17, color: 'rgba(255, 255, 255, 0.9)', marginTop: 4, fontWeight: '600' },
  
  formCard: { backgroundColor: '#ffffff', borderTopLeftRadius: 40, borderTopRightRadius: 40, paddingHorizontal: 30, paddingTop: 35, paddingBottom: Platform.OS === 'ios' ? 45 : 30, shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.1, shadowRadius: 15, elevation: 10 },
  formTitle: { fontSize: 26, fontWeight: '800', color: '#1F2937', marginBottom: 25, textAlign: 'center' },
  
  pfpWrapper: { alignItems: 'center', marginBottom: 20 },
  pfpContainer: { position: 'relative' },
  pfpPlaceholder: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#E5E7EB', borderStyle: 'dashed' },
  pfpImage: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: '#3B82F6' },
  pfpBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#10B981', width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  pfpText: { fontSize: 14, color: '#6B7280', fontWeight: '700', marginTop: 10 },

  inputGroup: { marginBottom: 15 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 20, marginBottom: 15, paddingHorizontal: 20, paddingVertical: Platform.OS === 'ios' ? 18 : 12 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: '#1F2937', fontWeight: '600' },
  
  primaryButton: { backgroundColor: '#10B981', paddingVertical: 18, borderRadius: 20, alignItems: 'center', marginTop: 5, borderBottomWidth: 5, borderBottomColor: '#059669' },
  buttonDisabled: { backgroundColor: '#9CA3AF', borderBottomColor: '#6B7280' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 1.2 },
  
  /* --- NEW DIVIDER STYLES --- */
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 25 },
  dividerLine: { flex: 1, height: 2, backgroundColor: '#F3F4F6', borderRadius: 1 },
  dividerText: { marginHorizontal: 15, color: '#9CA3AF', fontWeight: '800', fontSize: 14 },

  /* --- NEW SOCIAL BUTTON STYLES --- */
  socialRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  socialButtonGoogle: { flex: 1, flexDirection: 'row', backgroundColor: '#fff', paddingVertical: 15, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 10, borderWidth: 2, borderColor: '#E5E7EB', borderBottomWidth: 5, borderBottomColor: '#D1D5DB' },
  socialTextGoogle: { color: '#1F2937', fontSize: 16, fontWeight: '800', marginLeft: 8 },
  
  socialButtonApple: { flex: 1, flexDirection: 'row', backgroundColor: '#000', paddingVertical: 15, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginLeft: 10, borderBottomWidth: 5, borderBottomColor: '#374151' },
  socialTextApple: { color: '#fff', fontSize: 16, fontWeight: '800', marginLeft: 8 },

  switchContainer: { marginTop: 25, alignItems: 'center' },
  switchTextNormal: { color: '#6B7280', fontSize: 15, fontWeight: '600' },
  switchTextBold: { color: '#3B82F6', fontWeight: '800', fontSize: 16 }
});