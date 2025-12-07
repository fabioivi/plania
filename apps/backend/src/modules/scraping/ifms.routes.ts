/**
 * IFMS Academic System Routes Configuration
 * 
 * Centralized route management for IFMS system
 * Base URL: https://academico.ifms.edu.br
 */

export const IFMS_ROUTES = {
  // Base URL
  BASE_URL: 'https://academico.ifms.edu.br',

  // Authentication
  AUTH: {
    LOGIN: '/administrativo/usuarios/login',
    LOGOUT: '/administrativo/usuarios/logout',
    RECOVER_PASSWORD: '/administrativo/usuarios/recuperar_senha',
  },

  // Class Diary (Diário de Classe)
  DIARY: {
    LIST: '/administrativo/professores/diario',
    VIEW: (id: string) => `/administrativo/professores/diario/${id}`,
    CONTENT: (id: string) => `/administrativo/professores/diario/${id}/conteudo`,
    AVALIACOES: (id: string) => `/administrativo/professores/diario/${id}/avaliacoes`,
    SAVE_CONTENT: (contentId: string) => `/administrativo/professores/salvarConteudo/${contentId}`,
  },

  // Teaching Plan (Plano de Ensino)
  TEACHING_PLAN: {
    LIST: (diaryId: string) => `/administrativo/professores/diario/${diaryId}/plano_ensino`,
    VIEW: (diaryId: string, planId: string) => 
      `/administrativo/professores/diario/${diaryId}/plano_ensino/ver/${planId}`,
    EDIT: (diaryId: string, planId: string) => 
      `/administrativo/professores/diario/${diaryId}/plano_ensino/editar/${planId}`,
    ADD: (diaryId: string) => 
      `/administrativo/professores/diario/${diaryId}/plano_ensino/adicionar`,
  },
} as const;

/**
 * Form field selectors for IFMS system
 */
export const IFMS_SELECTORS = {
  // Login Form
  LOGIN: {
    FORM: '#UsuarioLoginForm',
    USERNAME: 'input[name="data[Usuario][login]"]',
    PASSWORD: 'input[name="data[Usuario][senha]"]',
    SUBMIT: 'input[type="submit"].btn-primary',
    ERROR_MESSAGE: '.alert-error',
  },

  // Common Elements
  COMMON: {
    LOADING: '.loading, .spinner',
    SUCCESS_MESSAGE: '.alert-success',
    ERROR_MESSAGE: '.alert-error',
    LOGOUT_BUTTON: 'a[href*="logout"]',
    USER_MENU: '.user-menu, .dropdown-user',
  },
} as const;

/**
 * Helper function to build full URL
 */
export function buildIFMSUrl(path: string): string {
  if (path.startsWith('http')) {
    return path;
  }
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${IFMS_ROUTES.BASE_URL}${cleanPath}`;
}

/**
 * Navigation helper to check if user is logged in
 */
export function isLoginPage(url: string): boolean {
  return url.includes('/login') || url.includes('usuarios/login');
}

/**
 * Check if login was successful
 */
export function isLoggedIn(url: string): boolean {
  return (
    url.includes(IFMS_ROUTES.BASE_URL) &&
    !isLoginPage(url) &&
    url.includes('/administrativo')
  );
}
