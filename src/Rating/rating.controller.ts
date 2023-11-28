import { Body, Controller, Get, Header, Post, Res } from '@nestjs/common';
import { NewRating, RatingService } from './rating.service';
import { UUID } from 'src/Types/general';
import { Response } from 'express';


@Controller('rating')
export class RatingController {
  constructor(private readonly ratingService: RatingService) {}

  @Post('create')
  async createUser(@Body() rating: NewRating, @Res() res: Response): Promise<Response> {
    return res.json(await this.ratingService.addRating(rating));
  }

  @Get()
  @Header('Content-type', 'application/json')
  async getTrip(@Body() tripId: UUID, @Res() res: Response): Promise<any> {
    return res.json(await this.ratingService.getRatings(tripId));
  }
}
