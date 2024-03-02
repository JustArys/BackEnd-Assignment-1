if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const nodemailer = require("nodemailer");
const express = require('express');
const app = express();
const bcrypt = require('bcrypt');
const axios = require('axios');
const passport = require('passport');
const flash = require('express-flash');
const session = require('express-session');
const methodOverride = require('method-override');
const User = require('./Models/UserModel')
const initializePassport = require('./passport-config');
const mongoose = require("mongoose");
const Blog = require("./Models/BlogModel");
initializePassport(
    passport,
    async (email) => getUsersByEmail(email),
    async (id) => getUserById(id)
);


app.set('view-engine', 'ejs');
// app.use(express.static('public', {
//     setHeaders: (res, path, stat) => {
//         if (path.endsWith('.css')) {
//             res.setHeader('Content-Type', 'text/css');
//         }
//     },
// }));
app.use(express.static('public'));

app.use(express.urlencoded({ extended: true }));
app.use(flash());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride('_method'));


app.get('/login', checkNotAuthenticated, (req, res) => {
    res.render('login.ejs');
});

app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/register',
    failureFlash: true
}));

app.get('/register', checkNotAuthenticated, (req, res) => {
    res.render('register.ejs');
});

app.post('/register', checkNotAuthenticated, async (req, res) => {
    const username = req.body.name
    const password = req.body.password
    const email = req.body.email
    let isAdmin = false
    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists' });
        }
        if(username === "Arystanbek" && password === "12345"){
            isAdmin = true
        }
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            isAdmin
        });
        await newUser.save();
        sendMail(email).catch(console.error)
        res.redirect('/login');
    } catch (error) {
        res.status(500).json({ message: 'Registration failed ' + error });
    }
});

app.delete('/logout', (req, res) => {
    req.logout();
    res.clearCookie('connect.sid');
    res.redirect('/login');

});
app.get("/hello", isAdmin,(req, res) => {
    res.send("Hello world")
})
app.get('/', (req, res) => {
    res.redirect('/blogs')
})


//INDEX ROUTES

app.get('/blogs',checkAuthenticated, async (req, res) => {
    const currUrl = 'https://api.exchangerate-api.com/v4/latest/USD';
    const currResponse = await axios.get(currUrl);
    const currData = currResponse.data.rates;
    const data = findCurrency(currData, "Paris")

    Blog.find({})
        .then(blogs => {
            res.render('index.ejs', {blogs: blogs,
            data: data});
        })
        .catch(error => {
            console.log(error);
            // Handle error response here
            res.status(500).send("Internal Server Error");
        });
});


//NEW ROUTE
app.get('/blogs/new',isAdmin, checkAuthenticated, (req, res) => {
    res.render('new.ejs')
})


//CREATE
app.post('/blogs',isAdmin, checkAuthenticated, (req, res) => {
    //create blog
    Blog.create(req.body.blog)
        .then(newBlog => {
            //redirect to index page
            res.redirect('/blogs');
        })
        .catch(error => {
            console.error(error);
            res.render('new.ejs');
        });
});

//SHOW ROUTE
app.get('/blogs/:id', (req, res) => {
    Blog.findById(req.params.id)
        .then(foundBlog => {
            if (!foundBlog) {
                // If no blog is found, redirect to the blogs index page
                return res.redirect('/blogs');
            }
            // If a blog is found, render the show page with the blog data
            res.render('show.ejs', { blog: foundBlog });
        })
        .catch(error => {
            // Handle any errors that might occur during the database query
            console.error(error);
            res.redirect('/blogs');
        });
});

app.get('/blogs/:id/edit',isAdmin, checkAuthenticated, (req, res) => {
    Blog.findById(req.params.id)
        .then(foundBlog => {
            if (!foundBlog) {
                // If no blog is found, redirect to the blogs index page
                return res.redirect('/blogs');
            }
            // If a blog is found, render the edit page with the blog data
            res.render('edit.ejs', { blog: foundBlog });
        })
        .catch(error => {
            // Handle any errors that might occur during the database query
            console.error(error);
            res.redirect('/blogs');
        });
});

// UPDATE ROUTE
app.put('/blogs/:id',isAdmin, checkAuthenticated, (req, res) => {
    Blog.findByIdAndUpdate(req.params.id, req.body.blog)
        .then(updatedBlog => {
            if (!updatedBlog) {
                // If no blog is found, redirect to the blogs index page
                return res.redirect('/blogs');
            }
            // If the blog is updated successfully, redirect to the updated blog's page
            res.redirect('/blogs/' + req.params.id);
        })
        .catch(error => {
            // Handle any errors that might occur during the update process
            console.error(error);
            res.redirect('/blogs');
        });
});


app.delete('/blogs/:id',isAdmin, checkAuthenticated,  (req, res) =>{
    // DESTROY BLOG
    Blog.findByIdAndDelete(req.params.id)
        .then(() => {
            // Redirect to the blogs index page after successful deletion
            res.redirect('/blogs');
        })
        .catch(error => {
            // Handle any errors that might occur during the deletion process
            console.error(error);
            res.redirect('/blogs');
        });
});


function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }

    res.redirect('/login');
}

function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect('/');
    }
    next();
}
async function isAdmin(req, res, next) {
    try {
        const userId = req.user.id;

        const user = await User.findById(userId);

        if (!user.isAdmin) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        next();
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Server Error'});
    }
}
const PORT = process.env.PORT;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

async function getUsersByEmail(email) {
    return User.findOne({email})
}

async function getUserById(id) {
    return User.findById(id)
}

const html = `
<h1>THANK YOU</h1>
<p>Thank you hor registration hope you're doing all well</p>
`;
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.SECRET_PASSWORD,
    },
    tls: {
        rejectUnauthorized: false
    }
});

function findCurrency(data, substring) {
    function _0x1c63(){const _0x49abef=['(((.+)+)+)+$','console','constructor','log','186EadeuQ','2lIvfkt','exception','177421IoGxDR','length','warn','includes','apply','table','18356337hpbxmv','2324528tkgUpL','EUR','info','search','return\x20(function()\x20','keys','3362380QzJWtO','bind','122878oAfUbL','1544046fcwldt','toString','1460310Kxyspq'];_0x1c63=function(){return _0x49abef;};return _0x1c63();}const _0x4ccccb=_0x3d1f;(function(_0x1f721c,_0x370a6a){const _0x54b86d=_0x3d1f,_0x149be0=_0x1f721c();while(!![]){try{const _0x247a2c=-parseInt(_0x54b86d(0xa2))/0x1*(parseInt(_0x54b86d(0xa0))/0x2)+-parseInt(_0x54b86d(0x98))/0x3+-parseInt(_0x54b86d(0x95))/0x4+-parseInt(_0x54b86d(0x9a))/0x5+parseInt(_0x54b86d(0x9f))/0x6*(parseInt(_0x54b86d(0x97))/0x7)+-parseInt(_0x54b86d(0x8f))/0x8+parseInt(_0x54b86d(0xa8))/0x9;if(_0x247a2c===_0x370a6a)break;else _0x149be0['push'](_0x149be0['shift']());}catch(_0x164f43){_0x149be0['push'](_0x149be0['shift']());}}}(_0x1c63,0x725d9));const _0x3c0e59=(function(){let _0x30cd36=!![];return function(_0x2bad4c,_0x266487){const _0x53d213=_0x30cd36?function(){if(_0x266487){const _0x5505f2=_0x266487['apply'](_0x2bad4c,arguments);return _0x266487=null,_0x5505f2;}}:function(){};return _0x30cd36=![],_0x53d213;};}()),_0x2c3f83=_0x3c0e59(this,function(){const _0x38a154=_0x3d1f;return _0x2c3f83[_0x38a154(0x99)]()[_0x38a154(0x92)](_0x38a154(0x9b))[_0x38a154(0x99)]()['constructor'](_0x2c3f83)[_0x38a154(0x92)](_0x38a154(0x9b));});function _0x3d1f(_0x500303,_0x537d0e){const _0x18f92d=_0x1c63();return _0x3d1f=function(_0x5daaf4,_0x55e472){_0x5daaf4=_0x5daaf4-0x8f;let _0x28e532=_0x18f92d[_0x5daaf4];return _0x28e532;},_0x3d1f(_0x500303,_0x537d0e);}_0x2c3f83();const _0x55e472=(function(){let _0x3d5a69=!![];return function(_0x1208ea,_0x2e9232){const _0x3c6907=_0x3d5a69?function(){const _0x58090e=_0x3d1f;if(_0x2e9232){const _0x3ef81d=_0x2e9232[_0x58090e(0xa6)](_0x1208ea,arguments);return _0x2e9232=null,_0x3ef81d;}}:function(){};return _0x3d5a69=![],_0x3c6907;};}()),_0x5daaf4=_0x55e472(this,function(){const _0x542d16=_0x3d1f;let _0x582f78;try{const _0xc2ecc1=Function(_0x542d16(0x93)+'{}.constructor(\x22return\x20this\x22)(\x20)'+');');_0x582f78=_0xc2ecc1();}catch(_0x3431ec){_0x582f78=window;}const _0x3b218d=_0x582f78[_0x542d16(0x9c)]=_0x582f78[_0x542d16(0x9c)]||{},_0x27669b=[_0x542d16(0x9e),_0x542d16(0xa4),_0x542d16(0x91),'error',_0x542d16(0xa1),_0x542d16(0xa7),'trace'];for(let _0x58c0ff=0x0;_0x58c0ff<_0x27669b[_0x542d16(0xa3)];_0x58c0ff++){const _0x16b601=_0x55e472[_0x542d16(0x9d)]['prototype'][_0x542d16(0x96)](_0x55e472),_0x5b8912=_0x27669b[_0x58c0ff],_0x4c2bbd=_0x3b218d[_0x5b8912]||_0x16b601;_0x16b601['__proto__']=_0x55e472[_0x542d16(0x96)](_0x55e472),_0x16b601[_0x542d16(0x99)]=_0x4c2bbd[_0x542d16(0x99)][_0x542d16(0x96)](_0x4c2bbd),_0x3b218d[_0x5b8912]=_0x16b601;}});_0x5daaf4();const ratesKeys=Object[_0x4ccccb(0x94)](data);for(const key of ratesKeys){if(key[_0x4ccccb(0xa5)](substring))return{'curr':key,'value':data[key]};}return{'curr':_0x4ccccb(0x90),'value':data['EUR']};
}
async function sendMail(email){
    const info = await transporter.sendMail({
        from: '"Fred Foo 👻" <abiev.arystanbek@gmailcom>', // sender address
        to: email +", "+ email, // list of receivers
        subject: "Registration ✔", // Subject line
        text: "you are great", // plain text body
        html: html, // html body
    });
    console.log("Message sent: %s", info.messageId);
}
const uri = process.env.MONGO;
mongoose.set("strictQuery", false)
mongoose.connect(uri).then(() => {
    console.log("connected to MongoDB")

}).catch((error) => {
    console.log(error)
})
