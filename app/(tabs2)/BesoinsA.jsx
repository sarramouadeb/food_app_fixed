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
  Image,
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
import SlideMenuA from "./SlideMenuA";
import cover from "../../assets/images/cover.png";
import nonurg from "../../assets/images/nonurg.png";
import urgent from "../../assets/images/urgent.png";
import tresurg from "../../assets/images/tresurg.png";

const { width, height } = Dimensions.get("window");

export default function BesoinsA() {
  const navigation = useNavigation();
  const { userDetail, setUserDetail } = useUserContext();
  const [besoins, setBesoins] = useState([]);
  const [newBesoinId, setNewBesoinId] = useState(null);
  const [associationsData, setAssociationsData] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(-width)).current;
  
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleDeleteBesoin = async (besoinId) => {
    try {
      await deleteDoc(doc(db, "besoins", besoinId));
      setBesoins((prevBesoins) => prevBesoins.filter((besoin) => besoin.id !== besoinId));
    } catch (error) {
      console.error("Erreur lors de la suppression du besoin :", error);
      alert("Une erreur s'est produite lors de la suppression du besoin.");
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      if (userDetail?.uid) {
        const besoinsCollection = collection(db, "besoins");
        const q = query(
          besoinsCollection,
          where("userId", "==", userDetail.uid),
          orderBy("createdAt", "desc")
        );
        
        const snapshot = await getDocs(q);
        const besoinsList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        
        setBesoins(besoinsList);
        
        const associationsRef = collection(db, "associations");
        const newAssociationsData = {};
        const associationIds = [...new Set(besoinsList.map(besoin => besoin.userId))];
        
        await Promise.all(associationIds.map(async (associationId) => {
          if (associationId) {
            try {
              const docRef = doc(associationsRef, associationId);
              const docSnap = await getDoc(docRef);
              if (docSnap.exists()) {
                newAssociationsData[associationId] = docSnap.data();
              }
            } catch (error) {
              console.error(`Erreur lors du chargement du association ${associationId}:`, error);
            }
          }
        }));
        
        setAssociationsData(newAssociationsData);
      }
    } catch (error) {
      console.error("Erreur lors du rafraîchissement :", error);
      alert("Une erreur s'est produite lors du rafraîchissement des données.");
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (besoins.length > 0) {
      const fetchAssociationsData = async () => {
        const associationsRef = collection(db, "associations");
        const newAssociationsData = {};
        const associationIds = [...new Set(besoins.map(besoin => besoin.userId))];

        for (const associationId of associationIds) {
          if (associationId) {
            const docRef = doc(associationsRef, associationId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              newAssociationsData[associationId] = docSnap.data();
            }
          }
        }

        setAssociationsData(newAssociationsData);
      };

      fetchAssociationsData();
    }
  }, [besoins]);

  const handleModifyBesoin = (besoin) => {
    navigation.navigate("NewBesoin", { besoinToEdit: besoin });
  };

  useEffect(() => {
    if (userDetail?.uid) {
      const besoinsCollection = collection(db, "besoins");
      const q = query(
        besoinsCollection,
        where("userId", "==", userDetail.uid),
        orderBy("createdAt", "desc")
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const besoinsList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        
        if (besoinsList.length > besoins.length) {
          const newBesoin = besoinsList[0];
          setNewBesoinId(newBesoin.id);
        }

        setBesoins(besoinsList);
      });

      return () => unsubscribe();
    }
  }, [userDetail?.uid, besoins.length]);

  useEffect(() => {
    if (newBesoinId) {
      const timeout = setTimeout(() => {
        setNewBesoinId(null);
      }, 2000);

      return () => clearTimeout(timeout);
    }
  }, [newBesoinId]);

  const headerInitials = userDetail?.name
    ? userDetail.name
        .split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "NA";

  const colors = ["#e2eaff", "#DAD4DE", "#BBB4DA", "#7B9DD2", "#70C7C6"];
  const colorIndex = userDetail?.id ? userDetail.id.length % colors.length : 0;

  return (
    <ImageBackground 
      source={cover}
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
            <Text style={styles.title}>Besoins</Text>
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
            <Text style={styles.text}>Vos besoins:</Text>
          </View>

          <View style={styles.besoinsListContainer}>
            {besoins.map((besoin) => {
              const isNewBesoin = besoin.id === newBesoinId;
              const associationInfo = associationsData[besoin.userId] || {};
              const associationName = associationInfo.name || "Nom inconnu";
              const associationCity = associationInfo.ville || "Ville inconnue";
              const associationPhone = associationInfo.phone || "Téléphone inconnu";
              
              const besoinInitials = associationName
                ? associationName
                    .split(" ")
                    .map((word) => word[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)
                : "NA";

              return (
                <View 
                  key={besoin.id} 
                  style={[
                    styles.besoinCard,
                    isNewBesoin && styles.newBesoin
                  ]}
                >
                  <View style={styles.headerContainer}>
                    <View style={[styles.avatarBesoin, { backgroundColor: colors[colorIndex] }]}>
                      <Text style={styles.avatarText}>{besoinInitials}</Text>
                    </View>
                    <View style={styles.titleWrapper}>
                      <Text style={styles.besoinTitle}>Association {associationName}</Text>
                      <Text style={styles.besoinSubtitle}>
                        {associationCity} | {associationPhone}
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

                  <View style={styles.besoinDetails}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Besoin:</Text>
                      <Text style={styles.detailValue}>{besoin.quantite} {besoin.besoin}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Type:</Text>
                      <Text style={styles.detailValue}>{besoin.type}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Cible:</Text>
                      <Text style={styles.detailValue}>{besoin.cible}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Date:</Text>
                      <Text style={styles.detailValue}>
                        {besoin.createdAt
                          ? new Date(besoin.createdAt.toDate()).toLocaleDateString("fr-FR", {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })
                          : "Date inconnue"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.besoinActions}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.updateButton]}
                      onPress={() => handleModifyBesoin(besoin)}
                    >
                      <Text style={styles.actionButtonText}>Mettre à jour</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={() => handleDeleteBesoin(besoin.id)}
                    >
                      <Text style={styles.actionButtonText}>Supprimer</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
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
    paddingTop: 40, // Header descendu
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
  besoinsListContainer: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: 20,
  },
  besoinCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    width: width * 0.9,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  newBesoin: {
    borderColor: '#70C7C6',
    borderWidth: 2,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarBesoin: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    color: 'black',
    fontSize: 24,
    fontWeight: 'bold',
  },
  titleWrapper: {
    flex: 1,
  },
  besoinTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  besoinSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  etatContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 10,
    alignSelf: 'flex-end',
    marginTop: 0,
  },
  etatImage: {
    width: 30,
    height: 30,
    marginRight: 5,
  },
  etatText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  besoinDetails: {
    marginTop: 0,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#444',
    width: 80,
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  besoinActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  actionButton: {
    padding: 12,
    borderRadius: 10,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
  },
  updateButton: {
    backgroundColor: '#B8D576',
    borderWidth: 1,
    borderColor: 'black',
  },
  deleteButton: {
    backgroundColor: '#FFE2E2',
    borderWidth: 1,
    borderColor: 'black',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'black',
  },
});

