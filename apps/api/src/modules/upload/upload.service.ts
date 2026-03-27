import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client as MinioClient } from 'minio';
import sharp from 'sharp';
import { v4 as uuid } from 'uuid';
import * as path from 'path';

@Injectable()
export class UploadService implements OnModuleInit {
  private readonly logger = new Logger('UploadService');
  private minio: MinioClient;
  private bucket: string;
  private publicUrl: string;
  private region: string;

  constructor(private configService: ConfigService) {
    const s3Config = this.configService.get('s3');
    const endpoint = new URL(s3Config?.endpoint || 'http://localhost:9000');

    this.minio = new MinioClient({
      endPoint: endpoint.hostname,
      port: endpoint.port ? Number(endpoint.port) : endpoint.protocol === 'https:' ? 443 : 80,
      useSSL: endpoint.protocol === 'https:',
      accessKey: s3Config?.accessKey || 'minioadmin',
      secretKey: s3Config?.secretKey || 'minioadmin',
      region: s3Config?.region || 'us-east-1',
    });

    this.bucket = s3Config?.bucket || 'gase-uploads';
    this.publicUrl = s3Config?.publicUrl || 'http://localhost:9000/gase-uploads';
    this.region = s3Config?.region || 'us-east-1';
  }

  async onModuleInit() {
    try {
      const exists = await this.minio.bucketExists(this.bucket);

      if (!exists) {
        await this.minio.makeBucket(this.bucket, this.region);
        this.logger.log(`Created bucket: ${this.bucket}`);
      }
    } catch (error: any) {
      this.logger.error(`Failed to ensure bucket ${this.bucket}: ${error.message}`);
    }
  }

  async uploadImage(
    file: Express.Multer.File,
    folder: string = 'general',
  ): Promise<{ url: string; thumbnailUrl: string; key: string }> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Allowed: JPEG, PNG, WebP, GIF');
    }

    const fileId = uuid();

    const optimizedBuffer = await sharp(file.buffer)
      .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();

    const thumbnailBuffer = await sharp(file.buffer)
      .resize(300, 300, { fit: 'cover' })
      .webp({ quality: 75 })
      .toBuffer();

    const key = `${folder}/${fileId}.webp`;
    const thumbnailKey = `${folder}/${fileId}_thumb.webp`;

    await Promise.all([
      this.minio.putObject(this.bucket, key, optimizedBuffer, optimizedBuffer.length, {
        'Content-Type': 'image/webp',
      }),
      this.minio.putObject(
        this.bucket,
        thumbnailKey,
        thumbnailBuffer,
        thumbnailBuffer.length,
        {
          'Content-Type': 'image/webp',
        },
      ),
    ]);

    return {
      url: `${this.publicUrl}/${key}`,
      thumbnailUrl: `${this.publicUrl}/${thumbnailKey}`,
      key,
    };
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'general',
  ): Promise<{ url: string; key: string }> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const fileId = uuid();
    const ext = path.extname(file.originalname);
    const key = `${folder}/${fileId}${ext}`;

    await this.minio.putObject(this.bucket, key, file.buffer, file.buffer.length, {
      'Content-Type': file.mimetype,
    });

    return {
      url: `${this.publicUrl}/${key}`,
      key,
    };
  }

  async deleteFile(key: string): Promise<void> {
    await this.minio.removeObject(this.bucket, key);
  }
}
