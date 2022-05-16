let bcrypt = require("bcryptjs");
let JWT = require("jsonwebtoken");
let X2JS = require("x2js");
let appConfig = require("../config/app");
var x2js = new X2JS();

exports.xmlToJson = function(xml) {
    return x2js.xml2js(xml);
};


exports.xmlTopupPulsa = (kode_produk,userid,time,hp,invoice,data_xor,trxke)=>{
    return `<?xml version="1.0" ?>
    <evoucher>
       <command>TOPUP</command>
       <product>${kode_produk}</product>
       <userid>${userid}</userid>
       <time>${time}</time>
       <msisdn>${hp}</msisdn>
       <partner_trxid>${invoice}</partner_trxid>
       <signature> ${data_xor}</signature>
       <trxke>${trxke}</trxke>
    </evoucher>`;
}

exports.cekToken = ()=>{
    return function(req,res,next){
        var token = req.headers['x-access-token'];
        if (token){
            JWT.verify(token,appConfig.jwtSecret,async function(err,decode){
                if (err){return res.status(401).send({message:"Token tidak valid"})}
                else {
                    req.token = decode;
                    next();
                }
            });
        } else {
            return res.status(401).send({message:"Tidak ada token yang dikirim"})
        }
    }
}

exports.exportToken = async function(data){
    return await new Promise(function (resolve, reject) {
        try {
            let dJwt = JWT.sign(data, appConfig.jwtSecret);
            resolve(dJwt);
        } catch (error) {
            console.log(error.message);
            resolve(false)
        }
    });
}

exports.reverseString = function(str) {
    var splitString = str.split("");
    var reverseArray = splitString.reverse();
    var joinArray = reverseArray.join("");
    return joinArray;
}

exports.randomNumber = function (length) {
    var result = '';
    var characters = '123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
       result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
 }

exports.timeSignature = function(x = ''){
    let d;
    if (x != ''){
        d = new Date(x);
    } else {
        d = new Date();
    }
    let jam = addZero(d.getHours());
    let mnt = addZero(d.getMinutes());
    let second = addZero(d.getSeconds());
    // let thn = d.getFullYear() + "";
    // let bulan = addZero(d.getMonth() + 1);
    // let tgl = addZero(d.getDate());
    // thn = thn.slice(-2);
    return `${jam}${mnt}${second}`;
}

exports.rev_date_indo = function(tgl){
    if (tgl != '') {
        var t = tgl.split("-");
        var tanggal  =  t[2];
        var bulan    =  t[1];
        var tahun    =  t[0];
        return  tanggal + '/' + bulan + '/' + tahun;
    } else {
        return '';
    }
}

exports.formatRupiah = function(angka){
    angka = angka + "";
    var number_string = angka.replace(/[^,\d]/g, '').toString(),
    split   		= number_string.split(','),
    sisa     		= split[0].length % 3,
    rupiah     		= split[0].substr(0, sisa),
    ribuan     		= split[0].substr(sisa).match(/\d{3}/gi);

    // tambahkan titik jika yang di input sudah menjadi angka ribuan
    if(ribuan){
        separator = sisa ? '.' : '';
        rupiah += separator + ribuan.join('.');
    }

    rupiah = split[1] != undefined ? rupiah + ',' + split[1] : rupiah;
    return rupiah;
}

exports.thn = function(x = '') {
    let d;
    if (x != ''){
        d = new Date(x);
    } else {
        d = new Date();
    }
    let thn = d.getFullYear();
    return thn;
}

exports.bln = function(x = '') {
    let d;
    if (x != ''){
        d = new Date(x);
    } else {
        d = new Date();
    }
    let bulan = d.getMonth() + 1;
    return bulan;
}

exports.getTimeOnHSbyDate = function(x){
    let d = new Date(x);
    let jam = d.getHours();
    let mnt = d.getMinutes();
    var s = `${jam}:${mnt}`;
    return new Date(s).getTime();
}

exports.rev_date_time = function(tgl){
    if (tgl != '') {
        var rev = tgl.split(" ");
        var t = rev[0].split("-");
        var tanggal  =  t[2];
        var bulan    =  t[1];
        var tahun    =  t[0];
        return  tanggal + '/' + bulan + '/' + tahun + ' ' + rev[1];
    } else {
        return '';
    }
}

function addZero(i) {
    if (i < 10) {i = "0" + i}
    return i;
  }

exports.skrg = function (x = '') {
    let d;
    if (x != ''){
        d = new Date(x);
    } else {
        d = new Date();
    }
    let thn = d.getFullYear();
    let bulan = addZero(d.getMonth() + 1);
    let tgl = addZero(d.getDate());
    let jam = addZero(d.getHours());
    let mnt = addZero(d.getMinutes());
    let second = addZero(d.getSeconds());
    return `${thn}-${bulan}-${tgl} ${jam}:${mnt}:${second}`;
 }

exports.generateInvoice = function(){
    var result = '';
    var characters = '0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < 4; i++) {
       result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    d = new Date();
    let thn = d.getFullYear();
    let bulan = addZero(d.getMonth() + 1);
    let tgl = addZero(d.getDate());
    return thn+bulan+tgl+result;
}

exports.hari_ini = function (x = '') {
    let d;
    if (x != ''){
        d = new Date(x);
    } else {
        d = new Date();
    }
    let thn = d.getFullYear();
    let bulan = addZero(d.getMonth() + 1);
    let tgl = addZero(d.getDate());
    return `${thn}-${bulan}-${tgl}`;
}

exports.cek_password_bcrypt = function(salt,password){
    var hash = bcrypt.compareSync(password, salt);
    return hash;
}
