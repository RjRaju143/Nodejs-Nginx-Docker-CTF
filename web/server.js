//export NODE_ENV=production // on production env...
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}
//modules imported
const path = require('path')
const express = require('express')
const app = express()
const bcrypt = require('bcrypt')
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')
const methodOverride = require('method-override')
const fs = require('fs')
const multer = require('multer');
const uploadFile = multer();

const AWS = require('aws-sdk');
//configuring the AWS environment
AWS.config.update({
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRET_ACCESS_KEY
});
var s3 = new AWS.S3();

//debug & logs
const logger = require('morgan');
app.use(logger('dev'));

// Configure view engine and set views folder
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
const initializePassport = require('./passport-config')

initializePassport(
  passport,
  email => users.find(user => user.email === email),
  id => users.find(user => user.id === id)
)

const users = require('./local-storade-db-users/users.local-db');

app.set('view-engine', 'ejs')
app.use(express.urlencoded({ extended: false }))
app.use(flash())
app.use(session({
  secret: process.env.SESSION_SECRET || "qwertyuioASDFGHJ123456%$#",
  resave: false,
  saveUninitialized: false
}))

app.use(passport.initialize())
app.use(passport.session())
app.use(methodOverride('_method'))
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', checkAuthenticated, (req, res) => {
  try{
    res.render('index.ejs', {
      name: req.user.name,
      uploadstatus : "upload success"
    })
  }catch(error){
    console.log(error);
    res.status(500).send(`<h1><center>500 Error</center></h1>`);
  }
})

app.get('/login', checkNotAuthenticated, (req, res) => {
  try {
    res.render('login.ejs')
  } catch (error) {
    console.log(error);
    res.status(500).send(`<h1><center>500 Error</center></h1>`);
  }
})
app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: true
}))

// source path
app.get('/source',checkAuthenticated, (req, res) => {
  try {
    res.render('source.ejs',{output: req.query.name});
  } catch (error) {
    console.log(error);
    res.status(500).send(`<h1><center>500 Error</center></h1>`);
  }
})

//// upload the file to S3
app.post('/', uploadFile.single('file'), (req, res) => {
  try{
    const file = req.file;
    let now = new Date();
    const fileName = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}_${now.getHours()}-${now.getMinutes()}-${now.getSeconds()}`
    const params = {
        Bucket: 'ultronbot',
        Key: `${fileName}-${file.originalname}`,
        Body: file.buffer
    };
    s3.upload(params, (err, data) => {
        if (err) {
            console.log(err);
            res.status(500).send(`<h1><center>500 Error</center></h1>`);
        } else {
            // res.status(200).redirect('/');
            res.status(200).send('<script>alert("upload successful");window.location.href = "http://localhost:8000";</script>');
            // res.status(200).send('<script>alert("uploaded")</script>');
            console.log(file)
        }
    });
  }catch(error){
    console.log(error);
    res.redirect('/');
  }
});

// aws-s3 directory listing ...
app.get('/upload',checkAuthenticated,(req,res)=>{
  try{
    const s3Urls = [];
    const filesNames = []
    const bucketName = 'ultronbot'
    const params = {
      Bucket: 'ultronbot'
    };
    s3.listObjects(params, function(err, data) {
      if (err) {
        console.log(err);
      } else {
        data.Contents.forEach((file)=>{
          const url = s3.getSignedUrl('getObject', {
            Bucket: bucketName,
            Key: file.Key,
          });
          const fileUrl = `https://s3.amazonaws.com/${bucketName}/${file.Key}`;
          const fileImageName = `${file.Key}`;
          s3Urls.push(`${fileUrl}`)
          filesNames.push(`${fileImageName}`)
        });
      }if (s3Urls.length == 0) {
        res.status(200).json({
          status : `${res.statusCode}`,
          message:"No data"
        });
      }else{
        const output = Object.fromEntries(filesNames.map((key, i) => [key, s3Urls[i]]));
        res.json(output)
      }
    });
  }catch(error){
    console.log(error);
    res.status(500).send(`<h1><center>500 Error</center></h1>`);
  }
})

//
app.get('/register', checkNotAuthenticated, (req, res) => {
  try {
    res.render('register.ejs')
  } catch (error){
    console.log(error)
    res.status(500).send(`<h1><center>500 Error</center></h1>`);
  }
})

// without db
app.post('/register', checkNotAuthenticated, async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10)
    users.push({
      id: Date.now().toString(),
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword
    })
    res.redirect('/login')
  } catch {
    res.redirect('/register')
  }
})

// patch delete req...
app.delete('/logout', function(req, res, next) {
  req.logout(function(err) {
    if (err) {
      return next(err);
    }
    res.redirect('/');
  });
});

function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next()
  }
  res.redirect('/login')
}
function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect('/')
  }
  next()
}

//robots
app.get('/robots.txt',(req,res)=>{
  res.sendFile(path.join(__dirname, 'robots.txt'));
});

// 404 Page Not Found
app.use((req,res)=>{
  try{
    res.status(404).render('404.ejs');
  }catch(error){
    console.log(error)
    res.status(500).send(`<h1><center>500 Error</center></h1>`);
  }
});

//listening
const port = process.env.PORT || 8000;
app.listen(port,()=>{
  console.log(`local server listen on port ${port}`)
  console.log(`ReverseProxy listen on port 8800`)
})




