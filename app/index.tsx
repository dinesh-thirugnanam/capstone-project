import { Redirect } from "expo-router";

export default function Index() {
    // Always redirect to login for now
    // Auth logic will be handled by the layout components
    return <Redirect href="/(auth)/login" />;
}
