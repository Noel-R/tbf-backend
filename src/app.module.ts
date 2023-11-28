import { Module } from '@nestjs/common';
import 'reflect-metadata';
import 'es6-shim';

import { UserController } from './User/user.controller';
import { UserService } from './User/user.service';

import { TripController } from './Trip/trip.controller';
import { TripService } from './Trip/trip.service';

import { RatingController } from './Rating/rating.controller';
import { RatingService } from './Rating/rating.service';

@Module({
  imports: [],
  controllers: [UserController, TripController, RatingController],
  providers: [UserService, TripService, RatingService],
})
export class AppModule {}
