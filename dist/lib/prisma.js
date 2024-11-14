"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require(".prisma/client");
console.log('DATABASE_URL', process.env.DATABASE_URL);
const prisma = new client_1.PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL,
        },
    },
});
exports.default = prisma;
