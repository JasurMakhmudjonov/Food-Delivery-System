const { Router } = require("express");
const {
  showAll,
  showById,
  updateByAdmin,
  updateByUser,
  deleteUser,
} = require("../controllers/user.controller");
const { isAdmin } = require("../middlewares/is-admin.middleware");
const { isAuth } = require("../middlewares/is-auth.middleware");
const router = Router();

const route = "/users";

router.get(`${route}/`, isAdmin, showAll);
router.get(`${route}/:id`, isAuth, showById);
router.put(`/admin${route}/:id`, isAdmin, updateByAdmin);
router.put(`${route}/:id`, isAuth, updateByUser);
router.delete(`${route}/:id`, isAdmin, deleteUser);

module.exports = router;
