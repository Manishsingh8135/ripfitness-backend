import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as compression from 'compression';
import helmet from 'helmet';
import { AppModule } from './app.module';
import * as net from 'net';

async function findAvailablePort(startPort: number): Promise<number> {
  const isPortAvailable = (port: number): Promise<boolean> => {
    return new Promise((resolve) => {
      const server = net.createServer();
      server.once('error', () => {
        resolve(false);
      });
      server.once('listening', () => {
        server.close();
        resolve(true);
      });
      server.listen(port);
    });
  };

  let port = startPort;
  while (!(await isPortAvailable(port))) {
    console.log(`⚠️  Port ${port} is in use, trying ${port + 1}...`);
    port++;
  }
  return port;
}

async function bootstrap() {
  try {
    console.log('🚀 Starting RIP Fitness API...');
    
    const app = await NestFactory.create(AppModule);
    console.log('✅ NestJS application created');

    // Security
    console.log('🔒 Configuring security middleware...');
    app.use(helmet());
    app.use(compression());
    app.enableCors();
    console.log('✅ Security middleware configured');

    // Validation
    console.log('🔍 Setting up validation pipe...');
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }));
    console.log('✅ Validation pipe configured');

    // Swagger Documentation
    console.log('📚 Setting up Swagger documentation...');
    const config = new DocumentBuilder()
      .setTitle('RIP Fitness API')
      .setDescription('The RIP Fitness API documentation')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);
    console.log('✅ Swagger documentation configured');

    // Find available port
    const defaultPort = parseInt(process.env.PORT || '3000', 10);
    console.log(`🔍 Finding available port starting from ${defaultPort}...`);
    const port = await findAvailablePort(defaultPort);
    
    await app.listen(port);
    console.log('');
    console.log('🎉 Application successfully started!');
    console.log(`🌐 Server: http://localhost:${port}`);
    console.log(`📖 Swagger: http://localhost:${port}/api`);
    console.log('');
  } catch (error) {
    console.error('❌ Error starting application:', error);
    process.exit(1);
  }
}

bootstrap();
