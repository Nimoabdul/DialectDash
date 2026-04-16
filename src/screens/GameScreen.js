import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Platform, StatusBar, Animated, Modal, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// --- FIREBASE IMPORTS ---
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase.js';

// --- MINIGAME IMPORTS (ALL 14 GAMES PLUGGED IN) ---
import ShapesMinigame from '../minigames/ShapesMinigame.js';
import ColorsMinigame from '../minigames/ColorsMinigame.js';
import AnimalsMinigame from '../minigames/AnimalsMinigame.js';
import MathMinigame from '../minigames/MathMinigame.js';
import EvenOddMinigame from '../minigames/EvenOddMinigame.js'; 
import FoodSortMinigame from '../minigames/FoodSortMinigame.js';
import CountObjectsMinigame from '../minigames/CountObjectsMinigame.js';
import ComparisonMinigame from '../minigames/ComparisonMinigame.js';
import ShoppingListMinigame from '../minigames/ShoppingListMinigame.js';
import DirectionsMinigame from '../minigames/DirectionsMinigame.js'; 
import WeatherMinigame from '../minigames/WeatherMinigame.js';
import TransportMinigame from '../minigames/TransportMinigame.js';
import PlacesMinigame from '../minigames/PlacesMinigame.js';
import BodyPartsMinigame from '../minigames/BodyPartsMinigame.js';
import FeedbackScreen from '../components/FeedbackScreen.js';

export default function GameScreen({ route, navigation }) {
  const { language, languageName, isMath } = route.params || { language: 'fr', languageName: 'French', isMath: false };
  
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [lives, setLives] = useState(4);
  const [round, setRound] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [lessonComplete, setLessonComplete] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentVocab, setCurrentVocab] = useState([]);
  
  // Start with the correct type of game based on what they clicked on the Home Screen
  const [gameType, setGameType] = useState(isMath ? 'math' : 'colors');

  const ROUND_GOAL = 10; 
  const TIME_LIMIT = Math.max(3000, 8000 - ((level - 1) * 1000)); 
  
  const timerAnim = useRef(new Animated.Value(1)).current;
  const currentAnimation = useRef(null);

  const user = auth.currentUser;
  const displayName = user?.displayName || 'Explorer';
  const firstInitial = displayName.charAt(0).toUpperCase();
  const profilePic = user?.photoURL;

  useEffect(() => {
    const fetchBestScore = async () => {
      if (user) {
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists() && docSnap.data()[`highScore_${language}`]) {
            setBestScore(docSnap.data()[`highScore_${language}`]);
          }
        } catch (e) { console.error("Error fetching score:", e); }
      }
    };
    fetchBestScore();
  }, [user, language]);

  const handleFinalScoreSaving = async (finalScore) => {
    try {
      if (user && finalScore > bestScore) {
        const docRef = doc(db, "users", user.uid);
        await setDoc(docRef, { [`highScore_${language}`]: finalScore }, { merge: true });
        setBestScore(finalScore); 
      }
    } catch (e) { console.error("Error saving score:", e); }
  };

  const startTimer = useCallback(() => {
    timerAnim.setValue(1);
    currentAnimation.current = Animated.timing(timerAnim, {
      toValue: 0, duration: TIME_LIMIT, useNativeDriver: false,
    });
    currentAnimation.current.start(({ finished }) => {
      if (finished && !showFeedback && !gameOver && !lessonComplete && !isPaused) {
        handleFailure(); 
      }
    });
  }, [showFeedback, gameOver, lessonComplete, isPaused, TIME_LIMIT]);

  useEffect(() => {
    if (!showFeedback && !gameOver && !lessonComplete && !isPaused && gameType) startTimer();
    return () => { if (currentAnimation.current) currentAnimation.current.stop(); };
  }, [gameType, showFeedback, isPaused, startTimer, gameOver, lessonComplete]);

  useEffect(() => {
    if (lives <= 0 && !gameOver) {
      if (currentAnimation.current) currentAnimation.current.stop();
      setGameOver(true); handleFinalScoreSaving(score);
    }
    if (round > ROUND_GOAL && !lessonComplete) {
      if (currentAnimation.current) currentAnimation.current.stop();
      setLessonComplete(true); handleFinalScoreSaving(score);
    }
  }, [lives, round, score, gameOver, lessonComplete]);

  const togglePause = () => {
    if (isPaused) { setIsPaused(false); } 
    else { if (currentAnimation.current) currentAnimation.current.stop(); setIsPaused(true); }
  };

  // --- SEPARATING THE MATH GAMES FROM THE LANGUAGE GAMES ---
  const getRandomGameType = () => {
    const types = isMath 
      ? ['math', 'evenOdd'] // <-- Math games go here!
      : ['shapes', 'colors', 'animals', 'foodSort', 'shoppingList', 'directions', 'countObjects', 'comparison', 'weather', 'transport', 'places', 'bodyParts']; // <-- Language games go here!
    return types[Math.floor(Math.random() * types.length)];
  };

  const handleNextLevel = () => {
    setLevel(prev => prev + 1); setRound(1); setLives(4); setLessonComplete(false); setGameType(getRandomGameType());
  };

  const handleSuccess = () => {
    if (currentAnimation.current) currentAnimation.current.stop();
    setScore(prev => prev + (100 * level)); setRound(prev => prev + 1);
    setGameType(null); setTimeout(() => { setGameType(getRandomGameType()); }, 50);
  };

  const handleFailure = (vocabMapping) => {
    if (currentAnimation.current) currentAnimation.current.stop();
    setLives(prev => prev - 1);
    if (vocabMapping && vocabMapping.length > 0) {
      setCurrentVocab(vocabMapping); setShowFeedback(true);
    } else {
      setGameType(null); setTimeout(() => { setGameType(getRandomGameType()); }, 50);
    }
  };

  if (lessonComplete || gameOver) {
    return (
      <SafeAreaView style={styles.overlayContainer}>
        <View style={styles.endCard}>
          <View style={[styles.iconWrapper, { backgroundColor: lessonComplete ? '#FEF3C7' : '#FEE2E2' }]}>
            <Ionicons name={lessonComplete ? "trophy" : "skull"} size={80} color={lessonComplete ? "#F59E0B" : "#EF4444"} />
          </View>
          <Text style={styles.victoryTitle}>{lessonComplete ? `LEVEL ${level} CLEARED!` : "GAME OVER"}</Text>
          <Text style={styles.subTitle}>{lessonComplete ? "You're on fire! Keep it going." : "Dust yourself off and try again!"}</Text>
          
          <View style={styles.statsPanel}>
             <View style={styles.statBox}>
                <Text style={styles.statLabel}>FINAL SCORE</Text>
                <Text style={styles.statValue}>{score}</Text>
             </View>
             <View style={styles.statDivider} />
             <View style={styles.statBox}>
                <Text style={styles.statLabel}>BEST IN {languageName.toUpperCase()}</Text>
                <Text style={[styles.statValue, { color: '#F59E0B' }]}>{Math.max(score, bestScore)}</Text>
             </View>
          </View>

          {lessonComplete && (
            <TouchableOpacity style={styles.primaryButton3D} onPress={handleNextLevel} activeOpacity={0.8}>
              <Text style={styles.buttonText}>NEXT LEVEL</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={[styles.secondaryButton3D, gameOver && { marginTop: 10 }]} onPress={() => navigation.navigate('Home')} activeOpacity={0.8}>
            <Text style={styles.secondaryButtonText}>{gameOver ? "BACK TO MENU" : "SAVE & QUIT"}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (showFeedback) return <FeedbackScreen vocabulary={currentVocab} onNext={() => setShowFeedback(false)} />;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <Modal visible={isPaused} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.pauseCard}>
            <Ionicons name="pause" size={60} color="#3B82F6" style={{ marginBottom: 10 }} />
            <Text style={styles.pauseTitle}>Game Paused</Text>
            <TouchableOpacity style={styles.primaryButton3D} onPress={togglePause} activeOpacity={0.8}>
              <Text style={styles.buttonText}>RESUME</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton3D} onPress={() => navigation.navigate('Home')} activeOpacity={0.8}>
              <Text style={styles.secondaryButtonText}>QUIT GAME</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.headerPill}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="close" size={26} color="#4B5563" />
        </TouchableOpacity>
        
        <View style={styles.headerProgressWrapper}>
          <View style={styles.headerProgressBarBg}>
             <View style={[styles.headerProgressBarFill, { width: `${((round-1)/ROUND_GOAL)*100}%` }]} />
          </View>
        </View>

        <View style={styles.livesWrapper}>
          <Ionicons name="heart" size={24} color="#EF4444" />
          <Text style={styles.livesText}>{lives}</Text>
        </View>
      </View>

      <View style={styles.dashboardRow}>
        <View style={styles.profileSection}>
          {profilePic ? (
            <Image source={{ uri: profilePic }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatar}><Text style={styles.avatarText}>{firstInitial}</Text></View>
          )}
          <View style={styles.nameScoreCol}>
            <Text style={styles.playerName}>{displayName}</Text>
            <Text style={styles.scoreText}>Score: <Text style={styles.scoreHighlight}>{score}</Text></Text>
          </View>
        </View>
        
        <TouchableOpacity onPress={togglePause} style={styles.pauseButton}>
          <Ionicons name="pause" size={24} color="#4B5563" />
        </TouchableOpacity>
      </View>

      <View style={styles.timerWrapper}>
        <Animated.View style={[
          styles.timerBar, 
          { 
            width: timerAnim.interpolate({inputRange: [0, 1], outputRange: ['0%', '100%']}), 
            backgroundColor: timerAnim.interpolate({inputRange: [0, 0.4, 1], outputRange: ['#EF4444', '#F59E0B', '#10B981']}) 
          }
        ]} />
      </View>

      <View style={styles.gameCardWrapper}>
        <View style={styles.gameCard}>
          {/* LANGUAGE GAMES */}
          {gameType === 'shapes' && <ShapesMinigame language={language} onSuccess={handleSuccess} onFailure={handleFailure} />}
          {gameType === 'colors' && <ColorsMinigame language={language} onSuccess={handleSuccess} onFailure={handleFailure} />}
          {gameType === 'animals' && <AnimalsMinigame language={language} onSuccess={handleSuccess} onFailure={handleFailure} />}
          {gameType === 'foodSort' && <FoodSortMinigame language={language} onSuccess={handleSuccess} onFailure={handleFailure} />}
          {gameType === 'countObjects' && <CountObjectsMinigame language={language} onSuccess={handleSuccess} onFailure={handleFailure} />}
          {gameType === 'comparison' && <ComparisonMinigame language={language} onSuccess={handleSuccess} onFailure={handleFailure} />}
          {gameType === 'shoppingList' && <ShoppingListMinigame language={language} onSuccess={handleSuccess} onFailure={handleFailure} />}
          {gameType === 'directions' && <DirectionsMinigame language={language} onSuccess={handleSuccess} onFailure={handleFailure} />}
          {gameType === 'weather' && <WeatherMinigame language={language} onSuccess={handleSuccess} onFailure={handleFailure} />}
          {gameType === 'transport' && <TransportMinigame language={language} onSuccess={handleSuccess} onFailure={handleFailure} />}
          {gameType === 'places' && <PlacesMinigame language={language} onSuccess={handleSuccess} onFailure={handleFailure} />}
          {gameType === 'bodyParts' && <BodyPartsMinigame language={language} onSuccess={handleSuccess} onFailure={handleFailure} />}
          
          {/* MATH GAMES */}
          {gameType === 'math' && <MathMinigame onSuccess={handleSuccess} onFailure={handleFailure} />}
          {gameType === 'evenOdd' && <EvenOddMinigame onSuccess={handleSuccess} onFailure={handleFailure} />}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', paddingTop: Platform.OS === 'android' ? 40 : 10 },
  headerPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 20, padding: 12, borderRadius: 25, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 5, marginBottom: 15 },
  backButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  headerProgressWrapper: { flex: 1, marginHorizontal: 15 },
  headerProgressBarBg: { height: 14, backgroundColor: '#E5E7EB', borderRadius: 7, overflow: 'hidden' },
  headerProgressBarFill: { height: '100%', backgroundColor: '#3B82F6', borderRadius: 7 },
  livesWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEE2E2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  livesText: { fontSize: 16, fontWeight: '800', color: '#EF4444', marginLeft: 4 },

  dashboardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 25, marginBottom: 15 },
  profileSection: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#BFDBFE' },
  avatarImage: { width: 50, height: 50, borderRadius: 25, borderWidth: 2, borderColor: '#BFDBFE' },
  avatarText: { color: '#fff', fontWeight: '900', fontSize: 20 },
  nameScoreCol: { marginLeft: 12 },
  playerName: { fontSize: 16, fontWeight: '800', color: '#1F2937' },
  scoreText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  scoreHighlight: { color: '#F59E0B', fontWeight: '900', fontSize: 16 },
  pauseButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#E5E7EB' },

  timerWrapper: { height: 16, backgroundColor: '#E5E7EB', marginHorizontal: 25, marginBottom: 20, borderRadius: 8, overflow: 'hidden' },
  timerBar: { height: '100%', borderRadius: 8 },
  
  gameCardWrapper: { flex: 1, paddingHorizontal: 20, paddingBottom: 20 },
  gameCard: { flex: 1, backgroundColor: '#fff', borderRadius: 30, padding: 20, borderWidth: 2, borderColor: '#E5E7EB', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 5 },
  
  overlayContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6' },
  endCard: { width: '85%', backgroundColor: '#fff', borderRadius: 40, padding: 30, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 },
  iconWrapper: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  victoryTitle: { fontSize: 30, fontWeight: '900', color: '#1F2937', textAlign: 'center', marginBottom: 5 },
  subTitle: { fontSize: 16, color: '#6B7280', textAlign: 'center', marginBottom: 30, fontWeight: '600' },
  
  statsPanel: { flexDirection: 'row', backgroundColor: '#F9FAFB', width: '100%', borderRadius: 20, paddingVertical: 20, marginBottom: 30, borderWidth: 2, borderColor: '#E5E7EB', justifyContent: 'space-evenly', alignItems: 'center' },
  statBox: { alignItems: 'center', flex: 1 },
  statLabel: { fontSize: 10, fontWeight: '900', color: '#9CA3AF', letterSpacing: 1.2, marginBottom: 4 },
  statValue: { fontSize: 32, fontWeight: '900', color: '#3B82F6' },
  statDivider: { width: 2, height: '80%', backgroundColor: '#E5E7EB' },
  
  primaryButton3D: { backgroundColor: '#10B981', paddingVertical: 18, width: '100%', borderRadius: 20, alignItems: 'center', marginBottom: 15, borderBottomWidth: 5, borderBottomColor: '#059669' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 1.2 },
  secondaryButton3D: { backgroundColor: '#fff', paddingVertical: 18, width: '100%', borderRadius: 20, alignItems: 'center', borderWidth: 2, borderColor: '#E5E7EB', borderBottomWidth: 5, borderBottomColor: '#D1D5DB' },
  secondaryButtonText: { color: '#4B5563', fontSize: 18, fontWeight: '800', letterSpacing: 1.2 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(17, 24, 39, 0.7)', justifyContent: 'center', alignItems: 'center' },
  pauseCard: { width: '80%', backgroundColor: '#fff', borderRadius: 40, padding: 30, alignItems: 'center' },
  pauseTitle: { fontSize: 28, fontWeight: '900', color: '#1F2937', marginBottom: 30 }
});