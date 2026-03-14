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

export default function JoinFamilyScreen() {
  const { user, setUser } = useAuth();
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    if (!inviteCode) {
      Alert.alert('Error', 'Please enter an invite code');
      return;
    }
    if (!user) return;

    setLoading(true);
    try {
      const family = await familyService.joinFamily(inviteCode.trim(), user.uid);
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
          <Text style={styles.title}>Join a Family</Text>
          <Text style={styles.subtitle}>
            Enter the invite code shared by your family member
          </Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Invite Code"
            value={inviteCode}
            onChangeText={(text) => setInviteCode(text.toUpperCase())}
            placeholder="e.g. ABC12345"
            autoCapitalize="characters"
            maxLength={8}
          />
          <Button
            title="Join Family"
            onPress={handleJoin}
            loading={loading}
          />
        </View>

        <Button
          title="Create New Family Instead"
          onPress={() => router.back()}
          variant="outline"
          style={styles.backButton}
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
  backButton: {
    marginTop: 16,
  },
});
