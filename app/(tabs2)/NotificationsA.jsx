import React, { useContext, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  TouchableWithoutFeedback,
  ScrollView,
  ImageBackground,
} from "react-native";
import { useUserContext } from "../../context/UserContext";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { router } from "expo-router";
import SlideMenuA from "./SlideMenuA";

const { width, height } = Dimensions.get("window");

export default function NotificationsA() {
  const { userDetail, setUserDetail } = useUserContext();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleProfilePress = () => {
    router.push("ProfileAsso");
  };

  // Générer les initiales basées sur le nom
  const initials = userDetail?.name
    ? userDetail.name
        .split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "NA";

  // Couleur déterministe basée sur l'ID
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

      <Animated.View style={[styles.mainContent, { paddingTop: 40 }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={toggleMenu}>
            <MaterialIcons
              name="menu"
              size={35}
              color="black"
              style={styles.menuIcon}
            />
          </TouchableOpacity>

          <View style={styles.titleContainer}>
            <Text style={styles.title}>Notifications</Text>
          </View>

          <TouchableOpacity onPress={handleProfilePress}>
            <View
              style={[styles.avatar, { backgroundColor: colors[colorIndex] }]}
            >
              <Text style={styles.initials}>{initials}</Text>
            </View>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.contentContainer}>
          <View style={styles.textContainer}>
            <Text style={styles.text}>Filtrer vos notifications:</Text>
          </View>

          <Text style={styles.noNotificationsText}>
            Aucune notification pour le moment
          </Text>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingTop: 10, // Augmenté de 10 à 30 pour descendre le header
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
  initials: {
    color: "black",
    fontSize: 20,
    fontWeight: "bold",
  },
  title: {
    fontSize: 35,
    fontWeight: "bold",
    color: "black",
    textAlign: "center",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10
  },
  titleContainer: {
    alignSelf: 'center',
  },
  menuIcon: {
    marginRight: width * 0.04,
    color: "black",
  },
  contentContainer: {
    paddingBottom: 50,
    alignItems: 'center',
  },
  textContainer: {
    backgroundColor: "#EAE5E5",
    width: width * 0.9,
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
  noNotificationsText: {
    textAlign: "center",
    fontSize: 18,
    marginTop: 20,
    color: "black",
  },
});