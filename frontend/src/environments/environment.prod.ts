export const environment = {
  production: true,
  apiUrl: (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
    ? 'http://localhost:8080'
    : 'https://jobconnect-team2-api.azurewebsites.net'
};
