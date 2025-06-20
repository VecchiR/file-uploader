const { checkFilePermission, checkFolderPermission } = require('../lib/permissionUtils');
const { Role } = require('../generated/prisma');

const requireFilePermission = (role = Role.VIEWER) => async (req, res, next) => {
    const fileId = req.params.fileId;
    const hasPermission = await checkFilePermission(req.user.id, fileId, role);
    
    if (!hasPermission) {
        res.locals.errors = [{ msg: 'Access denied' }];
        return res.status(403).render('storage');
    }
    next();
};

const requireFolderPermission = (role = Role.VIEWER) => async (req, res, next) => {
    const folderId = req.params.folderId;
    const hasPermission = await checkFolderPermission(req.user.id, folderId, role);
    
    if (!hasPermission) {
        res.locals.errors = [{ msg: 'Access denied' }];
        return res.status(403).render('storage');
    }
    next();
};

module.exports = {
    requireFilePermission,
    requireFolderPermission
};