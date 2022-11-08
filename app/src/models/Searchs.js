const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const SearchsSchema = new Schema({
    search: { type: {}, required: true },
});
// dont mind the grammar
const Searchs = mongoose.model("Searchs", SearchsSchema, 'searchs');
module.exports = Searchs;
