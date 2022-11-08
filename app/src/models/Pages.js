const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const PagesSchema = new Schema({
    entry: { type: String, required: true },
    url: { type: String, required: true },
    text: { type: Buffer, required: true },
    role: { type: String, required: true },
    username: { type: String, required: true },
    session_id: { type: String, required: true },
    create_time: { type: String, required: true },
});

const Pages = mongoose.model("Pages", PagesSchema, 'pages');
module.exports = Pages;
