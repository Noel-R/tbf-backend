import { Exclude } from "class-transformer";

export type UUID = string;

export type Error = {
    error: string;
}

export class UserEntity {
  uuid: UUID;
  email: string;
  name: string | null;

  @Exclude()
  password: string;

  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);
  }
}

export class TripEntity {
  uuid: UUID;

  name: string;
  location: Location;

  user: UserEntity;
  ratings: RatingEntity[];

  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);
  }
}

export class RatingEntity {
  uuid: UUID;

  value: number;
  comment: string;

  trip: TripEntity;
  user: UserEntity;

  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);
  }
}