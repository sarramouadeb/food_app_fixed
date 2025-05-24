import React, { useContext, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ImageBackground,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Animated,
  TouchableWithoutFeedback,
  StatusBar
} from "react-native";
import { useUserContext } from "../../context/UserContext";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useNavigation } from "@react-navigation/native";
import { deleteDoc } from "firebase/firestore";
import {
  collection,
  doc,
  onSnapshot,
  getDoc,
  getDocs,
  query,
  orderBy,
  where,
} from "firebase/firestore";
import { db } from "../../config/FirebaseConfig";
import SlideMenu from "./SlideMenu";

const { width, height } = Dimensions.get("window");

const formatFirestoreDate = (date) => {
  if (!date) return "Date inconnue";
  
  try {
    if (date.toDate) {
      const jsDate = date.toDate();
      return jsDate.toLocaleDateString("fr-FR");
    }
    const parsedDate = new Date(date);
    return isNaN(parsedDate.getTime()) ? "Date inconnue" : parsedDate.toLocaleDateString("fr-FR");
  } catch (e) {
    console.error("Error formatting date:", e);
    return "Date inconnue";
  }
};

export default function Annonces() {
  const navigation = useNavigation();
  const { userDetail, setUserDetail } = useUserContext();
  const [annonces, setAnnonces] = useState([]);
  const [newAnnonceId, setNewAnnonceId] = useState(null);
  const [restaurantsData, setRestaurantsData] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [restaurantData, setRestaurantData] = useState(null);
  const slideAnim = useRef(new Animated.Value(-width)).current;
  
  useEffect(() => {
    const fetchRestaurantData = async () => {
      if (userDetail?.uid) {
        try {
          const docRef = doc(db, "restaurants", userDetail.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data();
            setRestaurantData(data);
            setUserDetail(prev => ({
              ...prev,
              ...data,
              phone: data.phone || prev.phone,
              registerNb: data.registerNb || prev.registerNb,
              ville: data.ville || prev.ville,
              name: data.name || prev.name,
              speciality: data.speciality || prev.speciality
            }));
          }
        } catch (error) {
          console.error("Erreur lors du chargement des données du restaurant:", error);
        }
      }
    };

    fetchRestaurantData();
  }, [userDetail?.uid]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleDeleteAnnonce = async (annonceId) => {
    try {
      await deleteDoc(doc(db, "annonces", annonceId));
      setAnnonces((prevAnnonces) =>
        prevAnnonces.filter((annonce) => annonce.id !== annonceId)
      );
    } catch (error) {
      console.error("Erreur lors de la suppression de l'annonce :", error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    
    try {
      if (userDetail?.uid) {
        const annoncesCollection = collection(db, "annonces");
        const q = query(
          annoncesCollection,
          where("userId", "==", userDetail.uid),
          orderBy("createdAt", "asc")
        );
        
        const snapshot = await getDocs(q);
        const annoncesList = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt || null,
            expirationDate: data.expirationDate || null
          };
        });
        
        setAnnonces(annoncesList);
        
        const restaurantsRef = collection(db, "restaurants");
        const newRestaurantsData = {};
        
        const restaurantIds = [...new Set(annoncesList.map(annonce => annonce.userId))];
        
        await Promise.all(restaurantIds.map(async (restaurantId) => {
          if (restaurantId) {
            try {
              const docRef = doc(restaurantsRef, restaurantId);
              const docSnap = await getDoc(docRef);
              
              if (docSnap.exists()) {
                newRestaurantsData[restaurantId] = docSnap.data();
              }
            } catch (error) {
              console.error(`Erreur lors du chargement du restaurant ${restaurantId}:`, error);
            }
          }
        }));
        
        setRestaurantsData(newRestaurantsData);
      }
    } catch (error) {
      console.error("Erreur lors du rafraîchissement :", error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (annonces.length > 0) {
      const fetchRestaurantsData = async () => {
        const restaurantsRef = collection(db, "restaurants");
        const newRestaurantsData = {};

        const restaurantIds = [...new Set(annonces.map(annonce => annonce.userId))];

        for (const restaurantId of restaurantIds) {
          if (restaurantId) {
            const docRef = doc(restaurantsRef, restaurantId);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
              newRestaurantsData[restaurantId] = docSnap.data();
            }
          }
        }

        setRestaurantsData(newRestaurantsData);
      };

      fetchRestaurantsData();
    }
  }, [annonces]);

  const handleModifyAnnonce = (annonce) => {
    navigation.navigate("NewAnnonce", { 
      annonceToEdit: {
        ...annonce,
        createdAt: annonce.createdAt?.toDate ? annonce.createdAt.toDate() : 
                 (annonce.createdAt ? new Date(annonce.createdAt) : null),
        expirationDate: annonce.expirationDate ? 
                      (annonce.expirationDate.toDate ? annonce.expirationDate.toDate() : 
                       new Date(annonce.expirationDate)) : null
      }
    });
  };

  useEffect(() => {
    if (userDetail?.uid) {
      const annoncesCollection = collection(db, "annonces");

      const q = query(
        annoncesCollection,
        where("userId", "==", userDetail.uid),
        orderBy("createdAt", "asc")
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const annoncesList = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt || null,
            expirationDate: data.expirationDate || null
          };
        });
        setAnnonces(annoncesList);

        if (annoncesList.length > annonces.length) {
          const newAnnonce = annoncesList[annoncesList.length - 1];
          setNewAnnonceId(newAnnonce.id);
        }
      });

      return () => unsubscribe();
    }
  }, [userDetail?.uid, annonces.length]);

  useEffect(() => {
    if (newAnnonceId) {
      const timeout = setTimeout(() => {
        setNewAnnonceId(null);
      }, 2000);

      return () => clearTimeout(timeout);
    }
  }, [newAnnonceId]);

  const currentUserData = restaurantData || userDetail;

  const headerInitials = currentUserData?.name
    ? currentUserData.name
        .split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "NA";

  const colors = ["#7B9DD2", "#DAD4DE", "#BBB4DA", "#7B9DD2", "#70C7C6"];
  const colorIndex = currentUserData?.uid ? currentUserData.uid.length % colors.length : 0;

  return (
    <ImageBackground 
      source={require('../../assets/images/cover.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      {isMenuOpen && (
        <TouchableWithoutFeedback onPress={toggleMenu}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>
      )}
      
      <Animated.View
        style={[
          styles.mainContent,
          {
            transform: [
              {
                translateX: slideAnim.interpolate({
                  inputRange: [-width, 0],
                  outputRange: [0, width * 0.7],
                }),
              },
            ],
          },
        ]}
      >
        <View style={[styles.header, { marginTop: StatusBar.currentHeight || 35 }]}>
          <TouchableOpacity onPress={toggleMenu}>
            <MaterialIcons
              name="menu"
              size={35}
              color="black"
              style={styles.menuIcon}
            />
          </TouchableOpacity>

          <View style={styles.titleContainer}>
            <Text style={styles.title}>Annonces</Text>
          </View>

          <TouchableOpacity onPress={() => navigation.navigate("ProfileResto")}>
            <View style={[styles.avatar, { backgroundColor: colors[colorIndex] }]}>
              <Text style={styles.initials}>{headerInitials}</Text>
            </View>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.contentContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="white"
            />
          }
        >
          <View style={styles.textContainer}>
            <Text style={styles.text}>Filtrer vos annonces:</Text>
          </View>

          {annonces
            .slice()
            .reverse()
            .map((annonce) => {
              const isNewAnnonce = annonce.id === newAnnonceId;
              const restaurantInfo = restaurantsData[annonce.userId] || {};
              const restaurantName = restaurantInfo.name || "Nom inconnu";
              const restaurantCity = restaurantInfo.ville || "Ville inconnue";
              const restaurantPhone = restaurantInfo.phone || "Téléphone inconnu";

              const annonceInitials = restaurantName
                ? restaurantName
                    .split(" ")
                    .map((word) => word[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)
                : "NA";

              return (
                <View key={annonce.id} style={styles.annonceCard}>
                  <View style={styles.headerContainer}>
                    <TouchableOpacity onPress={() => navigation.navigate("ProfileResto")}>
                      <View style={[styles.avatarAnnonce, { backgroundColor: colors[colorIndex] }]}>
                        <Text style={{ color: "Black", fontSize: 25 }}>{annonceInitials}</Text>
                      </View>
                    </TouchableOpacity>
                    <Text style={styles.annonceTitle}>{restaurantName}</Text>
                  </View>

                  <Text style={styles.annonceSubtitle}>
                    {restaurantCity} - {formatFirestoreDate(annonce.createdAt)}
                    {"\n"}
                    {restaurantPhone}
                  </Text>
                  
                  <View style={styles.annonceText}>
                    <Text style={styles.annonceOffer}>
                      Offre : {annonce.quantite} {annonce.offre}
                    </Text>
                    <Text style={styles.annonceType}>
                      Type offre : {annonce.type}
                    </Text>
                    <Text style={styles.annonceExpiration}>
                      Date Expiration: {formatFirestoreDate(annonce.expirationDate)}
                    </Text>
                  </View>

                  <View style={styles.annonceActions}>
                    <TouchableOpacity
                      style={styles.actionButtonSupprimer}
                      onPress={() => handleDeleteAnnonce(annonce.id)}
                    >
                      <Text style={styles.actionButtonTextSupprimer}>
                        Supprimer
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButtonModifier}
                      onPress={() => handleModifyAnnonce(annonce)}
                    >
                      <Text style={styles.actionButtonTextModifier}>
                        Modifier
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
        </ScrollView>
      </Animated.View>
      
      <SlideMenu
        isOpen={isMenuOpen}
        toggleMenu={toggleMenu}
        userDetail={currentUserData}
      />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingTop: 0,
    width: "100%",
    marginBottom: height * 0.02,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 30,
    borderColor: "#FFFFFF",
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarAnnonce: {
    width: 80,
    height: 80,
    borderRadius: 50,
    borderColor: "#FFFFFF",
    borderWidth: 2,
    marginLeft: width * 0.01,
    justifyContent: "center",
    alignItems: "center",
  },
  initials: {
    color: "Black",
    fontSize: 20,
    fontWeight: "bold",
  },
  title: {
    fontSize: 35,
    fontWeight: "bold",
    color: "black",
    textAlign: "center",
    textShadowRadius: 10
  },
  menuIcon: {
    marginRight: 20,
    color:"black",
  },
  contentContainer: {
    paddingBottom: 50,
    alignItems: 'center',
  },
  textContainer: {
    backgroundColor: "#EAE5E5",
    width: 300,
    height: 35,
    borderRadius: 30,
    marginTop: height * 0.04,
    marginBottom: height * 0.04,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  text: {
    fontSize: 22,
    fontWeight: "bold",
    color: 'black',
  },
  annonceCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 15,
    marginBottom: 10,
    borderColor: "black",
    borderWidth: 2,
    width: width * 0.9,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  annonceTitle: {
    fontSize: 25,
    fontWeight: "bold",
    color: "black",
    flexShrink: 1,
    marginLeft: 10,
    marginTop: -30,
  },
  annonceSubtitle: {
    fontSize: 15,
    color: "gray",
    marginTop: -35,
    marginLeft: width * 0.25,
  },
  annonceOffer: {
    fontSize: 18,
    marginTop: 10,
    color: 'black',
  },
  annonceType: {
    fontSize: 18,
    marginTop: 5,
    color: 'black',
  },
  annonceExpiration: {
    fontSize: 18,
    marginTop: 5,
    color: 'black',
  },
  annonceActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  actionButtonSupprimer: {
    backgroundColor: "#EAE5E5",
    padding: 10,
    flex: 1,
    marginLeft: 0,
    borderColor: "black",
    borderWidth: 1,
    alignItems: "center",
  },
  actionButtonTextSupprimer: {
    color: "black",
    fontSize: 18,
    fontWeight: "bold",
  },
  actionButtonModifier: {
    backgroundColor: "#EAE5E5",
    padding: 10,
    borderColor: "black",
    borderWidth: 1,
    flex: 1,
    marginLeft: 5,
    alignItems: "center",
  },
  actionButtonTextModifier: {
    color: "black",
    fontSize: 18,
    fontWeight: "bold",
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  annonceText: {
    marginTop: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.3)",
    zIndex: 99,
  },
  mainContent: {
    flex: 1,
    zIndex: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
});