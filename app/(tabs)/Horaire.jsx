import React, { useState, useContext, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView,
  Switch, 
  ActivityIndicator,
  Dimensions,
  ImageBackground,
  Animated,
  Easing
} from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/FirebaseConfig';
import { useUserContext } from "../../context/UserContext";
import Ionicons from 'react-native-vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router, useLocalSearchParams } from 'expo-router';
import EvilIcons from "react-native-vector-icons/EvilIcons";

const { width, height } = Dimensions.get("window");

const Horaire = () => {
    const { userDetail ,setUserDetail} = useUserContext();
  const params = useLocalSearchParams();
  const joursOrdre = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
  
  const parseWorkingDays = (hoursString) => {
    if (!hoursString) return null;
    
    try {
      const hours = JSON.parse(hoursString);
      const parsedHours = {};
      
      Object.entries(hours).forEach(([day, schedule]) => {
        parsedHours[day] = {
          ouvert: schedule.ouvert,
          heureOuverture: schedule.heureOuverture 
            ? new Date(schedule.heureOuverture) 
            : new Date(2023, 0, 1, 8, 0),
          heureFermeture: schedule.heureFermeture 
            ? new Date(schedule.heureFermeture) 
            : new Date(2023, 0, 1, 18, 0)
        };
      });
      
      return parsedHours;
    } catch (e) {
      console.error("Error parsing working hours:", e);
      return null;
    }
  };

  const existingHours = params.existingHours 
    ? JSON.parse(params.existingHours)
    : null;

  const [jours, setJours] = useState(() => {
    const defaultHours = {
      lundi: { ouvert: false, heureOuverture: new Date(2023, 0, 1, 8, 0), heureFermeture: new Date(2023, 0, 1, 18, 0) },
      mardi: { ouvert: false, heureOuverture: new Date(2023, 0, 1, 8, 0), heureFermeture: new Date(2023, 0, 1, 18, 0) },
      mercredi: { ouvert: false, heureOuverture: new Date(2023, 0, 1, 8, 0), heureFermeture: new Date(2023, 0, 1, 18, 0) },
      jeudi: { ouvert: false, heureOuverture: new Date(2023, 0, 1, 8, 0), heureFermeture: new Date(2023, 0, 1, 18, 0) },
      vendredi: { ouvert: false, heureOuverture: new Date(2023, 0, 1, 8, 0), heureFermeture: new Date(2023, 0, 1, 18, 0) },
      samedi: { ouvert: false, heureOuverture: new Date(2023, 0, 1, 8, 0), heureFermeture: new Date(2023, 0, 1, 18, 0) },
      dimanche: { ouvert: false, heureOuverture: new Date(2023, 0, 1, 8, 0), heureFermeture: new Date(2023, 0, 1, 18, 0) }
    };

    if (params.existingHours) {
      const parsed = parseWorkingDays(params.existingHours);
      if (parsed) return parsed;
    }
    
    return defaultHours;
  });

  const [selectedDay, setSelectedDay] = useState(null);
  const [showTimePicker, setShowTimePicker] = useState({ ouvert: false, ferme: false });
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef(null);
  const [notification, setNotification] = useState({
    visible: false,
    type: '',
    message: ''
  });
  const fadeAnim = useState(new Animated.Value(0))[0];

  const toggleJour = (jour) => {
    const updatedJours = {
      ...jours,
      [jour]: {
        ...jours[jour],
        ouvert: !jours[jour].ouvert
      }
    };
    setJours(updatedJours);
  };

  const handleTimeChange = (event, selectedDate, jour, type) => {
    setShowTimePicker({ ouvert: false, ferme: false });
    if (selectedDate) {
      const updatedJours = {
        ...jours,
        [jour]: {
          ...jours[jour],
          [type === 'ouverture' ? 'heureOuverture' : 'heureFermeture']: selectedDate
        }
      };
      setJours(updatedJours);
    }
  };

  const showNotification = (type, message) => {
    setNotification({
      visible: true,
      type,
      message
    });

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      easing: Easing.ease,
      useNativeDriver: true,
    }).start();

    setTimeout(() => {
      hideNotification();
    }, 3000);
  };

  const hideNotification = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      easing: Easing.ease,
      useNativeDriver: true,
    }).start(() => {
      setNotification({
        visible: false,
        type: '',
        message: ''
      });
    });
  };

  const saveWorkingDays = async () => {
    setIsLoading(true);
    
    try {
      const userRef = doc(db, "restaurants", userDetail.uid);
      await updateDoc(userRef, {
        workingDays: jours
      });
      
      setUserDetail({
        ...userDetail,
        workingDays: jours
      });

      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      showNotification('success', 'Horaires enregistrés avec succès!');

      setTimeout(() => {
        router.push('/ProfileResto');
      }, 2000);

    } catch (error) {
      console.error("Erreur:", error);
      showNotification('error', "Échec de l'enregistrement");
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleGoBack = () => router.push("/ProfileResto");

  return (
    <ImageBackground 
      source={require('../../assets/images/cover.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <ScrollView 
        ref={scrollViewRef}
        style={styles.container}
        contentContainerStyle={styles.scrollContainer}
      >
        {/* Notification */}
        {notification.visible && (
          <Animated.View 
            style={[
              styles.notification,
              notification.type === 'success' 
                ? styles.successNotification 
                : styles.errorNotification,
              { opacity: fadeAnim }
            ]}
          >
            <Ionicons 
              name={notification.type === 'success' ? "checkmark-circle-outline" : "alert-circle-outline"} 
              size={24} 
              color="black"
              style={styles.notificationIcon}
            />
            <View style={styles.notificationTextContainer}>
              <Text style={styles.notificationMessage}>{notification.message}</Text>
            </View>
            <TouchableOpacity onPress={hideNotification}>
              <Ionicons name="close" size={20} color="black" />
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Back Button */}
        <TouchableOpacity 
          onPress={handleGoBack}
          style={styles.backButton}
        >
          <EvilIcons name="arrow-left" size={45} color="black" />
        </TouchableOpacity>

        <Text style={styles.title}>Jours et horaires d'ouverture</Text>
        
        {joursOrdre.map((jour) => (
          <View key={jour} style={styles.dayContainer}>
            <View style={styles.dayHeader}>
              <Text style={styles.dayText}>
                {jour === 'lundi' && 'Lundi'}
                {jour === 'mardi' && 'Mardi'}
                {jour === 'mercredi' && 'Mercredi'}
                {jour === 'jeudi' && 'Jeudi'}
                {jour === 'vendredi' && 'Vendredi'}
                {jour === 'samedi' && 'Samedi'}
                {jour === 'dimanche' && 'Dimanche'}
              </Text>
              <Switch
                value={jours[jour].ouvert}
                onValueChange={() => toggleJour(jour)}
                trackColor={{ false: "#DAD4DE", true: "#70C7C6"}}
                thumbColor={jours[jour].ouvert ? "#BCFD7B" : "#f4f3f4"}
              />
            </View>

            {jours[jour].ouvert && (
              <View style={styles.timeContainer}>
                <TouchableOpacity 
                  style={styles.timeInput}
                  onPress={() => {
                    setSelectedDay(jour);
                    setShowTimePicker({ ouvert: true, ferme: false });
                  }}
                >
                  <Ionicons name="time-outline" size={20} color="black" />
                  <Text style={styles.timeText}>Ouverture: {formatTime(jours[jour].heureOuverture)}</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.timeInput}
                  onPress={() => {
                    setSelectedDay(jour);
                    setShowTimePicker({ ouvert: false, ferme: true });
                  }}
                >
                  <Ionicons name="time-outline" size={20} color="black" />
                  <Text style={styles.timeText}>Fermeture: {formatTime(jours[jour].heureFermeture)}</Text>
                </TouchableOpacity>

                {showTimePicker.ouvert && selectedDay === jour && (
                  <DateTimePicker
                    value={jours[jour].heureOuverture}
                    mode="time"
                    is24Hour={true}
                    display="default"
                    onChange={(event, date) => handleTimeChange(event, date, jour, 'ouverture')}
                  />
                )}

                {showTimePicker.ferme && selectedDay === jour && (
                  <DateTimePicker
                    value={jours[jour].heureFermeture}
                    mode="time"
                    is24Hour={true}
                    display="default"
                    onChange={(event, date) => handleTimeChange(event, date, jour, 'fermeture')}
                  />
                )}
              </View>
            )}
          </View>
        ))}

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            onPress={saveWorkingDays}
            disabled={isLoading}
            style={styles.saveButton}
          >
            {isLoading ? (
              <ActivityIndicator color="black" />
            ) : (
              <Text style={styles.saveButtonText}>Enregistrer les horaires</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  backButton: {
    position: 'absolute',
    top: height * 0.05,
    left: width * 0.05,
    zIndex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'black',
    marginBottom: 30,
    textAlign: 'center',
    marginTop: height * 0.09,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: {width: -1, height: 1},
    textShadowRadius: 10
  },
  dayContainer: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'black',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  dayText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'black',
  },
  timeContainer: {
    marginTop: 10,
  },
  timeInput: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#EAE5E5',
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: '#EAE5E5',
  },
  timeText: {
    marginLeft: 10,
    fontSize: 16,
    color: 'black',
  },
  notification: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'black',
    zIndex: 1000,
  },
  successNotification: {
    backgroundColor: '#CBEFB6',
  },
  errorNotification: {
    backgroundColor: '#EAE5E5',
  },
  notificationIcon: {
    marginRight: 10,
  },
  notificationTextContainer: {
    flex: 1,
  },
  notificationMessage: {
    fontSize: 16,
    color: 'black',
  },
  buttonContainer: {
    marginTop: 20,
    marginBottom: 40,
  },
  saveButton: {
    backgroundColor: '#EAE5E5',
    padding: 15,
    
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'black',
  },
  saveButtonText: {
    color: 'black',
    fontWeight: 'bold',
    fontSize: 18,
  },
});

export default Horaire;