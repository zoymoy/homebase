import { useEffect, useState } from 'react';
import { EtaEvent } from '@/types';
import { etaService } from '@/services/eta.service';
import { locationService } from '@/services/location.service';
import { useFamily } from '@/contexts/FamilyContext';
import { useAuth } from '@/contexts/AuthContext';

export function useEta() {
  const { family } = useFamily();
  const { user } = useAuth();
  const [activeEtas, setActiveEtas] = useState<EtaEvent[]>([]);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!family?.id) {
      setActiveEtas([]);
      setLoading(false);
      return;
    }

    const unsubscribe = etaService.subscribeToActiveEtas(family.id, (events) => {
      setActiveEtas(events);
      setLoading(false);
    });

    return unsubscribe;
  }, [family?.id]);

  const sendEta = async (googleApiKey: string) => {
    if (!family || !user) return;

    setSending(true);
    try {
      const hasPermission = await locationService.requestPermission();
      if (!hasPermission) {
        throw new Error('Location permission is required');
      }

      const location = await locationService.getCurrentLocation();
      const etaMinutes = await locationService.getEtaMinutes(
        location,
        family.homeAddress,
        googleApiKey
      );

      await etaService.createEtaEvent(family.id, {
        userId: user.uid,
        userName: user.displayName,
        startLocation: location,
        etaMinutes,
      });
    } finally {
      setSending(false);
    }
  };

  const myActiveEta = activeEtas.find((e) => e.userId === user?.uid);
  const otherEtas = activeEtas.filter((e) => e.userId !== user?.uid);

  return { activeEtas, myActiveEta, otherEtas, sendEta, sending, loading };
}
