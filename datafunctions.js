var MongoClient = require('mongodb').MongoClient
const DBURL = process.env.MONGOURL;
const db = new MongoClient(DBURL, { useNewUrlParser: true, useUnifiedTopology: true });

module.exports = {
    NewUser: async function (userEmail, userPassword) {
        
        await db.connect();
        var dbo = db.db("CMPG323");
        if(await this.UserExists(userEmail))
        return false;
        var query = await dbo.collection("Users").insertOne({ email: userEmail, passwordhash: userPassword });
        if(query.insertedId) return true;
    },
    UserExists : async function (checkEmail)
    {
        const db = new MongoClient(DBURL, { useNewUrlParser: true, useUnifiedTopology: true });
        await db.connect();
        var dbo = db.db("CMPG323");
        var query = await dbo.collection("Users").findOne({email: checkEmail});
        if(query) return true;
        else return false;
    }
  };