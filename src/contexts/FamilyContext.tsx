import React, { createContext, useContext, useEffect, useState } from 'react';
import { Family, User } from '@/types';
import { familyService } from '@/services/family.service';
import { useAuth } from './AuthContext';

interface FamilyContextType {
  family: Family | null;
  members: User[];
  loading: boolean;
  refreshMembers: () => Promise<void>;
}

const FamilyContext = createContext<FamilyContextType>({
  family: null,
  members: [],
  loading: true,
  refreshMembers: async () => {},
});

export function FamilyProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [family, setFamily] = useState<Family | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.familyId) {
      setFamily(null);
      setMembers([]);
      setLoading(false);
      return;
    }

    const unsubscribe = familyService.subscribeToFamily(user.familyId, (fam) => {
      setFamily(fam);
      // Fetch members whenever family data changes
      familyService.getFamilyMembers(fam.memberIds).then(setMembers);
      setLoading(false);
    });

    return unsubscribe;
  }, [user?.familyId]);

  const refreshMembers = async () => {
    if (family) {
      const m = await familyService.getFamilyMembers(family.memberIds);
      setMembers(m);
    }
  };

  return (
    <FamilyContext.Provider value={{ family, members, loading, refreshMembers }}>
      {children}
    </FamilyContext.Provider>
  );
}

export const useFamily = () => useContext(FamilyContext);
