const config = require('../Database/config');
const sql = require("mssql/msnodesqlv8");



exports.QueryListData = async (qry, data, res) => {
    return new Promise(function (resolve, reject) {
        sql.connect(config, function (err) {
            if (err) {
              console.log(err, "error")
            }
            var request = new sql.Request();
            request.query(qry, (err, result, cache) => {
                console.log(qry,"----------->qry")
                if (err) {
                    reject(err);
                }
                if (result) {
                    resolve(result);
                } else resolve([]);
            })
          })
    });
};

