const crypto = require("crypto");

const md5 = (s) => {
    return crypto.createHash("md5").update(s).digest("hex");
}

const genPow = () => {
    let key = Math.random().toString(36).slice(-4);
    let hash = md5(key);
    return hash;
}

module.exports = {
    md5,
    genPow,
}