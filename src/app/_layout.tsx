import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { FamilyProvider } from '@/contexts/FamilyContext';
import { Colors } from '@/constants/colors';
import { notificationsService } from '@/services/notifications.service';

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      // Not signed in — redirect to sign in
      router.replace('/(auth)/sign-in');
    } else if (user && !user.familyId && !inAuthGroup) {
      // Signed in but no family — redirect to create/join
      router.replace('/(auth)/create-family');
    } else if (user && user.familyId && inAuthGroup) {
      // Signed in with family — redirect to tabs
      router.replace('/(tabs)');
    }
  }, [user, loading, segments]);

  useEffect(() => {
    if (user?.uid) {
      notificationsService.requestPermission().then((enabled) => {
        if (enabled) {
          notificationsService.registerToken(user.uid);
          notificationsService.setupTokenRefresh(user.uid);
        }
      });
      const cleanup = notificationsService.setupNotificationListeners();
      return cleanup;
    }
  }, [user?.uid]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="chore/[id]"
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: Colors.surface },
          headerTintColor: Colors.text,
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <FamilyProvider>
        <RootLayoutNav />
      </FamilyProvider>
    </AuthProvider>
  );
}
