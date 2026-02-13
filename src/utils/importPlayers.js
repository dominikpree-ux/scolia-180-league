import { supabase } from '../lib/supabaseClient';

function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  values.push(current);
  return values;
}

function parsePreferredLeague(value) {
  try {
    const cleaned = value.replace(/"/g, '').trim();
    if (!cleaned || cleaned === '[]') return [];
    const parsed = JSON.parse(cleaned);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function importPlayersFromCSV(csvData) {
  try {
    const lines = csvData.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));

    const players = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      const player = {};
      headers.forEach((header, index) => {
        player[header] = values[index] ? values[index].replace(/"/g, '') : '';
      });
      players.push(player);
    }

    const teamMap = await getTeamIdMap();

    const playersToInsert = players.map(player => {
      const teamId = player.team_id ? teamMap[player.team_id] : null;

      return {
        id: player.id || undefined,
        name: player.name || player.nickname || 'Unnamed Player',
        nickname: player.nickname || null,
        email: player.email || null,
        team_id: teamId,
        is_captain: player.is_captain === 'true',
        available_as_substitute: player.available_as_substitute === 'true',
        looking_for_team: player.looking_for_team === 'true',
        preferred_league: parsePreferredLeague(player.preferred_league),
        bio: player.bio || null,
        is_free_agent: player.looking_for_team === 'true' || !teamId,
        auth_user_id: null
      };
    }).filter(player => player.name && player.name !== 'Unnamed Player');

    const { data: insertedPlayers, error: insertError } = await supabase
      .from('players')
      .insert(playersToInsert)
      .select();

    if (insertError) {
      console.error('Error inserting players:', insertError);
      throw insertError;
    }

    console.log(`Successfully imported ${insertedPlayers.length} players`);
    return { success: true, players: insertedPlayers };
  } catch (error) {
    console.error('Error importing players:', error);
    return { success: false, error };
  }
}

async function getTeamIdMap() {
  const { data: teams, error } = await supabase
    .from('teams')
    .select('id, name');

  if (error) {
    console.error('Error fetching teams:', error);
    return {};
  }

  const teamMap = {};
  teams.forEach(team => {
    teamMap[team.id] = team.id;
    teamMap[team.name] = team.id;
  });

  return teamMap;
}
