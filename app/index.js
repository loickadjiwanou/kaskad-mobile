import { StyleSheet, Text, View } from "react-native";

export default function Home() {
    return (
        <View style={style.container}>
            <Text>Bienvenue sur Expo Router</Text>
        </View>
    );
}

const style = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
})