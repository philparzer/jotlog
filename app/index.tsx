import { useRef, useState, useEffect } from "react";
import {
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Animated,
  Keyboard,
} from "react-native";
import Text from "../components/utilities/Text";
import { TextInput } from "react-native-gesture-handler";
import {
  addTopic,
  getActiveTopics,
  getAllNotesByTopic,
  saveActiveTopics,
  type Topic,
  type Note,
  addNote,
} from "../services/dataService";
import { useColorScheme } from "react-native";
import TopicButton from "../components/TopicButton";
import CustomHeader from "../components/CustomHeader";
import { useNavigation } from "expo-router";
import Toast from "react-native-root-toast";

const maxTopicLength = 5;
const maxTopicCharacters = 20;

const shakeAnimation = new Animated.Value(0);

const shake = () => {
  Animated.sequence([
    Animated.timing(shakeAnimation, {
      toValue: 10,
      duration: 100,
      useNativeDriver: true,
    }),
    Animated.timing(shakeAnimation, {
      toValue: -10,
      duration: 100,
      useNativeDriver: true,
    }),
    Animated.timing(shakeAnimation, {
      toValue: 10,
      duration: 100,
      useNativeDriver: true,
    }),
    Animated.timing(shakeAnimation, {
      toValue: 0,
      duration: 100,
      useNativeDriver: true,
    }),
  ]).start();
};

const inputShake = () => {
  Animated.sequence([
    Animated.timing(shakeAnimation, {
      toValue: 5,
      duration: 100,
      useNativeDriver: true,
    }),
    Animated.timing(shakeAnimation, {
      toValue: -5,
      duration: 100,
      useNativeDriver: true,
    }),
    Animated.timing(shakeAnimation, {
      toValue: 5,
      duration: 100,
      useNativeDriver: true,
    }),
    Animated.timing(shakeAnimation, {
      toValue: 0,
      duration: 100,
      useNativeDriver: true,
    }),
  ]).start();
};

export default function MainScreen() {
  const noteInputRef = useRef<TextInput | null>(null);
  const topicInputRef = useRef<TextInput | null>(null);
  const [newTopic, setNewTopic] = useState("");
  const [activeTopics, setActiveTopics] = useState<Topic[]>();
  const [activeNotes, setActiveNotes] = useState<Note[]>();
  const [newNote, setNewNote] = useState("");
  const [focusNewTopicInput, setFocusNewTopicInput] = useState(false);
  const colorScheme = useColorScheme();
  const [keyboardHidden, setKeyboardHidden] = useState(false);
  const scrollFlatListRef = useRef<FlatList | null>(null);

  const navigation = useNavigation();

  const handleSetActiveTopic = (topicId: number) => {
    (async () => {
      //sort the array so that the active topic is always first
      if (activeTopics) {
        const sorted = [...activeTopics].sort((a, b) =>
          a.topicId === topicId ? -1 : b.topicId === topicId ? 1 : 0
        );
        await saveActiveTopics(sorted);

        setActiveTopics(sorted);
        scrollFlatListRef.current?.scrollToOffset({ animated: true, offset: 0 });
      }
    })();
  };

  const handleAddNewTopic = async () => {
    try {
      const addedTopic = await addTopic(newTopic);
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
      setFocusNewTopicInput(false);
      setNewTopic("");
      setTimeout(() => {
        noteInputRef.current?.focus();
      }, 100);
    } catch (e) {
      shake();
      setTimeout(() => {
        topicInputRef.current?.focus();
      }, 100);
    }
  };

  const handleNewNoteInput = (text: string) => {
    scrollFlatListRef.current?.scrollToOffset({ animated: true, offset: 0 });
    if (text.length > 100) {
      console.log("returning")
      shake();
      return;
    }
    setNewNote(text);
  };

  const handleAddNewNoteToStorage = async () => {
    const today = new Date();
    const formattedDate = new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(today);

    noteInputRef.current?.clear();
    if (activeTopics) {
      console.log(
        "note to add ",
        JSON.stringify({
          message: newNote,
          date: formattedDate,
          topicId: activeTopics[0].topicId,
        })
      );
      const addedNote = await addNote({
        message: newNote,
        date: formattedDate,
        topicId: activeTopics[0].topicId,
      });
      console.log(addNote);
      if (activeNotes) {
        const updatedNotes = [addedNote, ...activeNotes];
        setActiveNotes(updatedNotes);
      } else {
        setActiveNotes([addedNote]);
      }
    }
  };

  const initAddNewTopic = () => {
    setFocusNewTopicInput(true);
    setKeyboardHidden(false);
    setTimeout(() => {
      topicInputRef.current?.focus();
    }, 100);
  };

  const updateNewTopicInput = (text: string) => {
    if (text.length > 20) {
      return;
    }
    setNewTopic(text);
  };

  const fetchActiveTopics = async () => {
    (async () => {
      const activeTopics = await getActiveTopics();

      if (activeTopics.length === 0) {
        console.log("no activeTopics");
        setActiveTopics(undefined);
        initAddNewTopic();
      } else {
        console.log("FETCHING");
        setActiveTopics(activeTopics);
        setFocusNewTopicInput(false);
        console.log("focusing note input ref");
        noteInputRef.current?.focus();
      }
    })();
  };

  // fetch active topics on first load
  useEffect(() => {
    fetchActiveTopics();
  }, []);

  //fetch active notes on active topic change
  useEffect(() => {
    (async () => {
      if (activeTopics) {
        const allNotes = await getAllNotesByTopic(activeTopics[0].topicId);
        setActiveNotes(allNotes.reverse());
      }
    })();
  }, [activeTopics]);

  //attach events for keyboard
  useEffect(() => {
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => setKeyboardHidden(true)
    );

    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => setKeyboardHidden(false)
    );

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", fetchActiveTopics);
    return unsubscribe;
  }, [navigation, fetchActiveTopics]);

  return (
    <View className="flex-1 bg-white dark:bg-vanta">
      <KeyboardAvoidingView
        className=""
        behavior={"padding"}
        style={{ flex: 1 }}
        // keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 10}
      >
        <View className="flex-1">
          <CustomHeader title={"jotlog"} />
          <View className="flex flex-row mx-10 pt-8">
            {activeTopics && focusNewTopicInput === false ? (
              <TopicButton
                topic={{
                  name: activeTopics[0].name,
                  topicId: activeTopics[0].topicId,
                }}
                pressHandler={() => {}}
                activeTopic={activeTopics[0].topicId}
              />
            ) : (
              <Animated.View
                style={{ transform: [{ translateX: shakeAnimation }] }}
              >
                <TextInput
                  ref={topicInputRef}
                  placeholder="add a topic"
                  autoFocus
                  style={{ fontFamily: "AtkinsonHyperlegible" }}
                  className={` border animate-ping border-grape px-3 ${Platform.OS === "ios" ? "py-2": "py-0.5"} rounded-full ${
                    newTopic.length >= maxTopicCharacters
                      ? "text-red-400"
                      : "text-vanta dark:text-offwhite"
                  }`}
                  placeholderTextColor={
                    colorScheme === "dark" ? "#FFFFFF" : "#2E2A2D"
                  }
                  onChangeText={(text) => updateNewTopicInput(text)}
                  returnKeyType="send"
                  value={newTopic}
                  onSubmitEditing={handleAddNewTopic}
                />
              </Animated.View>
            )}
          </View>

          {/*--PAST NOTES and NOTE INPUT--*/}
          <View className="flex flex-row pt-4">
            <View className="relative min-h-[40px] w-[55vw] z-20">
              <View className="absolute h-[22px] justify-center pt-2">
                <View className="w-10 h-1 rounded-full bg-grape"></View>
              </View>
              <Animated.View className="ml-12"
                style={{ transform: [{ translateX: shakeAnimation }] }}
              >
                {focusNewTopicInput === false ? (
                  <TextInput
                    hitSlop={{ top: 40, bottom: 40, left: 40, right: 40 }}
                    value={newNote}
                    allowFontScaling={false}
                    placeholder="add a note"
                    style={{ fontFamily: "AtkinsonHyperlegible" }}
                    placeholderTextColor={
                      colorScheme === "dark" ? "#FFFFFF" : "#2E2A2D"
                    }
                    multiline
                    className="dark:text-white p-0 text-[22px]"
                    onChangeText={handleNewNoteInput}
                    autoFocus
                    cursorColor={colorScheme === "dark" ? "#FFFFFF" : "#2E2A2D"}
                    ref={noteInputRef}
                  />
                ) : null}
              </Animated.View>
            </View>

            <View className="absolute w-screen h-screen pt-4">
              <View
                pointerEvents="none"
                className="absolute w-[60vw] bg-white dark:bg-vanta z-10 h-full"
              ></View>
              {activeNotes && focusNewTopicInput === false ? (
                <FlatList
                  keyboardShouldPersistTaps="always"
                  keyboardDismissMode="none"
                  className="h-full pt-2"
                  ItemSeparatorComponent={() => <View className="pr-5" />}
                  horizontal
                  data={activeNotes}
                  ref={scrollFlatListRef}
                  renderItem={({ item, index }) => (
                    <Text
                      allowFontScaling={false}
                      className={`${
                        index === 0 ? "ml-[60vw]" : ""
                      }  max-w-[50vw] dark:text-white opacity-30 text-[16px] `}
                    >
                      {item.message}
                    </Text>
                  )}
                  keyExtractor={(note, index) => note.noteId.toString()}
                  // key={activeNotes.length}
                />
              ) : null}
            </View>
          </View>
        </View>
        {/*--Keyboard Bar--*/}
        {keyboardHidden ? null : (
          <View
            className="flex flex-row pb-2 gap-2 justify-between "
            pointerEvents="box-none"
          >
            <View
              className="flex flex-row gap-2 flex-wrap shrink"
              pointerEvents="box-none"
            >
              {focusNewTopicInput === false &&
                activeTopics &&
                activeTopics.map((topic) => {
                  if (topic.topicId !== activeTopics[0].topicId) {
                    return (
                      <View key={topic.topicId} className="z-20">
                        <TopicButton
                          topic={topic}
                          pressHandler={handleSetActiveTopic}
                          activeTopic={activeTopics[0].topicId}
                        />
                      </View>
                    );
                  }
                })}
              <View
                className="flex flex-row justify-end items-center py-1 z-20 "
                pointerEvents="box-none"
              >
                {focusNewTopicInput === false ? (
                  <TouchableOpacity
                    onPress={() => initAddNewTopic()}
                    className="bg-dim dark:bg-offwhite px-2 rounded-lg"
                  >
                    <Text className="text-offwhite dark:text-vanta bottom-[1px] text-lg">
                      +
                    </Text>
                  </TouchableOpacity>
                ) : activeTopics && activeTopics.length > 0 ? (
                  <TouchableOpacity
                    disabled={activeTopics.length > maxTopicLength}
                    onPress={() => setTimeout(() => { setFocusNewTopicInput(false)}, 100)}
                    className="bg-dim dark:bg-offwhite px-2 rounded-lg"
                  >
                    <Text className="text-offwhite dark:text-vanta text-lg bottom-0.5">
                      x
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
            <View className="flex justify-end" pointerEvents="box-none">
              <View className="flex gap-2">
                {focusNewTopicInput === false ? (
                  <TouchableOpacity
                    disabled={newNote.length === 0}
                    onPress={handleAddNewNoteToStorage}
                    className={`${
                      newNote.length === 0 ? "opacity-25" : ""
                    } bg-grape px-4 py-1 rounded-lg mx-2`}
                  >
                    <Text className="text-white text-lg">add</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}
