const { Router } = require("express");
const {
  createRestaurant,
  showAllRestaurant,
  showRestaurantById,
  updateRestaurant,
  removeRestaurant,
  createReview,
  updateReview,
  removeReview,
} = require("../controllers/restaurant.controller");
const { isAdmin } = require("../middlewares/is-admin.middleware");
const { isAuth } = require("../middlewares/is-auth.middleware");
const router = Router();

const route = "/restaurants";

router.post(`${route}/`, isAdmin, createRestaurant);
router.get(`${route}/`, showAllRestaurant);
router.get(`${route}/:id`, showRestaurantById);
router.put(`${route}/:id`, isAdmin, updateRestaurant);
router.delete(`${route}/:id`, isAdmin, removeRestaurant);
router.post(`${route}/:restaurantId/add-review`, isAuth,  createReview );
router.put(`${route}/:restaurantId/update-review/:reviewId`, isAuth,  updateReview );
router.delete(`${route}/:restaurantId/remove-review/:reviewId`, isAuth, removeReview);



module.exports = router;
