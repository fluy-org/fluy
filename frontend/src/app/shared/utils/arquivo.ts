// Workaround para falha no WebKit/Safari com Service Worker (WebKit Bug 319985):
// arquivos de input lazy perdem os bytes ao passar pelo fetch do Service Worker.
// Ler o buffer previamente para a memoria garante o envio correto do payload.
export async function carregarArquivoEmMemoria(arquivo: File): Promise<File> {
  const buffer = await arquivo.arrayBuffer();
  return new File([buffer], arquivo.name, {
    type: arquivo.type,
    lastModified: arquivo.lastModified,
  });
}

