const { Role, AccessType, File, Folder } = require('../config/prismaClient');

// Check if user has required role for a file
async function checkFilePermission(userId, fileId, requiredRole = Role.VIEWER) {
    const file = await File.findUnique({
        where: { id: fileId },
        include: {
            sharedAccess: true,
            userPermissions: {
                where: { userId }
            }
        }
    });

    // Owner has full access
    if (file.ownerId === userId) return true;

    // Check direct file permissions
    const directPermission = file.userPermissions[0];
    if (directPermission) {
        return directPermission.role === Role.EDITOR || requiredRole === Role.VIEWER;
    }

    // Check folder inheritance
    if (file.parentFolderId) {
        return checkFolderPermission(userId, file.parentFolderId, requiredRole);
    }

    // Check public access
    const publicAccess = file.sharedAccess.find(access =>
        access.accessType !== AccessType.PRIVATE &&
        (!access.expiresAt || access.expiresAt > new Date())
    );

    if (publicAccess) {
        return publicAccess.defaultRole === Role.EDITOR ||
            (requiredRole === Role.VIEWER && publicAccess.defaultRole === Role.VIEWER);
    }

    return false;
}

// Check if user has required role for a folder
async function checkFolderPermission(userId, folderId, requiredRole = Role.VIEWER) {
    const folder = await Folder.findUnique({
        where: { id: folderId },
        include: {
            sharedAccess: true,
            userPermissions: {
                where: { userId }
            }
        }
    });

    // Owner has full access
    if (folder.ownerId === userId) return true;

    // Check direct folder permissions
    const directPermission = folder.userPermissions[0];
    if (directPermission) {
        return directPermission.role === Role.EDITOR || requiredRole === Role.VIEWER;
    }

    // Check parent folder inheritance
    if (folder.parentFolderId) {
        return checkFolderPermission(userId, folder.parentFolderId, requiredRole);
    }

    // Check public access
    const publicAccess = folder.sharedAccess.find(access =>
        access.accessType !== AccessType.PRIVATE &&
        (!access.expiresAt || access.expiresAt > new Date())
    );

    if (publicAccess) {
        return publicAccess.defaultRole === Role.EDITOR ||
            (requiredRole === Role.VIEWER && publicAccess.defaultRole === Role.VIEWER);
    }

    return false;
}

module.exports = {
    checkFilePermission,
    checkFolderPermission
};