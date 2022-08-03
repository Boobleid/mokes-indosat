const express = require('express');
const cors = require("cors");
const bodyParser = require("body-parser");
const ip = require("ip");
const app = express();
const config = require("./config/app");

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true,parameterLimit:50000 }));
app.use(express.json());

app.use("/data", require("./controller/data"));
app.use("/pulsa", require("./controller/pulsa"));
app.use("/auth", require("./controller/auth"));
app.use("/content", require("./controller/content"));

app.listen(config.port, () => {
  console.log(`Example app listening at http://${ip.address()}:${config.port}`)
});