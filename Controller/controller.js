const config = require('../Database/config');
const sql = require("mssql/msnodesqlv8");
const moment = require("moment");
let now = moment().utc();
const fs = require("fs");
const jwt = require("jsonwebtoken");
var commonModel = require("../Models/CommenModel");
var mail = require('../Mail/nodemailer')
// const auth = require('./auth')
const decrypt = require('../Crypt/bcrypt')
require('dotenv').config();
let nodemailer = require('nodemailer');
const { Console, log } = require('console');
//const { use } = require('../Router/router');



module.exports = {
    Signup: async (req, res) => {
        try {
            console.log(req.body, "-------------------->signup")
            if (req.body.customer_name != undefined && req.body.mobile != undefined && req.body.email != undefined && req.body.mpin != undefined) {
                sql.connect(config, function (err) {
                    if (err) {
                        console.log(err, "error")
                    }
                    var request = new sql.Request();
                    let qry = `SELECT MAX(Id) as max FROM SLMASTER;`
                    request.query(qry, async function (err, users) {
                        if (err) {
                            res.status(500).json({
                                status: 500,
                                message: 'Something went wrong.',
                                data: records,
                            });
                        }
                        else {
                            var auto_increment_id = users.recordset.length ? users.recordset[0].max + 1 : 1;
                            let query2 = `select * from SLMASTER where Phone_no='${req.body.mobile}'`;
                            let mobileno_verify = await commonModel.QueryListData(query2, [], res);
                            if (mobileno_verify.recordset.length && mobileno_verify.recordset[0] != null) {
                                res.status(400).json({
                                    status: 400,
                                    message: 'Mobile Number Already Exists..!',
                                    data: [],
                                });
                            }
                            else {
                                let query3 = `select * from SLMASTER where Email='${req.body.email}'`;
                                let mail_verify = await commonModel.QueryListData(query3, [], res);
                                if (mail_verify.recordset.length && mail_verify.recordset[0] != null) {
                                    res.status(400).json({
                                        status: 400,
                                        message: 'Email Already Exists..!',
                                        data: [],
                                    });
                                }
                                else {
                                    var request = new sql.Request();
                                    let query4 = `insert into SLMASTER(Id,Customer_name,Phone_no,Email,Mpin) values(${auto_increment_id},'${req.body.customer_name}','${req.body.mobile}','${req.body.email}',ENCRYPTBYPASSPHRASE('AGNI','${req.body.mpin}'))`
                                    request.query(query4, function (err, records) {
                                        if (err) {
                                            res.status(500).json({
                                                status: 500,
                                                message: 'Something went wrong.',
                                                data: err,
                                            });
                                        }
                                        else if (records) {
                                            res.status(200).json({
                                                status: 200,
                                                message: 'User Details Inserted Successfully.',
                                                data: records.rowsAffected,
                                            });
                                        }
                                        else {
                                            res.status(400).json({
                                                status: 400,
                                                message: 'User Details Not Inserted Successfully.',
                                                data: [],
                                            });
                                        }
                                    })
                                }
                            }

                        }
                    })
                })
            }
            else {
                res.status(500).json({
                    status: 500,
                    message: 'Undefind data',
                    data: [],
                });
            }
        }
        catch (e) {
            console.error(e.message);
            res.status(500).json({
                status: 500,
                message: 'Something went wrong.',
                data: [],
            });
        }
    },
    Login: async (req, res) => {
        console.log("------------->login")
        let d_d_query = `select * from SLMASTER where Phone_no='${req.body.mobile}'`;
        let d_d_result = await commonModel.QueryListData(d_d_query, res);
        if (d_d_result && d_d_result.recordset[0] != null) {
            const decryptedPassword = decrypt.decryptedPwdFunc(req.body);
            decryptedPassword.then((password) => {
                if (password) {
                    //const token = jwt.sign({ id: password[0].Sno, role: password[0].Admin == "Y" ? 'Admin' : 'Consumer' }, auth.secret/*,{ expiresIn: '1h' }*/);
                    res.status(200)
                        .send({
                            status: 200,
                            message: 'Logged In Successfully..!',
                            data: [{
                                // "token": token,
                                "user_id": password[0].Id,
                                //"role_name": password[0].ADMIN === "Y" ? 'Admin' : 'Client',
                                "fullname": password[0].Customer_name,
                                "Mail": password[0].Email
                            }],
                        });
                } else {
                    res.status(400)
                        .send({
                            status: 400,
                            message: 'MPIN Incorrect!',
                            data: []
                        });
                }
            }).catch((err) => {
                res.status(400)
                    .send({
                        status: 400,
                        message: 'MPIN Incorrect!',
                        data: []
                    });
            });
        } else {
            res.status(400)
                .send({
                    status: 400,
                    message: 'Mobile Number InCorrect!',
                    data: []
                })
        }
    },
    Mail: async (req, res) => {
        try {
            const transporter = nodemailer.createTransport({
                host: process.env.MAIL_HOST,
                port: process.env.MAIL_PORT,
                secure: false,
                auth: {
                    user: process.env.MAIL_USER,
                    pass: process.env.MAIL_PASS,
                },
                tls: {
                    rejectUnauthorized: false, // Ignore certificate validation
                },
            });
            let mailOptions = {
                from: process.env.MAIL_USER, // sender address
                to: 'basudeenvfc@gmail.com', // list of receivers
                subject: "OTP verification",
                html: '<html><body><p>OTP is 4783</h1> for registering on AGNI Software Solution. Do not share this OTP with anyone for security reasons.</p></body></html>', // html body
            };
            transporter.sendMail(mailOptions, function (err, result) {
                if (err) {
                    res.status(500).json({
                        success: 500,
                        message: 'Something went wrong.',
                        data: err,
                    });
                    console.log(err)
                }
                else if (result) {
                    res.status(200).json({
                        success: 200,
                        message: 'Mail Sented Successfully',
                        data: [],
                    });
                }
            });

        } catch (err) {
            res.status(500).json({
                success: 500,
                message: 'Something went wrong.',
                data: err,
            });
        }


    },
    Signupverification: async (req, res) => {
        try {
            console.log(req.body.mail, req.body.mobile, "------------>sent otp")
            let query1 = `exec [OTPGENT] '${req.body.mail}',${req.body.mobile}`; // its create random otp number for user_mail,user_mobile number and inserted in temporary table 
            var InsetQuery = await commonModel.QueryListData(query1, [], res);
            if (InsetQuery.rowsAffected && InsetQuery.rowsAffected != null) {
                let query2 = `select * from OTP_GENT where EMAIL='${req.body.mail}' AND PHONE='${req.body.mobile}'`;
                var SelectQuery = await commonModel.QueryListData(query2, [], res);
                if (SelectQuery.recordset.length && SelectQuery.recordset[0] != null) {
                    let verified = await mail.send(req.body.mail, SelectQuery.recordset[0].OTP, 'registering');
                    if (verified) {
                        res.status(200).json({
                            status: 200,
                            message: "Mail Sented Successfully..!",
                            data: [SelectQuery.recordset[0].OTP],
                        });
                    }
                    else {
                        res.status(400).json({
                            status: 400,
                            message: "Mail Not Sented Successfully..!",
                            data: [],
                        });
                    }
                }
            }
            else {
                res.status(400).json({
                    status: 400,
                    message: "Mail Not Sented Successfully..!",
                    data: [],
                });
            }
        } catch (err) {
            res.status(500).json({
                status: 500,
                message: 'Something went wrong.',
                data: err,
            });
        }
    },
    Otp_verification: async (req, res) => {
        try {
            let mobile = req.body.mobile ? req.body.mobile : 0
            let query2 = `select * from OTP_GENT where EMAIL='${req.body.mail}' AND PHONE='${mobile}' AND OTP='${req.body.otp}'`;
            var SelectQuery = await commonModel.QueryListData(query2, [], res);
            if (SelectQuery.recordset.length > 0) {
                res.status(200).json({
                    status: 200,
                    message: "OTP Verified Successfully..!",
                    data: [],
                });
            }
            else {
                res.status(400).json({
                    status: 400,
                    message: 'OTP Not Valid',
                    data: [],
                });
            }
        } catch (err) {
            res.status(500).json({
                status: 500,
                message: 'Something went wrong.',
                data: err,
            });
        }
    },
    Details: async (req, res) => {
        try {
            sql.connect(config, function (err) {
                if (err) {
                    console.log(err, "error")
                }
                var request = new sql.Request();
                request.query("select * from SLMASTER", function (err, records) {
                    if (err) {
                        res.status(500).json({
                            success: 500,
                            message: 'Something went wrong.',
                            data: records,
                        });
                    }
                    else if (records.recordset[0] != null) {
                        res.status(200).json({
                            success: 200,
                            message: 'User Data Found Successfully.',
                            data: records.recordset,
                        });
                    }
                    else {
                        res.status(400).json({
                            success: 400,
                            message: 'User Data Not Found Successfully.',
                            data: records,
                        });
                    }
                })
            })
        }
        catch (e) {
            console.error(e.message);
            res.status(500).json({
                success: 500,
                message: 'Something went wrong.',
                data: [],
            });
        }
    },
    SchemeMasterInsert: async (req, res) => {
        try {
            let schemetype = null; let amounttype = null; let weighttype = null; let active;
            req.body.active == '1' ? active = 'Y' : active = 'N';
            sql.connect(config, async function (err) {
                if (err) {
                    console.log(err, "error")
                }
                let code_verified = `SELECT SCHEME_ID FROM SCHEMEMAST where GRPCODE='${req.body.grpcode}'`;
                let group_code = await commonModel.QueryListData(code_verified, [], res);
                if (group_code.recordset.length == 0) {
                    let schemename_verified = `SELECT SCHEME_ID FROM SCHEMEMAST where SCHEMENAME='${req.body.schemename}'`;
                    let sname = await commonModel.QueryListData(schemename_verified, [], res);
                    if (sname.recordset.length == 0) {
                        let query = `SELECT MAX(SCHEME_ID) as max FROM SCHEMEMAST;`;
                        let users = await commonModel.QueryListData(query, [], res);
                        var auto_increment_id = users.recordset.length ? users.recordset[0].max + 1 : 1;
                        if (req.body.scheme_type == 1) {// 1-- Amount , 2--Weight
                            schemetype = 'Amount'
                            req.body.amount == 1 ? amounttype = 'Fixed' : amounttype = 'Auto'; // Amount type( 1--Fixed , 2--Auto)
                        }
                        else {
                            schemetype = 'Weight'
                            req.body.weight == 1 ? weighttype = 'Gold' : weighttype = 'Silver';// Weight type( 1--Gold , 2--Silver)
                        }
                        let qry2 = `SET IDENTITY_INSERT SCHEMEMAST ON;
                    insert into SCHEMEMAST(SCHEME_ID,SCHEMENAME,NOINS,GRPCODE,REGNO,SCHEMETYPE,AMOUNTTYPE,WEIGHTTYPE,ACTIVE,BONUS,OTHERAMT) values(${auto_increment_id},'${req.body.schemename}',${req.body.noins},'${req.body.grpcode}',NULL,'${schemetype}','${amounttype}','${weighttype}','${active}','${req.body.bonus}','${req.body.otheramt}')`
                        let insert = await commonModel.QueryListData(qry2, [], res);
                        if (insert.rowsAffected) {
                            res.status(200).json({
                                success: 200,
                                message: 'User Data Inserted Successfully.',
                                data: [],
                            });
                        }
                        else {
                            res.status(400).json({
                                success: 400,
                                message: 'User Data Not Inserted Successfully.',
                                data: [],
                            });
                        }
                    }
                    else {
                        res.status(400).json({
                            success: 400,
                            message: 'Scheme Name Already Exist ..!',
                            data: [],
                        });
                    }
                }
                else {
                    res.status(400).json({
                        success: 400,
                        message: 'Group Code Already Exist ..!',
                        data: [],
                    });
                }
            })
        }
        catch (e) {
            console.error(e.message);
            res.status(500).json({
                success: 500,
                message: 'Something went wrong.',
                data: [],
            });
        }
    },
    SchemeMasterUpdate: async (req, res) => {
        try {
            let schemetype = null; let amounttype = null; let weighttype = null; let active;
            req.body.active == '1' ? active = 'Y' : active = 'N';
            sql.connect(config, async function (err) {
                if (err) {
                    console.log(err, "error")
                }
                let query = `select GRPCODE from SCHEMEMAST WHERE SCHEME_ID<>'${req.body.scheme_id}' AND GRPCODE='${req.body.grpcode}'`;
                let users = await commonModel.QueryListData(query, [], res);
                if (users.recordset.length == 0) {
                    let query2 = `select  SCHEMENAME from SCHEMEMAST WHERE SCHEME_ID<>'${req.body.scheme_id}' AND SCHEMENAME='${req.body.schemename}'`;
                    let users2 = await commonModel.QueryListData(query2, [], res);
                    if (users2.recordset.length == 0) {
                        if (req.body.scheme_type == 1) {// 1-- Amount , 2--Weight
                            schemetype = 'Amount'
                            req.body.amount == 1 ? amounttype = 'Fixed' : amounttype = 'Auto'; // Amount type( 1--Fixed , 2--Auto)
                        }
                        else {
                            schemetype = 'Weight'
                            req.body.weight == 1 ? weighttype = 'Gold' : weighttype = 'Silver';// Weight type( 1--Gold , 2--Silver)
                        }
                        let qry2 = `update  SCHEMEMAST set SCHEMENAME='${req.body.schemename}',NOINS=${req.body.noins},GRPCODE='${req.body.grpcode}',REGNO=NULL,SCHEMETYPE='${schemetype}',AMOUNTTYPE='${amounttype}',WEIGHTTYPE='${weighttype}',ACTIVE='${active}',BONUS='${req.body.bonus}',OTHERAMT='${req.body.otheramt}' where SCHEME_ID=${req.body.scheme_id}`
                        let update = await commonModel.QueryListData(qry2, [], res);
                        if (update.rowsAffected) {
                            res.status(200).json({
                                success: 200,
                                message: 'User Data Updated Successfully.',
                                data: [],
                            });
                        }
                        else {
                            res.status(400).json({
                                success: 400,
                                message: 'User Data Not Updated Successfully.',
                                data: [],
                            });
                        }
                    }
                    else {
                        res.status(400).json({
                            success: 400,
                            message: 'Scheme Name Already Exists .',
                            data: [],
                        });
                    }
                }
                else {
                    res.status(400).json({
                        status: 400,
                        message: 'Group Code Already Exists .',
                        data: [],
                    });
                }
            })
        }
        catch (e) {
            console.error(e.message);
            res.status(500).json({
                success: 500,
                message: 'Something went wrong.',
                data: [],
            });
        }
    },
    SchemeMasterDetails: async (req, res) => {
        try {
            sql.connect(config, async function (err) {
                if (err) {
                    console.log(err, "error")
                }
                let query = `SELECT *,CONVERT(VARCHAR(255), NOINS) AS Converted_NOINS FROM SCHEMEMAST;`;//SCHEME_ID,SCHEMENAME,NOINS,GRPCODE,REGNO,SCHEMETYPE,ACTIVE,BONUS,OTHERAMT
                let users = await commonModel.QueryListData(query, [], res);
                if (users.recordset.length && users.recordset[0] != null) {
                    res.status(200).json({
                        success: 200,
                        message: 'User Data Fetched Successfully..!',
                        data: users.recordset,
                    });
                }
                else {
                    res.status(400).json({
                        success: 400,
                        message: 'User Data Not Fetched Successfully..!',
                        data: [],
                    });
                }
            })
        }
        catch (e) {
            console.error(e.message);
            res.status(500).json({
                success: 500,
                message: 'Something went wrong.',
                data: [],
            });
        }
    },
    SchemeAmountMasterInsert: async (req, res) => {
        try {
            sql.connect(config, async function (err) {
                if (err) {
                    console.log(err, "error")
                }
                let active;
                req.body.active == '1' ? active = 'Y' : active = 'N';
                // let code_verified = `SELECT * FROM SCHEMEMAST where GRPCODE='${req.body.grpcode}' and SCHEME_ID=${req.body.scheme_id}`;
                // let group_code = await commonModel.QueryListData(code_verified, [], res);
                // if (group_code.recordset.length == 0) {
                let query = `SELECT MAX(AMTID) as max FROM SCHEMEAMTMAST;`;
                let users = await commonModel.QueryListData(query, [], res);
                var auto_increment_id = users.recordset.length ? users.recordset[0].max + 1 : 1;
                let amt_insert = `SET IDENTITY_INSERT SCHEMEAMTMAST ON;
                    INSERT INTO SCHEMEAMTMAST (AMTID, SCHEMEID, GRPCODE, AMOUNT, ACTIVE)
                    SELECT ${auto_increment_id}, master.SCHEME_ID, '${req.body.groupcode}', ${req.body.amount}, '${active}'
                    FROM SCHEMEMAST as master WHERE master.SCHEMENAME ='${req.body.schemename}'`
                let insert = await commonModel.QueryListData(amt_insert, [], res);
                if (insert.rowsAffected) {
                    res.status(200).json({
                        success: 200,
                        message: 'Scheme Amount Data Inserted Successfully.',
                        data: [],
                    });
                }
                else {
                    res.status(400).json({
                        success: 400,
                        message: 'Scheme Amount Data Not Inserted Successfully.',
                        data: [],
                    });
                }
                // }
                // else {
                //     res.status(400).json({
                //         success: 400,
                //         message: 'Group Code Already Exist ..!',
                //         data: [],
                //     });
                // }
            })
        }
        catch (e) {
            console.error(e.message);
            res.status(500).json({
                success: 500,
                message: 'Something went wrong.',
                data: [],
            });
        }
    },
    SchemeAmountMasterUpdate: async (req, res) => {
        try {
            let active;
            req.body.active == '1' ? active = 'Y' : active = 'N';
            sql.connect(config, async function (err) {
                if (err) {
                    console.log(err, "error")
                }
                let query = `SELECT AMTID FROM SCHEMEAMTMAST where AMTID=${req.body.amt_id}`;
                let users = await commonModel.QueryListData(query, [], res);
                if (users.recordset.length > 0) {
                    let query2 = `select  SCHEMENAME from SCHEMEMAST WHERE GRPCODE='${req.body.groupcode}' AND SCHEMENAME='${req.body.schemename}'`;
                    let users2 = await commonModel.QueryListData(query2, [], res);
                    if (users2.recordset.length > 0) {
                        let amt_update = `update SCHEMEAMTMAST set SCHEMEID=(SELECT master.SCHEME_ID FROM SCHEMEMAST as master WHERE master.SCHEMENAME ='${req.body.schemename}'),GRPCODE='${req.body.groupcode}',AMOUNT=${req.body.amount},ACTIVE='${active}' where AMTID=${req.body.amt_id}`;
                        let update = await commonModel.QueryListData(amt_update, [], res);
                        if (update.rowsAffected) {
                            res.status(200).json({
                                success: 200,
                                message: 'Scheme Data Updated Successfully.',
                                data: [],
                            });
                        }
                        else {
                            res.status(400).json({
                                success: 400,
                                message: 'Scheme Data Not Updated Successfully.',
                                data: [],
                            });
                        }
                    }
                    else {
                        res.status(400).json({
                            success: 400,
                            message: 'Scheme Name And Group Code Is Not Match.',
                            data: [],
                        });
                    }
                }
                else {
                    res.status(400).json({
                        status: 400,
                        message: 'Invaild Amount Id..',
                        data: [],
                    });
                }
            })
        }
        catch (e) {
            console.error(e.message);
            res.status(500).json({
                success: 500,
                message: 'Something went wrong.',
                data: [],
            });
        }
    },
    SchemeAmountMasterDetails: async (req, res) => {
        try {
            sql.connect(config, async function (err) {
                if (err) {
                    console.log(err, "error")
                }
                let query = `select amt.AMTID,amt.SCHEMEID,mas.SCHEMENAME,amt.GRPCODE,amt.REGNO,CONVERT(VARCHAR(255),amt.AMOUNT)as AMOUNT,amt.ACTIVE from SCHEMEAMTMAST as amt inner join SCHEMEMAST as mas on mas.SCHEME_ID=amt.SCHEMEID`;
                let users = await commonModel.QueryListData(query, [], res);
                if (users.recordset.length && users.recordset[0] != null) {
                    res.status(200).json({
                        success: 200,
                        message: 'User Data Fetched Successfully..!',
                        data: users.recordset,
                    });
                }
                else {
                    res.status(400).json({
                        success: 400,
                        message: 'User Data Not Fetched Successfully..!',
                        data: [],
                    });
                }
            })
        }
        catch (e) {
            console.error(e.message);
            res.status(500).json({
                success: 500,
                message: 'Something went wrong.',
                data: [],
            });
        }
    },
    ForgotPassword: async (req, res) => {
        try {
            console.log(req.body.mail, req.body.mobile, "------------>forget otp");
            let mail_verify = `select Id from SLMASTER where EMAIL='${req.body.mail}'`;  
            let verification = await commonModel.QueryListData(mail_verify, [], res);
            if (verification.recordset.length > 0) {
                let query1 = `exec [OTPGENT] '${req.body.mail}',${req.body.mobile} `; // its create random otp number for user_mail,user_mobile number and inserted in temporary table 
                var InsetQuery = await commonModel.QueryListData(query1, [], res);
                if (InsetQuery.rowsAffected && InsetQuery.rowsAffected != null) {
                    let query2 = `select * from OTP_GENT where EMAIL='${req.body.mail}' AND PHONE='${req.body.mobile}' `;
                    var SelectQuery = await commonModel.QueryListData(query2, [], res);
                    if (SelectQuery.recordset.length && SelectQuery.recordset[0] != null) {
                        let verified = await mail.send(req.body.mail, SelectQuery.recordset[0].OTP, 'forgot password');
                        if (verified) {
                            res.status(200).json({
                                status: 200,
                                message: "Mail Sent Successfully ",
                                data: [SelectQuery.recordset[0].OTP],
                            });
                        }
                        else {
                            res.status(400).json({
                                status: 400,
                                message: "Mail Not Sent Successfully..!",
                                data: [],
                            });
                        }
                    }
                }
                else {
                    res.status(400).json({
                        status: 400,
                        message: "Mail Not Sented Successfully..!",
                        data: [],
                    });
                }
            }
            else {
                res.status(400).json({
                    status: 400,
                    message: "Mail Id Not Registered ..!",
                    data: [],
                });
            }

        } catch (err) {
            res.status(500).json({
                status: 500,
                message: 'Something went wrong.',
                data: err,
            });
        }
    },
    ChangePassword: async (req, res) => {
        try {
            let query2 = `update SLMASTER set Mpin=ENCRYPTBYPASSPHRASE('AGNI','${req.body.mpin}') where Email='${req.body.mail}' and Phone_no='${req.body.mobile}' `;
            var SelectQuery = await commonModel.QueryListData(query2, [], res);
            if (SelectQuery.rowsAffected) {
                res.status(400).json({
                    status: 400,
                    message: 'Mpin Changed Successfully..',
                    data: [],
                });
            }
            else {
                res.status(400).json({
                    status: 400,
                    message: 'Mpin Not Changed Successfully..',
                    data: err,
                });
            }
        } catch (err) {
            res.status(500).json({
                status: 500,
                message: 'Something went wrong.',
                data: err,
            });
        }
    }

}