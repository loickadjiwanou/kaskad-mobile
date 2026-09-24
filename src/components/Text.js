import { createContext, useContext } from "react";
import { Text as RNText, TextInput as RNTextInput, StyleSheet } from "react-native";
import { fontFamilyFor } from "@/theme/fonts";

const InsideText = createContext(false);

// Android ne sélectionne pas la graisse d'une police personnalisée via fontWeight :
// on remplace fontWeight par la famille Inter correspondante.
function withInter(style, inherit) {
    const flat = StyleSheet.flatten(style) ?? {};
    if (flat.fontFamily) return style;
    // Texte imbriqué sans graisse propre : il hérite de la police du parent
    if (inherit && flat.fontWeight == null) return style;
    const { fontWeight, ...rest } = flat;
    return { ...rest, fontFamily: fontFamilyFor(fontWeight) };
}

/** Text de l'app, en Inter. À utiliser à la place de Text de react-native. */
export function Text({ style, ...props }) {
    const inside = useContext(InsideText);
    const text = <RNText {...props} style={withInter(style, inside)} />;
    return inside ? text : <InsideText.Provider value>{text}</InsideText.Provider>;
}

export function TextInput({ style, ...props }) {
    return <RNTextInput {...props} style={withInter(style, false)} />;
}
