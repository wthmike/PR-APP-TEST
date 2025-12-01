
export type SportType = 'cricket' | 'netball' | 'rugby' | 'football';
export type MatchStatus = 'UPCOMING' | 'LIVE' | 'FT' | 'RESULT';

export interface GameEvent {
  type: string;
  player: string;
  time: string;
  desc: string;
  duckType?: 'golden' | 'regular' | null;
  team?: 'home' | 'away';
}

export interface PlayerStats {
  name: string;
  runs: number; // Used as 'Points' in Rugby/Football (Goals)
  balls: number;
  status: 'batting' | 'out' | 'waiting' | 'not out' | 'starting' | 'sub';
  dismissal: string; // Used for Cards in Football (Yellow/Red)
  bowlBalls?: number;
  bowlRuns?: number;
  bowlWkts?: number;
}

export interface MatchReport {
  title: string;
  author: string;
  body: string;
  image?: string;
  publishedAt: number;
  tags?: string[];
}

export interface Match {
  id: string;
  sport: SportType;
  teamName: string;
  opponent: string;
  status: MatchStatus;
  league?: string;
  yearGroup?: string;
  time?: string;
  sortOrder?: number;
  lastUpdated: number;
  events: GameEvent[];
  
  // Custom Team Colors
  homeTeamColor?: string;
  awayTeamColor?: string;
  
  // News / Report
  report?: MatchReport;

  // Netball/Football Specific
  period?: string; // Q1, 1st Half, etc.
  periodIdx?: number;
  
  // Cricket Specific
  format?: string;
  maxOvers?: number;
  homeScore: number;
  awayScore: number;
  homeWickets?: number;
  awayWickets?: number;
  result?: string;
  
  // Football Specific
  footballStats?: {
      homeCorners: number;
      awayCorners: number;
      homeFouls: number;
      awayFouls: number;
      homeYellows: number;
      awayYellows: number;
      homeReds: number;
      awayReds: number;
      // Advanced Stats
      enableAdvancedStats?: boolean;
      possessionHome?: number; // ms
      possessionAway?: number; // ms
      possessionStatus?: 'home' | 'away' | 'neutral';
      lastPossessionUpdate?: number; // timestamp
  };

  // Cricket Detailed Logic
  penriceStatus?: 'batting' | 'bowling';
  currentOver?: number;
  currentStriker?: string;
  currentNonStriker?: string;
  currentBowler?: string;
  
  homeTeamStats?: PlayerStats[]; // usually Penrice
  awayTeamStats?: PlayerStats[]; // usually Opponent
  
  // History for Undo
  history?: any[]; 
}