import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import * as bcrypt from 'bcrypt';

import { JwtPayload } from './interfaces/jwt-payload.interface';
import { User } from './entities/auth.entity';
import { CreateUserDto, LoginUserDto } from './dto';


@Injectable()
export class AuthService {

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly jwtService: JwtService,
  ) { }


  async create(createUserDto: CreateUserDto) {

    try {

      const { password, ...userData } = createUserDto;

      const user = this.userRepository.create({
        ...userData,
        password: bcrypt.hashSync(password, 10)
      });

      await this.userRepository.save(user);
      return this.buildAuthResponse(user);

    } catch (error) {
      this.handleDBErrors(error);
    }

  }

  async login(loginUserDto: LoginUserDto) {

    const { password, email } = loginUserDto;

    const user = await this.userRepository.findOne({
      where: { email },
      select: { id: true, email: true, password: true, name: true, role: true }
    });

    if (!user)
      throw new UnauthorizedException('Credentials are not valid (email)');

    if (!bcrypt.compareSync(password, user.password))
      throw new UnauthorizedException('Credentials are not valid (password)');

    return this.buildAuthResponse(user);
  }

  async checkAuthStatus(user: User) {
    return this.buildAuthResponse(user);
  }


  private buildAuthResponse(user: User) {
    const { password: _pwd, ...userWithoutPassword } = user;
    return {
      ...userWithoutPassword,
      token: this.getJwtToken({ id: user.id, name: user.name, email: user.email, role: user.role })
    };
  }

  private getJwtToken(payload: JwtPayload) {
    return this.jwtService.sign(payload);
  }

  private handleDBErrors(error: any): never {


    if (error.code === '23505')
      throw new BadRequestException(error.detail);

    console.log(error)

    throw new InternalServerErrorException('Please check server logs');

  }
}