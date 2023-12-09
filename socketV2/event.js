//Importing express
const express = require("express");
const cors = require("cors");

//Importing Database connection
require("./database/database");

//Importing routes
const route_client = require("./routers/clientroute");
const route_admin = require("./routers/adminroute");
const route_conversation = require("./routers/conversations");
const route_message = require("./routers/messages");
const route_profileView = require("./routers/clientProfileViewroute");

const app = express();
app.use(cors());
const path = require("path");
const publicDir = path.join(__dirname, "uploads");
const imageDir = path.join(__dirname, "uploads/");

//Importing bodyParser
const bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(express.static(publicDir));
app.use(express.static(imageDir));

const route_client_middleware = (req, res, next) => {
  for (const route of route_client) {
    route(req, res, next);
  }
};

app.use(route_client_middleware);
app.use(route_admin);
app.use("/conversations", route_conversation);
app.use("/messages", route_message);
app.use(route_profileView);

app.listen(4000);
