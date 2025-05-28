import React, { useContext, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Animated,
  TouchableWithoutFeedback,
  ImageBackground,
  Image,
  StatusBar
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import SlideMenu from "./SlideMenu";
import {
  collection,
  doc,
  onSnapshot,
  getDoc,
  query,
  orderBy,
  getDocs,
  where,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import { db } from "../../config/FirebaseConfig";
import cover from "../../assets/images/cover.png";
import nonurg from "../../assets/images/nonurg.png";
import urgent from "../../assets/images/urgent.png";
import tresurg from "../../assets/images/tresurg.png";
import { useUserContext } from "../../context/UserContext";

const { width, height } = Dimensions.get("window");

export default function Besoins() {
  const router = useRouter();
  const { userDetail, setUserDetail } = useUserContext();
  const [besoins, setBesoins] = useState([]);
  const [filteredBesoins, setFilteredBesoins] = useState([]);
  const [associationsData, setAssociationsData] = useState({});
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

  const filterBesoins = (allBesoins, restaurantId) => {
    return allBesoins.filter(besoin => {
      if (!besoin.respondedRestaurants) return true;
      return !besoin.respondedRestaurants.includes(restaurantId);
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      if (userDetail?.uid) {
        const besoinsCollection = collection(db, "besoins");
        const q = query(besoinsCollection, orderBy("createdAt", "desc"));

        const snapshot = await getDocs(q);
        const besoinsList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setBesoins(besoinsList);
        setFilteredBesoins(filterBesoins(besoinsList, userDetail.uid));

        const newAssociationsData = {};
        const associationIds = [...new Set(besoinsList.map(besoin => besoin.userId))];

        await Promise.all(associationIds.map(async (associationId) => {
          if (associationId) {
            try {
              const docRef = doc(db, "associations", associationId);
              const docSnap = await getDoc(docRef);

              if (docSnap.exists()) {
                newAssociationsData[associationId] = docSnap.data();
              }
            } catch (error) {
              console.error(`Erreur lors du chargement de l'association ${associationId}:`, error);
            }
          }
        }));

        setAssociationsData(newAssociationsData);
      }
    } catch (error) {
      console.error("Erreur lors du rafraîchissement :", error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const besoinsCollection = collection(db, "besoins");
    const q = query(besoinsCollection, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const besoinsList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setBesoins(besoinsList);
      
      if (userDetail?.uid) {
        setFilteredBesoins(filterBesoins(besoinsList, userDetail.uid));
      }

      const newAssociationsData = {};
      const associationIds = [...new Set(besoinsList.map(besoin => besoin.userId))];

      for (const associationId of associationIds) {
        if (associationId) {
          const docRef = doc(db, "associations", associationId);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            newAssociationsData[associationId] = docSnap.data();
          }
        }
      }

      setAssociationsData(newAssociationsData);
    });

    return () => unsubscribe();
  }, [userDetail?.uid]);

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
    <ImageBackground source={cover} style={styles.backgroundImage} resizeMode="cover">
      {isMenuOpen && (
        <TouchableWithoutFeedback onPress={toggleMenu}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>
      )}

      <Animated.View style={styles.mainContent}>
        {/* Header avec marge supérieure ajustée */}
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
            <Text style={styles.title}>Besoins</Text>
          </View>

          <TouchableOpacity onPress={() => router.push("/ProfileResto")}>
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
            <Text style={styles.text}>Liste des besoins:</Text>
          </View>

          <View style={styles.besoinsListContainer}>
            {filteredBesoins.map((besoin) => {
              const associationInfo = associationsData[besoin.userId] || {};
              const associationName = associationInfo.name || "Nom inconnu";
              const associationAddress = associationInfo.ville || "Adresse inconnue";
              const associationPhone = associationInfo.phone || "Téléphone inconnu";

              const associationInitials = associationName
                ? associationName
                    .split(" ")
                    .map((word) => word[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)
                : "NA";

              return (
                <View key={besoin.id} style={styles.besoinCard}>
                  <View style={styles.headerContainer}>
                    <View style={[styles.avatarBesoin, { backgroundColor: colors[colorIndex] }]}>
                      <Text style={{ color: "Black", fontSize: 25 }}>{associationInitials}</Text>
                    </View>
                    <View style={styles.titleWrapper}>
                      <Text style={styles.besoinTitle}>{associationName}</Text>
                      <Text style={styles.besoinSubtitle}>
                        {associationAddress} -{" "}
                        {besoin.createdAt?.toDate().toLocaleDateString("fr-FR") || "Date inconnue"}{" "}
                        -{" "}
                        {besoin.createdAt?.toDate().toLocaleTimeString("fr-FR", {hour: '2-digit', minute:'2-digit'}) || "Heure inconnue"}
                        {"\n"}
                        {associationPhone}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.etatContainer}>
                    {besoin.etat === 'Non urgent' && (
                      <>
                        <Image source={nonurg} style={styles.etatImage} />
                        <Text style={[styles.etatText, { color: '#F8E047' }]}>Non urgent</Text>
                      </>
                    )}
                    {besoin.etat === 'Urgent' && (
                      <>
                        <Image source={urgent} style={styles.etatImage} />
                        <Text style={[styles.etatText, { color: '#F48835' }]}>Urgent</Text>
                      </>
                    )}
                    {besoin.etat === 'Très urgent' && (
                      <>
                        <Image source={tresurg} style={styles.etatImage} />
                        <Text style={[styles.etatText, { color: '#DD0000' }]}>Très urgent</Text>
                      </>
                    )}
                  </View>
                  <View style={styles.besoinContent}>
                    <Text style={styles.besoinText}>
                      <Text style={{ fontWeight: 'bold' }}>Besoin: </Text>
                      <Text style={styles.besoinValue}>{besoin.quantite} {besoin.besoin}</Text>
                    </Text>
                    <Text style={styles.besoinText}>
                      <Text style={{ fontWeight: 'bold' }}>Type: </Text>
                      <Text style={styles.besoinValue}>{besoin.type}</Text>
                    </Text>
                    <Text style={styles.besoinText}>
                      <Text style={{ fontWeight: 'bold' }}>Cible: </Text>
                      <Text style={styles.besoinValue}>{besoin.cible}</Text>
                    </Text>
                    <TouchableOpacity 
                      style={styles.aiderButton}
                      onPress={() => router.push({
                        pathname: "/BesoinForm",
                        params: {
                          besoin: JSON.stringify(besoin),
                          association: JSON.stringify(associationsData[besoin.userId] || {})
                        }
                      })}
                    >
                      <Text style={styles.aiderButtonText}>Aider</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
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
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 99,
  },
  mainContent: {
    flex: 1,
    zIndex: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: height * 0.02,
    paddingHorizontal: 15,
    paddingTop: 0,
  },
  menuIcon: {
    marginRight: width * 0.04,
  },
  titleContainer: {
    alignSelf: 'center',
  },
  title: {
    fontSize: 40,
    fontWeight: "bold",
    color: "black",
    textAlign: "center",
    textShadowOffset: {width: -1, height: 1},
    textShadowRadius: 10
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
  initials: {
    color: "black",
    fontSize: 20,
    fontWeight: "bold",
  },
  contentContainer: {
    paddingBottom: 50,
    alignItems: 'center',
  },
  textContainer: {
    backgroundColor: "#E5E5EA",
    width: width * 0.9,
    height: 35,
    justifyContent: 'center',
    borderRadius: 30,
    marginTop: height * 0.04,
    marginBottom: height * 0.04,
    borderWidth: 1,
    marginRight: 10,
  },
  text: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: 'center',
    color: 'black',
  },
  besoinsListContainer: {
    width: '100%',
    alignItems: 'center',
  },
  besoinCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 15,
    marginBottom: 15,
    borderColor: "black",
    borderWidth: 1,
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
  headerContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  titleWrapper: {
    flex: 1,
    marginLeft: 10,
  },
  besoinTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "black",
  },
  besoinSubtitle: {
    fontSize: 14,
    color: "gray",
    marginTop: 5,
  },
  besoinContent: {
    marginTop: -30,
    marginBottom: 15,
  },
  besoinText: {
    fontSize: 20,
    marginTop: 0,
    marginRight: 12,
    color: 'black',
  },
  avatarBesoin: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderColor: "#FFFFFF",
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  etatContainer: {
    padding: 8,
    borderRadius: 10,
    alignSelf: 'flex-start',
    width: 120,
    marginLeft: width * 0.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  etatImage: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
  etatText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: "center",
    marginTop: 0,
  },
  besoinValue: {
    fontSize: 20,
    flex: 1, 
  },
  aiderButton: {
    backgroundColor: "#E5E5EA",
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 15,
    borderWidth: 1,
    borderColor: 'black',
  },
  aiderButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'black',
  },
});