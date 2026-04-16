import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, SafeAreaView, Platform, TouchableOpacity, StatusBar } from 'react-native';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase.js';
import { Ionicons } from '@expo/vector-icons';

const SELECTIONS = [
  { id: 'fr', name: 'French', isMath: false, image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800' },
  { id: 'es', name: 'Spanish', isMath: false, image: 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?w=800' },
  { id: 'it', name: 'Italian', isMath: false, image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800' },
  { id: 'de', name: 'German', isMath: false, image: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=800' },
  { id: 'math', name: 'Math Area', isMath: true, image: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800' },
];

export default function HomeScreen({ navigation }) {
  const [languageScores, setLanguageScores] = useState({});
  
  const user = auth.currentUser;
  const displayName = user?.displayName || 'Explorer';
  const firstInitial = displayName.charAt(0).toUpperCase();
  const profilePic = user?.photoURL;

  useEffect(() => {
    const loadScores = async () => {
      if (user) {
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setLanguageScores(docSnap.data());
          }
        } catch (e) {
          console.log("Score fetch error: ", e);
        }
      }
    };
    const unsubscribe = navigation.addListener('focus', loadScores);
    return unsubscribe;
  }, [navigation, user]);

  const totalXP = Object.keys(languageScores)
    .filter(key => key.startsWith('highScore_'))
    .reduce((sum, key) => sum + languageScores[key], 0);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.headerPill}>
        <View style={styles.profileRow}>
          {profilePic ? (
            <Image source={{ uri: profilePic }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{firstInitial}</Text>
            </View>
          )}
          
          <View style={styles.nameScoreCol}>
            <Text style={styles.welcomeText}>Hey, {displayName}!</Text>
            <View style={styles.xpBadge}>
              <Ionicons name="flash" size={14} color="#F59E0B" style={{marginRight: 4}} />
              <Text style={styles.xpText}>{totalXP} Total XP</Text>
            </View>
          </View>
        </View>
        
        {/* NEW SETTINGS & LOGOUT ROW */}
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity 
            style={styles.settingsButton} 
            onPress={() => navigation.navigate('Settings')}
            activeOpacity={0.7}
          >
            <Ionicons name="settings" size={22} color="#4B5563" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.logoutButton} 
            onPress={() => signOut(auth)}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out" size={22} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Choose your journey</Text>
        
        {SELECTIONS.map((item) => {
          const bestScore = languageScores[`highScore_${item.id}`] || 0;

          return (
            <Pressable
              key={item.id}
              style={({ pressed }) => [
                styles.card,
                pressed && styles.cardPressed
              ]}
              onPress={() => navigation.navigate('Game', { 
                language: item.id, 
                languageName: item.name, 
                isMath: item.isMath 
              })}
            >
              <Image source={{ uri: item.image }} style={styles.cardImage} />
              <View style={styles.cardOverlay}>
                <View style={styles.scoreBadge}>
                  <Ionicons name="trophy" size={16} color="#F59E0B" />
                  <Text style={styles.scoreBadgeText}>Best: {bestScore}</Text>
                </View>

                <View style={styles.cardBottomRow}>
                  <View>
                    <Text style={styles.cardTitle}>{item.name}</Text>
                    <Text style={styles.cardSubTitle}>Start Lesson</Text>
                  </View>
                  <View style={styles.playButton}>
                    <Ionicons name="play" size={24} color="#3B82F6" style={{marginLeft: 3}} />
                  </View>
                </View>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', paddingTop: Platform.OS === 'android' ? 40 : 10 },
  
  headerPill: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    backgroundColor: '#fff', marginHorizontal: 20, padding: 15, 
    borderRadius: 25, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, 
    shadowOpacity: 0.05, shadowRadius: 10, elevation: 5, marginBottom: 10 
  },
  profileRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#BFDBFE' },
  avatarImage: { width: 52, height: 52, borderRadius: 26, borderWidth: 2, borderColor: '#BFDBFE' },
  avatarText: { color: '#fff', fontSize: 22, fontWeight: '900' },
  
  nameScoreCol: { marginLeft: 15 },
  welcomeText: { fontSize: 18, fontWeight: '900', color: '#1F2937' },
  xpBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginTop: 4, alignSelf: 'flex-start' },
  xpText: { fontSize: 13, color: '#D97706', fontWeight: '800' },
  
  /* NEW ACTION BUTTONS STYLES */
  actionButtonsRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  settingsButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  logoutButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center' },
  
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  sectionTitle: { fontSize: 15, fontWeight: '900', color: '#9CA3AF', marginBottom: 20, marginTop: 15, textTransform: 'uppercase', letterSpacing: 1.5 },
  
  card: { 
    height: 200, borderRadius: 30, marginBottom: 25, overflow: 'hidden',
    backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, 
    shadowOpacity: 0.15, shadowRadius: 15, elevation: 8,
    borderBottomWidth: 6, borderBottomColor: '#E5E7EB' 
  },
  cardPressed: { transform: [{ translateY: 4 }], borderBottomWidth: 2, shadowOpacity: 0.05 },
  cardImage: { ...StyleSheet.absoluteFillObject },
  cardOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', padding: 20, justifyContent: 'space-between' },
  
  scoreBadge: { alignSelf: 'flex-end', flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  scoreBadgeText: { color: '#1F2937', fontWeight: '800', marginLeft: 6, fontSize: 14 },
  
  cardBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  cardTitle: { color: '#fff', fontSize: 32, fontWeight: '900', letterSpacing: 0.5 },
  cardSubTitle: { color: 'rgba(255,255,255,0.9)', fontSize: 15, fontWeight: '700', marginTop: 4 },
  
  playButton: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5 }
});