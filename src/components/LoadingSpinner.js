import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { COLORS } from "../utils/constants";

const LoadingSpinner = ({
    size = "large",
    color = COLORS.primary,
    message = "Loading...",
    style = {},
}) => {
    return (
        <View style={[styles.container, style]}>
            <ActivityIndicator size={size} color={color} />
            {message && <Text style={styles.message}>{message}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    message: {
        marginTop: 16,
        fontSize: 16,
        color: COLORS.textSecondary,
        textAlign: "center",
    },
});

export default LoadingSpinner;
