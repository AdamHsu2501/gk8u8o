import en_us from '../languages/en-us'
import zh_tw from '../languages/zh-tw'

export const getLabel = (value, code) => {
    var str, id = code.toLowerCase();

    if (typeof (value) === 'object' && value !== null) {
        return value[id] || value['en-us']
    }

    switch (id) {
        case 'en-us':
            str = en_us[value]
            break;
        case 'zh-tw':
            str = zh_tw[value]
            break;
        default:
            str = en_us[value]
    }

    return str || `unknow ${id} ${value}`
}
