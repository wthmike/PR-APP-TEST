import { Match, PlayerStats } from '../types';
import { MatchesService } from './firebase';

export const NetballLogic = {
    setupTeams: async (match: Match, homeList: string[], awayList: string[], homeColor?: string, awayColor?: string) => {
         const createStats = (names: string[]): PlayerStats[] => {
            if (!names || !Array.isArray(names)) return [];
            return names.map((name, index) => ({
                name,
                runs: 0,
                balls: 0,
                status: (index < 7 ? 'starting' : 'sub') as PlayerStats['status'], // 7 starters for Netball
                dismissal: ''
            })).filter(p => p.name && p.name.trim() !== '');
        };

        await MatchesService.update(match.id, {
            homeTeamStats: createStats(homeList),
            awayTeamStats: createStats(awayList),
            homeTeamColor: homeColor || '#000000',
            awayTeamColor: awayColor || '#ffffff'
            // We don't force status to LIVE here like Rugby/Cricket might, 
            // allowing the admin to start the quarters manually.
        });
    },

    updateColors: async (match: Match, homeColor: string, awayColor: string) => {
        await MatchesService.update(match.id, {
            homeTeamColor: homeColor,
            awayTeamColor: awayColor
        });
    }
};