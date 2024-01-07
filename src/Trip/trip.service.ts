import { Injectable } from '@nestjs/common';

import { UUID, Error, UserEntity, TripEntity, TripLocationEntity, RatingEntity } from 'src/Types/general';
import { getClient, generateUUID, checkWeather, Weather, getPlaceId, getPhotoByLatLng } from 'src/Functions/general';

const prisma = getClient();

export type NewTrip = {
  user: UUID;
  tripName: string;
  startDate: Date;
  endDate: Date;
  location: string;
  comment?: string;
}

@Injectable()
export class TripService {
  async deleteTrip(tripId: string): Promise<{message: string} | Error> {
    if (tripId === undefined) {
      return {error: 'Missing required fields.'};
    }

    await prisma.trip.delete({
      where: {
        uuid: tripId
      }
    });

    await prisma.$disconnect();
    return {message: "ok"};
  }

  async updateTrip(trip: TripEntity): Promise<TripEntity | Error> {
    if (trip === undefined) {
      return {error: 'Missing required fields.'};
    }

    const location = await checkWeather({location: trip.location!.name!, start_date: trip.startDate!, end_date: trip.endDate!});
    
    if ("error" in location) {
      return {error: location.error};
    }

    const dbTrip = await prisma.trip.update({
      where: {
        uuid: trip.uuid
      },
      data: {
        name: trip.name,
        startDate: trip.startDate,
        endDate: trip.endDate,
        comment: trip.description,
        location: {
          update: {
            name: location.name,
            latitude: location.latitude,
            longitude: location.longitude,
            condition: {
              update: {
                avgHumidity: location.condition!.avgHumidity,
                avgTempC: location.condition!.avgTempC,
                avgTempF: location.condition!.avgTempF
              }
            }
          }
        }
      },
      select: {
        uuid: true,
        name: true,
        startDate: true,
        endDate: true,
        user: {
          select: {
            uuid: false,
            email: false,
            name: true
          },
        },
        location: {
          select: {
            uuid: false,
            name: true,
            latitude: true,
            longitude: true,
            condition: {
              select: {
                uuid: false,
                avgHumidity: true,
                avgTempC: true,
                avgTempF: true
              }
            }
          }
        }
      }
    });

    if (dbTrip === null) {
      return {error: 'No trips found.'};
    }

    await prisma.$disconnect();
    return new TripEntity({...dbTrip});
  }


  async getAllTripsByUser(userId: string): Promise<TripEntity[] | Error> {
    if (userId === undefined) {
      return {error: 'Missing required fields.'};
    }

    const dbTrips = await prisma.trip.findMany({
      where: {
        user: {
          uuid: userId
        }
      },
      select: {
        uuid: true,
        name: true,
        startDate: true,
        endDate: true,
        user: {
          select: {
            uuid: false,
            email: false,
            name: true
          },
        },
        location: {
          select: {
            latitude: true,
            longitude: true,
            condition: {
              select: {
                avgHumidity: true,
                avgTempC: true,
                avgTempF: true
              }
            }
          }
        }
      }
    });

    if (dbTrips === null) {
      return {error: 'No trips found.'};
    }

    let returnedTrips = dbTrips.map((trip) => new TripEntity({...trip}));

    await prisma.$disconnect();
    return returnedTrips;
  }

  async createTrip(trip: NewTrip): Promise<{message: string, trip: TripEntity} | Error> {
    const { user, tripName, startDate, endDate, location } = trip;

    if (user === undefined || tripName === undefined || startDate === undefined || endDate === undefined || location === undefined) {
      return {error: 'Missing required fields.'};
    }

    const dbUser = await prisma.user.findFirst({
      where: {
        uuid: user
      }
    });

    if (dbUser === null) {
      return {error: 'User not found.'};
    }

    const WeatherEntity: TripLocationEntity | Error = await checkWeather({location: location, start_date: startDate, end_date: endDate});

    if ("error" in WeatherEntity) {
      return {error: WeatherEntity.error};
    }

    const newTrip = await prisma.trip.create({
      data: {
        uuid: await generateUUID(),
        name: tripName,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        comment: trip.comment ? trip.comment : "",
        user: {
          connect: {
            uuid: user
          }
        },
        location: {
          create: {
            uuid: WeatherEntity.uuid!,
            name: WeatherEntity.name!,
            latitude: WeatherEntity.latitude!, // todo
            longitude: WeatherEntity.longitude!, // todo
            condition: {
              create: {
                uuid: WeatherEntity.condition!.uuid!,
                avgHumidity:  WeatherEntity.condition!.avgHumidity!, // todo
                avgTempC:     WeatherEntity.condition!.avgTempC!, // todo
                avgTempF:     WeatherEntity.condition!.avgTempF!, // todo
              }
            }
          }
        }
      }
    });
    
    await prisma.$disconnect();
    return {message: "ok", trip: new TripEntity(newTrip)};
  }

  async getTrip(trip: UUID): Promise<TripEntity | Error> {
    
    if (trip === undefined) {
      return {error: 'Missing required fields.'};
    }

    const dbTrip = await prisma.trip.findFirst({
      where: {
        uuid: trip
      },
      select: {
        uuid: true,
        name: true,
        startDate: true,
        endDate: true,
        comment: true,
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
            uuid: true,
            email: false,
            name: true
          },
        },
        location: {
          select: {
            uuid: false,
            name: true,
            latitude: true,
            longitude: true,
            condition: {
              select: {
                uuid: false,
                avgHumidity: true,
                avgTempC: true,
                avgTempF: true
              }
            }
          }
        }
      }
    });

    if (dbTrip === null) {
      return {error: 'Trip not found.'};
    };

    let returnedTrip = new TripEntity(dbTrip);

    await prisma.$disconnect();
    return returnedTrip;
  }

  async getAllTrips(): Promise<TripEntity[] | Error> {
    const dbTrips = await prisma.trip.findMany({
      include: {
        user: {
          select: {
            uuid: true,
            email: false,
            name: true
          },
        },
        location: {
          include: {
            condition: true
          }
        }
      }
    });

    if (dbTrips === null) {
      return {error: 'No trips found.'};
    }

    let returnnedTrips = dbTrips.map((trip) => new TripEntity({...trip, user: {...trip.user, password: ""}}));

    await prisma.$disconnect();
    return returnnedTrips;
  }

  async getPhotosForLocation(location: {lat: any, lng: any}): Promise<{photo: string} | Error> {

    if (location.lat === null || location.lng === null) {
      return {error: 'No trips found.'};
    }

    const photo = await getPhotoByLatLng({lat: location.lat, lng: location.lng});
    return {photo: photo};
  }
}