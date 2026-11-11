/**
 * Serve o HTML da entrada do cliente (`/index-cliente.html`) preservando a URL
 * atual do navegador, replicando no Cloudflare Pages o rewrite `status = 200` do Netlify.
 *
 * @param {{ request: Request; env: { ASSETS: { fetch: (input: RequestInfo | URL) => Promise<Response> } }; next: () => Promise<Response> }} context
 */
export async function servirIndexCliente(context) {
  const { request, env } = context;

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return context.next();
  }

  // Pretty URLs do Cloudflare Pages servem `/index-cliente` sem redirect 308 de `.html`.
  const resposta = await buscarAssetSemRedirect(env.ASSETS, request, [
    '/index-cliente',
    '/index-cliente.html',
  ]);

  const headers = new Headers(resposta.headers);
  headers.set('Cache-Control', 'no-cache');

  return new Response(resposta.body, {
    status: resposta.status,
    headers,
  });
}

async function buscarAssetSemRedirect(assets, request, caminhos) {
  let ultimaResposta;

  for (const caminho of caminhos) {
    const alvoUrl = new URL(caminho, request.url);
    let resposta = await assets.fetch(criarRequestAsset(alvoUrl, request));

    if (resposta.status >= 300 && resposta.status < 400) {
      const location = resposta.headers.get('location');
      if (location) {
        resposta = await assets.fetch(
          criarRequestAsset(new URL(location, alvoUrl), request),
        );
      }
    }

    if (resposta.status !== 404) {
      return resposta;
    }

    ultimaResposta = resposta;
  }

  return ultimaResposta;
}

function criarRequestAsset(url, requestOriginal) {
  return new Request(url, {
    method: requestOriginal.method,
    headers: requestOriginal.headers,
  });
}
