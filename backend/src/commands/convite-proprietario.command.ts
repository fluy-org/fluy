import { NestFactory } from '@nestjs/core';
import { z } from 'zod';
import { ConviteProprietarioCommandModule } from '@/commands/convite-proprietario-command.module';
import { ConviteProprietarioService } from '@/modules/convite-proprietario/convite-proprietario.service';

const emitirSchema = z.object({
  email: z.email(),
  dias: z.coerce.number().int().min(1).max(30).optional(),
});
const revogarSchema = z.object({ id: z.string().trim().min(1) });

async function executar(): Promise<void> {
  const aplicacao = await NestFactory.createApplicationContext(
    ConviteProprietarioCommandModule,
    { logger: false },
  );

  try {
    const service = aplicacao.get(ConviteProprietarioService);
    const [operacao] = process.argv.slice(2);
    const opcoes = lerOpcoes(process.argv.slice(3));

    if (operacao === 'emitir') {
      const input = emitirSchema.safeParse(opcoes);

      if (!input.success) {
        falhar(
          'Uso: convite:proprietario -- emitir --email pessoa@exemplo.com [--dias 7]',
        );
        return;
      }

      const resultado = await service.emitir({
        email: input.data.email,
        diasValidade: input.data.dias,
      });

      switch (resultado.status) {
        case 'emitido':
          escrever(`Convite emitido para ${resultado.email}.`);
          escrever(`ID do convite no Clerk: ${resultado.clerkConviteId}`);
          escrever(`Expira em: ${resultado.expiraEm.toISOString()}`);
          escrever('Copie o link abaixo e envie manualmente pelo WhatsApp:');
          escrever(resultado.url);
          return;
        case 'duplicado':
          falhar(
            `Já existe um convite pendente para este e-mail no Clerk (ID ${resultado.clerkConviteId}, expira em ${resultado.expiraEm.toISOString()}). Revogue-o antes de emitir outro.`,
          );
          return;
        case 'configuracao_ausente':
          falhar(
            'OWNER_INVITE_REDIRECT_URL ou OWNER_INVITE_METADATA_SECRET não está configurada.',
          );
          return;
        case 'falha_integracao':
          falhar(
            'Não foi possível concluir a emissão. Verifique as Application Invitations no Clerk antes de tentar novamente.',
          );
          return;
      }
    }

    if (operacao === 'revogar') {
      const input = revogarSchema.safeParse(opcoes);

      if (!input.success) {
        falhar('Uso: convite:proprietario -- revogar --id ID_DO_CLERK');
        return;
      }

      const resultado = await service.revogar(input.data.id);

      if (resultado.status === 'revogado') {
        escrever('Convite revogado no Clerk.');
        return;
      }

      falhar(
        'Não foi possível revogar o convite no Clerk. Confira o ID e o estado no Dashboard.',
      );
      return;
    }

    falhar(
      'Operação inválida. Use emitir --email pessoa@exemplo.com ou revogar --id ID_DO_CLERK.',
    );
  } finally {
    await aplicacao.close();
  }
}

function lerOpcoes(argumentos: string[]): Record<string, string> {
  const opcoes: Record<string, string> = {};

  for (let indice = 0; indice < argumentos.length; indice += 1) {
    const argumento = argumentos[indice];

    if (!argumento.startsWith('--')) {
      continue;
    }

    const [nome, valorInline] = argumento.slice(2).split('=', 2);
    const valor = valorInline ?? argumentos[indice + 1];

    if (valorInline === undefined) {
      indice += 1;
    }

    if (nome && valor) {
      opcoes[nome] = valor;
    }
  }

  return opcoes;
}

function escrever(mensagem: string): void {
  process.stdout.write(`${mensagem}\n`);
}

function falhar(mensagem: string): void {
  process.stderr.write(`${mensagem}\n`);
  process.exitCode = 1;
}

void executar().catch(() => {
  falhar(
    'O comando administrativo falhou. Nenhum token ou link foi registrado; confira a configuração e tente novamente.',
  );
});
