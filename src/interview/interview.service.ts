import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import {
  ChangeStatusInterviewDto,
  CreateCommentInterviewDto,
  CreateInterviewDto,
  CursorPaginationDto,
  UpdateCommentInterviewDto,
  UpdateInterviewDto,
} from './dto/request.dto';

@Injectable()
export class InterviewService {
  constructor(private prisma: PrismaService) {}
  create(user_id: string, createInterviewDto: CreateInterviewDto) {
    return this.prisma.$transaction(async ($transaction) => {
      const interviewCreated = await $transaction.interview.create({
        data: {
          title: createInterviewDto.title,
          description: createInterviewDto.description,
          schedule_date: createInterviewDto.schedule_date,
          created_by: user_id,
        },
      });
      await $transaction.interviewHistory.create({
        data: {
          change_type: 'create',
          changed_by: user_id,
          detail: `สร้างการสัมภาษณ์ใหม่: ${interviewCreated.title}`,
          interview_id: interviewCreated.id,
        },
      });
      return interviewCreated;
    });
  }

  async findAll({ limit, cursor }: CursorPaginationDto) {
    return this.prisma.interview.findMany({
      take: limit,
      ...{
        skip: cursor ? 1 : 0,
        cursor: cursor
          ? {
              id: cursor,
            }
          : undefined,
      },
      include: {
        creator: {
          select: {
            id: true,
            full_name: true,
          },
        },
        histories: {
          orderBy: {
            created_at: 'desc',
          },
        },
      },
      where: {
        is_archived: false,
      },
      orderBy: {
        created_at: 'asc',
      },
    });
  }

  async findOne(id: string) {
    const interview = await this.prisma.interview.findFirst({
      select: {
        id: true,
        title: true,
        description: true,
        schedule_date: true,
        status: true,
        created_at: true,
        creator: {
          select: {
            id: true,
            full_name: true,
          },
        },
        histories: {
          orderBy: {
            created_at: 'desc',
          },
        },
        comments: {
          orderBy: {
            created_at: 'desc',
          },
        },
      },
      where: {
        id,
      },
    });
    if (!interview) {
      throw new BadRequestException(`ไม่พบการสัมภาษณ์`);
    }
    return interview;
  }

  async update(id: string, updateInterviewDto: UpdateInterviewDto) {
    return this.prisma.$transaction(async ($transaction) => {
      const interview = await $transaction.interview.findUnique({
        where: {
          is_archived: false,
          id: id,
        },
      });
      if (!interview) {
        throw new BadRequestException(
          `ไม่พบการสัมภาษณ์ที่ต้องการแก้ไข หรือไม่สามารถแก้ไขได้`,
        );
      }
      const updatedInterview = await $transaction.interview.update({
        where: {
          id: id,
        },
        data: {
          title: updateInterviewDto.title,
          description: updateInterviewDto.description,
          schedule_date: updateInterviewDto.schedule_date,
        },
      });
      await $transaction.interviewHistory.create({
        data: {
          change_type: 'edit',
          changed_by: updateInterviewDto.user_id,
          detail: `แก้ไขการสัมภาษณ์: ${updatedInterview.title}`,
          interview_id: updatedInterview.id,
        },
      });
      return updatedInterview;
    });
  }

  async remove(id: string, user_id: string) {
    const interview = await this.prisma.interview.findFirst({
      where: {
        is_archived: false,
        id,
      },
    });
    if (!interview) {
      throw new BadRequestException(
        `ไม่พบการสัมภาษณ์ที่ต้องการลบ หรือไม่สามารถลบได้`,
      );
    }
    return this.prisma.$transaction(async ($transaction) => {
      const interview = await $transaction.interview.update({
        data: {
          deleted_at: new Date(),
        },
        where: {
          id,
        },
      });
      await $transaction.interviewHistory.create({
        data: {
          change_type: 'delete',
          changed_by: user_id,
          detail: `ลบการสัมภาษณ์: ${interview.title}`,
          interview_id: interview.id,
        },
      });
      return true;
    });
  }

  async archive(id: string, user_id: string) {
    const interview = await this.prisma.interview.findFirst({
      where: {
        is_archived: false,
        id,
      },
    });
    if (!interview) {
      throw new BadRequestException(`ไม่พบการสัมภาษณ์ หรือถูกจัดเก็บไปแล้ว`);
    }
    return this.prisma.$transaction(async ($transaction) => {
      const updatedInterview = await $transaction.interview.update({
        data: {
          is_archived: true,
        },
        where: {
          id,
        },
      });
      await $transaction.interviewHistory.create({
        data: {
          change_type: 'archive',
          changed_by: user_id,
          detail: `จัดเก็บการสัมภาษณ์: ${updatedInterview.title}`,
          interview_id: updatedInterview.id,
        },
      });
      return true;
    });
  }

  async changeStatus(
    id: string,
    changeStatusInterviewDto: ChangeStatusInterviewDto,
  ) {
    const interview = await this.prisma.interview.findFirst({
      where: {
        is_archived: false,
        id,
      },
    });
    if (!interview) {
      throw new BadRequestException(`ไม่พบการสัมภาษณ์ที่ต้องการเปลี่ยนสถานะ`);
    }
    if (interview.status === changeStatusInterviewDto.status) {
      throw new BadRequestException(
        `สถานะการสัมภาษณ์ไม่สามารถเปลี่ยนเป็นสถานะเดิมได้`,
      );
    }
    return this.prisma.$transaction(async ($transaction) => {
      const updatedInterview = await $transaction.interview.update({
        data: {
          status: changeStatusInterviewDto.status,
        },
        where: {
          id,
        },
      });
      await $transaction.interviewHistory.create({
        data: {
          change_type: 'edit',
          changed_by: changeStatusInterviewDto.user_id,
          detail: `เปลี่ยนสถานะการสัมภาษณ์: ${updatedInterview.title} จาก ${interview.status} เป็น ${changeStatusInterviewDto.status}`,
          interview_id: updatedInterview.id,
        },
      });
      return updatedInterview;
    });
  }

  // ********** For interview comment **********
  async findCommentsByInterviewId(interviewId: string) {
    const interview = await this.prisma.interview.findFirst({
      select: {
        id: true,
      },
      where: {
        is_archived: false,
        id: interviewId,
      },
    });
    if (!interview) {
      throw new BadRequestException(`ไม่พบการสัมภาษณ์`);
    }

    const interviewComments = await this.prisma.interviewComment.findMany({
      where: {
        interview: {
          is_archived: false,
          id: interviewId,
        },
      },
      include: {
        commenter: {
          select: {
            id: true,
            full_name: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });
    return interviewComments;
  }

  async createComment(
    interviewId: string,
    createCommentInterviewDto: CreateCommentInterviewDto,
  ) {
    const interview = await this.prisma.interview.findFirst({
      select: {
        id: true,
      },
      where: {
        is_archived: false,
        id: interviewId,
      },
    });
    if (!interview) {
      throw new BadRequestException(`ไม่พบการสัมภาษณ์`);
    }
    return await this.prisma.interviewComment.create({
      data: {
        comment: createCommentInterviewDto.comment,
        commenter_id: createCommentInterviewDto.user_id,
        interview_id: interviewId,
      },
      include: {
        commenter: {
          select: {
            id: true,
            full_name: true,
          },
        },
      },
    });
  }

  async updateComment(
    interviewId: string,
    updateCommentInterviewDto: UpdateCommentInterviewDto,
  ) {
    const interview = await this.prisma.interview.findFirst({
      select: {
        id: true,
      },
      where: {
        is_archived: false,
        id: interviewId,
      },
    });
    if (!interview) {
      throw new BadRequestException(`ไม่พบการสัมภาษณ์`);
    }

    const comment = await this.prisma.interviewComment.findFirst({
      where: {
        id: updateCommentInterviewDto.comment_id,
      },
    });
    if (!comment) {
      throw new BadRequestException(`ไม่พบคอมเมนต์`);
    }
    if (updateCommentInterviewDto.user_id !== comment.commenter_id) {
      throw new BadRequestException(`ไม่สามารถแก้ไขคอมเมนต์คนอื่นได้`);
    }

    return await this.prisma.interviewComment.update({
      data: {
        comment: updateCommentInterviewDto.comment,
      },
      where: {
        id: updateCommentInterviewDto.comment_id,
      },
      include: {
        commenter: {
          select: {
            id: true,
            full_name: true,
          },
        },
      },
    });
  }

  async removeComment(comment_id: string, user_id: string) {
    const comment = await this.prisma.interviewComment.findFirst({
      where: {
        id: comment_id,
      },
    });
    if (!comment) {
      throw new BadRequestException(`ไม่พบคอมเมนต์`);
    }
    if (user_id !== comment.commenter_id) {
      throw new BadRequestException(`ไม่สามารถลบคอมเมนต์คนอื่นได้`);
    }
    await this.prisma.interviewComment.update({
      data: {
        deleted_at: new Date(),
      },
      where: {
        id: comment_id,
      },
    });
    return true;
  }
}
