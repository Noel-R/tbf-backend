import { Injectable } from '@nestjs/common';

import { UUID, Error, UserEntity, RatingEntity, TripEntity } from 'src/Types/general';
import { getClient, generateUUID } from 'src/Functions/general';

const prisma = getClient();


export type Location = {
  locationName: string;
  locationID: string;
}

export type NewRating = {
  user: UUID;
  trip: UUID;
  value: number;
  comment: string;
}

@Injectable()
export class RatingService {
  async addRating(rating: NewRating): Promise<RatingEntity | Error> {
    const { user, trip, value, comment } = rating;

    if (user === undefined || trip === undefined || value === undefined) {
      return {error: 'Missing required field.'};
    }

    const newRating = await prisma.rating.create({
      data: {
        uuid: await generateUUID(),
        value: value,
        comment: comment,
        user: {
          connect: {
            uuid: user
            }
          },
        trip: {
          connect: {
            uuid: trip
            }
          },
        }
    });
    
    if (newRating === null) {
      return {error: 'Rating not created.'};
    }

    await prisma.$disconnect();
    return new RatingEntity(newRating);
  }

  async getRatings(trip: UUID): Promise<TripEntity | Error> {
    
    if (trip === undefined) {
      return {error: 'Missing required field.'};
    }

    const dbTrip = await prisma.trip.findFirst({
      where: {
        uuid: trip[0]
        },
      include: {
        ratings: {
          select: {
            uuid: false,
            value: true,
            comment: true,
            user: {
              select: {
                uuid: false,
                email: false,
                name: true,
              },
            },
          },
        },
        user: false,
      }
      });

    if (dbTrip === null) {
      return {error: 'Trip and/or ratings not found.'};
    }

    await prisma.$disconnect();
    return new TripEntity(dbTrip);
  }
}