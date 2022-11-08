// Library
const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const mongoose = require("mongoose");
const uuid = require("uuid").v4;
const session = require("express-session");
const cookieParser = require("cookie-parser");
const RedisStore = require("connect-redis")(session);
const redis = require("redis");

// Constant
const BIND_ADDR = process.env.BIND_ADDR || "0.0.0.0";
const LISTEN_PORT = process.env.LISTEN_PORT || 8082;
const SESSION_SECRET = process.env.SESSION_SECRET || uuid();
const REDIS_URI = "redis://" + (process.env.REDIS_HOST || "localhost:56379");
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || "sTrOnG_R3D1s_p@s5woRd_HeRE";

// App
const app = express();

// MongoDB config
const db = require("./helper/db").MongoURI;
mongoose
    .connect(db)
    .then(() => console.log("MongoDB Connected."))
    .catch((err) => console.log(err));

// Redis config
const redisClient = redis.createClient({
    url: REDIS_URI,
    password: REDIS_PASSWORD,
    legacyMode: true,
});
redisClient
    .connect()
    .then(() => console.log("Redis Connected."))
    .catch((err) => console.log(err));


// EJS
app.use(expressLayouts);
app.set('view engine', 'ejs');

// bodyParser
app.use(express.urlencoded({ extended: true }));
// cookieParser
app.use(cookieParser());

// trust first proxy for secure cookies
app.set("trust proxy", 1);

// express session
app.use(
    session({
        store: new RedisStore({ client: redisClient }),
        secret: SESSION_SECRET,
        resave: false,
        saveUninitialized: true,
        name: "session",
        cookie: {
            maxAge: 1000 * 60 * 6,
            secure: false, // for http
            httpOnly: true,
        },
    })
);

// routes
app.use("/", require("./routes/index"));
app.use(express.static(__dirname + "/public"));
app.use("/guest", require("./routes/guest"));
app.use("/admin", require("./routes/admin"));

app.listen(
    LISTEN_PORT,
    BIND_ADDR,
    console.log(`Started on http://${BIND_ADDR}:${LISTEN_PORT}`)
);
