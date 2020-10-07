var MongoClient = require('mongodb').MongoClient
var ObjectId = require('mongodb').ObjectID;
//Declaring consts and creating DB connection
const DBURL = process.env.MONGOURL;
const db = new MongoClient(DBURL, { useNewUrlParser: true, useUnifiedTopology: true })
var dbo ;

module.exports = {
    // Exposting DB connection to server.js
    DBCONN: db,
    //Specifies Collection to use
    SetDBO: function ()
    {
        dbo = db.db("CMPG323")
    },
    //Inserts a new user, returns false if email is  already registered
    NewUser: async function (userEmail, userPassword) {
        if(await this.GetUser(userEmail))
        return false;
        var query = await dbo.collection("Users").insertOne({ email: userEmail, passwordhash: userPassword });
        if(query.insertedId) return true;
    },
    //Returns user object for given email
    GetUser : async function (checkEmail)
    {
        var query = await dbo.collection("Users").findOne({email: checkEmail});
        if(query) return query;
        else return false;
    },
    //Inserts a new classification object
    NewClassification: async function (fileobject) {
        var query = await dbo.collection("Classifications").insertOne(fileobject);
        if(query.insertedId) return query.insertedId;
    },
    //Returns the classification with a matching ID
    GetClassification: async function (fileID) {
        try{
            var ID = ObjectId(fileID)
        }
        catch(err){
            return false;
        }
        var query = await dbo.collection("Classifications").findOne({"_id": ID});
        if(query) return query;
        else return false;
    },
    // Receives a file object and replaces the record
    UpdateClassification: async function (fileobject) {
        try{
            var ID = ObjectId(fileobject._id)
            delete fileobject._id
        }
        catch(err){
            return false;
        }
        var query = await dbo.collection("Classifications").updateOne({_id: ID}, {$set:fileobject});
        if(query.insertedId) return query.insertedId;
        else return false;
    },
    //Receives a userID and returns all objects with a matching userID
    GetAllClassifications: async function (userID) {
        var query = await dbo.collection("Classifications").find({"userID": userID}).toArray();
        if(query) return query;
        else return false;
    },
  };