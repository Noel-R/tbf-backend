import { Body, Controller, Get, Header, Post, Res } from '@nestjs/common';
import { NewTrip, TripService } from './trip.service';
import { UUID } from 'src/Types/general';
import { Response } from 'express';


@Controller('trip')
export class TripController {
  constructor(private readonly tripService: TripService) {}

  @Post('create')
  async createUser(@Body() trip: NewTrip, @Res() res: Response): Promise<Response> {
    return res.json(await this.tripService.createTrip(trip));
  }

  @Get()
  @Header('Content-type', 'application/json')
  async getTrip(@Body() tripId: UUID, @Res() res: Response): Promise<any> {
    return res.json(await this.tripService.getTrip(tripId));
  }
}
