import { Injectable } from '@nestjs/common';

import { UUID, Error, UserEntity, TripEntity } from 'src/Types/general';
import { getClient, generateUUID } from 'src/Functions/general';

const prisma = getClient();

export type Location = {
  locationName: string;
  locationID: string;
}

export type NewTrip = {
  user: UUID;
  tripName: string;
  location: Location;
}

@Injectable()
export class TripService {
  async createTrip(trip: NewTrip): Promise<TripEntity | Error> {
    const { user, tripName } = trip;

    if (user === undefined) {
      return {error: 'Missing required fields.'};
    }

    const newTrip = await prisma.trip.create({
      data: {
        uuid: await generateUUID(),
        name: tripName,
        user: {
          connect: {
            uuid: user
            }
          },
        }
      });

    await prisma.$disconnect();
    return new TripEntity(newTrip);
  }

  async getTrip(trip: UUID): Promise<TripEntity | Error> {
    
    if (trip === undefined) {
      return {error: 'Missing required fields.'};
    }

    const dbTrip = await prisma.trip.findFirst({
      where: {
        uuid: trip[0]
        },
      include: {
        user: {
          select: {
            uuid: false,
            email: false,
            name: true,
          },
        },
        }
      });

    if (dbTrip === null) {
      return {error: 'Trip not found.'};
    }

    let returnnedTrip = new TripEntity(dbTrip);

    await prisma.$disconnect();
    return returnnedTrip;
  }
}