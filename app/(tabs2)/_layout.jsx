import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import React, { useState, useContext } from "react";
import { router, Tabs } from "expo-router";
import { useUserContext } from "../../context/UserContext";
import Icon from "react-native-vector-icons/Ionicons";
import { UserProvider } from "../../context/UserContext";

const { width, height } = Dimensions.get("window");

const CustomTabBarButton = ({ children, onPress }) => {
  return (
    <TouchableOpacity
      style={{
        top: -10,
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1,
        marginLeft: 15, // Décalage vers la droite
      }}
      onPress={onPress}
    >
      <View
        style={{
          width: 60,
          height: 60,
          borderRadius: 30,
        }}
      >
        {children}
      </View>
    </TouchableOpacity>
  );
};

export default function _Layout() {
  const { userDetail, setUserDetail } = useUserContext();

  return (
    <UserProvider>
      <View style={styles.container}>
        <Tabs
          screenOptions={{
            tabBarShowLabel: false,
            headerShown: false,
            tabBarStyle: {
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              elevation: 0,
              backgroundColor: "#fff",
              height: 70,
              borderTopWidth: 0,
              width: width,
            },
          }}
        >
          {/* annonces */}
          <Tabs.Screen
            name="AnnoncesA"
            options={{
              tabBarIcon: ({ focused }) => (
                <View style={styles.tabItem}>
                  <Icon
                    name="home-outline"
                    size={24}
                    color={focused ? "#000" : "gray"}
                  />
                  <Text style={styles.tabText}>Annonces</Text>
                </View>
              ),
            }}
          />

          {/* besoins */}
          <Tabs.Screen
            name="BesoinsA"
            options={{
              tabBarIcon: ({ focused }) => (
                <View style={styles.tabItem}>
                  <Icon
                    name="grid-outline"
                    size={24}
                    color={focused ? "#000" : "gray"}
                  />
                  <Text style={styles.tabText}>Besoins</Text>
                </View>
              ),
            }}
          />

          {/* creer */}
          <Tabs.Screen
            name="NewBesoin"
            options={{
              tabBarIcon: ({ focused }) => (
                <View style={styles.centralTabItem}>
                  <View style={styles.centralButton}>
                    <Icon
                      name="add-circle-outline"
                      size={50}
                      color="gray"
                    />
                  </View>
                  <Text style={[styles.centralTabText, { marginLeft: 0 }]}>
                    Créer
                  </Text>
                </View>
              ),
              tabBarButton: (props) => (
                <CustomTabBarButton
                  {...props}
                  onPress={() => {
                    props.onPress();
                    router.replace({
                      pathname: "NewBesoin",
                      params: { besoinToEdit: null },
                    });
                  }}
                />
              ),
            }}
          />

          {/* echanges */}
          <Tabs.Screen
            name="EchangesA"
            options={{
              tabBarIcon: ({ focused }) => (
                <View style={styles.tabItem}>
                  <Icon
                    name="calendar-number-outline"
                    size={24}
                    color={focused ? "#000" : "gray"}
                  />
                  <Text style={styles.tabText}>Echanges</Text>
                </View>
              ),
            }}
          />

          {/* notifications */}
          <Tabs.Screen
            name="NotificationsA"
            options={{
              tabBarIcon: ({ focused }) => (
                <View style={styles.tabItem}>
                  <Icon
                    name="notifications-outline"
                    size={24}
                    color={focused ? "#000" : "gray"}
                  />
                  <Text style={styles.tabText}>Notifications</Text>
                </View>
              ),
            }}
          />

          {/* Les écrans cachés */}
          {['ProfileAsso', 'ModifierProfileA', 'SlideMenuA', 'RestoPr', 'ReserverAnnonce'].map((name) => (
            <Tabs.Screen
              key={name}
              name={name}
              options={{
                tabBarButton: () => null,
                tabBarItemStyle: { display: "none" },
              }}
            />
          ))}
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
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: width / 5,
    paddingTop: 10,
  },
  centralTabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: width / 5,
    marginBottom: 25,
  },
  tabText: {
    fontSize: 10,
    marginTop: 5,
    textAlign: 'center',
  },
  centralTabText: {
    fontSize: 10,
    position: 'absolute',
    bottom: -40,
    textAlign: 'center',
    width: '100%',
  },
  centralButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#DCDCDC",
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: "black",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});