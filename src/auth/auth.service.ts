import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/request.dto';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async validateUser(email, pass: string) {
    const user = await this.userService.findEmail(email);
    if (!user) {
      return null;
    }

    const resultCompare = await bcrypt.compare(pass, `${user.password_hash}`);
    if (!resultCompare) {
      throw new UnauthorizedException('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    }
    return {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
    };
  }

  login(user: any) {
    const payload = user;
    const access_token = this.jwtService.sign(payload, { expiresIn: '1d' });
    const refresh_token = this.jwtService.sign(payload, { expiresIn: '7d' });
    return {
      access_token,
      refresh_token,
    };
  }

  async register(registerDto: RegisterDto) {
    const existingUser = await this.userService.findEmail(registerDto.email);
    if (existingUser) {
      throw new UnauthorizedException('อีเมลนี้ถูกใช้งานแล้ว');
    }

    await this.prisma.user.create({
      data: {
        role: registerDto.role,
        email: registerDto.email,
        full_name: registerDto.full_name,
        password_hash: bcrypt.hashSync(registerDto.password, 10),
      },
    });
    return true;
  }
}
