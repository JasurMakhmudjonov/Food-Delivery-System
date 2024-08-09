const express = require("express");
const app = express();

require("./start/module")(app, express);
require("./start/run")(app);
