const fs = require('fs').promises
const TextClassifier = require('text-classifier');
const csv = require('async-csv');
var XLSX = require('node-xlsx');

let classifier = new TextClassifier;
var trained = false;

async function trainer ()
{
    var model = []
    Object.assign(model, await readTrainingData("training_data.csv"));
    model.map(type => {classifier.learn(type.data, type.name);})  
    return true;
    //getColumns("./TestDataReal.csv").then(x => {console.log(x)})
}

function getMaxOccurrence(arr) {
    var o = {}, maxCount = 0, maxValue, m;
    for (var i=0, iLen=arr.length; i<iLen; i++) {
        m = arr[i];

        if (!o.hasOwnProperty(m)) {
            o[m] = 0;
        }
        ++o[m];

        if (o[m] > maxCount) {
            maxCount = o[m];
            maxValue = m;
        }
    }
    return maxValue;
}

function test (){
    //Testing the model
    console.table(model)
    console.log("Testing: SA ID",classifier.classify('9902025067022'))
    console.log("Testing: Firstname",classifier.classify('John'))
    console.log("Testing: Surname",classifier.classify('Smith'))
    console.log("Testing: Phone Number",classifier.classify('0832921130'))
    console.log("Testing: Address",classifier.classify('4 Shepard Road, Sandton, Johannesburg'))
    console.log("Testing: Race",classifier.classify('White'))
    console.log("Testing: Company",classifier.classify('NedBank'))
    console.log("Testing: Row ID",classifier.classify('12'))
    console.log("Testing: Personal Message",classifier.classify('Did you remember to defrost the bacon?'))
    console.log("Testing: Email Address",classifier.classify('john222332@gmail.com'))
}

async function readTrainingData(path)
{
    const csvString = await fs.readFile(path, 'utf-8');
    const rows = await csv.parse(csvString);
    var columnno = rows[0];
    var data = []
    columnno.map(name => {data.push({"name": name, "data" : []})})
    rows.shift();
    //For each line in CSV
    for(var i = 0; i < rows.length; i++)
    {
        rows[i].map((value, index) => {data[index].data.push(value)})
    }
    return data;
}

async function getColumns(path)
{
    console.log("Started classifying")
    
    //If it has not yet been trained, do so 
    if(!trained)
    {
        console.log("started training")
        trained = await trainer();
        console.log("started finished training")
    }

    //Decide what the file type is and use appropriate method to read the file
    var fileType = path.split('.').pop()
    if(fileType == "xlsx")
        var file = await readXLSXFile(path);
    else if(fileType == "csv" || fileType == "txt")
        var file = await readCSVFile(path);
    else 
        return false;

    //The file is converted into an array with each column being it's own array [[column1], [column2] etc..]
    var columns = [];
    var y = await Promise.all(file.map( async column => {
        //I go through each column, classifying each item, then adding the classification to a new array (typelist)
        var typeList = []
        var x = await Promise.all(column.map(async x => { 
            var type = await classifier.classify(x);
            typeList.push(type.textClass)
        }));
        //I find the most common cassification in the array for each column and use that as the final header 
        columns.push(getMaxOccurrence(typeList))
    }));
    console.log("Finished classifying")
    return columns;
}

async function readCSVFile(path)
{
    const csvString = await fs.readFile(path, 'utf-8');
    const rows = await csv.parse(csvString);
    var columnno = rows[0];
    var data = []
    columnno.map(name => {data.push([])})
    //For each line in CSV
    for(var i = 0; i < rows.length; i++)
    {
        rows[i].map((value, index) => {data[index].push(value)})
    }
    return data;
}

async function readXLSXFile(path)
{
    var obj = XLSX.parse(path);
    var rows = [];
    var writeStr = "";
    var sheet = obj[0];
    // Looping through data in the sheet
    for(var j = 0; j < sheet['data'].length; j++)
    {
            rows.push(sheet['data'][j]);
    }
    // Write the data to one string
    for(var i = 0; i < rows.length; i++)
    {
        writeStr += rows[i].join(",") + "\n";
    }
    var columnno = rows[0];
    var data = []
    columnno.map(name => {data.push([])})
    //For each line in CSV
    for(var i = 0; i < rows.length; i++)
    {
        rows[i].map((value, index) => {data[index].push(value)})
    }
    return data;
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
    
Classify: async function (fileDir, userID, fileName)
{
        
    var headers = await getColumns(fileDir)
    DeleteFile(fileDir)
    return {"userID": userID, "columns" : headers, "filename": fileName};
}

}