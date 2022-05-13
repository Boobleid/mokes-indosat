const express = require("express");
const router = express.Router();
const helper = require("../library/helper");
const model = require("../model/model");
const appConfig = require("../config/app");
const JWT = require("jsonwebtoken");

router.post("/registrasi",async function(req,res){
    const nama = req.body.nama;
    const email = req.body.email;
    const nohp = req.body.nohp;
    if (nama && email && nohp){
        // Cek Nohp
        let cek_nohp = await model.getRowQuery("SELECT * FROM data_user WHERE nohp = '"+nohp+"'");
        if (cek_nohp) {
            return res.json({status : false, message : "nomor hp sudah digunakan", data : {}});
        }

        // Proses Simpan
        const otp = helper.randomNumber(6);
        await model.simpan_data_tabel('registrasi',{nama,email,nohp,otp},'','ADD','');
        console.log("OTP = "+otp);
        return res.json({status : true, message : "berhasil", data : {}});
    } else {
        return res.json({status : false, message : "request tidak lengkap", data : {}});
    }
});

router.post("/aktifasi-registrasi",async function(req,res){
    const otp = req.body.otp;
    const nohp = req.body.nohp;
    if (!(otp && nohp)){
        return res.json({status : false, message : "request tidak lengkap", data : {}})
    }
    let data_registrasi = await model.getRowQuery(`SELECT * FROM registrasi WHERE nohp = '${nohp}' AND otp = '${otp}'`);
    if (!data_registrasi){
        return res.json({status : false, message : "otp tidak sesuai", data : {}})
    } else {
        // cek data user jika tidak ada maka menyimpan data
        let data_user = await model.getRowQuery(`SELECT * FROM data_user WHERE nohp = '${nohp}'`);
        if (!data_user){
            await model.simpan_data_tabel('data_user',{nohp,nama : data_registrasi.nama,email : data_registrasi.email},'','ADD','');
        }

        var data_mentah_token = {
            nama : data_user.nama,
            email : data_user.email,
            nohp : data_user.nohp,
            exp : Math.floor(Date.now() / 1000) + (60 * 60 * 24)
        }
        const token = await helper.exportToken(data_mentah_token);
        return res.json({
            status : true,
            message : `berhasil`,
            data : {
                token,
                nama : data_user.nama,
                email : data_user.email,
                nohp : data_user.nohp,
            }
        });
    }
});

router.post("/login",async function(req,res){
    const nohp = req.body.nohp;
    const otp = req.body.otp ? req.body.otp : "";
    if (!nohp){
        return res.json({status : false, message : "request tidak lengkap", data : {}})
    }
    var data_user = await model.getRowQuery("SELECT * FROM data_user WHERE nohp = '"+nohp+"'");
    if (data_user){
        if (otp != ""){
            console.log(`SELECT * FROM user_login WHERE id_user = '${data_user.id}' AND otp = '${otp}' `);
            var data_otp = await model.getRowQuery(`SELECT * FROM user_login WHERE id_user = '${data_user.id}' AND otp = '${otp}' `);
            if (data_otp){
                var data_mentah_token = {
                    nama : data_user.nama,
                    email : data_user.email,
                    nohp : data_user.nohp,
                    exp : Math.floor(Date.now() / 1000) + (60 * 60 * 24)
                }
                const token = await helper.exportToken(data_mentah_token);
                return res.json({
                    status : true,
                    message : `berhasil`,
                    data : {
                        token,
                        nama : data_user.nama,
                        email : data_user.email,
                        nohp : data_user.nohp,
                    }
                });
            } else {
                return res.json({status : false, message : `Kode otp tidak sesuai`, data : {}})
            }
        } else {
            var new_OTP = helper.randomNumber(6);
            console.log(new_OTP);
            await model.runQuery(`DELETE FROM user_login WHERE id_user = '${data_user.id}' `);
            await model.simpan_data_tabel("user_login", { id_user: data_user.id, otp : new_OTP }, "", "ADD", "");

            // Kirim Otp

            return res.json({ status: true, message: "kode otp terkirim ("+new_OTP+")", data: {} });
        }
    } else {
        return res.json({status : false, message : `Maaf, nomor ${nohp} belum terdaftar`, data : {}})
    }
});

module.exports = router;