import { useLocation } from "react-router-dom";

const Listener = () => {
    const { search } = useLocation()
    var a = decodeURIComponent(search).replace('?', '').split('=')
    var CVS = window.localStorage.getItem('CVS')
    if (!CVS) {
        window.localStorage.setItem(a[0], a[1])
    }
    window.close();

    return null
}

export default Listener