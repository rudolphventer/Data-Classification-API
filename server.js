require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require('bcrypt');
var DataFunctions = require('./datafunctions');

const app = express();

//console.log(DataFunctions.NewUser("Rudolph", "password"));
test()
async function test(){
  console.log(await DataFunctions.NewUser("Rudolph", "test"))
  console.log(await DataFunctions.UserExists("Rudolph"));
}



app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});

app.post("/newuser", (req, res) => {
  var user = req.body;
  console.log(user);
  if(validateEmail(user.email) && (user.password))
  //inser password hashing fuction here
    DataFunctions.NewUser(user.email, user.password)
  res.sendStatus(200);
});

//tools

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
  bcrypt.compare(password, hash, function(err, res) {
  return res;
  });
}