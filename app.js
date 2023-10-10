const express= require('express');
const connection=require('./Database/config');
const cors=require("cors");
var bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const app=express();
const port=process.env.PORT
app.listen(port,()=>{
    console.log(`app is listening on port ${port} `);
});
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());
app.use(fileUpload());
app.use('/images', express.static('images'));
app.use('/images', express.static('profile'));
app.use(bodyParser.urlencoded({ extended: true }));



app.use(require('./Routes/router'));