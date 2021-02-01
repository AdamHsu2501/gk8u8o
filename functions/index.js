const cors = require('cors')({ origin: true });
const functions = require('firebase-functions');
const firebase_tools = require('firebase-tools');

var serviceAccount = require('./serviceAccount.json');
const { Storage } = require('@google-cloud/storage');

const algoliasearch = require('algoliasearch')

var isAdminInit = false;
function AdminInit() {
    functions.logger.log('ADMIN INIT')
    functions.logger.log('isAdminInit', isAdminInit)

    const admin = require('firebase-admin');

    if (!isAdminInit) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://gk8u8ogkm.firebaseio.com"
        });
        isAdminInit = true
    }

    return admin
}

const gcconfig = {
    projectId: "gk8u8ogkm",
    keyFilename: './serviceAccount.json'
};

const gcs = new Storage(gcconfig);

const runtimeOpts = {
    timeoutSeconds: 540,
    memory: '2GB'
}

const _originList = [
    'http://localhost:3000',
    'https://gk8u8ogkm.firebaseapp.com'
]

exports.geolocation = functions.https.onRequest((req, res) => {
    functions.logger.log('start......................................')
    functions.logger.log('geolocation ', req.headers);
    cors(req, res, () => {
        if (!_originList.includes(req.headers.origin)) {
            return res.status(401).json({
                message: "Not allowed"
            });
        }

        var country = req.headers["x-appengine-country"]
        functions.logger.log('country', country);

        res.status(200).send({ country: country })
    })

})
var bucketName = 'gk8u8ogkm.appspot.com'


exports.deleteStorage = functions.https.onCall((data, context) => {
    functions.logger.log('deleteStorage start');
    functions.logger.log('data', typeof (data), data);

    return gcs.bucket(bucketName).deleteFiles({ prefix: data.prefix })
        .then((results) => {
            return functions.logger.log('complete deleted. results', results);
        }).catch((error) => {
            return functions.logger.log('Error:', error);
        })
});


exports.recursiveDelete = functions.runWith(runtimeOpts).https.onCall(async (data, context) => {

    const path = data.path;
    console.log(
        `User ${context.auth.uid} has requested to delete path ${path}`
    );

    await firebase_tools.firestore
        .delete(path, {
            project: process.env.GCLOUD_PROJECT,
            recursive: true,
            yes: true,
            token: functions.config().fb.token
        });

    return {
        path: path
    };
});


const { dhl } = require('./dhl')
exports.dhl = functions.https.onRequest((req, res) => {
    functions.logger.log('headers.origin', req.headers.origin);
    functions.logger.log('headers', req.headers);
    cors(req, res, () => {
        return dhl(req, res)
    })
})

const { ecpay } = require('./ecpay');

exports.ecpay = functions.https.onRequest((req, res) => {
    functions.logger.log('headers.origin', req.headers.origin);
    functions.logger.log('headers', req.headers);

    cors(req, res, () => {

        if (!_originList.includes(req.headers.origin)) {
            return res.status(401).json({
                message: "Not allowed"
            });
        }

        return ecpay(req, res)
    })

})

exports.listener = functions.https.onRequest((req, res) => {
    var body = req.body
    functions.logger.log('body', body);
    functions.logger.log('headers.origin', req.headers.origin);

    if (!!body.PaymentType) {
        //checkout PaymentDate,RtnCode":"1",CheckMacValue,SimulatePaid,PaymentType,TradeAmt,TradeNo,MerchantID,MerchantTradeNo,PaymentTypeChargeFee,StoreID,RtnMsg,TradeDate,CustomField1-4
        functions.logger.log('checkout', body.PaymentType);
        return listenerCheckout(body)
    }

    if (body.AllPayLogisticsID) {
        //createC2C AllPayLogisticsID,GoodsAmount,MerchantID,ReceiverPhone,ReceiverName,UpdateStatusDate,CVSValidationNo,CheckMacValue,ReceiverAddress,BookingNote,LogisticsType,RtnMsg,LogisticsSubType,UNIMARTC2C,RtnCode":"300",ReceiverCellPhone,0900000000,ReceiverEmail,CVSPaymentNo,MerchantTradeNo
        functions.logger.log('createC2C', body.AllPayLogisticsID);
        return res.send(body)
    }

    if (!!body.CVSStoreID) {
        const { ExtraData, CVSStoreID, CVSAddress, CVSStoreName } = body
        functions.logger.log('listener map', CVSStoreID);

        //map CVSTelephone,MerchantID,CVSAddress,CVSStoreID,CVSOutSide,CVSStoreName,ExtraData,MerchantTradeNo,LogisticsSubType
        var path = _originList[parseInt(ExtraData)]
        var address = JSON.stringify({
            address: CVSAddress,
            storeId: CVSStoreID,
            storeName: CVSStoreName
        })

        return res.redirect(`${path}/listener?CVS=${address}`)
    }

    return null
})

function listenerCheckout(body) {
    const admin = AdminInit()
    const firestore = admin.firestore();
    const { RtnMsg, MerchantTradeNo, PaymentType, PaymentDate, TradeAmt } = body
    functions.logger.log('type', PaymentType)
    functions.logger.log('RtnMsg', RtnMsg);

    return firestore.collection('order').where('paymentId', '==', MerchantTradeNo).get().then(docs => {
        if (docs.empty) {
            console.log('order not exists! paymentId:', MerchantTradeNo)
            return null;
        }

        var d = new Date(PaymentDate)
        var batch = firestore.batch()

        docs.forEach(doc => {
            var data = doc.data()

            var status = RtnMsg == 'Succeeded' || RtnMsg == '交易成功' || RtnMsg == '付款成功' ? 'pending' : 'canceled';
            functions.logger.log('status', status)

            if (status === 'canceled') {
                data.items.forEach(item => {
                    var obj = {
                        sales: admin.firestore.FieldValue.increment(-item.qty),
                        totalSales: admin.firestore.FieldValue.increment(-item.qty)
                    }

                    if (item.deduction) {
                        obj.quantity = admin.firestore.FieldValue.increment(item.qty)
                    }

                    batch.set(firestore.collection('stock').doc(item.id), obj, { merge: true })
                })
            }

            batch.set(firestore.collection('order').doc(doc.id), {
                ...data,
                status: status,
                paymentDate: d.getTime(),
                items: data.items.map(item => item.paymentId === MerchantTradeNo ? ({
                    ...item,
                    deduction: status === 'canceled' ? false : item.deduction,
                    paid: status === 'canceled' ? item.paid : true,
                    paymentDate: d.getTime(),
                }) : item),
                records: [
                    ...data.records,
                    body
                ]

            })
        })

        return batch.commit().then(() => {
            return functions.logger.log('firestore update completed', MerchantTradeNo)
        });
    })
}



// [START init_algolia]
// Initialize Algolia, requires installing Algolia dependencies:
// https://www.algolia.com/doc/api-client/javascript/getting-started/#install
//
// App ID and API Key are stored in functions config variables
const ALGOLIA_ID = functions.config().algolia.app_id; //functions.config().gk8u8o.algolia.app_id; // functions.config().algolia.app_id;
const ALGOLIA_ADMIN_KEY = functions.config().algolia.api_key; //functions.config().gk8u8o.algolia.api_key; //functions.config().algolia.api_key;
const ALGOLIA_SEARCH_KEY = functions.config().algolia.search_key //functions.config().gk8u8o.algolia.search_key; //functions.config().algolia.search_key

const client = algoliasearch(ALGOLIA_ID, ALGOLIA_ADMIN_KEY);
const _collection = ['user', 'order', 'stock', 'message']


exports.writeIndex = functions.firestore.document('{col}/{id}').onWrite((change, context) => {
    functions.logger.log("writeIndex start")

    var { after } = change
    var col = context.params.col

    functions.logger.log("col", col)
    functions.logger.log("after", after.id, after.exists, after.data())

    if (!_collection.includes(col)) {
        return null
    }

    var index = client.initIndex(col)

    if (after.exists) {
        functions.logger.log("algolia update", col, after.id)

        var data = after.data();
        data.objectID = after.id;
        return index.saveObject(data)
    } else {
        functions.logger.log("algolia delete", after.id)

        return index.deleteObject(after.id)
    }
})

const nodemailer = require('nodemailer');
const hbs = require('nodemailer-express-handlebars');
const gmailEmail = functions.config().gk8u8o.gmail.email; //functions.config().gmail.email;
const gmailPassword = functions.config().gk8u8o.gmail.password; //functions.config().gmail.password;
const mailTransport = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: gmailEmail,
        pass: gmailPassword,
    },
});
const templatesPath = __dirname + "/templates";
mailTransport.use('compile', hbs({
    viewEngine: {
        extName: '.hbs',
        partialsDir: templatesPath,
        layoutsDir: templatesPath,
        defaultLayout: '',
    },
    viewPath: templatesPath,
    extName: '.hbs',
}))

exports.sendEmail = functions.https.onCall((data, context) => {
    functions.logger.log("sendEmail start", data)

    // var banner = 'https://firebasestorage.googleapis.com/v0/b/gk8u8ogkm.appspot.com/o/email%2Fbanner.jpg?alt=media&token=986ea179-21eb-4806-8a73-7370115be750'
    return Promise.all(
        data.list.map(item => {
            functions.logger.log("item", item)

            const mailOptions = {
                ...item,
                from: `${item.from} <noreply@firebase.com>`,
                context: {
                    ...item.context,
                    templatesPath: templatesPath,
                }
            };

            return mailTransport.sendMail(mailOptions)
        })
    ).then(() => {
        return functions.logger.log("Send emails completed", data.list)
    }).catch(error => {
        return functions.logger.error("error", error)
    })
})


