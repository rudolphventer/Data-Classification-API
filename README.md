

  
  

# 🏛 Welcome to Classy's API! 🏛

  

My name is Rudolph Venter and Classy is my text classification API. Available at http://classy-frontend.s3-website.eu-central-1.amazonaws.com or [classy.rudolphventer.me](http://classy.rudolphventer.me)


## --🧱--The Stack--🧱--
I used Node+Express and MongoDB for the API with Github and Heroku for CI/CD

The API is hosted on a free Heroku dynamo for simplicity, this is why the site can take up to 30 seconds to load. 

  
### Libraries and packages

 * [Bcrypt](https://www.npmjs.com/package/bcrypt) for password hashing
 * [Async-CSV](https://www.npmjs.com/package/async-csv) for reading .csv and .txt files
 * [Node-XLSX](https://www.npmjs.com/package/node-xlsx) for converting .xlsx files into CSV format
 * [Express](https://www.npmjs.com/package/express) the server
 * [Multer](https://www.npmjs.com/package/multer) for parsing formdata objects
 * [JSONWebToken](https://www.npmjs.com/package/jsonwebtoken) for handling JWT based security
 * [Text-Classifier](https://www.npmjs.com/package/text-classifier)

## --⚙--How it Works--⚙--
My main file server.js handles requests, doing some validation and authentication before returning results. 

The datafunctions.js file contains all the database logic with no validation or authentication as this is the server.js's job. 

The classifier.js file has all of the logic for classifying files.

## --🌟--What's it do Though?--🌟--
Routes:
* /ping - Returns true, used to wake up the Heroku dynamo and confirm a working connection.
* /newuser - Validates the given email and password before creating a new user document in the DB.
* /login - Validates and verifies the user's credentials, then generates a JWT and returns it.
* /upload - Receives a formdata object containing the file as well as the JWT. The JWT is verified and the userID is extracted from it, then the file is saved to the disk and the path is passed to the classifier, the classifier does it's work then deletes the file and returns the headers object. The header's object is then stored in the DB. This route returns a headerfile object with the new headers.
* /getfile - Receives a JWT and a file ID, if the JWT is verified as belonging to the owner of the file, the headerfile object is returned as JSON.
* /getall - Receives a JWT if the JWT is verified, every headerfile object associated with that user is returned as JSON.
* /updatefile - Recives a JWT and a headerfile as JSON. If the JWT user is verified as the owner of the headerfile in the DB then the file is replaced with the new headerfile.

## --📃--The Classifier--📃--
I have a large training dataset (training_data.csv) that is used to train the [ML-Text-Classifier](https://www.npmjs.com/package/ml-classify-text) after reading the file. This training happens once every time the server is restarted and takes a few seconds. After this is done, the uploaded file is read into a two dimensional array, with each column being it's own array, the classifier then checks each column and averages the results for each item to generate a header for the column.

## --💻--Project setup--💻--


```

npm install

```
followed by
```

npm run start

```
or for development



```

nodemon server.js

```

