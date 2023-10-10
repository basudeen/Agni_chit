const sql = require("mssql/msnodesqlv8");
require('dotenv').config();

const config = {
    server: process.env.SERVER,
    database: process.env.DATABASE,
    user: process.env.USER, 
    password: process.env.PASSWORD,
    driver: process.env.DRIVER,
    options: {
        trustedConnection: false
    }
}
const config_main = {
    server: process.env.SERVER_MAIN,
    database: process.env.DATABASE_MAIN,
    user: process.env.USER_MAIN, 
    password: process.env.PASSWORD_MAIN,
    driver: process.env.DRIVER_MAIN,
    options: {
        trustedConnection: false
    }
}
sql.connect(config_main, function(err) {
    if(err) {
        console.log("err", err) 
    }
    else{
        console.log("connected")
    }
})
module.exports=config;