export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'PASS' | 'DUTY';

export type ExcuseStatus = 'none' | 'provided';

export interface AttendanceRecord {
  status: AttendanceStatus;
  excuseStatus: ExcuseStatus;
  excuseReason?: string;
}

export type AttendanceValue = AttendanceStatus | AttendanceRecord;

export type AttendanceMap = Record<string, AttendanceValue>;

export function getAttendanceRecord(val: AttendanceValue | undefined): AttendanceRecord {
  if (!val) {
    return { status: 'PRESENT', excuseStatus: 'none', excuseReason: '' };
  }
  if (typeof val === 'string') {
    return { status: val, excuseStatus: 'none', excuseReason: '' };
  }
  const status = val.status || 'PRESENT';
  const excuseStatus = status === 'ABSENT' ? (val.excuseStatus || 'none') : 'none';
  const excuseReason = status === 'ABSENT' && excuseStatus === 'provided' ? (val.excuseReason || '') : '';
  return {
    status,
    excuseStatus,
    excuseReason,
  };
}

export interface Occupant {
  id: string;
  name: string;
  active?: boolean;
  rowIndex?: number;
}

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
