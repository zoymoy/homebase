import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/colors';
import { familyService } from '@/services/family.service';
import { useAuth } from '@/contexts/AuthContext';

export default function CreateFamilyScreen() {
  const { user, setUser } = useAuth();
  const [familyName, setFamilyName] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!familyName || !address) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (!user) return;

    setLoading(true);
    try {
      const family = await familyService.createFamily(
        familyName.trim(),
        {
          formattedAddress: address.trim(),
          lat: 0, // Will be geocoded in a future enhancement
          lng: 0,
        },
        user.uid
      );
      setUser({ ...user, familyId: family.id });
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Create Your Family</Text>
          <Text style={styles.subtitle}>
            Set up your family group so everyone can coordinate
          </Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Family Name"
            value={familyName}
            onChangeText={setFamilyName}
            placeholder='e.g. "The Smith Family"'
          />
          <Input
            label="Home Address"
            value={address}
            onChangeText={setAddress}
            placeholder="123 Main St, City, State"
            multiline
          />
          <Button
            title="Create Family"
            onPress={handleCreate}
            loading={loading}
          />
        </View>

        <Button
          title="Join Existing Family"
          onPress={() => router.push('/(auth)/join-family')}
          variant="outline"
          style={styles.joinButton}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  form: {
    gap: 4,
  },
  joinButton: {
    marginTop: 16,
  },
});
