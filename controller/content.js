const express = require("express");
const router = express.Router();
const helper = require("../library/helper");
const model = require("../model/model");
const appConfig = require("../config/app");
const { route } = require("./data");


router.get("/banner", helper.cekToken(), async function(req, res){
    var data = await model.getRowsQuery(`SELECT jenis,banner FROM banner`);
    res.json({
        status : true,
        message : "Berhasil",
        data
    });
});

router.post("/list-produk-distibutor", helper.cekToken(), async function(req, res){
    var id_kategori = req.body.id_kategori;
    var qData = "";
    var limit = req.body.limit;
    var offset = req.body.offset;
    if(id_kategori){
        qData = ` AND a.id_kategori = ${id_kategori}`;
    }
    var data = await model.getRowsQuery(`SELECT a.id AS id_produk,a.nm_produk as nama,a.foto, a.id_kategori, b.harga FROM produk AS a LEFT JOIN produk_harga AS b ON a.id=b.id_produk
    WHERE a.active='1' AND b.level='1' ${qData} LIMIT ${limit} OFFSET ${offset} `);
    
    if(data !== false){
        res.json({
            status : true,
            message : "Berhasil",
            data
        });
    }else{
        res.json({
            status : false,
            message : "Data Tidak Ditemukan"
        });
    }
})


router.post('/list_produk_fisik', helper.cekToken(), async function(req, res){
    var id_kategori = req.body.id_kategori;
    var data = await model.getRowsQuery(`SELECT a.id, harga, a.deskripsi, a.kuota, a.masa_berlaku, a.id_provider_produk as id_provider, b.nama_menu as nama_provider FROM produk_fisik as a LEFT JOIN tbl_provider_produk as b ON a.id_provider_produk= b.id  WHERE a.id_produk_fisik_kategori = ${id_kategori}`);
    var operator = await model.getRowsQuery(`SELECT id, nama_menu, banner FROM tbl_provider_produk`);
    
   
    
    if(data !== false){
        res.json({
            status : true,
            message : "Berhasil",
            data
        });
    }else{
        res.json({
            status : false,
            message : "Data Tidak Ditemukan"
        });
    }
});

router.post('/search_produk_fisik', helper.cekToken(), async function(req, res){
    var keyword = req.body.keyword;
    var data = await model.getRowsQuery(`SELECT a.id, harga, a.deskripsi, a.kuota, a.masa_berlaku, a.id_provider_produk as id_provider, b.nama_menu as nama_provider FROM 
    produk_fisik as a LEFT JOIN tbl_provider_produk as b ON a.id_provider_produk= b.id LEFT JOIN produk_fisik_kategori as c on a.id_produk_fisik_kategori=c.id
    WHERE a.deskripsi LIKE '%${keyword}%' OR a.harga LIKE '%${keyword}%' OR a.kuota LIKE '%${keyword}%' OR  c.nama LIKE '%${keyword}%'` );
    

    if(data=="" || data == false){
        res.json({
            status: false,
            message: "Tidak ada yang cocok"
        })
    }else{
        res.json({
            status: true,
            message: "Berhasil",
            data
        })
    }
})
 

router.get('/load_provider', helper.cekToken(), async function(req, res){
    var data = await model.getRowsQuery(`SELECT id, nama_menu, banner FROM tbl_provider_produk`);

    if(data !== false){
        res.json({
            status : true,
            message : "Berhasil",
            data
        });
    }else{
        res.json({
            status : false,
            message : "Data Tidak Ditemukan"
        });
    }
})



router.get('/penjualan', helper.cekToken(), async function(req, res){
    const id_user = req.token.id_user;
    const type = req.body.type;
    if(type == 'fisik'){
        var data_keranjang = await model.getRowsQuery(`SELECT * FROM tbl_keranjang_fisik WHERE last_user = '${id_user}'`);
    }else{
        var data_keranjang =  await model.getRowsQuery(`SELECT * FROM tbl_keranjang_distributor WHERE last_user = '${id_user}'`);
    } 
    var data_profil = await model.getRowQuery(`SELECT * FROM tbl_profil WHERE last_user = '${id_user}'`);
    var metode_pembayaran = await model.getRowsQuery(`SELECT * FROM tbl_metode_bayar`);



    var data = {};
    data["keranjang"] = data_keranjang;
    data["alamat"] = {
        "kota" : data_profil.kota,
        "alamat_lengkap" : data_profil.alamat_lengkap
    };
    data["penerima"] = {
        "nama" : data_profil.nama,
        "no_hp" : data_profil.no_hp
    };
    data["metode_pengiriman"] = {
        "1" : {
            "id" : "1",
            "nama" : "Kirim Sekarang",
            "harga" : 20000,
            "diterima" : "hari ini"
        },
        "2" : {
            "id" : "2",
            "nama" : "Kirim Sesuai Jadwal Distributor",
            "harga" : 15000,
            "diterima" : "23 - 25 Mei"
        },
        "3" : {
            "id" : "3",
            "nama" : "Kirim Luar Kota ",
            "harga" : 25000,
            "diterima" : "23 - 25 Mei"
        }
    };

    data["metode_bayar"] = metode_pembayaran;
    data["detail"] = {
        "total_pembelian" : data_keranjang.harga
    };

    if(data !== false || data !== ""){
        res.json({
            status : true,
            message : "Berhasil",
            data
        });
    }else{
        res.json({
            status : false,
            message : "Data Tidak Ditemukan"
        });
    }    
});


router.post('/transaksi_penjualan', helper.cekToken(), async function(req, res){
    const userdata = req.token;
    const type = req.body.type ? req.body.type : "";
    const id_distributor = req.body.id_distributor ? req.body.id_distributor : "0";
    const nama_penerima = req.body.nama_penerima ? req.body.nama_penerima : "";
    const no_hp = req.body.no_hp_penerima ? req.body.no_hp_penerima : "";
    const metode_pembayaran = req.body.metode_pembayaran ? req.body.metode_pembayaran : "";
    const metode_pengiriman = req.body.metode_pengiriman ? req.body.metode_pengiriman : "";
    const alamat = req.body.alamat ? req.body.alamat : "";
    const lat_penerima = req.body.lat_penerima ? req.body.lat_penerima : "";
    const lng_penerima = req.body.lng_penerima ? req.body.lng_penerima : "";
   
    const total_pembelian = req.body.total_pembelian ? req.body.total_pembelian : "";
    const bank_tujuan_bayar = req.body.bank_tujuan_bayar ? req.body.bank_tujuan_bayar : "";
    const no_tujuan_bayar = req.body.no_tujuan_bayar ? req.body.no_tujuan_bayar : "";
    const mulai_terima_tgl = req.body.mulai_terima_tgl ? req.body.mulai_terima_tgl : "";
    const sampai_terima_tgl = req.body.sampai_terima_tgl ? req.body.sampai_terima_tgl : "";
    
    let lastID = await model.lastID('penjualan');
    lastID = lastID + 1;
    // last
    if(id_distributor == "" || nama_penerima == "" || no_hp == "" || metode_pembayaran == "" || metode_pengiriman == "" || alamat == "" || type == ""){
        return res.json({status: false,message : "Parameter Tidak Lengkap"});
    }
    if(type == 'fisik'){       
        var table= 'penjualan_detail_fisik';
        var tableKeranjang = 'tbl_keranjang_fisik';
    }else{ // distributor
        var table= 'penjualan_detail';
        var tableKeranjang = 'tbl_keranjang_distributor';
        var qwhere = ` AND id_distributor = '${id_distributor}'`;
    }

    // if(metode_pembayaran == "mokes"){

    // }


    var data_keranjang = await model.getRowsQuery(`SELECT * FROM ${tableKeranjang} WHERE last_user = '${userdata.id_user}' ${qwhere}`);

    var invoice = helper.generateInvoice();
    var tr_penjualan = {
        id: lastID,
        nm_penerima : nama_penerima,
        id_distributor,
        invoice,
        telp_penerima : no_hp,
        alamat_penerima : alamat,
        lat_penerima : lastID,
        lng_penerima :data_keranjang.length,
        metode_pengiriman,
        metode_pembayaran,
        mulai_terima_tgl,
        sampai_terima_tgl,
        no_tujuan_bayar,
        bank_tujuan_bayar,
        bayar : total_pembelian,
        status : "Belum Bayar",
        create_by : userdata.id_user ,      
        create_at : helper.date_time_now(),  
        last_user : userdata.id_user,
        last_update : helper.date_time_now()
    };
    await model.simpan_data_tabel('penjualan',tr_penjualan,"","ADD","");


    //  details penjualan $ hapus keranjang
    
    for(var i=0; i < data_keranjang.length; i++){
        var detail_penjualan = {
            id_penjualan  : lastID,
            id_distributor : id_distributor,
            id_produk : data_keranjang[i].id_produk,
            nm_produk : data_keranjang[i].nm_produk,
            satuan : data_keranjang[i].satuan,
            ket_satuan : data_keranjang[i].ket_satuan,
            harga : data_keranjang[i].harga,
            qty : data_keranjang[i].qty,
            foto : data_keranjang[i].foto,
            create_by : userdata.id_user,
            create_at : helper.date_time_now(),  
            last_user : userdata.id_user,
            last_update : helper.date_time_now()
    };

    await model.simpan_data_tabel(`${table}`,detail_penjualan, "", "ADD", "" );


    await model.getRowQuery(`DELETE FROM ${tableKeranjang} WHERE id ='${detail_penjualan[i].id}' `);

    
    }   
    
 


    res.json({
        status: true,
        message: "Berhasil"
    });
});



 
module.exports = router;