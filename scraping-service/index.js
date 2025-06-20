import express from 'express';
import puppeteer from 'puppeteer';
import cors from 'cors';
import dotenv from 'dotenv';
import { URL } from 'url';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const port = 3005;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? 
    process.env.ALLOWED_ORIGINS.split(',') : 
    ['http://localhost:3000', 'https://interviewiq.vercel.app']
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Scraping endpoint
app.get('/scrape', async (req, res) => {
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
    await page.setDefaultNavigationTimeout(60000);

    // 1. Load the Homepage
    await page.goto(initialUrl, { waitUntil: 'domcontentloaded' });
    const baseUrl = new URL(initialUrl).origin;

    // 2. Discover Relevant Pages
    const relevantLinks = await discoverRelevantLinks(page, baseUrl);
    const pagesToScrape = [...new Set([initialUrl, ...relevantLinks])];
    
    // 3. Scrape and Clean Content from each page
    const rawPages = [];
    for (const url of pagesToScrape) {
      try {
        const content = await scrapeAndCleanPage(browser, url);
        rawPages.push({ url, content });
      } catch (e) {
        console.warn(`Failed to scrape ${url}: ${e.message}`);
      }
    }

    // 4. Structure Extracted Data
    const combinedText = rawPages.map(p => p.content).join('\n\n');
    const finalResult = {
      companyBasics: extractSection(combinedText, ['founded', 'ceo', 'headquarters', 'employees', 'mission']),
      productsAndServices: extractSection(combinedText, ['product', 'service', 'solution', 'offering', 'platform']),
      cultureAndValues: extractSection(combinedText, ['culture', 'values', 'our team', 'careers']),
      recentNews: extractNews(rawPages),
      rawPages: rawPages,
    };

    return finalResult;

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
    .slice(0, 5); // Limit to 5 most relevant pages
}

/**
 * Scrapes a single page and cleans its content.
 * @param {import('puppeteer').Browser} browser - The Puppeteer browser instance.
 * @param {string} url - The URL to scrape.
 * @returns {Promise<string>} The cleaned text content of the page.
 */
async function scrapeAndCleanPage(browser, url) {
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
  
  const cleanContent = await page.evaluate(() => {
    const selectorsToRemove = 'header, footer, nav, aside, .navbar, .footer, #header, #footer, script, style, form, .cookie-banner';
    document.querySelectorAll(selectorsToRemove).forEach(el => el.remove());
    
    const mainContent = document.querySelector('main, article, .main-content, #main, .content');
    const text = mainContent ? mainContent.innerText : document.body.innerText;
    return text.replace(/(\s\s+)/g, ' ').trim();
  });

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
        // Simple extraction of the first few lines as potential titles
        const potentialTitles = page.content.split('\n').filter(line => line.length > 20 && line.length < 150);
        potentialTitles.slice(0, 3).forEach(title => {
            news.push({
                title: title.trim(),
                url: page.url,
                date: null // Date extraction is complex and unreliable without specific selectors
            });
        });
    }
    return news.length > 0 ? news : null;
}

// Start server
app.listen(port, () => {
  console.log(`Scraping service running on port ${port}`);
});
