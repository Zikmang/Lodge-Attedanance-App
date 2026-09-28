export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'PASS' | 'DUTY';

export interface Occupant {
  id: string;
  name: string;
  active?: boolean;
  rowIndex?: number;
}

export type AttendanceMap = Record<string, AttendanceStatus>;

export interface SheetConfig {
  webAppUrl: string;
  lastSyncedAt?: string;
}

export const INITIAL_OCCUPANTS: string[] = [
  'Adesewa Adedeji',
  'Zikmang Lekmang',
  'Esther Ugwu',
  'Longji Gideon',
  'Mariam Usman',
  'Charles Dian',
  'Nwakaeze Nicole',
  'Salima Anwar',
  'Ejeh Favour',
  'Emmanuel Gabriel',
  'Josh Nyitse',
  'Iyanuoluwa Roseline',
  'Jennifer Simeon',
  'Afiniki Tanko',
  'Jamal Ibraheem',
  'Sadiq  Abubakar',
  'Grace Dogo',
  'Fatima Mohammad',
  'Ukah Victor',
  'Gift Esebame-Usiabulu',
  'Zik Esther',
  'Ummulkulthumi Mohammed',
  'Leruchi Divine',
  'Praise Udom',
];
