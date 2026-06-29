import { Module } from '@nestjs/common'
import { CourseOptionsService } from './course-options.service'
import { EnrollmentsService } from './enrollments.service'
import { EnrollmentsController } from './enrollments.controller'

@Module({
  providers: [EnrollmentsService, CourseOptionsService],
  controllers: [EnrollmentsController],
})
export class EnrollmentsModule {}
