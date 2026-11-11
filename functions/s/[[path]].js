import { servirIndexCliente } from '../_shared/servir-index-cliente.js';

export function onRequest(context) {
  return servirIndexCliente(context);
}
