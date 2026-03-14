import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';
import { Colors } from '@/constants/colors';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { useFamily } from '@/contexts/FamilyContext';
import { useList } from '@/hooks/useLists';
import { listsService } from '@/services/lists.service';
import { ListItem, ListType } from '@/types';

export default function ListsScreen() {
  const { user } = useAuth();
  const { family } = useFamily();
  const [activeList, setActiveList] = useState<ListType>('grocery');
  const { list, uncheckedItems, checkedItems } = useList(activeList);
  const [newItemText, setNewItemText] = useState('');
  const [showChecked, setShowChecked] = useState(false);

  if (!user || !family) return null;

  const handleAddItem = async () => {
    if (!newItemText.trim()) return;
    try {
      await listsService.addItem(family.id, activeList, {
        text: newItemText.trim(),
        checked: false,
        addedBy: user.uid,
        addedByName: user.displayName,
      });
      setNewItemText('');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleToggle = async (itemId: string) => {
    if (!list) return;
    try {
      await listsService.toggleItem(family.id, activeList, list.items, itemId);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleRemove = async (itemId: string) => {
    if (!list) return;
    try {
      await listsService.removeItem(family.id, activeList, list.items, itemId);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleClearChecked = async () => {
    if (!list) return;
    Alert.alert(
      'Clear Checked Items',
      'Remove all checked items from the list?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => listsService.clearChecked(family.id, activeList, list.items),
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: ListItem }) => (
    <Card style={[styles.itemCard, item.checked ? styles.itemCardChecked : undefined]}>
      <View style={styles.itemRow}>
        <TouchableOpacity
          onPress={() => handleToggle(item.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name={item.checked ? 'checkmark-circle' : 'ellipse-outline'}
            size={24}
            color={item.checked ? Colors.success : Colors.textLight}
          />
        </TouchableOpacity>
        <View style={styles.itemInfo}>
          <Text style={[styles.itemText, item.checked && styles.itemTextChecked]}>
            {item.text}
          </Text>
          <Text style={styles.itemMeta}>{item.addedByName}</Text>
        </View>
        <TouchableOpacity
          onPress={() => handleRemove(item.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close-circle-outline" size={20} color={Colors.textLight} />
        </TouchableOpacity>
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      {/* Tab Toggle */}
      <View style={styles.tabBar}>
        {(['grocery', 'errands'] as ListType[]).map((type) => (
          <TouchableOpacity
            key={type}
            style={[styles.tab, activeList === type && styles.tabActive]}
            onPress={() => setActiveList(type)}
          >
            <Text
              style={[
                styles.tabText,
                activeList === type && styles.tabTextActive,
              ]}
            >
              {type === 'grocery' ? 'Grocery' : 'Errands'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Add Item Input */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={newItemText}
          onChangeText={setNewItemText}
          placeholder={`Add ${activeList === 'grocery' ? 'grocery' : 'errand'} item...`}
          placeholderTextColor={Colors.textLight}
          onSubmitEditing={handleAddItem}
          returnKeyType="done"
        />
        <TouchableOpacity
          onPress={handleAddItem}
          style={styles.addButton}
          disabled={!newItemText.trim()}
        >
          <Ionicons
            name="add-circle"
            size={36}
            color={newItemText.trim() ? Colors.primary : Colors.textLight}
          />
        </TouchableOpacity>
      </View>

      {/* List */}
      <FlatList
        data={uncheckedItems}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <EmptyState
            icon="cart-outline"
            title="List is empty"
            message="Add items using the input above"
          />
        }
        ListFooterComponent={
          checkedItems.length > 0 ? (
            <View>
              <TouchableOpacity
                style={styles.checkedHeader}
                onPress={() => setShowChecked(!showChecked)}
              >
                <Text style={styles.checkedHeaderText}>
                  Checked off ({checkedItems.length})
                </Text>
                <Ionicons
                  name={showChecked ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={Colors.textSecondary}
                />
              </TouchableOpacity>
              {showChecked && (
                <>
                  {checkedItems.map((item) => (
                    <View key={item.id}>{renderItem({ item })}</View>
                  ))}
                  <TouchableOpacity
                    onPress={handleClearChecked}
                    style={styles.clearButton}
                  >
                    <Text style={styles.clearButtonText}>Clear checked items</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  tabBar: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 0,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: '#fff',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text,
  },
  addButton: {
    padding: 2,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  itemCard: {
    marginBottom: 6,
    padding: 12,
  },
  itemCardChecked: {
    opacity: 0.6,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  itemInfo: {
    flex: 1,
  },
  itemText: {
    fontSize: 15,
    color: Colors.text,
  },
  itemTextChecked: {
    textDecorationLine: 'line-through',
    color: Colors.textSecondary,
  },
  itemMeta: {
    fontSize: 11,
    color: Colors.textLight,
    marginTop: 2,
  },
  checkedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginTop: 8,
  },
  checkedHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  clearButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 4,
  },
  clearButtonText: {
    color: Colors.error,
    fontSize: 13,
    fontWeight: '500',
  },
});
