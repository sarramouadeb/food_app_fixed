import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import React, { useState } from 'react';
import { router, Tabs } from 'expo-router';
import { UserProvider } from "../../context/UserContext";
import Icon from "react-native-vector-icons/Ionicons";

const { width, height } = Dimensions.get("window");

const CustomTabBarButton = ({ children, onPress }) => {
  return (
    <TouchableOpacity
      style={{
        top: -55,
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1,
      }}
      onPress={onPress}
    >
      <View
        style={{
          width: 70,
          height: 70,
          borderRadius: 35,
        }}
      >
        {children}
      </View>
    </TouchableOpacity>
  );
};

export default function _Layout() {
  const [userDetail, setUserDetail] = useState(null);
 
  return (
    <UserProvider value={{ userDetail, setUserDetail }}>
      <View style={styles.container}>
        <Tabs screenOptions={{
          tabBarShowLabel: false,
          headerShown: false,
          tabBarStyle: {
            bottom: 0,
            left: 0,
            right: 0,
            elevation: 0,
            borderRadius: 0,
            backgroundColor: "#ffff",
            height: 70,
            borderWidth: 0,
            borderColor: "black",
            width: width,
            paddingTop: 15,
          },
        }}>
          {/* Besoins */}
          <Tabs.Screen
            name="Besoins"
            options={{
              tabBarIcon: ({ focused }) => (
                <View style={styles.tabWrapper}>
                  <View style={[styles.iconContainer, focused && styles.activeTab]}>
                    <Icon name="home-outline" size={24} color="gray" />
                  </View>
                  <Text style={styles.tabText}>Besoins</Text>
                </View>
              ),
            }}
          />

          {/* Annonces */}
          <Tabs.Screen
            name="Annonces"
            options={{
              tabBarIcon: ({ focused }) => (
                <View style={styles.tabWrapper}>
                  <View style={[styles.iconContainer, focused && styles.activeTab]}>
                    <Icon name="grid-outline" size={24} color="gray" />
                  </View>
                  <Text style={styles.tabText}>Annonces</Text>
                </View>
              ),
            }}
          />

          {/* Créer */}
          <Tabs.Screen
            name="NewAnnonce"
            options={{
              tabBarIcon: ({ focused }) => (
                <View style={styles.centralTabWrapper}>
                  <View style={styles.centralIcon}>
                    <Icon name="add-circle-outline" size={50} color="gray" />
                  </View>
                  <Text style={styles.centralTabText}>Créer</Text>
                </View>
              ),
              tabBarButton: (props) => (
                <CustomTabBarButton
                  {...props}
                  onPress={() => {
                    props.onPress();
                    router.replace({
                      pathname: "NewAnnonce",
                      params: { annonceToEdit: null },
                    });
                  }}
                />
              ),
            }}
          />

          {/* Echanges */}
          <Tabs.Screen
            name="Echanges"
            options={{
              tabBarIcon: ({ focused }) => (
                <View style={styles.tabWrapper}>
                  <View style={[styles.iconContainer, focused && styles.activeTab]}>
                    <Icon name="calendar-number-outline" size={24} color="gray" />
                  </View>
                  <Text style={styles.tabText}>Echanges</Text>
                </View>
              ),
            }}
          />

          {/* Notifications */}
          <Tabs.Screen
            name="Notifications"
            options={{
              tabBarIcon: ({ focused }) => (
                <View style={styles.tabWrapper}>
                  <View style={[styles.iconContainer, focused && styles.activeTab]}>
                    <Icon name="notifications-outline" size={24} color="gray" />
                  </View>
                  <Text style={styles.tabText}>Notifications</Text>
                </View>
              ),
            }}
          />

          {/* Screens cachés */}
          <Tabs.Screen name="ProfileResto" options={{ tabBarItemStyle: { display: 'none' }}} />
          <Tabs.Screen name="ModifierProfile" options={{ tabBarItemStyle: { display: 'none' }}} />
          <Tabs.Screen name="Horaire" options={{ tabBarItemStyle: { display: 'none' }}} />
          <Tabs.Screen name="faq" options={{ tabBarItemStyle: { display: 'none' }}} />
          <Tabs.Screen name="ModifierReservation" options={{ tabBarItemStyle: { display: 'none' }}} />
          <Tabs.Screen name="BesoinForm" options={{ tabBarItemStyle: { display: 'none' }}} />
          <Tabs.Screen name="About" options={{ tabBarItemStyle: { display: 'none' }}} />
          <Tabs.Screen name="SlideMenu" options={{ tabBarItemStyle: { display: 'none' }}} />
        </Tabs>
      </View>
    </UserProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  tabWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    width: width * 0.18, // Ajustement de l'espacement
  },
  centralTabWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: -height * 0.13,
    marginRight: -width * 0.09,
  },
  iconContainer: {
    marginBottom: 5,
  },
  activeTab: {
    backgroundColor: "#DCDCDC",
    borderRadius: 10,
    padding: 5,
  },
  centralIcon: {
    borderRadius: 50,
    borderWidth: 1,
    borderColor: "black",
    backgroundColor: "#DCDCDC",
    shadowColor: "black",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 5,
  },
  tabText: {
    fontSize: 10,
    textAlign: 'center',
    width: '100%', // Empêche le retour à la ligne
  },
  centralTabText: {
    fontSize: 10,
    marginTop: 5,
    textAlign: 'center',
  },
});