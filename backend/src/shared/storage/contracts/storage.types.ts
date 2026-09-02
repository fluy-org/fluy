import type { Readable } from 'node:stream';

export const STORAGE_PROVIDER = Symbol('STORAGE_PROVIDER');

export type PutStorageObjectInput = {
  body: Uint8Array;
  contentType: string;
  key: string;
};

export type StorageObject = {
  body: Readable;
  contentLength: number | undefined;
  contentType: string | undefined;
};

export interface StorageProvider {
  putObject(input: PutStorageObjectInput): Promise<void>;
  getObject(key: string): Promise<StorageObject>;
  deleteObject(key: string): Promise<void>;
}
