var xml2js = require('xml2js');
var parser = new xml2js.Parser();
var builder = new xml2js.Builder();

const functions = require('firebase-functions');
var request = require('requestretry');

//Input path for Server url details
server_url = 'https://xmlpitest-ea.dhl.com/XMLShippingServlet';
//Input path for Response XML Files
futureDate = false;

server_url = server_url + '?isUTF8Support=true';

module.exports.dhl = (req, res) => {
    var body = JSON.parse(req.body)
    functions.logger.log('body', body)

    var xml = builder.buildObject(body.xml);
    functions.logger.log('xml', typeof (xml), xml)

    const options = {
        url: server_url,
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept-Charset': 'utf-8',
            'futureDate': futureDate,
            'languageCode': 'NODEJS'
        },
        body: xml,
        maxAttempts: 3,   // (default) try 5 times
        retryDelay: 60000,  // (default) wait for 60s before trying again
        retryStrategy: request.RetryStrategies.HTTPOrNetworkError // (default) retry on 5xx or network errors
    };

    return request(options, { formData: xml })
        .then((response) => {
            var resBody = response.body
            functions.logger.log('response.body', typeof (resBody), resBody)
            return parser.parseStringPromise(resBody)
        }).then(json => {
            functions.logger.log('response json', typeof (json), json)
            var GetQuoteResponse = json["res:DCTResponse"]["GetQuoteResponse"]
            functions.logger.log('GetQuoteResponse', typeof (GetQuoteResponse), GetQuoteResponse)


            var BkgDetails = GetQuoteResponse[0]["BkgDetails"]
            functions.logger.log('BkgDetails', typeof (BkgDetails), BkgDetails)

            if (!!BkgDetails) {
                var QtdShp = BkgDetails[0]["QtdShp"]
                functions.logger.log('QtdShp', typeof (QtdShp), QtdShp)

                var product = QtdShp.find(item => item.ProductShortName.includes('EXPRESS WORLDWIDE'))
                functions.logger.log('product', typeof (product), product)

                var ShippingCharge = product.ShippingCharge[0]
                functions.logger.log('ShippingCharge', typeof (ShippingCharge), ShippingCharge)

                var QuotedWeight = product.QuotedWeight[0]
                functions.logger.log('QuotedWeight', typeof (QuotedWeight), QuotedWeight)

                res.status(200).send({
                    fee: ShippingCharge,
                    weight: QuotedWeight
                })
            } else {
                var msg = GetQuoteResponse[0]['Note'][0]['Condition'][0]['ConditionData']
                res.send({
                    error: msg
                })
            }

        })
        .catch(function (err) {
            // Failed
            functions.logger.error('err', err)
            res.send({
                error: err
            })
        });

}


// var obj = {
//     "p:DCTRequest": {
//         "GetQuote": [{
//             "Dutiable": [{
//                 "DeclaredValue": ["1.0"],
//                 "DeclaredCurrency": ["USD"]
//             }],
//             "To": [{
//                 "Postalcode": ["98052"],
//                 "City": ["Redmond"],
//                 "CountryCode": ["US"]
//             }],
//             "From": [{
//                 "Postalcode": ["334"],
//                 "CountryCode": ["TW"],
//                 "City": ["Taoyuan City"]
//             }],
//             "Request": [{
//                 "MetaData": [{
//                     "SoftwareVersion": ["1.0"],
//                     "SoftwareName": ["3PV"]
//                 }],
//                 "ServiceHeader": [{
//                     "Password": ["aoOh5RVjtB"],
//                     "SiteID": ["v62_T94bRuQIlz"],
//                     "MessageReference": ["1234567890123456789012345678901"],
//                     "MessageTime": ["2002-08-20T11:28:56.000-08:00"]
//                 }]
//             }],
//             "BkgDetails": [{
//                 "DimensionUnit": ["CM"],
//                 "IsDutiable": ["Y"],
//                 "Date": ["2020-09-09"],
//                 "PaymentAccountNumber": ["620910213"],
//                 "WeightUnit": ["KG"],
//                 "ShipmentWeight": ["10"],
//                 "PaymentCountryCode": ["TW"],
//                 "NumberOfPieces": ["2"],
//                 "ReadyTime": ["PT10H21M"],
//                 "Pieces": [{
//                     "Piece": [{
//                         "Depth": ["20"],
//                         "PieceID": ["1"],
//                         "Height": ["20"],
//                         "Width": ["20"],
//                         "Weight": ["5.0"]
//                     }, {
//                         "PieceID": ["2"],
//                         "Weight": ["5.0"],
//                         "Width": ["20"],
//                         "Depth": ["20"],
//                         "Height": ["20"]
//                     }]
//                 }]
//             }]
//         }], "$": {
//             "xmlns:p2": "http://www.dhl.com/DCTRequestdatatypes",
//             "xsi:schemaLocation": "http://www.dhl.com DCT-req.xsd ",
//             "schemaVersion": "2.0", "xmlns:p1": "http://www.dhl.com/datatypes",
//             "xmlns:p": "http://www.dhl.com",
//             "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance"
//         }
//     }
// }