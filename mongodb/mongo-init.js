// use result
db.createUser({
    user: "guest",
    pwd: "casio",
    roles: [
        {
            role: "readWrite",
            db: "result",
            collection: "pages"
        }
    ]
});

const flag_n = "cnss{t@u70L06Y_TYP3_INJecT1oN}";
let casio3 = {
    "entry": "https://cnss.io/FOo8Ar_EntRy/casio3",
    "url": "https://book.hacktricks.xyz/pentesting-web/nosql-injection",
    "text": flag_n,
    "role": "guest",
    "username": "casio3",
    "session_id": "none",
    "create_time": "299200820890"
}
let wiki = {
    "entry": "https://cnss.io/FOo8Ar_EntRy/casio3",
    "url": "https://ctf-wiki.org/",
    "text": "wiki",
    "role": "guest",
    "username": "casio3",
    "session_id": "none",
    "create_time": "299200820890"
}
let cnss = {
    "entry": "https://cnss.io/FOo8Ar_EntRy/casio3",
    "url": "https://cnss.io/",
    "text": "<strong>❤ALWAYS_LOVE❤</strong>",
    "role": "guest",
    "username": "casio3",
    "session_id": "none",
    "create_time": "299200820890"
}
let sqli = {
    "entry": "https://cnss.io/FOo8Ar_EntRy/casio3",
    "url": "http://sqli-labs.local/",
    "text": "Make it yourself",
    "role": "guest",
    "username": "casio3",
    "session_id": "none",
    "create_time": "299200820890"
}

db.pages.insertMany(
    [casio3, wiki, sqli, cnss]
);
