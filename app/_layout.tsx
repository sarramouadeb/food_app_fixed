  import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
  import { useFonts } from 'expo-font';
  import { Stack } from 'expo-router';
  import { StatusBar } from 'expo-status-bar';
  import 'react-native-reanimated';
  import * as SplashScreen from 'expo-splash-screen';
import { UserProvider } from "../context/UserContext";
  import { useColorScheme } from '@/hooks/useColorScheme';

  export default function RootLayout() {
    const colorScheme = useColorScheme();
    SplashScreen.preventAutoHideAsync();

    const [loaded] = useFonts({
      SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    });

    if (!loaded) {
      return null;
    }


    return (
      <UserProvider>
    
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack screenOptions={{ animation: "fade" ,headerShown: false}}>
            <Stack.Screen name="Index" options={{ headerShown: false,  animation: 'none'  }} />
            <Stack.Screen name="CommunScreens/Screen1" options={{ headerShown: false, animation: 'fade' }}/>
            <Stack.Screen name="CommunScreens/Screen2" options={{ headerShown: false, animation: 'fade' }}/>
            <Stack.Screen name="CommunScreens/Screen3" options={{ headerShown: false, animation: 'fade' }}/>
            <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
      </UserProvider>
          );
  }