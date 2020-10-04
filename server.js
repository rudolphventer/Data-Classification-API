require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const bcrypt = require('bcrypt');
const multer = require('multer');
var DataFunctions = require('./datafunctions');
var Classifier = require('./classifier');
const path = require('path');
const { stat } = require('fs');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});

//Multer stuff

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
      cb(null, process.env.UPLOAD_DIR);
  },
  // Adding file extensions back
  filename: function(req, file, cb) {
      cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});
var upload = multer({ storage: storage })

////////////////////////////// Routes /////////////////////////////////

app.post("/newuser", async (req, res) => {
  var user = req.body;
  var status = "Email already in use";
  if(validateEmail(user.email))
  {
    var hashedPassword = await hashPassword(user.password)
    var status = await DataFunctions.NewUser(user.email, hashedPassword)
    status = "Account created successfully";
  }
  res.send(status);
});

app.get("/login", async (req, res) => {
  var user = await DataFunctions.GetUser(req.body.email)
  console.log(user)
  if(user)
    var auth = await hashesMatch(req.body.password, user.passwordhash)
  else
    res.send("Invalid credentials")
  var authToken = await generateAccessToken(user.email, user._id)
  res.send({"authtoken" : authToken});
});

app.post('/upload', upload.single('file'), async (req, res, next) => {
  const file = req.file;
  var status = "File upload failed";
  if (!file) {
    const error = new Error('Please upload a file')
    error.httpStatusCode = 400
    return next(error)
  }
  var userToken = req.headers.authorization.split(" ")[1];
  var user = await verifyAccessToken(userToken);
  if(user)
  {
    var classificationFile = await Classifier.Classify(file.destination+file.filename, user.id)
    console.log(classificationFile)
    DataFunctions.NewClassification(classificationFile)
    //res.send(file) seems to return info about the file
    status = "Uplaod succesful"
    
  }
  res.send(status)
})

////////////////////////////// Tools /////////////////////////////////

function validateEmail(email)
{
     var re = /\S+@\S+\.\S+/;
     return re.test(email);   
}

async function hashPassword(password)
{
  return await bcrypt.hash(password, 10)
}

function hashesMatch(password, hash)
{
  return bcrypt.compare(password, hash);
}

function generateAccessToken(email, id) {
  //expires in 20 days
  return jwt.sign({ "email": email, "id": id }, process.env.TOKEN_SECRET, { expiresIn: '1728000s' });
}

async function verifyAccessToken(token)
{
  try{
    var auth = await jwt.verify(token, process.env.TOKEN_SECRET);
    if (auth) return auth;
  }
  catch(err)
  {
    return false;
  }
}