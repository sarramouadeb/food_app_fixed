import { Dimensions, Image, ScrollView, View, Text, TextInput, TouchableOpacity } from "react-native";
import loginStyles from "./_loginLayout";
import { useContext, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router"; // Ajout de useRouter
import loginn from '../../assets/images/loginn.png'
import Iconn from "react-native-vector-icons/AntDesign";
import Fontisto from "react-native-vector-icons/Fontisto";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore"; // Import ajouté
import { ActivityIndicator } from "react-native";
import { useUserContext } from "../../context/UserContext"; // Import modifié

const { width, height } = Dimensions.get("window");

export default function Login() {
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const { role } = useLocalSearchParams();
  const router = useRouter(); // Initialisation du router
  const { setUserDetail } = useUserContext(); // Utilisation correcte du contexte

  console.log("Role in SignIn:", role);

const handleLogin = async () => {
  if (!email || !pwd) {
    setErrorMessage("Veuillez remplir tous les champs.");
    return;
  }

  // Validation manuelle de l'email avant l'appel Firebase
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    setErrorMessage("Veuillez entrer une adresse email valide.");
    return;
  }

  setErrorMessage("");
  setIsLoading(true);

  try {
    const auth = getAuth();
    const userCredential = await signInWithEmailAndPassword(auth, email.trim(), pwd);
    const user = userCredential.user;

    // Récupération des données utilisateur
    const db = getFirestore();
    const collectionName = role === "restaurant" ? "restaurants" : "associations";
    const userDoc = await getDoc(doc(db, collectionName, user.uid));

    if (!userDoc.exists()) {
      throw new Error("Utilisateur non trouvé");
    }

    const userData = userDoc.data();
    
    if (userData.role !== role) {
      throw new Error(`Mauvais rôle: ${userData.role}`);
    }

    if (setUserDetail) {
      setUserDetail({
        ...userData,
        uid: user.uid
      });
    }

    const redirectPath = role === "restaurant" 
      ? "/(tabs)/Besoins" 
      : "/(tabs2)/AnnoncesA";
    
    router.replace(redirectPath);

  } catch (error) {
    console.error("Erreur Firebase:", error); // Seulement dans la console
    
    // Messages d'erreur personnalisés
    let userFriendlyMessage = "Email ou mot de passe incorrect";
    
    if (error.code === "auth/invalid-credential") {
      userFriendlyMessage = "Identifiants incorrects";
    } else if (error.code === "auth/user-not-found") {
      userFriendlyMessage = "Aucun compte trouvé avec cet email";
    } else if (error.code === "auth/wrong-password") {
      userFriendlyMessage = "Mot de passe incorrect";
    } else if (error.code === "auth/too-many-requests") {
      userFriendlyMessage = "Trop de tentatives. Réessayez plus tard";
    }
    
    setErrorMessage(userFriendlyMessage);
  } finally {
    setIsLoading(false);
  }
};


  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={loginStyles.container}>
        <Image
          source={loginn} 
          style={loginStyles.backgroundImage} 
          resizeMode="cover"
        />
        
        <View style={loginStyles.overlay} >
      <View style={loginStyles.text}>
          <Text style={loginStyles.wlc}>Bon retour,</Text>
          <Text style={loginStyles.inscri}>Connectez-vous !</Text>
        </View>


   {errorMessage && (
          <View style={loginStyles.errorMessageContainer}>
            <Text style={loginStyles.errorMessageText}>{errorMessage}</Text>
          </View>
        )}

        <View style={loginStyles.form}>
        
          <View>
            <View style={loginStyles.inputContainerMail}>
              <Iconn name="mail" size={30} color="gray" />
              <TextInput
                style={loginStyles.input}
                placeholder="Entrez votre Email*"
                onChangeText={(value) => {
                  setEmail(value);
                  setErrorMessage("");
                }}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View>
            <View style={loginStyles.inputContainerMail}>
              <Iconn name="lock" size={30} color="gray" />
              <TextInput
                style={loginStyles.input}
                placeholder="Mot de passe*"
                onChangeText={(value) => {
                  setPwd(value);
                  setErrorMessage("");
                }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Iconn
                  name={showPassword ? "eye" : "eyeo"}
                  size={25}
                  color="gray"
                  style={loginStyles.eyeIcon}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={loginStyles.checkboxContainerLogin}>
            <Fontisto
              name={isChecked ? "checkbox-active" : "checkbox-passive"}
              size={20}
              color={isChecked ? "black" : "gray"}
              onPress={() => setIsChecked(!isChecked)}
            />
            <Text style={loginStyles.Rappeler}>Se rappeler de moi</Text>
            <Text style={loginStyles.mdp}>Mot de passe oublié ?</Text>
          </View>
        </View>

         <TouchableOpacity
          style={loginStyles.signInButton}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={loginStyles.signUpButtonText}>Se connecter</Text>
          )}
        </TouchableOpacity>


  <View style={loginStyles.textUnderButton}>
          <Text style={loginStyles.textUnderButtonText}>
            Vous n'avez pas de compte ?
            <TouchableOpacity
              onPress={() => {
                router.push({
    pathname: role === "restaurant" ? "InscriResto" : "InscriAsso",
    params: { role }
  });
              }}
            >
              <Text style={[loginStyles.linkText, { marginBottom: -4 }]}>
                {" "}
                S'inscrire
              </Text>
            </TouchableOpacity>
          </Text>
        </View>

      </View>
</View>
       

    </ScrollView>
  );
}





