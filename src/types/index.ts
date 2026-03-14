import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

export type Timestamp = FirebaseFirestoreTypes.Timestamp;

export interface User {
  uid: string;
  displayName: string;
  email: string;
  avatarColor: string;
  familyId: string | null;
  fcmTokens: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface HomeAddress {
  formattedAddress: string;
  lat: number;
  lng: number;
}

export interface Family {
  id: string;
  name: string;
  homeAddress: HomeAddress;
  memberIds: string[];
  inviteCode: string;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type RecurrenceType = 'daily' | 'weekly' | 'custom';

export interface Recurrence {
  type: RecurrenceType;
  daysOfWeek?: number[]; // 0-6, Sunday = 0
  intervalDays?: number;
}

export type ChoreStatus = 'todo' | 'done';

export interface Chore {
  id: string;
  title: string;
  assigneeId: string | null;
  assigneeName: string | null;
  status: ChoreStatus;
  deadline: Timestamp | null;
  createdBy: string;
  completedBy: string | null;
  completedAt: Timestamp | null;
  recurrence: Recurrence | null;
  reminder24hSent: boolean;
  reminder1hSent: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ListItem {
  id: string;
  text: string;
  checked: boolean;
  addedBy: string;
  addedByName: string;
  createdAt: Timestamp;
  checkedAt: Timestamp | null;
}

export type ListType = 'grocery' | 'errands';

export interface ShoppingList {
  id: ListType;
  items: ListItem[];
  updatedAt: Timestamp;
}

export type EtaStatus = 'active' | 'arrived' | 'cancelled';

export interface EtaEvent {
  id: string;
  userId: string;
  userName: string;
  startLocation: { lat: number; lng: number };
  etaMinutes: number;
  status: EtaStatus;
  createdAt: Timestamp;
}

export interface WidgetChore {
  id: string;
  title: string;
  assigneeName: string | null;
  assigneeColor: string | null;
  deadline: string | null; // ISO string for widget
}

export interface WidgetData {
  chores: WidgetChore[];
  lastUpdated: string;
}
