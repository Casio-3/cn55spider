const express = require("express");
const router = express.Router({ caseSensitive: true });
const redisClient = require("../helper/db").redisClient;
const Pages = require("../models/Pages");
const jsrender = require("jsrender");
const { URL } = require("url");
const { md5, genPow } = require("../helper/utils");

const reg = /(https?):\/\/[-A-Za-z0-9+&@#\/%?=~_|!:,.;]+[-A-Za-z0-9+&@#\/%=~_|]/;
function validateUrl(urlString) {
    try {
        new URL(urlString);
        return !!urlString.match(reg);
    } catch {
        return false;
    }
}

router.get("/", (req, res) => {
    return res.redirect(301, "/");
});

router.post("/crawl", (req, res) => {
    let { username, entry, proof } = req.body;
    proof ??= '';
    let hash = req.session.pow ?? '';
    req.session.pow = genPow();
    if (md5(proof).slice(-6) == hash.slice(-6)) {
        if (username && entry) {
            if (validateUrl(entry)) {
                let task = {
                    url: entry,
                    meta: {
                        role: "guest",
                        username: username || "NOBODY",
                        session_id: req.session.id,
                        create_time: Math.round(new Date() / 1000).toString()
                    },
                };
                redisClient.connect();
                redisClient.lPush("recruit:start_urls", JSON.stringify(task));
                redisClient.quit();
                return res.render('success', {
                    layout: "layout-m",
                    message: "Now you can `/view` results with your username and entry."
                });
            } else {
                return res.render('error', {
                    layout: "layout-m",
                    message: "Not a valid url."
                });
            }
        } else {
            return res.render('error', {
                layout: "layout-m",
                message: "Both username and entry required."
            });
        }
    } else {
        return res.render('error', {
            layout: "layout-m",
            message: "Unsovled proof of work."
        });
    }
});

router.get('/view', async (req, res) => {
    const { username, entry } = req.query;
    const header = `<link href="https://unpkg.com/prismjs@v1.x/themes/prism.css" rel="stylesheet" /></head>`;
    const greeting = `Hey guest, look what we've done for Y❤U (。_。)`;
    const results = `
    {{for links}}
        <hr>
        <h2><a href="{{:url}}">{{:url}}</a></h2>
        <pre>
            <code class="language-html">
                {{>text}}
            </code>
        </pre>
    {{/for}}
    `;
    const footer = `
    <script src="https://unpkg.com/prismjs@v1.x/components/prism-core.min.js"></script>
    <script src="https://unpkg.com/prismjs@v1.x/plugins/autoloader/prism-autoloader.min.js"></script>`;
    let tpl = header + greeting + results + footer;
    let data = { links: [] };
    if (username && entry) {
        let guest = await Pages.find({
            role: "guest",
            username: username,
            entry: entry,
        }).sort({ create_time: 'desc' }).limit(5);
        if (guest && guest.length > 0) {
            guest.forEach((g) => {
                data.links.push({ url: g.url, text: g.text });
            });
        }
        tpl = jsrender.templates(tpl);
        const html = tpl.render(data);
        return res.send(html);
    } else {
        return res.render('error', {
            layout: "layout-m",
            message: "Both username and entry required."
        });
    }
});

router.post('/view', (req, res) => {
    return res.send("GET me.");
});

module.exports = router;
