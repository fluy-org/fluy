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
