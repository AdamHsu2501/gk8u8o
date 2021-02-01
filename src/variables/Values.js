import headerImg from '../assets/imgs/header.png'
import footerImg from '../assets/imgs/footer.png'
import loginImg from '../assets/imgs/login.png'
import noImage from '../assets/imgs/noImage.png'

export const _headerImg = headerImg
export const _footerImg = footerImg
export const _loginImg = loginImg
export const _noImage = noImage


export const APP_NAME = 'Gk8u8o'
export const APP_EMAIL = window.location.origin.includes('localhost') ? 'ck19928198@gmail.com' : 'gk8u8o@gmail.com'
export const DHL_shipper_id = '620910213'
export const _bankAccount = '0000000000000000'


export const _boolean = [false, true]
export const _level = [0, 1, 2, 3, 4, 5, 6, 7]
export const _groupTypes = ['user', 'dealer', 'vendor'];
export const _tag = ['brand', 'category', 'series', 'character', 'contents', 'others']

export const _address = [
    { id: 'country', required: true },
    { id: 'name', required: true },
    { id: 'address1', helper: 'address1Helper', required: true },
    { id: 'address2', helper: 'address2Helper', required: false },
    { id: 'city', required: true },
    { id: 'state', required: false },
    { id: 'zip', required: true },
    { id: 'phone', required: true },
]

export const _volumetricWeight = [
    { id: 'length', label: 'cm' },
    { id: 'width', label: 'cm' },
    { id: 'height', label: 'cm' },
    { id: 'weight', label: 'kg' },
]

export const _status = ['disabled', 'openingSoon', 'preOrder', 'purchased', 'comingSoon', 'inStock', 'outOfStock', 'failed']
export const _msgStatus = ['pending', 'replied', 'complete']
export const _paymentStatus = ['unpaid', 'paid']
export const _orderStatus = ['processing', 'pending', 'shipped', 'complete', 'refunded', 'canceled']
export const _scope = ['day', 'week', 'month', 'year']
export const _locale = ['TW', 'JP', 'CN', 'others']
export const _policy = ['terms', 'privacy']