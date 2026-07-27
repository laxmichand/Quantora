import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AppValidationPipe } from './common/pipes/validation.pipe';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.useGlobalPipes(AppValidationPipe);

  app.enableCors({
    origin: [
      'http://localhost:4200',
      'http://localhost:80',
      'https://quantora.vercel.app',
      'https://quantora-web.vercel.app',
      'https://quantora-ih3a.onrender.com',
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.useGlobalInterceptors(new LoggingInterceptor());

  const config = new DocumentBuilder()
    .setTitle('Quantora API')
    .setDescription('Quantora - Intelligent Investing. Simplified.')
    .setVersion('0.0.1')
    .addTag('health', 'Health check endpoints')
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management endpoints')
    .addTag('portfolios', 'Portfolio management endpoints')
    .addTag('stocks', 'Stock data endpoints')
    .addTag('scores', 'AI scoring endpoints')
    .addTag('chat', 'AI chat endpoints')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Quantora Backend running on http://localhost:${port}`);
  console.log(`Swagger docs: http://localhost:${port}/api/docs`);
}
bootstrap();
