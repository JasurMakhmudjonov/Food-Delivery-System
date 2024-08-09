const { Router } = require("express");
const {
  createFood,
  showAllFood,
  showFoodById,
  updateFood,
  removeFood,
  addToCart,
} = require("../controllers/food.controller");
const { isAdmin } = require("../middlewares/is-admin.middleware");
const { isAuth } = require("../middlewares/is-auth.middleware");
const router = Router();

const route = "/foods";

router.post(`${route}/`, isAdmin, createFood);
router.get(`${route}/`, showAllFood);
router.get(`${route}/:id`, showFoodById);
router.put(`${route}/:id`, isAdmin, updateFood);
router.delete(`${route}/:id`, isAdmin, removeFood);
router.post(`${route}/:foodId/add-to-cart`, isAuth, addToCart);

module.exports = router;
