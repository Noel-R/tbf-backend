import { Body, Controller, Delete, Get, Header, Param, Patch, Post, Res } from '@nestjs/common';
import { NewTrip, TripService } from './trip.service';
import { TripEntity, UUID } from 'src/Types/general';
import { Response } from 'express';
import { Weather } from 'src/Functions/general';


@Controller('trip')
export class TripController {
  constructor(private readonly tripService: TripService) {}

  @Post('create')
  async createUser(@Body() trip: NewTrip, @Res() res: Response): Promise<Response> {
    return res.json(await this.tripService.createTrip(trip));
  }

  @Get('get/:tripId')
  @Header('Content-type', 'application/json')
  async getTrip(@Param('tripId') tripId: UUID, @Res() res: Response): Promise<any> {
    return res.json(await this.tripService.getTrip(tripId));
  }

  @Get('all')
  @Header('Content-type', 'application/json')
  async getAllTrips(@Res() res: Response): Promise<any> {
    return res.json(await this.tripService.getAllTrips());
  }

  @Get('all/:userId')
  @Header('Content-type', 'application/json')
  async getAllTripsByUser(@Param('userId') userId: UUID, @Res() res: Response): Promise<any> {
    return res.json(await this.tripService.getAllTripsByUser(userId));
  }

  @Get('photo/:lat/:lng')
  @Header('Content-type', 'application/json')
  async getPhotoByLatLng(@Param('lat') lat: string, @Param('lng') lng: string, @Res() res: Response): Promise<any> {
    return res.json(await this.tripService.getPhotosForLocation({lat: lat, lng: lng}));
  }

  @Patch('update')
  @Header('Content-type', 'application/json')
  async updateTrip(@Body() trip: TripEntity, @Res() res: Response): Promise<any> {
    return res.json({message: "ok", trip: await this.tripService.updateTrip(trip)});
  }

  @Delete('delete/:tripId')
  @Header('Content-type', 'application/json')
  async deleteTrip(@Param('tripId') tripId: UUID, @Res() res: Response): Promise<any> {
    return res.json(await this.tripService.deleteTrip(tripId));
  }
}
