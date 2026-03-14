import { useEffect, useState } from 'react';
import { ListType, ShoppingList } from '@/types';
import { listsService } from '@/services/lists.service';
import { useFamily } from '@/contexts/FamilyContext';

export function useList(listType: ListType) {
  const { family } = useFamily();
  const [list, setList] = useState<ShoppingList | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!family?.id) {
      setList(null);
      setLoading(false);
      return;
    }

    const unsubscribe = listsService.subscribeToList(family.id, listType, (data) => {
      setList(data);
      setLoading(false);
    });

    return unsubscribe;
  }, [family?.id, listType]);

  const uncheckedItems = list?.items.filter((i) => !i.checked) ?? [];
  const checkedItems = list?.items.filter((i) => i.checked) ?? [];

  return { list, uncheckedItems, checkedItems, loading };
}
