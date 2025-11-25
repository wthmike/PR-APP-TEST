import { Match, GameEvent, PlayerStats } from '../types';
import { MatchesService } from './firebase';

// Phrasings for commentary
const PHRASES: Record<string, string[]> = {
  0: ["Crowd goes mild.", "Straight to the fielder. Boring.", "Solid defense... yawn.", "No run. Good practice shot.", "Can't get that past the ring.", "Watchful... or stuck?", "Respects the good ball. Fair play."],
  1: ["Cheeky single!", "Tip and run.", "Quick feet!", "Scrambling through.", "Off the mark.", "Strike rotated."],
  2: ["Coming back for two!", "Great running!", "Pushing the fielder!", "Legs pumping!", "Easy couple.", "Double trouble!"],
  3: ["Three runs! Cardio day!", "Running them ragged!", "Excellent hustle!", "Are they marathon runners?", "Chased down at the rope."],
  4: ["CRUNCHED! Four runs!", "Raced to the fence!", "Lovely jubbly!", "Don't bother running!", "Pinged it!", "Through the gap like a tracer bullet!", "Elegant drive!"],
  6: ["MAXIMUM! Have some of that!", "Call NASA, that's in orbit!", "In the car park!", "That's huge!", "Monster hit! Clean as a whistle!", "Into the next postcode!"],
};

const OUT_PHRASES: Record<string, string[]> = {
  BOWLED: ["CASTLED! Stumps everywhere!", "Timber! Furniture rearranged!", "Cleaned him up!", "Through the gate! See ya!", "Knocked him over!"],
  CAUGHT: ["SNATCHED! Gobbled up.", "Straight down the throat.", "Safe hands!", "Gone fishing! Hook, line and sinker.", "Edged and gone! Thanks very much."],
  LBW: ["PLUMB! Umpire says YES!", "Trapped in front! No doubt.", "Hit the pads... GIVEN!", "Dead duck in front of stumps.", "Caught dead in front!"],
  RUN_OUT: ["DISASTER! Mix up!", "Sent back... too late!", "Direct hit! Cheerio.", "What was he thinking?", "Comedy of errors!"],
  STUMPED: ["BAMBOOZLED! Keeper whips them off.", "Dancing down... and missed!", "Left his ground, lost his wicket.", "Beaten in flight!"],
  GENERIC: ["HOWZAT! They have to go.", "Dismissed! The long walk back.", "Back to the hutch!", "A crucial breakthrough!"]
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
    
    // Only increment to next integer if we aren't already there.
    if (nO % 1 !== 0) {
        nO = Math.floor(nO) + 1;
    }

    await MatchesService.update(match.id, {
        currentOver: nO,
        currentStriker: match.currentNonStriker || '',
        currentNonStriker: match.currentStriker || '',
        currentBowler: '',
        events: [...(match.events||[]), { type: 'END OVER', player: '', time: `Ov ${nO}`, desc: 'End of Over.' }],
    });
  },

  switchInnings: async (match: Match) => {
    const isCurrentlyBatting = match.penriceStatus === 'batting';
    const newStatus = isCurrentlyBatting ? 'bowling' : 'batting';
    const prevBattingStatsKey = isCurrentlyBatting ? 'homeTeamStats' : 'awayTeamStats';
    const nextBattingStatsKey = isCurrentlyBatting ? 'awayTeamStats' : 'homeTeamStats';

    // Deep copy arrays - Wrap logic in parens to ensure fallback to [] happens before .map
    const prevBattingList = ((isCurrentlyBatting ? match.homeTeamStats : match.awayTeamStats) || []).map(p => ({...p}));
    const nextBattingList = ((isCurrentlyBatting ? match.awayTeamStats : match.homeTeamStats) || []).map(p => ({...p}));

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

  undo: async (match: Match) => {
    if(!match.history || match.history.length === 0) return;
    const history = [...match.history];
    const lastState = history.pop();
    if(lastState) {
        await MatchesService.update(match.id, {
            ...lastState,
            history: history
        });
    }
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

    // Safe retrieval of stats arrays with default empty array if undefined
    let stats = [...((isHome ? match.homeTeamStats : match.awayTeamStats) || [])];
    let bowlStats = [...((isHome ? match.awayTeamStats : match.homeTeamStats) || [])];
    
    let score: number = (isHome ? match.homeScore : match.awayScore) || 0;
    let wickets: number = (isHome ? match.homeWickets : match.awayWickets) || 0;
    
    let over: number = match.currentOver || 0;
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
        stats[sIdx].runs = (stats[sIdx].runs || 0) + runs;
        stats[sIdx].balls = (stats[sIdx].balls || 0) + 1;
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
        stats[sIdx].balls = (stats[sIdx].balls || 0) + 1; 
        evtType = type as string; 
        desc = type === 'BYE' ? "Byes signaled." : "Leg byes given."; 
        if(bIdx !== -1) bowlStats[bIdx].bowlBalls = (bowlStats[bIdx].bowlBalls || 0) + 1;
    } else if (type === 'WICKET') {
        isWkt = true; faced = true; 
        stats[sIdx].balls = (stats[sIdx].balls || 0) + 1; 
        stats[sIdx].status = 'out'; 
        wickets += 1; 
        stats[sIdx].dismissal = dismissalDesc || 'Out'; evtType = 'HOWZAT!'; 
        
        if ((stats[sIdx].runs || 0) === 0) duckType = stats[sIdx].balls === 1 ? 'golden' : 'regular';
        
        if(duckType === 'golden') desc = "GOLDEN DUCK! First ball! Absolute disaster for the batter!";
        else if(duckType === 'regular') desc = "Gone for a DUCK! Fails to trouble the scorers today.";
        else {
            let dT = dismissalDesc || "";
            if(dT.startsWith('b ')) desc = OUT_PHRASES.BOWLED[Math.floor(Math.random()*OUT_PHRASES.BOWLED.length)];
            else if(dT.startsWith('c ')) desc = OUT_PHRASES.CAUGHT[Math.floor(Math.random()*OUT_PHRASES.CAUGHT.length)];
            else if(dT.startsWith('lbw')) desc = OUT_PHRASES.LBW[Math.floor(Math.random()*OUT_PHRASES.LBW.length)];
            else if(dT.startsWith('st')) desc = OUT_PHRASES.STUMPED[Math.floor(Math.random()*OUT_PHRASES.STUMPED.length)];
            else if(dT.toLowerCase().includes('run out')) desc = OUT_PHRASES.RUN_OUT[Math.floor(Math.random()*OUT_PHRASES.RUN_OUT.length)];
            else desc = OUT_PHRASES.GENERIC[Math.floor(Math.random()*OUT_PHRASES.GENERIC.length)];
            desc += ` (${dismissalDesc})`;
        }
        
        if(bIdx !== -1) { 
            bowlStats[bIdx].bowlBalls = (bowlStats[bIdx].bowlBalls || 0) + 1;
            if(!(dismissalDesc || '').includes('Run Out')) {
                bowlStats[bIdx].bowlWkts = (bowlStats[bIdx].bowlWkts || 0) + 1; 
            }
        }

        // Set next striker if available
        const nIdx = stats.findIndex(p => p.status === 'waiting'); 
        if(nIdx !== -1) { 
            stats[nIdx].status = 'batting'; 
            sName = stats[nIdx].name; 
        } else {
            sName = ''; // All out or no batters left
        }
    }

    score += runs; 
    
    if (faced) { 
        let fl = Math.floor(over);
        // Calculate balls: current decimal part * 10, round it, + 1
        let b = Math.round((over - fl) * 10) + 1; 
        
        if (b >= 6) {
            over = fl + 0.6; // Mark as 6th ball finished (0.6 visually), technically over is done
        } else {
            over = fl + (b * 0.1); 
        }
    }

    // Swap strikers on odd runs (if not the end of an over triggered by runs)
    if (typeof type === 'number' && (type % 2 !== 0)) { 
        let t = sName; sName = nsName; nsName = t; 
    }

    await MatchesService.update(match.id, { 
        [statsKey]: stats, [bowlStatsKey]: bowlStats, 
        [isHome?'homeScore':'awayScore']: score, 
        [isHome?'homeWickets':'awayWickets']: wickets, 
        currentOver: parseFloat(over.toFixed(1)), 
        currentStriker: sName, currentNonStriker: nsName, 
        events: [...(match.events || []), { type: evtType, player: isWkt ? (type === 'WICKET' ? stats[sIdx].name : '') : match.currentStriker, time: `Ov ${Math.floor(over)}.${Math.round((over%1)*10)}`, desc: desc, duckType: duckType }], 
        history: [...currentHistory, historySnapshot], 
        lastUpdated: Date.now() 
    });

    // --- GAME STATE CHECKS ---
    
    // 1. Check if Over is Complete (x.6)
    const isOverComplete = Math.round((over % 1) * 10) === 6;

    // 2. Check Second Innings Status
    const isSecondInnings = (match.events || []).some(e => e.type === 'INNINGS BREAK');
    const target = (isHome ? match.awayScore : match.homeScore) || 0;
    
    let isMatchWon = false;
    let matchResultText = '';

    if (isSecondInnings) {
        // Chasing Team Wins
        if (score > target) {
            isMatchWon = true;
            const wicketsLeft = 10 - wickets;
            matchResultText = `${isHome ? match.teamName : match.opponent} won by ${wicketsLeft} wickets`;
        }
        // Match Tied or Defending Team Wins (Triggered when innings ends via wickets or overs)
        else if (wickets >= 10 || (isOverComplete && Math.floor(over) + 1 >= (match.maxOvers || 20))) {
            if (score === target) {
                isMatchWon = true;
                matchResultText = "Match Tied";
            } else {
                isMatchWon = true;
                const diff = target - score;
                const winnerName = isHome ? match.opponent : match.teamName;
                matchResultText = `${winnerName} won by ${diff} runs`;
            }
        }
    }

    // 3. Check Innings Complete (All Out or Max Overs)
    const isAllOut = wickets >= 10;
    const isMaxOversReached = isOverComplete && (Math.floor(over) + 1 >= (match.maxOvers || 20));
    const isInningsComplete = isAllOut || isMaxOversReached;

    return {
        isOverComplete,
        isInningsComplete,
        isMatchWon,
        matchResultText,
        isSecondInnings
    };
  }
};