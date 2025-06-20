const fs = require('fs');
const path = require('path');

const envContent = `# Server Configuration
PORT=3001

# CORS Configuration (comma-separated list of allowed origins)
ALLOWED_ORIGINS=http://localhost:3000,https://interviewiq.vercel.app

# Puppeteer Configuration
PUPPETEER_TIMEOUT=30000
MAX_CONCURRENT_SCRAPES=3

# Rate Limiting Configuration
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_MAX_REQUESTS=300
SCRAPE_RATE_LIMIT_WINDOW=60000
SCRAPE_RATE_LIMIT_MAX_REQUESTS=20

# Cache Configuration (optional, for future use)
CACHE_DURATION=3600000  # 1 hour in milliseconds
`;

const envPath = path.join(__dirname, '.env');

// Create .env file if it doesn't exist
if (!fs.existsSync(envPath)) {
  fs.writeFileSync(envPath, envContent);
  console.log('.env file created successfully!');
} else {
  console.log('.env file already exists. Skipping creation.');
} 