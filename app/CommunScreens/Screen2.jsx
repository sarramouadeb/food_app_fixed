import { View, StyleSheet, Text, Dimensions, Pressable } from "react-native";
import Background from "../../assets/images/Background.png";
import { Image } from 'react-native';
import { useRouter } from "expo-router";

// Get screen width and height
const { width, height } = Dimensions.get('window');

export default function Screen2() {
  const router = useRouter(); 
  return (
    <View style={styles.container}>
      <Image 
        source={Background} 
        style={styles.backgroundImage} 
        resizeMode="cover"
      />
      
      <Text style={styles.text}></Text>
      <Text style={styles.para}>Chaque don que vous réservez est
         une aide précieuse pour ceux qui en ont besoin. {"\n"}
      Agissez avec nous !</Text>
      
      <View>
        <Pressable onPress={() => router.push('./Screen3')}>
          <Text style={styles.btn}>Suivant</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  text: {
    color: 'white', // Changé en blanc pour mieux contraster avec le fond
    fontSize: width * 0.08,  
    fontWeight: 'bold',
    textAlign: 'center',  
    marginTop: height * 0.35,  
    textShadowColor: 'rgba(0, 0, 0, 0.5)', // Ombre pour meilleure lisibilité
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  para: {
    color: 'black', // Changé en blanc
    fontSize: width * 0.05,  // Légèrement réduit pour équilibre
    textAlign: 'center',
    marginHorizontal: width * 0.08, 
    marginTop: height * 0.03, 
    lineHeight: height * 0.03, 
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  btn: {
    padding: 15, // Légèrement augmenté pour meilleur toucher
    backgroundColor: "#D7D7D7",
    marginTop: height * 0.05,
    width: width * 0.7,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: width * 0.06,
    color: 'black', // Texte en blanc pour contraste
    overflow: 'hidden', // Pour s'assurer que le borderRadius est respecté
    elevation: 5, // Ombre sur Android
    shadowColor: '#000', // Ombre sur iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  }
});