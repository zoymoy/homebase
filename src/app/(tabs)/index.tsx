import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useFamily } from '@/contexts/FamilyContext';
import { useChores } from '@/hooks/useChores';
import { useEta } from '@/hooks/useEta';
import { format } from 'date-fns';
import { router } from 'expo-router';

export default function HomeScreen() {
  const { user } = useAuth();
  const { family, members } = useFamily();
  const { myChores, todoChores } = useChores();
  const { myActiveEta, otherEtas, sendEta, sending } = useEta();

  if (!user || !family) return null;

  const userChores = myChores(user.uid);

  const handleSendEta = async () => {
    try {
      // TODO: Use actual Google API key from config
      await sendEta('YOUR_GOOGLE_API_KEY');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* ETA Banner */}
      {myActiveEta && (
        <Card style={styles.etaBanner}>
          <View style={styles.etaBannerContent}>
            <Ionicons name="navigate" size={20} color={Colors.primary} />
            <Text style={styles.etaBannerText}>
              You're on your way home (~{myActiveEta.etaMinutes} min)
            </Text>
          </View>
        </Card>
      )}

      {/* I'm On My Way Button */}
      {!myActiveEta && (
        <TouchableOpacity
          style={styles.etaButton}
          onPress={handleSendEta}
          disabled={sending}
          activeOpacity={0.8}
        >
          {sending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="navigate" size={24} color="#fff" />
              <Text style={styles.etaButtonText}>I'm On My Way</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {/* Other family ETA cards */}
      {otherEtas.map((eta) => {
        const member = members.find((m) => m.uid === eta.userId);
        return (
          <Card key={eta.id} style={styles.etaCard}>
            <View style={styles.etaCardContent}>
              <Avatar
                name={eta.userName}
                color={member?.avatarColor ?? Colors.primary}
                size={32}
              />
              <View style={styles.etaCardInfo}>
                <Text style={styles.etaCardName}>{eta.userName}</Text>
                <Text style={styles.etaCardTime}>
                  On their way home — ~{eta.etaMinutes} min
                </Text>
              </View>
            </View>
          </Card>
        );
      })}

      {/* My Chores Today */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>My Chores</Text>
        {userChores.length === 0 ? (
          <Card>
            <Text style={styles.emptyText}>No chores assigned to you</Text>
          </Card>
        ) : (
          userChores.slice(0, 5).map((chore) => (
            <TouchableOpacity
              key={chore.id}
              onPress={() => router.push(`/chore/${chore.id}`)}
            >
              <Card style={styles.choreCard}>
                <Text style={styles.choreTitle}>{chore.title}</Text>
                {chore.deadline && (
                  <Text style={styles.choreDeadline}>
                    Due {format(chore.deadline.toDate(), 'MMM d, h:mm a')}
                  </Text>
                )}
              </Card>
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Family Activity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Available Chores</Text>
        {todoChores.filter((c) => !c.assigneeId).length === 0 ? (
          <Card>
            <Text style={styles.emptyText}>No unassigned chores</Text>
          </Card>
        ) : (
          todoChores
            .filter((c) => !c.assigneeId)
            .slice(0, 3)
            .map((chore) => (
              <TouchableOpacity
                key={chore.id}
                onPress={() => router.push(`/chore/${chore.id}`)}
              >
                <Card style={styles.choreCard}>
                  <Text style={styles.choreTitle}>{chore.title}</Text>
                </Card>
              </TouchableOpacity>
            ))
        )}
      </View>
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
    gap: 12,
  },
  etaButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  etaButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  etaBanner: {
    backgroundColor: '#EBF5FF',
    borderColor: Colors.primary,
    borderWidth: 1,
  },
  etaBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  etaBannerText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  etaCard: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.secondary,
  },
  etaCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  etaCardInfo: {
    flex: 1,
  },
  etaCardName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  etaCardTime: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  section: {
    marginTop: 8,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  choreCard: {
    marginBottom: 0,
  },
  choreTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text,
  },
  choreDeadline: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
});
