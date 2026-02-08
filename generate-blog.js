#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { existsSync, mkdirSync, readFileSync, writeFileSync } = require('fs');

// ==============================
// LOAD SINGLE MASTER CONFIG
// ==============================

let MASTER_CONFIG = {};

try {
    const masterConfigContent = readFileSync('./master-config.json', 'utf8');
    MASTER_CONFIG = JSON.parse(masterConfigContent);
    console.log('✅ Loaded single master-config.json');

    // Set defaults if not present
    if (!MASTER_CONFIG.site) {
        MASTER_CONFIG.site = {
            name: 'Conversion Hub',
            url: 'https://example.com',
            logo: '📐',
            tagline: 'Accurate Conversions Made Easy',
            description: 'Free conversion tools and guides'
        };
    }

    if (!MASTER_CONFIG.theme) {
        MASTER_CONFIG.theme = {
            primary: '#2e7d32',
            dark: '#1b5e20',
            light: '#4caf50',
            background: '#ffffff',
            surface: '#f5f5f5',
            text: '#333333'
        };
    }

    if (!MASTER_CONFIG.converters) MASTER_CONFIG.converters = [];
    if (!MASTER_CONFIG.blogs) MASTER_CONFIG.blogs = [];
    if (!MASTER_CONFIG.pages) MASTER_CONFIG.pages = {};

} catch (error) {
    console.error('❌ Error loading master-config.json:', error.message);
    console.log('📝 Creating default master-config.json...');
    createDefaultMasterConfig();
    process.exit(1);
}

// ==============================
// UTILITY FUNCTIONS
// ==============================

function ensureDirectory(dir) {
    if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
    }
}

async function cleanDirectory(dir) {
    if (existsSync(dir)) {
        const files = await fs.promises.readdir(dir);
        for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = await fs.promises.stat(filePath);

            if (stat.isDirectory()) {
                await cleanDirectory(filePath);
                await fs.promises.rmdir(filePath);
            } else {
                await fs.promises.unlink(filePath);
            }
        }
    }
}

function formatDate(date = new Date()) {
    return date.toISOString().split('T')[0];
}

function slugify(text) {
    return text.toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/--+/g, '-');
}

// ==============================
// STYLES - RESPONSIVE DESIGN
// ==============================

const STYLES = `
/* ===== MOBILE-FIRST RESPONSIVE DESIGN ===== */
:root {
    --primary: ${MASTER_CONFIG.theme.primary};
    --primary-dark: ${MASTER_CONFIG.theme.dark};
    --primary-light: ${MASTER_CONFIG.theme.light};
    --background: ${MASTER_CONFIG.theme.background};
    --surface: ${MASTER_CONFIG.theme.surface};
    --text: ${MASTER_CONFIG.theme.text};
    --border: #e0e0e0;
    --success: #4caf50;
    --warning: #ff9800;
    --danger: #f44336;
    --info: #2196f3;
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

html {
    font-size: 16px;
    -webkit-text-size-adjust: 100%;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
    line-height: 1.6;
    color: var(--text);
    background-color: var(--background);
    min-height: 100vh;
    overflow-x: hidden;
    display: flex;
    flex-direction: column;
}

/* ===== HEADER ===== */
.header {
    background: var(--surface);
    box-shadow: 0 2px 20px rgba(0,0,0,0.1);
    position: sticky;
    top: 0;
    z-index: 1000;
    width: 100%;
}

.header-container {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 16px;
}

.navbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 0;
    width: 100%;
}

.logo {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--primary);
    text-decoration: none;
    display: flex;
    align-items: center;
    gap: 8px;
    white-space: nowrap;
}

.mobile-menu-btn {
    display: none;
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: var(--text);
    width: 44px;
    height: 44px;
    padding: 0;
}

.nav-links {
    display: flex;
    gap: 1rem;
    list-style: none;
}

.nav-links a {
    text-decoration: none;
    color: var(--text);
    font-weight: 500;
    padding: 0.5rem 0.75rem;
    border-radius: 4px;
    transition: all 0.3s;
    white-space: nowrap;
}

.nav-links a:hover {
    color: var(--primary);
    background: var(--background);
}

/* ===== MAIN CONTENT ===== */
.main-content {
    flex: 1;
    padding: 1.5rem 0;
    min-height: calc(100vh - 300px);
    width: 100%;
}

.container {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 16px;
}

/* ===== BREADCRUMBS ===== */
.breadcrumb-container {
    padding: 1rem 0;
    background: var(--background);
    border-bottom: 1px solid var(--border);
    width: 100%;
}

.breadcrumb {
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.5rem;
}

.breadcrumb-link {
    color: var(--primary);
    text-decoration: none;
    transition: color 0.3s;
    white-space: nowrap;
}

.breadcrumb-link:hover {
    color: var(--primary-dark);
    text-decoration: underline;
}

.breadcrumb-current {
    color: var(--text);
    font-weight: 500;
    white-space: nowrap;
}

.breadcrumb-separator {
    color: #999;
    margin: 0 0.25rem;
}

/* ===== CARDS ===== */
.card {
    background: var(--surface);
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    box-shadow: 0 5px 15px rgba(0,0,0,0.08);
    border: 1px solid var(--border);
    width: 100%;
}

/* ===== FOOTER ===== */
.footer {
    background: var(--primary-dark);
    color: white;
    padding: 2rem 0 1.5rem;
    margin-top: auto;
    width: 100%;
}

.footer-container {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 16px;
}

.footer-content {
    display: grid;
    grid-template-columns: 1fr;
    gap: 2rem;
    margin-bottom: 2rem;
}

@media (min-width: 768px) {
    .footer-content {
        grid-template-columns: repeat(3, 1fr);
    }
}

.footer-section h3 {
    color: white;
    margin-bottom: 1rem;
    font-size: 1.1rem;
}

.footer-links {
    list-style: none;
}

.footer-links li {
    margin-bottom: 0.5rem;
}

.footer-links a {
    color: rgba(255,255,255,0.8);
    text-decoration: none;
    transition: color 0.3s;
}

.footer-links a:hover {
    color: white;
}

.copyright {
    text-align: center;
    padding-top: 1.5rem;
    border-top: 1px solid rgba(255,255,255,0.1);
    color: rgba(255,255,255,0.6);
    font-size: 0.85rem;
}

/* ===== BLOG-SPECIFIC STYLES ===== */

/* Blog Hero */
.hero-section {
    text-align: center;
    padding: 3rem 1rem 2rem;
    background: linear-gradient(135deg, var(--primary-light)20, var(--primary)10);
    border-radius: 16px;
    margin: 1.5rem 0;
}

.hero-content h1 {
    font-size: 2.5rem;
    color: var(--primary);
    margin-bottom: 1rem;
    line-height: 1.2;
}

@media (max-width: 768px) {
    .hero-content h1 {
        font-size: 2rem;
    }
}

@media (max-width: 480px) {
    .hero-content h1 {
        font-size: 1.75rem;
    }
}

.hero-subtitle {
    font-size: 1.25rem;
    color: var(--text);
    margin-bottom: 1.5rem;
    opacity: 0.9;
}

.hero-intro {
    max-width: 800px;
    margin: 2rem auto 0;
    font-size: 1.1rem;
    line-height: 1.8;
    text-align: left;
    padding: 1.5rem;
    background: var(--surface);
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

.category-badges {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
    flex-wrap: wrap;
}

.category-badge {
    padding: 0.25rem 0.75rem;
    background: var(--primary);
    color: white;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 500;
    transition: transform 0.3s;
}

.category-badge:hover {
    transform: translateY(-1px);
    background: var(--primary-dark);
}

.blog-meta {
    display: flex;
    justify-content: center;
    gap: 1.5rem;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
    font-size: 0.9rem;
    color: #666;
}

.blog-date, .blog-author, .blog-read-time {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.5rem;
    background: var(--surface);
    border-radius: 8px;
}

/* Content Sections */
.content-section {
    margin: 2rem 0;
    padding: 2rem;
    background: var(--surface);
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    border: 1px solid var(--background);
}

@media (max-width: 768px) {
    .content-section {
        padding: 1.5rem;
        margin: 1.5rem 0;
    }
}

.section-header {
    margin-bottom: 2rem;
    text-align: center;
}

.section-header h2 {
    color: var(--primary);
    font-size: 1.8rem;
    margin-bottom: 1rem;
    line-height: 1.3;
}

@media (max-width: 768px) {
    .section-header h2 {
        font-size: 1.5rem;
    }
}

.section-description {
    color: var(--text);
    opacity: 0.8;
    font-size: 1.1rem;
    line-height: 1.7;
    max-width: 800px;
    margin: 0 auto;
}

/* Tables */
.table-container {
    overflow-x: auto;
    margin: 2rem 0;
    border: 1px solid #e0e0e0;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.reference-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.95rem;
}

.reference-table th {
    background: var(--primary);
    color: white;
    padding: 1.25rem;
    text-align: left;
    font-weight: 600;
    white-space: nowrap;
    font-size: 1rem;
}

.reference-table td {
    padding: 1.25rem;
    border-bottom: 1px solid #f0f0f0;
    line-height: 1.6;
}

.reference-table tr:last-child td {
    border-bottom: none;
}

.reference-table tr:hover {
    background-color: var(--background);
}

/* Cards Grid */
.cards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.5rem;
    margin: 2rem 0;
}

@media (max-width: 768px) {
    .cards-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
    }
}

.card-item {
    background: white;
    border: 1px solid #e0e0e0;
    border-radius: 12px;
    padding: 1.75rem;
    transition: all 0.3s ease;
    height: 100%;
    display: flex;
    flex-direction: column;
}

.card-item:hover {
    transform: translateY(-5px);
    box-shadow: 0 12px 24px rgba(0,0,0,0.1);
    border-color: var(--primary);
}

.card-item h3 {
    color: var(--primary);
    margin-bottom: 1rem;
    font-size: 1.25rem;
    line-height: 1.4;
}

.card-item p {
    color: var(--text);
    font-size: 0.95rem;
    margin-bottom: 1.5rem;
    opacity: 0.9;
    line-height: 1.6;
    flex-grow: 1;
}

.card-link {
    display: inline-block;
    padding: 0.75rem 1.5rem;
    background: var(--primary);
    color: white;
    text-decoration: none;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.95rem;
    transition: all 0.3s;
    border: 2px solid var(--primary);
    text-align: center;
}

.card-link:hover {
    background: white;
    color: var(--primary);
    text-decoration: none;
}

/* FAQ */
.faq-container {
    margin: 2rem 0;
}

.faq-item {
    border: 1px solid #e0e0e0;
    border-radius: 12px;
    margin-bottom: 1rem;
    overflow: hidden;
    transition: all 0.3s;
}

.faq-item:hover {
    border-color: var(--primary);
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

.faq-question {
    width: 100%;
    text-align: left;
    background: var(--background);
    border: none;
    padding: 1.5rem;
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--primary);
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: all 0.3s;
}

.faq-question:hover {
    background: var(--primary-light)10;
}

.faq-question[aria-expanded="true"] {
    background: var(--primary);
    color: white;
}

.faq-question[aria-expanded="true"] .faq-icon {
    transform: rotate(45deg);
}

.faq-answer {
    padding: 1.5rem;
    background: white;
    line-height: 1.8;
    display: none;
    font-size: 1.05rem;
}

.faq-answer[aria-hidden="false"] {
    display: block;
}

/* Related Guides */
.related-guides-list {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
    margin: 2rem 0;
}

@media (max-width: 768px) {
    .related-guides-list {
        grid-template-columns: 1fr;
    }
}

.guide-item {
    background: white;
    border: 1px solid #e0e0e0;
    border-radius: 12px;
    padding: 1.75rem;
    transition: all 0.3s;
}

.guide-item:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 20px rgba(0,0,0,0.1);
    border-color: var(--primary);
}

.guide-item h3 {
    margin-bottom: 1rem;
    font-size: 1.2rem;
    line-height: 1.4;
}

.guide-item h3 a {
    color: var(--primary);
    text-decoration: none;
}

.guide-item h3 a:hover {
    color: var(--primary-dark);
    text-decoration: underline;
}

.guide-item p {
    color: var(--text);
    font-size: 0.95rem;
    opacity: 0.9;
    line-height: 1.6;
}

/* CTA Section */
.cta-section {
    text-align: center;
    background: linear-gradient(135deg, var(--primary-light), var(--primary));
    color: white;
    padding: 4rem 2rem;
    border-radius: 20px;
    margin: 3rem 0;
}

.cta-content h2 {
    font-size: 2.5rem;
    margin-bottom: 1.5rem;
    color: white;
    line-height: 1.2;
}

@media (max-width: 768px) {
    .cta-content h2 {
        font-size: 2rem;
    }
}

.cta-content p {
    font-size: 1.2rem;
    margin-bottom: 2.5rem;
    opacity: 0.95;
    line-height: 1.7;
    max-width: 800px;
    margin-left: auto;
    margin-right: auto;
}

.cta-buttons {
    display: flex;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
}

.cta-button {
    padding: 1rem 2.5rem;
    border-radius: 50px;
    text-decoration: none;
    font-weight: 600;
    font-size: 1.1rem;
    transition: all 0.3s;
    border: 2px solid transparent;
    min-width: 200px;
    text-align: center;
}

.cta-button.primary {
    background: white;
    color: var(--primary);
}

.cta-button.primary:hover {
    background: var(--background);
    transform: translateY(-3px);
    box-shadow: 0 8px 20px rgba(0,0,0,0.15);
}

.cta-button.secondary {
    background: transparent;
    color: white;
    border: 2px solid white;
}

.cta-button.secondary:hover {
    background: white;
    color: var(--primary);
    transform: translateY(-3px);
    box-shadow: 0 8px 20px rgba(0,0,0,0.15);
}

/* Back to blog link */
.back-to-blog {
    margin: 1.5rem 0 2.5rem;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid #e0e0e0;
}

.back-to-blog a {
    color: var(--primary);
    text-decoration: none;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 1.1rem;
    padding: 0.75rem 1.5rem;
    background: var(--surface);
    border-radius: 8px;
    transition: all 0.3s;
}

.back-to-blog a:hover {
    color: var(--primary-dark);
    background: var(--background);
    text-decoration: none;
    transform: translateX(-3px);
}

/* Blog Layout */
.blog-page-layout {
    display: flex;
    flex-direction: column;
    gap: 2rem;
}

@media (min-width: 1024px) {
    .blog-page-layout {
        flex-direction: row;
        align-items: flex-start;
    }

    .blog-main-content {
        flex: 1;
        min-width: 0;
    }

    .blog-sidebar {
        width: 350px;
        flex-shrink: 0;
        position: sticky;
        top: 2rem;
    }
}

/* Sidebar */
.blog-sidebar {
    margin-top: 1rem;
}

@media (max-width: 1023px) {
    .blog-sidebar {
        margin-top: 2rem;
    }
}

.sidebar-ad {
    background: white;
    border: 1px solid #e0e0e0;
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    transition: all 0.3s;
}

.sidebar-ad:hover {
    border-color: var(--primary);
    box-shadow: 0 8px 20px rgba(0,0,0,0.1);
}

.ad-label {
    font-size: 0.75rem;
    color: #666;
    text-transform: uppercase;
    margin-bottom: 0.75rem;
    letter-spacing: 1px;
    font-weight: 600;
}

.ad-content h4 {
    margin: 0 0 0.75rem 0;
    font-size: 1.1rem;
    color: var(--primary);
    line-height: 1.4;
}

.ad-content p {
    margin: 0 0 1rem 0;
    font-size: 0.95rem;
    line-height: 1.6;
    color: var(--text);
}

.ad-link {
    display: inline-block;
    padding: 0.75rem 1.5rem;
    background: var(--primary);
    color: white;
    text-decoration: none;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.95rem;
    transition: all 0.3s;
    border: 2px solid var(--primary);
}

.ad-link:hover {
    background: white;
    color: var(--primary);
}

/* Blog List Styles */
.blog-list-page .blog-header {
    background: linear-gradient(135deg, var(--background), var(--surface));
    padding: 2.5rem;
    border-radius: 20px;
    margin-bottom: 2.5rem;
    text-align: center;
}

.blog-list-page .blog-header h1 {
    color: var(--primary);
    font-size: 2.5rem;
    margin-bottom: 1rem;
}

@media (max-width: 768px) {
    .blog-list-page .blog-header h1 {
        font-size: 2rem;
    }
}

.blog-list-page .blog-header p {
    font-size: 1.1rem;
    color: var(--text);
    max-width: 800px;
    margin: 0 auto 1.5rem;
    line-height: 1.7;
}

.search-container {
    position: relative;
    margin: 1.5rem auto 2rem;
    max-width: 600px;
}

.search-input {
    width: 100%;
    padding: 1rem 1.5rem 1rem 3rem;
    border: 2px solid #e0e0e0;
    border-radius: 12px;
    font-size: 1rem;
    background: white;
    transition: all 0.3s;
    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

.search-input:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 4px 20px rgba(46, 125, 50, 0.15);
}

.search-icon {
    position: absolute;
    left: 1rem;
    top: 50%;
    transform: translateY(-50%);
    color: var(--primary);
    font-size: 1.2rem;
}

.category-filters {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin: 1.5rem 0;
    justify-content: center;
    align-items: center;
}

.category-filter {
    padding: 0.75rem 1.25rem;
    background: white;
    border: 2px solid #e0e0e0;
    border-radius: 25px;
    text-decoration: none;
    color: var(--text);
    font-weight: 600;
    transition: all 0.3s;
    white-space: nowrap;
    cursor: pointer;
    display: inline-block;
    font-size: 0.95rem;
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.category-filter:hover,
.category-filter.active {
    background: var(--primary);
    color: white;
    border-color: var(--primary);
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(46, 125, 50, 0.2);
}

.clear-filters {
    margin-left: auto;
    background: none;
    border: none;
    color: var(--primary);
    cursor: pointer;
    font-size: 0.95rem;
    font-weight: 600;
    padding: 0.75rem 1.25rem;
    text-decoration: none;
    border-radius: 25px;
    border: 2px solid var(--primary);
    transition: all 0.3s;
}

.clear-filters:hover {
    background: var(--primary);
    color: white;
    transform: translateY(-2px);
}

.blogs-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 2rem;
    margin: 2.5rem 0;
}

@media (max-width: 768px) {
    .blogs-grid {
        grid-template-columns: 1fr;
        gap: 1.5rem;
    }
}

.blog-card {
    background: white;
    border: 1px solid #e0e0e0;
    border-radius: 16px;
    padding: 2rem;
    transition: all 0.3s;
    display: flex;
    flex-direction: column;
    height: 100%;
}

.blog-card:hover {
    transform: translateY(-8px);
    box-shadow: 0 16px 32px rgba(0,0,0,0.1);
    border-color: var(--primary);
}

.blog-card-header {
    margin-bottom: 1.5rem;
}

.blog-card-content h3 {
    color: var(--primary);
    font-size: 1.4rem;
    margin-bottom: 1rem;
    line-height: 1.4;
}

.blog-card-description {
    color: var(--text);
    font-size: 1rem;
    margin-bottom: 1.5rem;
    line-height: 1.6;
    opacity: 0.9;
    flex-grow: 1;
}

.blog-card-meta {
    display: flex;
    gap: 1rem;
    font-size: 0.85rem;
    color: #666;
    flex-wrap: wrap;
    margin-bottom: 1.5rem;
    padding: 1rem;
    background: var(--background);
    border-radius: 8px;
}

.blog-category-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin: 1rem 0 1.5rem;
}

.blog-category-tag {
    padding: 0.5rem 1rem;
    background: var(--background);
    border: 1px solid #e0e0e0;
    border-radius: 20px;
    font-size: 0.85rem;
    color: var(--text);
    font-weight: 500;
    transition: all 0.3s;
}

.blog-category-tag:hover {
    background: var(--primary);
    color: white;
    border-color: var(--primary);
}

.blog-read-link {
    display: inline-block;
    color: var(--primary);
    text-decoration: none;
    font-weight: 600;
    font-size: 1rem;
    padding: 0.75rem 1.5rem;
    background: var(--background);
    border-radius: 8px;
    border: 2px solid var(--primary)40;
    transition: all 0.3s;
    text-align: center;
    margin-top: auto;
}

.blog-read-link:hover {
    background: var(--primary);
    color: white;
    border-color: var(--primary);
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(46, 125, 50, 0.2);
}

.no-results {
    text-align: center;
    padding: 4rem 2rem;
    color: #666;
    font-style: italic;
    grid-column: 1 / -1;
    background: var(--surface);
    border-radius: 16px;
    font-size: 1.1rem;
}

/* ===== RICH CONTENT STYLES ===== */
.rich-content {
    line-height: 1.8;
    font-size: 1.05rem;
    color: var(--text);
}

.rich-content h2 {
    color: var(--primary);
    margin: 2.5rem 0 1.5rem;
    font-size: 1.8rem;
    line-height: 1.4;
}

.rich-content h3 {
    color: var(--primary-dark);
    margin: 2rem 0 1rem;
    font-size: 1.4rem;
    line-height: 1.4;
}

.rich-content p {
    margin: 1.25rem 0;
}

.rich-content ul,
.rich-content ol {
    margin: 1.5rem 0 1.5rem 1.5rem;
}

.rich-content li {
    margin-bottom: 0.75rem;
    line-height: 1.7;
}

.rich-content strong {
    color: var(--primary);
    font-weight: 600;
}

.rich-content em {
    color: var(--text);
    font-style: italic;
}

.rich-content a {
    color: var(--primary);
    text-decoration: none;
    border-bottom: 2px solid var(--primary)40;
    padding-bottom: 1px;
    transition: all 0.3s;
}

.rich-content a:hover {
    color: var(--primary-dark);
    border-bottom-color: var(--primary);
}

.rich-content blockquote {
    margin: 2rem 0;
    padding: 1.5rem 2rem;
    background: var(--background);
    border-left: 5px solid var(--primary);
    border-radius: 0 12px 12px 0;
    font-style: italic;
    color: var(--text);
}

/* ===== MOBILE MENU ===== */
@media (max-width: 767px) {
    .mobile-menu-btn {
        display: block;
    }

    .nav-links {
        display: none;
        position: fixed;
        top: 70px;
        left: 0;
        right: 0;
        background: var(--surface);
        flex-direction: column;
        padding: 1rem;
        box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        z-index: 999;
        max-height: calc(100vh - 70px);
        overflow-y: auto;
    }

    .nav-links.active {
        display: flex;
    }

    .nav-links li {
        width: 100%;
    }

    .nav-links a {
        display: block;
        padding: 1rem;
        border-bottom: 1px solid var(--border);
    }

    .nav-links a:last-child {
        border-bottom: none;
    }
}

/* ===== RESPONSIVE DESIGN - TABLET ===== */
@media (min-width: 768px) {
    .container {
        padding: 0 24px;
    }

    .mobile-menu-btn {
        display: none;
    }

    .nav-links {
        display: flex;
        position: static;
        flex-direction: row;
        background: none;
        box-shadow: none;
        padding: 0;
    }
}

/* ===== RESPONSIVE DESIGN - DESKTOP ===== */
@media (min-width: 1024px) {
    .container {
        padding: 0 32px;
    }
}
`;

// ==============================
// NAVIGATION FUNCTIONS
// ==============================

function generateNavigation(currentPage = '', location = 'root') {
    function getPath(target, currentLoc) {
        if (currentLoc === 'root') {
            const paths = {
                home: 'index.html',
                converters: 'converters/',
                blog: 'blogs/',
                about: 'about/index.html',
                contact: 'contact/index.html',
                privacy: 'privacy/index.html',
                terms: 'terms/index.html'
            };
            return paths[target];
        }

        if (currentLoc === 'converters') {
            const paths = {
                home: '../index.html',
                converters: './',
                blog: '../blogs/',
                about: '../about/index.html',
                contact: '../contact/index.html',
                privacy: '../privacy/index.html',
                terms: '../terms/index.html'
            };
            return paths[target];
        }

        if (currentLoc === 'blogs') {
            const paths = {
                home: '../index.html',
                converters: '../converters/',
                blog: './',
                about: '../about/index.html',
                contact: '../contact/index.html',
                privacy: '../privacy/index.html',
                terms: '../terms/index.html'
            };
            return paths[target];
        }

        if (currentLoc.startsWith('blogs/')) {
            const paths = {
                home: '../../index.html',
                converters: '../../converters/',
                blog: '../',
                about: '../../about/index.html',
                contact: '../../contact/index.html',
                privacy: '../../privacy/index.html',
                terms: '../../terms/index.html'
            };
            return paths[target];
        }

        const paths = {
            home: '../index.html',
            converters: '../converters/',
            blog: '../blogs/',
            about: './index.html',
            contact: './index.html',
            privacy: './index.html',
            terms: './index.html'
        };
        return paths[target];
    }

    const getLinkStyle = (pageName) => {
        return currentPage === pageName ? 'style="color:var(--primary);font-weight:600;"' : '';
    };

    return `
    <header class="header">
        <div class="header-container">
            <nav class="navbar">
                <a href="${getPath('home', location)}" class="logo">
                    ${MASTER_CONFIG.site.logo} ${MASTER_CONFIG.site.name}
                </a>
                <button class="mobile-menu-btn" aria-label="Menu">☰</button>
                <ul class="nav-links">
                    <li><a href="${getPath('home', location)}" ${getLinkStyle('home')}>Home</a></li>
                    <li><a href="${getPath('converters', location)}" ${getLinkStyle('converters')}>Converters</a></li>
                    <li><a href="${getPath('blog', location)}" ${getLinkStyle('blog')}>Blog</a></li>
                    <li><a href="${getPath('about', location)}" ${getLinkStyle('about')}>About</a></li>
                    <li><a href="${getPath('contact', location)}" ${getLinkStyle('contact')}>Contact</a></li>
                </ul>
            </nav>
        </div>
    </header>
    `;
}

function generateFooter(location = 'root') {
    function getPath(target, currentLoc) {
        if (currentLoc === 'root') {
            const paths = {
                home: 'index.html',
                converters: 'converters/',
                blog: 'blogs/',
                about: 'about/index.html',
                contact: 'contact/index.html',
                privacy: 'privacy/index.html',
                terms: 'terms/index.html',
                sitemap: 'sitemap.xml'
            };
            return paths[target];
        }

        if (currentLoc === 'converters') {
            const paths = {
                home: '../index.html',
                converters: './',
                blog: '../blogs/',
                about: '../about/index.html',
                contact: '../contact/index.html',
                privacy: '../privacy/index.html',
                terms: '../terms/index.html',
                sitemap: '../sitemap.xml'
            };
            return paths[target];
        }

        if (currentLoc === 'blogs') {
            const paths = {
                home: '../index.html',
                converters: '../converters/',
                blog: './',
                about: '../about/index.html',
                contact: '../contact/index.html',
                privacy: '../privacy/index.html',
                terms: '../terms/index.html',
                sitemap: '../sitemap.xml'
            };
            return paths[target];
        }

        if (currentLoc.startsWith('blogs/')) {
            const paths = {
                home: '../../index.html',
                converters: '../../converters/',
                blog: '../',
                about: '../../about/index.html',
                contact: '../../contact/index.html',
                privacy: '../../privacy/index.html',
                terms: '../../terms/index.html',
                sitemap: '../../sitemap.xml'
            };
            return paths[target];
        }

        const paths = {
            home: '../index.html',
            converters: '../converters/',
            blog: '../blogs/',
            about: './index.html',
            contact: './index.html',
            privacy: './index.html',
            terms: './index.html',
            sitemap: '../sitemap.xml'
        };
        return paths[target];
    }

    const year = new Date().getFullYear();

    return `
    <footer class="footer">
        <div class="footer-container">
            <div class="footer-content">
                <div class="footer-section">
                    <h3>${MASTER_CONFIG.site.name}</h3>
                    <p>${MASTER_CONFIG.site.tagline}</p>
                </div>
                <div class="footer-section">
                    <h3>Quick Links</h3>
                    <ul class="footer-links">
                        ${MASTER_CONFIG.blogs ? MASTER_CONFIG.blogs.slice(0, 3).map(blog => `
                        <li><a href="${getPath('blog', location)}${blog.slug}/">${blog.title}</a></li>
                        `).join('') : ''}
                    </ul>
                </div>
                <div class="footer-section">
                    <h3>Legal</h3>
                    <ul class="footer-links">
                        <li><a href="${getPath('privacy', location)}">Privacy Policy</a></li>
                        <li><a href="${getPath('terms', location)}">Terms of Service</a></li>
                        <li><a href="${getPath('contact', location)}">Contact Us</a></li>
                        <li><a href="${getPath('sitemap', location)}">Sitemap</a></li>
                    </ul>
                </div>
            </div>
            <div class="copyright">
                <p>&copy; ${year} ${MASTER_CONFIG.site.name}. All rights reserved.</p>
                <p>Generated on: ${new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                })}</p>
            </div>
        </div>
    </footer>
    `;
}

// ==============================
// RICH CONTENT PARSER
// ==============================

function parseRichContent(content, links = []) {
    if (!content) return '';

    let parsedContent = content;

    // Replace link placeholders with actual links
    links.forEach(link => {
        const placeholder = `[${link.text}]`;
        if (parsedContent.includes(placeholder)) {
            parsedContent = parsedContent.replace(
                placeholder,
                `<a href="${link.url}" target="${link.target || '_self'}" rel="${link.rel || 'noopener'}">${link.text}</a>`
            );
        }
    });

    // Add rich content wrapper
    return `<div class="rich-content">${parsedContent}</div>`;
}

// ==============================
// BLOG CONTENT GENERATORS
// ==============================

function generateHeroSection(blog) {
    const categories = blog.categories || [];

    return `
    <section class="hero-section">
        <div class="hero-content">
            ${categories.length > 0 ? `
            <div class="category-badges">
                ${categories.map(cat => `
                <span class="category-badge">${cat}</span>
                `).join('')}
            </div>
            ` : ''}

            <h1>${blog.title}</h1>

            ${blog.subtitle ? `<p class="hero-subtitle">${blog.subtitle}</p>` : ''}

            <div class="blog-meta">
                ${blog.date ? `<span class="blog-date">📅 ${blog.date}</span>` : ''}
                ${blog.author ? `<span class="blog-author">👤 ${blog.author}</span>` : ''}
                ${blog.readTime ? `<span class="blog-read-time">⏱️ ${blog.readTime} min read</span>` : ''}
            </div>
        </div>

        ${blog.intro ? `
        <div class="hero-intro">
            ${parseRichContent(blog.intro, blog.links || [])}
        </div>
        ` : ''}
    </section>
    `;
}

function generateSection(section, sectionType) {
    if (!section) return '';

    let content = '';

    switch(sectionType) {
        case 'intro':
            content = `
            <section class="content-section intro-section">
                <div class="section-header">
                    <h2>${section.title || 'Introduction'}</h2>
                    ${section.description ? `<p class="section-description">${section.description}</p>` : ''}
                </div>
                <div class="section-content">
                    ${parseRichContent(section.content, section.links || [])}
                </div>
            </section>
            `;
            break;

        case 'paragraphTable':
            content = `
            <section class="content-section table-section">
                <div class="section-header">
                    <h2>${section.title || 'Quick Reference'}</h2>
                    ${section.description ? `<p class="section-description">${section.description}</p>` : ''}
                </div>

                <div class="section-content">
                    ${parseRichContent(section.content, section.links || [])}
                </div>

                ${section.tableData ? `
                <div class="table-container">
                    <table class="reference-table">
                        <thead>
                            <tr>
                                ${section.tableData.headers.map(header => `<th>${header}</th>`).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            ${section.tableData.rows.map(row => `
                            <tr>
                                ${row.map(cell => `<td>${parseRichContent(cell, section.links || [])}</td>`).join('')}
                            </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                ` : ''}
            </section>
            `;
            break;

        case 'bulletList':
            content = `
            <section class="content-section list-section">
                <div class="section-header">
                    <h2>${section.title || 'Key Points'}</h2>
                    ${section.description ? `<p class="section-description">${section.description}</p>` : ''}
                </div>

                <div class="section-content">
                    ${parseRichContent(section.content, section.links || [])}
                </div>

                ${section.items ? `
                <ul class="styled-list">
                    ${section.items.map(item => `<li>${parseRichContent(item, section.links || [])}</li>`).join('')}
                </ul>
                ` : ''}
            </section>
            `;
            break;

        case 'cardGrid':
            content = `
            <section class="content-section grid-section">
                <div class="section-header">
                    <h2>${section.title || 'Tools & Resources'}</h2>
                    ${section.description ? `<p class="section-description">${section.description}</p>` : ''}
                </div>

                ${section.content ? `
                <div class="section-content">
                    ${parseRichContent(section.content, section.links || [])}
                </div>
                ` : ''}

                ${section.cards ? `
                <div class="cards-grid">
                    ${section.cards.map(card => `
                    <article class="card-item">
                        <h3>${card.title}</h3>
                        <p>${parseRichContent(card.description, section.links || [])}</p>
                        ${card.link ? `
                        <a href="${card.link.url}"
                           class="card-link"
                           target="${card.link.target || '_self'}"
                           rel="${card.link.rel || 'noopener'}">
                            ${card.link.text}
                        </a>
                        ` : ''}
                    </article>
                    `).join('')}
                </div>
                ` : ''}
            </section>
            `;
            break;

        case 'faq':
            content = `
            <section class="content-section faq-section">
                <div class="section-header">
                    <h2>${section.title || 'Frequently Asked Questions'}</h2>
                    ${section.description ? `<p class="section-description">${section.description}</p>` : ''}
                </div>

                <div class="faq-container">
                    ${section.faqs ? section.faqs.map((faq, index) => `
                    <div class="faq-item">
                        <button class="faq-question" aria-expanded="false" aria-controls="faq-answer-${index}">
                            ${parseRichContent(faq.question, section.links || [])}
                            <span class="faq-icon">+</span>
                        </button>
                        <div class="faq-answer" id="faq-answer-${index}">
                            ${parseRichContent(faq.answer, section.links || [])}
                        </div>
                    </div>
                    `).join('') : ''}
                </div>
            </section>
            `;
            break;

        case 'cta':
            content = `
            <section class="content-section cta-section">
                <div class="cta-content">
                    <h2>${section.title || 'Ready to Convert?'}</h2>
                    <p>${parseRichContent(section.text || 'Try our accurate converters for all your measurement needs.', section.links || [])}</p>

                    ${section.buttons ? `
                    <div class="cta-buttons">
                        ${section.buttons.map(button => `
                        <a href="${button.url}"
                           class="cta-button ${button.style || 'primary'}"
                           target="${button.target || '_self'}"
                           rel="${button.rel || 'noopener'}">
                            ${button.text}
                        </a>
                        `).join('')}
                    </div>
                    ` : ''}
                </div>
            </section>
            `;
            break;
    }

    return content;
}

// ==============================
// BLOG POST GENERATION
// ==============================

function generateBlogPost(blog) {
    const seo = blog.seo || {};
    const schema = seo.schema || {};

    // Get content sequence
    const contentSequence = blog.contentSequence || ['hero', 'intro', 'paragraphTable', 'bulletList', 'cardGrid', 'faq', 'cta'];

    // Generate breadcrumb
    const breadcrumb = seo.breadcrumb || [
        { name: 'Home', url: '/' },
        { name: 'Blog', url: '/blogs/' },
        { name: blog.title, url: `/blogs/${blog.slug}/` }
    ];

    let contentHTML = '';

    // Generate content based on sequence
    contentSequence.forEach(sectionType => {
        if (sectionType === 'hero') {
            contentHTML += generateHeroSection(blog);
        } else if (blog.contentSections && blog.contentSections[sectionType]) {
            contentHTML += generateSection(blog.contentSections[sectionType], sectionType);
        }
    });

    // Generate sidebar ads if enabled
    let sidebarHTML = '';
    if (blog.ads && blog.ads.sidebar && blog.ads.sidebar.enabled !== false) {
        const sidebarAds = blog.ads.sidebar.items || [];
        sidebarHTML = `
        <aside class="blog-sidebar">
            ${sidebarAds.map(ad => `
            <div class="sidebar-ad">
                <div class="ad-label">${ad.label || 'Advertisement'}</div>
                <div class="ad-content">
                    ${ad.title ? `<h4>${ad.title}</h4>` : ''}
                    ${ad.content ? `<p>${ad.content}</p>` : ''}
                    ${ad.link ? `<a href="${ad.link.url}" class="ad-link">${ad.link.text || 'Learn More'}</a>` : ''}
                </div>
            </div>
            `).join('')}
        </aside>
        `;
    }

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <!-- Primary Meta Tags -->
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${blog.title} | ${MASTER_CONFIG.site.name}</title>
    <meta name="description" content="${blog.metaDescription || blog.description}">
    <meta name="keywords" content="${blog.keywords ? (Array.isArray(blog.keywords) ? blog.keywords.join(', ') : blog.keywords) : ''}">
    <meta name="author" content="${blog.author || MASTER_CONFIG.site.name}">

    <!-- Open Graph -->
    <meta property="og:type" content="article">
    <meta property="og:url" content="${MASTER_CONFIG.site.url}/blogs/${blog.slug}/">
    <meta property="og:title" content="${blog.title}">
    <meta property="og:description" content="${blog.metaDescription || blog.description}">
    <meta property="og:image" content="${blog.image || `${MASTER_CONFIG.site.url}/og-image.jpg`}">
    <meta property="og:locale" content="en_US">
    <meta property="og:site_name" content="${MASTER_CONFIG.site.name}">

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:url" content="${MASTER_CONFIG.site.url}/blogs/${blog.slug}/">
    <meta name="twitter:title" content="${blog.title}">
    <meta name="twitter:description" content="${blog.metaDescription || blog.description}">
    <meta name="twitter:image" content="${blog.image || `${MASTER_CONFIG.site.url}/og-image.jpg`}">

    <!-- Canonical -->
    <link rel="canonical" href="${MASTER_CONFIG.site.url}/blogs/${blog.slug}/">

    <!-- Schema.org -->
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "${schema.type || 'Article'}",
        "headline": "${blog.title}",
        "description": "${blog.metaDescription || blog.description}",
        "image": "${blog.image || `${MASTER_CONFIG.site.url}/og-image.jpg`}",
        "datePublished": "${blog.date || new Date().toISOString()}",
        "dateModified": "${blog.date || new Date().toISOString()}",
        "author": {
            "@type": "Person",
            "name": "${blog.author || 'Conversion Expert'}"
        },
        "publisher": {
            "@type": "Organization",
            "name": "${MASTER_CONFIG.site.name}",
            "logo": {
                "@type": "ImageObject",
                "url": "${MASTER_CONFIG.site.url}/logo.png"
            }
        },
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": "${MASTER_CONFIG.site.url}/blogs/${blog.slug}/"
        }
    }
    </script>

    <!-- Breadcrumb Schema -->
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            ${breadcrumb.map((item, index) => `{
                "@type": "ListItem",
                "position": ${index + 1},
                "name": "${item.name}",
                "item": "${MASTER_CONFIG.site.url}${item.url}"
            }${index < breadcrumb.length - 1 ? ',' : ''}`).join('')}
        ]
    }
    </script>

    <style>${STYLES}</style>
    <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>${MASTER_CONFIG.site.logo}</text></svg>">
</head>
<body>
    ${generateNavigation('blog', `blogs/${blog.slug}`)}

    <div class="breadcrumb-container">
        <div class="container">
            <nav class="breadcrumb" aria-label="Breadcrumb">
                ${breadcrumb.map((item, index) => `
                ${index > 0 ? '<span class="breadcrumb-separator">›</span>' : ''}
                ${index === breadcrumb.length - 1
                    ? `<span class="breadcrumb-current">${item.name}</span>`
                    : `<a href="${item.url}" class="breadcrumb-link">${item.name}</a>`}
                `).join('')}
            </nav>
        </div>
    </div>

    <main class="main-content">
        <div class="container">
            <div class="back-to-blog">
                <a href="../">← Back to All Blog Posts</a>
            </div>

            <div class="blog-page-layout">
                <div class="blog-main-content">
                    ${contentHTML}
                </div>

                ${sidebarHTML}
            </div>
        </div>
    </main>

    ${generateFooter(`blogs/${blog.slug}`)}

    <script>
    document.addEventListener('DOMContentLoaded', function() {
        // Mobile menu toggle
        const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
        const navLinks = document.querySelector('.nav-links');

        if (mobileMenuBtn && navLinks) {
            mobileMenuBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                navLinks.classList.toggle('active');
                this.setAttribute('aria-expanded', navLinks.classList.contains('active'));
            });

            document.addEventListener('click', function(event) {
                if (!mobileMenuBtn.contains(event.target) && !navLinks.contains(event.target)) {
                    navLinks.classList.remove('active');
                    mobileMenuBtn.setAttribute('aria-expanded', 'false');
                }
            });

            navLinks.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => {
                    navLinks.classList.remove('active');
                    mobileMenuBtn.setAttribute('aria-expanded', 'false');
                });
            });
        }

        // FAQ toggle functionality
        document.querySelectorAll('.faq-question').forEach(button => {
            button.addEventListener('click', function() {
                const answerId = this.getAttribute('aria-controls');
                const answer = document.getElementById(answerId);
                const isExpanded = this.getAttribute('aria-expanded') === 'true';

                this.setAttribute('aria-expanded', !isExpanded);
                if (answer) {
                    answer.setAttribute('aria-hidden', isExpanded);
                    answer.style.display = isExpanded ? 'none' : 'block';
                }

                const icon = this.querySelector('.faq-icon');
                if (icon) {
                    icon.textContent = isExpanded ? '+' : '−';
                }
            });
        });
    });
    </script>
</body>
</html>
    `;
}

// ==============================
// BLOG LIST PAGE GENERATION
// ==============================

function getBlogCategories() {
    const categories = new Set();

    if (MASTER_CONFIG.blogs && Array.isArray(MASTER_CONFIG.blogs)) {
        MASTER_CONFIG.blogs.forEach(blog => {
            if (blog.categories && Array.isArray(blog.categories)) {
                blog.categories.forEach(cat => categories.add(cat));
            }
        });
    }

    return Array.from(categories).sort();
}

function generateBlogListPage() {
    const allCategories = getBlogCategories();
    const allBlogs = MASTER_CONFIG.blogs || [];

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <!-- Primary Meta Tags -->
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Blog | ${MASTER_CONFIG.site.name}</title>
    <meta name="description" content="Read our latest articles, guides, and tips about conversions, measurements, and more.">
    <meta name="keywords" content="blog, articles, guides, conversion tips, measurement guides">
    <meta name="author" content="${MASTER_CONFIG.site.name}">

    <!-- Open Graph -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="${MASTER_CONFIG.site.url}/blogs/">
    <meta property="og:title" content="Blog | ${MASTER_CONFIG.site.name}">
    <meta property="og:description" content="Read our latest articles, guides, and tips about conversions, measurements, and more.">
    <meta property="og:image" content="${MASTER_CONFIG.site.url}/og-image.jpg">
    <meta property="og:locale" content="en_US">
    <meta property="og:site_name" content="${MASTER_CONFIG.site.name}">

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:url" content="${MASTER_CONFIG.site.url}/blogs/">
    <meta name="twitter:title" content="Blog | ${MASTER_CONFIG.site.name}">
    <meta name="twitter:description" content="Read our latest articles, guides, and tips about conversions, measurements, and more.">
    <meta name="twitter:image" content="${MASTER_CONFIG.site.url}/og-image.jpg">

    <!-- Canonical -->
    <link rel="canonical" href="${MASTER_CONFIG.site.url}/blogs/">

    <!-- Schema.org -->
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": "Blog | ${MASTER_CONFIG.site.name}",
        "description": "Read our latest articles, guides, and tips about conversions, measurements, and more.",
        "url": "${MASTER_CONFIG.site.url}/blogs/"
    }
    </script>

    <style>${STYLES}</style>
    <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>${MASTER_CONFIG.site.logo}</text></svg>">
</head>
<body class="blog-list-page">
    ${generateNavigation('blog', 'blogs')}

    <div class="breadcrumb-container">
        <div class="container">
            <nav class="breadcrumb" aria-label="Breadcrumb">
                <a href="../index.html" class="breadcrumb-link">Home</a>
                <span class="breadcrumb-separator">›</span>
                <span class="breadcrumb-current">Blog</span>
            </nav>
        </div>
    </div>

    <main class="main-content">
        <div class="container">
            <div class="blog-header">
                <h1>${MASTER_CONFIG.site.name} Blog</h1>
                <p>Read our latest articles, guides, and tips about conversions, measurements, and more.</p>

                <!-- Search Bar -->
                <div class="search-container">
                    <span class="search-icon">🔍</span>
                    <input type="text"
                           id="searchBlogs"
                           class="search-input"
                           placeholder="Search blog posts by title, description, or category..."
                           aria-label="Search blogs">
                </div>

                <!-- Category Filters -->
                ${allCategories.length > 0 ? `
                <div class="category-filters">
                    <span style="font-weight: 600; margin-right: 0.5rem; font-size: 0.9rem;">Categories:</span>
                    <a href="#" class="category-filter active" data-category="all">All</a>
                    ${allCategories.map(cat => `
                    <a href="#" class="category-filter" data-category="${cat}">
                        ${cat.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </a>
                    `).join('')}
                    <button class="clear-filters">Clear Filters</button>
                </div>
                ` : ''}

                <p style="margin: 1rem 0; color: var(--text); font-size: 0.9rem;">
                    Showing <span class="blog-count">${allBlogs.length}</span> of ${allBlogs.length} blog posts
                </p>
            </div>

            <!-- Blogs Grid -->
            <div class="blogs-grid">
                ${allBlogs.map(blog => `
                <div class="blog-card"
                     data-title="${blog.title.toLowerCase()}"
                     data-description="${(blog.description || '').toLowerCase()}"
                     data-categories="${blog.categories ? blog.categories.join(',').toLowerCase() : ''}">

                    ${blog.image ? `
                    <div class="blog-card-header">
                        <img src="${blog.image}"
                             alt="${blog.title}"
                             class="blog-image"
                             loading="lazy">
                    </div>
                    ` : ''}

                    <div class="blog-card-content">
                        <h3>${blog.title}</h3>
                        <p class="blog-card-description">${blog.description || ''}</p>

                        <div class="blog-card-meta">
                            ${blog.date ? `<span class="blog-card-date">${blog.date}</span>` : ''}
                            ${blog.author ? `<span class="blog-card-author">${blog.author}</span>` : ''}
                            ${blog.readTime ? `<span class="blog-card-readtime">${blog.readTime} min read</span>` : ''}
                        </div>
                    </div>

                    ${blog.categories && Array.isArray(blog.categories) ? `
                    <div class="blog-category-tags">
                        ${blog.categories.map(cat => `
                        <span class="blog-category-tag">${cat.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</span>
                        `).join('')}
                    </div>
                    ` : ''}

                    <a href="${blog.slug}/" class="blog-read-link">Read Article →</a>
                </div>
                `).join('')}

                <!-- No Results Message -->
                <div class="no-results" style="display: none;">
                    <p>No blog posts found matching your criteria.</p>
                    <p>Try a different search term or category.</p>
                </div>
            </div>
        </div>
    </main>

    ${generateFooter('blogs')}

    <script>
    document.addEventListener('DOMContentLoaded', function() {
        // Mobile menu toggle
        const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
        const navLinks = document.querySelector('.nav-links');

        if (mobileMenuBtn && navLinks) {
            mobileMenuBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                navLinks.classList.toggle('active');
                this.setAttribute('aria-expanded', navLinks.classList.contains('active'));
            });

            document.addEventListener('click', function(event) {
                if (!mobileMenuBtn.contains(event.target) && !navLinks.contains(event.target)) {
                    navLinks.classList.remove('active');
                    mobileMenuBtn.setAttribute('aria-expanded', 'false');
                }
            });

            navLinks.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => {
                    navLinks.classList.remove('active');
                    mobileMenuBtn.setAttribute('aria-expanded', 'false');
                });
            });
        }

        // Blog filtering
        const searchInput = document.getElementById('searchBlogs');
        const categoryFilters = document.querySelectorAll('.category-filter');
        const clearBtn = document.querySelector('.clear-filters');
        const blogCards = document.querySelectorAll('.blog-card');
        const noResults = document.querySelector('.no-results');
        const blogCount = document.querySelector('.blog-count');

        function filterBlogs() {
            const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
            const activeCategory = document.querySelector('.category-filter.active')?.dataset.category || 'all';

            let visibleCount = 0;

            blogCards.forEach(card => {
                const title = card.dataset.title;
                const desc = card.dataset.description;
                const categories = card.dataset.categories ? card.dataset.categories.split(',') : [];

                const matchesSearch = !searchTerm ||
                    title.includes(searchTerm) ||
                    desc.includes(searchTerm) ||
                    categories.some(cat => cat.includes(searchTerm));

                const matchesCategory = activeCategory === 'all' ||
                    categories.includes(activeCategory.toLowerCase());

                if (matchesSearch && matchesCategory) {
                    card.style.display = 'flex';
                    visibleCount++;
                } else {
                    card.style.display = 'none';
                }
            });

            // Update count
            if (blogCount) {
                blogCount.textContent = visibleCount;
            }

            // Show/hide no results
            if (noResults) {
                noResults.style.display = visibleCount === 0 ? 'block' : 'none';
            }
        }

        // Event listeners
        if (searchInput) {
            searchInput.addEventListener('input', filterBlogs);
            let debounceTimer;
            searchInput.addEventListener('input', () => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(filterBlogs, 300);
            });
        }

        if (categoryFilters.length > 0) {
            categoryFilters.forEach(filter => {
                filter.addEventListener('click', (e) => {
                    e.preventDefault();
                    categoryFilters.forEach(f => f.classList.remove('active'));
                    filter.classList.add('active');
                    filterBlogs();
                });
            });
        }

        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (searchInput) searchInput.value = '';
                categoryFilters.forEach(f => f.classList.remove('active'));
                const allFilter = document.querySelector('.category-filter[data-category="all"]');
                if (allFilter) allFilter.classList.add('active');
                filterBlogs();
            });
        }
    });
    </script>
</body>
</html>
    `;
}

// ==============================
// GENERATE COMPLETE WEBSITE
// ==============================

async function generateCompleteWebsite() {
    console.log('🚀 Starting complete website generation from single JSON...');
    console.log(`📊 Site: ${MASTER_CONFIG.site.name}`);
    console.log(`📊 Converters: ${MASTER_CONFIG.converters?.length || 0}`);
    console.log(`📊 Blogs: ${MASTER_CONFIG.blogs?.length || 0}`);

    const outputDir = './public';

    try {
        // Clean and create directories
        await cleanDirectory(outputDir);
        ensureDirectory(outputDir);
        ensureDirectory(path.join(outputDir, 'converters'));
        ensureDirectory(path.join(outputDir, 'blogs'));
        ensureDirectory(path.join(outputDir, 'about'));
        ensureDirectory(path.join(outputDir, 'contact'));
        ensureDirectory(path.join(outputDir, 'privacy'));
        ensureDirectory(path.join(outputDir, 'terms'));

        // 1. Generate homepage
        console.log('📄 Generating homepage...');
        // You would add your homepage generation logic here

        // 2. Generate blog list page
        console.log('📄 Generating blog list page...');
        writeFileSync(
            path.join(outputDir, 'blogs', 'index.html'),
            generateBlogListPage()
        );

        // 3. Generate individual blog pages
        if (MASTER_CONFIG.blogs && Array.isArray(MASTER_CONFIG.blogs)) {
            console.log(`📝 Generating ${MASTER_CONFIG.blogs.length} blog pages...`);

            for (const blog of MASTER_CONFIG.blogs) {
                try {
                    console.log(`   Processing: ${blog.id || blog.slug}`);

                    // Ensure blog directory exists
                    const blogDir = path.join(outputDir, 'blogs', blog.slug);
                    ensureDirectory(blogDir);

                    // Generate blog post HTML
                    writeFileSync(
                        path.join(blogDir, 'index.html'),
                        generateBlogPost(blog)
                    );

                    console.log(`   ✓ Generated: ${blog.id || blog.slug}`);
                } catch (error) {
                    console.error(`   ✗ Error generating ${blog.id || blog.slug}:`, error.message);
                }
            }
        }

        // 4. Generate RSS feed
        generateRSSFeed(outputDir);

        // 5. Generate static pages
        console.log('📄 Generating static pages...');
        // You would add static page generation logic here

        // 6. Generate sitemap
        generateSitemap(outputDir);

        console.log('\n' + '='.repeat(60));
        console.log('✅ COMPLETE WEBSITE GENERATED FROM SINGLE JSON!');
        console.log('='.repeat(60));
        console.log(`📊 Statistics:`);
        console.log(`   Site: ${MASTER_CONFIG.site.name}`);
        console.log(`   Converters: ${MASTER_CONFIG.converters?.length || 0}`);
        console.log(`   Blogs: ${MASTER_CONFIG.blogs?.length || 0}`);
        console.log(`   Pages: ${Object.keys(MASTER_CONFIG.pages || {}).length}`);

        console.log('\n🎯 KEY FEATURES:');
        console.log('   • Everything from single master-config.json');
        console.log('   • Fully responsive design (mobile-first)');
        console.log('   • Complete blog system with JSON control');
        console.log('   • Rich content with inline links via JSON');
        console.log('   • Category filtering & search');
        console.log('   • SEO optimized with schema markup');
        console.log('   • Same header/footer across all pages');

        console.log('\n📝 HOW TO ADD NEW BLOGS:');
        console.log('   1. Add new object to master-config.json -> blogs array');
        console.log('   2. Run: node generate-website.js');
        console.log('\nExample blog structure:');
        console.log(`
{
  "id": "blog-id",
  "slug": "blog-url",
  "title": "Blog Title",
  "description": "Blog description",
  "categories": ["category1", "category2"],
  "date": "2024-01-20",
  "contentSequence": ["hero", "intro", "paragraphTable", "faq"],
  "contentSections": {
    "intro": {
      "title": "Introduction",
      "content": "Content with [links] that get replaced",
      "links": [
        {
          "text": "links",
          "url": "/page",
          "target": "_blank"
        }
      ]
    }
  }
}
        `);

        console.log('\n🚀 To serve locally:');
        console.log('   cd public && npx serve');
        console.log('='.repeat(60));

    } catch (error) {
        console.error('❌ Website generation failed:', error);
    }
}

// ==============================
// RSS FEED GENERATION
// ==============================

function generateRSSFeed(outputDir) {
    try {
        const blogs = MASTER_CONFIG.blogs || [];

        const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
    <title>${MASTER_CONFIG.site.name} Blog</title>
    <link>${MASTER_CONFIG.site.url}/blogs/</link>
    <description>${MASTER_CONFIG.site.tagline || 'Latest articles and guides'}</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${MASTER_CONFIG.site.url}/blogs/feed.xml" rel="self" type="application/rss+xml"/>

    ${blogs.slice(0, 20).map(blog => `
    <item>
        <title>${blog.title}</title>
        <link>${MASTER_CONFIG.site.url}/blogs/${blog.slug}/</link>
        <description>${blog.metaDescription || blog.description || ''}</description>
        <pubDate>${new Date(blog.date || Date.now()).toUTCString()}</pubDate>
        <guid>${MASTER_CONFIG.site.url}/blogs/${blog.slug}/</guid>
        ${blog.author ? `<author>${blog.author}</author>` : ''}
        ${blog.categories ? blog.categories.map(cat => `<category>${cat}</category>`).join('') : ''}
    </item>
    `).join('')}
</channel>
</rss>`;

        writeFileSync(path.join(outputDir, 'blogs', 'feed.xml'), rss);
        console.log('📡 Generated RSS feed');
    } catch (error) {
        console.error('⚠️ Could not generate RSS feed:', error.message);
    }
}

// ==============================
// SITEMAP GENERATION
// ==============================

function generateSitemap(outputDir) {
    const pages = [
        {
            url: '/',
            lastmod: formatDate(),
            changefreq: 'daily',
            priority: '1.0'
        },
        {
            url: '/blogs/',
            lastmod: formatDate(),
            changefreq: 'weekly',
            priority: '0.9'
        },
        ...(MASTER_CONFIG.blogs || []).map(blog => ({
            url: `/blogs/${blog.slug}/`,
            lastmod: blog.date || formatDate(),
            changefreq: 'monthly',
            priority: '0.8'
        }))
    ];

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(page => `
    <url>
        <loc>${MASTER_CONFIG.site.url}${page.url}</loc>
        <lastmod>${page.lastmod}</lastmod>
        <changefreq>${page.changefreq}</changefreq>
        <priority>${page.priority}</priority>
    </url>
`).join('')}
</urlset>`;

    writeFileSync(path.join(outputDir, 'sitemap.xml'), sitemap);
    console.log('🗺️ Generated sitemap.xml');
}

// ==============================
// DEFAULT MASTER CONFIG CREATION
// ==============================

function createDefaultMasterConfig() {
    const defaultConfig = {
        "site": {
            "name": "Conversion Hub Pro",
            "url": "https://conversionhub.pro",
            "logo": "📐",
            "tagline": "All-in-One Conversion Solutions",
            "description": "Free conversion tools, calculators, and comprehensive guides for all your measurement needs."
        },
        "theme": {
            "primary": "#2e7d32",
            "dark": "#1b5e20",
            "light": "#4caf50",
            "background": "#ffffff",
            "surface": "#f5f5f5",
            "text": "#333333"
        },
        "converters": [
            {
                "id": "cups-to-grams",
                "slug": "cups-to-grams",
                "title": "Cups to Grams Converter",
                "description": "Convert cups to grams for all cooking ingredients",
                "categories": ["cooking", "baking"],
                "featured": true
            }
        ],
        "blogs": [
            {
                "id": "complete-conversion-guide",
                "slug": "complete-conversion-guide",
                "title": "Complete Conversion Guide 2024",
                "description": "Master all types of conversions with this comprehensive guide",
                "metaDescription": "Learn everything about unit conversions including cooking, temperature, and measurement conversions.",
                "keywords": ["conversion guide", "measurement", "cooking conversions"],
                "categories": ["guide", "cooking", "measurement"],
                "date": "2024-01-20",
                "author": "Conversion Expert",
                "readTime": 8,
                "intro": "Understanding conversions is essential for accurate measurements in cooking, science, and daily life. This guide covers everything you need to know.",
                "contentSequence": ["hero", "intro", "paragraphTable", "bulletList", "cardGrid", "faq", "cta"],
                "contentSections": {
                    "intro": {
                        "title": "Why Conversions Matter",
                        "content": "Accurate conversions ensure recipe success, scientific precision, and proper measurements. Whether you're [cooking], [baking], or [working on projects], getting units right is crucial.",
                        "links": [
                            {
                                "text": "cooking",
                                "url": "/converters/cooking",
                                "target": "_blank"
                            },
                            {
                                "text": "baking",
                                "url": "/converters/baking",
                                "target": "_blank"
                            },
                            {
                                "text": "working on projects",
                                "url": "/tools",
                                "target": "_blank"
                            }
                        ]
                    },
                    "paragraphTable": {
                        "title": "Common Conversion Categories",
                        "description": "Quick reference for major unit categories",
                        "content": "Below is a comprehensive table of conversion categories you'll encounter most frequently:",
                        "tableData": {
                            "headers": ["Category", "Common Units", "Usage"],
                            "rows": [
                                ["Cooking", "ml ↔ cups, grams ↔ ounces", "Recipes, baking"],
                                ["Temperature", "Celsius ↔ Fahrenheit", "Cooking, weather"],
                                ["Length", "cm ↔ inches, meters ↔ feet", "Construction, DIY"]
                            ]
                        }
                    },
                    "bulletList": {
                        "title": "Key Conversion Principles",
                        "description": "Essential rules for accurate conversions",
                        "content": "Follow these principles to avoid conversion errors:",
                        "items": [
                            "Always check the unit system (metric vs imperial)",
                            "Use precise conversion factors from [reliable sources]",
                            "Consider rounding appropriately for context",
                            "Double-check critical measurements"
                        ],
                        "links": [
                            {
                                "text": "reliable sources",
                                "url": "/sources",
                                "target": "_blank"
                            }
                        ]
                    },
                    "cardGrid": {
                        "title": "Essential Conversion Tools",
                        "description": "Our most popular conversion calculators",
                        "cards": [
                            {
                                "title": "Cooking Converter",
                                "description": "Convert between cups, ml, grams, and ounces for recipes",
                                "link": {
                                    "url": "/converters/cooking",
                                    "text": "Try Cooking Converter",
                                    "target": "_blank"
                                }
                            },
                            {
                                "title": "Temperature Calculator",
                                "description": "Convert Celsius to Fahrenheit and vice versa",
                                "link": {
                                    "url": "/converters/temperature",
                                    "text": "Try Temperature Tool",
                                    "target": "_blank"
                                }
                            }
                        ]
                    },
                    "faq": {
                        "title": "Frequently Asked Questions",
                        "description": "Common questions about unit conversion",
                        "faqs": [
                            {
                                "question": "How accurate are online conversion tools?",
                                "answer": "Most online tools use standardized conversion factors accurate to at least 6 decimal places. For everyday use, they're more than accurate enough."
                            },
                            {
                                "question": "Why do I get different results from different converters?",
                                "answer": "Differences usually come from rounding methods or different definitions of units. Always use [trusted converters] for consistent results.",
                                "links": [
                                    {
                                        "text": "trusted converters",
                                        "url": "/converters",
                                        "target": "_blank"
                                    }
                                ]
                            }
                        ]
                    },
                    "cta": {
                        "title": "Ready to Convert with Confidence?",
                        "text": "Try our accurate converters for all your measurement needs. Fast, reliable, and completely free.",
                        "buttons": [
                            {
                                "text": "Explore All Converters",
                                "url": "/converters",
                                "style": "primary"
                            },
                            {
                                "text": "View Conversion Charts",
                                "url": "/charts",
                                "style": "secondary"
                            }
                        ]
                    }
                },
                "ads": {
                    "sidebar": {
                        "enabled": true,
                        "items": [
                            {
                                "label": "Popular Tools",
                                "title": "Try Our Converters",
                                "content": "Accurate measurement converters for all your needs",
                                "link": {
                                    "url": "/converters",
                                    "text": "Explore Now"
                                }
                            }
                        ]
                    }
                },
                "seo": {
                    "schema": {
                        "type": "Article"
                    }
                }
            }
        ],
        "pages": {
            "about": {
                "title": "About Us",
                "description": "Learn about our mission and team",
                "content": "We're dedicated to providing accurate conversion tools..."
            },
            "contact": {
                "title": "Contact Us",
                "description": "Get in touch with our team",
                "content": "Have questions or feedback? Reach out to us..."
            },
            "privacy": {
                "title": "Privacy Policy",
                "description": "Our privacy practices",
                "content": "Your privacy is important to us..."
            },
            "terms": {
                "title": "Terms of Service",
                "description": "Terms and conditions",
                "content": "By using our website, you agree to these terms..."
            }
        }
    };

    writeFileSync('./master-config.json', JSON.stringify(defaultConfig, null, 2));
    console.log('✅ Created default master-config.json');
    console.log('\n📝 Edit this single file to control:');
    console.log('   • Site configuration');
    console.log('   • All converters');
    console.log('   • All blog posts');
    console.log('   • Static pages');
    console.log('   • Theme colors');
    console.log('\n🚀 Then run: node generate-website.js');
}

// ==============================
// RUN GENERATOR
// ==============================

if (require.main === module) {
    generateCompleteWebsite();
}

module.exports = {
    generateCompleteWebsite,
    generateBlogPost,
    generateBlogListPage
};