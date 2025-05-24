import {
  Text,
  View,
  Image,
  Dimensions,
  TextInput,
  Modal,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Animated,
  ActivityIndicator,
} from "react-native";
import styles from "./_inscriLayout";
import cover from '../../assets/images/cover.png';
import Icon from "react-native-vector-icons/Ionicons";
import Iconn from "react-native-vector-icons/AntDesign";
import Fontisto from "react-native-vector-icons/Fontisto";
import { useContext, useEffect, useRef, useState } from "react";
import villesTunisie from "../../assets/villesTunisie.json";
import { router } from "expo-router";
import * as Animatable from "react-native-animatable";
import { useLocalSearchParams } from "expo-router";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  setDoc,
  getDoc,
  doc,
} from "firebase/firestore";
import {auth,db} from"../../config/FirebaseConfig"
import { useUserContext } from "../../context/UserContext";

const { width, height } = Dimensions.get("window");

const SuccessMessage = ({ message, onAnimationEnd }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.delay(2000),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(onAnimationEnd);
  }, [fadeAnim]);

  return (
    <Animated.View
      style={[styles.successMessageContainer, { opacity: fadeAnim }]}
    >
      <Text style={styles.successMessageText}>{message}</Text>
    </Animated.View>
  );
};

export default function InscriRestau() {
  const { role } = useLocalSearchParams(); 
  const scrollViewRef = useRef(null); 
  const [selectedVille, setSelectedVille] = useState("");
  const [villes, setVilles] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(false); 

  // Input fields
  const [name, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [speciality, setSpeciality] = useState("");
  const [pwd, setPwd] = useState("");
  const [registerNb, setRegisterNb] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const { userDetail, setUserDetail } = useUserContext();

  // Error states
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    phone: "",
    speciality: "",
    ville: "",
    pwd: "",
    registerNb: "",
    registerNbDuplicate: false,
    terms: "",
  });

  useEffect(() => {
    setVilles(villesTunisie);
  }, []);

  const handleSelectVille = (ville) => {
    setSelectedVille(ville);
    setIsModalVisible(false);
    setErrors({ ...errors, ville: "" }); 
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      name: "",
      email: "",
      phone: "",
      speciality: "",
      ville: "",
      pwd: "",
      registerNb: "",
      terms: "",
    };

    if (!name) {
      newErrors.name = "Le nom du restaurant est requis*";
      isValid = false;
    }

    const emailRegex = /.+@.+\..+/;
    if (!email) {
      newErrors.email = "L'email du restaurant est requis*";
      isValid = false;
    } else if (!emailRegex.test(email)) {
      newErrors.email = "Email invalide.";
      isValid = false;
    }

    if (!phone) {
      newErrors.phone = "Le numéro de téléphone est requis*";
      isValid = false;
    } else if (phone.length > 12) {
      newErrors.phone = "Numéro trop long*";
      isValid = false;
    } else if (phone.length < 7) {
      newErrors.phone = "Numéro trop court*";
      isValid = false;
    }

    if (!speciality) {
      newErrors.speciality = "La spécialité du restaurant est requise*";
      isValid = false;
    }

    if (!selectedVille) {
      newErrors.ville = "La ville est requise*";
      isValid = false;
    }

    if (!pwd) {
      newErrors.pwd = "Le mot de passe est requis*";
      isValid = false;
    } else if (pwd.length < 6) {
      newErrors.pwd = "Le mot de passe doit contenir au moins 6 caractères*";
      isValid = false;
    }

    if (!registerNb) {
      newErrors.registerNb = "Le numéro d'enregistrement est requis*";
      isValid = false;
    } else if (registerNb.length < 7) {
      newErrors.registerNb = "Le numéro doit contenir au moins 7 chiffres";
      isValid = false;
    }

    if (!isChecked) {
      newErrors.terms = "Veuillez accepter les conditions générales";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const checkIfRegisterNbExists = async (registerNb) => {
    const db = getFirestore();
    const restaurantsRef = collection(db, "restaurants");
    const q = query(restaurantsRef, where("registerNb", "==", registerNb));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  };

const createNewAccount = async () => {
  if (!auth) {
    console.error("Firebase Auth non initialisé !");
    setErrorMessage("Erreur de connexion au serveur.");
    return;
  }

  setIsLoading(true); 
  setErrors(prev => ({ ...prev, registerNbDuplicate: false }));

  if (!validateForm()) {
    setIsLoading(false); 
    return;
  }

  try {
    const registerNbExists = await checkIfRegisterNbExists(registerNb);
    if (registerNbExists) {
      setErrorMessage("Ce numéro d'enregistrement est déjà utilisé.");
      setIsLoading(false);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }

    const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), pwd);
    const user = userCredential.user;

    await saveUser(user);

    setSuccessMessage("Compte créé avec succès !");
    setErrorMessage("");
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });

    setTimeout(() => {
      router.replace({
        pathname: "./Login",
        params: { role, email }
      });
    }, 2000);

  } catch (e) {
    console.error("Erreur Firebase:", e.message);
    setErrorMessage(
      e.code === "auth/email-already-in-use" 
        ? "Cet email est déjà utilisé."
        : "Erreur lors de la création du compte."
    );
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  } finally {
    setIsLoading(false);
  }
};

  const saveUser = async (user) => {
    const userData = {
      uid: user?.uid,
      name,
      email,
      phone,
      speciality,
      ville: selectedVille,
      registerNb,
      role, 
      image: null,
      nbAnnonces: 0,
      createdAt: new Date().toISOString(),
    };
  
    await setDoc(doc(db, "restaurants", user?.uid), userData);
    setUserDetail(userData);
  };

  const clearSuccessMessage = () => {
    setSuccessMessage("");
  };

  return (
    <View style={styles.container}>
      {/* Background Image with Blur */}
      <Image 
        source={cover} 
        style={styles.backgroundImage}
      />
      <View style={styles.overlay} />

      <ScrollView
        style={styles.scrollContainer}
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Error Message */}
        {errorMessage && (
          <Animatable.View 
            animation="fadeInDown" 
            duration={500}
            style={styles.errorMessageContainer}
          >
            <Text style={styles.errorMessageText}>{errorMessage}</Text>
          </Animatable.View>
        )}

        {/* Success Message */}
        {successMessage && (
          <SuccessMessage 
            message={successMessage} 
            onAnimationEnd={clearSuccessMessage}
           
          />
        )}

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.wlc}>Bienvenue,</Text>
          <Text style={styles.inscri}>inscrivez-vous!</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Name Field */}
          <View>
            <View style={[styles.inputContainer, errors.name && styles.inputError]}>
              <Icon name="person-outline" size={24} color="gray" />
              <TextInput
                style={styles.input}
                placeholder="Nom du restaurant*"
                onChangeText={setFullName}
                value={name}
              />
            </View>
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          {/* Email Field */}
          <View>
            <View style={[styles.inputContainer, errors.email && styles.inputError]}>
              <Iconn name="mail" size={24} color="gray" />
              <TextInput
                style={styles.input}
                placeholder="Email du restaurant*"
                onChangeText={setEmail}
                value={email}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          {/* Phone Field */}
          <View>
            <View style={[styles.inputContainer, errors.phone && styles.inputError]}>
              <Iconn name="phone" size={24} color="gray" />
              <TextInput
                style={styles.input}
                placeholder="Téléphone du restaurant*"
                onChangeText={setPhone}
                value={phone}
                keyboardType="phone-pad"
              />
            </View>
            {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
          </View>

          {/* Speciality Field */}
          <View>
            <View style={[styles.inputContainer, errors.speciality && styles.inputError]}>
              <Icon name="restaurant-outline" size={24} color="gray" />
              <TextInput
                style={styles.input}
                placeholder="Spécialité du restaurant*"
                onChangeText={setSpeciality}
                value={speciality}
              />
            </View>
            {errors.speciality && <Text style={styles.errorText}>{errors.speciality}</Text>}
          </View>

          {/* City Field */}
          <View>
            <View style={[styles.inputContainer, errors.ville && styles.inputError]}>
              <Icon name="location-outline" size={24} color="gray" />
              <TouchableOpacity
                style={styles.dropdownContainer}
                onPress={() => setIsModalVisible(true)}
              >
                <Text style={styles.dropdownText}>
                  {selectedVille || "Sélectionnez une ville*"}
                </Text>
                <View style={styles.dropdownIconContainer}>
                  <Icon name="chevron-down" size={20} color="gray" />
                </View>
              </TouchableOpacity>
            </View>
            {errors.ville && <Text style={styles.errorText}>{errors.ville}</Text>}
          </View>

          {/* Password Field */}
          <View>
            <View style={[styles.inputContainer, errors.pwd && styles.inputError]}>
              <Iconn name="lock" size={24} color="gray" />
              <TextInput
                style={styles.input}
                placeholder="Mot de passe*"
                onChangeText={setPwd}
                value={pwd}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Iconn name={showPassword ? "eye" : "eyeo"} size={20} color="gray" />
              </TouchableOpacity>
            </View>
            {errors.pwd && <Text style={styles.errorText}>{errors.pwd}</Text>}
          </View>

          {/* Registration Number */}
          <View>
            <View style={[
              styles.inputContainer, 
              (errors.registerNb || errors.registerNbDuplicate) && styles.inputError
            ]}>
              <Iconn name="idcard" size={24} color="gray" />
              <TextInput
                style={styles.input}
                placeholder="Numéro d'enregistrement*"
                onChangeText={setRegisterNb}
                value={registerNb}
                keyboardType="numeric"
              />
            </View>
            {errors.registerNb && <Text style={styles.errorText}>{errors.registerNb}</Text>}
          </View>

          {/* Terms Checkbox */}
          <View style={styles.checkboxContainer}>
            <TouchableOpacity onPress={() => setIsChecked(!isChecked)}>
              <Fontisto
                name={isChecked ? "checkbox-active" : "checkbox-passive"}
                size={20}
                color={isChecked ? "black" : "gray"}
              />
            </TouchableOpacity>
            <Text style={styles.checkboxText}>
              J'accepte les <Text style={styles.linkText}>conditions générales</Text>
            </Text>
          </View>
          {errors.terms && <Text style={styles.errorText}>{errors.terms}</Text>}

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.signUpButton}
            onPress={createNewAccount}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.signUpButtonText}>S'inscrire</Text>
            )}
          </TouchableOpacity>

          {/* Login Link */}
          <View style={styles.textUnderButton}>
            <Text>Vous avez déjà un compte ? </Text>
            <TouchableOpacity onPress={() => router.push({ pathname: "./Login", params: { role } })}>
              <Text style={styles.linkText}>Se connecter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* City Selection Modal */}
      <Modal
        transparent
        visible={isModalVisible}
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackground}
          activeOpacity={1}
          onPress={() => setIsModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <FlatList
              data={villes}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => handleSelectVille(item)}
                >
                  <Text style={styles.modalText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}