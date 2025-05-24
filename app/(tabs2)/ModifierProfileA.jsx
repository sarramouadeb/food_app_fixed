import React, { useEffect, useRef, useState } from "react";
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
import EvilIcons from "react-native-vector-icons/EvilIcons";

const { width, height } = Dimensions.get("window");

const ModifierProfileA = () => {
  const { userDetail, setUserDetail } = useUserContext();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    nameResp: "",
    phoneResp: "",
    registerNb: "",
    target: "",
    ville: "",
  });
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const scrollViewRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (userDetail) {
      setFormData({
        name: userDetail.name || "",
        email: userDetail.email || "",
        phone: userDetail.phone || "",
        nameResp: userDetail.nameResp || "",
        phoneResp: userDetail.phoneResp || "",
        registerNb: userDetail.registerNb || "",
        target: userDetail.target || "",
        ville: userDetail.ville || "",
      });
    }
  }, [userDetail]);

  const showNotification = (type, title, message) => {
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
    }).start();
  };

  const handleChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
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

    if (formData.phoneResp && (formData.phoneResp.length < 8 || formData.phoneResp.length > 12)) {
      showNotification("error", "Téléphone responsable invalide", "Veuillez entrer un N° de téléphone valide");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm() || isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      const updates = {};
      
      if (formData.name !== userDetail.name) updates.name = formData.name;
      if (formData.email !== userDetail.email) updates.email = formData.email;
      if (formData.phone !== userDetail.phone) updates.phone = formData.phone;
      if (formData.nameResp !== userDetail.nameResp) updates.nameResp = formData.nameResp;
      if (formData.phoneResp !== userDetail.phoneResp) updates.phoneResp = formData.phoneResp;
      if (formData.registerNb !== userDetail.registerNb) updates.registerNb = formData.registerNb;
      if (formData.target !== userDetail.target) updates.target = formData.target;
      if (formData.ville !== userDetail.ville) updates.ville = formData.ville;

      if (Object.keys(updates).length > 0) {
        const userRef = doc(db, "associations", userDetail.uid);
        await updateDoc(userRef, updates);
        setUserDetail(prev => ({ ...prev, ...updates }));
        
        showNotification("success", "Succès", "Profil mis à jour avec succès");
        
        setTimeout(() => {
          router.push('ProfileAsso');
        }, 1500);
      } else {
        showNotification("info", "Information", "Aucune modification détectée");
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("Erreur:", error);
      showNotification("error", "Erreur", "Une erreur est survenue lors de la mise à jour");
      setIsSubmitting(false);
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

  const handleGoBack = () => router.push("/ProfileAsso");

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
        <TouchableOpacity 
          onPress={handleGoBack}
          style={styles.backButton}
        >
          <EvilIcons name="arrow-left" size={45} color="black" />
        </TouchableOpacity>

        <View style={styles.header}>
          {userDetail?.image ? (
            <Image
              source={{ uri: userDetail.image }}
              style={styles.avatar}
              onError={(e) => console.log("Erreur image:", e.nativeEvent.error)}
            />
          ) : (
            <View style={[styles.avatar, { backgroundColor: colors[colorIndex] }]}>
              <Text style={styles.initials}>{initials}</Text>
            </View>
          )}
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>Modifier les informations</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nom de l'association</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) => handleChange("name", text)}
              placeholder="Nom de l'association"
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
              placeholder="Email"
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
              placeholder="Téléphone"
              placeholderTextColor="#888"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nom du responsable</Text>
            <TextInput
              style={styles.input}
              value={formData.nameResp}
              onChangeText={(text) => handleChange("nameResp", text)}
              placeholder="Nom du responsable"
              placeholderTextColor="#888"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Téléphone du responsable</Text>
            <TextInput
              style={styles.input}
              value={formData.phoneResp}
              onChangeText={(text) => handleChange("phoneResp", text)}
              keyboardType="phone-pad"
              placeholder="Téléphone du responsable"
              placeholderTextColor="#888"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Numéro d'enregistrement</Text>
            <TextInput
              style={styles.input}
              value={formData.registerNb}
              onChangeText={(text) => handleChange("registerNb", text)}
              placeholder="Numéro d'enregistrement"
              placeholderTextColor="#888"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Cible</Text>
            <TextInput
              style={styles.input}
              value={formData.target}
              onChangeText={(text) => handleChange("target", text)}
              placeholder="Cible"
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
                {formData.ville || "Sélectionnez une ville"}
              </Text>
              <Ionicons 
                name="chevron-down" 
                size={20} 
                color="black" 
                style={styles.chevronIcon} 
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={[styles.confirmButton, isSubmitting && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Text style={styles.confirmButtonText}>
              {isSubmitting ? "En cours..." : "Confirmer les modifications"}
            </Text>
          </TouchableOpacity>
        </View>

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
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'black',
  },
  disabledButton: {
    opacity: 0.6,
  },
  confirmButtonText: {
    color: "black",
    fontWeight: "bold",
    fontSize: 18,
  },
});

export default ModifierProfileA;