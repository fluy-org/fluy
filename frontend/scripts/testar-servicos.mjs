import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import jasmineCore from 'jasmine-core';
import '@angular/compiler';
const jasmine = jasmineCore.core(jasmineCore);
const env = jasmine.getEnv();
Object.assign(globalThis, jasmineCore.interface(jasmine, env));
env.configure({ random: false });
let falhas = 0;
env.addReporter({
  specDone: (r) => {
    console.log(r.status + ': ' + r.fullName);
    for (const f of r.failedExpectations) {
      falhas++;
      console.error(f.message);
    }
  },
  jasmineDone: (r) => {
    process.exitCode = r.overallStatus === 'passed' ? 0 : 1;
    console.log('Jasmine sem navegador: ' + r.overallStatus);
  },
});
const specs = process.argv.slice(2);
if (!specs.length)
  throw new Error('Informe os arquivos de testes de serviços.');
const out = path.resolve('node_modules/.cache/fluy-servicos.spec.mjs');
await fs.mkdir(path.dirname(out), { recursive: true });
try {
  await build({
    stdin: {
      contents: specs
        .map((p) => 'import ' + JSON.stringify(path.resolve(p)) + ';')
        .join('\n'),
      resolveDir: process.cwd(),
      loader: 'ts',
    },
    outfile: out,
    bundle: true,
    plugins: [
      {
        name: 'schema-compilado',
        setup(build) {
          build.onResolve({ filter: /^@fluy\/schema$/ }, (args) => ({
            path: args.path,
            external: true,
          }));
        },
      },
    ],
    platform: 'node',
    format: 'esm',
    packages: 'external',
    tsconfig: 'frontend/tsconfig.json',
  });
} catch (error) {
  process.exitCode = 1;
  throw error;
}
try {
  await import(pathToFileURL(out).href + '?t=' + Date.now());
  await env.execute();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await fs.unlink(out);
}
