import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import * as sharp from 'sharp';
import { v4 as uuid } from 'uuid';
import * as path from 'path';

@Injectable()
export class UploadService {
  private s3: S3Client;
  private bucket: string;
  private publicUrl: string;

  constructor(private configService: ConfigService) {
    const s3Config = this.configService.get('app.s3');

    this.s3 = new S3Client({
      endpoint: s3Config?.endpoint || 'http://localhost:9000',
      region: s3Config?.region || 'us-east-1',
      credentials: {
        accessKeyId: s3Config?.accessKey || 'minioadmin',
        secretAccessKey: s3Config?.secretKey || 'minioadmin',
      },
      forcePathStyle: true,
    });

    this.bucket = s3Config?.bucket || 'gase-uploads';
    this.publicUrl = s3Config?.publicUrl || 'http://localhost:9000/gase-uploads';
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
    const ext = path.extname(file.originalname) || '.jpg';

    // Resize and optimize original
    const optimizedBuffer = await sharp(file.buffer)
      .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();

    // Create thumbnail
    const thumbnailBuffer = await sharp(file.buffer)
      .resize(300, 300, { fit: 'cover' })
      .webp({ quality: 75 })
      .toBuffer();

    const key = `${folder}/${fileId}.webp`;
    const thumbnailKey = `${folder}/${fileId}_thumb.webp`;

    await Promise.all([
      this.s3.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: optimizedBuffer,
          ContentType: 'image/webp',
        }),
      ),
      this.s3.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: thumbnailKey,
          Body: thumbnailBuffer,
          ContentType: 'image/webp',
        }),
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

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    return {
      url: `${this.publicUrl}/${key}`,
      key,
    };
  }

  async deleteFile(key: string): Promise<void> {
    await this.s3.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }
}
