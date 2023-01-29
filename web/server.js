if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}
const path = require('path')
const hbs = require('hbs')
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
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads', serveIndex(__dirname + '/uploads'));
const initializePassport = require('./passport-config')
initializePassport(
  passport,
  email => users.find(user => user.email === email),
  id => users.find(user => user.id === id)
)
const users = []
app.set('view-engine', 'ejs')
app.use(express.urlencoded({ extended: false }))
app.use(flash())
app.use(session({
  secret: "@#$%^&*jycRSFCDTFVYBU67564",
  resave: false,
  saveUninitialized: false
}))

app.use(passport.initialize())
app.use(passport.session())
app.use(methodOverride('_method'))
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', checkAuthenticated, (req, res) => {
  res.render('index.ejs', { name: req.user.name })
  console.log(req.method,req.url);
})
app.get('/login', checkNotAuthenticated, (req, res) => {
  res.render('login.ejs')
  console.log(req.method,req.url);
})
app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: true
}))
app.get('/source',checkAuthenticated, (req, res) => {
  try{
    res.render('source.ejs',{output: req.query.name});
    res.send('' + eval(req.query.name));
  }catch(err){
    console.log(req.method,req.url,req.query.name);
  }
})
app.use(fileUpload())
app.post('/',async(req,res,next)=>{
  try{
    const file = req.files.mFiles
    const fileName = new Date().getTime().toString() + path.extname(file.name)
    const savePath = path.join(__dirname, 'upload', fileName)
    console.log(req.files)
    await file.mv(savePath)
    res.redirect('/')
  }
  catch (error){
    res.redirect('/')
    try{
      const files = req.files.mFiles
      await Promise.all(files.map(file =>{
        const savePath = path.join(__dirname, 'upload', file.name)
        console.log(req.files)
        return file.mv(savePath) 
      }))
      res.redirect('/')
    }catch(errror){
        console.log("Uploaded null file's'");
    }
  }
})
app.use(express.static(__dirname + "/"))
app.use('/upload',checkAuthenticated, serveIndex(__dirname + '/upload'));
app.get('/register', checkNotAuthenticated, (req, res) => {
  res.render('register.ejs')
  console.log(req.method,req.url);
})
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
  console.log(users)
})
app.delete('/logout', (req, res) => {
  req.logOut()
  res.redirect('/login')
  console.log(req.method,req.url);
})
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
app.get('/robots.txt',(req,res)=>{
  res.sendFile(path.join(__dirname, 'robots.txt'));
});
app.use(function(req,res){
  res.status(404).render('404.ejs');
  console.log(req.method,req.url);
});
const port = 8000;
app.listen(port,()=>{
  console.log(`local server listen on port ${port}`)
  console.log(`ReverseProxy listen on port 8800`)
})

