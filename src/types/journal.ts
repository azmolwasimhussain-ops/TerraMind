export type JournalMood = 'Great' | 'Good' | 'Okay' | 'Meh';

export type JournalCategory =
  | 'Flora'
  | 'Fauna'
  | 'Weather'
  | 'Sensory'
  | 'Mindfulness'
  | 'Soil & Water'
  | 'Sky'
  | 'Foraged & Found';

export interface JournalEntry {
  id: string;
  title?: string;
  content: string;
  mood: JournalMood;
  categories: JournalCategory[];
  date: string; // ISO timestamp
  missionId?: string; // Associated mission ID if completed during a mission
  missionTitle?: string;
  locationName?: string;
  weatherNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface JournalFilterParams {
  category?: JournalCategory | 'all';
  mood?: JournalMood | 'all';
  searchQuery?: string;
  sortBy?: 'newest' | 'oldest';
}
