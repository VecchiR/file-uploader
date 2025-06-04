const { PrismaClient } = require('../generated/prisma');

const prismaClient = new PrismaClient();

const User = prismaClient.user;

module.exports = { prismaClient, User }