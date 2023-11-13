import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { SplashScreen, Stack, router } from "expo-router";
import { useEffect, useState } from "react";
import { useColorScheme } from "react-native";
import "../global.css";
import { getEmail, initDB } from "../services/dataService";
import { RootSiblingParent } from 'react-native-root-siblings';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: "main",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    "AtkinsonHyperlegible": require("../assets/fonts/AtkinsonHyperlegible-Regular.ttf"),
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    (async () => {
      await initDB();
    })();
  }, []);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const [loadedDB, setLoadedDB] = useState(false);
  const [showEmailScreen, setShowEmailScreen] = useState(false);

  useEffect(() => {
    (async () => {
      await initDB();
      setLoadedDB(true);
      try {
        const emailIsSet = await getEmail();
        if (!emailIsSet) {
          //@ts-ignore TODO: ???
          router.replace("/email");
        }
      } catch (e) {
        console.log(e);
      }
    })();
  }, []);

  if (!loadedDB) {
    return null;
  }

  return (
    <RootSiblingParent>
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            headerShown: false,
            animation:"slide_from_bottom"
          }}
        />
        <Stack.Screen
          name="settings"
          options={{ animation:"slide_from_bottom", headerShown: false }}
        />
        <Stack.Screen name="email" options={{ headerShown: false, animation:"slide_from_bottom" }} />
      </Stack>
    </ThemeProvider>
    </RootSiblingParent>
  );
}
