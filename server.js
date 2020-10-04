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
const { DBCONN } = require('./datafunctions');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const PORT = process.env.PORT || 8080;
//Waiting for DB connection before starting server
DataFunctions.DBCONN.connect()
.then(res => {
  DataFunctions.SetDBO();
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}\nDB connection successful`);
  });
})


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
  var status = {"status" : "Email already in use", "data": false};
  if(validateEmail(user.email))
  {
    var hashedPassword = await hashPassword(user.password)
    var status = await DataFunctions.NewUser(user.email, hashedPassword)
    status = {"status" : "Account created successfully", "data": true};
  }
  res.send(status);
});

app.post("/login", async (req, res) => {
  console.log(req.body)
  var response = response = {"status": "Login unsuccessful", "data" : false};;
  var user = await DataFunctions.GetUser(req.body.email)
  if(user)
    var auth = await hashesMatch(req.body.password, user.passwordhash)
  else
    response = {"status": "No user with those credentials exists", "data" : false};
  if(auth)
  {
    var authToken = await generateAccessToken(user.email, user._id)
    response = {"status": "Login sucessful", "data" : authToken};
  }

  res.send(response)
});

app.post('/upload', upload.single('file'), async (req, res, next) => {
  const file = req.file;
  var status = {"status" : "Upload failed", "data": false}
  if (!file) {
    status = {"status" : "Upload failed", "data": false}
    error.httpstatusCode = 400
    return next(error)
  }
  var userToken = req.headers.authorization.split(" ")[1];
  var user = await verifyAccessToken(userToken);
  var classificationFile = await Classifier.Classify(file.destination+file.filename, user.id)
  var ID = false;
  if(user)
  {
    if(classificationFile) ID = await DataFunctions.NewClassification(classificationFile)
    status = {"status" : "Upload succesful", "data": ID}
  }
  else
  {
    status = {"status" : "Invalid credentials", "data": false};
  }
  res.send(status)
})

app.get("/getfile", async (req, res) => {
  var status ={};
  var userToken = req.headers.authorization.split(" ")[1];
  var user = await verifyAccessToken(userToken);
  var reqFile = await DataFunctions.GetClassification(req.body.fileID)
  if(user.id == reqFile.userID)
  {
    status = {"status": "Authorised", "data" : reqFile}
  }
  else status = {"status": "File does not exist or authentication failed", "data" : false};
  res.send(status)
})

app.post("/updatefile", upload.single('file'), async (req, res, next) => {
  var status ={};
  var userToken = req.headers.authorization.split(" ")[1];
  var user = await verifyAccessToken(userToken);
  if(user.id == req.body.userID)
  {
    DataFunctions.UpdateClassification(req.body);
    status = {"status": "Success", "data" : true}
  }
  else status = {"status": "File does not exist or authentication failed", "data" : false};
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