const { Router } = require("express");
const {
  createCategory,
  showCategory,
  updateCategory,
  removeCategory,
  showCategoryById,
} = require("../controllers/categoryFood.controller");
const { isAdmin } = require("../middlewares/is-admin.middleware");
const { showFoodById } = require("../controllers/food.controller");
const router = Router();

const route = "/categoryFood";

router.post(`${route}/`, isAdmin, createCategory);
router.get(`${route}/`, showCategory);
router.get(`${route}/:id`, showCategoryById);
router.put(`${route}/:id`, isAdmin, updateCategory);
router.delete(`${route}/:id`, isAdmin, removeCategory);

module.exports = router;
