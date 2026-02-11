import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    if (!data || !data.team_to_id) {
      return Response.json({ success: false, error: 'Missing message data' }, { status: 400 });
    }

    // Get recipient team
    const teams = await base44.entities.Team.filter({ id: data.team_to_id });
    const recipientTeam = teams[0];

    if (!recipientTeam || !recipientTeam.captain_email) {
      return Response.json({ success: true, message: 'No email to send' }, { status: 200 });
    }

    // Send email to team captain
    await base44.integrations.Core.SendEmail({
      to: recipientTeam.captain_email,
      subject: `Neue Nachricht von Team ${data.team_from_name}`,
      body: `Dein Team "${data.team_to_name}" hat eine Nachricht von "${data.team_from_name}" erhalten:\n\n"${data.message}"\n\nAntworte im Chat auf deinem Dashboard.`,
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});