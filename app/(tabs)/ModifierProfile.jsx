import React, { useContext, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  Modal,
  FlatList,
  Animated,
  Easing,
  ImageBackground,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useUserContext } from "../../context/UserContext";
import Ionicons from "react-native-vector-icons/Ionicons";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../config/FirebaseConfig";
import villesTunisie from "../../assets/villesTunisie.json";
import { useNavigationState } from '@react-navigation/native';
import EvilIcons from "react-native-vector-icons/EvilIcons";

const { width, height } = Dimensions.get("window");

const ModifierProfile = () => {
  const { userDetail, setUserDetail } = useUserContext();
  const [formData, setFormData] = useState({
    name: userDetail?.name || "",
    email: userDetail?.email || "",
    phone: userDetail?.phone || "",
    speciality: userDetail?.speciality || "",
    ville: userDetail?.ville || "",
  });
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const scrollViewRef = useRef(null);
  const [notification, setNotification] = useState({
    visible: false,
    type: "", // 'success' or 'error'
    title: "",
    message: "",
  });
  const fadeAnim = useState(new Animated.Value(0))[0];
  const navigationState = useNavigationState(state => state);

  useFocusEffect(
    React.useCallback(() => {
      return () => {
        if (notification.visible) {
          hideNotification();
        }
      };
    }, [notification.visible])
  );

  const showNotification = (type, title, message) => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    
    setNotification({
      visible: true,
      type,
      title,
      message,
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
        type: "",
        title: "",
        message: "",
      });
    });
  };

  const handleChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const validateForm = () => {
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(formData.email)) {
      showNotification("error", "Email invalide", "Veuillez entrer une adresse email valide");
      return false;
    }

    if (formData.phone && (formData.phone.length < 8 || formData.phone.length > 12)) {
      showNotification("error", "Téléphone invalide", "Veuillez entrer un N° de téléphone valide");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
  
    try {
      const updates = {};
  
      if (formData.name !== userDetail.name) updates.name = formData.name;
      if (formData.email !== userDetail.email && formData.email) updates.email = formData.email;
      if (formData.phone !== userDetail.phone && formData.phone) updates.phone = formData.phone;
      if (formData.speciality !== userDetail.speciality) updates.speciality = formData.speciality;
      if (formData.ville !== userDetail.ville) updates.ville = formData.ville;
  
      if (Object.keys(updates).length > 0) {
        const userRef = doc(db, "restaurants", userDetail.uid);
        await updateDoc(userRef, updates);
        setUserDetail({ ...userDetail, ...updates });
      }
      
      showNotification("success", "Succès", "Profil mis à jour avec succès");
      
      setTimeout(() => {
        hideNotification();
        setTimeout(() => {
          router.push('ProfileResto');
        }, 300);
      }, 1500);
      
    } catch (error) {
      console.error("Erreur:", error);
      showNotification("error", "Erreur", "Une erreur est survenue");
    }
  };

  const filteredVilles = villesTunisie.filter(ville =>
    ville.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderVilleItem = ({ item }) => (
    <TouchableOpacity
      style={styles.villeItem}
      onPress={() => {
        handleChange("ville", item);
        setIsModalVisible(false);
        setSearchQuery("");
      }}
    >
      <Text style={styles.villeText}>{item}</Text>
    </TouchableOpacity>
  );

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

  useEffect(() => {
    if (notification.visible) {
      hideNotification();
    }
  }, [navigationState]);

  const handleGoBack = () => router.push("/ProfileResto");

  return (
    <ImageBackground 
      source={require('../../assets/images/cover.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <ScrollView 
        style={styles.container}
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContainer}
      >
        {/* Back Button */}
        <TouchableOpacity 
          onPress={handleGoBack}
          style={styles.backButton}
        >
          <EvilIcons name="arrow-left" size={45} color="black" />
        </TouchableOpacity>

        {/* Header Section */}
        <View style={styles.header}>
          <View style={[styles.avatar, { backgroundColor: colors[colorIndex] }]}>
            <Text style={styles.initials}>{initials}</Text>
          </View>
        </View>

        {/* Form Section */}
        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>Modifier les informations</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nom du restaurant</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) => handleChange("name", text)}
              placeholder={` ${userDetail?.name || ""}`}
              placeholderTextColor="#888"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(text) => handleChange("email", text)}
              keyboardType="email-address"
              placeholder={` ${userDetail?.email || ""}`}
              placeholderTextColor="#888"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Téléphone</Text>
            <TextInput
              style={styles.input}
              value={formData.phone}
              onChangeText={(text) => handleChange("phone", text)}
              keyboardType="phone-pad"
              placeholder={` ${userDetail?.phone || ""}`}
              placeholderTextColor="#888"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Spécialité</Text>
            <TextInput
              style={styles.input}
              value={formData.speciality}
              onChangeText={(text) => handleChange("speciality", text)}
              placeholder={` ${userDetail?.speciality || ""}`}
              placeholderTextColor="#888"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ville</Text>
            <TouchableOpacity
              style={styles.villeInputContainer}
              onPress={() => setIsModalVisible(true)}
            >
              <Ionicons 
                name="location-outline" 
                size={24} 
                color="black" 
                style={styles.locationIcon} 
              />
              <Text style={[styles.villeTextDisplay, !formData.ville && styles.placeholderText]}>
                {formData.ville || userDetail?.ville || "Sélectionnez une ville"}
              </Text>
              <Ionicons 
                name="chevron-down" 
                size={20} 
                color="black" 
                style={styles.chevronIcon} 
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.confirmButton} onPress={handleSubmit}>
            <Text style={styles.confirmButtonText}>Confirmer les modifications</Text>
          </TouchableOpacity>
        </View>

        {/* City Selection Modal */}
        <Modal
          visible={isModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <TextInput
                style={styles.searchInput}
                placeholder="Rechercher une ville..."
                placeholderTextColor="#888"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus={true}
              />
              <FlatList
                data={filteredVilles}
                renderItem={renderVilleItem}
                keyExtractor={(item) => item}
                keyboardShouldPersistTaps="handled"
              />
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  setIsModalVisible(false);
                  setSearchQuery("");
                }}
              >
                <Text style={styles.closeButtonText}>Fermer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Notification */}
        {notification.visible && (
          <Animated.View 
            style={[
              styles.notificationContainer,
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
              <Text style={styles.notificationTitle}>{notification.title}</Text>
              <Text style={styles.notificationMessage}>{notification.message}</Text>
            </View>
            <TouchableOpacity onPress={hideNotification}>
              <Ionicons name="close" size={20} color="black" />
            </TouchableOpacity>
          </Animated.View>
        )}
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
    paddingBottom: 40,
  },
  backButton: {
    position: 'absolute',
    top: height * 0.05,
    left: width * 0.05,
    zIndex: 1,
  },
  header: {
    alignItems: "center",
    marginTop: height * 0.12,
    marginBottom: height * 0.02,
  },
  avatar: {
    width: 150,
    height: 150,
    borderRadius: 100,
    borderColor: "white",
    borderWidth: 3,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  initials: {
    color: "black",
    fontSize: 60,
    fontWeight: "bold",
  },
  formContainer: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'black',
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "black",
    marginBottom: 25,
    textAlign: "center",
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "black",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#EAE5E5",
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "black",
    fontSize: 16,
    color: 'black',
  },
  villeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: "#EAE5E5",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "black",
    padding: 15,
  },
  villeTextDisplay: {
    flex: 1,
    fontSize: 16,
    color: 'black',
  },
  placeholderText: {
    color: "#888",
  },
  locationIcon: {
    marginRight: 10,
  },
  chevronIcon: {
    marginLeft: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 10,
    maxHeight: height * 0.7,
    borderWidth: 1,
    borderColor: 'black',
  },
  searchInput: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    fontSize: 16,
    color: 'black',
  },
  villeItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  villeText: {
    fontSize: 16,
    color: 'black',
  },
  closeButton: {
    padding: 15,
    backgroundColor: "#EAE5E5",
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'black',
  },
  closeButtonText: {
    color: 'black',
    fontWeight: 'bold',
    fontSize: 16,
  },
  confirmButton: {
    backgroundColor: "#EAE5E5",
    padding: 15,
    
    alignItems: "center",
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'black',
  },
  confirmButtonText: {
    color: "black",
    fontWeight: "bold",
    fontSize: 18,
  },
  notificationContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
    borderWidth: 1,
    borderColor: 'black',
  },
  successNotification: {
    backgroundColor: "#CBEFB6",
  },
  errorNotification: {
    backgroundColor: "#FFCACA",
  },
  notificationIcon: {
    marginRight: 10,
  },
  notificationTextContainer: {
    flex: 1,
  },
  notificationTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: 'black',
    marginBottom: 2,
  },
  notificationMessage: {
    fontSize: 14,
    color: 'black',
  },
});

export default ModifierProfile;