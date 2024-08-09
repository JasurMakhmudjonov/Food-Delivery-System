const authRoute = require("./auth.route");
const userRoute = require("./user.route");
const categoryResRoute = require("./categoryRes.route");
const categoryFoodRoute = require("./categoryFood.route");
const restuarantRoute = require("./restaurant.route");
const foodRoute = require("./food.route");
const orderRoute = require("./order.route");
const cartRoute = require("./cart.route");
const searchRoute = require("./search.route");

module.exports = [
  authRoute,
  userRoute,
  categoryResRoute,
  categoryFoodRoute,
  restuarantRoute,
  foodRoute,
  orderRoute,
  cartRoute,
  searchRoute,
];
