//Calling all components and JS files
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
var cors = require('cors');
//setting constants
const app = express();
const PORT = process.env.PORT || 8080;
//Configuring app
app.use(bodyParser.json());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));

DataFunctions.DBCONN.connect() //Waiting for DB connection before starting server
.then(res => {
  DataFunctions.SetDBO();
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}\nDB connection successful`);
  });
})


//Multer configuration for form data (needed for file transfer)

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
      cb(null, process.env.UPLOAD_DIR);
  },
  // Adding file extensions back as multer removes them
  filename: function(req, file, cb) {
      cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});
var upload = multer({ storage: storage }) // Setting temporary storage location for files

////////////////////////////// Routes ///////////////////////////////// 

//Creates a new user
app.post("/newuser", async (req, res) => {
  var user = req.body;
  var status = {"status" : "Email already in use", "data": false};
  if(validateEmail(user.email))
  {
    //Hashing password and creating user record
    var hashedPassword = await hashPassword(user.password)
    var dbstatus = await DataFunctions.NewUser(user.email, hashedPassword)
    if(dbstatus)
    status = {"status" : "Account created successfully", "data": true};
  }
  res.send(status);
});
//Compares credentials to users and returns valid JWT
app.post("/login", async (req, res) => {
  var response = response = {"status": "Login unsuccessful", "data" : false};
  //Getting userdetails
  var user = await DataFunctions.GetUser(req.body.email)
  //If user is valid, check if password hashes match
  if(user)
    var auth = await hashesMatch(req.body.password, user.passwordhash)
  else
    response = {"status": "No user with those credentials exists", "data" : false};
  if(auth)
  {
    //Generate and return a JWT
    var authToken = await generateAccessToken(user.email, user._id)
    response = {"status": "Login sucessful", "data" : authToken};
  }

  res.send(response)
});
//Used to wake up API dyno
app.get("/ping", async (req, res) => {
  var x = await Classifier.Train();
  res.send(true)
});
//Receives a formdata object with a file and JWT, stores file if JWT is valid
app.post('/upload', upload.single('file'), async (req, res, next) => {
  const file = req.file;
  var status = {"status" : "Upload failed", "data": false}
  if (!file) {
    status = {"status" : "Upload failed", "data": false}
    return next(error)
  }
  //In order: Extracting JWT from request; Verifying token; Classifying data in the file; Saving information to DB;
  var userToken = req.headers.authorization.split(" ")[1];
  var user = await verifyAccessToken(userToken);
  var t0 = new Date().getTime();
  var classificationFile = await Classifier.Classify(file.destination+file.filename, user.id, req.file.originalname); //Calling classifier method in classifier.js
  var t1 = new Date().getTime();
  var ID = false;
  if(user)
  {
    if(classificationFile) ID = await DataFunctions.NewClassification(classificationFile)
    status = {"status" : "Upload succesful", "processingtime": (t1 - t0), "data": ID}
  }
  else
  {
    status = {"status" : "Invalid credentials", "data": false};
  }
  res.send(status)
})
//Recieves a JWT and a file ID, returns the file matching the ID if the id in the valid JWT matches creator id
app.post("/getfile", async (req, res) => {
  //In order: Authenticates user; Checks if user created the file being requested; Returns contents of the file;
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
//Recieves a JWT, uses this to identify user and return all files associated with that user
app.post("/getall", async (req, res) => {
  //In order: Authenticates user; Gets all files with matching userID; Returns them in an array;
  var status ={};
  var userToken = req.headers.authorization.split(" ")[1];
  var user = await verifyAccessToken(userToken);
  console.log(user)
  if(user)
  {
    var reqFile = await DataFunctions.GetAllClassifications(user.id)
    status = {"status": "Authorised", "data" : reqFile}
  }
  else status = {"status": "Error, files could not be retrieved", "data" : false};
  res.send(status)
})
//Recives a full file object and replaces the existing one with it, JWT is used to verify ownership of the file
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

//Validates email format
function validateEmail(email)
{
     var re = /\S+@\S+\.\S+/;
     return re.test(email);   
}

//Hashes passwords
async function hashPassword(password)
{
  return await bcrypt.hash(password, 10)
}
//Checks if hashes for a password match
function hashesMatch(password, hash)
{
  return bcrypt.compare(password, hash);
}
//Generate JWT for auhentication
function generateAccessToken(email, id) {
  //expires in 20 days
  return jwt.sign({ "email": email, "id": id }, process.env.TOKEN_SECRET, { expiresIn: '1728000s' });
}
//Verify that a JWT is authentic and valid
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