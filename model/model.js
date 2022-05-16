const mysql = require("mysql");
const dbConfig = require("../config/database");
let db = mysql.createConnection(dbConfig);

exports.getTrxke = async function(id_user){
    var data = await getRowQuery(`SELECT IFNULL(MAX(trxke),0)+1 AS trxke FROM transaksi WHERE id_user = '${id_user}'`);
    return data.trxke;
}

exports.getDataPulsaByKode = async function(kode){
    var data = await getRowQuery(`SELECT * FROM m_harga WHERE Singkatan = '${kode}'`);
    return data;
}

exports.getSaldoUser = async function (id_user){
    var q = `
        SELECT (a.masuk - b.keluar) AS saldo FROM (
            SELECT IFNULL(SUM(jumlah),0) AS masuk FROM saldo_masuk WHERE id_user = '${id_user}'
        )a LEFT JOIN (
            SELECT IFNULL(SUM(jumlah),0) AS keluar FROM saldo_keluar WHERE id_user = '${id_user}'
        )b ON 1 = 1
    `;
    var data = await getRowQuery(q);
    return data;
}

exports.getRowQuery = async function (query) {
    return await getRowQuery(query);
}

async function getRowQuery(query) {
    return await new Promise(function (resolve) {
        db.query(query, function (err, rows) {
            if (err) {
                console.log(err);
                console.log(query);
                console.log("======================== GET ROW");
                resolve(false);
            } else {
                if (rows.length > 0){
                    resolve(rows[0]);
                } else {
                    resolve(false);
                }
            }
        });
    });
}

 async function getRowsQuery(query) {
    return await new Promise(function (resolve) {
        db.query(query, function (err, rows) {
            if (err) {
                console.log(err);
                console.log(query);
                console.log("======================== GET ROWS");
                resolve(false);
            } else {
                resolve(rows);
            }
        });
    });
}

exports.getRowsQuery = async function (query) {
    return await getRowsQuery(query);
}

exports.runQuery = async function (query) {
    return await new Promise(function (resolve) {
        db.query(query, function (err) {
            if (err){
                console.log(err);
                console.log(query);
                console.log("======================== RUN QUERY");
                resolve(false);
            } else {
                resolve(true);
            }
        });
    })
}

exports.checkPrefixNumber = async function(number) {
    try {
        let data = await getRowsQuery(`
            SELECT * FROM tbl_operator_new WHERE kode_prefix = LEFT('${number}',len_char) ORDER BY len_char DESC
        `);

        return data[0];
    } catch (error) {
        console.log(error);
        return false;
    }
}

exports.simpan_data_tabel = async function (table, data, id, action, key_where) {
    const fields = Object.keys(data);
    const values = Object.values(data);
    let query = '';
    if (action === "ADD") {
        let qValue = '';
        for (var i = 0; i < values.length; i++) {
            qValue += '?';
            if (values.length > (i + 1)) {
                qValue += ',';
            }
        }
        query = `INSERT INTO ${table} (${fields.toString()}) VALUES (${qValue})`;
    } else {
        let key = '';
        for (var i = 0; i < fields.length; i++) {
            key += `${fields[i]} = ?`;
            if (fields.length > (i + 1)) {
                key += ',';
            }
        }
        query = `UPDATE ${table} SET ${key} WHERE ${key_where} = '${id}'`;
    }


    return await new Promise(function (resolve) {
        db.query(query, values, function (err, rows) {
            if (err) {
                console.log(err.message);
                console.log(query);
                console.log("========================");
                resolve({ status: "error", message: err.message });
            } else {
                resolve({ status: "success", id: rows.insertId });
            }
        });
    });
}