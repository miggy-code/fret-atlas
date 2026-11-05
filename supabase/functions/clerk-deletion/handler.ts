type DeletedEvent = { type: string; data?: { id?: unknown } };

/** Signature verification happens before any data is accessed or deleted. */
export async function handleClerkDeletion(request: Request, verify: (request: Request) => Promise<DeletedEvent>, remove: (userId: string) => Promise<void>): Promise<Response> {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  let event: DeletedEvent;
  try { event = await verify(request); }
  catch { return new Response('Invalid webhook signature', { status: 401 }); }
  if (event.type !== 'user.deleted') return new Response(null, { status: 204 });
  const userId = event.data?.id;
  if (typeof userId !== 'string' || !/^user_[A-Za-z0-9]+$/.test(userId)) return new Response('Invalid user', { status: 400 });
  try { await remove(userId); }
  catch { return new Response('Deletion unavailable', { status: 503 }); }
  return new Response(null, { status: 204 });
}
