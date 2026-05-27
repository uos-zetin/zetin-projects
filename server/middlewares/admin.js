import verifyAdmin from '../modules/verifyAdmin.js';

export default function admin(options = {}) {
  const { adminOnly = true } = options;
  return async (req, res, next) => {
    try {
      await verifyAdmin(req.cookies.adminToken);
      req.isAdmin = true;
      next();
    } catch (err) {
      if (!adminOnly) {
        req.isAdmin = false;
        return next();
      }
      next(err);
    }
  };
}
