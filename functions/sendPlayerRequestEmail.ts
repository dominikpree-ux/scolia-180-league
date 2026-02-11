import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    if (!data || !data.team_id) {
      return Response.json({ success: false, error: 'Missing request data' }, { status: 400 });
    }

    // Get team
    const teams = await base44.entities.Team.filter({ id: data.team_id });
    const team = teams[0];

    if (!team || !team.captain_email) {
      return Response.json({ success: true, message: 'No email to send' }, { status: 200 });
    }

    // Send email to team captain
    await base44.integrations.Core.SendEmail({
      to: team.captain_email,
      subject: `${data.player_name} möchte deinem Team beitreten`,
      body: `${data.player_name} interessiert sich für dein Team "${data.team_name}" und hat folgende Nachricht hinterlassen:\n\n"${data.message}"\n\nAntworte im Dashboard unter Spieler-Anfragen.`,
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});