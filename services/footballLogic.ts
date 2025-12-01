import { Match, PlayerStats } from '../types';
import { MatchesService } from './firebase';

export const FootballLogic = {
    setupTeams: async (match: Match, homeList: string[], awayList: string[], homeColor?: string, awayColor?: string, advancedStats: boolean = false) => {
        const createStats = (names: string[]): PlayerStats[] => {
            if (!names || !Array.isArray(names)) return [];
            return names.map((name, index) => ({ 
                name, 
                runs: 0, // Goals
                balls: 0, 
                status: (index < 11 ? 'starting' : 'sub') as PlayerStats['status'], 
                dismissal: '' // Cards
            })).filter(p => p.name && p.name.trim() !== '');
        };

        await MatchesService.update(match.id, {
            homeTeamStats: createStats(homeList),
            awayTeamStats: createStats(awayList),
            homeScore: 0,
            awayScore: 0,
            period: '1st Half',
            status: 'LIVE',
            homeTeamColor: homeColor || '#000000',
            awayTeamColor: awayColor || '#ffffff',
            footballStats: {
                homeCorners: 0, awayCorners: 0,
                homeFouls: 0, awayFouls: 0,
                homeYellows: 0, awayYellows: 0,
                homeReds: 0, awayReds: 0,
                enableAdvancedStats: advancedStats,
                possessionHome: 0,
                possessionAway: 0,
                possessionStatus: 'neutral',
                lastPossessionUpdate: Date.now()
            }
        });
    },

    addGoal: async (match: Match, isHome: boolean, player: string, assist: string, time: string) => {
        const field = isHome ? 'homeScore' : 'awayScore';
        const currentScore = (isHome ? match.homeScore : match.awayScore) || 0;
        
        let homeStats = [...(match.homeTeamStats || [])];
        let awayStats = [...(match.awayTeamStats || [])];
        
        // Update Player Stats
        if (player) {
            const stats = isHome ? homeStats : awayStats;
            const pIdx = stats.findIndex(p => p.name === player);
            if (pIdx !== -1) {
                stats[pIdx].runs = (stats[pIdx].runs || 0) + 1;
            }
        }

        const teamName = isHome ? match.teamName : match.opponent;
        let desc = `GOAL! ${player ? player : teamName} scores!`;
        if (assist) desc += ` (Ast: ${assist})`;
        
        await MatchesService.update(match.id, {
            [field]: currentScore + 1,
            homeTeamStats: homeStats,
            awayTeamStats: awayStats,
            events: [...(match.events || []), {
                type: 'GOAL',
                player: player || teamName,
                assist: assist || undefined,
                time: time || match.period || '', 
                desc: desc,
                team: isHome ? 'home' : 'away'
            }]
        });
    },

    addCard: async (match: Match, isHome: boolean, type: 'Yellow' | 'Red', player: string, time: string) => {
        let homeStats = [...(match.homeTeamStats || [])];
        let awayStats = [...(match.awayTeamStats || [])];
        const stats = isHome ? homeStats : awayStats;
        
        // Update Stats
        const pIdx = stats.findIndex(p => p.name === player);
        if (pIdx !== -1) {
            // Append card to dismissal string for tracking multiple
            const current = stats[pIdx].dismissal || '';
            stats[pIdx].dismissal = current ? `${current}, ${type}` : type;
        }

        const currentFBStats = match.footballStats || {
            homeCorners: 0, awayCorners: 0, homeFouls: 0, awayFouls: 0,
            homeYellows: 0, awayYellows: 0, homeReds: 0, awayReds: 0
        };

        if (isHome) {
            if (type === 'Yellow') currentFBStats.homeYellows++;
            else currentFBStats.homeReds++;
        } else {
            if (type === 'Yellow') currentFBStats.awayYellows++;
            else currentFBStats.awayReds++;
        }

        await MatchesService.update(match.id, {
            homeTeamStats: homeStats,
            awayTeamStats: awayStats,
            footballStats: currentFBStats,
            events: [...(match.events || []), {
                type: type === 'Yellow' ? 'YEL' : 'RED',
                player: player,
                time: time || '',
                desc: `${type} Card shown to ${player}`,
                team: isHome ? 'home' : 'away'
            }]
        });
    },

    updateStat: async (match: Match, stat: 'Corners' | 'Fouls', isHome: boolean, delta: number) => {
        const fbStats = { ...match.footballStats };

        if (stat === 'Corners') {
            if (isHome) fbStats.homeCorners = Math.max(0, (fbStats.homeCorners || 0) + delta);
            else fbStats.awayCorners = Math.max(0, (fbStats.awayCorners || 0) + delta);
        } else {
            if (isHome) fbStats.homeFouls = Math.max(0, (fbStats.homeFouls || 0) + delta);
            else fbStats.awayFouls = Math.max(0, (fbStats.awayFouls || 0) + delta);
        }

        await MatchesService.update(match.id, { footballStats: fbStats });
    },

    updatePossession: async (match: Match, newStatus: 'home' | 'away' | 'neutral') => {
        const stats = { ...match.footballStats };
        const now = Date.now();
        const lastUpdate = stats.lastPossessionUpdate || now;

        // Add accumulated time to the PREVIOUS owner
        const diff = now - lastUpdate;
        if (stats.possessionStatus === 'home') {
            stats.possessionHome = (stats.possessionHome || 0) + diff;
        } else if (stats.possessionStatus === 'away') {
            stats.possessionAway = (stats.possessionAway || 0) + diff;
        }

        // Set new status and reset timestamp
        stats.possessionStatus = newStatus;
        stats.lastPossessionUpdate = now;

        await MatchesService.update(match.id, { footballStats: stats });
    },

    updatePeriod: async (match: Match, period: string) => {
        let updateData: any = { period };
        
        // Handle Possession Pausing automatically
        if ((period === 'Half Time' || period === 'FT') && match.footballStats?.possessionStatus !== 'neutral') {
            // Force pause logic locally before sending update
            const stats = { ...match.footballStats };
            const now = Date.now();
            const lastUpdate = stats.lastPossessionUpdate || now;
            const diff = now - lastUpdate;
            
            if (stats.possessionStatus === 'home') stats.possessionHome = (stats.possessionHome || 0) + diff;
            else if (stats.possessionStatus === 'away') stats.possessionAway = (stats.possessionAway || 0) + diff;
            
            stats.possessionStatus = 'neutral';
            stats.lastPossessionUpdate = now;
            updateData.footballStats = stats;
        }

        if (period === 'FT') {
            updateData.status = 'FT';
            if (match.homeScore > match.awayScore) updateData.result = `${match.teamName} Win`;
            else if (match.awayScore > match.homeScore) updateData.result = `${match.opponent} Win`;
            else updateData.result = 'Draw';
        }
        await MatchesService.update(match.id, updateData);
    },
    
    manualCorrection: async (match: Match, homeScore: number, awayScore: number) => {
        await MatchesService.update(match.id, { homeScore, awayScore });
    },

    updateColors: async (match: Match, homeColor: string, awayColor: string) => {
        await MatchesService.update(match.id, {
            homeTeamColor: homeColor,
            awayTeamColor: awayColor
        });
    }
};