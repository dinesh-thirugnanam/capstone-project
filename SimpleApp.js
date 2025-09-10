import { Text, View } from "react-native";
import { PaperProvider } from "react-native-paper";

export default function SimpleApp() {
    return (
        <PaperProvider>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
                <Text style={{ fontSize: 24, color: '#333' }}>
                    ✅ Attendance App is Working!
                </Text>
                <Text style={{ fontSize: 16, color: '#666', marginTop: 20 }}>
                    The app is loading successfully.
                </Text>
            </View>
        </PaperProvider>
    );
}
