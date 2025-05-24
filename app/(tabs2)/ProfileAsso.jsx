import React, { useEffect, useState } from "react";
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
import { doc, onSnapshot, collection, query, where } from "firebase/firestore";
import { db } from "../../config/FirebaseConfig";
import { router } from "expo-router";

const { width, height } = Dimensions.get("window");

const ProfileAsso = () => {
  const { userDetail, setUserDetail } = useUserContext();
  const [loading, setLoading] = useState(true);
  const [donationCount, setDonationCount] = useState(0);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    let unsubscribeUser;
    let unsubscribeDonations;
    let isMounted = true;

    const loadData = async () => {
      if (userDetail?.uid && isMounted) {
        try {
          // Chargement des données utilisateur
          const docRef = doc(db, "associations", userDetail.uid);
          unsubscribeUser = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists() && isMounted) {
              const data = docSnap.data();
              setUserDetail(prev => ({ ...prev, ...data }));
            }
          });

          // Chargement du nombre de dons
          const besoinsRef = collection(db, "besoins");
          const q = query(besoinsRef, where("associationId", "==", userDetail.uid));
          unsubscribeDonations = onSnapshot(q, (querySnapshot) => {
            if (isMounted) setDonationCount(querySnapshot.size);
          });

        } catch (error) {
          console.error("Error loading data:", error);
        } finally {
          if (isMounted) setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
      if (unsubscribeUser) unsubscribeUser();
      if (unsubscribeDonations) unsubscribeDonations();
    };
  }, [userDetail?.uid, setUserDetail]);

  const handleModifPress = () => {
    router.push({
      pathname: "ModifierProfileA",
      params: userDetail
    });
  };

  const handleGoBack = () => router.push("/BesoinsA");

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
          <ActivityIndicator size="large" color="#B4BAFF" />
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
          <Text>Aucune donnée utilisateur disponible</Text>
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
        <TouchableOpacity 
          onPress={handleGoBack}
          style={styles.backButton}
        >
          <EvilIcons name="arrow-left" size={45} color="black" />
        </TouchableOpacity>

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
          
          <Text style={styles.associationName}>Association {userDetail?.name}</Text>
          <Text style={styles.location}>{userDetail?.ville}</Text>
          <Text style={styles.phone}>{userDetail?.phone}</Text>
        </View>

        <TouchableOpacity onPress={handleModifPress}>
          <View style={styles.editButton}>
            <Text style={styles.editButtonText}>Modifier Profil</Text>
          </View>
        </TouchableOpacity>
        
        <View style={styles.infoSection}>
          <Text style={styles.infoText}>
            <Text style={styles.label}>E-mail :</Text> {userDetail?.email || 'Non spécifié'}
          </Text>
          <Text style={styles.infoText}>
            <Text style={styles.label}>Responsable :</Text> {userDetail?.nameResp || 'Non spécifié'}
          </Text>
          <Text style={styles.infoText}>
            <Text style={styles.label}>Téléphone Responsable :</Text> {userDetail?.phoneResp || 'Non spécifié'}
          </Text>
          <Text style={styles.infoText}>
            <Text style={styles.label}>Cible :</Text> {userDetail?.target || 'Non spécifié'}
          </Text>
          <Text style={styles.infoText}>
            <Text style={styles.label}>Besoins publiés :</Text> {donationCount}
          </Text>
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
    paddingBottom: 100,
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
  associationName: {
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
  editButtonText: {
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
});

export default ProfileAsso;