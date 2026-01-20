#!/usr/bin/env node

const fs = require('fs');  // Use regular fs
const path = require('path');
const { existsSync, mkdirSync } = require('fs');

// ==============================
// LOAD JSON CONFIGURATION
// ==============================

let CONFIG = {};
let CONVERTERS = {};
let CONTENT = {};

try {
    CONFIG = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
    CONVERTERS = JSON.parse(fs.readFileSync('./converters.json', 'utf8'));
    CONTENT = JSON.parse(fs.readFileSync('./content.json', 'utf8'));
} catch (error) {
    console.error('❌ Error loading JSON files:', error.message);
    console.log('📝 Creating default JSON files...');
    createDefaultJSON();
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
        const files = await new Promise((resolve, reject) => {
            fs.readdir(dir, (err, files) => {
                if (err) reject(err);
                else resolve(files);
            });
        });

        for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = await new Promise((resolve, reject) => {
                fs.stat(filePath, (err, stat) => {
                    if (err) reject(err);
                    else resolve(stat);
                });
            });

            if (stat.isDirectory()) {
                await cleanDirectory(filePath);
                await new Promise((resolve, reject) => {
                    fs.rmdir(filePath, { recursive: true }, (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
            } else {
                await new Promise((resolve, reject) => {
                    fs.unlink(filePath, (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
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
// NAVIGATION & BREADCRUMB GENERATION
// ==============================

function generateNavigation(currentPage = '', location = 'root') {
    // Helper to determine path based on location
    function getPath(target, currentLoc) {
        if (currentLoc === 'root') {
            // We're at root: /index.html
            const paths = {
                home: 'index.html',
                converters: 'converters/',
                about: 'about/index.html',
                contact: 'contact/index.html',
                privacy: 'privacy/index.html',
                terms: 'terms/index.html'
            };
            return paths[target];
        }

        if (currentLoc === 'converters') {
            // We're at /converters/
            const paths = {
                home: '../index.html',
                converters: './',
                about: '../about/index.html',
                contact: '../contact/index.html',
                privacy: '../privacy/index.html',
                terms: '../terms/index.html'
            };
            return paths[target];
        }

        if (currentLoc.startsWith('converters/')) {
            // We're at /converters/[slug]/
            const paths = {
                home: '../../index.html',
                converters: '../',
                about: '../../about/index.html',
                contact: '../../contact/index.html',
                privacy: '../../privacy/index.html',
                terms: '../../terms/index.html'
            };
            return paths[target];
        }

        // For static pages (about, contact, etc.)
        const paths = {
            home: '../index.html',
            converters: '../converters/',
            about: './index.html',
            contact: './index.html',
            privacy: './index.html',
            terms: './index.html'
        };
        return paths[target];
    }

    const getLinkStyle = (pageName) => {
        return currentPage === pageName ? 'style="color:#2e7d32;font-weight:600;"' : '';
    };

    return `
        <header class="header">
            <div class="container">
                <nav class="navbar">
                    <a href="${getPath('home', location)}" class="logo">
                        ${CONFIG.site.logo} ${CONFIG.site.name}
                    </a>
                    <button class="mobile-menu-btn" aria-label="Menu">☰</button>
                    <ul class="nav-links">
                        <li><a href="${getPath('home', location)}" ${getLinkStyle('home')}>Home</a></li>
                        <li><a href="${getPath('converters', location)}" ${getLinkStyle('converters')}>Converters</a></li>
                        <li><a href="${getPath('about', location)}" ${getLinkStyle('about')}>About</a></li>
                        <li><a href="${getPath('contact', location)}" ${getLinkStyle('contact')}>Contact</a></li>
                    </ul>
                </nav>
            </div>
        </header>
    `;
}

// Add RELATED CONVERTERS function
function getRelatedConverters(currentConverterId, category) {
    if (!category) return [];

    return CONVERTERS.converters
        .filter(c => c.id !== currentConverterId && c.category === category)
        .slice(0, 4);
}

// NEW: Breadcrumb generator function
function generateBreadcrumbs(pageType, pageData = {}, location = 'root') {
    const baseUrl = CONFIG.site.url;
    let breadcrumbs = [];

    // Always start with Home
    breadcrumbs.push({
        name: 'Home',
        url: location === 'root' ? 'index.html' : '../index.html'
    });

    // Add converters category for converter pages
    if (pageType === 'converter') {
        breadcrumbs.push({
            name: 'Converters',
            url: location === 'converters' ? './' : '../converters/'
        });
        breadcrumbs.push({
            name: pageData.title || 'Converter',
            url: '#current'
        });
    }

    // Add category for collection pages
    if (pageType === 'collection') {
        breadcrumbs.push({
            name: 'Converters',
            url: '#current'
        });
    }

    // Add static page name
    if (pageType === 'static') {
        breadcrumbs.push({
            name: pageData.title || 'Page',
            url: '#current'
        });
    }

    // Generate HTML for breadcrumbs
    if (breadcrumbs.length <= 1) return '';

    const breadcrumbHtml = breadcrumbs.map((crumb, index) => {
        if (crumb.url === '#current') {
            return `<span class="breadcrumb-current">${crumb.name}</span>`;
        } else {
            return `<a href="${crumb.url}" class="breadcrumb-link">${crumb.name}</a>`;
        }
    }).join('<span class="breadcrumb-separator">›</span>');

    return `
    <div class="breadcrumb-container">
        <nav aria-label="Breadcrumb" class="breadcrumb">
            ${breadcrumbHtml}
        </nav>
    </div>
    `;
}

// NEW: Generate BreadcrumbList schema
function generateBreadcrumbSchema(pageType, pageData = {}, location = 'root') {
    const baseUrl = CONFIG.site.url;
    let schemaItems = [];
    let position = 1;

    // Home item
    schemaItems.push({
        "@type": "ListItem",
        "position": position++,
        "name": "Home",
        "item": baseUrl + (location === 'root' ? '/' : '../')
    });

    // Converters category for converter pages
    if (pageType === 'converter') {
        schemaItems.push({
            "@type": "ListItem",
            "position": position++,
            "name": "Converters",
            "item": baseUrl + (location === 'converters' ? '/converters/' : '../converters/')
        });
    }

    // Current page (converters collection or converter detail)
    if (pageType === 'collection') {
        schemaItems.push({
            "@type": "ListItem",
            "position": position++,
            "name": "Converters",
            "item": baseUrl + '/converters/'
        });
    } else if (pageType === 'converter' && pageData.slug) {
        schemaItems.push({
            "@type": "ListItem",
            "position": position++,
            "name": pageData.title || 'Converter',
            "item": baseUrl + '/converters/' + pageData.slug + '/'
        });
    } else if (pageType === 'static' && pageData.title) {
        schemaItems.push({
            "@type": "ListItem",
            "position": position++,
            "name": pageData.title,
            "item": baseUrl + '/' + (pageData.slug || '') + '/'
        });
    }

    if (schemaItems.length <= 1) return '';

    return `
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": ${JSON.stringify(schemaItems, null, 2)}
    }
    </script>
    `;
}

function generateFooter(location = 'root') {
    // Helper to determine path based on location (SAME LOGIC AS generateNavigation)
    function getPath(target, currentLoc) {
        if (currentLoc === 'root') {
            const paths = {
                home: 'index.html',
                converters: 'converters/',
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
                about: '../about/index.html',
                contact: '../contact/index.html',
                privacy: '../privacy/index.html',
                terms: '../terms/index.html',
                sitemap: '../sitemap.xml'
            };
            return paths[target];
        }

        if (currentLoc.startsWith('converters/')) {
            // We're at /converters/[slug]/
            const paths = {
                home: '../../index.html',
                converters: '../',
                about: '../../about/index.html',
                contact: '../../contact/index.html',
                privacy: '../../privacy/index.html',
                terms: '../../terms/index.html',
                sitemap: '../../sitemap.xml'
            };
            return paths[target];
        }

        // For static pages
        const paths = {
            home: '../index.html',
            converters: '../converters/',
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
            <div class="container">
                <div class="footer-content">
                    <div class="footer-section">
                        <h3>${CONFIG.site.name}</h3>
                        <p>${CONFIG.site.tagline}</p>
                    </div>
                    <div class="footer-section">
                        <h3>Quick Links</h3>
                        <ul class="footer-links">
                            ${CONVERTERS.converters.slice(0, 3).map(converter => `
                            <li><a href="${getPath('converters', location)}${converter.slug}/">${converter.title}</a></li>
                            `).join('')}
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
                    <p>&copy; ${year} ${CONFIG.site.name}. All rights reserved.</p>
                    <p>Generated on: ${formatDate()}</p>
                </div>
            </div>
        </footer>
    `;
}

// ==============================
// CSS STYLES (Green Growth Theme) - UPDATED
// ==============================

const STYLES = `
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

:root {
    --primary: ${CONFIG.theme.primary};
    --primary-dark: ${CONFIG.theme.dark};
    --primary-light: ${CONFIG.theme.light};
    --background: ${CONFIG.theme.background};
    --surface: ${CONFIG.theme.surface};
    --text: ${CONFIG.theme.text};
    --border: #e0e0e0;
    --success: #4caf50;
    --warning: #ff9800;
    --error: #f44336;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
    line-height: 1.6;
    color: var(--text);
    background-color: var(--background);
    min-height: 100vh;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
}

/* Header */
.header {
    background: var(--surface);
    box-shadow: 0 2px 20px rgba(0,0,0,0.1);
    position: sticky;
    top: 0;
    z-index: 1000;
}

.navbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 0;
}

.logo {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--primary);
    text-decoration: none;
    display: flex;
    align-items: center;
    gap: 8px;
}

.mobile-menu-btn {
    display: none;
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: var(--text);
}

.nav-links {
    display: flex;
    gap: 1.5rem;
    list-style: none;
}

.nav-links a {
    text-decoration: none;
    color: var(--text);
    font-weight: 500;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    transition: all 0.3s;
}

.nav-links a:hover {
    color: var(--primary);
    background: var(--background);
}

/* Breadcrumbs - NEW */
.breadcrumb-container {
    padding: 1rem 0;
    background: var(--background);
    border-bottom: 1px solid var(--border);
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
}

.breadcrumb-link:hover {
    color: var(--primary-dark);
    text-decoration: underline;
}

.breadcrumb-current {
    color: var(--text);
    font-weight: 500;
}

.breadcrumb-separator {
    color: #999;
    margin: 0 0.25rem;
}

/* Main Content */
.main-content {
    padding: 2rem 0;
    min-height: 70vh;
}

/* Cards */
.card {
    background: var(--surface);
    border-radius: 12px;
    padding: 2rem;
    margin-bottom: 2rem;
    box-shadow: 0 5px 15px rgba(0,0,0,0.08);
    border: 1px solid var(--border);
}

/* Converter UI - FIXED LAYOUT */
.converter-wrapper {
    background: var(--surface);
    border-radius: 16px;
    padding: 2rem;
    margin: 2rem 0;
    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
}

.converter-ui {
    display: flex;
    gap: 1.5rem;
    align-items: center;
    justify-content: center;
    margin: 2rem 0;
    flex-wrap: nowrap;
}

.converter-box {
    display: flex;
    flex-direction: row;
    gap: 0.5rem;
    align-items: center;
    flex: 1;
    min-width: 300px;
    max-width: 450px;
}

.converter-input {
    padding: 1rem;
    font-size: 1.2rem;
    border: 2px solid var(--primary-light);
    border-radius: 8px;
    text-align: center;
    flex: 1;
    min-width: 140px;
    height: 56px;
}

.converter-select {
    padding: 1rem;
    border: 2px solid var(--primary-light);
    border-radius: 8px;
    background: white;
    font-size: 1rem;
    flex: 1;
    min-width: 160px;
    height: 56px;
}

.converter-swap {
    background: var(--primary);
    color: white;
    border: none;
    border-radius: 50%;
    width: 56px;
    height: 56px;
    font-size: 1.2rem;
    cursor: pointer;
    transition: all 0.3s;
    flex-shrink: 0;
}

.converter-swap:hover {
    background: var(--primary-dark);
    transform: rotate(180deg);
}

.converter-result {
    text-align: center;
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--primary);
    margin-top: 1rem;
    padding: 1rem;
    background: var(--background);
    border-radius: 8px;
}

/* Tables */
.table-container {
    overflow-x: auto;
    margin: 1.5rem 0;
    border-radius: 8px;
    border: 1px solid var(--border);
}

.conversion-table {
    width: 100%;
    border-collapse: collapse;
    min-width: 600px;
}

.conversion-table th {
    background: var(--primary);
    color: white;
    padding: 1rem;
    text-align: left;
    font-weight: 600;
}

.conversion-table td {
    padding: 1rem;
    border-bottom: 1px solid var(--border);
}

.conversion-table tr:last-child td {
    border-bottom: none;
}

.conversion-table tr:hover {
    background-color: var(--background);
}

/* Ads */
.ad-unit {
    margin: 2rem 0;
    text-align: center;
    background: var(--surface);
    border-radius: 8px;
    padding: 1rem;
    border: 2px dashed var(--border);
}

.ad-label {
    color: #666;
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 0.5rem;
}

.ad-content {
    min-height: 100px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--background);
    border-radius: 4px;
    color: #666;
}

/* FAQ */
.faq-section {
    margin: 2rem 0;
}

.faq-item {
    border-bottom: 1px solid var(--border);
    padding: 1rem 0;
}

.faq-question {
    width: 100%;
    text-align: left;
    background: none;
    border: none;
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--text);
    padding: 0.5rem 0;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.faq-answer {
    padding: 1rem 0;
    color: #555;
    line-height: 1.8;
}

/* Footer */
.footer {
    background: var(--primary-dark);
    color: white;
    padding: 3rem 0 1.5rem;
    margin-top: 3rem;
}

.footer-content {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 2rem;
    margin-bottom: 2rem;
}

.footer-section h3 {
    color: white;
    margin-bottom: 1rem;
    font-size: 1.2rem;
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
    font-size: 0.9rem;
}

/* Responsive Design - FIXED CONVERTER */
@media (max-width: 768px) {
    .mobile-menu-btn {
        display: block;
    }

    .nav-links {
        display: none;
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: var(--surface);
        flex-direction: column;
        padding: 1rem;
        box-shadow: 0 5px 15px rgba(0,0,0,0.1);
    }

    .nav-links.active {
        display: flex;
    }

    .converter-ui {
        flex-direction: column;
        align-items: stretch;
        gap: 1rem;
    }

    .converter-box {
        flex-direction: row;
        width: 100%;
        max-width: 100%;
        min-width: auto;
    }

    .converter-input,
    .converter-select {
        width: 50%;
        height: 52px;
    }

    .converter-swap {
        margin: 0.5rem auto;
        order: 3;
    }

    .footer-content {
        grid-template-columns: 1fr;
        text-align: center;
    }

    .table-container {
        margin: 1rem -1rem;
    }

    .conversion-table {
        min-width: 100%;
    }

    .conversion-table th,
    .conversion-table td {
        padding: 0.75rem 0.5rem;
        font-size: 0.9rem;
    }

    .breadcrumb {
        font-size: 0.85rem;
    }
}

@media (max-width: 480px) {
    .container {
        padding: 0 15px;
    }

    .card, .converter-wrapper {
        padding: 1.5rem;
    }

    .converter-input {
        font-size: 1rem;
        padding: 0.75rem;
        height: 48px;
    }

    .converter-select {
        font-size: 0.95rem;
        padding: 0.75rem;
        height: 48px;
    }

    .converter-swap {
        width: 48px;
        height: 48px;
    }
}
`;

// ==============================
// CONVERTER JAVASCRIPT LOGIC (UNCHANGED)
// ==============================

const CONVERTER_JS = `
document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');

    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', function() {
            navLinks.classList.toggle('active');
        });

        // Close menu when clicking outside
        document.addEventListener('click', function(event) {
            if (!mobileMenuBtn.contains(event.target) && !navLinks.contains(event.target)) {
                navLinks.classList.remove('active');
            }
        });
    }

    // Initialize converter if present
    const converterData = document.getElementById('converter-data');
    if (converterData) {
        initConverter(JSON.parse(converterData.textContent));
    }

    // FAQ toggle functionality
    document.querySelectorAll('.faq-question').forEach(button => {
        button.addEventListener('click', function() {
            const answer = this.nextElementSibling;
            const isExpanded = this.getAttribute('aria-expanded') === 'true';

            // Close other FAQs
            if (!isExpanded) {
                document.querySelectorAll('.faq-question[aria-expanded="true"]').forEach(otherBtn => {
                    otherBtn.setAttribute('aria-expanded', 'false');
                    otherBtn.nextElementSibling.style.display = 'none';
                });
            }

            // Toggle current FAQ
            this.setAttribute('aria-expanded', !isExpanded);
            answer.style.display = isExpanded ? 'none' : 'block';
        });
    });
});

function initConverter(data) {
    const fromInput = document.getElementById('fromValue');
    const fromUnit = document.getElementById('fromUnit');
    const toInput = document.getElementById('toValue');
    const toUnit = document.getElementById('toUnit');
    const swapBtn = document.querySelector('.converter-swap');
    const resultSpan = document.getElementById('converterResult') || document.querySelector('.converter-result');

    if (!fromInput) return;

    // Populate unit options
    if (data.supportedUnits && Array.isArray(data.supportedUnits)) {
        data.supportedUnits.forEach(unit => {
            const option1 = document.createElement('option');
            option1.value = unit;
            option1.textContent = unit;
            fromUnit.appendChild(option1);

            const option2 = document.createElement('option');
            option2.value = unit;
            option2.textContent = unit;
            toUnit.appendChild(option2);
        });

        // Set default values
        if (data.defaults) {
            fromInput.value = data.defaults.value || 1;
            fromUnit.value = data.defaults.from || data.supportedUnits[0];
            toUnit.value = data.defaults.to || data.supportedUnits[1];
        }
    }

    function convert() {
        const value = parseFloat(fromInput.value) || 0;
        const from = fromUnit.value;
        const to = toUnit.value;

        // Get conversion from JSON data
        if (data.conversions && data.conversions[from] && data.conversions[from][to]) {
            const result = value * data.conversions[from][to];
            toInput.value = result.toFixed(2);

            if (resultSpan) {
                resultSpan.textContent = \`\${value} \${from} = \${result.toFixed(2)} \${to}\`;
            }

            // Update URL for sharing
            updateURL(value, from, to);
        } else if (data.conversionFormulas) {
            // Use formula-based conversion
            const result = applyFormula(value, from, to, data.conversionFormulas);
            if (result !== null) {
                toInput.value = result.toFixed(2);
                if (resultSpan) {
                    resultSpan.textContent = \`\${value} \${from} = \${result.toFixed(2)} \${to}\`;
                }
                updateURL(value, from, to);
            }
        }
    }

    function applyFormula(value, from, to, formulas) {
        for (const formula of formulas) {
            if (formula.from === from && formula.to === to) {
                try {
                    // Safely create a function where 'x' is the parameter
                    const func = new Function('x', 'return ' + formula.formula);
                    return func(value);
                } catch (e) {
                    console.error('Formula error:', e, 'for', formula);
                    return null;
                }
            }
        }
        return null;
    }

    function updateURL(value, from, to) {
        const params = new URLSearchParams();
        params.set('value', value);
        params.set('from', from);
        params.set('to', to);

        const newURL = window.location.pathname + '?' + params.toString();
        window.history.replaceState({}, '', newURL);
    }

    function swapUnits() {
        const tempUnit = fromUnit.value;
        const tempValue = fromInput.value;

        fromUnit.value = toUnit.value;
        toUnit.value = tempUnit;
        fromInput.value = toInput.value;
        toInput.value = tempValue;

        convert();
    }

    // Event listeners
    fromInput.addEventListener('input', convert);
    fromUnit.addEventListener('change', convert);
    toUnit.addEventListener('change', convert);

    if (swapBtn) {
        swapBtn.addEventListener('click', swapUnits);
    }

    // Check URL parameters for initial values
    const params = new URLSearchParams(window.location.search);
    const urlValue = params.get('value');
    const urlFrom = params.get('from');
    const urlTo = params.get('to');

    if (urlValue && urlFrom && urlTo) {
        fromInput.value = urlValue;
        fromUnit.value = urlFrom;
        toUnit.value = urlTo;
    }

    // Initial conversion
    convert();
}
`;

// ==============================
// SEO & SCHEMA GENERATION - UPDATED
// ==============================

function generateMetaTags(page) {
    const title = page.meta_title || `${page.title} | ${CONFIG.site.name}`;
    const description = page.meta_description || page.description || CONFIG.site.description;
    const keywords = page.keywords || CONFIG.site.keywords.join(', ');
    const canonical = `${CONFIG.site.url}${page.url}`;
    const ogImage = `${CONFIG.site.url}/og-image.jpg`;

    return `
    <!-- Primary Meta Tags -->
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
    <title>${title}</title>
    <meta name="description" content="${description}">
    <meta name="keywords" content="${keywords}">
    <meta name="author" content="${CONFIG.site.name}">

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="${canonical}">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${ogImage}">
    <meta property="og:locale" content="en_US">
    <meta property="og:site_name" content="${CONFIG.site.name}">

    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="${canonical}">
    <meta property="twitter:title" content="${title}">
    <meta property="twitter:description" content="${description}">
    <meta property="twitter:image" content="${ogImage}">

    <!-- Canonical -->
    <link rel="canonical" href="${canonical}">

    <!-- Robots -->
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
    <meta name="googlebot" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">

    <!-- Structured Data -->
    ${generateSchemaOrg(page)}
    `;
}

function generateSchemaOrg(page) {
    const baseSchema = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": page.title,
        "description": page.description,
        "url": `${CONFIG.site.url}${page.url}`,
        "datePublished": formatDate(),
        "dateModified": formatDate(),
        "publisher": {
            "@type": "Organization",
            "name": CONFIG.site.name,
            "url": CONFIG.site.url
        }
    };

    // Add HowTo schema for converter pages
    if (page.type === 'converter') {
        return `
        <script type="application/ld+json">
        {
            "@context": "https://schema.org",
            "@type": "HowTo",
            "name": "${page.title}",
            "description": "${page.description}",
            "totalTime": "PT2M",
            "step": [
                {
                    "@type": "HowToStep",
                    "text": "Enter the value you want to convert"
                },
                {
                    "@type": "HowToStep",
                    "text": "Select the unit you're converting from"
                },
                {
                    "@type": "HowToStep",
                    "text": "Select the unit you want to convert to"
                },
                {
                    "@type": "HowToStep",
                    "text": "View the converted result instantly"
                }
            ]
        }
        </script>
        <script type="application/ld+json">
        ${JSON.stringify(baseSchema, null, 2)}
        </script>
        `;
    }

    return `<script type="application/ld+json">${JSON.stringify(baseSchema, null, 2)}</script>`;
}



// ==============================
// ADVERTISEMENT GENERATION (UNCHANGED)
// ==============================

function generateAdUnit(position, pageType, pageId = '') {
    const adsConfig = CONFIG.ads || {};

    // 1. CHECK GLOBAL SITE SETTING FIRST
    if (!adsConfig.enabled) return '';

    // 2. CHECK FOR PER-CONVERTER OVERRIDE (NEW LOGIC)
    // Only check for converter pages
    if (pageType === 'converter' && pageId) {
        // Find the specific converter in your JSON data
        const converter = CONVERTERS.converters.find(c => c.id === pageId);

        // If this converter exists AND has its own 'ads' settings...
        if (converter && converter.ads) {
            // Check if this specific ad position is set to false
            // Example: converter.ads.top === false
            if (converter.ads[position] === false) {
                return ''; // Don't show this ad unit
            }
        }
    }

    // 3. Original global placement checks (keep these)
    const placementKey = `${pageType}_${position}`;
    const placements = adsConfig.placements || {};
    if (!placements[placementKey]) return '';

    const excludePages = adsConfig.excludePages || [];
    if (excludePages.includes(pageId)) return '';

    // 4. Return the ad HTML if all checks pass
    return `
    <div class="ad-unit ad-${position}">
        <div class="ad-label">Advertisement</div>
        <div class="ad-content">
            <!-- Ad code would be inserted here -->
            <div>${CONFIG.site.name} - Ad Space</div>
        </div>
    </div>
    `;
}

// ==============================
// PAGE GENERATORS - UPDATED
// ==============================

function generateHomepage() {
    const featuredConverters = CONVERTERS.converters
        .filter(c => c.featured)
        .slice(0, 6);

    const page = {
        title: CONFIG.site.name,
        description: CONFIG.site.description,
        url: '/',
        type: 'home',
        keywords: CONFIG.site.keywords
    };

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    ${generateMetaTags(page)}
    <style>${STYLES}</style>
    <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>${CONFIG.site.logo}</text></svg>">
</head>
<body>
    ${generateNavigation('home', 'root')}
    ${generateBreadcrumbs('home', {}, 'root')}
    ${generateBreadcrumbSchema('home', {}, 'root')}

    <main class="main-content">
        <div class="container">
            <!-- Hero Section -->
            <div class="card">
                <h1 style="font-size: 2.5rem; color: var(--primary); margin-bottom: 1rem;">
                    ${CONTENT.homepage?.hero?.title || 'Free Cooking Measurement Converters'}
                </h1>
                <p style="font-size: 1.2rem; color: var(--text); margin-bottom: 2rem;">
                    ${CONTENT.homepage?.hero?.subtitle || CONFIG.site.tagline}
                </p>
            </div>

            ${generateAdUnit('top', 'home')}

                <!-- Featured Converter -->
                ${featuredConverters.length > 0 ? `
                <div class="converter-wrapper">
                    <h2 style="text-align: center; margin-bottom: 1.5rem; color: var(--primary-dark);">
                        ${featuredConverters[0].title}
                    </h2>
                    <div class="converter-ui">
                        <div class="converter-box">
                            <input type="number" id="fromValue" class="converter-input" value="1" step="0.01" aria-label="Value to convert">
                            <select id="fromUnit" class="converter-select" aria-label="Convert from unit"></select>
                        </div>
                        <button class="converter-swap" aria-label="Swap units">⇄</button>
                        <div class="converter-box">
                            <input type="number" id="toValue" class="converter-input" readonly aria-label="Converted value">
                            <select id="toUnit" class="converter-select" aria-label="Convert to unit"></select>
                        </div>
                    </div>
                    <div class="converter-result" id="converterResult"></div>
                    <script type="application/json" id="converter-data">
                    ${JSON.stringify(featuredConverters[0])}
                    </script>
                </div>
                ` : ''}

            ${generateAdUnit('middle', 'home')}

            <!-- Converter Grid -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; margin: 2rem 0;">
                ${CONVERTERS.converters.map(converter => `
                <div class="card">
                    <h3>${converter.title}</h3>
                    <p>${converter.description}</p>
                    <a href="converters/${converter.slug}/" style="
                        display: inline-block;
                        margin-top: 1rem;
                        padding: 0.75rem 1.5rem;
                        background: var(--primary);
                        color: white;
                        text-decoration: none;
                        border-radius: 6px;
                        font-weight: 500;
                    ">Use Converter</a>
                </div>
                `).join('')}
            </div>

            ${generateAdUnit('bottom', 'home')}

            <!-- SEO Content -->
            <div class="card">
                <h2>Cooking Conversion Guide</h2>
                ${CONTENT.homepage?.content?.map(section => `
                <div style="margin: 1.5rem 0;">
                    <h3 style="color: var(--primary-dark); margin-bottom: 1rem;">${section.title}</h3>
                    <p>${section.content}</p>
                </div>
                `).join('') || CONFIG.site.keywords.map(keyword => `
                <div style="margin: 1.5rem 0;">
                    <h3 style="color: var(--primary-dark);">${keyword.charAt(0).toUpperCase() + keyword.slice(1)}</h3>
                    <p>Convert ${keyword} with our accurate calculators. Get instant results for all your cooking and baking needs.</p>
                </div>
                `).join('')}
            </div>

            <!-- FAQ Section -->
            ${CONTENT.homepage?.faqs ? `
            <div class="card">
                <h2>Frequently Asked Questions</h2>
                <div class="faq-section">
                    ${CONTENT.homepage.faqs.map(faq => `
                    <div class="faq-item">
                        <button class="faq-question" aria-expanded="false">
                            ${faq.question}
                            <span>+</span>
                        </button>
                        <div class="faq-answer" style="display: none;">
                            <p>${faq.answer}</p>
                        </div>
                    </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}
        </div>
    </main>

    ${generateFooter('root')}

    <script>${CONVERTER_JS}</script>
</body>
</html>
    `;
}

function generateConverterPage(converter) {
    const page = {
        title: converter.title,
        description: converter.description,
        url: `/converters/${converter.slug}/`,
        type: 'converter',
        keywords: converter.keywords || converter.title
    };

    // Get related converters
    const related = getRelatedConverters(converter.id, converter.category);
    const relatedHtml = related.length > 0 ? `
    <div class="card">
        <h2>Related Converters</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; margin-top: 1rem;">
            ${related.map(r => `
            <div style="background: var(--background); padding: 1rem; border-radius: 8px; border: 1px solid var(--border);">
                <h3 style="font-size: 1.1rem; margin-bottom: 0.5rem;">${r.title}</h3>
                <p style="font-size: 0.9rem; color: var(--text); margin-bottom: 1rem;">${r.description.slice(0, 80)}...</p>
                <a href="../${r.slug}/" style="display: inline-block; padding: 0.5rem 1rem; background: var(--primary-light); color: var(--primary-dark); text-decoration: none; border-radius: 4px; font-weight: 500;">Use Tool</a>            </div>
            `).join('')}
        </div>
    </div>
    ` : '';

    // Generate conversion table HTML
    let conversionTableHTML = '';
    if (converter.conversionTable && converter.conversionTable.length > 0) {
        conversionTableHTML = `
        <div class="table-container">
            <table class="conversion-table">
                <thead>
                    <tr>
                        <th>From</th>
                        <th>To</th>
                        <th>Conversion Factor</th>
                    </tr>
                </thead>
                <tbody>
                    ${converter.conversionTable.map(row => `
                    <tr>
                        <td>1 ${row.from}</td>
                        <td>${row.to}</td>
                        <td>${row.factor}</td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        `;
    }

    // NEW: Add back to converters link
    const backToConvertersLink = `
    <div style="margin: 1.5rem 0;">
        <a href="../" style="color: var(--primary); text-decoration: none; font-weight: 500; display: inline-flex; align-items: center; gap: 0.5rem;">
            ← Back to All Converters
        </a>
    </div>
    `;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    ${generateMetaTags(page)}
    <style>${STYLES}</style>
    <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>${CONFIG.site.logo}</text></svg>">
</head>
<body>
    ${generateNavigation(converter.slug, `converters/${converter.slug}`)}
    ${generateBreadcrumbs('converter', converter, 'converters')}
    ${generateBreadcrumbSchema('converter', converter, 'converters')}

    <main class="main-content">
        <div class="container">
            ${backToConvertersLink}

            <div class="card">
                <h1 style="color: var(--primary);">${converter.title}</h1>
                <p style="font-size: 1.1rem; color: var(--text); margin: 1rem 0 2rem;">
                    ${converter.description}
                </p>
            </div>

            ${generateAdUnit('top', 'converter', converter.id)}

                <!-- Converter -->
                <div class="converter-wrapper">
                    <div class="converter-ui">
                        <div class="converter-box">
                            <input type="number" id="fromValue" class="converter-input" value="${converter.defaults?.value || 1}" step="0.01" aria-label="Value to convert">
                            <select id="fromUnit" class="converter-select" aria-label="Convert from unit"></select>
                        </div>
                        <button class="converter-swap" aria-label="Swap units">⇄</button>
                        <div class="converter-box">
                            <input type="number" id="toValue" class="converter-input" readonly aria-label="Converted value">
                            <select id="toUnit" class="converter-select" aria-label="Convert to unit"></select>
                        </div>
                    </div>
                    <div class="converter-result" id="converterResult"></div>
                    <script type="application/json" id="converter-data">
                    ${JSON.stringify(converter)}
                    </script>
                </div>

            ${generateAdUnit('middle', 'converter', converter.id)}

            <!-- Conversion Table -->
            ${conversionTableHTML}

            <!-- FAQ Section -->
            ${converter.faqs && converter.faqs.length > 0 ? `
            <div class="card">
                <h2>Frequently Asked Questions</h2>
                <div class="faq-section">
                    ${converter.faqs.map(faq => `
                    <div class="faq-item">
                        <button class="faq-question" aria-expanded="false">
                            ${faq.question}
                            <span>+</span>
                        </button>
                        <div class="faq-answer" style="display: none;">
                            <p>${faq.answer}</p>
                        </div>
                    </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}

            <!-- Content Sections -->
            ${converter.contentSections ? converter.contentSections.map(section => `
            <div class="card">
                <h2>${section.title}</h2>
                <p>${section.content}</p>
                ${section.tips ? `
                <div style="margin-top: 1.5rem;">
                    <h3 style="color: var(--primary-dark);">Tips:</h3>
                    <ul style="margin-left: 1.5rem; margin-top: 0.5rem;">
                        ${section.tips.map(tip => `<li>${tip}</li>`).join('')}
                    </ul>
                </div>
                ` : ''}
            </div>
            `).join('') : ''}

            ${generateAdUnit('bottom', 'converter', converter.id)}

            ${relatedHtml}
        </div>
    </main>

    ${generateFooter(`converters/${converter.slug}`)}

    <script>${CONVERTER_JS}</script>
</body>
</html>
    `;
}

function generateStaticPage(pageName, content) {
    const page = {
        title: content.title,
        description: content.description,
        url: `/${pageName}/`,
        type: 'static'
    };

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    ${generateMetaTags(page)}
    <style>${STYLES}</style>
    <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>${CONFIG.site.logo}</text></svg>">
</head>
<body>
    ${generateNavigation(pageName, pageName)}
    ${generateBreadcrumbs('static', content, pageName)}
    ${generateBreadcrumbSchema('static', content, pageName)}

    <main class="main-content">
        <div class="container">
            <div class="card">
                <h1 style="color: var(--primary);">${content.title}</h1>
                <div style="margin-top: 1.5rem; line-height: 1.8;">
                    ${content.content}
                </div>
            </div>

            <!-- FAQ Section if available -->
            ${content.faqs ? `
            <div class="card">
                <h2>Frequently Asked Questions</h2>
                <div class="faq-section">
                    ${content.faqs.map(faq => `
                    <div class="faq-item">
                        <button class="faq-question" aria-expanded="false">
                            ${faq.question}
                            <span>+</span>
                        </button>
                        <div class="faq-answer" style="display: none;">
                            <p>${faq.answer}</p>
                        </div>
                    </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}
        </div>
    </main>

    ${generateFooter(pageName)}

    <script>${CONVERTER_JS}</script>
</body>
</html>
    `;
}

// ==============================
// SITEMAP GENERATOR (UNCHANGED)
// ==============================

function generateSitemap() {
    const pages = [
        {
            url: '/',
            lastmod: formatDate(),
            changefreq: 'daily',
            priority: '1.0'
        },
        {
            url: '/about/',
            lastmod: formatDate(),
            changefreq: 'monthly',
            priority: '0.8'
        },
        {
            url: '/contact/',
            lastmod: formatDate(),
            changefreq: 'monthly',
            priority: '0.8'
        },
        {
            url: '/privacy/',
            lastmod: formatDate(),
            changefreq: 'yearly',
            priority: '0.5'
        },
        {
            url: '/terms/',
            lastmod: formatDate(),
            changefreq: 'yearly',
            priority: '0.5'
        },
        ...CONVERTERS.converters.map(converter => ({
            url: `/converters/${converter.slug}/`,
            lastmod: formatDate(),
            changefreq: 'weekly',
            priority: '0.9'
        }))
    ];

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(page => `
    <url>
        <loc>${CONFIG.site.url}${page.url}</loc>
        <lastmod>${page.lastmod}</lastmod>
        <changefreq>${page.changefreq}</changefreq>
        <priority>${page.priority}</priority>
    </url>
`).join('')}
</urlset>`;
}

function generateRobotsTxt() {
    return `# robots.txt
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /private/

Sitemap: ${CONFIG.site.url}/sitemap.xml

# Crawl delay
Crawl-delay: 2

# Ads bots
User-agent: AdsBot-Google
Allow: /

# Image bots
User-agent: Googlebot-Image
Allow: /
`;
}

// ==============================
// DEFAULT JSON CREATION (UNCHANGED)
// ==============================

function createDefaultJSON() {
    const defaultConfig = {
        "site": {
            "name": "Cooking Converter Pro",
            "url": "https://cookingconverter.pro",
            "logo": "🍳",
            "tagline": "Free Cooking Measurement Converters",
            "description": "Convert cups to grams, oven temperatures, American to metric, and all cooking measurements instantly",
            "keywords": [
                "cooking measurement conversion",
                "oven temp conversion",
                "1 cooking cup in grams",
                "1 cup in baking is how many ml",
                "180 oven conversion",
                "american to english cooking conversion",
                "american to metric cooking conversion",
                "baking conversion calculator grams to cups",
                "baking grams to cups",
                "common cooking conversions",
                "convection oven conversion calculator"
            ]
        },
        "theme": {
            "primary": "#2e7d32",
            "dark": "#1b5e20",
            "light": "#4caf50",
            "background": "#f5f9f5",
            "surface": "#ffffff",
            "text": "#333333"
        },
        "ads": {
            "enabled": true,
            "placements": {
                "home_top": true,
                "home_middle": true,
                "home_bottom": true,
                "converter_top": true,
                "converter_middle": true,
                "converter_bottom": true
            },
            "excludePages": []
        }
    };

    const defaultConverters = {
        "converters": [
            {
                "id": "cups-to-grams",
                "slug": "cups-to-grams",
                "title": "Cups to Grams Converter",
                "description": "Convert cups to grams for all cooking ingredients",
                "keywords": ["cups to grams", "1 cup in grams", "baking measurement conversion"],
                "defaults": {
                    "value": 1,
                    "from": "cup",
                    "to": "gram"
                },
                "supportedUnits": ["cup", "gram", "ounce", "tablespoon", "teaspoon"],
                "conversions": {
                    "cup": { "gram": 125, "ounce": 8.8, "tablespoon": 16, "teaspoon": 48 },
                    "gram": { "cup": 0.008, "ounce": 0.035, "tablespoon": 0.067, "teaspoon": 0.2 },
                    "ounce": { "cup": 0.113, "gram": 28.35, "tablespoon": 2, "teaspoon": 6 }
                },
                "conversionTable": [
                    { "from": "cup", "to": "grams", "factor": "125g" },
                    { "from": "cup", "to": "ounces", "factor": "8.8 oz" },
                    { "from": "cup", "to": "tablespoons", "factor": "16 tbsp" }
                ],
                "faqs": [
                    {
                        "question": "How many grams are in 1 cup of flour?",
                        "answer": "1 cup of all-purpose flour equals approximately 125 grams."
                    },
                    {
                        "question": "Is 1 cup always 240ml?",
                        "answer": "Yes, in the US measurement system, 1 cup equals 240 milliliters."
                    }
                ],
                "contentSections": [
                    {
                        "title": "Understanding Cup Measurements",
                        "content": "Cup measurements vary between countries. In the United States, 1 cup equals 240 milliliters, while in the United Kingdom, 1 cup equals 284 milliliters. Always check which measurement system your recipe uses.",
                        "tips": [
                            "Use dry measuring cups for dry ingredients",
                            "Use liquid measuring cups for liquids",
                            "Level off dry ingredients with a straight edge"
                        ]
                    }
                ],
                "featured": true
            }
        ]
    };

    const defaultContent = {
        "homepage": {
            "hero": {
                "title": "Free Cooking & Baking Converters",
                "subtitle": "Convert cups to grams, oven temperatures, American to metric, and all cooking measurements instantly"
            },
            "content": [
                {
                    "title": "Cooking Measurement Conversion",
                    "content": "Our cooking measurement converters provide accurate conversions for all your cooking and baking needs. Convert between cups, tablespoons, teaspoons, milliliters, ounces, grams, and more."
                }
            ],
            "faqs": [
                {
                    "question": "How accurate are your converters?",
                    "answer": "Our converters use standard conversion factors and are accurate for most cooking and baking applications."
                }
            ]
        },
        "about": {
            "title": "About Us",
            "description": "Learn about Cooking Converter Pro",
            "content": "<p>Cooking Converter Pro was created to help home cooks and professional chefs convert cooking measurements accurately and instantly.</p>"
        },
        "privacy": {
            "title": "Privacy Policy",
            "description": "Privacy policy for Cooking Converter Pro",
            "content": "<p>Your privacy is important to us...</p>"
        },
        "terms": {
            "title": "Terms of Service",
            "description": "Terms of service for Cooking Converter Pro",
            "content": "<p>By using our website, you agree to our terms...</p>"
        },
        "contact": {
            "title": "Contact Us",
            "description": "Contact Cooking Converter Pro",
            "content": "<p>Get in touch with us for questions or feedback...</p>"
        }
    };

    fs.writeFileSync('./config.json', JSON.stringify(defaultConfig, null, 2));
    fs.writeFileSync('./converters.json', JSON.stringify(defaultConverters, null, 2));
    fs.writeFileSync('./content.json', JSON.stringify(defaultContent, null, 2));

    console.log('✅ Created default JSON files:');
    console.log('   - config.json');
    console.log('   - converters.json');
    console.log('   - content.json');
    console.log('\n📝 Edit these files and run: node generate.js');
}

// ==============================
// MAIN GENERATION FUNCTION - UPDATED
// ==============================

async function generateWebsite() {
    console.log('🚀 Starting website generation...');
    console.log(`📊 Site: ${CONFIG.site.name}`);
    console.log(`📊 Converters: ${CONVERTERS.converters.length}`);

    const outputDir = './public';

    try {
        // Clean and create directories
        await cleanDirectory(outputDir);
        ensureDirectory(outputDir);
        ensureDirectory(path.join(outputDir, 'converters'));
        ensureDirectory(path.join(outputDir, 'about'));
        ensureDirectory(path.join(outputDir, 'contact'));
        ensureDirectory(path.join(outputDir, 'privacy'));
        ensureDirectory(path.join(outputDir, 'terms'));

        // Generate pages
        console.log('📄 Generating pages...');

        // Homepage
        console.log('🏠 Generating homepage...');
        await new Promise((resolve, reject) => {
            fs.writeFile(
                path.join(outputDir, 'index.html'),
                generateHomepage(),
                'utf8',
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });

        // Converter pages
        console.log(`⚖️ Generating ${CONVERTERS.converters.length} converter pages...`);
        for (const converter of CONVERTERS.converters) {
            ensureDirectory(path.join(outputDir, 'converters', converter.slug));
            await new Promise((resolve, reject) => {
                fs.writeFile(
                    path.join(outputDir, 'converters', converter.slug, 'index.html'),
                    generateConverterPage(converter),
                    'utf8',
                    (err) => {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });
        }

        // Static pages
        const staticPages = ['about', 'privacy', 'terms', 'contact'];
        for (const pageName of staticPages) {
            if (CONTENT[pageName]) {
                console.log(`📄 Generating ${pageName} page...`);
                await new Promise((resolve, reject) => {
                    fs.writeFile(
                        path.join(outputDir, pageName, 'index.html'),
                        generateStaticPage(pageName, CONTENT[pageName]),
                        'utf8',
                        (err) => {
                            if (err) reject(err);
                            else resolve();
                        }
                    );
                });
            }
        }

        // Sitemap
        console.log('🗺️ Generating sitemap.xml...');
        await new Promise((resolve, reject) => {
            fs.writeFile(
                path.join(outputDir, 'sitemap.xml'),
                generateSitemap(),
                'utf8',
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });

        // Robots.txt
        console.log('🤖 Generating robots.txt...');
        await new Promise((resolve, reject) => {
            fs.writeFile(
                path.join(outputDir, 'robots.txt'),
                generateRobotsTxt(),
                'utf8',
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });

        // Converters index page
        console.log('📁 Generating converters index...');
        const convertersIndex = `
<!DOCTYPE html>
<html lang="en">
<head>
    ${generateMetaTags({
        title: 'All Converters',
        description: 'Browse all cooking measurement converters',
        url: '/converters/',
        type: 'collection'
    })}
    <style>${STYLES}</style>
</head>
<body>
    ${generateNavigation('converters', 'converters')}
    ${generateBreadcrumbs('collection', {title: 'Converters'}, 'converters')}
    ${generateBreadcrumbSchema('collection', {title: 'Converters'}, 'converters')}

    <main class="main-content">
        <div class="container">
            <div class="card">
                <h1 style="color: var(--primary);">All Cooking Converters</h1>
                <p style="margin: 1rem 0 2rem;">Browse all ${CONVERTERS.converters.length} converters</p>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; margin-top: 1.5rem;">
                    ${CONVERTERS.converters.map(converter => `
                    <div style="background: var(--surface); padding: 1.5rem; border-radius: 8px; border: 1px solid var(--border);">
                        <h3>${converter.title}</h3>
                        <p style="margin: 0.5rem 0 1rem; font-size: 0.95rem; color: var(--text);">
                            ${converter.description}
                        </p>
                        <a href="${converter.slug}/" style="
                            display: inline-block;
                            padding: 0.5rem 1rem;
                            background: var(--primary);
                            color: white;
                            text-decoration: none;
                            border-radius: 4px;
                            font-weight: 500;
                        ">Use Converter</a>
                    </div>
                    `).join('')}
                </div>
            </div>
        </div>
    </main>
    ${generateFooter('converters')}
    <script>${CONVERTER_JS}</script>
</body>
</html>
        `;

        await new Promise((resolve, reject) => {
            fs.writeFile(
                path.join(outputDir, 'converters', 'index.html'),
                convertersIndex,
                'utf8',
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });

        console.log('\n' + '='.repeat(50));
        console.log('✅ GENERATION COMPLETE!');
        console.log('='.repeat(50));
        console.log(`📊 Statistics:`);
        console.log(`   Total pages: ${4 + CONVERTERS.converters.length}`);
        console.log(`   Converters: ${CONVERTERS.converters.length}`);
        console.log(`   Static pages: 4`);
        console.log(`   SEO Keywords: ${CONFIG.site.keywords.length}`);
        console.log(`   Ads: ${CONFIG.ads.enabled ? 'Enabled' : 'Disabled'}`);
        console.log('\n📁 File structure:');
        console.log(`   ${outputDir}/`);
        console.log(`   ├── index.html`);
        console.log(`   ├── converters/`);
        console.log(`   │   ├── index.html`);
        console.log(`   │   └── [slug]/index.html`);
        console.log(`   ├── about/index.html`);
        console.log(`   ├── contact/index.html`);
        console.log(`   ├── privacy/index.html`);
        console.log(`   ├── terms/index.html`);
        console.log(`   ├── sitemap.xml`);
        console.log(`   └── robots.txt`);
        console.log('\n✅ NEW SEO FEATURES ADDED:');
        console.log('   • Breadcrumb navigation on all pages');
        console.log('   • BreadcrumbList structured data schema');
        console.log('   • Internal linking (back to converters)');
        console.log('   • Improved page hierarchy');
        console.log('\n🚀 To serve locally:');
        console.log('   cd public && npx serve');
        console.log('\n🔧 To update:');
        console.log('   1. Edit JSON files (config.json, converters.json, content.json)');
        console.log('   2. Run: node generate.js');
        console.log('='.repeat(50));

    } catch (error) {
        console.error('❌ Generation failed:', error);
    }
}

// ==============================
// RUN GENERATOR
// ==============================

if (require.main === module) {
    generateWebsite();
}

module.exports = { generateWebsite };