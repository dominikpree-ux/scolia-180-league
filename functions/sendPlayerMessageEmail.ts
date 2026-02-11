import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    if (!data || !data.player_to_id) {
      return Response.json({ success: false, error: 'Missing player data' }, { status: 400 });
    }

    // Get recipient player
    const players = await base44.entities.Player.filter({ id: data.player_to_id });
    const recipient = players[0];

    if (!recipient || !recipient.email) {
      return Response.json({ success: true, message: 'No email to send' }, { status: 200 });
    }

    // Send email
    await base44.integrations.Core.SendEmail({
      to: recipient.email,
      subject: `Neue Nachricht von ${data.player_from_name}`,
      body: `Du hast eine neue Nachricht von ${data.player_from_name} erhalten:\n\n"${data.message}"\n\nAntworte im Chat auf deinem Dashboard.`,
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});