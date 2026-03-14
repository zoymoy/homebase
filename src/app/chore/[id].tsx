import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { useFamily } from '@/contexts/FamilyContext';
import { useChores } from '@/hooks/useChores';
import { choresService } from '@/services/chores.service';
import { format } from 'date-fns';

export default function ChoreDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { family, members } = useFamily();
  const { chores } = useChores();

  if (!user || !family) return null;

  const chore = chores.find((c) => c.id === id);

  if (!chore) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const assignee = members.find((m) => m.uid === chore.assigneeId);
  const isDone = chore.status === 'done';

  const handleClaim = async () => {
    try {
      await choresService.claimChore(family.id, chore.id, user.uid, user.displayName);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleComplete = async () => {
    try {
      await choresService.completeChore(family.id, chore.id, user.uid);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Chore', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await choresService.deleteChore(family.id, chore.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Chore Detail' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Card>
          <View style={styles.statusRow}>
            <Ionicons
              name={isDone ? 'checkmark-circle' : 'ellipse-outline'}
              size={28}
              color={isDone ? Colors.success : Colors.textLight}
            />
            <Text style={[styles.title, isDone && styles.titleDone]}>
              {chore.title}
            </Text>
          </View>

          {/* Assignee */}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Assigned to</Text>
            {assignee ? (
              <View style={styles.assigneeInfo}>
                <Avatar
                  name={assignee.displayName}
                  color={assignee.avatarColor}
                  size={24}
                />
                <Text style={styles.detailValue}>{assignee.displayName}</Text>
              </View>
            ) : (
              <Text style={styles.detailValueLight}>Unassigned</Text>
            )}
          </View>

          {/* Deadline */}
          {chore.deadline && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Deadline</Text>
              <Text style={styles.detailValue}>
                {format(chore.deadline.toDate(), 'EEEE, MMM d, yyyy h:mm a')}
              </Text>
            </View>
          )}

          {/* Recurrence */}
          {chore.recurrence && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Repeats</Text>
              <Text style={styles.detailValue}>
                {chore.recurrence.type === 'daily'
                  ? 'Daily'
                  : chore.recurrence.type === 'weekly'
                  ? 'Weekly'
                  : `Every ${chore.recurrence.intervalDays} days`}
              </Text>
            </View>
          )}

          {/* Created */}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Created</Text>
            <Text style={styles.detailValue}>
              {format(chore.createdAt.toDate(), 'MMM d, yyyy')}
            </Text>
          </View>
        </Card>

        {/* Actions */}
        <View style={styles.actions}>
          {!isDone && !chore.assigneeId && (
            <Button title="Claim This Chore" onPress={handleClaim} />
          )}
          {!isDone && (
            <Button title="Mark as Done" onPress={handleComplete} variant="secondary" />
          )}
          {isDone && (
            <Button
              title="Mark as Not Done"
              onPress={() => choresService.uncompleteChore(family.id, chore.id)}
              variant="outline"
            />
          )}
          <Button title="Delete Chore" onPress={handleDelete} variant="danger" />
        </View>
      </ScrollView>
    </>
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
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    flex: 1,
  },
  titleDone: {
    textDecorationLine: 'line-through',
    color: Colors.textSecondary,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  detailValueLight: {
    fontSize: 14,
    color: Colors.textLight,
    fontStyle: 'italic',
  },
  assigneeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actions: {
    gap: 10,
  },
});
