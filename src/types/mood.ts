export interface MoodStatus {
  id: string;
  name: string;
  emoji: string;
  color: string;
  bgColor: string;
  description: string;
}

export const MOOD_STATUSES: MoodStatus[] = [
  {
    id: 'online',
    name: 'Online',
    emoji: '🟢',
    color: '#10b981',
    bgColor: '#10b98120',
    description: 'Available to chat'
  },
  {
    id: 'busy',
    name: 'Busy',
    emoji: '🔴',
    color: '#ef4444',
    bgColor: '#ef444420',
    description: 'In a meeting or working'
  },
  {
    id: 'gaming',
    name: 'Gaming',
    emoji: '🎮',
    color: '#8b5cf6',
    bgColor: '#8b5cf620',
    description: 'Playing games'
  },
  {
    id: 'chill',
    name: 'Chill',
    emoji: '😎',
    color: '#06b6d4',
    bgColor: '#06b6d420',
    description: 'Relaxed and casual'
  },
  {
    id: 'working',
    name: 'Working',
    emoji: '💼',
    color: '#f59e0b',
    bgColor: '#f59e0b20',
    description: 'Focused on work'
  },
  {
    id: 'studying',
    name: 'Studying',
    emoji: '📚',
    color: '#3b82f6',
    bgColor: '#3b82f620',
    description: 'Learning mode'
  },
  {
    id: 'away',
    name: 'Away',
    emoji: '🟡',
    color: '#eab308',
    bgColor: '#eab30820',
    description: 'Away from keyboard'
  },
  {
    id: 'invisible',
    name: 'Invisible',
    emoji: '👻',
    color: '#6b7280',
    bgColor: '#6b728020',
    description: 'Appear offline'
  },
  {
    id: 'listening',
    name: 'Listening',
    emoji: '🎧',
    color: '#ec4899',
    bgColor: '#ec489920',
    description: 'Listening to music'
  },
  {
    id: 'watching',
    name: 'Watching',
    emoji: '📺',
    color: '#f97316',
    bgColor: '#f9731620',
    description: 'Watching content'
  }
];

export const getMoodById = (id: string): MoodStatus | undefined => {
  return MOOD_STATUSES.find(mood => mood.id === id);
};

export const getMoodByEmoji = (emoji: string): MoodStatus | undefined => {
  return MOOD_STATUSES.find(mood => mood.emoji === emoji);
};
