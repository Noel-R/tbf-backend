/* Database Imports & adapters */

import { PrismaClient, TripLocation, User } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

/* Encryption Imports */
var bcrypt = require('bcryptjs');

/* Weather API Imports */

import { fetchWeatherApi } from 'openmeteo';
import { Error, LocationConditionEntity, TripLocationEntity } from 'src/Types/general';


export const generateUUID = async () => {
    const uuid = await fetch('https://www.uuidgenerator.net/api/version4').then(res => res.text());
    return uuid;
};

export const getClient = (): PrismaClient => {
    const libsql = createClient({
        url: `${process.env.TURSO_DATABASE_URL}`,
        authToken: `${process.env.TURSO_AUTH_TOKEN}`,
      })
    
    const adapter = new PrismaLibSQL(libsql)
    const prisma = new PrismaClient({ adapter })

    return prisma;
};

export const hashPassword = async (password: string): Promise<string> => {
    const hashedPass = await bcrypt.hash(password, 10).then((hash: string) => {
        return hash;
    });
    return hashedPass;
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
    const match = await bcrypt.compare(password, hash).then((result: boolean) => {
        return result;
    });
    return match;
};

export interface Weather {
    location: string;
    start_date: Date;
    end_date: Date;
}

function formatDate(date: string) {
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) 
        month = '0' + month;
    if (day.length < 2) 
        day = '0' + day;

    return [year, month, day].join('-');
}

export const checkLocation = async (location: string): Promise<TripLocationEntity | Error> => {

    const geo = await fetch("https://geocoding-api.open-meteo.com/v1/search?name=" + location + "&count=1&language=en&format=json")
        .then(res => res.json());
    
    if (geo["results"] === undefined) {
        return {error: "Location not found."} as Error;
    }

    const returnLocation: TripLocationEntity = new TripLocationEntity({name: geo["results"][0]["name"], latitude: geo["results"][0]["latitude"], longitude: geo["results"][0]["longitude"]});

    return returnLocation;
};

export const checkWeather = async (weather: Weather): Promise<TripLocationEntity | Error> => {
    const { location, start_date, end_date } = weather;
    const geo: TripLocationEntity | Error = await checkLocation(weather.location);

    if ("error" in geo) {
        return geo;
    }

    const queryParams = {
        "latitude": geo.latitude,
        "longitude": geo.longitude,
        "start_date": formatDate(new Date(start_date).toDateString()),
        "end_date": formatDate(new Date(end_date).toDateString()),
        "models": "EC_Earth3P_HR",
        "daily": ["temperature_2m_mean", "relative_humidity_2m_mean"]
    }

    const url = "https://climate-api.open-meteo.com/v1/climate";
    const responses = await fetchWeatherApi(url, queryParams);
    
    const range = (start: number, stop: number, step: number) =>
	    Array.from({ length: (stop - start) / step }, (_, i) => start + i * step);
    const response = responses[0];
    const utcOffsetSeconds = response.utcOffsetSeconds();
    const daily = response.daily()!;
    const weatherData = {
        daily: {
            time: range(Number(daily.time()), Number(daily.timeEnd()), daily.interval()).map(
                (t) => new Date((t + utcOffsetSeconds) * 1000)
            ),
            temperature2mMean: daily.variables(0)!.valuesArray()!,
            relativeHumidity2mMean: daily.variables(1)!.valuesArray()!,
        },
    };

    let avgTempC, avgTempF, avgHumidity;

    avgTempC = weatherData.daily.temperature2mMean.reduce((a, b) => a + b, 0) / weatherData.daily.temperature2mMean.length;
    avgTempF = avgTempC * 9 / 5 + 32;
    avgHumidity = weatherData.daily.relativeHumidity2mMean.reduce((a, b) => a + b, 0) / weatherData.daily.relativeHumidity2mMean.length;

    const weatherCondition = new LocationConditionEntity({uuid: await generateUUID(), avgHumidity: avgHumidity, avgTempC: avgTempC, avgTempF: avgTempF});
    const returnedLocation = new TripLocationEntity({uuid: await generateUUID(), name: location, latitude: geo.latitude, longitude: geo.longitude, condition: weatherCondition});

    return returnedLocation;
};

export const getPlaceId = async (latlng: {lat: any, lng: any}): Promise<string[]> => {
    const url = "https://maps.googleapis.com/maps/api/geocode/json?latlng=" + latlng.lat + "," + latlng.lng + "&key=" + process.env.GOOGLE_API_KEY;
    const response = await fetch(url).then(res => res.json());

    return response.results.map((result: any) => result.place_id);
};

export const getPhoto = async (placeId: string): Promise<string> => {
    
    const url = "https://maps.googleapis.com/maps/api/place/details/json?place_id=" + placeId + "&fields=photo&key=" + process.env.GOOGLE_API_KEY;
    const response = await fetch(url).then(res => res.json());

    if (response.result.photos === undefined || response.result.photos.length === 0) {
        return "";
    }

    const photoUrl = "https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=" + response.result.photos[0].photo_reference + "&key=" + process.env.GOOGLE_API_KEY;
    return photoUrl;
};

export const getPhotoByLatLng = async (latlng: {lat: any, lng: any}): Promise<string> => {
    const placeId = await getPlaceId(latlng);
    const photos = await Promise.all(placeId.map((id: string) => getPhoto(id)));
    return photos.filter((photo: string) => photo !== "")[0];
};