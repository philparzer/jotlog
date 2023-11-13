import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  TextInput,
  View,
} from "react-native";
import Text from "../components/utilities/Text";
import CustomHeader from "../components/CustomHeader";
import { useEffect, useRef, useState } from "react";
import { useColorScheme } from "react-native";
import { ScrollView, TouchableOpacity } from "react-native";
import SettingsHeading from "../components/SettingsHeading";
import { z } from "zod";
import { ExternalLink } from "../components/ExternalLink";
import {
  Topic,
  deleteDB,
  deleteTopicAndNotesById,
  getActiveTopics,
  getAllTopics,
  getEmail,
  initDB,
  saveActiveTopics,
  saveEmail,
} from "../services/dataService";
import { router } from "expo-router";
import { exportTopicByEmail } from "../services/backupService";
import Toast from "react-native-root-toast";

enum ModalMode {
  DeleteTopic,
  EraseAllData,
  Hidden,
}

export default function ModalScreen() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [email, setEmail] = useState<string>("");
  const [emailError, setEmailError] = useState<boolean>(true);
  const [savedEmail, setSavedEmail] = useState<string>("");
  const [isUpdatingEmail, setIsUpdatingEmail] = useState<boolean>(false);
  const emailInputRef = useRef<TextInput>(null);
  const [modalMode, setModalMode] = useState<ModalMode>(ModalMode.Hidden);
  const [topicToDelete, setTopicToDelete] = useState<Topic | null>(null);
  const [activeTopics, setActiveTopics] = useState<Topic[] | []>([]);
  const [backupError, setBackupError] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      const topics = await getAllTopics();
      const activeTopics = await getActiveTopics();
      const savedEmail = await getEmail();
      console.log(savedEmail);
      setSavedEmail(savedEmail || "test@text.com");
      setTopics(topics);
      setActiveTopics(activeTopics);

      if (topics.length === 0) {
        console.log("no topics");
      }
    })();
  }, []);

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
  const colorScheme = useColorScheme();

  const handleEditEmail = () => {
    setIsUpdatingEmail(true);
    emailInputRef.current?.focus();
  };

  const handleUpdateEmail = () => {
    console.log("update email");
    setSavedEmail(email);
    (async () => {
      try {
        await saveEmail(email);
        setIsUpdatingEmail(false);
      } catch (e) {
        console.log(e);
        setIsUpdatingEmail(false);
      }
    })();

    Keyboard.dismiss();
  };

  async function handleBackupPress(topic: Topic) {
    try {
      const result = await exportTopicByEmail(topic.topicId, savedEmail);
      if (!result) {
        setBackupError(true);
        Toast.show(
          "Email could not be sent. Please set up the email app on your phone.",
          {
            duration: Toast.durations.LONG,
            backgroundColor: "#FA2E2E",
            shadow: false,
            opacity: 1,
            containerStyle: {
              borderRadius: 5,
              padding: 12,
            },
          }
        );
      } else {
        setBackupError(false);
      }
    } catch (e) {
      console.log(e);
    }
  }

  const handleDeleteTopicPress = (topic: Topic) => {
    setModalMode(ModalMode.DeleteTopic);
    setTopicToDelete(topic);
  };

  const deleteTopic = async () => {
    setTopicToDelete(null);

    if (!topicToDelete) {
      return;
    }
    try {
      await deleteTopicAndNotesById(topicToDelete.topicId);
      setTopics(
        topics.filter((topic) => topic.topicId !== topicToDelete.topicId)
      );
      setModalMode(ModalMode.Hidden);
    } catch (e) {
      console.log(e);
    }
  };

  const handleEraseAllDataPress = () => {
    setModalMode(ModalMode.EraseAllData);
  };

  const eraseAllData = async () => {
    try {
      await deleteDB();
      await initDB();
      setTopics([]);
      setModalMode(ModalMode.Hidden);
      router.push("/email");
    } catch (e) {
      console.log(e);
    }
  };

  const addToActiveTopics = async (addedTopic: Topic) => {
    console.log("add");
    try {
      let updatedActiveTopics: Topic[];
      if (!activeTopics) {
        updatedActiveTopics = [addedTopic];
        await saveActiveTopics(updatedActiveTopics);
      } else {
        if (activeTopics.length < 5) {
          updatedActiveTopics = [addedTopic, ...activeTopics];
        } else {
          const activeTopicsLastRemoved = [...activeTopics].slice(0, 4);
          updatedActiveTopics = [addedTopic, ...activeTopicsLastRemoved];
        }

        await saveActiveTopics(updatedActiveTopics);
      }

      setActiveTopics(updatedActiveTopics);
    } catch (e) {
      console.log(e);
    }
  };

  const removeFromActiveTopics = async (removedTopic: Topic) => {
    console.log("REMOVING", removedTopic.name);
    const removedTopicArray = [...activeTopics].filter(
      (activeTopic) => activeTopic.topicId !== removedTopic?.topicId
    );
    try {
      console.log("before await");
      await saveActiveTopics(removedTopicArray);
      console.log("rerendering");
      setActiveTopics(removedTopicArray ? removedTopicArray : []);
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <View className="flex-1 bg-white dark:bg-vanta">
      <Modal
        animationType="slide"
        transparent={true}
        visible={
          modalMode === ModalMode.DeleteTopic ||
          modalMode === ModalMode.EraseAllData
        }
        onRequestClose={() => {
          setModalMode(ModalMode.Hidden);
        }}
      >
        <View className="w-full h-full flex items-center bg-white dark:bg-vanta justify-center">
          <View className=" p-8 flex items-center justify-center gap-6">
            {modalMode === ModalMode.DeleteTopic && (
              <Text className="text-lg dark:text-white">
                Are you sure you want to delete this topic?
              </Text>
            )}
            {modalMode === ModalMode.EraseAllData && (
              <Text className="text-lg dark:text-white">
                Are you sure you want to delete all data?
              </Text>
            )}

            <View className="flex flex-row gap-2">
              <TouchableOpacity
                className="bg-danger px-3 py-2 rounded-[5px]"
                onPress={
                  modalMode === ModalMode.DeleteTopic
                    ? () => deleteTopic()
                    : () => eraseAllData()
                }
              >
                <Text className="text-offwhite rounded-full">delete</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className=" bg-dim dark:bg-white px-3 py-2 rounded-[5px]"
                onPress={() => setModalMode(ModalMode.Hidden)}
              >
                <Text className=" text-offwhite dark:text-vanta rounded-full ">
                  no
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <KeyboardAvoidingView keyboardVerticalOffset={0} behavior={"padding"}>
        <CustomHeader hasBackButton title={"settings"} />
        <ScrollView
          className="px-[5vw] flex gap-14 h-full"
          keyboardShouldPersistTaps={"handled"}
        >
          <View>
            <SettingsHeading
              title={"Manage topics"}
              subtext="Highlighted topics are currently active. Tap on topics to make them active."
            />
            <View className="flex gap-4 mt-3">
              {topics.length === 0 && (
                <Text className="text-vanta dark:text-offwhite">
                  You don't have any topics. Go add some!
                </Text>
              )}
              {topics.map((topic) => (
                <TouchableOpacity
                  onPress={
                    activeTopics.find(
                      (activeTopic) => activeTopic.topicId === topic.topicId
                    )
                      ? () => removeFromActiveTopics(topic)
                      : () => addToActiveTopics(topic)
                  }
                  key={topic.topicId}
                  className={
                    activeTopics.find(
                      (activeTopic) => activeTopic.topicId === topic.topicId
                    )
                      ? "flex flex-row justify-between bg-dim dark:bg-offwhite p-2 rounded-md"
                      : "flex flex-row justify-between bg-offwhite dark:bg-dim p-2 rounded-md"
                  }
                >
                  <View className="px-3 py-2 rounded-full flex flex-row justify-between grow">
                    <Text
                      className={
                        activeTopics.find(
                          (activeTopic) => activeTopic.topicId === topic.topicId
                        )
                          ? "text-offwhite dark:text-vanta"
                          : "text-vanta dark:text-offwhite"
                      }
                    >
                      {topic.name}
                    </Text>

                  </View>
                  <View className="flex flex-row gap-2">
                    <TouchableOpacity
                      className="bg-danger px-3 py-2 rounded-[5px]"
                      onPress={() => handleDeleteTopicPress(topic)}
                    >
                      <Text className="text-offwhite rounded-full">delete</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className=" bg-grape px-3 py-2 rounded-[5px]"
                      onPress={() => handleBackupPress(topic)}
                    >
                      <Text className=" text-offwhite rounded-full ">
                        backup
                      </Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View className="">
            <SettingsHeading
              title={"Backup settings"}
              subtext={
                "Jotlog allows you to backup your notes by saving them in your email inbox. We don't save your email."
              }
            />

            <View className="flex">
              <View>
                <View className="mt-4 flex flex-row justify-between bg-offwhite dark:bg-dim rounded-md items-center">
                  <View className="px-3 py-2 ">
                    {isUpdatingEmail ? (
                      <TextInput
                        style={{ fontFamily: "AtkinsonHyperlegible" }}
                        placeholder="enter your email"
                        className={` bg-offwhite dark:bg-dim dark:text-offwhite p-2 w-[50vw]`}
                        ref={emailInputRef}
                        autoFocus={true}
                        placeholderTextColor={
                          colorScheme === "dark" ? "#FFFFFF" : "#2E2A2D"
                        }
                        onChangeText={handleEmailInput}
                        autoComplete="email"
                        keyboardType="email-address"
                        textContentType="emailAddress"
                        autoCapitalize="none"
                      />
                    ) : (
                      <View className="flex w-[90vw] ">
                        <TouchableOpacity
                          onPress={() => handleEditEmail()}
                          className="p-2 "
                        >
                          <Text className="text-vanta dark:text-offwhite rounded-full ">
                            {savedEmail}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                  <View
                    className={`relative z-50 bg-red-200 ${
                      emailError ? "opacity-25" : ""
                    } flex flex-row p-2`}
                  >
                    {
                      <TouchableOpacity
                        className={` bg-grape px-3 py-2 rounded-[5px] `}
                        onPress={() => handleUpdateEmail()}
                        onFocus={() => handleUpdateEmail()}
                        disabled={emailError || !isUpdatingEmail}
                      >
                        <Text className="text-offwhite rounded-full">
                          update
                        </Text>
                      </TouchableOpacity>
                    }
                  </View>
                </View>
              </View>
            </View>
          </View>

          <View className="">
            <SettingsHeading
              title={"Theme"}
              subtext="jotlog's theme (dark mode or light mode) is determined by your device settings"
            />
          </View>
          <View className="">
            <SettingsHeading
              title={"Links"}
              subtext="Find more info or contact me via email. Consider sponsoring my work if you find it useful."
            />
            <View className="mt-4">
              <View className="flex gap-3">
                <ExternalLink href="https://jotlog.app">
                  <Text className=" underline text-vanta dark:text-offwhite">
                    jotlog.app
                  </Text>
                </ExternalLink>
                <ExternalLink href="https://twitter.com/jotlog_app">
                  <Text className=" underline text-vanta dark:text-offwhite ">
                    Twitter / X
                  </Text>
                </ExternalLink>
                <ExternalLink href="mailto:hi@adlerlagune.com">
                  <Text className=" underline text-vanta dark:text-offwhite ">
                    Email
                  </Text>
                </ExternalLink>
              </View>
            </View>
          </View>
          <View className="">
            <SettingsHeading
              title={"Dangerous"}
              subtext="Everything is saved locally on your device. Back up your data before deletion or it's gone forever."
            />
            <View className="flex flex-row mt-4">
              <TouchableOpacity
                className=" bg-danger px-3 py-2 rounded-[5px]"
                onPress={() => handleEraseAllDataPress()}
              >
                <Text className=" text-offwhite rounded-full ">
                  delete all data
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          <View className="h-10" />
        </ScrollView>
        {/* Use a light status bar on iOS to account for the black space above the modal */}
      </KeyboardAvoidingView>
    </View>
  );
}
