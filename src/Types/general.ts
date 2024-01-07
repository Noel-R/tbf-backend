import { Exclude } from "class-transformer";

export type UUID = string;

export interface Error {
    error: string;
}

export class UserEntity {
  uuid?: UUID;
  email?: string;
  name?: string | null;

  @Exclude({ toPlainOnly: true })
  password?: string;

  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);
  }
}

export class TripEntity {
  uuid: UUID;

  name?: string;
  location?: TripLocationEntity | null;
  startDate?: Date;
  endDate?: Date;
  description?: string;

  user?: UserEntity;
  ratings?: RatingEntity[];

  constructor(partial: Partial<TripEntity>) {
    Object.assign(this, partial);
  }
}

export class TripLocationEntity {
  uuid?: UUID;

  name?: string;
  latitude?: number;
  longitude?: number;

  condition: LocationConditionEntity | null;

  constructor(partial: Partial<TripLocationEntity>) {
    Object.assign(this, partial);
  }

}

export class LocationConditionEntity {
  uuid?: UUID;

  avgHumidity?: number;
  avgTempC?: number;
  avgTempF?: number;

  constructor(partial: Partial<LocationConditionEntity>) {
    Object.assign(this, partial);
  }
}

export class RatingEntity {
  uuid: UUID;

  value: number;
  comment: string | null;

  trip?: TripEntity;
  user?: UserEntity;

  constructor(partial: Partial<RatingEntity>) {
    Object.assign(this, partial);
  }
}