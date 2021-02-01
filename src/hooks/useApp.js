import { useLocation } from 'react-router-dom';

import * as ROUTES from '../routes';

export const useApp = () => {
    const { pathname } = useLocation();
    return { isAdmin: pathname.startsWith(ROUTES.ADMIN) }
};