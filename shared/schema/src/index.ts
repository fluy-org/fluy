// Registro central do schema Drizzle.
// Cada tabela vive em seu próprio arquivo (src/tables/*.ts) e é re-exportada aqui.
// O objeto `schema` é passado ao cliente Drizzle no backend para habilitar o Query API tipado.
//
// Regra: este pacote só depende de drizzle-orm, drizzle-zod e zod.
// NADA de @nestjs/*, pg, postgres — se aparecer, vaza pro front.

export const schema = {} as const;

export type Schema = typeof schema;
