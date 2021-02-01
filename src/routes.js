import SpeedIcon from '@material-ui/icons/Speed';
import EventIcon from '@material-ui/icons/Event';
import LocalOfferIcon from '@material-ui/icons/LocalOffer';
import ShoppingCartIcon from '@material-ui/icons/ShoppingCart';
import PeopleAltIcon from '@material-ui/icons/PeopleAlt';
import SettingsIcon from '@material-ui/icons/Settings';

import Home from './view/Client/Home'
// import Login from './view/Client/Login'
import ProductList from './view/Client/ProductList'
import FollowList from './view/Client/FollowList';
import Comment from './view/Client/Comment'
import ClientMessage from './view/Client/Message'
import OrderList from './view/Client/OrderList'
import Cart from './view/Client/Cart'
import Checkout from './view/Client/Checkout'
import ClientPolicy from './view/Client/Policy'

import Dashboard from './view/Admin/Dashboard';
import Event from './view/Admin/Event';
import Discount from './view/Admin/Discount'
import Stock from './view/Admin/Stock';
import Brand from './view/Admin/Brand';
import Tag from './view/Admin/Tag';
import Order from './view/Admin/Order';
import Message from './view/Admin/Message';
import User from './view/Admin/User';
import Group from './view/Admin/Group';
import Administrator from './view/Admin/Administrator';
import Email from './view/Admin/Email';
import Currency from './view/Admin/Currency';
import Language from './view/Admin/Language';
import Attention from './view/Admin/Attention';
import Payment from './view/Admin/Payment';
import Logistics from './view/Admin/Logistics';
import Tab from './view/Admin/Tab'
import Template from './view/Admin/Template';
import Policy from './view/Admin/Policy';

export const LISTENER = '/listener';
export const PRINT = '/print';

export const HOME = '/';
export const CART = '/cart';
export const LIST = '/list';
export const NOMATCH = '/nomatch';
export const LOGIN = '/login';
export const CHECKOUT = '/checkout';
export const COMMENT = '/comment';
export const MYMESSAGE = '/message'
export const MYORDER = '/order';
export const FOLLOW = '/follow';
export const TERMS = '/terms';
export const PRIVACY = '/privacy';


export const ADMIN = '/admin';
export const DASHBOARD = `${ADMIN}/dashboard`;
export const EVENT = `${ADMIN}/event`;
export const DISCOUNT = `${ADMIN}/discount`;
export const COUPON = `${ADMIN}/coupon`;
export const STOCK = `${ADMIN}/stock`;
export const BRAND = `${ADMIN}/brand`;
export const TAG = `${ADMIN}/tag`;
export const ORDER = `${ADMIN}/order`;
export const MESSAGE = `${ADMIN}/message`;
export const USER = `${ADMIN}/user`;
export const GROUP = `${ADMIN}/group`;

export const ADMINISTRATOR = `${ADMIN}/administrator`;
export const EMAIL = `${ADMIN}/email`;
export const CURRENCY = `${ADMIN}/currency`;
export const LANGUAGE = `${ADMIN}/language`;
export const PAYMENT = `${ADMIN}/payment`;
export const LOGISTICS = `${ADMIN}/logistics`;
export const ATTENTION = `${ADMIN}/attention`;
export const TAB = `${ADMIN}/tab`;
export const TEMPLATE = `${ADMIN}/template`
export const POLICY = `${ADMIN}/policy`;

var permission = ['read', 'write', 'delete']

export const adminRoutes = [
    {
        id: 'DASHBOARD',
        path: DASHBOARD,
        permission: ['read'],
        component: Dashboard,
        icon: SpeedIcon,
    },
    {
        id: 'MARKTING',
        icon: EventIcon,
        children: [
            { id: 'EVENT', path: EVENT, permission: permission, component: Event },
            { id: 'DISCOUNT', path: DISCOUNT, permission: permission, component: Discount },
        ]
    },
    {
        id: 'PRODUCT',
        icon: LocalOfferIcon,
        children: [
            { id: 'STOCK', path: STOCK, permission: permission, component: Stock },
            { id: 'BRAND', path: BRAND, permission: permission, component: Brand },
            { id: 'TAG', path: TAG, permission: permission, component: Tag },
        ]
    },
    {
        id: 'SALES',
        icon: ShoppingCartIcon,
        children: [
            { id: 'ORDER', path: ORDER, permission: ['read', 'write', 'reply', 'shipment', 'delete'], component: Order },
            { id: 'MESSAGE', path: MESSAGE, permission: permission, component: Message },
        ]
    },
    {
        id: 'MEMBER',
        icon: PeopleAltIcon,
        children: [
            { id: 'USER', path: USER, permission: ['read', 'write'], component: User },
            { id: 'GROUP', path: GROUP, permission: permission, component: Group },
        ]
    },
    {
        id: 'SYSTEM',
        icon: SettingsIcon,
        children: [
            { id: 'ADMINISTRATOR', path: ADMINISTRATOR, permission: permission, component: Administrator },
            { id: 'EMAIL', path: EMAIL, permission: permission, component: Email },
            { id: 'CURRENCY', path: CURRENCY, permission: permission, component: Currency },
            { id: 'LANGUAGE', path: LANGUAGE, permission: permission, component: Language },
            { id: 'PAYMENT', path: PAYMENT, permission: permission, component: Payment },
            { id: 'LOGISTICS', path: LOGISTICS, permission: permission, component: Logistics },
            { id: 'ATTENTION', path: ATTENTION, permission: permission, component: Attention },
            { id: 'TAB', path: TAB, permission: permission, component: Tab },
            { id: 'TEMPLATE', path: TEMPLATE, permission: permission, component: Template },
            { id: 'POLICY', path: POLICY, permission: permission, component: Policy }
        ]
    },
    // {
    //     id: 'report',
    //     children: [
    //         { id: 'search'},
    //         {id: 'views'},
    //         { id: 'sales'},
    //         {id: 'returns'},
    //     ]
    // },
];



export const clientRoutes = [
    // { id: 'login', path: LOGIN, permission: false, component: Login },
    { id: 'followList', path: FOLLOW, permission: true, component: FollowList, state: 'auth' },
    { id: 'myOrder', path: MYORDER, permission: true, component: OrderList, state: 'auth' },
    { id: 'myMessage', path: MYMESSAGE, permission: true, component: ClientMessage, state: 'auth' },
    { id: 'productList', path: LIST, permission: true, component: ProductList, state: 'menu' },
    { id: 'comment', path: COMMENT, permission: true, component: Comment, state: 'menu' },
    { id: 'terms', path: TERMS, permission: false, component: ClientPolicy, state: 'menu' },
    { id: 'privacy', path: PRIVACY, permission: false, component: ClientPolicy, state: 'menu' },
    { id: 'cart ', path: CART, permission: true, component: Cart },
    { id: 'checkout', path: CHECKOUT, permission: true, component: Checkout },
    { id: 'home', path: HOME, permission: true, component: Home, exact: true },
];

