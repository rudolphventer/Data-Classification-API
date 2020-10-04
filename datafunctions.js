var MongoClient = require('mongodb').MongoClient
var ObjectId = require('mongodb').ObjectID;
const DBURL = process.env.MONGOURL;
//Creating db connection
const db = new MongoClient(DBURL, { useNewUrlParser: true, useUnifiedTopology: true })
var dbo ;

module.exports = {
    // Exposting DB connection
    DBCONN: db,

    SetDBO: function ()
    {
        dbo = db.db("CMPG323")
    },

    NewUser: async function (userEmail, userPassword) {
        if(await this.GetUser(userEmail))
        return false;
        var query = await dbo.collection("Users").insertOne({ email: userEmail, passwordhash: userPassword });
        if(query.insertedId) return true;
    },

    GetUser : async function (checkEmail)
    {
        var query = await dbo.collection("Users").findOne({email: checkEmail});
        if(query) return query;
        else return false;
    },

    AuthUser : async function(userEmail, userpasswordhash)
    {
        var query = await dbo.collection("Users").findOne({email: userEmail, passwordhash: userpasswordhash});
        if(query) return true;
        else return false;
    },

    NewClassification: async function (fileobject) {
        var query = await dbo.collection("Classifications").insertOne(fileobject);
        if(query.insertedId) return query.insertedId;
    },

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
    }
  };