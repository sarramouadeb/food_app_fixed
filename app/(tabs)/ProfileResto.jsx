import React, { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  ImageBackground,
} from "react-native";
import { useUserContext } from "../../context/UserContext";
import EvilIcons from "react-native-vector-icons/EvilIcons";
import { doc, onSnapshot, collection, query, where, getDocs, getDoc } from "firebase/firestore";
import { db } from "../../config/FirebaseConfig";
import { router } from "expo-router";

const { width, height } = Dimensions.get("window");

const ProfileResto = () => {
  const { userDetail } = useUserContext();
  const [hasWorkingHours, setHasWorkingHours] = useState(false);
  const [loading, setLoading] = useState(true);
  const [workingDays, setWorkingDays] = useState({});
  const [donationCount, setDonationCount] = useState(0);
  const [imageError, setImageError] = useState(false);

  const checkWorkingHours = (days) => {
    if (!days || typeof days !== 'object') return false;
    return Object.values(days).some(day => day?.ouvert === true);
  };

  useEffect(() => {
    let unsubscribeRestaurant;

    if (userDetail?.uid) {
      const docRef = doc(db, "restaurants", userDetail.uid);
      
      unsubscribeRestaurant = onSnapshot(docRef, (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          const days = data?.workingDays || {};
          
          setWorkingDays(days);
          setHasWorkingHours(checkWorkingHours(days));
          setLoading(false);
        }
      });

      if (userDetail?.workingDays) {
        const days = userDetail.workingDays;
        setWorkingDays(days);
        setHasWorkingHours(checkWorkingHours(days));
        setLoading(false);
      }
    }

    return () => {
      if (unsubscribeRestaurant) unsubscribeRestaurant();
    };
  }, [userDetail?.uid]);

  useEffect(() => {
    let unsubscribeAnnonces;
  
    const fetchDonationCount = async (restaurantId) => {
      try {
        const annoncesRef = collection(db, "annonces");
        const q = query(annoncesRef, where("userId", "==", restaurantId));
        
        unsubscribeAnnonces = onSnapshot(q, (querySnapshot) => {
          setDonationCount(querySnapshot.size);
        });
  
      } catch (error) {
        console.error("Error fetching donations count:", error);
      }
    };
  
    if (userDetail?.uid) {
      fetchDonationCount(userDetail.uid);
    }
  
    return () => {
      if (unsubscribeAnnonces) unsubscribeAnnonces();
    };
  }, [userDetail?.uid]);

  const formatTime = (dateString) => {
    if (!dateString) return '';
    try {
      const date = dateString.toDate ? dateString.toDate() : new Date(dateString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      console.error("Error formatting date:", e);
      return '';
    }
  };

  const handleHorairePress = () => {
    const currentHours = workingDays || {};
    const hoursToPass = {};
    
    Object.entries(currentHours).forEach(([day, schedule]) => {
      hoursToPass[day] = {
        ouvert: schedule?.ouvert || false,
        heureOuverture: schedule?.heureOuverture?.toDate?.()?.toISOString() || new Date(2023, 0, 1, 8, 0).toISOString(),
        heureFermeture: schedule?.heureFermeture?.toDate?.()?.toISOString() || new Date(2023, 0, 1, 18, 0).toISOString()
      };
    });

    router.push({
      pathname: "Horaire",
      params: { 
        existingHours: JSON.stringify(hoursToPass),
        restaurantId: userDetail?.uid
      }
    });
  };

  const handleModifPress = async () => {
    try {
      if (userDetail?.uid) {
        const restaurantRef = doc(db, "restaurants", userDetail.uid);
        const restaurantSnap = await getDoc(restaurantRef);
  
        if (restaurantSnap.exists()) {
          const restaurantData = restaurantSnap.data();
          
          router.push({
            pathname: "ModifierProfile",
            params: {
              ...userDetail,
              ...restaurantData
            }
          });
        } else {
          console.log("Aucun document restaurant trouvé");
          router.push({
            pathname: "ModifierProfile",
            params: userDetail
          });
        }
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des données du restaurant:", error);
      router.push({
        pathname: "ModifierProfile",
        params: userDetail
      });
    }
  };

  const handleGoBack = () => router.push("/Annonces");

  const initials = userDetail?.name
    ? userDetail.name
        .split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "NA";

  const colors = ["#7B9DD2", "#DAD4DE", "#BBB4DA", "#7B9DD2", "#70C7C6"];
  const colorIndex = userDetail?.id ? userDetail.id.length % colors.length : 0;

  if (loading) {
    return (
      <ImageBackground 
        source={require('../../assets/images/cover.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={"#8A2BE2"} />
        </View>
      </ImageBackground>
    );
  }

  if (!userDetail) {
    return (
      <ImageBackground 
        source={require('../../assets/images/cover.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.container}>
          <Text>No user data available</Text>
        </View>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground 
      source={require('../../assets/images/cover.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Back Button */}
        <TouchableOpacity 
          onPress={handleGoBack}
          style={styles.backButton}
        >
          <EvilIcons name="arrow-left" size={45} color="black" />
        </TouchableOpacity>

        {/* Header Section */}
        <View style={styles.headerContainer}>
          <View style={styles.avatarWrapper}>
            {userDetail?.image && !imageError ? (
              <Image
                source={{ uri: userDetail.image }}
                style={styles.avatarImage}
                onError={() => setImageError(true)}
              />
            ) : (
              <View style={[styles.avatarFallback, { backgroundColor: colors[colorIndex] }]}>
                <Text style={styles.initials}>{initials}</Text>
              </View>
            )}
          </View>
          
          <Text style={styles.restaurantName}>Restaurant {userDetail?.name}</Text>
          <Text style={styles.location}>{userDetail?.ville}</Text>
          <Text style={styles.phone}>{userDetail?.phone}</Text>
        </View>

        {/* Edit Profile Button */}
        <TouchableOpacity onPress={handleModifPress}>
          <View style={styles.editButton}>
            <Text style={styles.editButtonText}>Modifier Profile</Text>
          </View>
        </TouchableOpacity>
        
        {/* Information Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoText}>
            <Text style={styles.label}>E-mail :</Text> {userDetail?.email || 'Non spécifié'}
          </Text>
          <Text style={styles.infoText}>
            <Text style={styles.label}>Spécialité :</Text> {userDetail?.speciality || 'Non spécifié'}
          </Text>
          <Text style={styles.infoText}>
            <Text style={styles.label}>Nombre de dons :</Text> {donationCount}
          </Text>
          <Text style={styles.sectionTitle}>Horaire d'ouverture:</Text>
        </View>

        {/* Schedule Section */}
        <View style={styles.scheduleSection}>
          {hasWorkingHours ? (
            <>
              {Object.entries(workingDays).map(([day, schedule]) => {
                if (schedule?.ouvert) {
                  return (
                    <View key={day} style={styles.scheduleItem}>
                      <Text style={styles.day}>
                        {day.charAt(0).toUpperCase() + day.slice(1)}
                      </Text>
                      <Text style={styles.hours}>
                        {formatTime(schedule?.heureOuverture)} - {formatTime(schedule?.heureFermeture)}
                      </Text>
                    </View>
                  );
                }
                return null;
              })}
              <TouchableOpacity onPress={handleHorairePress}>
                <View style={styles.editButton2}>
                  <Text style={styles.editButtonText2}>Modifier vos horaires</Text>
                </View>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity onPress={handleHorairePress}>
              <View style={styles.editButton2}>
                <Text style={styles.editButtonText2}>Choisir vos horaires</Text>
              </View>
            </TouchableOpacity>
          )}
          
          
        </View>

        <View style={styles.divider} />
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  backButton: {
    position: 'absolute',
    top: height * 0.05,
    left: width * 0.05,
    zIndex: 1,
  },
  headerContainer: {
    marginTop: height * 0.12,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  avatarWrapper: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    borderWidth: 3,
    borderColor: 'white',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 80,
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    color: 'black',
    fontSize: 64,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  restaurantName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "black",
    textAlign: 'center',
    marginTop: 10,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: {width: -1, height: 1},
    textShadowRadius: 10
  },
  location: {
    fontSize: 20,
    color: "black",
    marginTop: 5,
    fontWeight: '500',
  },
  phone: {
    fontSize: 20,
    color: "black",
    marginTop: 5,
    marginBottom: 10,
    fontWeight: '500',
  },
  editButton: {
    backgroundColor: "#EAE5E5",
    padding: 12,
    
    alignSelf: "center",
    marginVertical: 20,
    width: width * 0.6,
    borderWidth: 1,
    borderColor: 'black',
  },
  editButton2: {
    backgroundColor: "#EAE5E5",
    padding: 12,
    
    alignSelf: "center",
    marginVertical: 20,
    width: width * 0.7,
    borderWidth: 1,
    borderColor: 'black',
  },
  editButtonText: {
    color: "black",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 18,
  },
  editButtonText2: {
    color: "black",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 18,
  },
  infoSection: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: 'black',
  },
  infoText: {
    fontSize: 18,
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    color: 'black',
  },
  label: {
    fontWeight: "bold",
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
    color: "black",
  },
  scheduleSection: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: 'black',
  },
  scheduleItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  day: {
    fontSize: 18,
    color: 'black',
  },
  hours: {
    fontSize: 16,
    color: "black",
    fontWeight: 'bold'
  },
  ratingSection: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginBottom: 40,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: 'black',
  },
  stars: {
    flexDirection: "row",
    justifyContent: 'center',
    marginTop: 10,
  },
  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 20,
  },
});

export default ProfileResto;