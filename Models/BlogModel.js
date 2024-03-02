const mongoose = require('mongoose')
const {mongo} = require("mongoose");

let blogSchema = mongoose.Schema({
    title: String,
    image: {
        type: String,
        default: 'imagePlaceholder.jpg'
    },
    body: String,
    created: {
        type: Date,
        default: Date.now
    }
});
const Blog = mongoose.model('Blog', blogSchema)

module.exports = Blog