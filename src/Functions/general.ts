import { PrismaClient, User } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

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