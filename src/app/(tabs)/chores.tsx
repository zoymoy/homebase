import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { useFamily } from '@/contexts/FamilyContext';
import { useChores } from '@/hooks/useChores';
import { choresService } from '@/services/chores.service';
import { Chore } from '@/types';
import { format } from 'date-fns';
import { router } from 'expo-router';

export default function ChoresScreen() {
  const { user } = useAuth();
  const { family, members } = useFamily();
  const { todoChores, doneChores, loading } = useChores();
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);

  if (!user || !family) return null;

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      await choresService.createChore(family.id, {
        title: newTitle.trim(),
        createdBy: user.uid,
      });
      setNewTitle('');
      setShowCreate(false);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setCreating(false);
    }
  };

  const handleComplete = async (chore: Chore) => {
    try {
      await choresService.completeChore(family.id, chore.id, user.uid);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleClaim = async (chore: Chore) => {
    try {
      await choresService.claimChore(family.id, chore.id, user.uid, user.displayName);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const sections = [
    { title: 'To Do', data: todoChores },
    ...(doneChores.length > 0 ? [{ title: 'Done', data: doneChores }] : []),
  ];

  const renderChore = ({ item }: { item: Chore }) => {
    const isDone = item.status === 'done';
    const isAssignedToMe = item.assigneeId === user.uid;
    const member = members.find((m) => m.uid === item.assigneeId);

    return (
      <TouchableOpacity onPress={() => router.push(`/chore/${item.id}`)}>
        <Card style={[styles.choreCard, isDone ? styles.choreCardDone : undefined]}>
          <View style={styles.choreRow}>
            <TouchableOpacity
              onPress={() =>
                isDone
                  ? choresService.uncompleteChore(family.id, item.id)
                  : handleComplete(item)
              }
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={isDone ? 'checkmark-circle' : 'ellipse-outline'}
                size={24}
                color={isDone ? Colors.success : Colors.textLight}
              />
            </TouchableOpacity>
            <View style={styles.choreInfo}>
              <Text
                style={[styles.choreTitle, isDone && styles.choreTitleDone]}
              >
                {item.title}
              </Text>
              <View style={styles.choreMetaRow}>
                {item.assigneeName ? (
                  <View style={styles.assigneeBadge}>
                    <Avatar
                      name={item.assigneeName}
                      color={member?.avatarColor ?? Colors.textLight}
                      size={18}
                    />
                    <Text style={styles.assigneeName}>{item.assigneeName}</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => handleClaim(item)}
                    style={styles.claimButton}
                  >
                    <Text style={styles.claimText}>Claim</Text>
                  </TouchableOpacity>
                )}
                {item.deadline && !isDone && (
                  <Text style={styles.deadline}>
                    {format(item.deadline.toDate(), 'MMM d')}
                  </Text>
                )}
              </View>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderChore}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionHeader}>{section.title}</Text>
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <EmptyState
            icon="checkbox-outline"
            title="No chores yet"
            message="Tap + to create the first chore"
          />
        }
        stickySectionHeadersEnabled={false}
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowCreate(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Create Modal */}
      <Modal visible={showCreate} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Chore</Text>
            <Input
              label="What needs to be done?"
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="e.g. Take out the trash"
              autoFocus
            />
            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                onPress={() => {
                  setShowCreate(false);
                  setNewTitle('');
                }}
                variant="outline"
                style={styles.modalButton}
              />
              <Button
                title="Create"
                onPress={handleCreate}
                loading={creating}
                disabled={!newTitle.trim()}
                style={styles.modalButton}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  choreCard: {
    marginBottom: 8,
  },
  choreCardDone: {
    opacity: 0.6,
  },
  choreRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  choreInfo: {
    flex: 1,
  },
  choreTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text,
  },
  choreTitleDone: {
    textDecorationLine: 'line-through',
    color: Colors.textSecondary,
  },
  choreMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 6,
  },
  assigneeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  assigneeName: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  claimButton: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight + '20',
  },
  claimText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
  deadline: {
    fontSize: 12,
    color: Colors.secondary,
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
});
