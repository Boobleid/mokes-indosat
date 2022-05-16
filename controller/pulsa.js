const express = require("express");
const router = express.Router();
const helper = require("../library/helper");
const model = require("../model/model");
const appConfig = require("../config/app");
var xor = require('base64-xor');
var request = require("request");
var JSCRYPTO = require("crypto-js");


router.post("/get_produk",helper.cekToken(),async function(req,res){
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



router.post("/get_operator",helper.cekToken(),async function(req,res){
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

router.post("/transaksi_pulsa",helper.cekToken(),async function(req,res){
    const id_user = req.token.id_user;
    const nohp = req.body.nohp ? req.body.nohp : "";
    const kode = req.body.kode ? req.body.kode : "";
    if (nohp == "" && kode == ""){
        return res.json({status:false,message:"Harap memasukkan Nomor HP atau Kode"});
    }

    let data_pembelian = await model.getDataPulsaByKode(kode);
    if (!data_pembelian) {
        return res.json({status:false,message:"Kode tidak diketahui"}); 
    }

    let saldoUser = await model.getSaldoUser(id_user);
    if (!saldoUser){
        return res.json({status:false,message:"Terjadi keslahan saat mengambil data saldo, coba lagi nanti"});
    }

    let hrg_pembelian = data_pembelian.HargaNasional;
    let nm_produk = data_pembelian.NamaProduk;
    let penambahanBiaya = 0;
    let tagihan = hrg_pembelian + penambahanBiaya;
    let saldo = saldoUser.saldo;
    
    console.log(saldoUser);

    if (!(saldo >= tagihan)){
        return res.json({status:false,message:"Maaf, saldo anda tidak cukup, silahkan lakukan topup terlebiih dahulu"});
    }

    var trxke = await model.getTrxke(id_user);
    var time = helper.timeSignature();
    var last4_digit = nohp.slice(-4);
    var kode_produk = kode;
    var reverse_last4_digit = helper.reverseString(last4_digit);
    var invoice = helper.generateInvoice();

    var a =  time + last4_digit;
    var b = reverse_last4_digit + appConfig.passMokes;
    var data_xor = xor.encode(b,a);

    var xml_request = helper.xmlTopupPulsa(kode_produk,appConfig.userMokes,time,nohp,invoice,data_xor,trxke);
    // return res.json({xml_request});
    console.log(xml_request);
    var xml_response = await new Promise(async function(resolve,reject){
        console.log('1')
        try {
            await request.post({
                url: 'http://servermokes.dynns.com:8081/mitacell/h2h/indexwaitsn.php',
                method: "POST",
                headers: {
                    'Connection': 'keep-alive',
                    'Accept-Encoding': '',
                    'Accept-Language': 'en-US,en;q=0.8',
                    'Content-Type': 'application/xml',
                },
                body: xml_request
            }, function (error, response, body) {
                    console.log('2')
                    console.log(body);
                    console.log(error);
                    if (error) {
                        resolve(false);
                    }
                    resolve(response.body);
                    
                }
            );
        } catch(err){
            console.log('11')
            console.log(err);
            resolve(false);
        }
    });

    console.log('3');
    
    
    if (xml_response){
        console.log('4');
        console.log(xml_response);
        var json_res_mokes = helper.xmlToJson(xml_response);
        var status = json_res_mokes.evoucher.result;
        var data_transaksi = {
            jns : "TOPUP PULSA",
            invoice,
            id_user,
            trxke,
            nm_produk,
            hrg_produk : hrg_pembelian,
            hrg_up : penambahanBiaya,
            tagihan,
            status,
            xml_request,
            xml_response,
            last_user : id_user
        }
        await model.simpan_data_tabel('transaksi',data_transaksi,"","ADD","");
        
        if (status == '0' || status == 0){
            await model.simpan_data_tabel("saldo_keluar",{id_user,invoice,jumlah:tagihan,last_user:id_user},"","ADD","");
            return res.json({status:true,message:"Berhasil melakukan Topup"});
        } else {
            return res.json({status:false,message:"Gagal melakukan Topup"});    
        }
        
    } else {
        console.log('4');
        return res.json({status:false,message:"Terjadi kesalahan saat memanggil mokes, coba lagi nanti"});
    }
});
 
router.get("testingajsdas",async function(req,res){
    var hp = "082193864947";
    // var time = '191001';
    var userid = 'mp01212';
    var time = helper.timeSignature();
    var password = "121212";

    var a =  time;
    var b = password;
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
           <command>BALANCE</command>
           <userid>${userid}</userid>
           <time>${time}</time>
           <signature> ${data_xor}</signature>
        </evoucher>`
        }, function (error, response, body) {
            if (error) {
                console.log(error);
                console.log("================================")
            }  
                var a = helper.xmlToJson(response.body);
                var d = JSON.parse(a);
                console.log(d);
            
        }
    );
    return res.json({a,b,data_xor});
});

router.get("/tasdasdestPulsa",async function(req,res){
    var hp = "085397458123";
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
                console.log("================================")
            }  
                var a = helper.xmlToJson(response.body);
                var d = JSON.parse(a);
                console.log(d);
            
        }
    );
    return res.json({a,b,data_xor});
});


module.exports = router;