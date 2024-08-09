const config = require("../../config");

const { sign, verify } = require("jsonwebtoken");

const createToken = (payload) => {
  return sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiration });
};

const checkToken = (token, callback) => {
  return verify(token, config.jwtSecret, callback);
};

module.exports = {
  createToken,
  checkToken,
};


