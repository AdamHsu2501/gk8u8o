import React, { createContext, useContext, useEffect, useState, useReducer, useRef, useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import countriesList from 'countries-list'
import detectBrowserLanguage from 'detect-browser-language';

import * as ROUTES from '../routes'
import Firebase from './config';
import { getLabel } from '../utils/getLabel'
import { getDiscount } from '../utils/getDiscount'
import { getSKU } from '../utils/getSKU'

export default Firebase;
const firestore = Firebase.firestore();

export const _user = "user",
	_ranking = 'salesRank',
	_stock = "stock",
	_order = 'order',
	_message = 'message',
	_template = 'template';

const AuthContext = createContext();
export const useFirebase = () => {
	return useContext(AuthContext);
};

const useAuth = () => {
	const [loading, setLoading] = useState(true)
	const [state, setState] = useState(null);

	const signOut = () => {
		return Firebase.auth().signOut().then(() => {
			setState(null);
		});
	};

	useEffect(() => {
		setLoading(true)
		const unsubscribe = Firebase.auth().onAuthStateChanged(user => {
			if (user) {
				firestore.collection(_user).doc(user.uid).update({
					last: Date.now(),
					photoURL: user.photoURL,
				})

				firestore.collection(_user).doc(user.uid).onSnapshot(doc => {
					// console.log('useAuth fetch')
					if (doc.exists) {
						var data = doc.data()
						setState(data)
					}
					setLoading(false)
				})
			} else {
				setLoading(false)
				setState(user)
			}
		})
		return () => unsubscribe();
	}, [])

	return {
		loading: loading,
		state: state,
		signOut: signOut,
	}
}

const useLocale = () => {
	// const [loading, setLoading] = useState(true)
	const [country, setCountry] = useState('US')

	useEffect(() => {
		// console.log('useLocale fetch')
		fetch('https://us-central1-gk8u8ogkm.cloudfunctions.net/geolocation', { method: 'POST' })
			.then(result => result.json())
			.then(res => {
				setCountry(res.country)
				// setLoading(false)
			})
	}, [])

	return {
		// loading: loading,
		country: country,
	}
}

const useSystem = () => {
	const exchangeRates = useFirestoreQuery({
		ref: firestore.doc('system/currency'),
	})

	const languages = useFirestoreQuery({
		ref: firestore.doc('system/language'),
		type: 'array',
		sort: 'order',
	})
	const discounts = useFirestoreQuery({
		ref: firestore.doc('system/discount'),
		type: 'array',
		sort: 'MOQ',
		desc: true,
	})

	const attentions = useFirestoreQuery({
		ref: Firebase.firestore().collection('attention').where('enable', "==", true).orderBy('date', 'desc'),
	})
	const brands = useFirestoreQuery({
		ref: Firebase.firestore().doc('system/brand'),
		type: 'array',
		sort: 'order',
	})
	const events = useFirestoreQuery({
		ref: Firebase.firestore().doc('system/event'),
		type: 'array',
		sort: 'order',
	})
	const tabs = useFirestoreQuery({
		ref: Firebase.firestore().doc('system/tab'),
		type: 'array',
		sort: 'order',
	})

	return {
		loading: exchangeRates.loading || languages.loading || discounts.loading,
		data: {
			exchangeRates: exchangeRates.data,
			discounts: discounts.data,
			languages: languages.data,
			attentions: attentions.data || [],
			brands: brands.data || [],
			events: events.data || [],
			tabs: tabs.data || [],
		}
	}
}

export function ProvideFirebase({ children }) {
	// console.log('ProvideFirebase')
	const auth = useAuth();
	const locale = useLocale();
	const system = useSystem();
	// const exchangeRates = useFirestoreQuery({
	// 	ref: firestore.doc('system/currency'),
	// })

	// const languages = useFirestoreQuery({
	// 	ref: firestore.doc('system/language'),
	// 	type: 'array',
	// 	sort: 'order',
	// })
	// const discounts = useFirestoreQuery({
	// 	ref: firestore.doc('system/discount'),
	// 	type: 'array',
	// 	sort: 'MOQ',
	// 	desc: true,
	// })

	const [langCode, setLangCode] = useState(detectBrowserLanguage().toLowerCase());
	const handleLanguage = id => {
		setLangCode(id)
	}

	const handleLabel = (value, lang) => {
		var code = lang || langCode

		return getLabel(value, code)
	}

	const updateFirestore = (path, data, merge, change) => {
		var batch = firestore.batch()
		batch.set(firestore.doc(path), data, { merge: merge })
		if (!!change) {
			batch.set(
				firestore.collection(`${path}/log`).doc(),
				{
					date: Date.now(),
					user: {
						id: auth.state.id,
						email: auth.state.email,
					},
					type: 'update',
					target: data.id || Object.keys(data)[0],
					change: change
				}
			)
		}

		return batch.commit()
			.catch(error => {
				console.log('updateFirestore', error)
			})
	}

	const deleteFirestore = (path, field, change) => {
		var batch = firestore.batch()
		var ref = firestore.doc(path)

		if (!!field) {
			batch.update(ref, { [field]: Firebase.firestore.FieldValue.delete() })
			firestore.collectionGroup('log').where('target', '==', field).get().then(snap => {
				var deleteBatch = firestore.batch()
				snap.docs.forEach(doc => {
					deleteBatch.delete(doc.ref)
				})
				deleteBatch.commit()
			})
		} else {
			batch.delete(ref)

			var deleteFn = Firebase.functions().httpsCallable('recursiveDelete');
			deleteFn({ path: `${path}/log` })
				.then(function (result) {
					console.log('Delete success: ' + JSON.stringify(result));
				})
				.catch(function (err) {
					console.log('Delete failed, see console,');
					console.warn(err);
				});
		}

		if (!!change) {
			batch.set(
				firestore.collection('log').doc(),
				{
					date: Date.now(),
					user: {
						id: auth.state.id,
						email: auth.state.email,
					},
					type: 'delete',
					target: field || path.split('/')[1],
					path: path,
					change: change
				}
			)
		}

		return batch.commit()
			.catch(error => {
				console.log('deleteFirestore', error)
			})
	}

	const loading = auth.loading || system.loading // locale.loading || exchangeRates.loading || languages.loading || discounts.loading

	if (loading) {
		return <div>loading...</div>
	}

	const { exchangeRates } = system.data

	var country = countriesList.countries[locale.country]
	var currency = Object.keys(exchangeRates).includes(country.currency) ? country.currency : 'USD'
	var exchangeRate = exchangeRates[currency]

	return (
		<AuthContext.Provider value={{
			...system.data,
			auth: auth.state,
			signOut: auth.signOut,
			country: locale.country,

			// exchangeRates: exchangeRates,
			exchangeRate: exchangeRate,
			currency: currency,
			// discounts: discounts,
			// languages: languages,
			langCode: langCode,
			handleLanguage: handleLanguage,
			handleLabel: handleLabel,
			updateFirestore: updateFirestore,
			deleteFirestore: deleteFirestore,
		}}>
			{children}
		</AuthContext.Provider>
	);
}

const InfoContext = createContext();
export const useInfo = () => {
	return useContext(InfoContext);
};


export function ProvideInfo({ auth, country, currency, exchangeRate, discounts, children }) {
	// console.log('ProvideInfo')
	// const attentions = useFirestoreQuery({
	// 	ref: Firebase.firestore().collection('attention').where('enable', "==", true).orderBy('date', 'desc'),
	// })
	// const brands = useFirestoreQuery({
	// 	ref: Firebase.firestore().doc('system/brand'),
	// 	type: 'array',
	// 	sort: 'order',
	// })
	// const events = useFirestoreQuery({
	// 	ref: Firebase.firestore().doc('system/event'),
	// 	type: 'array',
	// 	sort: 'order',
	// })
	// const tabs = useFirestoreQuery({
	// 	ref: Firebase.firestore().doc('system/tab'),
	// 	type: 'array',
	// 	sort: 'order',
	// })

	const [shopCart, setShopCart] = useState({
		loading: true,
		list: [],
		qty: 0,
	})

	useEffect(() => {
		if (!!auth) {
			Firebase.firestore().collection(_stock).where(`cart.${auth.id}`, '>', 0).get().then(snap => {
				// console.log('ProvideInfo fetch')

				var arr = snap.docs.map(doc => {
					var data = doc.data()
					var obj = getSKU(data, exchangeRate, currency, country, auth.group)

					var num = data.deduction && data.cart[auth.id] > data.quantity ? data.quantity : data.cart[auth.id]

					return {
						...obj,
						qty: num,
						selected: !obj.error,
						rewards: obj.type === 'event' ? 0 : obj.rewardPoints * num
					}
				})

				var obj = getDiscount(arr, discounts, country, exchangeRate, auth.points)

				setShopCart({
					loading: false,
					list: obj.items,
					qty: obj.items.reduce((a, c) => {
						a += c.qty
						return a
					}, 0)
				})
			})
		} else {
			setShopCart(prev => ({
				...prev,
				loading: false
			}))
		}
	}, [auth, country, currency, discounts, exchangeRate])

	const handleShopCart = useCallback((action, data) => {
		setShopCart(prev => {
			var { list } = prev

			if (action === 'error') {
				return {
					...prev,
					list: prev.list.map((item, key) => {
						var obj = data.find(target => target.id === item.id)
						return {
							...item,
							...obj,
						}
					})
				}
			} else {
				var index = list.findIndex(item => item.id === data.id)
				data.selected = true

				if (action === 'add') {
					if (index === -1) {
						list.push(data)
					} else {
						list[index].qty += data.qty;
						if (data.type !== 'event') {
							list[index].rewards += data.rewardPoints
						}
					}

					Firebase.firestore().collection(_stock).doc(data.id).update({
						[`cart.${auth.id}`]: Firebase.firestore.FieldValue.increment(data.qty)
					})
				}

				if (action === 'set' && index !== -1) {
					var error = data.deduction && data.quantity + data.prevD < data.qty ? 'outOfQty' : list[index].error

					list[index] = {
						...data,
						error: error,
						rewards: data.type === 'event' ? 0 : data.rewardPoints * data.qty
					}

					Firebase.firestore().collection(_stock).doc(data.id).update({
						cart: { [auth.id]: data.qty }
					})
				}

				if (action === 'delete' && index !== -1) {
					list.splice(index, 1);
					Firebase.firestore().collection(_stock).doc(data.id).update({
						[`cart.${auth.id}`]: Firebase.firestore.FieldValue.delete()
					})
				}
			}
			var obj = getDiscount(list, discounts, country, exchangeRate, auth.points)
			var qty = obj.items.map(item => item.qty).reduce((a, c) => a + c, 0)

			return {
				...prev,
				list: obj.items,
				qty: qty
			}
		})

	}, [auth, discounts, country, exchangeRate])

	const handleSelect = (event, id) => {
		var checked = event.target.checked
		var list = shopCart.list

		if (!id) {
			list = list.map(item => ({
				...item,
				selected: checked
			}))
		} else {
			var index = list.findIndex(item => item.id === id)
			list[index].selected = checked
		}

		var obj = getDiscount(list, discounts, country, exchangeRate, auth.points)

		setShopCart(prev => ({
			...prev,
			list: obj.items,
			qty: prev.qty
		}))
	}

	return (
		<InfoContext.Provider value={{
			// attentions: attentions.data || [],
			// brands: brands.data || [],
			// events: events.data || [],
			// tabs: tabs.data || [],
			shopCart: shopCart,
			handleShopCart: handleShopCart,
			handleSelect: handleSelect,
		}}>
			{children}
		</InfoContext.Provider>
	);
}

export const handleGroups = (bool, data) => {
	var batch = firestore.batch()

	return firestore.collection(_user).where('group.id', '==', data.id).get().then(snap => {
		snap.forEach(doc => {
			var ref = firestore.collection(_user).doc(doc.id)
			batch.update(ref, { group: bool ? data : null })
		})

		return batch.commit()
	})
}

export const handleTags = (bool, tagData) => {

	var tabRef = firestore.doc('system/tab')
	return Promise.all([
		firestore.collection(_stock).where('tagQuery', 'array-contains', tagData.id).get(),
		tabRef.get()
	]).then(results => {
		var batch = firestore.batch()
		var FieldValue = Firebase.firestore.FieldValue

		//ex: brand tag.brand, data.brand, tags[brand], tagQuery[brand]
		results[0].forEach(doc => {
			var ref = firestore.collection(_stock).doc(doc.id)
			var data = doc.data()
			const { tag, tags } = data

			var obj = {
				update: Date.now()
			}
			var deleteObj = {}
			var nameObj = Object.keys(tagData.displayName).sort().reduce((a, c) => {
				return {
					...a,
					[c]: tagData.displayName[c]
				}
			}, {})

			var arr = Object.keys(tag).filter(key => tag[key].includes(tagData.id))
			var newJSON = JSON.stringify({
				id: tagData.id,
				displayName: tagData.displayName
			})
			var oldJSON = JSON.stringify({
				id: tagData.id,
				displayName: tags[tagData.id]
			})

			if (bool) {
				arr.forEach(item => {
					deleteObj[item] = FieldValue.arrayRemove(oldJSON)
					obj[item] = FieldValue.arrayUnion(newJSON)
				})
				obj[`tags.${tagData.id}`] = nameObj
			} else {
				arr.forEach(item => {
					deleteObj[item] = FieldValue.arrayRemove(newJSON)
					obj[item] = FieldValue.arrayRemove(tagData.id)
					obj[`tag.${item}`] = FieldValue.arrayRemove(tagData.id)
				})
				obj['tagQuery'] = FieldValue.arrayRemove(tagData.id)
				obj[`tags.${tagData.id}`] = FieldValue.delete()
			}
			batch.update(ref, deleteObj)
			batch.update(ref, obj)
		})

		if (results[1].exists) {
			var data = results[1].data()
			var obj = Object.values(data).find(item => item.tag.id === tagData.id)
			if (!!obj) {
				if (bool) {
					batch.update(tabRef, {
						[`${obj.id}.tag.displayName`]: tagData.displayName
					})
				} else {
					batch.update(tabRef, {
						[obj.id]: FieldValue.delete()
					})
				}

			}
		}

		return batch.commit()
	})
}


export const handleEmail = (email, type, target) => {
	var sendEmail = Firebase.functions().httpsCallable('sendEmail')

	return firestore.collection('system').doc('email').get().then(snap => {
		if (snap.exists) {
			var data = snap.data()
			var bcc = Object.values(data)
				.filter(user => user[type].includes(target))
				.map(user => user.email).join(',')

			return sendEmail({
				list: [{
					...email,
					bcc: bcc
				}]
			})

		} else {
			return sendEmail({ list: [email] })
		}
	})
}

export const handleEmails = (list) => {
	var sendEmail = Firebase.functions().httpsCallable('sendEmail')
	return sendEmail({ list: list })
}

export const updateStorage = (prefix, name, file) => {
	return Firebase.storage().ref().child(`${prefix}/${name}`).put(file)
		.then(snap => (
			snap.ref.getDownloadURL()
		))
		.then(url => (
			{ name: name, preview: url }
		))
		.catch(error => {
			console.log('updateStorage', error)
		})
}

export const deleteStorage = (prefix) => {
	var deleteProcess = Firebase.functions().httpsCallable('deleteStorage')
	return deleteProcess({ prefix: prefix }).then(() => {
		console.info('deleteStorage success')
	}).catch(error => {
		console.error('deleteStorage error', error)
	})
}


const reducer = (state, action) => {
	switch (action.type) {
		case "idle":
			return { loading: false, data: undefined, error: undefined };
		case "loading":
			return { loading: true, data: undefined, error: undefined };
		case "success":
			return { loading: false, data: action.payload, error: undefined };
		case "error":
			return { loading: false, data: undefined, error: action.payload };

		default:
			throw new Error("invalid action");
	}
}

export const useFirestoreQuery = (query) => {
	let history = useHistory()
	const initialState = {
		loading: true, // !!query.ref,
		data: undefined,
		error: undefined
	};

	const [state, dispatch] = useReducer(reducer, initialState);

	const queryCached = useMemoCompare(query, prevQuery => {

		var isEqual = Object.keys(query).filter(key => key !== 'data').every(key => {
			if (!prevQuery) {
				return false
			} else {
				if (typeof (query[key]) === 'object') {
					return query[key].isEqual(prevQuery[key])
				} else {
					return query[key] === prevQuery[key]
				}
			}
		})
		return prevQuery && query && isEqual;
	});


	useEffect(() => {
		if (!!queryCached.data) {
			// dispatch({ type: "idle" });
			dispatch({ type: "success", payload: queryCached.data });
			return;
		}

		dispatch({ type: "loading" });

		return queryCached.ref.onSnapshot(
			snap => {
				// console.log('fetch', snap)

				if (!snap.doc && !snap.exists && queryCached.required) {
					return history.push({
						pathname: ROUTES.NOMATCH,
						state: 404
					})
				}

				const data = snap.docs
					? getCollectionData(snap, queryCached.sort, queryCached.desc)
					: getDocData(snap, queryCached.type, queryCached.sort, queryCached.desc);



				dispatch({ type: "success", payload: data });
			},
			error => {
				dispatch({ type: "error", payload: error });
			}
		);
	}, [queryCached, history]);

	return state;
}

function getDocData(doc, type, sort, desc) {
	if (doc.exists) {
		var data = doc.data()
		if (type === 'array') {
			data = Object.values(data)
			return !sort ? data : data.sort((a, b) => desc ? b[sort] - a[sort] : a[sort] - b[sort])
		} else {
			return data
		}
	} else {
		return null
	}
}

function getCollectionData(collection, sort, desc) {
	var arr = collection.docs.map(getDocData)
	return !sort ? arr : arr.sort((a, b) => desc ? b[sort] - a[sort] : a[sort] - b[sort])
}

function useMemoCompare(next, compare) {
	const previousRef = useRef();
	const previous = previousRef.current;

	const isEqual = compare(previous, next);

	useEffect(() => {
		if (!isEqual) {
			previousRef.current = next;
		}
	});

	return isEqual ? previous : next;
}