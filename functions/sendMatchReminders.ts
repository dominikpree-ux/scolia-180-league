/**
 * Scheduled function that runs daily at 10:00 AM
 * Sends reminder emails to team captains for matches happening tomorrow
 * 
 * Schedule: "0 10 * * *" (every day at 10:00 AM)
 */

export default async function sendMatchReminders({ base44 }) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDate = tomorrow.toISOString().split('T')[0];

  // Get all matches scheduled for tomorrow
  const allMatches = await base44.asServiceRole.entities.Match.list();
  const tomorrowMatches = allMatches.filter(match => match.date === tomorrowDate);

  if (tomorrowMatches.length === 0) {
    console.log('No matches tomorrow');
    return { sent: 0, message: 'No matches tomorrow' };
  }

  // Get all teams to fetch captain emails
  const allTeams = await base44.asServiceRole.entities.Team.list();
  const teamMap = {};
  allTeams.forEach(team => {
    teamMap[team.id] = team;
  });

  let emailsSent = 0;

  // Send reminder to each captain
  for (const match of tomorrowMatches) {
    const homeTeam = teamMap[match.home_team_id];
    const awayTeam = teamMap[match.away_team_id];

    if (!homeTeam || !awayTeam) continue;

    const matchTime = match.time || 'nicht festgelegt';
    const leagueName = `Liga ${match.league_tier}`;

    // Email to home captain
    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: homeTeam.captain_email,
        subject: `⚠️ Erinnerung: Spiel morgen - ${homeTeam.name} vs ${awayTeam.name}`,
        body: `
Hallo ${homeTeam.captain_name},

dies ist eine Erinnerung an euer Spiel morgen:

📅 Datum: ${new Date(match.date).toLocaleDateString('de-DE')}
🕐 Uhrzeit: ${matchTime}
🎯 Spieltag: ${match.matchday}
🏆 ${leagueName}

Heimteam: ${homeTeam.name}
Auswärtsteam: ${awayTeam.name}

Bitte stellt sicher, dass:
- Eure Aufstellung festgelegt ist
- Das Spielergebnis nach dem Match mit Foto hochgeladen wird
- Alle Spieler informiert sind

Viel Erfolg!

Scolia 180 League
        `.trim()
      });
      emailsSent++;
    } catch (error) {
      console.error(`Failed to send email to ${homeTeam.captain_email}:`, error);
    }

    // Email to away captain
    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: awayTeam.captain_email,
        subject: `⚠️ Erinnerung: Spiel morgen - ${homeTeam.name} vs ${awayTeam.name}`,
        body: `
Hallo ${awayTeam.captain_name},

dies ist eine Erinnerung an euer Spiel morgen:

📅 Datum: ${new Date(match.date).toLocaleDateString('de-DE')}
🕐 Uhrzeit: ${matchTime}
🎯 Spieltag: ${match.matchday}
🏆 ${leagueName}

Heimteam: ${homeTeam.name}
Auswärtsteam: ${awayTeam.name}

Bitte stellt sicher, dass:
- Eure Aufstellung festgelegt ist
- Alle Spieler informiert sind

Viel Erfolg!

Scolia 180 League
        `.trim()
      });
      emailsSent++;
    } catch (error) {
      console.error(`Failed to send email to ${awayTeam.captain_email}:`, error);
    }
  }

  return { 
    sent: emailsSent, 
    matches: tomorrowMatches.length,
    message: `Sent ${emailsSent} reminder emails for ${tomorrowMatches.length} matches`
  };
}

// Schedule configuration
export const schedule = "0 10 * * *"; // Every day at 10:00 AM