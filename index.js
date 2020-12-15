const express = require("express");
const PORT = process.env.PORT || 4000;
const morgan = require("morgan");
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
var https = require('https');
const fs = require("fs");

const config = require("./config/db");

// var privateKey  = fs.readFileSync('sslcert/server.key');
// var certificate = fs.readFileSync('sslcert/server.cert');
// var credentials = {key: privateKey, cert: certificate};


const app = express();

//configure database and mongoose
mongoose.set("useCreateIndex", true);
mongoose
  .connect(config.database, { useNewUrlParser: true })
  .then(() => {
    console.log("Database is connected");
  })
  .catch(err => {
    console.log({ database_error: err });
  });
// db configuaration ends here
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", '*');
    res.header("Access-Control-Allow-Credentials", true);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');
    next();
});
//configure body parser
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
//configure body-parser ends here

app.use(morgan("dev")); // configire morgan

// define first route

const userRoutes = require("./api/user/route/user"); //bring in our user routes
app.use("/user", userRoutes);

const facebookRoutes = require("./api/facebook/route/facebook"); //bring in our user routes
app.use("/facebook", facebookRoutes);

app.listen(4000);

// https.createServer({credentials, app}, function (req, res) {
//     res.end('secure!');
// }).listen(4000)
