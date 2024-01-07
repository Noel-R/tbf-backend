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
  async getComments(user: UUID): Promise<{message: string, comments: any[]} | Error> {
    
    if (user === undefined) {
      return {error: 'Missing required field.'};
    }

    const dbComments = await prisma.rating.findMany({
      where: {
        user: {
          uuid: user,
        },
        comment: {
          not: "",
        }
      },
      select: {
        uuid: true,
        createdAt: true,
        comment: true,
        trip: {
          select: {
            uuid: true,
            name: true,
            user: {
              select: {
                name: true
              }
            }
          },
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (dbComments === null) {
      return {error: 'No comments found.'};
    }
    
    await prisma.$disconnect();
    return {message: 'Comments found.', comments: [...dbComments.map((comment) => {return comment})]};
  }

  async getAllFavourites(userId: string): Promise<{message: string, favourites: string[]} | Error> {
    
    if (userId === undefined) {
      return {error: 'Missing required field.'};
    }

    const dbSavedTrips = await prisma.savedTrips.findMany({
      where: {
        userId: userId
      },
      select: {
        tripId: true
      }
    });

    if (dbSavedTrips === null || dbSavedTrips.length === 0) {
      return {error: 'No saved trips found.'};
    }

    return {message: 'Favourites found.', favourites: [...dbSavedTrips.map((trip) => trip.tripId)]};
  }

  async isFavourited(ids: {tripId: UUID, userId: UUID}): Promise<{message: string} | Error> {
    
    if (ids.tripId === undefined || ids.userId === undefined) {
      return {error: 'Missing required field.'};
    }

    const dbSavedTrip = await prisma.savedTrips.findFirst({
      where: {
        userId: ids.userId,
        tripId: ids.tripId
      }
    });

    if (dbSavedTrip === null) {
      return {message: 'Trip not saved.'};
    }

    await prisma.$disconnect();
    return {message: 'Trip saved.'};
  }

  async getFavouritedTrips(userId: string): Promise<TripEntity[] | Error> {

    if (userId === undefined) {
      return {error: 'Missing required field.'};
    }

    const dbSavedTrips = await prisma.savedTrips.findMany({
      where: {
        userId: userId
      },
      select: {
        trip: {
          select: {
            uuid: true,
            name: true,
            comment: true,
            location: {
              select: {
                name: true,
                latitude: true,
                longitude: true,
                condition: {
                  select: {
                    avgTempC: true,
                    avgTempF: true,
                    avgHumidity: true,
                  }
                }
              }
            },
            ratings: {
              select: {
                uuid: true,
                value: true,
                comment: true,
                user: {
                  select: {
                    name: true
                  }
                }
              }
            },
            user: {
              select: {
                name: true
              }
            },
          }
        }
      }
    });

    if (dbSavedTrips === null) {
      return {error: 'No saved trips found.'};
    }

    await prisma.$disconnect();
    return dbSavedTrips.map((trip) => new TripEntity(trip.trip));

  }


  async unsaveTrip(ids: {userId: string, tripId: string}): Promise<{message: string} | Error> {
    
    if (ids.tripId === undefined || ids.userId === undefined) {
      return {error: 'Missing required field.'};
    }

    const dbSavedTrip = await prisma.savedTrips.findFirst({
      where: {
        userId: ids.userId,
        tripId: ids.tripId
      },
      select: {
        uuid: true
      }
    });

    if (dbSavedTrip === null) {
      return {error: "Favourited trip doesn't exist."};
    }

    const dbTrip = await prisma.savedTrips.delete({
      where: {
        uuid: dbSavedTrip.uuid
      }
    });

    await prisma.$disconnect();
    return {message: 'Favourite removed.'};
  }


  async saveTrip(ids: {userId: string, tripId: string}) : Promise<{message: string} | Error> {
    if (ids.tripId === undefined || ids.userId === undefined) {
      return {error: 'Missing required field.'};
    }

    const alreadySaved = prisma.savedTrips.findFirst({
      where: {
        userId: ids.userId,
        tripId: ids.tripId
      }
    });

    const isUserTrip = prisma.trip.findFirst({
      where: {
        uuid: ids.tripId,
        user: {
          uuid: ids.userId
        }
      }
    });

    const [dbAlreadySaved, dbIsUserTrip] = await prisma.$transaction([alreadySaved, isUserTrip]);

    if (dbAlreadySaved !== null) {
      return {error: 'Trip already saved.'};
    } else if (dbIsUserTrip !== null) {
      return {error: 'Cannot save your own trip.'};
    }

    const dbTrip = await prisma.savedTrips.create({
      data: {
        uuid: await generateUUID(),
        userId: ids.userId,
        tripId: ids.tripId
      }
    });

    if (dbTrip === null) {
      return {error: 'Trip not saved.'};
    }

    await prisma.$disconnect();
    return {message: 'Trip saved.'};
  }

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
        },
        select: {
          uuid: true,
          value: true,
          comment: true,
          user: {
            select: {
              uuid: false,
              email: false,
              name: true,
            },
          },
        }
    });
    
    if (newRating === null) {
      return {error: 'Rating not created.'};
    }

    await prisma.$disconnect();
    return new RatingEntity({...newRating, comment: newRating.comment ? newRating.comment : ''});
  }

  async getRatings(trip: UUID): Promise<RatingEntity[] | Error> {
    
    if (trip === undefined) {
      return {error: 'Missing required field.'};
    }

    const dbRatings = await prisma.trip.findFirst({
      where: {
        uuid: trip[0]
      },
      select: {
        ratings: {
          select: {
            uuid: true,
            value: true,
            comment: true,
            user: {
              select: {
                name: true
              }
            }
          }
        }
      }
    })
    
    if (dbRatings === null) {
      return {error: 'Trip and/or ratings not found.'};
    }

    await prisma.$disconnect();
    return dbRatings.ratings.map((rating) => new RatingEntity(rating));
  }
}