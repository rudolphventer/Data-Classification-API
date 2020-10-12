const fs = require('fs').promises
const TextClassifier = require('text-classifier');
const csv = require('async-csv');
const { Classifier } = require('ml-classify-text')
var XLSX = require('node-xlsx');

let classifier = new TextClassifier;
const mlclassifier = new Classifier()
var trained = false;

trainer()

async function trainer ()
{
    var model = []
    Object.assign(model, await readTrainingData("training_data.csv"));
    //model.map(type => {classifier.learn(type.data, type.name);})  
    model.map(type => {mlclassifier.train(type.data, type.name);}) 
    test() 
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
    //console.table(model)
    console.log("Testing: SA ID",mlclassifier.predict('9902025067022', 1, 0)[0].label)
    console.log("Testing: Firstname",mlclassifier.predict('John', 1, 0))
    console.log("Testing: Surname",mlclassifier.predict('Smith', 1, 0))
    console.log("Testing: Phone Number",mlclassifier.predict('0832921130', 1, 0))
    console.log("Testing: Address",mlclassifier.predict('4 Shepard Road, Sandton, Johannesburg', 1, 0))
    console.log("Testing: Race",mlclassifier.predict('White', 1, 0))
    console.log("Testing: Company",mlclassifier.predict('NedBank', 1, 0))
    console.log("Testing: Row ID",mlclassifier.predict('12', 1, 0))
    console.log("Testing: Personal Message",mlclassifier.predict('Did you remember to defrost the bacon?', 1, 0))
    console.log("Testing: Email Address",mlclassifier.predict('john222332@gmail.com', 1, 0))
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
            var type = await mlclassifier.predict(x);
            typeList.push(type[0].label)
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