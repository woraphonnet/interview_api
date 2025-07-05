import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Request,
  Query,
  ValidationPipe,
  Put,
  Patch,
} from '@nestjs/common';
import { InterviewService } from './interview.service';
import {
  ChangeStatusInterviewDto,
  CreateCommentInterviewDto,
  CreateInterviewDto,
  CursorPaginationDto,
  UpdateCommentInterviewDto,
  UpdateInterviewDto,
} from './dto/request.dto';
import { Roles } from 'src/auth/roles.guard';

@Controller('interview')
export class InterviewController {
  constructor(private readonly interviewService: InterviewService) {}

  @Get()
  findAll(
    @Query(new ValidationPipe({ transform: true }))
    cursorPaginationDto: CursorPaginationDto,
  ) {
    return this.interviewService.findAll(cursorPaginationDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.interviewService.findOne(id);
  }

  @Post()
  @Roles('admin', 'hr')
  create(@Request() req, @Body() createInterviewDto: CreateInterviewDto) {
    const userId = req.user.id;
    return this.interviewService.create(userId, createInterviewDto);
  }

  @Put(':id')
  @Roles('admin', 'hr')
  update(
    @Param('id') id: string,
    @Request() req,
    @Body() updateInterviewDto: UpdateInterviewDto,
  ) {
    const userId = req.user.id;
    updateInterviewDto.user_id = userId;
    return this.interviewService.update(id, updateInterviewDto);
  }

  @Delete(':id')
  @Roles('admin', 'hr')
  remove(@Param('id') id: string, @Request() req) {
    const userId = req.user.id;
    return this.interviewService.remove(id, userId);
  }

  @Patch('archive/:id')
  @Roles('admin', 'hr')
  archive(@Param('id') id: string, @Request() req) {
    const userId = req.user.id;
    return this.interviewService.archive(id, userId);
  }

  @Patch('change-status/:id')
  @Roles('admin', 'hr')
  changeStatus(
    @Param('id') id: string,
    @Request() req,
    @Body() changeStatusInterviewDto: ChangeStatusInterviewDto,
  ) {
    const userId = req.user.id;
    changeStatusInterviewDto.user_id = userId;
    return this.interviewService.changeStatus(id, changeStatusInterviewDto);
  }

  // ********** For interview comment **********
  @Get(':interviewId/comments')
  findCommentsByInterviewId(@Param('interviewId') id: string) {
    return this.interviewService.findCommentsByInterviewId(id);
  }

  @Post(':interviewId/comment')
  createComment(
    @Request() req,
    @Param('interviewId') interviewId,
    @Body() createCommentInterviewDto: CreateCommentInterviewDto,
  ) {
    const userId = req.user.id;
    createCommentInterviewDto.user_id = userId;
    return this.interviewService.createComment(
      interviewId,
      createCommentInterviewDto,
    );
  }

  @Put(':interviewId/comment')
  updateComment(
    @Request() req,
    @Param('interviewId') interviewId,
    @Body() updateCommentInterviewDto: UpdateCommentInterviewDto,
  ) {
    const userId = req.user.id;
    updateCommentInterviewDto.user_id = userId;
    return this.interviewService.updateComment(
      interviewId,
      updateCommentInterviewDto,
    );
  }

  @Delete('comment/:id')
  removeComment(@Param('id') id: string, @Request() req) {
    const userId = req.user.id;
    return this.interviewService.removeComment(id, userId);
  }
}
