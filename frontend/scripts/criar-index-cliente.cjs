const { readFileSync, writeFileSync } = require('node:fs');
const { resolve } = require('node:path');

const diretorioSaida = resolve(__dirname, '..', 'www');
const caminhoIndex = resolve(diretorioSaida, 'index.html');
const caminhoIndexCliente = resolve(diretorioSaida, 'index-cliente.html');
const manifestoSalao = '<link rel="manifest" href="/manifest.webmanifest">';
const manifestoCliente =
  '<link rel="manifest" href="/manifest-cliente.webmanifest">';

const index = readFileSync(caminhoIndex, 'utf8');

if (!index.includes(manifestoSalao)) {
  throw new Error('Manifesto do salão não encontrado no index de produção.');
}

const indexCliente = index
  .replace(manifestoSalao, manifestoCliente)
  .replace('<title>Fluy</title>', '<title>Fluy - Agendamento</title>')
  .replace(
    '<meta name="application-name" content="Fluy">',
    '<meta name="application-name" content="Fluy Agendamento">',
  )
  .replace(
    '<meta name="apple-mobile-web-app-title" content="Fluy">',
    '<meta name="apple-mobile-web-app-title" content="Fluy Agendamento">',
  );

writeFileSync(caminhoIndexCliente, indexCliente);

const conteudoHeadersCloudflare = `/ngsw-worker.js
  Cache-Control: no-cache

/ngsw.json
  Cache-Control: no-cache

/manifest.webmanifest
  Cache-Control: no-cache
  Content-Type: application/manifest+json

/manifest-cliente.webmanifest
  Cache-Control: no-cache
  Content-Type: application/manifest+json

/index.html
  Cache-Control: no-cache

/index-cliente
  Cache-Control: no-cache

/index-cliente.html
  Cache-Control: no-cache
`;

writeFileSync(resolve(diretorioSaida, '_headers'), conteudoHeadersCloudflare);
