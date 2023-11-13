import { type ReactNode } from "react"
import {Text, type TextProps} from "react-native"

interface Props {
    className?: string
    children: ReactNode[] | ReactNode
    style?: TextProps,
    allowFontScaling?: boolean
}

export default function CustomText({className, children, style, allowFontScaling}: Props) {
    return (
        <Text className={className} allowFontScaling={allowFontScaling} style={[style, {fontFamily: "AtkinsonHyperlegible"}]}>
            {children}
        </Text>
    )
}