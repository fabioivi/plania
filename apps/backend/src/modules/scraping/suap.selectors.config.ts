export const SUAP_BASE_URL = 'https://suap.ifms.edu.br';

export const SUAP_ROUTES = {
    AUTH: {
        LOGIN: '/accounts/login/',
        LOGOUT: '/accounts/logout/',
        DASHBOARD: '/', // Usually redirects here after login
    },
};

export const SUAP_SELECTORS = {
    LOGIN: {
        FORM: 'form',
        USERNAME: '#id_username',
        PASSWORD: '#id_password',
        SUBMIT: 'input[type="submit"], button[type="submit"], input[value="Acessar"]',
        ERROR_MESSAGE: '.errornote, .alert-danger, .errorlist li',
        RECAPTCHA: '.g-recaptcha',
        TWO_FACTOR: '#id_token',
    },
    DASHBOARD: {
        LOGOUT_LINK: 'a[href*="/accounts/logout/"]',
    },
};

export const buildSuapUrl = (path: string): string => {
    return `${SUAP_BASE_URL}${path.startsWith('/') ? path : '/' + path}`;
};

export const isSuapLoginPage = (url: string): boolean => {
    return url.includes('/accounts/login/');
};

export const isSuapLoggedIn = (url: string): boolean => {
    // If we are NOT on the login page and NOT on the logout page, we assume logged in for now
    // Ideally, check for a specific dashboard element or URL
    return !url.includes('/accounts/login/') && !url.includes('/accounts/logout/');
};
