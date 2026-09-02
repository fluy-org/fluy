require('dotenv/config');

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { Client } = require('pg');

const MIGRATION_FOLDER = path.resolve(__dirname, '../drizzle');
const BASELINE_TAG = '0000_initial_schema';
const ARQUIVO_SALAO_TAG = '0001_adicionar_propriedade_salao_ao_arquivo';

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL nao foi definida.');
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    await validarBancoExistente(client);
    const possuiSalaoId = await arquivoPossuiSalaoId(client);
    const migrations = obterMigrationsParaAdotar(possuiSalaoId);
    const historico = await obterHistorico(client);

    if (historico.length > 0) {
      validarHistoricoExistente(historico, migrations);
      console.log('Historico de migrations ja foi adotado. Nenhuma acao necessaria.');
      return;
    }

    await client.query('BEGIN');
    for (const migration of migrations) {
      await client.query(
        'INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ($1, $2)',
        [migration.hash, migration.when],
      );
    }
    await client.query('COMMIT');

    console.log(
      `Historico adotado ate ${migrations.at(-1).tag}. Execute npm run db:migrate.`,
    );
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  } finally {
    await client.end();
  }
}

async function validarBancoExistente(client) {
  const tabelasEsperadas = Object.values(
    lerJson('meta/0000_snapshot.json').tables,
  ).map((tabela) => tabela.name);
  const tabelasExistentes = await client.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'",
  );
  const nomesExistentes = new Set(
    tabelasExistentes.rows.map((tabela) => tabela.table_name),
  );
  const tabelasAusentes = tabelasEsperadas.filter(
    (tabela) => !nomesExistentes.has(tabela),
  );

  if (tabelasAusentes.length > 0) {
    throw new Error(
      `Banco nao corresponde ao schema legado. Tabelas ausentes: ${tabelasAusentes.join(', ')}. Em banco novo, execute npm run db:migrate.`,
    );
  }
}

async function obterHistorico(client) {
  await client.query('CREATE SCHEMA IF NOT EXISTS drizzle');
  await client.query(`
    CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at bigint
    )
  `);

  const historico = await client.query(
    'SELECT hash, created_at FROM drizzle.__drizzle_migrations ORDER BY created_at',
  );

  return historico.rows;
}

async function arquivoPossuiSalaoId(client) {
  const resultado = await client.query(
    "SELECT is_nullable FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'arquivo' AND column_name = 'salao_id'",
  );

  if (resultado.rowCount === 0) {
    return false;
  }

  if (resultado.rows[0].is_nullable !== 'NO') {
    throw new Error('arquivo.salao_id precisa ser NOT NULL para adotar a 0001.');
  }

  const foreignKey = await client.query(
    "SELECT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.arquivo'::regclass AND conname = 'arquivo_salao_id_salao_id_fk') AS existe",
  );

  if (!foreignKey.rows[0].existe) {
    throw new Error(
      'A FK arquivo_salao_id_salao_id_fk nao existe; a 0001 nao pode ser adotada.',
    );
  }

  return true;
}

function obterMigrationsParaAdotar(possuiSalaoId) {
  const entries = lerJson('meta/_journal.json').entries;
  const tags = possuiSalaoId
    ? [BASELINE_TAG, ARQUIVO_SALAO_TAG]
    : [BASELINE_TAG];

  return tags.map((tag) => {
    const entry = entries.find((candidate) => candidate.tag === tag);

    if (!entry) {
      throw new Error(`Migration ${tag} nao encontrada no journal.`);
    }

    const sql = fs.readFileSync(path.join(MIGRATION_FOLDER, `${tag}.sql`));

    return {
      hash: crypto.createHash('sha256').update(sql).digest('hex'),
      tag,
      when: entry.when,
    };
  });
}

function validarHistoricoExistente(historico, migrations) {
  for (const migration of migrations) {
    const registrada = historico.find(
      (item) => Number(item.created_at) === migration.when,
    );

    if (!registrada || registrada.hash !== migration.hash) {
      throw new Error(
        'O historico de migrations nao corresponde ao schema local. Corrija-o antes de continuar.',
      );
    }
  }
}

function lerJson(caminhoRelativo) {
  return JSON.parse(
    fs.readFileSync(path.join(MIGRATION_FOLDER, caminhoRelativo), 'utf8'),
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
