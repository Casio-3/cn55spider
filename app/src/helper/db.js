const {
    MONGO_USERNAME,
    MONGO_PASSWORD,
    MONGO_HOSTNAME,
    MONGO_PORT,
    MONGO_DB
} = process.env

const MongoURI = `mongodb://${MONGO_USERNAME}:${MONGO_PASSWORD}@${MONGO_HOSTNAME}:${MONGO_PORT}/${MONGO_DB}`

const { createClient } = require("redis");
const REDIS_URI = "redis://" + (process.env.REDIS_HOST || "localhost:56379");
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || "sTrOnG_R3D1s_p@s5woRd_HeRE";

const redisClient = createClient({
    url: REDIS_URI,
    password: REDIS_PASSWORD,
    legacyMode: true,
});

redisClient.on("error", function (err) {
    console.log(err);
});

module.exports = {
    redisClient,
    MongoURI
}
