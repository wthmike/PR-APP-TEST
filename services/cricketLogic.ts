import { Match, GameEvent, PlayerStats } from '../types';
import { MatchesService } from './firebase';

// Phrasings for commentary
const PHRASES: Record<string, string[]> = {
  0: ["Solid defense.", "Straight to the fielder.", "Beaten outside off.", "No run.", "Good line and length.", "Watchful play.", "Can't get that away.", "Well fielded."],
  1: ["Quick single taken.", "Pushed into the gap.", "Strike rotated.", "Good running.", "Dropped fast and they scramble.", "Working it around."],
  2: ["Coming back for two.", "Good running between the wickets.", "Misfield allows the second.", "Nice placement for a couple.", "Pushing the fielder."],
  3: ["Great running! Three taken.", "Chased down just inside the rope.", "They push hard for the third.", "Excellent fitness shown."],
  4: ["CRUNCHED! Through the covers!", "Glorious shot! Four runs.", "Raced to the fence!", "Elegant drive!", "Short and punished!", "Finds the gap beautifully!"],
  6: ["MAXIMUM! That is huge!", "Into the next postcode!", "Clean hitting!", "Out of the ground!", "That's gone into orbit!", "Monster hit over the ropes!"],
};

export const CricketLogic = {
  setupTeams: async (match: Match, homeList: string, awayList: string, batFirst: 'penrice' | 'opponent', overs: number) => {
    const createStats = (names: string[], isBatting: boolean): PlayerStats[] => names.map((name, i) => ({ 
      name, runs: 0, balls: 0, status: isBatting && i < 2 ? 'batting' : 'waiting', dismissal: '', bowlBalls: 0, bowlRuns: 0, bowlWkts: 0 
    }));

    const hL = homeList.split('\n').map(n=>n.trim()).filter(n=>n);
    const aL = awayList.split('\n').map(n=>n.trim()).filter(n=>n);
    const isPenBat = batFirst === 'penrice';

    await MatchesService.update(match.id, {
      homeTeamStats: createStats(hL, isPenBat), 
      awayTeamStats: createStats(aL, !isPenBat), 
      currentStriker: isPenBat ? hL[0] : aL[0], 
      currentNonStriker: isPenBat ? hL[1] : aL[1], 
      penriceStatus: isPenBat ? 'batting' : 'bowling', 
      currentOver: 0.0, 
      maxOvers: overs,
      format: `${overs} Overs`,
      homeScore: 0, homeWickets: 0, awayScore: 0, awayWickets: 0, 
    });
  },

  manualScoreUpdate: async (match: Match, type: 'runs' | 'wickets' | 'overs', value: number, isHome?: boolean) => {
     let field = '';
     if (type === 'overs') {
         field = 'currentOver';
     } else if (type === 'runs') {
         field = isHome ? 'homeScore' : 'awayScore';
     } else {
         field = isHome ? 'homeWickets' : 'awayWickets';
     }
     await MatchesService.update(match.id, { [field]: value });
  },

  endOver: async (match: Match) => {
    let nO = match.currentOver || 0;
    
    // FIX: Only increment to next integer if we aren't already there.
    // If processBall set us to 1.0 (End of Over 1), we stay at 1.0 for start of Over 2.
    // If we are at 0.4 (manual end), we round up to 1.0.
    if (nO % 1 !== 0) {
        nO = Math.floor(nO) + 1;
    }

    await MatchesService.update(match.id, {
        currentOver: nO,
        currentStriker: match.currentNonStriker,
        currentNonStriker: match.currentStriker,
        currentBowler: '',
        events: [...(match.events||[]), { type: 'END OVER', player: '', time: `Ov ${nO}`, desc: 'End of Over.' }],
    });
  },

  switchInnings: async (match: Match) => {
    const isCurrentlyBatting = match.penriceStatus === 'batting';
    const newStatus = isCurrentlyBatting ? 'bowling' : 'batting';
    const prevBattingStatsKey = isCurrentlyBatting ? 'homeTeamStats' : 'awayTeamStats';
    const nextBattingStatsKey = isCurrentlyBatting ? 'awayTeamStats' : 'homeTeamStats';

    // Deep copy arrays
    const prevBattingList = (isCurrentlyBatting ? match.homeTeamStats : match.awayTeamStats || []).map(p => ({...p}));
    const nextBattingList = (isCurrentlyBatting ? match.awayTeamStats : match.homeTeamStats || []).map(p => ({...p}));

    // Reset statuses
    prevBattingList.forEach(p => { if(p.status === 'batting') p.status = 'not out'; }); 
    nextBattingList.forEach(p => { if(p.status === 'batting') p.status = 'waiting'; });

    // Set new openers
    const p1 = nextBattingList[0]?.name || '';
    const p2 = nextBattingList[1]?.name || ''; 
    if(nextBattingList[0]) nextBattingList[0].status = 'batting'; 
    if(nextBattingList[1]) nextBattingList[1].status = 'batting';

    await MatchesService.update(match.id, { 
      penriceStatus: newStatus, 
      currentOver: 0.0, 
      currentStriker: p1, 
      currentNonStriker: p2, 
      currentBowler: '', 
      [prevBattingStatsKey]: prevBattingList, 
      [nextBattingStatsKey]: nextBattingList, 
      events: [...(match.events||[]), { type: 'INNINGS BREAK', player: '', time: 'END', desc: 'Innings Closed. Teams Switched.' }] 
    });
  },

  endGame: async (match: Match, result: string) => {
    await MatchesService.update(match.id, {
        status: 'FT',
        result: result,
        events: [...(match.events||[]), { type: 'MATCH END', player: '', time: 'FT', desc: result }]
    });
  },

  processBall: async (match: Match, type: number | 'WD' | 'NB' | 'BYE' | 'LB' | 'WICKET' | 'END', dismissalDesc?: string) => {
    // Save history snapshot
    const historySnapshot = {
        homeScore: match.homeScore, awayScore: match.awayScore,
        homeWickets: match.homeWickets, awayWickets: match.awayWickets,
        currentOver: match.currentOver,
        homeTeamStats: match.homeTeamStats, awayTeamStats: match.awayTeamStats,
        events: match.events || [],
        currentStriker: match.currentStriker,
        currentNonStriker: match.currentNonStriker,
        currentBowler: match.currentBowler,
        penriceStatus: match.penriceStatus
    };
    const currentHistory = match.history || [];
    if(currentHistory.length > 5) currentHistory.shift(); 

    const isHome = match.penriceStatus === 'batting';
    const statsKey = isHome ? 'homeTeamStats' : 'awayTeamStats';
    const bowlStatsKey = isHome ? 'awayTeamStats' : 'homeTeamStats';

    // Deep copy stats
    let stats = [...(isHome ? match.homeTeamStats : match.awayTeamStats || []) as PlayerStats[]];
    let bowlStats = [...(isHome ? match.awayTeamStats : match.homeTeamStats || []) as PlayerStats[]];
    let score = isHome ? match.homeScore : match.awayScore;
    let wickets = isHome ? match.homeWickets : match.awayWickets || 0;
    let over = match.currentOver || 0;
    let sName = match.currentStriker;
    let nsName = match.currentNonStriker;

    const sIdx = stats.findIndex(p => p.name === sName); 
    if(sIdx === -1 && type !== 'END') { 
        throw new Error("Please select a valid striker before entering runs."); 
    }
    
    // VALIDATION: Bowler Check
    if (!match.currentBowler && type !== 'END') {
        throw new Error("Action blocked: No active bowler selected.");
    }
    
    const bName = match.currentBowler; 
    const bIdx = bowlStats.findIndex(p => p.name === bName);

    let runs = 0, faced = false, isWkt = false, desc = '', evtType = '', duckType: 'golden' | 'regular' | null | undefined = null;

    if (typeof type === 'number') {
        runs = type; faced = true; 
        evtType = type === 0 ? '.' : (type === 4 ? '4' : (type === 6 ? '6' : 'RUN')); 
        stats[sIdx].runs += runs; stats[sIdx].balls += 1;
        if(bIdx !== -1) { 
            bowlStats[bIdx].bowlBalls = (bowlStats[bIdx].bowlBalls || 0) + 1; 
            bowlStats[bIdx].bowlRuns = (bowlStats[bIdx].bowlRuns || 0) + runs; 
        }
        const pList = PHRASES[type.toString()] || [`${type} runs added.`]; 
        desc = pList[Math.floor(Math.random() * pList.length)];
    } else if (['WD','NB'].includes(type as string)) {
        runs = 1; evtType = type as string; 
        desc = type === 'WD' ? "Wide ball signalled." : "No ball! Free hit coming?"; 
        if(bIdx !== -1) bowlStats[bIdx].bowlRuns = (bowlStats[bIdx].bowlRuns || 0) + 1;
    } else if (['BYE','LB'].includes(type as string)) {
        runs = 1; faced = true; 
        stats[sIdx].balls += 1; evtType = type as string; 
        desc = type === 'BYE' ? "Byes signaled." : "Leg byes given."; 
        if(bIdx !== -1) bowlStats[bIdx].bowlBalls = (bowlStats[bIdx].bowlBalls || 0) + 1;
    } else if (type === 'WICKET') {
        isWkt = true; faced = true; 
        stats[sIdx].balls += 1; stats[sIdx].status = 'out'; wickets += 1; 
        stats[sIdx].dismissal = dismissalDesc || 'Out'; evtType = 'HOWZAT!'; 
        
        if (stats[sIdx].runs === 0) duckType = stats[sIdx].balls === 1 ? 'golden' : 'regular';
        
        if(duckType === 'golden') desc = "GOLDEN DUCK! First ball! Absolute disaster for the batter!";
        else if(duckType === 'regular') desc = "Gone for a DUCK! Fails to trouble the scorers today.";
        else desc = `WICKET! ${sName} departs. ${dismissalDesc}`;
        
        if(bIdx !== -1) { 
            bowlStats[bIdx].bowlBalls = (bowlStats[bIdx].bowlBalls || 0) + 1; 
            if(!(dismissalDesc || "").includes('Run Out')) bowlStats[bIdx].bowlWkts = (bowlStats[bIdx].bowlWkts || 0) + 1; 
        }
        const nIdx = stats.findIndex(p => p.status === 'waiting'); 
        if(nIdx !== -1) { stats[nIdx].status = 'batting'; sName = stats[nIdx].name; } 
        else sName = '';
    }

    score += runs; 
    
    // Update Overs
    if (faced) { 
        let fl = Math.floor(over);
        let b = Math.round((over - fl) * 10) + 1; 
        if (b >= 6) {
           over = fl + 1; // Correctly roll over
        } else {
           over = fl + (b * 0.1);
        }
    }

    // Strike Rotation (Odd runs)
    if (typeof type === 'number' && (type % 2 !== 0)) { 
        let t = sName; sName = nsName; nsName = t; 
    }

    const newEvent: GameEvent = { 
        type: evtType, 
        player: isWkt ? stats[sIdx].name : match.currentStriker || '', 
        time: `Ov ${Math.floor(over)}.${Math.round((over%1)*10)}`, 
        desc: desc, 
        duckType 
    };

    await MatchesService.update(match.id, { 
        [statsKey]: stats, [bowlStatsKey]: bowlStats, 
        [isHome?'homeScore':'awayScore']: score, 
        [isHome?'homeWickets':'awayWickets']: wickets, 
        currentOver: parseFloat(over.toFixed(1)), 
        currentStriker: sName, currentNonStriker: nsName, 
        events: [...(match.events || []), newEvent], 
        history: [...currentHistory, historySnapshot], 
    });

    // Game Status Checks
    const isOverComplete = Math.round((over % 1) * 10) === 0 && faced;
    const maxOvers = match.maxOvers || 20;
    const isOversDone = Math.floor(over) >= maxOvers;
    const isAllOut = wickets >= 10;
    const isInningsComplete = isAllOut || isOversDone;
    
    // Match Result Logic (2nd Innings)
    const isSecondInnings = (match.events || []).some(e => e.type === 'INNINGS BREAK');
    let isMatchWon = false;
    let matchResultText = '';

    if (isSecondInnings) {
        const target = isHome ? match.awayScore : match.homeScore;
        
        // Scenario A: Chasing team passes target
        if (score > target) {
            isMatchWon = true;
            const winner = isHome ? match.teamName : match.opponent;
            const wicketsLeft = 10 - wickets;
            matchResultText = `${winner} won by ${wicketsLeft} wickets`;
        } 
        // Scenario B: Innings ends (All out or Overs done) and score <= target
        else if (isInningsComplete) {
            isMatchWon = true; 
            if (score === target) {
                matchResultText = "Match Tied";
            } else {
                const winner = isHome ? match.opponent : match.teamName;
                const margin = target - score;
                matchResultText = `${winner} won by ${margin} runs`;
            }
        }
    }
    
    return {
        isOverComplete,
        isInningsComplete,
        isMatchWon,
        matchResultText,
        isSecondInnings
    };
  },

  undo: async (match: Match) => {
    if(!match.history || match.history.length === 0) return;
    const history = [...match.history];
    const lastState = history.pop(); 
    await MatchesService.update(match.id, { ...lastState, history });
  }
};