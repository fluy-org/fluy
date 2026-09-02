import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Readable } from 'node:stream';
import type { Env } from '@/config/env.schema';
import type {
  PutStorageObjectInput,
  StorageObject,
  StorageProvider,
} from '@/shared/storage/contracts';

@Injectable()
export class R2StorageProvider implements StorageProvider {
  private readonly bucket: string;
  private readonly client: S3Client;

  constructor(private readonly config: ConfigService<Env, true>) {
    this.bucket = this.config.get('STORAGE_BUCKET', { infer: true });
    this.client = new S3Client({
      endpoint: this.config.get('STORAGE_ENDPOINT', { infer: true }),
      region: this.config.get('STORAGE_REGION', { infer: true }),
      credentials: {
        accessKeyId: this.config.get('STORAGE_ACCESS_KEY_ID', {
          infer: true,
        }),
        secretAccessKey: this.config.get('STORAGE_SECRET_ACCESS_KEY', {
          infer: true,
        }),
      },
    });
  }

  async putObject({
    body,
    contentType,
    key,
  }: PutStorageObjectInput): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
  }

  async getObject(key: string): Promise<StorageObject> {
    const response = await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );

    if (!(response.Body instanceof Readable)) {
      throw new Error('Resposta de leitura do storage sem stream Node.');
    }

    return {
      body: response.Body,
      contentLength: response.ContentLength,
      contentType: response.ContentType,
    };
  }

  async deleteObject(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }
}
