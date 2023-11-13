import { TouchableOpacity } from "react-native";
import Text from "./utilities/Text"
import { type Topic } from "../services/dataService";

interface Props {
    topic: Topic;
    pressHandler: (topicId: number) => void;
    activeTopic: number;
}

export default function TopicButton({topic, pressHandler, activeTopic}: Props) {
  return (
  <TouchableOpacity
    onPress={() => pressHandler(topic.topicId)}
    className={` rounded-full  px-3 py-2 " ${
      topic.topicId === activeTopic ? "bg-dim dark:bg-offwhite" : "bg-offwhite dark:bg-dim"
    }`}
  >
    <Text
      className={` text-white   ${
        topic.topicId === activeTopic
          ? " text-offwhite dark:text-vanta"
          : "text-black dark:text-offwhite"
      }`}
    >
      {topic.name}
    </Text>
  </TouchableOpacity>
  )
}
