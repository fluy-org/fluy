export type RequestInput = {
  method: 'GET' | 'POST' | 'PUT';
  path: string;
  body?: unknown;
  headers?: Record<string, string>;
};
