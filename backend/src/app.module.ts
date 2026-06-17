import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { PrismaModule } from './prisma/prisma.module'
import { AuthModule } from './auth/auth.module'
import { UsersModule } from './users/users.module'
import { CoursesModule } from './courses/courses.module'
import { SectionsModule } from './sections/sections.module'
import { EnrollmentsModule } from './enrollments/enrollments.module'
import { SchedulesModule } from './schedules/schedules.module'
import { LogsModule } from './logs/logs.module'
import { SettingsModule } from './settings/settings.module'
import { SnapshotModule } from './snapshot/snapshot.module'
import { ReportsModule } from './reports/reports.module'
import { WishesModule } from './wishes/wishes.module'
import { APP_GUARD } from '@nestjs/core'
import { MaintenanceGuard } from './common/guards/maintenance.guard'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    PrismaModule,
    AuthModule,
    UsersModule,
    CoursesModule,
    SectionsModule,
    EnrollmentsModule,
    SchedulesModule,
    LogsModule,
    SettingsModule,
    SnapshotModule,
    ReportsModule,
    WishesModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: MaintenanceGuard,
    },
  ],
})
export class AppModule {}
