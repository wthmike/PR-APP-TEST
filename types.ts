export type SportType = 'cricket' | 'netball';
export type MatchStatus = 'UPCOMING' | 'LIVE' | 'FT' | 'RESULT';

export interface GameEvent {
  type: string;
  player: string;
  time: string;
  desc: string;
  duckType?: 'golden' | 'regular' | null;
}

export interface PlayerStats {
  name: string;
  runs: number;
  balls: number;
  status: 'batting' | 'out' | 'waiting' | 'not out';
  dismissal: string;
  bowlBalls?: number;
  bowlRuns?: number;
  bowlWkts?: number;
}

export interface Match {
  id: string;
  sport: SportType;
  teamName: string;
  opponent: string;
  status: MatchStatus;
  league?: string;
  yearGroup?: string; // New field
  lastUpdated: number;
  events: GameEvent[];
  
  // Netball Specific
  period?: string; // Q1, Q2, etc.
  periodIdx?: number;
  
  // Cricket Specific
  format?: string;
  maxOvers?: number;
  homeScore: number;
  awayScore: number;
  homeWickets?: number;
  awayWickets?: number;
  result?: string;
  
  // Cricket Detailed Logic
  penriceStatus?: 'batting' | 'bowling'; // Relative to 'teamName'
  currentOver?: number;
  currentStriker?: string;
  currentNonStriker?: string;
  currentBowler?: string;
  
  homeTeamStats?: PlayerStats[]; // usually Penrice
  awayTeamStats?: PlayerStats[]; // usually Opponent
  
  // History for Undo
  history?: any[]; 
}