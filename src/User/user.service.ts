import { Injectable, Res } from '@nestjs/common';

import { UUID, Error, UserEntity } from 'src/Types/general';
import { getClient, generateUUID, hashPassword, comparePassword } from 'src/Functions/general';

const prisma = getClient();

@Injectable()
export class UserService {
  async getUser(userId: UUID): Promise<UserEntity | Error> {
    
    if (userId === undefined) {
      return {error: 'Missing required fields.'};
    }

    const user = await prisma.user.findFirst({
      where: {
        uuid: userId[0]
      }
    });

    if (user === null) {
      return {error: 'User not found.'};
    }

    await prisma.$disconnect();
    return new UserEntity(user);
  }

  async createUser(user: UserEntity): Promise<UserEntity | Error> {
    const { email, password, name } = user;

    if (email === undefined || password === undefined || name === undefined) {
      return {error: 'Missing required fields.'};
    }

    const newUser = await prisma.user.create({
      data: {
        uuid: await generateUUID(),
        email: email,
        password: await hashPassword(password),
        name: name
    }});

    await prisma.$disconnect();
    return new UserEntity({...newUser, password: undefined});
  }

  async loginUser(user: UserEntity): Promise<UserEntity | Error> {
    
    const { email, password } = user;

    if (email === undefined || password === undefined) {
      return {error: 'Missing required fields.'};
    }

    const dbUser = await prisma.user.findFirst({
      where: {
        email: email
      },
      select: {
        uuid: true,
        email: true,
        password: true,
        name: true
      }
    });

    if (dbUser === null) {
      return {error: 'User not found.'};
    }

    const match = await comparePassword(password, dbUser.password);

    if (match === false) {
      return {error: 'Incorrect password.'};
    }

    await prisma.$disconnect();
    return new UserEntity({...dbUser, password: undefined});
  };
}
