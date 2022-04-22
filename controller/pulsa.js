const express = require("express");
const router = express.Router();
const helper = require("../library/helper");
const model = require("../model/model");
const appConfig = require("../config/app");
var xor = require('base64-xor');
var request = require("request");
var JSCRYPTO = require("crypto-js");


router.post("/get_produk",async function(req,res){
    const operator = req.body.operator ? req.body.operator : "";
    const jenis = req.body.jenis ? req.body.jenis : "";
    if (operator && jenis){
        var data = await model.getRowsQuery(`SELECT Singkatan AS kode, NamaProduk AS nama,  Denon AS denom, HargaNasional AS harga
        FROM m_harga WHERE Jenis = "${jenis}" AND Kategori = '${operator}' ORDER BY HargaNasional ASC`)
        res.json({status:true,message:"Berhasil",data});
    } else {
        res.json({status:false,message:"operator atau jenis tidak diisi"});
    }
});



router.post("/get_operator",async function(req,res){
    const hp = req.body.hp ? req.body.hp : "";
    if (hp == ""){
        res.json({status:false,message:"Harap memasukkan Nomor HP"});
    }
    let data = await model.checkPrefixNumber(hp);
    if (data) {
        res.json({status:true,message:"Berhasil",data : {operator : data.operator} });
    } else {
        res.json({status:false,message:"Terjadi keslahan, coba lagi nanti"});
    }
});

router.get("/testPulsa",async function(req,res){
    var hp = "082193864947100";
    // var time = '191001';
    var userid = 'mp01212';
    var time = helper.timeSignature();
    var last4_digit = hp.slice(-4);
    var kode_produk = "S10";
    var reverse_last4_digit = helper.reverseString(last4_digit);
    var password = "121212";
    var invoice = '100001';
    var trxke = 1;

    var a =  time + last4_digit;
    var b = reverse_last4_digit + password;
    var data_xor = xor.encode(b,a);

    
    await request.post({
        // url: 'http://192.168.1.11:8081/mitacell/h2h/indexwaitsn.php',
        url: 'http://servermokes.dynns.com:8081/mitacell/h2h/indexwaitsn.php',
        method: "POST",
        headers: {
            'Content-Type': 'application/xml',
        },
        
        body: `<?xml version="1.0" ?>
        <evoucher>
           <command>TOPUP</command>
           <product>${kode_produk}</product>
           <userid>${userid}</userid>
           <time>${time}</time>
           <msisdn>${hp}</msisdn>
           <partner_trxid>${invoice}</partner_trxid>
           <signature> ${data_xor}</signature>
           <trxke>${trxke}</trxke>
        </evoucher>`
        }, function (error, response, body) {
        if (error) {
            console.log(error);
        } else {
            console.log(body);
        }
    });
    return res.json({a,b,data_xor});
});


module.exports = router;