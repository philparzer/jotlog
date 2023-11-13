import { Keyboard, View, useColorScheme } from "react-native";
import Text from "./utilities/Text"
import { TouchableOpacity } from "react-native";
import { Svg, Circle, Path } from "react-native-svg";
import { router } from "expo-router";

interface Props {
  hasBackButton?: boolean;
  title: string;
}

export default function CustomHeader({ hasBackButton, title }: Props) {
  const colorScheme = useColorScheme();
  const handleHeaderButtonPress = () => {
    console.log("pressed")
    Keyboard.dismiss();
    if (hasBackButton)  {
      router.replace("../") 
      return
    }
    router.replace("/settings")
  };
  

  return (
    <View className="h-[15vh] pt-12 overflow-hidden bg-white dark:bg-vanta z-20">
      <View className="flex relative justify-center w-full items-center flex-row h-10">
        <TouchableOpacity onPress={() => console.log("test")} className="">
        <Text className="text-vanta dark:text-offwhite" >{title}</Text>
        </TouchableOpacity>
        <View className="h-10 absolute right-[5vw] flex justify-center items-center">
          <View className="w-20 flex justify-end items-end">
            <TouchableOpacity
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
              onPress={handleHeaderButtonPress}
              className=""
            >
              <View>
              {hasBackButton ? (
                <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <Path
                    d="M7.7 6L10 9.67969L12.3 6H14L10.9 10.5L14 15H12.3L10 11.5078L7.7 15H6L9.05 10.5L6 6H7.7Z"
                    fill={colorScheme === "dark" ? "#FFFFFF" : "#2E2A2D"}
                  />
                </Svg>
              ) : (
                <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <Circle
                    cx="10"
                    cy="4"
                    r="2"
                    fill={colorScheme === "dark" ? "#FFFFFF" : "#2E2A2D"}
                  />
                  <Circle
                    cx="10"
                    cy="10"
                    r="2"
                    fill={colorScheme === "dark" ? "#FFFFFF" : "#2E2A2D"}
                  />
                  <Circle
                    cx="10"
                    cy="16"
                    r="2"
                    fill={colorScheme === "dark" ? "#FFFFFF" : "#2E2A2D"}
                  />
                </Svg>
                
              )}
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}
