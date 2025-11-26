import { Match, PlayerStats } from '../types';
import { MatchesService } from './firebase';

export const RugbyLogic = {
    setupTeams: async (match: Match, homeList: string[], awayList: string[]) => {
        const createStats = (names: string[]): PlayerStats[] => {
            if (!names || !Array.isArray(names)) return [];
            return names.map((name, index) => ({ 
                name, 
                runs: 0, 
                balls: 0, 
                status: (index < 15 ? 'starting' : 'sub') as PlayerStats['status'], // First 15 are starters
                dismissal: '' 
            })).filter(p => p.name && p.name.trim() !== '');
        };

        await MatchesService.update(match.id, {
            homeTeamStats: createStats(homeList),
            awayTeamStats: createStats(awayList),
            homeScore: 0,
            awayScore: 0,
            period: '1st Half',
            status: 'LIVE'
        });
    },

    score: async (match: Match, isHome: boolean, type: string, points: number, player?: string, time?: string) => {
        const field = isHome ? 'homeScore' : 'awayScore';
        const currentScore = (isHome ? match.homeScore : match.awayScore) || 0;
        const newScore = currentScore + points;

        // Update player stats if a player was selected
        let homeStats = [...(match.homeTeamStats || [])];
        let awayStats = [...(match.awayTeamStats || [])];

        if (player) {
            const stats = isHome ? homeStats : awayStats;
            const pIdx = stats.findIndex(p => p.name === player);
            if (pIdx !== -1) {
                // Using 'runs' property to store rugby points for the player
                stats[pIdx].runs = (stats[pIdx].runs || 0) + points; 
            }
        }

        const teamName = isHome ? match.teamName : match.opponent;
        // If type is combined (e.g. TRY (CON)), we might want a specific description
        const desc = `${type} to ${teamName} ${player ? `(${player})` : ''}`;

        await MatchesService.update(match.id, {
            [field]: newScore,
            homeTeamStats: homeStats,
            awayTeamStats: awayStats,
            events: [...(match.events || []), {
                type: type,
                player: player || teamName,
                time: time || match.period || '', 
                desc: desc
            }]
        });
    },

    updatePeriod: async (match: Match, period: string) => {
        let updateData: any = { period };
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
    }
};