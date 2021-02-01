import moment from 'moment'

const _siteID = 'v62_T94bRuQIlz',
    _password = 'aoOh5RVjtB',
    _paymentAccountNumber = '620910213',
    _dimensionUnit = 'CM',
    _weightUnit = 'KG'

export const getQuote = (from, to, items) => {
    var d = new Date()
    var time = d.getTime().toString();
    var MessageReference = '0'.repeat(32 - time.length).concat(time)

    var obj = items.reduce((a, c) => {
        return {
            weight: a.weight + c.volumetricWeight.weight,
            pieces: a.pieces + c.qty,
            value: a.value + c.qty * c.price
        }
    }, {
        weight: 0,
        pieces: 0,
        value: 0
    })

    var pieces = []
    var count = 1
    items.forEach(item => {
        for (var i = 0; i < item.qty; i++) {
            pieces.push({
                PieceID: count,
                Height: item.volumetricWeight.height,
                Depth: item.volumetricWeight.length,
                Width: item.volumetricWeight.width,
                Weight: item.volumetricWeight.weight
            })
            count += 1
        }
    })

    var xml = {
        "p:DCTRequest": {
            "$": {
                "xmlns:p2": "http://www.dhl.com/DCTRequestdatatypes",
                "xsi:schemaLocation": "http://www.dhl.com DCT-req.xsd ",
                "schemaVersion": "2.0", "xmlns:p1": "http://www.dhl.com/datatypes",
                "xmlns:p": "http://www.dhl.com",
                "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance"
            },
            "GetQuote": [{
                "Request": [{
                    "ServiceHeader": [{
                        "MessageTime": [moment(d).format()],
                        "MessageReference": [MessageReference],
                        "SiteID": [_siteID],
                        "Password": [_password],
                    }],
                    "MetaData": [{
                        "SoftwareName": ["3PV"],
                        "SoftwareVersion": ["1.0"]
                    }]
                }],
                "From": [{
                    "CountryCode": [from.country],
                    "Postalcode": [from.zip],
                    "City": [from.city]
                }],
                "BkgDetails": [{
                    "PaymentCountryCode": ["TW"],
                    "Date": [d.toJSON().split('T')[0]],
                    "ReadyTime": ["PT10H21M"],
                    "DimensionUnit": [_dimensionUnit],
                    "WeightUnit": [_weightUnit],
                    "NumberOfPieces": [obj.pieces],
                    "ShipmentWeight": [obj.weight],
                    "Pieces": [{
                        "Piece": pieces
                    }],
                    "PaymentAccountNumber": [_paymentAccountNumber],
                    "IsDutiable": ["Y"],
                }],
                "To": [{
                    "CountryCode": [to.country],
                    "Postalcode": [to.zip],
                    "City": [to.city]
                }],
                "Dutiable": [{
                    "DeclaredCurrency": ["USD"],
                    "DeclaredValue": [obj.value],
                }],
            }]
        }
    }

    return fetch('https://us-central1-gk8u8ogkm.cloudfunctions.net/dhl', {
        method: 'POST',
        body: JSON.stringify({
            xml: xml
        })
    })
        .then(result => result.json())
        .catch(error => {
            console.log('error', error)
        })
}