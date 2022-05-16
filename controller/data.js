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
    let id_user = req.token.id_user;
    let data = await model.getSaldoUser(id_user);
    res.json({status:true,message:"berhasil",data});
});

module.exports = router;