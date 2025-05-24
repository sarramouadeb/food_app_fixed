import { View, StyleSheet, Text, Dimensions, Pressable } from "react-native";
import cover from "../../assets/images/cover.png";
import image2 from "../../assets/images/image2.png";
import { Image } from "react-native";

import { useRouter } from "expo-router";
import { useState } from "react";

const { width, height } = Dimensions.get("window");

export default function Screen3() {
  const router = useRouter();
  const [selectedOption, setSelectedOption] = useState(null);
  const options = [
    { id: 1, label: "Restaurant" },
    { id: 2, label: "Association" },
  ];

  return (
    <View style={styles.container}>
      {/* Image de fond couvrant tout l'écran */}
      <Image 
        source={cover} 
        style={styles.backgroundImage} 
        resizeMode="cover"
      />
      
      {/* Contenu par-dessus l'image de fond */}
      <View style={styles.content}>
      <Image 
        source={image2} 
        style={styles.im} 
        resizeMode="cover"
      />
        <Text style={styles.continue}>Continue comme{"\n"}</Text>

        <View style={styles.container1}>
          {options.map((option) => (
            <Pressable
              key={option.id}
              style={styles.radioContainer}
              onPress={() => setSelectedOption(option.id)}
            >
              <View style={styles.radio}>
                {selectedOption === option.id && <View style={styles.radioSelected} />}
              </View>
              <Text style={styles.label}>{option.label}</Text>
            </Pressable>
          ))}
        </View>
        
        <Pressable
          onPress={() => {
            if (selectedOption === 1) {
              router.push({
                pathname: "../(auth)/Login",
                params: { role: "restaurant" },
              });
            } else if (selectedOption === 2) {
              router.push({
                pathname: "../(auth)/Login",
                params: { role: "association" },
              });
            }
          }}
        >
          <Text style={styles.btn}>Suivant</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
   
  },
  inscri: {
    color: "black",
    fontSize: width * 0.09,
    fontWeight: 'bold',
    alignSelf: 'flex-start',
    marginLeft: width * 0.1,
    marginBottom: height * 0.1,
  },
  continue: {
    color: "black",
    fontSize: width * 0.12,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: height * 0.00,
  },
  btn: {
    padding: 15, 
    backgroundColor: "#D7D7D7",
    marginTop: height * 0,
    width: width * 0.7,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: width * 0.06,
    color: 'black',
    overflow: 'hidden', 
    elevation: 5, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  container1: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: height * 0.05,
      marginTop: height * 0,
  },
  radioContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 15,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "black",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },
  radioSelected: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "black",
  },
  label: {
    fontSize: 25,
    color: "black",
    fontWeight: '500',
  },
});