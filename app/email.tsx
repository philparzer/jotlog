import { useState } from "react";
import {
  View,
  TextInput,
  useColorScheme,
  TouchableOpacity,
} from "react-native";
import Text from "../components/utilities/Text"
import { saveEmail } from "../services/dataService";
import { z } from "zod";
import { router } from "expo-router";

export default function EmailScreen() {
  const colorScheme = useColorScheme();

  const [email, setEmail] = useState<string>("");
  const [emailError, setEmailError] = useState<boolean>(true);

  const handleEmailInput = (text: string) => {
    console.log(text);
    const emailSchema = z.string().email();
    const result = emailSchema.safeParse(text);
    if (result.success) {
      setEmail(text);
      setEmailError(false);
      return;
    }

    console.log("error");
    setEmailError(true);
  };

  const handleUpdateEmail = () => {
    (async () => {
      try {
        console.log("updating");
        await saveEmail(email);
        console.log("updated");
      } catch (e) {
        console.log("error");
        console.log(e);
      }
      router.replace("/");
    })();
  };

  return (
    <View className="h-full dark:bg-vanta flex items-center justify-center pb-[20vh] px-[5vw]">
      <Text className="text-vanta dark:text-offwhite text-2xl mb-1.5">
        Getting Started
      </Text>
      <Text className="text-vanta dark:text-offwhite text-center mb-4 opacity-100 max-w-[250px]">
        Enable backup for your notes by entering your email below
      </Text>
      <View>
        <>
          <View className="mt-4 flex flex-row justify-between bg-offwhite dark:bg-dim rounded-md items-center">
            <View className="px-3 py-2 ">
              <TextInput
                style={{ fontFamily: "AtkinsonHyperlegible" }}
                placeholder="enter your email"
                className={` bg-offwhite dark:bg-dim dark:text-offwhite p-2 w-[50vw]`}
                placeholderTextColor={
                  colorScheme === "dark" ? "#FFFFFF" : "#2E2A2D"
                }
                onChangeText={handleEmailInput}
                autoComplete="email"
                keyboardType="email-address"
                textContentType="emailAddress"
                autoCapitalize="none"
              />
            </View>
            <View
              className={`${emailError ? "opacity-25" : ""} flex flex-row p-2`}
            >
              <TouchableOpacity
                className={` bg-grape px-3 py-2 rounded-[5px]`}
                onPress={() => handleUpdateEmail()}
                disabled={emailError}
              >
                <Text className="text-offwhite rounded-full">enter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      </View>
      <View className="mt-20">
        <View className="gap-4">
          <Text className="text-vanta dark:text-offwhite opacity-50">
            Your email is saved locally on your device.
          </Text>
          <Text className="text-vanta dark:text-offwhite text-center opacity-50">
            Jotlog never connects to the internet.
          </Text>
        </View>
      </View>
    </View>
  );
}
