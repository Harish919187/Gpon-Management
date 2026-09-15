export interface GponRecord {
  id: string;
  oltName: string;
  oltNumber: string;
  portNumber: string;
  location: string;
  status: 'Active' | 'Inactive' | 'Pending' | string;
}

export type SortField = keyof GponRecord;
export type SortOrder = 'asc' | 'desc';
