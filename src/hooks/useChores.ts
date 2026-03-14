import { useEffect, useState } from 'react';
import { Chore } from '@/types';
import { choresService } from '@/services/chores.service';
import { useFamily } from '@/contexts/FamilyContext';

export function useChores() {
  const { family } = useFamily();
  const [chores, setChores] = useState<Chore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!family?.id) {
      setChores([]);
      setLoading(false);
      return;
    }

    const unsubscribe = choresService.subscribeToChores(family.id, (data) => {
      setChores(data);
      setLoading(false);
    });

    return unsubscribe;
  }, [family?.id]);

  const todoChores = chores.filter((c) => c.status === 'todo');
  const doneChores = chores.filter((c) => c.status === 'done');
  const availableChores = todoChores.filter((c) => !c.assigneeId);
  const myChores = (userId: string) => todoChores.filter((c) => c.assigneeId === userId);

  return { chores, todoChores, doneChores, availableChores, myChores, loading };
}
