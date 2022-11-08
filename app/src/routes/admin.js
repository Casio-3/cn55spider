const express = require("express");
const router = express.Router({ caseSensitive: true });
const { execFileSync } = require("child_process");
const jsrender = require("jsrender");
const Pages = require("../models/Pages");
const Searchs = require("../models/Searchs");

router.get("/", (req, res) => {
    console.log(new Date().toLocaleString() + ": an admin coming.");
    if (!(req.cookies.admin_name)) {
        res.setHeader('Set-Cookie', ['admin_name=admin'])
    }
    let admin_name = req.cookies.admin_name || 'admin';

    const greeting = `Welcome back ${admin_name}, here's the admin gift for you~~~`;
    const flag = execFileSync('/readflag-s').toString();
    let panel = `
    <hr>
    You can POST me 'keyword', 'username', 'role' at \`/search\` , I will fetch the latest 5 matching results from all history crawler task!
    <br>
    <!-- After that, user your name to \`/view\` them and enjoy your time. -->
    `;
    let tpl = greeting + flag + panel;
    tpl = jsrender.templates(tpl);
    const html = tpl.render();
    return res.send(html);
});

router.get("/ping", (req, res) => {
    return res.send('pong');
});

router.get("/search", (req, res) => {
    return res.send('POST me.');
});

router.post("/search", async (req, res) => {
    const { keyword, username, role } = req.body;
    if (username && role && keyword) {
        let page = await Pages.find({
            role: role,
            username: username,
            text: keyword
        })
            .sort({ create_time: 'desc' })
            .limit(5)
            .catch((err) => {
                console.error(err);
                return res.json({ status: "failed", reason: "query error" });
            });
        if (page && page.length > 0) {
            let matches = [];
            await Promise.all(
                page.map(async (p) => {
                    // await new Promise(r => setTimeout(r, 1000));
                    matches.push(p.url);
                })
            );
            let search = {
                status: "success",
                keyword: keyword,
                matches: matches,
                search_time: Math.round(new Date() / 1000).toString()
            }
            Searchs.insertMany([{ search: search }]);
            let result = JSON.stringify({
                status: search["status"],
                keyword: search["keyword"],
                search_time: search["search_time"]
            });
            console.log(result);
            return res.json(result);
        } else {
            console.log(JSON.stringify({
                status: "failed",
                keyword: keyword,
                search_time: Math.round(new Date() / 1000).toString()
            }));
            return res.json({ status: "failed", reason: "not found" });
        }
    } else {
        return res.render('error', {
            layout: "layout-m",
            message: "username, role and keyword required."
        });
    }
});

router.post("/view", (req, res) => {
    return res.send("To Be Continued...");
})

module.exports = router;
