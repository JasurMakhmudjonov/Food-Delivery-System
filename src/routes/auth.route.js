const { Router } = require("express");
const router = Router();

const route = "/auth";
const {
  register,
  login,
  verify,
  adminLogin,
} = require("../controllers/auth.controller");

router.post(`${route}/register`, register);
router.post(`${route}/login`, login);
router.post(`${route}/verify`, verify);
router.post(`/admin/login`, adminLogin);

module.exports = router;
