const express = require('express');
const bodyParser = require('body-parser');
const db = require('./config/db')
const MongoClient = require('mongodb').MongoClient;
var cors = require('cors');

const app = express();


const port = 8000;

app.use(bodyParser.json());
// use it before all route definitions
app.use(cors({origin: '*'}));



MongoClient.connect(db.url, {useNewUrlParser: true}, (err, database) =>{
    if(err) return console.log(err);
    require('./app/routes')(app, database);

    app.listen(port, ()=>{
        console.log("we are live on port:"+port);
    });
})
