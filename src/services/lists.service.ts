import { db } from '@/config/firebase';
import { ListItem, ListType, ShoppingList } from '@/types';
import firestore from '@react-native-firebase/firestore';

function listRef(familyId: string, listType: ListType) {
  return db.collection('families').doc(familyId).collection('lists').doc(listType);
}

export const listsService = {
  subscribeToList(
    familyId: string,
    listType: ListType,
    callback: (list: ShoppingList) => void
  ) {
    return listRef(familyId, listType).onSnapshot((doc) => {
      if (doc.exists()) {
        callback(doc.data() as ShoppingList);
      }
    });
  },

  async addItem(
    familyId: string,
    listType: ListType,
    item: Omit<ListItem, 'id' | 'createdAt' | 'checkedAt'>
  ): Promise<void> {
    const newItem: ListItem = {
      ...item,
      id: db.collection('_').doc().id, // generate unique ID
      createdAt: firestore.Timestamp.now(),
      checkedAt: null,
    };

    await listRef(familyId, listType).update({
      items: firestore.FieldValue.arrayUnion(newItem),
      updatedAt: firestore.Timestamp.now(),
    });
  },

  async toggleItem(
    familyId: string,
    listType: ListType,
    items: ListItem[],
    itemId: string
  ): Promise<void> {
    const updatedItems = items.map((item) =>
      item.id === itemId
        ? {
            ...item,
            checked: !item.checked,
            checkedAt: !item.checked ? firestore.Timestamp.now() : null,
          }
        : item
    );

    await listRef(familyId, listType).update({
      items: updatedItems,
      updatedAt: firestore.Timestamp.now(),
    });
  },

  async removeItem(
    familyId: string,
    listType: ListType,
    items: ListItem[],
    itemId: string
  ): Promise<void> {
    const updatedItems = items.filter((item) => item.id !== itemId);

    await listRef(familyId, listType).update({
      items: updatedItems,
      updatedAt: firestore.Timestamp.now(),
    });
  },

  async clearChecked(
    familyId: string,
    listType: ListType,
    items: ListItem[]
  ): Promise<void> {
    const uncheckedItems = items.filter((item) => !item.checked);

    await listRef(familyId, listType).update({
      items: uncheckedItems,
      updatedAt: firestore.Timestamp.now(),
    });
  },
};
