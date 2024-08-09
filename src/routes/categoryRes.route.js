const { Router } = require("express");
const {
  createCategory,
  showCategory,
  updateCategory,
  removeCategory,
  showCategoryResById,
} = require("../controllers/categoryRes.controller");
const { isAdmin } = require("../middlewares/is-admin.middleware");
const router = Router();

const route = "/categoryRes";

router.post(`${route}/`, isAdmin, createCategory);
router.get(`${route}/`, showCategory);
router.get(`${route}/:id`, showCategoryResById);
router.put(`${route}/:id`, isAdmin, updateCategory);
router.delete(`${route}/:id`, isAdmin, removeCategory);

module.exports = router;
