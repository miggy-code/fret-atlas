import { verifyWebhook } from 'npm:@clerk/backend@3.26.4/webhooks';
import { handleClerkDeletion } from './handler.ts';

Deno.serve(async request => {
  const signingSecret = Deno.env.get('CLERK_WEBHOOK_SIGNING_SECRET');
  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!signingSecret || !url || !serviceKey) return new Response('Not configured', { status: 503 });
  return handleClerkDeletion(request, req => verifyWebhook(req, { signingSecret }), async userId => {
    const response = await fetch(`${url}/rest/v1/rpc/sync_delete_clerk_user`, {
      method: 'POST', headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject: userId }),
    });
    if (!response.ok) throw new Error('Database deletion failed');
  });
});
