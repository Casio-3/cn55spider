const express = require("express");
const router = express.Router({ caseSensitive: true });
const { genPow } = require("../helper/utils");

router.get("/", (req, res) => {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    let hash = genPow();
    req.session.pow = hash;
    return res.render('index', { proof: `md5(xxxx)[-6:] == ${hash.slice(-6)}` });
});

router.get("/redirect", (req, res) => {
    return res.redirect(301, "/");
});

router.get("/view", (req, res) => {
    return res.redirect(301, "/guest/view");
});

module.exports = router;
