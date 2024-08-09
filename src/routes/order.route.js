const { Router } = require("express");
const {
  showOrder,
  updateOrder,
  cancelOrder,
  showAllOrder,
} = require("../controllers/order.controller");
const { isAuth } = require("../middlewares/is-auth.middleware");
const { isAdmin } = require("../middlewares/is-admin.middleware");
const router = Router();

const route = "/orders";

router.get(`${route}/`, isAuth, showOrder);
router.get(`/admin${route}/`, isAdmin, showAllOrder);
router.put(`${route}/:id`, isAdmin, updateOrder);
router.delete(`${route}/:id`, isAuth, cancelOrder);

module.exports = router;
