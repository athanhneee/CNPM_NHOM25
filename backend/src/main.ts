import { BadRequestException, ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import * as dotenv from 'dotenv'
import { AppModule } from './app.module'

dotenv.config()

function assertRequiredEnv() {
  const requiredKeys = ['DATABASE_URL', 'JWT_SECRET']
  const missing = requiredKeys.filter((key) => !process.env[key])
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }
}

async function bootstrap() {
  assertRequiredEnv()

  const app = await NestFactory.create(AppModule)
  const frontendOrigin = process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173'

  app.enableCors({
    origin: frontendOrigin.split(',').map((origin) => origin.trim()),
    credentials: true,
  })

  app.setGlobalPrefix('api')
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
      exceptionFactory: (errors) =>
        new BadRequestException({
          message: 'Dữ liệu gửi lên không hợp lệ.',
          errors: errors.map((error) => ({
            field: error.property,
            constraints: error.constraints,
          })),
        }),
    }),
  )

  const config = new DocumentBuilder()
    .setTitle('CNPM Nhóm 25 API')
    .setDescription('Backend API cho hệ thống đăng ký học phần')
    .setVersion('1.0')
    .addBearerAuth()
    .build()

  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api', app, document)

  const port = Number(process.env.PORT ?? 3000)
  await app.listen(port)
  console.log(`Backend running on http://localhost:${port}/api`)
}

bootstrap()
