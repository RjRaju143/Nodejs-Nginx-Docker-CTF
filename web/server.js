//export NODE_ENV=production // on production env...
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}
//modules imported
const path = require('path')
const exp = require('constants')
const serveIndex = require('serve-index');
const express = require('express')
const fileUpload = require('express-fileupload');
const app = express()
const bcrypt = require('bcrypt')
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')
const methodOverride = require('method-override')
const fs = require('fs')

//debug & logs
const logger = require('morgan');
app.use(logger('dev'));

// Configure view engine and set views folder
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
const initializePassport = require('./models/passport-config')

initializePassport(
  passport,
  email => users.find(user => user.email === email),
  id => users.find(user => user.id === id)
)

const users = [];

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
  res.render('index.ejs', {
    name: req.user.name,
    uploadstatus : "upload success"
  })
})

app.get('/login', checkNotAuthenticated, (req, res) => {
  res.render('login.ejs')
})
app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: true
}))

//// source path
app.get('/source',checkAuthenticated, (req, res) => {
  res.render('source.ejs',{output: req.query.name});
  console.log(req.method,res.statusCode,req.url,req.query.name); // added for log
})

//// file uploading ....
app.use(fileUpload())
app.post('/',async(req,res,next)=>{
  function createFolder(){
    const folderName = path.join(__dirname, 'upload')
    try {
        if (!fs.existsSync(folderName)) fs.mkdirSync(folderName);
    }catch (err) {
      console.error(err)
    }
  }
  try{
    createFolder()
    const file = req.files.mFiles  // SingleFileUpload
    let now = new Date();
    const fileName = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}_${now.getHours()}-${now.getMinutes()}-${now.getSeconds()}`
    const savePath = path.join(__dirnamadded, 'upload', fileName + path.extname(file.name))
    console.log(file)  // added for log..
    await file.mv(savePath)
    // res.redirect('/')
    res.send(`<script>alert('file uploaded !..');window.location.href = "/";</script>`);
  }
  catch (error){
    // res.redirect('/')
    try{
      createFolder()
      const files = req.files.mFiles  // MultiFileUpload
      await Promise.all(files.map(file =>{
        const savePath = path.join(__dirname, 'upload', file.name)
        console.log(file); // added for log
        return file.mv(savePath) 
      }))
      // res.redirect('/')
      res.send(`<script>alert('files uploaded !..');window.location.href = "/";</script>`);
    }catch(nullError){
      // console.log(nullError);
      console.log("SomeError ..."); // added for log
      res.redirect('/')
    }
  }
})

//old_CODE
// directory listing
// app.use(express.static(__dirname + "/"))
// app.use('/upload',checkAuthenticated,serveIndex(__dirname + '/upload'));

//// NEW BLOCK
// directory listing
app.get('/upload',checkAuthenticated, (req, res) => {
  var directoryPath = path.join(__dirname, 'upload');
  fs.readdir(directoryPath, function (err, files) {
    if (err) {
        console.log(`no such file or directory`);
        res.status(500).send(`<h1><center>500 Error<br>Upload path not found !.</center></h1>`);
    }
    if (files == 0) {
      res.send('its empty, please upload some files')
    } else {
      res.send(files)
    }
    // res.send(files)
    // console.log(req.method,res.statusCode,req.url); // added for log
    try{
      files.forEach(function (file) {
        console.log(req.method,res.statusCode,req.url,file); // added for log
      });
    }catch(e){
      console.log(`upload path not found ! ...`);
    }
  })
});


//
app.get('/register', checkNotAuthenticated, (req, res) => {
  res.render('register.ejs')
  // console.log(req.method,res.statusCode,req.url); // added for log
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
  console.log(users) // added for log.. (it show's users details in console)
  // console.table(users) // added for log.. (it show's users details in console)
})

// old delete req..
// app.delete('/logout', (req, res) => {
//   req.logOut()
//   res.redirect('/login')
//   console.log(req.method,res.statusCode,req.url); // added for log
// })

// patch for delete req...
app.delete('/logout', function(req, res, next) {
  req.logout(function(err) {
    if (err) {
      return next(err);
    }
    res.redirect('/');
    // console.log(req.method,res.statusCode,req.url); // added for log
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
  res.status(404).render('404.ejs');
  // console.log(req.method,res.statusCode,req.url); // added for log
});

//listening
const port = process.env.PORT || 8000;
app.listen(port,()=>{
	console.log(`local server listen on port ${port}
http://127.0.0.1:${port}`)
  console.log(`ReverseProxy listen on port 8800
http://127.0.0.1:${port}`)
})




