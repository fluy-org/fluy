const CLERK_FRONTEND_API_HOST = 'frontend-api.clerk.dev';

/**
 * Faz proxy da Frontend API do Clerk em `/__clerk/*` no Cloudflare Pages,
 * permitindo usar uma instancia Clerk de producao sem CNAME DNS em `.pages.dev`.
 *
 * @param {{ request: Request; env: { CLERK_SECRET_KEY?: string; CLERK_PROXY_URL?: string } }} context
 */
export async function onRequest(context) {
  const { request, env } = context;

  if (!env.CLERK_SECRET_KEY) {
    return new Response(
      JSON.stringify({
        error: 'CLERK_SECRET_KEY nao configurada nas variaveis do Cloudflare Pages.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  const incomingUrl = new URL(request.url);
  const proxyUrl = env.CLERK_PROXY_URL || `${incomingUrl.origin}/__clerk`;

  const targetUrl = new URL(request.url);
  targetUrl.protocol = 'https:';
  targetUrl.hostname = CLERK_FRONTEND_API_HOST;
  targetUrl.port = '';
  targetUrl.pathname = targetUrl.pathname.replace(/^\/__clerk/, '') || '/';

  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.set('Clerk-Proxy-Url', proxyUrl);
  headers.set('Clerk-Secret-Key', env.CLERK_SECRET_KEY);

  const clientIp = request.headers.get('CF-Connecting-IP');
  if (clientIp) {
    headers.set('X-Forwarded-For', clientIp);
  }

  const hasBody = request.method !== 'GET' && request.method !== 'HEAD';
  const proxyRequest = new Request(targetUrl.toString(), {
    method: request.method,
    headers,
    body: hasBody ? request.body : null,
    redirect: 'manual',
  });

  try {
    const response = await fetch(proxyRequest);

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'Falha ao encaminhar requisicao para o Clerk.',
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}
