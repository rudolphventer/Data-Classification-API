const fs = require('fs')

module.exports = {

    Classify: async function (fileDir, userID)
    {
        var dummyObj = { 
            "userID" : userID,
            "columns" :{
            "column1" : "firstname",
            "column2" : "lastname",
            "column3" : "homeaddress",
            "column4" : "idnumber",
            "column5" : "email",
        }}
        this.DeleteFile(fileDir)
        return dummyObj;
    },

    DeleteFile: async function (path)
    {

        fs.unlink(path, (err) => {
        if (err) {
            console.error(err)
            return
        }

        })

    }

}