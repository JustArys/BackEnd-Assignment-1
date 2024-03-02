const express = require('express')
const mongoose = require('mongoose')
const Blog = require('./Models/BlogModel')
const app = express()

app.use(express.json())
app.get("/", (req, res) => {
   res.send("Hello world")
})
app.get('/blog',async (req, res) => {
   try {
       const blogs = await Blog.find({});
       res.status(200).json(blogs)
   } catch (e) {
       console.log(e.message)
       res.status(500).json({message: e.message})
   }
})
app.get('/blog/:id',async (req, res) => {
    try {
        const {id} = req.params
        const blog = await Blog.findById(id);
        res.status(200).json(blog)
    } catch (e) {
        console.log(e.message)
        res.status(500).json({message: e.message})
    }
})
app.post('/blog', async (req, res) => {
try {
   const product = await Blog.create(req.body)
    res.status(200).json(product)
} catch (e) {
    console.log(e.message)
    res.status(500).json({message: e.message})
}
})

app.put("/blog/:id", async (req,res) =>{
    try {
        const {id} = req.params
        const blog = await Blog.findByIdAndUpdate(id, req.body)
        if(!blog) {
            return res.status(404).json(`cannot find any product with ID ${id}`)
        }
        const updatedBlog = await  Blog.findById(id)
        res.status(200).json(updatedBlog)
    } catch (e) {
        console.log(e.message)
        res.status(500).json({message: e.message})
    }
})
app.delete("/blog/:id", async (req,res) =>{
    try {
        const {id} = req.params
        const blog = await Blog.findByIdAndDelete(id)
        if(!blog) {
            return res.status(404).json(`cannot find any product with ID ${id}`)
        }
        res.status(200).json(blog)
    } catch (e) {
        console.log(e.message)
        res.status(500).json({message: e.message})
    }
})
const uri = "mongodb+srv://abievarystanbek:Just_arys7@cluster0.hto8ivm.mongodb.net/Node-API?retryWrites=true&w=majority";
mongoose.set("strictQuery", false)
 mongoose.connect(uri).then(() => {
     console.log("connected to MongoDB")

 }).catch((error) => {
     console.log(error)
 })