// js/config.js
const CONFIG = {
    // Detectar entorno
    isLocal: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
    isRender: window.location.hostname.includes('render.com'),

    // URLs de API
    get apiUrl() {
        if (this.isRender) {
            return 'https://sistema-escolar-inseguro.onrender.com';
        }
        if (this.isLocal) {
            return 'http://localhost:3000';
        }
        return '';
    }
};

// Hacer CONFIG global
window.CONFIG = CONFIG;