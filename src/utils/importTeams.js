import { supabase } from '../lib/supabaseClient';

export async function importTeamsFromCSV(csvData) {
  try {
    // Parse CSV data
    const lines = csvData.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));

    const teams = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      const team = {};
      headers.forEach((header, index) => {
        team[header] = values[index] ? values[index].replace(/"/g, '') : '';
      });
      teams.push(team);
    }

    // First, ensure we have a season
    let seasonId;
    const { data: existingSeasons } = await supabase
      .from('seasons')
      .select('id')
      .eq('is_active', true)
      .maybeSingle();

    if (existingSeasons) {
      seasonId = existingSeasons.id;
    } else {
      // Create a default season
      const { data: newSeason, error: seasonError } = await supabase
        .from('seasons')
        .insert({
          name: 'Season 2026',
          start_date: '2026-01-01',
          end_date: '2026-12-31',
          is_active: true
        })
        .select()
        .single();

      if (seasonError) {
        console.error('Error creating season:', seasonError);
        throw seasonError;
      }
      seasonId = newSeason.id;
    }

    // Import teams
    const teamsToInsert = teams.map(team => ({
      name: team.name || '',
      season_id: seasonId,
      logo_url: team.logo_url || null,
      wins: parseInt(team.wins) || 0,
      losses: parseInt(team.losses) || 0,
      draws: parseInt(team.draws) || 0,
      points: parseInt(team.points) || 0,
      sets_won: parseInt(team.sets_won) || 0,
      sets_lost: parseInt(team.sets_lost) || 0,
      legs_won: parseInt(team.legs_won) || 0,
      legs_lost: parseInt(team.legs_lost) || 0,
      positions_needed: parseInt(team.positions_needed) || 0,
      scolia_location: team.scolia_location || null,
      looking_for_players: team.looking_for_players === 'true',
      average_group: team.average_group || null,
      league_tier: team.league_tier || null,
      status: team.status || 'approved',
      recruitment_message: team.recruitment_message || null,
      captain_email: team.captain_email || null
    }));

    const { data: insertedTeams, error: insertError } = await supabase
      .from('teams')
      .insert(teamsToInsert)
      .select();

    if (insertError) {
      console.error('Error inserting teams:', insertError);
      throw insertError;
    }

    console.log(`Successfully imported ${insertedTeams.length} teams`);
    return { success: true, teams: insertedTeams };
  } catch (error) {
    console.error('Error importing teams:', error);
    return { success: false, error };
  }
}

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
