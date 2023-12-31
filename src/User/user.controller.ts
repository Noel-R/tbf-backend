import { Response } from 'express';
import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';

import { UserService } from './user.service';

import { UUID, UserEntity } from 'src/Types/general';



@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('create')
  async createUser(@Body() user: UserEntity, @Res() res: Response): Promise<Response> {
    return res.json(await this.userService.createUser(user));
  }

  @Get()
  async getUser(@Body() userId: UUID, @Res() res: Response): Promise<Response> {
    return res.json(await this.userService.getUser(userId));
  }

  @Post('login')
  async loginUser(@Body() user: UserEntity, @Res() res: Response, @Req() req: Request): Promise<Response> {
    return res.json(await this.userService.loginUser(user));
  }
}
