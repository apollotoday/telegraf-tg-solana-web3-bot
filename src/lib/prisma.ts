import { PrismaClient } from ".prisma/client";

console.log("DATABASE_URL", process.env.DATABASE_URL);

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

export default prisma;
