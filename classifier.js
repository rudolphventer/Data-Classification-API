const fs = require('fs').promises
const csv = require('async-csv');
var XLSX = require('node-xlsx');

async function readCSV(path)
{
    const csvString = await fs.readFile(path, 'utf-8');
    const rows = await csv.parse(csvString);
    return rows;
}

async function parseXLSX(path)
{
    var obj = XLSX.parse(path);
    var rows = [];
    var writeStr = "";
    var sheet = obj[0];
    // Looping throught data in the sheet
    for(var j = 0; j < sheet['data'].length; j++)
    {
            rows.push(sheet['data'][j]);
    }
    // Write the data to one string
    for(var i = 0; i < rows.length; i++)
    {
        writeStr += rows[i].join(",") + "\n";
    }
    return await csv.parse(writeStr)
}

async function DeleteFile(path)
{
    fs.unlink(path, (err) => {
        if (err) {
            console.error(err)
            return
        }
    })
}

module.exports = {

    Classify: async function (fileDir, userID)
    {
        var fileType = fileDir.split('.').pop()
        if(fileType == "xlsx")
            var rows = await parseXLSX(fileDir);
        else if(fileType == "csv" || fileType == "txt")
            var rows = await readCSV(fileDir);
        else 
            return false;
        var headers = rows[0];
        DeleteFile(fileDir)
        return {"userID": userID, "columns" : headers};
    }

}