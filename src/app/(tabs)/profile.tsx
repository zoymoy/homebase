import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Share,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { useFamily } from '@/contexts/FamilyContext';
import { authService } from '@/services/auth.service';
import { createInviteLink } from '@/utils/deeplink';

export default function ProfileScreen() {
  const { user } = useAuth();
  const { family, members } = useFamily();

  if (!user) return null;

  const handleShareInvite = async () => {
    if (!family) return;
    const link = createInviteLink(family.inviteCode);
    try {
      await Share.share({
        message: `Join our family "${family.name}" on HomeBase! Use code: ${family.inviteCode}\n\nOr tap this link: ${link}`,
      });
    } catch (error) {
      // User cancelled share
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => authService.signOut(),
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Card */}
      <Card style={styles.profileCard}>
        <Avatar name={user.displayName} color={user.avatarColor} size={64} />
        <Text style={styles.displayName}>{user.displayName}</Text>
        <Text style={styles.email}>{user.email}</Text>
      </Card>

      {/* Family Info */}
      {family && (
        <>
          <Card>
            <Text style={styles.cardTitle}>{family.name}</Text>
            <Text style={styles.cardSubtitle}>
              {family.homeAddress.formattedAddress}
            </Text>

            <View style={styles.inviteRow}>
              <View>
                <Text style={styles.inviteLabel}>Invite Code</Text>
                <Text style={styles.inviteCode}>{family.inviteCode}</Text>
              </View>
              <TouchableOpacity onPress={handleShareInvite}>
                <Ionicons name="share-outline" size={24} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          </Card>

          {/* Family Members */}
          <Card>
            <Text style={styles.cardTitle}>Family Members</Text>
            {members.map((member) => (
              <View key={member.uid} style={styles.memberRow}>
                <Avatar name={member.displayName} color={member.avatarColor} size={36} />
                <Text style={styles.memberName}>{member.displayName}</Text>
                {member.uid === family.createdBy && (
                  <View style={styles.creatorBadge}>
                    <Text style={styles.creatorText}>Creator</Text>
                  </View>
                )}
              </View>
            ))}
          </Card>
        </>
      )}

      <Button
        title="Sign Out"
        onPress={handleSignOut}
        variant="outline"
        style={styles.signOutButton}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  profileCard: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  displayName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 12,
  },
  email: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  inviteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background,
    padding: 12,
    borderRadius: 8,
  },
  inviteLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  inviteCode: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 2,
    marginTop: 2,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text,
    flex: 1,
  },
  creatorBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: Colors.primary + '15',
  },
  creatorText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
  },
  signOutButton: {
    marginTop: 8,
  },
});
