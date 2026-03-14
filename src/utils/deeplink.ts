import * as Linking from 'expo-linking';

export function createInviteLink(inviteCode: string): string {
  return Linking.createURL('join', {
    queryParams: { code: inviteCode },
  });
}

export function parseInviteCode(url: string): string | null {
  try {
    const parsed = Linking.parse(url);
    return (parsed.queryParams?.code as string) ?? null;
  } catch {
    return null;
  }
}
