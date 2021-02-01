const ecpay_payment = require('./ecpay-payment')
const ecpay_logistics = require('./ecpay-logistics')
const functions = require('firebase-functions');
const moment = require('moment-timezone');

Date.prototype.Format = function (fmt) {
    var o = {
        "M+": this.getMonth() + 1, //月份 
        "d+": this.getDate(), //日 
        "h+": this.getHours(), //小时 
        "m+": this.getMinutes(), //分 
        "s+": this.getSeconds(), //秒 
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度 
        "S": this.getMilliseconds() //毫秒 
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}

function createEcpayRes(req) {
    functions.logger.log('req.body', typeof (req.body), req.body)

    const data = typeof (req.body) === 'string' ? JSON.parse(req.body) : req.body
    functions.logger.log('data', typeof (data), data)

    const action = data.action
    functions.logger.log('action', action)

    let base_param, create = new ecpay_logistics();
    const date = moment().tz("Asia/Taipei").format("YYYY/MM/DD HH:mm:ss");
    functions.logger.log('交易時間(YYYY/MM/DD HH:mm:ss)', date)

    if (action === 'cancelC2C' || action === 'printC2C') {
        base_param = {
            AllPayLogisticsID: data.AllPayLogisticsID, // 請帶20碼uid, ex: 84851681561813188188, 為Create時所得到的物流交易編號
            CVSPaymentNo: data.CVSPaymentNo, // 請帶15碼uid, ex: 848516815618131, 為Create時所得到的寄貨編號
            CVSValidationNo: data.CVSValidationNo, // 請帶10碼uid, ex: 8485168156, 為Create時所得到的驗證碼
            PlatformID: ""
        }

        return action === 'cancelC2C' ?
            create.c2c_process_client.cancelc2corder(parameters = base_param)
            :
            create.c2c_process_client.printunimartc2corderinfo(parameters = base_param);
    } else if (action === 'map') {

        base_param = {
            MerchantTradeNo: "", // 請帶20碼uid, ex: f0a0d7e9fae1bb72bc93
            ServerReplyURL: 'https://us-central1-gk8u8ogkm.cloudfunctions.net/listener',//'https://us-central1-gk8u8ogkm.cloudfunctions.net/map',// 物流狀況會通知到此URL
            LogisticsType: "CVS",
            LogisticsSubType: "UNIMARTC2C",
            IsCollection: "N",
            ExtraData: req.headers.origin.includes('localhost') ? "0" : "1",
            Device: ""
        };

        return create.query_client.expressmap(parameters = base_param);
    } else if (action === 'createC2C') {
        // var d = new Date();
        // d.setHours(d.getHours() + 8);
        var total = data.GoodsAmount.toString()

        let base_param = {
            MerchantTradeNo: data.MerchantTradeNo, // 請帶20碼uid, ex: f0a0d7e9fae1bb72bc93, 為aiocheckout時所產生的
            MerchantTradeDate: date, // d.Format("yyyy/MM/dd hh:mm:ss"), // 請帶交易時間, ex: 2017/05/17 16:23:45, 為aiocheckout時所產生的
            LogisticsType: "CVS",
            LogisticsSubType: "UNIMARTC2C",//UNIMART、FAMI、HILIFE、UNIMARTC2C、FAMIC2C、HILIFEC2C
            GoodsAmount: total, // 1~19,999
            CollectionAmount: total, // 此為超商代收金額, 必須與goodsAmount一致
            IsCollection: data.IsCollection,
            GoodsName: data.GoodsName,
            SenderName: data.SenderName,
            SenderPhone: "",
            SenderCellPhone: data.SenderCellPhone,
            ReceiverName: data.ReceiverName,
            ReceiverPhone: "",
            ReceiverCellPhone: data.ReceiverCellPhone,
            ReceiverEmail: data.ReceiverEmail,
            TradeDesc: "",
            ServerReplyURL: 'https://us-central1-gk8u8ogkm.cloudfunctions.net/listener',//`${req.protocol}://${req.get('host')}/shipping`, // 物流狀況會通知到此URL
            ClientReplyURL: "",
            LogisticsC2CReplyURL: 'https://us-central1-gk8u8ogkm.cloudfunctions.net/listener',//`${req.protocol}://${req.get('host')}/shipping`,
            Remark: "",
            PlatformID: "",
            ReceiverStoreID: data.ReceiverStoreID, // 請帶收件人門市代號(統一):991182  測試商店代號(全家):001779 測試商店代號(萊爾富):2001、F227
            ReturnStoreID: ""
        };
        functions.logger.log('base_param', base_param)
        return create.create_client.create(parameters = base_param);

    } else {
        // var d = new Date().Format("yyyy/MM/dd hh:mm:ss");
        let base_param = {
            MerchantTradeNo: data.MerchantTradeNo, //請帶20碼uid, ex: f0a0d7e9fae1bb72bc93
            MerchantTradeDate: date, //d, //ex: 2017/02/13 15:45:30
            TotalAmount: data.TotalAmount,
            TradeDesc: 'gkm8u8o',
            ItemName: data.ItemName,
            ReturnURL: 'https://us-central1-gk8u8ogkm.cloudfunctions.net/listener',//'https://us-central1-gk8u8ogkm.cloudfunctions.net/checkout',
            EncryptType: '1',
            // ChooseSubPayment: '',
            // OrderResultURL: 'https://us-central1-gk8u8ogkm.cloudfunctions.net/checkout',
            // NeedExtraPaidInfo: '1',
            ClientBackURL: `${req.headers.origin}/order`,
            // ItemURL: 'http://item.test.tw',
            // Remark: '交易備註',
            // StoreID: '',
            // CustomField1: '',
            // CustomField2: '',
            // CustomField3: '',
            // CustomField4: ''
        };

        create = new ecpay_payment();
        return create.payment_client.aio_check_out_all(parameters = base_param, invoice = {});
    }

}


module.exports.ecpay = (req, res) => {
    let ecpayRes = createEcpayRes(req, res)
    if (typeof ecpayRes === 'string') {
        functions.logger.log("string", ecpayRes);
        res.send(ecpayRes)
    } else {
        ecpayRes.then(function (result) {
            functions.logger.log('result', result);
            res.status(200).send(result)
        }).catch(function (err) {
            functions.logger.log('error', err);
            res.status(500).send(result)
        });
    }
}