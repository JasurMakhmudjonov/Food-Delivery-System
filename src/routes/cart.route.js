const { Router } = require("express");
const {
  showCarts,
  updateCart,
  removeCart,
  createOrder,
} = require("../controllers/cart.controller");
const { isAuth } = require("../middlewares/is-auth.middleware");
const router = Router();

const route = "/carts";

router.get(`${route}/`, isAuth, showCarts);
router.put(`${route}/:id`, isAuth, updateCart);
router.delete(`${route}/:id`, isAuth, removeCart);
router.post(`${route}/order`, isAuth, createOrder);

module.exports = router;
