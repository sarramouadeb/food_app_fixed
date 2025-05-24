import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
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
} from "react-native";
import { useUserContext } from "../../context/UserContext";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { deleteDoc } from "firebase/firestore";
import {
  collection,
  doc,
  onSnapshot,
  getDoc,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../../config/FirebaseConfig";
import SlideMenuA from "./SlideMenuA";

const { width, height } = Dimensions.get("window");

export default function AnnoncesA() {
  const route = useRoute();
  const navigation = useNavigation();
  const { userDetail, setUserDetail } = useUserContext();
  const [annonces, setAnnonces] = useState([]);
  const [newAnnonceId, setNewAnnonceId] = useState(null);
  const [restaurantsData, setRestaurantsData] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(-width)).current;
  const [hiddenAnnonces, setHiddenAnnonces] = useState([]);
  const [associationData, setAssociationData] = useState(null);

  // Récupérer les données de l'association connectée
  useEffect(() => {
    const fetchAssociationData = async () => {
      try {
        if (userDetail?.uid) {
          const docRef = doc(db, "associations", userDetail.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data();
            setAssociationData(data);
            console.log("Données association:", data);
            
            setUserDetail(prev => ({
              ...prev,
              ...data
            }));
          } else {
            console.log("Aucune donnée trouvée pour cette association");
          }
        }
      } catch (error) {
        console.error("Erreur récupération données association:", error);
      }
    };

    fetchAssociationData();
  }, [userDetail?.uid]);

  useEffect(() => {
    if (route.params?.hideAnnonceId) {
      setHiddenAnnonces(prev => 
        [...new Set([...prev, route.params.hideAnnonceId])]
      );
      navigation.setParams({ hideAnnonceId: undefined });
    }
  }, [route.params]);

  const visibleAnnonces = useMemo(() => {
    return annonces
      .filter(a => !hiddenAnnonces.includes(a.id))
      .reverse();
  }, [annonces, hiddenAnnonces]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleDeleteAnnonce = async (annonceId) => {
    try {
      await deleteDoc(doc(db, "annonces", annonceId));
      console.log("Annonce supprimée avec succès :", annonceId);
      setAnnonces((prevAnnonces) =>
        prevAnnonces.filter((annonce) => annonce.id !== annonceId)
      );
    } catch (error) {
      console.error("Erreur lors de la suppression de l'annonce :", error);
      alert("Une erreur s'est produite lors de la suppression de l'annonce.");
    }
  };

  const handleReserverAnnonce = (annonce) => {
    const restaurantInfo = restaurantsData[annonce.userId] || {};
    navigation.navigate("ReserverAnnonce", { 
      annonce: {
        ...annonce,
        restaurantName: restaurantInfo.name || "Nom inconnu",
        restaurantPhone: restaurantInfo.phone || "Téléphone inconnu",
        restaurantVille: restaurantInfo.ville || "Ville inconnue",
        restaurantImage: restaurantInfo.image || null,
        publicationDate: annonce.createdAt 
          ? new Date(annonce.createdAt.toDate()).toLocaleDateString("fr-FR") 
          : "Date inconnue",
        publicationTime: annonce.createdAt 
          ? new Date(annonce.createdAt.toDate()).toLocaleTimeString("fr-FR", {
              hour: "2-digit",
              minute: "2-digit"
            })
          : "Heure inconnue"
      } 
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const annoncesCollection = collection(db, "annonces");
      const q = query(annoncesCollection, orderBy("createdAt", "asc"));
      
      const snapshot = await getDocs(q);
      const annoncesList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      setAnnonces(annoncesList);
      
      const restaurantsRef = collection(db, "restaurants");
      const newRestaurantsData = {};
      
      const restaurantIds = [...new Set(annoncesList.map(a => a.userId).filter(Boolean))];

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
    } catch (error) {
      console.error("Erreur lors du rafraîchissement :", error);
      alert("Une erreur s'est produite lors du rafraîchissement des données.");
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
    navigation.navigate("NewAnnonce", { annonceToEdit: annonce });
  };

  useEffect(() => {
    const annoncesCollection = collection(db, "annonces");
    const q = query(annoncesCollection, orderBy("createdAt", "asc"));
  
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const annoncesList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
  
      const validAnnonces = await Promise.all(
        annoncesList.map(async (annonce) => {
          if (!annonce.userId) return null;
          
          const restaurantRef = doc(db, "restaurants", annonce.userId);
          const restaurantSnap = await getDoc(restaurantRef);
          return restaurantSnap.exists() ? annonce : null;
        })
      );
  
      const filteredAnnonces = validAnnonces.filter(Boolean);
  
      if (filteredAnnonces.length > annonces.length) {
        const newAnnonce = filteredAnnonces[filteredAnnonces.length - 1];
        setNewAnnonceId(newAnnonce.id);
      }
  
      setAnnonces(filteredAnnonces);
    });
  
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (newAnnonceId) {
      const timeout = setTimeout(() => {
        setNewAnnonceId(null);
      }, 2000);

      return () => clearTimeout(timeout);
    }
  }, [newAnnonceId]);

  const headerInitials = userDetail?.name
    ? userDetail.name
        .split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "NA";

  const colors = ["#7B9DD2", "#DAD4DE", "#BBB4DA", "#7B9DD2", "#70C7C6"];
  const colorIndex = userDetail?.id ? userDetail.id.length % colors.length : 0;

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
      
      <Animated.View style={styles.mainContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={toggleMenu}>
            <MaterialIcons name="menu" size={30} color="black" />
          </TouchableOpacity>

          <View style={styles.titleContainer}>
            <Text style={styles.title}>Annonces</Text>
          </View>

          <TouchableOpacity onPress={() => navigation.navigate("ProfileAsso")}>
            <View style={[styles.avatar, { backgroundColor: colors[colorIndex] }]}>
              <Text style={styles.initials}>{headerInitials}</Text>
            </View>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#70C7C6']}
            />
          }
        >
          <View style={styles.textContainer}>
            <Text style={styles.text}>Filtrer les annonces:</Text>
          </View>
          
          {visibleAnnonces.map((annonce) => {
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
              <View 
                key={annonce.id} 
                style={[
                  styles.annonceCard,
                  isNewAnnonce && styles.newAnnonce
                ]}
              >
                <View style={styles.headerContainer}>
                  <TouchableOpacity 
                    onPress={() => navigation.navigate("RestoPr", { 
                      restaurantId: annonce.userId,
                      fromScreen: "AnnoncesA"
                    })}
                  >
                    <View style={[styles.avatarAnnonce, { backgroundColor: colors[colorIndex] }]}>
                      <Text style={styles.avatarText}>{annonceInitials}</Text>
                    </View>
                  </TouchableOpacity>
                  <Text style={styles.annonceTitle}>{restaurantName}</Text>
                </View>

                <Text style={styles.annonceSubtitle}>
                  {restaurantCity} - {restaurantPhone}
                </Text>

                <Text style={styles.annonceDate}>
                  {annonce.createdAt
                    ? new Date(annonce.createdAt.toDate()).toLocaleDateString("fr-FR", {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })
                    : "Date inconnue"}
                  {' - '}
                  {annonce.createdAt
                    ? new Date(annonce.createdAt.toDate()).toLocaleTimeString("fr-FR", {
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : "Heure inconnue"}
                </Text>
                
                <View style={styles.detailsContainer}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Offre:</Text>
                    <Text style={styles.detailValue}>{annonce.quantite} {annonce.offre}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Type:</Text>
                    <Text style={styles.detailValue}>{annonce.type}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Expire le:</Text>
                    <Text style={styles.detailValue}>
                      {annonce.expirationDate
                        ? new Date(annonce.expirationDate).toLocaleDateString("fr-FR", {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })
                        : "Date inconnue"}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleReserverAnnonce(annonce)}
                >
                  <Text style={styles.actionButtonText}>Réserver</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>
      </Animated.View>
      
      <SlideMenuA
        isOpen={isMenuOpen}
        toggleMenu={toggleMenu}
        userDetail={userDetail}
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
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 99,
  },
  mainContent: {
    flex: 1,
    zIndex: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingTop: 40,
    width: '100%',
    marginBottom: height * 0.02,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'black',
    textAlign: 'center',
    textShadowRadius: 10,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    color: 'black',
    fontSize: 20,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  textContainer: {
    backgroundColor: '#DED8E1',
    paddingVertical: 8,
    paddingHorizontal: 20,
    alignSelf: 'center',
    borderRadius: 20,
    marginVertical: 20,
    borderWidth: 1,
  },
  text: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: 'black',
  },
  annonceCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    width: width * 0.9,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  newAnnonce: {
    borderColor: '#70C7C6',
    borderWidth: 2,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarAnnonce: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems:'center',
    marginRight: 15,
  },
  avatarText: {
    color: 'black',
    fontSize: 24,
    fontWeight: 'bold',
  },
  annonceTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginTop:-25,
  },
  annonceSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
    marginTop:-30,
    marginLeft:70,
  },
  annonceDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    marginLeft:70,
  },
  detailsContainer: {
    marginVertical: 10,
  },
  detailItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#444',
    width: 100,
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  actionButton: {
    backgroundColor: '#70C7C6',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

