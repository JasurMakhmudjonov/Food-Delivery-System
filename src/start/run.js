const config = require("../../config");

const runner = (app) => {
  app.listen(config, () => {
    console.log(`Server is running on port ${config.port}`);
  });
};

module.exports = runner;
