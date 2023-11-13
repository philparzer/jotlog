import Text from "./utilities/Text"

interface Props {
    title: string
    subtext?: string
}

export default function SettingsHeading({title, subtext}: Props) {
  return (
    <>
    <Text className={`text-vanta dark:text-offwhite text-[22px] ${subtext ? "mb-1.5" : "mb-8"}`}>
      {title}
    </Text>
    {subtext && <Text className="text-vanta dark:text-offwhite opacity-50 max-w-[85vw]">{subtext}</Text>}
    </>
   
  );
}
