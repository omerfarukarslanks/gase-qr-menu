import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security
  app.use(helmet());
  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  });

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Global filters and interceptors
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('GASE QR Menu API')
    .setDescription('Backend API for GASE QR Menu System')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .addTag('organizations', 'Organization management')
    .addTag('stores', 'Store management')
    .addTag('categories', 'Category management')
    .addTag('products', 'Product management')
    .addTag('menus', 'Menu management')
    .addTag('tables', 'Table management')
    .addTag('orders', 'Order management')
    .addTag('cart', 'Cart management')
    .addTag('payments', 'Payment processing')
    .addTag('notifications', 'Notification management')
    .addTag('campaigns', 'Campaign management')
    .addTag('stock', 'Stock management')
    .addTag('kitchen', 'Kitchen display system')
    .addTag('reports', 'Reporting and analytics')
    .addTag('upload', 'File uploads')
    .addTag('customers', 'Customer management')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`GASE QR Menu API running on port ${port}`);
  console.log(`Swagger docs available at http://localhost:${port}/api/docs`);
}

bootstrap();
