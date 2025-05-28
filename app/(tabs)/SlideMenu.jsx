import React, { useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  Animated,
  ImageBackground,
} from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { router } from "expo-router";


const { width, height } = Dimensions.get("window");

const SlideMenu = ({ isOpen, toggleMenu, userDetail }) => {
  const menuAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(menuAnim, {
      toValue: isOpen ? 1 : 0,
      duration: 300,
      useNativeDriver: true
    }).start();
  }, [isOpen]);

  const colors = ["#7B9DD2", "#DAD4DE", "#BBB4DA", "#7B9DD2", "#70C7C6"];
  const colorIndex = userDetail?.id ? userDetail.id.length % colors.length : 0;

  const initials = userDetail?.name
    ? userDetail.name
        .split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "NA";

  const menuItems = [
    { title: "Besoins", icon: "home-outline", action: () => router.push("/Besoins") },
    { title: "Mes Annonces", icon: "view-grid-outline", action: () => router.push("Annonces") },
    { title: "Nouvelle Annonce", icon: "plus-box-outline", action: () => router.push("NewAnnonce") },
    { title: "Echanges", icon: "calendar-outline", action: () => router.push("Echanges") },
    { title: "Mon Profil", icon: "account-outline", action: () => router.push("ProfileResto") },
    { title: "Notifications", icon: "bell-outline", action: () => router.push("Notifications") },
    { title: "Rapports", icon: "card-text-outline", action: () => router.push("Rapports") },
    { title: "À propos", icon: "information-outline", action: () => router.push("About") },
    { title: "FAQ", icon: "help-circle-outline", action: () => router.push("faq") },
    { isDivider: true }, 
    { title: "Déconnexion", icon: "logout", action: () => router.push("../CommunScreens/Screen3") }
  ];

  return (
    <Animated.View 
      style={[
        styles.menuOverlay,
        {
          transform: [{
            translateX: menuAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [-width, 0]
            })
          }],
          zIndex: 100,
        }
      ]}
    >
      
        <TouchableOpacity 
          style={styles.chevronButton}
          onPress={toggleMenu}
        >
          <MaterialCommunityIcons name="chevron-left" size={30} color="black" />
        </TouchableOpacity>

        <ScrollView 
          style={styles.menuScroll}
          contentContainerStyle={styles.menuScrollContent}
        >
          <View style={styles.menuProfileContainer}>
            <View style={styles.menuAvatarContainer}>
              <View style={[styles.menuAvatar, { backgroundColor: colors[colorIndex] }]}>
                <Text style={styles.menuAvatarInitials}>{initials}</Text>
              </View>
              <View style={styles.menuProfileText}>
                <Text style={styles.menuProfileName}>Restaurant {userDetail?.name}</Text>
                <Text style={styles.menuProfilePhone}>{userDetail?.phone}</Text>
              </View>
            </View>
          </View>

          <View style={styles.menuDivider} />

          {menuItems.map((item, index) => (
            item.isDivider ? (
              <View key={`divider-${index}`}  />
            ) : (
              <TouchableOpacity
                key={index}
                style={styles.menuItem}
                onPress={() => {
                  item.action();
                  toggleMenu();
                }}
              >
                <MaterialCommunityIcons 
                  name={item.icon}
                  size={24}
                  color="black"
                  style={styles.menuIcon}
                />
                <Text style={styles.menuText}>{item.title}</Text>
              </TouchableOpacity>
            )
          ))}
        </ScrollView>
      
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width * 0.7,
    height: '100%',
    backgroundColor: '#E2E2E2',
    borderRightWidth: 1,
    borderRightColor: 'black',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  chevronButton: {
    position: 'absolute',
    left: width * 0.7,
    top: '50%',
    marginTop: -25,
    width: 50,
    height: 100,
    backgroundColor: "#747474",
    borderTopRightRadius: 50,
    borderBottomRightRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 101,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    borderWidth: 1,
    borderLeftWidth: 0,
    borderColor: 'black',
  },
  menuScroll: {
    flex: 1,
    width: '100%',
  },
  menuScrollContent: {
    paddingTop: height * 0.05,
    paddingBottom: height * 0.1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  menuIcon: {
    marginRight: 20,
  },
  menuText: {
    fontSize: 18,
    color: 'black',
    fontWeight: '500',
  },
  menuAvatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 30,
  },
  menuAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: 'white',
  },
  menuAvatarInitials: {
    color: "black",
    fontSize: 28,
    fontWeight: "bold",
  },
  menuProfileText: {
    marginLeft: 20,
    flexShrink: 1,
  },
  menuProfileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'black',
  },
  menuProfilePhone: {
    fontSize: 16,
    color: 'black',
    marginTop: 5,
  },
  menuDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    marginVertical: 10,
    marginHorizontal: 20,
  },
});

export default SlideMenu;