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

type SupportedImageKind = 'jpeg' | 'png' | 'webp' | 'gif';
type UnsupportedImageKind = 'heic' | 'heif' | 'avif' | 'unknown';

@Injectable()
export class UploadService implements OnModuleInit {
  private readonly logger = new Logger('UploadService');
  private minio: MinioClient;
  private bucket: string;
  private publicUrl: string;
  private region: string;
  private publicRead: boolean;

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
    this.publicRead = s3Config?.publicRead !== false;
  }

  async onModuleInit() {
    try {
      const exists = await this.minio.bucketExists(this.bucket);

      if (!exists) {
        await this.minio.makeBucket(this.bucket, this.region);
        this.logger.log(`Created bucket: ${this.bucket}`);
      }

      if (this.publicRead) {
        await this.ensurePublicReadPolicy();
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

    if (!file.buffer?.length) {
      throw new BadRequestException('Uploaded file is empty');
    }

    const imageKind = this.detectImageKind(file.buffer);

    if (imageKind === 'heic' || imageKind === 'heif') {
      throw new BadRequestException(
        'HEIC/HEIF images are not supported yet. Please convert the image to JPEG, PNG, WebP, or GIF.',
      );
    }

    if (imageKind === 'avif') {
      throw new BadRequestException(
        'AVIF images are not supported for this upload endpoint yet. Please use JPEG, PNG, WebP, or GIF.',
      );
    }

    if (imageKind === 'unknown') {
      throw new BadRequestException(
        'Invalid image file. Allowed formats: JPEG, PNG, WebP, GIF.',
      );
    }

    const fileId = uuid();
    let optimizedBuffer: Buffer;
    let thumbnailBuffer: Buffer;

    try {
      optimizedBuffer = await sharp(file.buffer)
        .rotate()
        .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 85 })
        .toBuffer();

      thumbnailBuffer = await sharp(file.buffer)
        .rotate()
        .resize(300, 300, { fit: 'cover' })
        .webp({ quality: 75 })
        .toBuffer();
    } catch (error: any) {
      this.logger.warn(
        `Image processing failed for ${file.originalname}: ${error?.message || 'Unknown error'}`,
      );
      throw new BadRequestException(
        'Image could not be processed. Please upload a valid JPEG, PNG, WebP, or GIF file.',
      );
    }

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

  private async ensurePublicReadPolicy() {
    const publicReadPolicy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${this.bucket}/*`],
        },
      ],
    };

    await this.minio.setBucketPolicy(this.bucket, JSON.stringify(publicReadPolicy));
    this.logger.log(`Ensured public read policy for bucket: ${this.bucket}`);
  }

  private detectImageKind(buffer: Buffer): SupportedImageKind | UnsupportedImageKind {
    if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return 'jpeg';
    }

    if (
      buffer.length >= 8 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    ) {
      return 'png';
    }

    if (
      buffer.length >= 12 &&
      buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buffer.subarray(8, 12).toString('ascii') === 'WEBP'
    ) {
      return 'webp';
    }

    if (
      buffer.length >= 6 &&
      (buffer.subarray(0, 6).toString('ascii') === 'GIF87a' ||
        buffer.subarray(0, 6).toString('ascii') === 'GIF89a')
    ) {
      return 'gif';
    }

    if (buffer.length >= 12 && buffer.subarray(4, 8).toString('ascii') === 'ftyp') {
      const brand = buffer.subarray(8, 12).toString('ascii').trim().toLowerCase();

      if (['heic', 'heix', 'hevc', 'hevx'].includes(brand)) {
        return 'heic';
      }

      if (['mif1', 'msf1', 'heim', 'heis'].includes(brand)) {
        return 'heif';
      }

      if (['avif', 'avis'].includes(brand)) {
        return 'avif';
      }
    }

    return 'unknown';
  }
}
