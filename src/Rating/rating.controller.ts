import { Body, Controller, Delete, Get, Header, Param, Patch, Post, Res } from '@nestjs/common';
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

  @Get('/all/:userId')
  @Header('Content-type', 'application/json')
  async getAllFavourites(@Param('userId') userId: UUID, @Res() res: Response): Promise<any> {
    return res.json(await this.ratingService.getAllFavourites(userId));
  }

  @Get('/comments/:user')
  @Header('Content-type', 'application/json')
  async getComments(@Param('user') user: UUID, @Res() res: Response): Promise<any> {
    return res.json(await this.ratingService.getComments(user));
  }

  @Get('/:tripId')
  @Header('Content-type', 'application/json')
  async getTrip(@Param() tripId: UUID, @Res() res: Response): Promise<any> {
    return res.json(await this.ratingService.getRatings(tripId));
  }

  @Get('/saved/:trip/:user')
  @Header('Content-type', 'application/json')
  async getSavedTrip(@Param('trip') trip: UUID, @Param('user') user: UUID, @Res() res: Response): Promise<any> {
    return res.json(await this.ratingService.isFavourited({tripId: trip, userId: user}));
  }

  @Patch("/save")
  @Header('Content-type', 'application/json')
  async saveTrip(@Body() ids: {tripId: any, userId: any}, @Res() res: Response): Promise<any> {
    return res.json(await this.ratingService.saveTrip(ids));
  }

  @Delete("/unsave")
  @Header('Content-type', 'application/json')
  async deleteTrip(@Body() ids: {tripId: any, userId: any}, @Res() res: Response): Promise<any> {
    return res.json(await this.ratingService.unsaveTrip(ids));
  }
}
