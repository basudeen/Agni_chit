const bcrypt = require("bcrypt")
const saltRounds = 10
const config = require('../Database/config');
const sql = require("mssql/msnodesqlv8");
exports.encryptedPwdFunc=(req,res)=>{
    return new Promise(async function (resolve, reject) {
        bcrypt
        .hash(req.body.password, saltRounds)
        .then(hash => {
            resolve(hash)
        })
        .catch((err)=>{
            console.log(err)
            reject(err.Error)
        });
    });
}
exports.decryptedPwdFunc=(req)=>{
    return new Promise(async function (resolve, reject) {
        sql.connect(config, function (err) {
            if (err) {
              console.log(err, "error")
            }
            var request = new sql.Request();
            //let qry=`select USERID,USERNAME,ADMIN,convert(varchar(100),DECRYPTBYPASSPHRASE ('AGNI',password))as pass,CHECKING from UserMaster `;
            //SELECT *,convert(varchar(100),DECRYPTBYPASSPHRASE ('AGNI',Mpin)) FROM SLMASTER
            let qry=`select *,convert(varchar(100),DECRYPTBYPASSPHRASE ('AGNI',Mpin))as pass from SLMASTER where Phone_no='${req.mobile}' `;
            request.query(qry, (err, result) => {
                if (err) {
                    reject(err);
                }
                else {
                   result.recordset.map((r,index)=>{
                        if(req.mpin==r.pass){
                            resolve([r])
                        }
                        result.recordset.length -1 == index&&resolve([])
                    })
                } 
            })
          })
    });
}

exports.decryptedPwdFuncbyOldPwd=(password,hashValue)=>{
    return new Promise(async function (resolve, reject) {
        bcrypt
        .compare(password, hashValue)
        .then(hash => {
            resolve(hash)
        })
        .catch((err)=>{
            console.log(err)
            reject(err.Error)
        });
    });
}

