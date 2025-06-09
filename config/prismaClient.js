const { PrismaClient } = require('../generated/prisma');

const prismaClient = new PrismaClient();

const User = prismaClient.user;
const Folder = prismaClient.folder;
const File = prismaClient.file;

module.exports = { prismaClient, User, Folder, File }