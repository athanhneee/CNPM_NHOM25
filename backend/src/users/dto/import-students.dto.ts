import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator'

export class ImportStudentCandidateDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  fullName: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  code: string

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  rowNumber?: number
}

export class ImportStudentsDto {
  @ApiProperty({ type: [ImportStudentCandidateDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportStudentCandidateDto)
  students: ImportStudentCandidateDto[]
}
