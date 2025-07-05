import { $Enums } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsISO8601,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateInterviewDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsISO8601()
  @IsNotEmpty()
  schedule_date: string;
}

export class CursorPaginationDto {
  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  limit: number = 10;
}

export class UpdateInterviewDto {
  user_id: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsISO8601()
  @IsNotEmpty()
  schedule_date: string;
}

export class ChangeStatusInterviewDto {
  user_id: string;

  @IsEnum($Enums.InterviewsStatus)
  @IsNotEmpty()
  status: $Enums.InterviewsStatus;
}

export class CreateCommentInterviewDto {
  user_id: string;

  @IsString()
  @IsNotEmpty()
  comment: string;
}

export class UpdateCommentInterviewDto {
  user_id: string;

  @IsString()
  @IsNotEmpty()
  comment_id: string;

  @IsString()
  @IsNotEmpty()
  comment: string;
}
