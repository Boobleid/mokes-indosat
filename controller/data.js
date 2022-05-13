const express = require("express");
const router = express.Router();
const helper = require("../library/helper");
const model = require("../model/model");
const appConfig = require("../config/app");


router.get("/banner",helper.cekToken(),async function(req,res){
    let data = await model.getRowsQuery(`SELECT id,jenis,banner FROM banner`);
    res.json({status:true,message:"berhasil",data});
});

router.get("/saldo",helper.cekToken(),async function(req,res){
    let id_user = 'anonim';
    let data = await model.getRowQuery(`
        SELECT a.masuk - b.keluar AS saldo FROM (
            SELECT SUM(jumlah) AS masuk FROM saldo_masuk WHERE id_user = '${id_user}'
        )a LEFT JOIN (
            SELECT SUM(jumlah) AS keluar FROM saldo_keluar WHERE id_user = '${id_user}'
        )b ON 1 = 1
    `);
    res.json({status:true,message:"berhasil",data});
});

module.exports = router;