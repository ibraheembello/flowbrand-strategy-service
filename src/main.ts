import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import 'reflect-metadata';
import { AppModule } from './app.module';
import { initializeDataSource } from './database/data-source';
import { ResponseInterceptor } from './shared/interceptors/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Initialise the TypeORM data source explicitly so a DB connection error
  // surfaces here as a clear fatal, not as a confusing module init error.
  try {
    await initializeDataSource();
    // eslint-disable-next-line no-console
    console.log('Data source initialised.');
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Data source init failed:', err);
    process.exit(1);
  }

  app.setGlobalPrefix('api/v1', { exclude: ['probe', 'health', 'api/docs', 'api/docs-json', '/'] });
  app.enableCors();
  app.useGlobalInterceptors(new ResponseInterceptor());

  const config = app.get(ConfigService);
  const port = +(config.get<number>('PORT') ?? 3009);

  const swaggerConfig = new DocumentBuilder()
    .setTitle('FlowBrand Strategy Service')
    .setDescription('AI-powered marketing strategy generation. See RFC for design rationale.')
    .setVersion('0.1.0')
    .addBearerAuth()
    .addTag('strategies', 'Generate and read strategies')
    .addTag('health', 'Liveness and health probes')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`flowbrand-strategy-service listening on http://localhost:${port}/api/v1`);
  // eslint-disable-next-line no-console
  console.log(`Swagger: http://localhost:${port}/api/docs`);
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Bootstrap failed:', err);
  process.exit(1);
});
