// Configuration for different environments
const config = {
    // Local development
    development: {
        apiUrl: 'http://localhost:3000'
    },
    // Production (Hostinger)
    production: {
        apiUrl: 'https://your-hostinger-domain.com' // Replace with your actual Hostinger domain
    }
};

// Determine environment based on hostname
const isProduction = window.location.hostname !== 'localhost' && 
                    window.location.hostname !== '127.0.0.1';

// Export the appropriate configuration
const currentConfig = isProduction ? config.production : config.development;

console.log('Running in', isProduction ? 'PRODUCTION' : 'DEVELOPMENT', 'mode');
console.log('API URL:', currentConfig.apiUrl);