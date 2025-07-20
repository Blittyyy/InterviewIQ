import express from 'express';
import puppeteer from 'puppeteer';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { URL } from 'url';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import * as cheerio from 'cheerio';

dotenv.config();

const app = express();
const port = 3005;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Rate limiting configuration
const rateLimitWindow = parseInt(process.env.RATE_LIMIT_WINDOW) || 60000; // 1 minute default
const rateLimitMaxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 60; // 60 requests default
const scrapeRateLimitWindow = parseInt(process.env.SCRAPE_RATE_LIMIT_WINDOW) || 60000; // 1 minute default
const scrapeRateLimitMaxRequests = parseInt(process.env.SCRAPE_RATE_LIMIT_MAX_REQUESTS) || 10; // 10 requests default

// Create general rate limiter
const limiter = rateLimit({
  windowMs: rateLimitWindow,
  max: rateLimitMaxRequests,
  message: {
    success: false,
    error: 'Too many requests, please try again later.',
    retryAfter: Math.ceil(rateLimitWindow / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.log(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      error: 'Too many requests, please try again later.',
      retryAfter: Math.ceil(rateLimitWindow / 1000)
    });
  }
});

// Create stricter rate limiter for scraping endpoint
const scrapeLimiter = rateLimit({
  windowMs: scrapeRateLimitWindow,
  max: scrapeRateLimitMaxRequests,
  message: {
    success: false,
    error: 'Too many scraping requests, please try again later.',
    retryAfter: Math.ceil(scrapeRateLimitWindow / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.log(`Scraping rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      error: 'Too many scraping requests, please try again later.',
      retryAfter: Math.ceil(scrapeRateLimitWindow / 1000)
    });
  }
});

// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? 
    process.env.ALLOWED_ORIGINS.split(',') : 
    ['http://localhost:3000', 'https://interviewiq.vercel.app']
}));

// Apply rate limiting to all routes
app.use(limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Scraping endpoint with stricter rate limiting
app.get('/scrape', scrapeLimiter, async (req, res) => {
  const { url } = req.query;
  
  if (!url) {
    return res.status(400).json({ 
      success: false,
      error: 'URL is required' 
    });
  }

  try {
    const result = await scrapeWebsite(url);
    
    // Log the full result to the console
    console.log(JSON.stringify(result, null, 2));

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to scrape the website',
      details: error.message
    });
  }
});

// PDF generation endpoint
app.post('/generate-pdf', async (req, res) => {
  console.log('PDF generation request received');
  try {
    const { html, filename } = req.body;
    
    if (!html) {
      console.error('No HTML content provided');
      return res.status(400).json({ error: 'HTML content is required' });
    }

    console.log('Launching Puppeteer browser...');
    const browser = await puppeteer.launch({ 
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });

    try {
      console.log('Creating new page...');
      const page = await browser.newPage();
      
      console.log('Setting HTML content...');
      // Set content and wait for it to load
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      console.log('Generating PDF...');
      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: 'Letter',
        margin: {
          top: '0.5in',
          right: '0.5in',
          bottom: '0.5in',
          left: '0.5in'
        },
        printBackground: true,
        displayHeaderFooter: false
      });

      console.log('PDF generated successfully, size:', pdfBuffer.length);

      // Set response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename || 'report.pdf'}"`);
      
      // Send the PDF buffer
      res.send(Buffer.from(pdfBuffer));

    } finally {
      console.log('Closing browser...');
      await browser.close();
    }

  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ error: `Failed to generate PDF: ${error.message}` });
  }
});

/**
 * Main scraping function to orchestrate the entire process.
 * @param {string} initialUrl - The starting URL to scrape.
 * @returns {Promise<object>} - The structured data extracted from the website.
 */
async function scrapeWebsite(initialUrl) {
  const browser = await puppeteer.launch({ 
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox'] 
  });

  try {
    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(30000);

    // Simple: Just scrape the main page
    await page.goto(initialUrl, { waitUntil: 'domcontentloaded' });
    
    // Get the page content
    const content = await page.evaluate(() => {
      const body = document.body;
      if (!body) return '';
      
      // Remove script and style elements
      const scripts = document.querySelectorAll('script, style, noscript');
      scripts.forEach(el => el.remove());
      
      return body.innerText || body.textContent || '';
    });

    console.log('[Scraper] Content length:', content.length);
    console.log('[Scraper] Content preview:', content.substring(0, 500));

    return {
      combinedText: content,
      rawPages: [{ url: initialUrl, content }],
    };
  } finally {
    await browser.close();
  }
}

/**
 * Finds relevant internal links on a page.
 * @param {import('puppeteer').Page} page - The Puppeteer page object.
 * @param {string} baseUrl - The base URL of the website.
 * @returns {Promise<string[]>} A list of relevant URLs.
 */
async function discoverRelevantLinks(page, baseUrl) {
  const relevantKeywords = [
    'about', 'company', 'who-we-are', 'team', 'careers', 'culture', 
    'blog', 'news', 'press', 'services', 'solutions', 'products'
  ];

  const allLinks = await page.$$eval('a', anchors => anchors.map(a => a.href));
  
  const internalLinks = allLinks
    .map(href => {
      try {
        return new URL(href, baseUrl).href;
      } catch (e) {
        return null;
      }
    })
    .filter(href => href && href.startsWith(baseUrl));

  return [...new Set(internalLinks)]
    .filter(link => relevantKeywords.some(keyword => link.includes(keyword)))
    .slice(0, 8); // Increased to 8 most relevant pages
}

/**
 * Scrapes a single page and cleans its content.
 * @param {import('puppeteer').Browser} browser - The Puppeteer browser instance.
 * @param {string} url - The URL to scrape.
 * @returns {Promise<string>} The cleaned text content of the page.
 */
async function scrapeAndCleanPage(browser, url, fallback = false) {
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

  // Wait for key selectors to ensure content is loaded
  try {
    await page.waitForSelector('main, article, .main-content, #main, .content, section, .about, .company, .page, .page-content, .bio, .team, .leadership, .profile', { timeout: 10000 });
  } catch (e) {}

  // Attempt to close cookie banners/popups
  try {
    await page.evaluate(() => {
      const selectors = ['.cookie-banner', '.cookie-consent', '[id*="cookie"]', '[class*="cookie"]', '.modal', '.popup'];
      selectors.forEach(sel => {
        document.querySelectorAll(sel).forEach(el => {
          if (el && el.style) el.style.display = 'none';
        });
      });
      // Click common accept buttons
      const btns = Array.from(document.querySelectorAll('button, input[type="button"], input[type="submit"]'));
      btns.forEach(btn => {
        const txt = btn.innerText?.toLowerCase() || btn.value?.toLowerCase() || '';
        if (txt.includes('accept') || txt.includes('agree') || txt.includes('close')) {
          try { btn.click(); } catch (e) {}
        }
      });
    });
  } catch (e) {}

  // Wait a bit for dynamic content
  await page.waitForTimeout(2000);

  let cleanContent;
  if (fallback) {
    // Fallback: extract all <main>, <article>, <section> text
    cleanContent = await page.evaluate(() => {
      let text = '';
      ['main', 'article', 'section', '.content', '.container', '.about', '.company', '#main', '#content', '.page', '.page-content', '.bio', '.team', '.leadership', '.profile'].forEach(tag => {
        document.querySelectorAll(tag).forEach(el => {
          text += ' ' + el.innerText;
        });
      });
      return text.replace(/(\s\s+)/g, ' ').trim();
    });
  } else {
    cleanContent = await page.evaluate(() => {
      const selectorsToRemove = 'header, footer, nav, aside, .navbar, .footer, #header, #footer, script, style, form, .cookie-banner';
      document.querySelectorAll(selectorsToRemove).forEach(el => el.remove());
      let text = '';
      const containers = [
        'main', 'article', 'section', '.content', '.container', '.about', '.company', '#main', '#content', '.page', '.page-content', '.bio', '.team', '.leadership', '.profile'
      ];
      containers.forEach(sel => {
        document.querySelectorAll(sel).forEach(el => {
          text += ' ' + el.innerText;
        });
      });
      if (!text.trim()) {
        text = document.body.innerText;
      }
      return text.replace(/(\s\s+)/g, ' ').trim();
    });
  }

  // Log the scraped content for this page
  console.log(`\n--- Scraped content for ${url} ---\n`);
  console.log(cleanContent.slice(0, 2000)); // Log first 2000 chars

  await page.close();
  return cleanContent;
}

/**
 * Extracts a relevant text block based on keywords.
 * @param {string} text - The combined text from all pages.
 * @param {string[]} keywords - Keywords to identify the section.
 * @returns {string | null} A snippet of the relevant section or null.
 */
function extractSection(text, keywords) {
    const sentences = text.split(/(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?)\s/);
    let relevantSentences = [];
    let foundKeywords = new Set();

    for (const sentence of sentences) {
        for (const keyword of keywords) {
            if (sentence.toLowerCase().includes(keyword) && !foundKeywords.has(keyword)) {
                relevantSentences.push(sentence);
                foundKeywords.add(keyword);
            }
        }
    }
    
    return relevantSentences.length > 0 ? relevantSentences.join(' ').substring(0, 2000) : null;
}

/**
 * Extracts news articles from the scraped pages.
 * @param {Array<{url: string, content: string}>} pages - The scraped pages.
 * @returns {Array<{title: string, url: string, date: string | null}>} A list of news articles.
 */
function extractNews(pages) {
    const news = [];
    const newsKeywords = ['/blog', '/news', 'press-releases'];
    const newsPages = pages.filter(p => newsKeywords.some(kw => p.url.includes(kw)));
    
    for(const page of newsPages) {
        // Enhanced: extract anchor tags as news articles
        if (page.rawHtml) {
            // If rawHtml is available, parse it for anchors
            const cheerio = require('cheerio');
            const $ = cheerio.load(page.rawHtml);
            $('a').each((_, el) => {
                const title = $(el).text().trim();
                const href = $(el).attr('href');
                if (title.length > 20 && title.length < 150 && href && !href.startsWith('#')) {
                    news.push({
                        title,
                        url: href.startsWith('http') ? href : new URL(href, page.url).href,
                        date: null
                    });
                }
            });
        } else {
            // Fallback: use previous logic
            const potentialTitles = page.content.split('\n').filter(line => line.length > 20 && line.length < 150);
            potentialTitles.slice(0, 3).forEach(title => {
                news.push({
                    title: title.trim(),
                    url: page.url,
                    date: null // Date extraction is complex and unreliable without specific selectors
                });
            });
        }
    }
    return news.length > 0 ? news : null;
}

async function scrapeWikipedia(companyName) {
  try {
    const wikiUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(companyName.replace(/ /g, '_'))}`;
    const { data } = await axios.get(wikiUrl);
    const $ = cheerio.load(data);
    const infobox = $('.infobox.vcard');
    if (!infobox.length) return null;
    let basics = {};
    infobox.find('tr').each((_, el) => {
      const label = $(el).find('th').text().trim().toLowerCase();
      const value = $(el).find('td').text().trim();
      if (label.includes('founded')) basics.foundingYear = value.split('\n')[0];
      if (label.includes('headquarters')) basics.headquarters = value.split('\n')[0];
      if (label.includes('ceo') || label.includes('founder') || label.includes('key people')) basics.ceoName = value.split('\n')[0];
      if (label.includes('number of employees')) basics.companySize = value.split('\n')[0];
    });
    // Mission: try to find a mission statement in the lead or infobox
    const mission = $('p').first().text().trim();
    if (mission) basics.missionStatement = mission;
    basics.companyName = companyName;
    return basics;
  } catch (e) {
    return null;
  }
}

async function scrapeLinkedIn(companyName) {
  try {
    // LinkedIn public search URL
    const searchUrl = `https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(companyName)}`;
    const { data } = await axios.get(searchUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const $ = cheerio.load(data);
    // Try to find the first company result
    const companyLink = $('a.app-aware-link').attr('href');
    if (!companyLink) return null;
    const { data: companyPage } = await axios.get(companyLink, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const $$ = cheerio.load(companyPage);
    let basics = { companyName };
    // Try to extract basics from the LinkedIn company page
    $$('.org-top-card-summary-info-list__info-item').each((_, el) => {
      const text = $$(el).text().trim();
      if (/\d{4}/.test(text) && !basics.foundingYear) basics.foundingYear = text;
      if (/employees/i.test(text)) basics.companySize = text;
      if (/headquarters/i.test(text)) basics.headquarters = text;
    });
    // CEO: try to find in the page
    const ceo = $$('.org-top-card-summary__title').text().trim();
    if (ceo) basics.ceoName = ceo;
    // Mission: try to find in the about section
    const mission = $$('.break-words').first().text().trim();
    if (mission) basics.missionStatement = mission;
    return basics;
  } catch (e) {
    return null;
  }
}

function extractCompanyNameFromUrl(url) {
  try {
    const { hostname } = new URL(url);
    const parts = hostname.split('.');
    if (parts.length > 1) return parts[parts.length - 2];
    return hostname;
  } catch {
    return '';
  }
}

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'scraping-service',
    port: port,
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(port, () => {
  console.log(`Scraping service running on port ${port}`);
  console.log('Rate limiting configuration:');
  console.log(`  General: ${rateLimitMaxRequests} requests per ${rateLimitWindow / 1000} seconds`);
  console.log(`  Scraping: ${scrapeRateLimitMaxRequests} requests per ${scrapeRateLimitWindow / 1000} seconds`);
});
