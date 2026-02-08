#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { existsSync, mkdirSync } = require('fs');

// ==============================
// LOAD JSON CONFIGURATION
// ==============================

let CONFIG = {};
let CONVERTERS = {};
let CONTENT = {};
let BLOGS = {}; // NEW: Add blogs variable

try {
    CONFIG = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
    CONVERTERS = JSON.parse(fs.readFileSync('./converters.json', 'utf8'));
    CONTENT = JSON.parse(fs.readFileSync('./content.json', 'utf8'));

    // NEW: Load blogs if file exists
    if (existsSync('./blogs.json')) {
        BLOGS = JSON.parse(fs.readFileSync('./blogs.json', 'utf8'));
        console.log(`📝 Loaded ${BLOGS.blogs ? BLOGS.blogs.length : 0} blog posts`);
    }
} catch (error) {
    console.error('❌ Error loading JSON files:', error.message);

    // Log which specific JSON file caused the error
    const errorMessage = error.message;
    if (errorMessage.includes('config.json')) {
        console.error('📁 Failed to parse: config.json');
        console.error('🔑 Check the structure of config.json, especially:');
        console.error('   - site object with name, url, logo, tagline');
        console.error('   - categories array');
        console.error('   - theme object with primary, dark, light, background, surface, text');
        console.error('   - ads object structure');
    } else if (errorMessage.includes('converters.json')) {
        console.error('📁 Failed to parse: converters.json');
        console.error('🔑 Check the structure of converters.json, especially:');
        console.error('   - converters array');
        console.error('   - Each converter must have id, slug, title, description');
        console.error('   - Check for trailing commas in arrays/objects');
        console.error('   - Verify all quotes are properly closed');
    } else if (errorMessage.includes('content.json')) {
        console.error('📁 Failed to parse: content.json');
        console.error('🔑 Check the structure of content.json, especially:');
        console.error('   - homepage object');
        console.error('   - about, privacy, terms, contact objects');
        console.error('   - Each page needs title, description, content');
    } else {
        console.error('📁 Could not determine which JSON file failed. Error:', errorMessage);
    }

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
// NAVIGATION & BREADCRUMB GENERATION (UPDATED WITH BLOG)
// ==============================

function generateNavigation(currentPage = '', location = 'root') {
    function getPath(target, currentLoc) {
        if (currentLoc === 'root') {
            const paths = {
                home: 'index.html',
                converters: 'converters/',
                blog: 'blog/',
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
                blog: '../blog/',
                about: '../about/index.html',
                contact: '../contact/index.html',
                privacy: '../privacy/index.html',
                terms: '../terms/index.html'
            };
            return paths[target];
        }

        if (currentLoc.startsWith('converters/')) {
            const paths = {
                home: '../../index.html',
                converters: '../',
                blog: '../../blog/',
                about: '../../about/index.html',
                contact: '../../contact/index.html',
                privacy: '../../privacy/index.html',
                terms: '../../terms/index.html'
            };
            return paths[target];
        }

        if (currentLoc.startsWith('blog/')) {
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
            blog: '../blog/',
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

    // Check if we have blogs before showing blog link
    const hasBlogs = BLOGS.blogs && BLOGS.blogs.length > 0;

    return `
        <header class="header">
            <div class="header-container">
                <nav class="navbar">
                    <a href="${getPath('home', location)}" class="logo">
                        ${CONFIG.site.logo} ${CONFIG.site.name}
                    </a>
                    <button class="mobile-menu-btn" aria-label="Menu">☰</button>
                    <ul class="nav-links">
                        <li><a href="${getPath('home', location)}" ${getLinkStyle('home')}>Home</a></li>
                        <li><a href="${getPath('converters', location)}" ${getLinkStyle('converters')}>Converters</a></li>
                        ${hasBlogs ? `<li><a href="${getPath('blog', location)}" ${getLinkStyle('blog')}>Blog</a></li>` : ''}
                        <li><a href="${getPath('about', location)}" ${getLinkStyle('about')}>About</a></li>
                        <li><a href="${getPath('contact', location)}" ${getLinkStyle('contact')}>Contact</a></li>
                    </ul>
                </nav>
            </div>
        </header>
    `;
}

function getRelatedConverters(currentConverterId, category) {
    if (!category) return [];

    return CONVERTERS.converters
        .filter(c => c.id !== currentConverterId && c.category === category)
        .slice(0, 4);
}

function generateBreadcrumbs(pageType, pageData = {}, location = 'root') {
    let breadcrumbs = [];

    breadcrumbs.push({
        name: 'Home',
        url: location === 'root' ? 'index.html' : '../index.html'
    });

    if (pageType === 'blog') {
        breadcrumbs.push({
            name: 'Blog',
            url: location === 'blog' ? './' : '../blog/'
        });
        breadcrumbs.push({
            name: pageData.title || 'Blog Post',
            url: '#current'
        });
    }

    if (pageType === 'blogIndex') {
        breadcrumbs.push({
            name: 'Blog',
            url: '#current'
        });
    }

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

    if (pageType === 'collection') {
        breadcrumbs.push({
            name: 'Converters',
            url: '#current'
        });
    }

    if (pageType === 'static') {
        breadcrumbs.push({
            name: pageData.title || 'Page',
            url: '#current'
        });
    }

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

function generateBreadcrumbSchema(pageType, pageData = {}, location = 'root') {
    const baseUrl = CONFIG.site.url;
    let schemaItems = [];
    let position = 1;

    schemaItems.push({
        "@type": "ListItem",
        "position": position++,
        "name": "Home",
        "item": baseUrl + (location === 'root' ? '/' : '../')
    });

    if (pageType === 'blog') {
        schemaItems.push({
            "@type": "ListItem",
            "position": position++,
            "name": "Blog",
            "item": baseUrl + (location === 'blog' ? '/blog/' : '../blog/')
        });
    }

    if (pageType === 'blogIndex') {
        schemaItems.push({
            "@type": "ListItem",
            "position": position++,
            "name": "Blog",
            "item": baseUrl + '/blog/'
        });
    } else if (pageType === 'blog' && pageData.slug) {
        schemaItems.push({
            "@type": "ListItem",
            "position": position++,
            "name": pageData.title || 'Blog Post',
            "item": baseUrl + '/blog/' + pageData.slug + '/'
        });
    }

    if (pageType === 'converter') {
        schemaItems.push({
            "@type": "ListItem",
            "position": position++,
            "name": "Converters",
            "item": baseUrl + (location === 'converters' ? '/converters/' : '../converters/')
        });
    }

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
    function getPath(target, currentLoc) {
        if (currentLoc === 'root') {
            const paths = {
                home: 'index.html',
                converters: 'converters/',
                blog: 'blog/',
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
                blog: '../blog/',
                about: '../about/index.html',
                contact: '../contact/index.html',
                privacy: '../privacy/index.html',
                terms: '../terms/index.html',
                sitemap: '../sitemap.xml'
            };
            return paths[target];
        }

        if (currentLoc.startsWith('converters/')) {
            const paths = {
                home: '../../index.html',
                converters: '../',
                blog: '../../blog/',
                about: '../../about/index.html',
                contact: '../../contact/index.html',
                privacy: '../../privacy/index.html',
                terms: '../../terms/index.html',
                sitemap: '../../sitemap.xml'
            };
            return paths[target];
        }

        if (currentLoc.startsWith('blog/')) {
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
            blog: '../blog/',
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
                            <li><a href="${getPath('blog', location)}">Blog</a></li>
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
// CONTENT SECTION GENERATORS
// ==============================

function generateHeroSection(converter) {
    const hero = converter.contentSections?.hero || {};
    return `
    <section class="content-section hero-section">
        <h1>${hero.title || converter.title}</h1>
        <p class="hero-subtitle">${hero.subtitle || converter.description}</p>
        ${hero.intro ? `<p class="hero-intro">${hero.intro}</p>` : ''}
    </section>
    `;
}

function generateConverterUI(converter) {
    const hasIngredients = converter.ingredientFormulas && Array.isArray(converter.ingredientFormulas);

    // Extract unique ingredients
    let ingredientOptions = '';
    if (hasIngredients) {
        const ingredients = [...new Set(converter.ingredientFormulas.map(f => f.ingredient))];
        ingredientOptions = ingredients.map(ing => '<option value="' + ing + '">' + ing + '</option>').join('');
    }

    return '\n    <section class="content-section converter-ui-section">\n        <div class="converter-wrapper">\n            <div class="converter-ui">\n                <div class="converter-box">\n                    <input type="number" id="fromValue" class="converter-input" value="' + (converter.defaults?.value || 1) + '" step="0.01" aria-label="Value to convert">\n                    <select id="fromUnit" class="converter-select" aria-label="Convert from unit"></select>\n                </div>\n                <button class="converter-swap" aria-label="Swap units">⇄</button>\n                <div class="converter-box">\n                    <input type="number" id="toValue" class="converter-input" readonly aria-label="Converted value">\n                    <select id="toUnit" class="converter-select" aria-label="Convert to unit"></select>\n                </div>\n            </div>\n            \n            ' + (hasIngredients ? '\n            <div class="ingredient-selector">\n                <label for="ingredientSelect">Ingredient (optional):</label>\n                <select id="ingredientSelect" class="converter-select" aria-label="Select ingredient">\n                    <option value="">-- Generic conversion --</option>\n                    ' + ingredientOptions + '\n                </select>\n            </div>\n            ' : '') + '\n            \n            <div class="converter-result" id="converterResult"></div>\n            <script type="application/json" id="converter-data">\n            ' + JSON.stringify(converter) + '\n            </script>\n        </div>\n    </section>\n    ';
}

function generateQuickReferenceSection(converter) {
    const section = converter.contentSections?.quickReference;
    if (!section) return '';

    const items = section.items || [];
    if (items.length === 0) return '';

    return `
    <section class="content-section quick-reference">
        <div class="section-header">
            <h2>${section.title || 'Quick Reference'}</h2>
            ${section.description ? `<p class="section-description">${section.description}</p>` : ''}
        </div>
        <div class="quick-reference-grid">
            ${items.map(item => {
                // Determine what type of conversion this is based on the data
                let fromValue = '';
                let toValue = '';
                let title = item.ingredient || 'Reference';

                // ----- TEMPERATURE CONVERSION LOGIC -----
                // If item has Celsius, it's likely a temperature conversion
                if (item.celsius !== undefined || (item.ingredient && item.ingredient.includes('°C'))) {
                    // Use the ingredient as the "from" value (e.g., "180°C")
                    fromValue = item.ingredient || `${item.celsius}°C`;

                    // Check for Fahrenheit conversion
                    if (item.fahrenheit !== undefined) {
                        toValue = `${item.fahrenheit}°F`;
                    }
                    // Check for Gas Mark conversion
                    else if (item.gasMark !== undefined) {
                        toValue = `Gas Mark ${item.gasMark}`;
                    }
                    // Check for Fan Celsius
                    else if (item.fanC !== undefined) {
                        toValue = `${item.fanC}°C (fan)`;
                    }
                }
                // ----- VOLUME/WEIGHT CONVERSION LOGIC -----
                // If item has a 'cup' property, it's a volume/weight conversion
                else if (item.cup !== undefined) {
                    const cupNum = parseFloat(item.cup) || 1;
                    const cupText = typeof item.cup === 'string' ? item.cup : cupNum;
                    fromValue = `${cupText} cup${cupNum !== 1 ? 's' : ''}`;

                    // Find the "to" unit
                    if (item.grams !== undefined) {
                        toValue = `${item.grams}g`;
                    } else if (item.ml !== undefined) {
                        toValue = `${item.ml}ml`;
                    } else if (item.ounce !== undefined) {
                        toValue = `${item.ounce} oz`;
                    }
                    // Add more volume/weight units as needed
                }
                // ----- GENERIC FALLBACK -----
                // If neither temperature nor cup, try to display whatever data exists
                else {
                    // Try to find the first property that looks like a "from" value
                    const props = Object.keys(item);
                    for (const prop of props) {
                        if (prop !== 'icon' && prop !== 'tip' && prop !== 'ingredient') {
                            const val = item[prop];
                            if (!fromValue) {
                                fromValue = `${val} ${prop}`;
                            } else if (!toValue) {
                                toValue = `${val} ${prop}`;
                            }
                        }
                    }
                }

                // Generate the HTML for this item
                return `
                <div class="reference-item">
                    ${item.icon ? `<div class="reference-icon">${item.icon}</div>` : ''}
                    <div class="reference-content">
                        <h3>${title}</h3>
                        <div class="reference-values">
                            <span class="reference-from">${fromValue}</span>
                            ${toValue ? `<span class="reference-arrow">→</span><span class="reference-to">${toValue}</span>` : ''}
                        </div>
                        ${item.tip ? `<div class="reference-tip">${item.tip}</div>` : ''}
                    </div>
                </div>
                `;
            }).join('')}
        </div>
    </section>
    `;
}

function generateComparisonTableSection(converter) {
    const section = converter.contentSections?.comparisonTable;
    if (!section) return '';

    const rows = section.rows || [];
    if (rows.length === 0) return '';

    const columns = section.columns || ['Type', 'Value', 'Details'];

    return `
    <section class="content-section comparison-table">
        <div class="section-header">
            <h2>${section.title || 'Comparison Table'}</h2>
            ${section.description ? `<p class="section-description">${section.description}</p>` : ''}
        </div>
        <div class="table-container">
            <table class="comparison-table">
                <thead>
                    <tr>
                        ${columns.map(col => `<th>${col}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${rows.map(row => `
                    <tr>
                        ${Object.values(row).map((cell, index) => `
                        <td data-label="${columns[index] || ''}">${cell}</td>
                        `).join('')}
                    </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    </section>
    `;
}

function generateVisualChartSection(converter) {
    const section = converter.contentSections?.visualChart;
    if (!section) return '';

    const items = section.items || [];
    if (items.length === 0) return '';

    return `
    <section class="content-section visual-chart">
        <div class="section-header">
            <h2>${section.title || 'Visual Guide'}</h2>
            ${section.description ? `<p class="section-description">${section.description}</p>` : ''}
        </div>
        <div class="visual-chart-container">
            ${items.map(item => `
            <div class="visual-item" style="${item.color ? `border-color: ${item.color};` : ''}">
                ${item.visual ? `<div class="visual-icon">${item.visual}</div>` : ''}
                <div class="visual-content">
                    <h3>${item.name}</h3>
                    <div class="visual-weight">${item.weight}</div>
                    <div class="visual-comparison">${item.comparison}</div>
                </div>
            </div>
            `).join('')}
        </div>
    </section>
    `;
}

function generateStepByStepSection(converter) {
    const section = converter.contentSections?.stepByStep;
    if (!section) return '';

    const steps = section.steps || [];
    if (steps.length === 0) return '';

    return `
    <section class="content-section step-by-step">
        <div class="section-header">
            <h2>${section.title || 'Step-by-Step Guide'}</h2>
            ${section.description ? `<p class="section-description">${section.description}</p>` : ''}
        </div>
        <div class="steps-container">
            ${steps.map(step => `
            <div class="step">
                <div class="step-number">${step.number}</div>
                <div class="step-content">
                    <h3>${step.title}</h3>
                    <p>${step.content}</p>
                    ${step.tip ? `<div class="step-tip"><strong>Tip:</strong> ${step.tip}</div>` : ''}
                    ${step.warning ? `<div class="step-warning"><strong>Warning:</strong> ${step.warning}</div>` : ''}
                    ${step.note ? `<div class="step-note"><strong>Note:</strong> ${step.note}</div>` : ''}
                </div>
            </div>
            `).join('')}
        </div>
    </section>
    `;
}

function generateCommonMistakesSection(converter) {
    const section = converter.contentSections?.commonMistakes;
    if (!section) return '';

    const mistakes = section.mistakes || [];
    if (mistakes.length === 0) return '';

    return `
    <section class="content-section common-mistakes">
        <div class="section-header">
            <h2>${section.title || 'Common Mistakes to Avoid'}</h2>
            ${section.description ? `<p class="section-description">${section.description}</p>` : ''}
        </div>
        <div class="mistakes-container">
            ${mistakes.map(mistake => `
            <div class="mistake-item ${mistake.severity || 'medium'}">
                ${mistake.icon ? `<div class="mistake-icon">${mistake.icon}</div>` : ''}
                <div class="mistake-content">
                    <h3>${mistake.mistake}</h3>
                    <div class="mistake-consequence"><strong>Result:</strong> ${mistake.consequence}</div>
                    <div class="mistake-solution"><strong>Solution:</strong> ${mistake.solution}</div>
                </div>
            </div>
            `).join('')}
        </div>
    </section>
    `;
}

function generateEquipmentGuideSection(converter) {
    const section = converter.contentSections?.equipmentGuide;
    if (!section) return '';

    const tools = section.tools || [];
    if (tools.length === 0) return '';

    return `
    <section class="content-section equipment-guide">
        <div class="section-header">
            <h2>${section.title || 'Recommended Equipment'}</h2>
            ${section.description ? `<p class="section-description">${section.description}</p>` : ''}
        </div>
        <div class="equipment-container">
            ${tools.map(tool => `
            <div class="equipment-item">
                <div class="equipment-header">
                    ${tool.icon ? `<span class="equipment-icon">${tool.icon}</span>` : ''}
                    <h3>${tool.name}</h3>
                    <span class="equipment-importance ${tool.importance?.toLowerCase() || 'recommended'}">
                        ${tool.importance || 'Recommended'}
                    </span>
                </div>
                <div class="equipment-details">
                    ${tool.features ? `
                    <div class="equipment-features">
                        <h4>Features:</h4>
                        <ul>
                            ${tool.features.map(feature => `<li>${feature}</li>`).join('')}
                        </ul>
                    </div>
                    ` : ''}
                    ${tool.priceRange ? `<div class="equipment-price"><strong>Price:</strong> ${tool.priceRange}</div>` : ''}
                    ${tool.recommendedBrands ? `
                    <div class="equipment-brands">
                        <strong>Brands:</strong> ${tool.recommendedBrands.join(', ')}
                    </div>
                    ` : ''}
                </div>
            </div>
            `).join('')}
        </div>
    </section>
    `;
}

function generateScientificBackgroundSection(converter) {
    const section = converter.contentSections?.scientificBackground;
    if (!section) return '';

    const concepts = section.concepts || [];
    if (concepts.length === 0) return '';

    return `
    <section class="content-section scientific-background">
        <div class="section-header">
            <h2>${section.title || 'Scientific Background'}</h2>
            ${section.description ? `<p class="section-description">${section.description}</p>` : ''}
        </div>
        <div class="concepts-container">
            ${concepts.map(concept => `
            <div class="concept">
                <h3>${concept.concept}</h3>
                <p>${concept.explanation}</p>
                ${concept.examples ? `
                <div class="concept-examples">
                    <strong>Examples:</strong>
                    <ul>
                        ${concept.examples.map(example => `<li>${example}</li>`).join('')}
                    </ul>
                </div>
                ` : ''}
                ${concept.impact ? `<div class="concept-impact"><strong>Impact:</strong> ${concept.impact}</div>` : ''}
            </div>
            `).join('')}
        </div>
    </section>
    `;
}

function generateRegionalVariationsSection(converter) {
    const section = converter.contentSections?.regionalVariations;
    if (!section) return '';

    const regions = section.regions || [];
    if (regions.length === 0) return '';

    return `
    <section class="content-section regional-variations">
        <div class="section-header">
            <h2>${section.title || 'Regional Variations'}</h2>
            ${section.description ? `<p class="section-description">${section.description}</p>` : ''}
        </div>
        <div class="regions-container">
            ${regions.map(region => `
            <div class="region-item">
                <div class="region-header">
                    <h3>${region.region}</h3>
                    ${region.cupSize ? `<div class="region-cup-size">Cup: ${region.cupSize}</div>` : ''}
                </div>
                <div class="region-details">
                    ${region.commonUnits ? `
                    <div class="region-units">
                        <strong>Units:</strong> ${region.commonUnits.join(', ')}
                    </div>
                    ` : ''}
                    ${region.system ? `<div class="region-system"><strong>System:</strong> ${region.system}</div>` : ''}
                    ${region.note ? `<div class="region-note">${region.note}</div>` : ''}
                </div>
            </div>
            `).join('')}
        </div>
    </section>
    `;
}

function generateRecipeExamplesSection(converter) {
    const section = converter.contentSections?.recipeExamples;
    if (!section) return '';

    const examples = section.examples || [];
    if (examples.length === 0) return '';

    return `
    <section class="content-section recipe-examples">
        <div class="section-header">
            <h2>${section.title || 'Recipe Applications'}</h2>
            ${section.description ? `<p class="section-description">${section.description}</p>` : ''}
        </div>
        ${examples.map(example => `
        <div class="recipe-example">
            <h3>${example.recipe}</h3>
            <div class="recipe-comparison">
                <div class="recipe-original">
                    <h4>Original Recipe</h4>
                    <ul>
                        ${example.original.map(ingredient => `<li>${ingredient}</li>`).join('')}
                    </ul>
                </div>
                <div class="recipe-arrow">→</div>
                <div class="recipe-converted">
                    <h4>Converted (Metric)</h4>
                    <ul>
                        ${example.converted.map(ingredient => `<li>${ingredient}</li>`).join('')}
                    </ul>
                </div>
            </div>
            ${example.serves ? `<div class="recipe-serves"><strong>Serves:</strong> ${example.serves}</div>` : ''}
            ${example.tip ? `<div class="recipe-tip"><strong>Tip:</strong> ${example.tip}</div>` : ''}
        </div>
        `).join('')}
    </section>
    `;
}

function generateTipsSection(converter) {
    const oldSections = converter.contentSections || []; // Old format
    const newTips = converter.contentSections?.tips; // New format

    let tipsHTML = '';

    // Check new format first
    if (newTips && newTips.tips && newTips.tips.length > 0) {
        tipsHTML += `
        <section class="content-section tips-section">
            <h2>${newTips.title || 'Tips'}</h2>
            <ul class="tips-list">
                ${newTips.tips.map(tip => `<li>${tip}</li>`).join('')}
            </ul>
        </section>
        `;
    }
    // Fallback to old format
    else if (Array.isArray(oldSections)) {
        oldSections.forEach(section => {
            if (section.tips && section.tips.length > 0) {
                tipsHTML += `
                <section class="content-section tips-section">
                    <h2>${section.title || 'Tips'}</h2>
                    <ul class="tips-list">
                        ${section.tips.map(tip => `<li>${tip}</li>`).join('')}
                    </ul>
                </section>
                `;
            }
        });
    }

    return tipsHTML;
}

function generateFAQSection(converter) {
    const faqs = converter.faqs || [];
    if (faqs.length === 0) return '';

    return `
    <section class="content-section faq-section">
        <h2>Frequently Asked Questions</h2>
        <div class="faq-container">
            ${faqs.map(faq => `
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
    </section>
    `;
}

function generateRelatedConvertersSection(converter) {
    console.log(`\n=== DEBUG for ${converter.id} ===`);
    console.log('1. Manual Links:', converter.manualRelatedLinks);

    let related = [];

    // 1. MANUAL LIST CHECK
    if (converter.manualRelatedLinks && Array.isArray(converter.manualRelatedLinks)) {
        console.log('2. Processing manual links...');

        for (const linkId of converter.manualRelatedLinks) {
            // Find converter by ID
            const found = CONVERTERS.converters.find(c => c.id === linkId);
            console.log(`   Looking for "${linkId}":`, found ? `FOUND (${found.title})` : 'NOT FOUND');

            if (found && found.id !== converter.id) { // Don't link to itself
                related.push(found);
            }
        }

        console.log('3. Manual list result:', related.map(c => c.id));
    }

    // 2. FALLBACK TO CATEGORY
    if (related.length === 0) {
        console.log('4. Falling back to category-based...');
        related = getRelatedConverters(converter.id, converter.category);
        console.log('5. Category result:', related.map(c => c.id));
    }

    // 3. FINAL CHECK
    console.log('6. Final related list:', related.map(c => c.id));

    if (related.length === 0) {
        console.log('7. No related converters found.');
        return '';
    }

    // 4. GENERATE HTML
    console.log('8. Generating HTML block...\n');
    return `
    <section class="content-section related-converters">
        <h2>Related Converters</h2>
        <div class="related-grid">
            ${related.map(r => `
            <div class="related-item">
                <h3>${r.title}</h3>
                <p>${r.description.slice(0, 80)}...</p>
                <a href="../${r.slug}/" class="related-link">Use Tool</a>
            </div>
            `).join('')}
        </div>
    </section>
    `;
}

// ==============================
// GENERATE CONTENT BY SEQUENCE
// ==============================

function generateContentBySequence(converter) {
    const sequence = converter.contentSequence ||
                   CONFIG.content?.defaultSequence ||
                   ['hero', 'converter', 'quickReference', 'comparisonTable', 'tips', 'faq', 'related'];

    let content = '';

    sequence.forEach(sectionType => {
        switch(sectionType) {
            case 'hero':
                content += generateHeroSection(converter);
                break;
            case 'converter':
                content += generateConverterUI(converter);
                break;
            case 'quickReference':
                content += generateQuickReferenceSection(converter);
                break;
            case 'comparisonTable':
                content += generateComparisonTableSection(converter);
                break;
            case 'visualChart':
                content += generateVisualChartSection(converter);
                break;
            case 'stepByStep':
                content += generateStepByStepSection(converter);
                break;
            case 'commonMistakes':
                content += generateCommonMistakesSection(converter);
                break;
            case 'equipmentGuide':
                content += generateEquipmentGuideSection(converter);
                break;
            case 'scientificBackground':
                content += generateScientificBackgroundSection(converter);
                break;
            case 'regionalVariations':
                content += generateRegionalVariationsSection(converter);
                break;
            case 'recipeExamples':
                content += generateRecipeExamplesSection(converter);
                break;
            case 'tips':
                content += generateTipsSection(converter);
                break;
            case 'faq':
                content += generateFAQSection(converter);
                break;
            case 'related':
                content += generateRelatedConvertersSection(converter);
                break;
        }
    });

    return content;
}

// ==============================
// BLOG FUNCTIONS
// ==============================

function generateBlogContent(content) {
    if (!content) return '';

    let html = '';
    if (Array.isArray(content)) {
        content.forEach(section => {
            if (section.type === 'paragraph' && section.text) {
                html += `<p>${section.text}</p>`;
            } else if (section.type === 'heading' && section.text) {
                const level = section.level || 2;
                html += `<h${level}>${section.text}</h${level}>`;
            } else if (section.type === 'list' && section.items) {
                const tag = section.ordered ? 'ol' : 'ul';
                html += `<${tag}>`;
                section.items.forEach(item => {
                    if (typeof item === 'object') {
                        html += `<li>${item.text || ''}</li>`;
                    } else {
                        html += `<li>${item}</li>`;
                    }
                });
                html += `</${tag}>`;
            } else if (section.type === 'image' && section.src) {
                html += `<img src="${section.src}" alt="${section.alt || ''}" style="max-width:100%;border-radius:8px;margin:1rem 0;">`;
            } else if (section.type === 'code' && section.code) {
                html += `<pre><code>${section.code}</code></pre>`;
            }
        });
    } else if (typeof content === 'string') {
        // Simple fallback for string content
        html = `<p>${content}</p>`;
    }
    return html;
}

function generateBlogPost(blog) {
    const page = {
        title: blog.title,
        description: blog.description || blog.title,
        url: `/blog/${blog.slug}/`,
        type: 'blog'
    };

    const blogContent = generateBlogContent(blog.content);

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    ${generateMetaTags(page)}
    <style>${STYLES}</style>
    <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>${CONFIG.site.logo}</text></svg>">
</head>
<body>
    ${generateNavigation('blog', 'blog/' + blog.slug)}
    ${generateBreadcrumbs('blog', blog, 'blog')}
    ${generateBreadcrumbSchema('blog', blog, 'blog')}

    <main class="main-content">
        <div class="container">
            <div class="card">
                <h1 style="color:var(--primary-dark);font-size:1.75rem;margin-bottom:0.5rem;">${blog.title}</h1>
                ${blog.subtitle ? `<p style="color:#666;font-style:italic;font-size:1.1rem;margin-bottom:1rem;">${blog.subtitle}</p>` : ''}

                <div style="margin:1rem 0;padding:1rem;background:var(--background);border-radius:8px;border-left:4px solid var(--primary);">
                    ${blog.published_date ? `<p><strong>Published:</strong> ${formatDate(new Date(blog.published_date))}</p>` : ''}
                    ${blog.author ? `<p><strong>Author:</strong> ${blog.author}</p>` : ''}
                    ${blog.category ? `<p><strong>Category:</strong> ${blog.category}</p>` : ''}
                    ${blog.read_time ? `<p><strong>Read time:</strong> ${blog.read_time} minutes</p>` : ''}
                </div>

                ${blog.featured_image ? `
                <div style="margin:1.5rem 0;">
                    <img src="${blog.featured_image}" alt="${blog.title}" style="width:100%;border-radius:12px;max-height:400px;object-fit:cover;">
                </div>
                ` : ''}

                <div style="margin-top:2rem;line-height:1.8;font-size:1rem;">
                    ${blogContent}
                </div>

                <div style="margin-top:3rem;padding-top:1.5rem;border-top:1px solid var(--border);">
                    <a href="../" style="color:var(--primary);text-decoration:none;font-weight:600;display:inline-flex;align-items:center;gap:0.5rem;">← Back to Blog</a>
                </div>
            </div>
        </div>
    </main>

    ${generateFooter('blog/' + blog.slug)}
    <script>${CONVERTER_JS}</script>
</body>
</html>
    `;
}

function generateBlogsIndex() {
    if (!BLOGS.blogs || BLOGS.blogs.length === 0) {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    ${generateMetaTags({
        title: 'Blog | ' + CONFIG.site.name,
        description: 'Read our latest articles and guides',
        url: '/blog/',
        type: 'blogIndex'
    })}
    <style>${STYLES}</style>
</head>
<body>
    ${generateNavigation('blog', 'blog')}
    ${generateBreadcrumbs('blogIndex', {title: 'Blog'}, 'blog')}
    ${generateBreadcrumbSchema('blogIndex', {title: 'Blog'}, 'blog')}
    <main class="main-content">
        <div class="container">
            <div class="card">
                <h1 style="color:var(--primary);">Blog</h1>
                <p>No blog posts available.</p>
            </div>
        </div>
    </main>
    ${generateFooter('blog')}
</body>
</html>
        `;
    }

    const publishedBlogs = BLOGS.blogs.filter(blog => blog.published !== false);

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    ${generateMetaTags({
        title: 'Blog | ' + CONFIG.site.name,
        description: 'Read our latest articles and guides',
        url: '/blog/',
        type: 'blogIndex'
    })}
    <style>${STYLES}</style>
</head>
<body>
    ${generateNavigation('blog', 'blog')}
    ${generateBreadcrumbs('blogIndex', {title: 'Blog'}, 'blog')}
    ${generateBreadcrumbSchema('blogIndex', {title: 'Blog'}, 'blog')}

    <main class="main-content">
        <div class="container">
            <div class="card">
                <h1 style="color:var(--primary);font-size:1.75rem;">Blog</h1>
                <p style="margin:1rem 0;font-size:1.1rem;">Read our latest articles, guides, and cooking tips.</p>
            </div>

            <div class="converters-grid" style="margin-top:1.5rem;">
                ${publishedBlogs.map(blog => `
                <div class="converter-card">
                    ${blog.featured_image ? `
                    <div style="margin:-1.25rem -1.25rem 1rem -1.25rem;border-radius:12px 12px 0 0;overflow:hidden;">
                        <img src="${blog.featured_image}" alt="${blog.title}" style="width:100%;height:150px;object-fit:cover;">
                    </div>
                    ` : ''}
                    <h3 style="color:var(--primary-dark);margin-bottom:0.5rem;font-size:1.1rem;">${blog.title}</h3>
                    <p style="margin-bottom:0.75rem;color:var(--text);font-size:0.9rem;line-height:1.5;">
                        ${blog.description || ''}
                    </p>
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:auto;">
                        ${blog.published_date ? `
                        <span style="font-size:0.8rem;color:#666;">
                            ${formatDate(new Date(blog.published_date))}
                        </span>
                        ` : ''}
                        <a href="${blog.slug}/" style="
                            padding:0.5rem 1rem;
                            background:var(--primary);
                            color:white;
                            text-decoration:none;
                            border-radius:4px;
                            font-weight:500;
                            transition:background 0.3s;
                            font-size:0.9rem;
                        ">Read Article</a>
                    </div>
                </div>
                `).join('')}
            </div>
        </div>
    </main>

    ${generateFooter('blog')}
    <script>${CONVERTER_JS}</script>
</body>
</html>
    `;
}

// ==============================
// AD GENERATION WITH SIDEBAR
// ==============================

function generateAdUnit(position, pageType, pageId = '') {
    const adsConfig = CONFIG.ads || {};

    if (!adsConfig.enabled) return '';

    if (pageType === 'converter' && pageId) {
        const converter = CONVERTERS.converters.find(c => c.id === pageId);
        if (converter && converter.ads && converter.ads[position] === false) {
            return '';
        }
    }

    const placementKey = `${pageType}_${position}`;
    const placements = adsConfig.placements || {};
    if (!placements[placementKey]) return '';

    const excludePages = adsConfig.excludePages || [];
    if (excludePages.includes(pageId)) return '';

    return `
    <div class="ad-unit ad-${position}">
        <div class="ad-label">Advertisement</div>
        <div class="ad-content">
            <div>${CONFIG.site.name} - Ad Space</div>
        </div>
    </div>
    `;
}

function generateSidebarAds(converter) {
    const adsConfig = CONFIG.ads || {};
    if (!adsConfig.enabled || !adsConfig.sidebar?.enabled) return '';

    const converterAds = converter.ads || {};
    if (converterAds.sidebar?.enabled === false) return '';

    return `
    <aside class="sidebar-ad-container">
        <div class="sidebar-ad">
            <div class="ad-label">Advertisement</div>
            <div class="ad-content">
                <div>Sidebar Ad - Related Tools</div>
            </div>
        </div>
        <div class="sidebar-ad">
            <div class="ad-label">Sponsored</div>
            <div class="ad-content">
                <div>Recommended Kitchen Scale</div>
            </div>
        </div>
    </aside>
    `;
}

function generateMobileStickyAd(converter) {
    const adsConfig = CONFIG.ads || {};
    if (!adsConfig.enabled || !adsConfig.mobile?.stickyAd?.enabled) return '';

    const converterAds = converter.ads || {};
    if (converterAds.mobile?.sticky === false) return '';

    return `
    <div class="mobile-sticky-ad">
        <div class="ad-content">
            <span>📱 ${CONFIG.site.name} - Free Converter</span>
            <button class="ad-close" aria-label="Close ad">×</button>
        </div>
    </div>
    `;
}

// ==============================
// CATEGORY FUNCTIONS
// ==============================

function getAllCategories() {
    // Get categories from config first, then from converters
    const configCategories = CONFIG.categories || [];
    const converterCategories = new Set();

    CONVERTERS.converters.forEach(converter => {
        if (converter.categories && Array.isArray(converter.categories)) {
            converter.categories.forEach(cat => converterCategories.add(cat));
        }
    });

    // Combine config categories with found converter categories
    const allCategories = [...new Set([...configCategories, ...Array.from(converterCategories)])];

    return allCategories.sort();
}

function getCategoryDisplayName(category) {
    const categoryConfig = CONFIG.categoryDisplayNames || {};
    return categoryConfig[category] || category.charAt(0).toUpperCase() + category.slice(1);
}

// ==============================
// IMPROVED CSS STYLES (Mobile-First Responsive Design)
// ==============================

const STYLES = `
/* ===== MOBILE-FIRST RESPONSIVE DESIGN ===== */
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
    width: 100%;
}

/* ===== HEADER - FIXED FULL WIDTH ===== */
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
    overflow-x: auto;
}

.breadcrumb {
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.5rem;
    min-width: min-content;
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

/* ===== CATEGORY AND SEARCH ===== */
.converters-header {
    margin-bottom: 1.5rem;
}

.category-filters {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin: 1rem 0;
    align-items: center;
}

.category-filter {
    padding: 0.5rem 0.75rem;
    background: var(--background);
    border: 2px solid var(--border);
    border-radius: 25px;
    text-decoration: none;
    color: var(--text);
    font-weight: 500;
    transition: all 0.3s;
    white-space: nowrap;
    cursor: pointer;
    display: inline-block;
    font-size: 0.9rem;
}

.category-filter:hover,
.category-filter.active {
    background: var(--primary);
    color: white;
    border-color: var(--primary);
}

.search-container {
    position: relative;
    margin: 1rem 0;
    width: 100%;
}

.search-input {
    width: 100%;
    padding: 0.75rem 1rem 0.75rem 2.5rem;
    border: 2px solid var(--border);
    border-radius: 8px;
    font-size: 1rem;
    background: var(--surface);
    transition: all 0.3s;
}

.search-input:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(46, 125, 50, 0.1);
}

.search-icon {
    position: absolute;
    left: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    color: #666;
}

.converter-count {
    color: var(--primary);
    font-weight: 600;
    margin: 0 0.5rem;
}

/* ===== CONVERTERS GRID ===== */
.converters-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;
    margin: 1.5rem 0;
    width: 100%;
}

.converter-card {
    background: var(--surface);
    border-radius: 12px;
    padding: 1.25rem;
    border: 1px solid var(--border);
    transition: transform 0.3s, box-shadow 0.3s;
    position: relative;
    width: 100%;
}

.converter-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 20px rgba(0,0,0,0.1);
}

.category-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin: 0.75rem 0 1rem;
}

.category-tag {
    padding: 0.25rem 0.5rem;
    background: var(--background);
    border: 1px solid var(--border);
    border-radius: 12px;
    font-size: 0.75rem;
    color: var(--text);
    white-space: nowrap;
}

.no-results {
    text-align: center;
    padding: 2rem;
    color: #666;
    font-style: italic;
    grid-column: 1 / -1;
    display: none;
}

.clear-filters {
    padding: 0.5rem 1rem;
    background: var(--background);
    border: 1px solid var(--border);
    border-radius: 4px;
    color: var(--text);
    cursor: pointer;
    transition: all 0.3s;
    font-family: inherit;
    font-size: 0.9rem;
    white-space: nowrap;
}

.clear-filters:hover {
    background: var(--primary);
    color: white;
}

/* ===== CONVERTER UI - PROPERLY CENTERED ===== */
.converter-wrapper {
    background: var(--surface);
    border-radius: 16px;
    padding: 1.5rem;
    margin: 1.5rem auto;
    box-shadow: 0 8px 25px rgba(0,0,0,0.1);
    width: 100%;
}

.converter-ui {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    margin: 1.5rem 0;
}

.converter-box {
    display: flex;
    flex-direction: row;
    gap: 0.5rem;
    align-items: center;
    width: 100%;
    max-width: 500px;
    justify-content: center;
}

.converter-input {
    padding: 0.75rem;
    font-size: 1.1rem;
    border: 2px solid var(--primary-light);
    border-radius: 8px;
    text-align: center;
    flex: 1;
    min-width: 0;
    width: 50%;
    max-width: 150px;
    height: 48px;
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
}

.converter-select {
    padding: 0.75rem 0.5rem;
    border: 2px solid var(--primary-light);
    border-radius: 8px;
    background: white;
    font-size: 1rem;
    flex: 1;
    min-width: 0;
    width: 50%;
    max-width: 200px;
    height: 48px;
    appearance: none;
    background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
    background-repeat: no-repeat;
    background-position: right 0.5rem center;
    background-size: 1em;
    padding-right: 2rem;
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
}

.converter-swap {
    background: var(--primary);
    color: white;
    border: none;
    border-radius: 8px;
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.3s;
    align-self: center;
    margin: 0.5rem 0;
    min-height: 48px;
    min-width: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
}

.converter-swap:hover {
    background: var(--primary-dark);
    transform: none;
}

.converter-result {
    text-align: center;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--primary);
    margin-top: 1rem;
    padding: 1rem;
    background: var(--background);
    border-radius: 8px;
    width: 100%;
    max-width: 500px;
    margin-left: auto;
    margin-right: auto;
    word-break: break-word;
}

.ingredient-selector {
    margin: 1rem auto;
    width: 100%;
    max-width: 500px;
    text-align: center;
}

.ingredient-selector label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: var(--text);
}

.ingredient-selector select {
    width: 100%;
    max-width: 300px;
    padding: 0.75rem;
    border: 2px solid var(--primary-light);
    border-radius: 8px;
    background: white;
    font-size: 1rem;
    margin: 0 auto;
    display: block;
}

/* ===== SIMPLE RESPONSIVE TABLES - JUST CSS FIX ===== */
.table-container {
    margin: 1rem 0;
    border-radius: 8px;
    border: 1px solid var(--border);
    width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
}

.table-container table {
    width: 100%;
    border-collapse: collapse;
    min-width: 600px;
}

.comparison-table {
    width: 100%;
    border-collapse: collapse;
}

.comparison-table th {
    background: var(--primary);
    color: white;
    padding: 1rem;
    text-align: left;
    font-weight: 600;
    font-size: 1rem;
    white-space: nowrap;
}

.comparison-table td {
    padding: 1rem;
    border-bottom: 1px solid var(--border);
    font-size: 1rem;
}

.comparison-table tr:last-child td {
    border-bottom: none;
}

.comparison-table tr:hover {
    background-color: var(--background);
}

/* MOBILE: Horizontal scrolling for tables */
@media (max-width: 767px) {
    .table-container {
        margin: 1rem -16px;
        border: none;
        width: calc(100% + 32px);
        position: relative;
        left: -16px;
    }

    .table-container table {
        min-width: 100%;
    }

    .comparison-table th,
    .comparison-table td {
        padding: 0.75rem;
        font-size: 0.9rem;
    }
}

/* EXTRA SMALL SCREENS: Stacked card layout */
@media (max-width: 480px) {
    .table-container {
        overflow-x: visible;
        background: none;
        border: none;
    }

    .table-container table {
        display: block;
        min-width: 100%;
    }

    .comparison-table {
        display: block;
        width: 100%;
    }

    .comparison-table thead {
        display: none;
    }

    .comparison-table tbody {
        display: block;
        width: 100%;
    }

    .comparison-table tr {
        display: block;
        margin-bottom: 1rem;
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 8px;
        padding: 1rem;
        width: 100%;
        box-sizing: border-box;
    }

    .comparison-table td {
        display: block;
        padding: 0.75rem 0;
        border-bottom: 1px solid rgba(0,0,0,0.1);
        text-align: right;
        position: relative;
        padding-left: 50%;
    }

    .comparison-table td:before {
        content: attr(data-label);
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        font-weight: 600;
        color: var(--primary);
        font-size: 0.85rem;
        width: 45%;
        text-align: left;
    }

    .comparison-table td:last-child {
        border-bottom: none;
        padding-bottom: 0;
    }

    .comparison-table td:first-child {
        padding-top: 0.5rem;
    }
}

/* Desktop improvements */
@media (min-width: 1024px) {
    .comparison-table th {
        font-size: 1.1rem;
        padding: 1.25rem;
    }

    .comparison-table td {
        font-size: 1.1rem;
        padding: 1.25rem;
    }
}

/* ===== ADS ===== */
.ad-unit {
    margin: 1.5rem 0;
    text-align: center;
    background: var(--surface);
    border-radius: 8px;
    padding: 1rem;
    border: 2px dashed var(--border);
    width: 100%;
}

.ad-label {
    color: #666;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 0.5rem;
}

.ad-content {
    min-height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--background);
    border-radius: 4px;
    color: #666;
}

/* ===== FAQ ===== */
.faq-section {
    margin: 1.5rem 0;
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
    font-size: 1rem;
    font-weight: 600;
    color: var(--text);
    padding: 0.75rem 0;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
}

.faq-answer {
    padding: 0.75rem 0;
    color: #555;
    line-height: 1.8;
}

/* ===== FOOTER - FIXED FULL WIDTH ===== */
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

/* ===== CONTENT SECTIONS ===== */
.content-section {
    margin: 1.5rem 0;
    padding: 1.5rem;
    background: var(--surface);
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    width: 100%;
}

.section-header {
    margin-bottom: 1.25rem;
    text-align: center;
}

.section-header h2 {
    color: var(--primary-dark);
    margin-bottom: 0.5rem;
    font-size: 1.5rem;
}

.section-description {
    color: var(--text);
    opacity: 0.8;
    max-width: 100%;
    margin: 0 auto;
}

/* ===== HERO SECTION ===== */
.hero-section {
    text-align: center;
    padding: 1.5rem 1rem;
}

.hero-section h1 {
    color: var(--primary);
    font-size: 1.75rem;
    margin-bottom: 0.75rem;
    line-height: 1.3;
}

.hero-subtitle {
    font-size: 1.1rem;
    color: var(--text);
    margin-bottom: 1rem;
    max-width: 100%;
    margin-left: auto;
    margin-right: auto;
}

.hero-intro {
    font-size: 1rem;
    line-height: 1.7;
    color: var(--text);
    max-width: 100%;
    margin: 1rem auto 0;
}

/* ===== QUICK REFERENCE ===== */
.quick-reference-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 1rem;
    margin-top: 1.25rem;
}

.reference-item {
    background: var(--background);
    padding: 1rem;
    border-radius: 8px;
    border: 1px solid var(--border);
    text-align: center;
    transition: transform 0.3s;
}

.reference-item:hover {
    transform: translateY(-3px);
}

.reference-icon {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
}

.reference-content h3 {
    font-size: 1rem;
    margin-bottom: 0.5rem;
    color: var(--primary-dark);
}

.reference-values {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    margin-top: 0.5rem;
}

.reference-from {
    color: var(--text);
    font-weight: 500;
    font-size: 0.9rem;
}

.reference-arrow {
    color: var(--primary);
    margin: 0.25rem 0;
}

.reference-to {
    color: var(--primary);
    font-weight: bold;
    font-size: 1rem;
}

/* ===== VISUAL CHART ===== */
.visual-chart-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 1rem;
    justify-content: center;
}

.visual-item {
    background: var(--background);
    padding: 1.25rem;
    border-radius: 10px;
    border-left: 4px solid var(--primary);
    text-align: center;
    transition: transform 0.3s;
}

.visual-item:hover {
    transform: translateY(-3px);
}

.visual-icon {
    font-size: 2rem;
    margin-bottom: 1rem;
}

.visual-weight {
    font-size: 1.25rem;
    font-weight: bold;
    color: var(--primary);
    margin: 0.5rem 0;
}

.visual-comparison {
    color: var(--text);
    opacity: 0.8;
    font-style: italic;
    font-size: 0.9rem;
}

/* ===== STEP BY STEP ===== */
.steps-container {
    max-width: 100%;
    margin: 0 auto;
}

.step {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 1.5rem;
    align-items: center;
    text-align: center;
}

.step-number {
    background: var(--primary);
    color: white;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    flex-shrink: 0;
}

.step-content {
    flex: 1;
    width: 100%;
}

.step-content h3 {
    color: var(--primary-dark);
    margin-bottom: 0.5rem;
    font-size: 1.1rem;
}

.step-tip, .step-warning, .step-note {
    padding: 0.75rem;
    border-radius: 6px;
    margin-top: 0.5rem;
    font-size: 0.9rem;
}

.step-tip {
    background: #e8f5e9;
    border-left: 4px solid var(--success);
}

.step-warning {
    background: #fff3e0;
    border-left: 4px solid var(--warning);
}

.step-note {
    background: #e3f2fd;
    border-left: 4px solid var(--primary-light);
}

/* ===== COMMON MISTAKES ===== */
.mistakes-container {
    display: grid;
    gap: 1rem;
}

.mistake-item {
    background: var(--background);
    padding: 1.25rem;
    border-radius: 8px;
    border-left: 4px solid #ddd;
    transition: transform 0.3s;
}

.mistake-item:hover {
    transform: translateX(3px);
}

.mistake-item.high {
    border-left-color: var(--error);
}

.mistake-item.medium {
    border-left-color: var(--warning);
}

.mistake-item.low {
    border-left-color: var(--success);
}

.mistake-icon {
    font-size: 1.25rem;
    margin-bottom: 0.5rem;
}

.mistake-consequence, .mistake-solution {
    margin-top: 0.5rem;
    font-size: 0.9rem;
}

/* ===== EQUIPMENT GUIDE ===== */
.equipment-container {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.25rem;
}

.equipment-item {
    background: var(--background);
    padding: 1.25rem;
    border-radius: 8px;
    border: 1px solid var(--border);
}

.equipment-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
    flex-wrap: wrap;
}

.equipment-icon {
    font-size: 1.1rem;
}

.equipment-header h3 {
    flex: 1;
    color: var(--primary-dark);
    font-size: 1.1rem;
}

.equipment-importance {
    padding: 0.25rem 0.5rem;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: bold;
}

.equipment-importance.essential {
    background: #ffebee;
    color: #c62828;
}

.equipment-importance.recommended {
    background: #fff3e0;
    color: #ef6c00;
}

.equipment-importance.optional {
    background: #e8f5e9;
    color: #2e7d32;
}

.equipment-features h4 {
    margin: 0.5rem 0;
    color: var(--primary-dark);
    font-size: 1rem;
}

.equipment-features ul {
    margin-left: 1.25rem;
    margin-bottom: 1rem;
    font-size: 0.9rem;
}

.equipment-price, .equipment-brands {
    margin: 0.5rem 0;
    font-size: 0.9rem;
}

/* ===== SCIENTIFIC BACKGROUND ===== */
.concepts-container {
    display: grid;
    gap: 1.25rem;
}

.concept {
    background: var(--background);
    padding: 1.25rem;
    border-radius: 8px;
}

.concept h3 {
    color: var(--primary-dark);
    margin-bottom: 0.5rem;
    font-size: 1.1rem;
}

.concept p {
    font-size: 0.9rem;
}

.concept-examples, .concept-impact {
    margin-top: 1rem;
    font-size: 0.9rem;
}

.concept-examples ul {
    margin-left: 1.25rem;
    margin-top: 0.5rem;
}

/* ===== REGIONAL VARIATIONS ===== */
.regions-container {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.25rem;
}

.region-item {
    background: var(--background);
    padding: 1.25rem;
    border-radius: 8px;
    border: 1px solid var(--border);
}

.region-header h3 {
    color: var(--primary-dark);
    margin-bottom: 0.5rem;
    font-size: 1.1rem;
}

.region-cup-size {
    background: var(--primary-light);
    color: var(--primary-dark);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    display: inline-block;
    margin-top: 0.5rem;
    font-weight: bold;
    font-size: 0.9rem;
}

.region-units, .region-system, .region-note {
    margin: 0.5rem 0;
    font-size: 0.9rem;
}

/* ===== RECIPE EXAMPLES ===== */
.recipe-example {
    background: var(--background);
    padding: 1.25rem;
    border-radius: 8px;
    margin: 1.25rem 0;
}

.recipe-example h3 {
    color: var(--primary-dark);
    margin-bottom: 1rem;
    font-size: 1.1rem;
}

.recipe-comparison {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin: 1.25rem 0;
    align-items: stretch;
}

.recipe-original, .recipe-converted {
    background: var(--surface);
    padding: 1.25rem;
    border-radius: 8px;
    width: 100%;
}

.recipe-original h4, .recipe-converted h4 {
    color: var(--primary);
    margin-bottom: 1rem;
    font-size: 1rem;
}

.recipe-original ul, .recipe-converted ul {
    margin-left: 1.25rem;
    font-size: 0.9rem;
}

.recipe-arrow {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    color: var(--primary);
    transform: rotate(90deg);
    margin: 0.5rem 0;
}

.recipe-serves, .recipe-tip {
    margin-top: 1rem;
    padding: 0.75rem;
    background: var(--surface);
    border-radius: 6px;
    font-size: 0.9rem;
}

/* ===== RELATED CONVERTERS ===== */
.related-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.25rem;
    margin-top: 1.25rem;
}

.related-item {
    background: var(--background);
    padding: 1.25rem;
    border-radius: 8px;
    border: 1px solid var(--border);
}

.related-item h3 {
    color: var(--primary-dark);
    margin-bottom: 0.5rem;
    font-size: 1.1rem;
}

.related-item p {
    font-size: 0.9rem;
}

.related-link {
    display: inline-block;
    margin-top: 1rem;
    padding: 0.5rem 1rem;
    background: var(--primary);
    color: white;
    text-decoration: none;
    border-radius: 4px;
    font-weight: 500;
    transition: background 0.3s;
    font-size: 0.9rem;
}

.related-link:hover {
    background: var(--primary-dark);
}

/* ===== TIPS SECTION ===== */
.tips-section ul {
    margin-left: 1.25rem;
    margin-top: 1rem;
}

.tips-section li {
    margin-bottom: 0.5rem;
    position: relative;
    padding-left: 1.5rem;
    font-size: 0.9rem;
}

.tips-section li:before {
    content: "✓";
    color: var(--success);
    position: absolute;
    left: 0;
    font-weight: bold;
}

/* ===== BACK TO CONVERTERS LINK ===== */
.back-to-converters {
    margin: 0.5rem 0 1rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--border);
    width: 100%;
}

.back-to-converters a {
    color: var(--primary);
    text-decoration: none;
    font-weight: 500;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    transition: color 0.3s;
    font-size: 0.9rem;
}

.back-to-converters a:hover {
    color: var(--primary-dark);
    text-decoration: underline;
}

/* ===== TWO COLUMN LAYOUT FOR CONVERTER PAGES ===== */
.converter-page-layout {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    align-items: stretch;
    width: 100%;
}

.converter-main-content {
    flex: 1;
    min-width: 0;
    width: 100%;
}

/* ===== SIDEBAR ADS ===== */
.sidebar-ad-container {
    width: 100%;
    margin-top: 1.5rem;
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;
}

.sidebar-ad {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 1rem;
    text-align: center;
}

/* ===== MOBILE STICKY AD ===== */
.mobile-sticky-ad {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: var(--primary);
    color: white;
    padding: 0.75rem 1rem;
    display: none;
    justify-content: space-between;
    align-items: center;
    z-index: 1000;
    box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
    width: 100%;
}

.mobile-sticky-ad .ad-close {
    background: none;
    border: none;
    color: white;
    font-size: 1.5rem;
    cursor: pointer;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
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

    /* Mobile converter improvements */
    .converter-box {
        max-width: 100%;
    }

    .converter-input {
        max-width: 120px;
    }

    .converter-select {
        max-width: 160px;
    }
}

/* ===== RESPONSIVE DESIGN - TABLET ===== */
@media (min-width: 640px) {
    .container {
        padding: 0 20px;
    }

    .hero-section h1 {
        font-size: 2rem;
    }

    .converters-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 1.25rem;
    }

    .quick-reference-grid {
        grid-template-columns: repeat(3, 1fr);
    }

    .visual-chart-container {
        grid-template-columns: repeat(3, 1fr);
    }

    .related-grid {
        grid-template-columns: repeat(2, 1fr);
    }

    .recipe-comparison {
        flex-direction: row;
        align-items: flex-start;
    }

    .recipe-arrow {
        transform: none;
        margin: 0 1rem;
        align-items: center;
    }

    .step {
        flex-direction: row;
        text-align: left;
        align-items: flex-start;
    }

    .step-number {
        margin: 0;
    }

    .footer-content {
        grid-template-columns: repeat(2, 1fr);
    }

    .equipment-container {
        grid-template-columns: repeat(2, 1fr);
    }

    .regions-container {
        grid-template-columns: repeat(2, 1fr);
    }
}

/* ===== RESPONSIVE DESIGN - DESKTOP ===== */
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

    .converters-grid {
        grid-template-columns: repeat(3, 1fr);
    }

    .converter-page-layout {
        flex-direction: row;
        align-items: flex-start;
    }

    .sidebar-ad-container {
        width: 300px;
        margin-left: 2rem;
        grid-template-columns: 1fr;
    }

    .footer-content {
        grid-template-columns: repeat(3, 1fr);
    }

    .hero-section h1 {
        font-size: 2.2rem;
    }

    .section-header h2 {
        font-size: 1.8rem;
    }

    .quick-reference-grid {
        grid-template-columns: repeat(4, 1fr);
    }

    .equipment-container {
        grid-template-columns: repeat(3, 1fr);
    }

    .regions-container {
        grid-template-columns: repeat(3, 1fr);
    }

    .related-grid {
        grid-template-columns: repeat(3, 1fr);
    }

    /* Desktop converter layout - properly centered */
    .converter-ui {
        flex-direction: row;
        align-items: center;
        justify-content: center;
        gap: 1rem;
    }

    .converter-box {
        max-width: 450px;
    }

    .converter-swap {
        margin: 0;
        width: 56px;
        height: 56px;
        border-radius: 50%;
        padding: 0;
        min-width: 56px;
    }

    .converter-input {
        max-width: 180px;
        height: 56px;
        font-size: 1.2rem;
    }

    .converter-select {
        max-width: 250px;
        height: 56px;
        font-size: 1.1rem;
    }

    /* Improve table for desktop */
    .conversion-table th,
    .comparison-table th {
        font-size: 1rem;
        padding: 1rem;
    }

    .conversion-table td,
    .comparison-table td {
        font-size: 1rem;
        padding: 1rem;
    }
}

/* ===== RESPONSIVE DESIGN - LARGE DESKTOP ===== */
@media (min-width: 1024px) {
    .container {
        padding: 0 32px;
    }

    .converters-grid {
        grid-template-columns: repeat(4, 1fr);
    }

    .converter-box {
        min-width: 350px;
    }

    .hero-section h1 {
        font-size: 2.5rem;
    }

    /* Larger table text for big screens */
    .conversion-table th,
    .comparison-table th {
        font-size: 1.1rem;
        padding: 1.125rem 1.25rem;
    }

    .conversion-table td,
    .comparison-table td {
        font-size: 1.1rem;
        padding: 1.125rem 1.25rem;
    }
}

/* ===== RESPONSIVE DESIGN - EXTRA LARGE ===== */
@media (min-width: 1280px) {
    .converters-grid {
        grid-template-columns: repeat(5, 1fr);
    }
}

/* ===== PRINT STYLES ===== */
@media print {
    .header, .footer, .mobile-sticky-ad, .sidebar-ad-container, .ad-unit {
        display: none !important;
    }

    body {
        background: white;
        color: black;
        font-size: 12pt;
    }

    .container {
        max-width: 100%;
        padding: 0;
    }

    .content-section, .card, .converter-wrapper {
        box-shadow: none;
        border: 1px solid #ddd;
        page-break-inside: avoid;
    }

    a {
        color: black;
        text-decoration: none;
    }

    .converter-input, .converter-select {
        border: 1px solid #ccc;
    }

    /* Print tables properly */
    .table-container {
        overflow: visible !important;
    }

    table {
        page-break-inside: avoid;
    }
}

/* ===== DARK MODE SUPPORT ===== */
@media (prefers-color-scheme: dark) {
    :root {
        --background: #1a1a1a;
        --surface: #2d2d2d;
        --text: #e0e0e0;
        --border: #404040;
    }

    .converter-input, .converter-select {
        background: #333;
        color: #e0e0e0;
        border-color: #555;
    }

    table {
        border-color: #404040;
    }

    th {
        background: #333;
    }

    .reference-item, .visual-item, .equipment-item, .region-item {
        background: #333;
    }

    .step-tip {
        background: #1b5e20;
        border-left-color: #2e7d32;
    }

    .step-warning {
        background: #e65100;
        border-left-color: #ff6f00;
    }

    .step-note {
        background: #0d47a1;
        border-left-color: #1565c0;
    }
}
`;

// ==============================
// CONVERTER JAVASCRIPT LOGIC - WITH CATEGORY FILTERING
// ==============================

const CONVERTER_JS = `
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

        // Close menu when clicking outside
        document.addEventListener('click', function(event) {
            if (!mobileMenuBtn.contains(event.target) && !navLinks.contains(event.target)) {
                navLinks.classList.remove('active');
                mobileMenuBtn.setAttribute('aria-expanded', 'false');
            }
        });

        // Close menu on link click
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                mobileMenuBtn.setAttribute('aria-expanded', 'false');
            });
        });
    }

    // Initialize converter if present
    const converterData = document.getElementById('converter-data');
    if (converterData) {
        initConverter(JSON.parse(converterData.textContent));
    }

    // Initialize category filter on any page with converters
    if (document.querySelector('.converters-grid')) {
        initCategoryFilter();
    }

    // FAQ toggle functionality
    document.querySelectorAll('.faq-question').forEach(button => {
        button.addEventListener('click', function() {
            const answer = this.nextElementSibling;
            const isExpanded = this.getAttribute('aria-expanded') === 'true';

            // Toggle current FAQ
            this.setAttribute('aria-expanded', !isExpanded);
            answer.style.display = isExpanded ? 'none' : 'block';
            this.querySelector('span').textContent = isExpanded ? '+' : '−';
        });
    });

    // Mobile sticky ad close
    const closeBtn = document.querySelector('.ad-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            this.closest('.mobile-sticky-ad').style.display = 'none';
        });
    }
});

function initConverter(data) {
    console.log('Initializing converter with data:', data);

    const fromInput = document.getElementById('fromValue');
    const fromUnit = document.getElementById('fromUnit');
    const toInput = document.getElementById('toValue');
    const toUnit = document.getElementById('toUnit');
    const swapBtn = document.querySelector('.converter-swap');
    const resultSpan = document.getElementById('converterResult') || document.querySelector('.converter-result');
    const ingredientSelect = document.getElementById('ingredientSelect');

    if (!fromInput) {
        console.error('Converter input not found!');
        return;
    }

    // Clear existing options
    fromUnit.innerHTML = '';
    toUnit.innerHTML = '';

    // Populate unit options
    if (data.supportedUnits && Array.isArray(data.supportedUnits)) {
        console.log('Populating units:', data.supportedUnits);

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
            console.log('Setting defaults:', data.defaults);
            fromInput.value = data.defaults.value || 1;

            // Set from unit
            if (data.supportedUnits.includes(data.defaults.from)) {
                fromUnit.value = data.defaults.from;
            } else {
                fromUnit.value = data.supportedUnits[0];
            }

            // Set to unit
            if (data.supportedUnits.includes(data.defaults.to)) {
                toUnit.value = data.defaults.to;
            } else {
                toUnit.value = data.supportedUnits[1] || data.supportedUnits[0];
            }
        } else {
            // Fallback defaults
            fromInput.value = 1;
            fromUnit.value = data.supportedUnits[0];
            toUnit.value = data.supportedUnits[1] || data.supportedUnits[0];
        }
    } else {
        console.error('No supported units defined in converter data');
        return;
    }

    // Add event listener for ingredient dropdown
    if (ingredientSelect) {
        ingredientSelect.addEventListener('change', convert);
        console.log('Added ingredient dropdown event listener');
    }

    function convert() {
        const value = parseFloat(fromInput.value) || 0;
        const from = fromUnit.value;
        const to = toUnit.value;

        console.log('Converting:', value, from, 'to', to);

        // Get selected ingredient
        const ingredient = ingredientSelect ? ingredientSelect.value : null;
        if (ingredient) {
            console.log('Using ingredient:', ingredient);
        }

        let result = null;

        // PRIORITY 1: Ingredient-specific formula
        if (ingredient && data.ingredientFormulas && Array.isArray(data.ingredientFormulas)) {
            // Find exact ingredient formula
            const formula = data.ingredientFormulas.find(f =>
                f.from === from && f.to === to && f.ingredient === ingredient
            );

            if (formula) {
                console.log('Using ingredient formula:', formula.formula, 'for', ingredient);
                try {
                    const func = new Function('x', 'return ' + formula.formula);
                    result = func(value);
                    console.log('Ingredient formula result:', result);
                } catch (e) {
                    console.error('Ingredient formula error:', e);
                }
            }
        }

        // PRIORITY 2: Direct conversions
        if (result === null && data.conversions && data.conversions[from] && data.conversions[from][to]) {
            result = value * data.conversions[from][to];
            console.log('Using direct conversion:', result);
        }
        // PRIORITY 3: Formula-based conversion
        else if (result === null && data.conversionFormulas && Array.isArray(data.conversionFormulas)) {
            result = applyFormula(value, from, to, data.conversionFormulas);
            console.log('Using formula conversion:', result);
        }
        // PRIORITY 4: Reciprocal conversion
        else if (result === null && data.conversions && data.conversions[to] && data.conversions[to][from]) {
            result = value / data.conversions[to][from];
            console.log('Using reciprocal conversion:', result);
        }

        if (result !== null && !isNaN(result)) {
            // Format result based on magnitude
            let formattedResult;
            if (Math.abs(result) < 0.0001) {
                formattedResult = result.toExponential(4);
            } else if (Math.abs(result) < 0.01) {
                formattedResult = result.toFixed(6);
            } else if (Math.abs(result) < 1) {
                formattedResult = result.toFixed(4);
            } else if (Math.abs(result) < 1000) {
                formattedResult = result.toFixed(2);
            } else {
                formattedResult = result.toFixed(0);
            }

            toInput.value = formattedResult;

            if (resultSpan) {
                // Format display result
                let displayResult;
                if (Math.abs(result) < 0.0001) {
                    displayResult = result.toExponential(4);
                } else if (Math.abs(result) < 0.01) {
                    displayResult = result.toFixed(6);
                } else if (Math.abs(result) < 1) {
                    displayResult = result.toFixed(4);
                } else if (Math.abs(result) < 100) {
                    displayResult = result.toFixed(2);
                } else {
                    displayResult = Math.round(result * 100) / 100;
                }

                // Add ingredient to display if used
                if (ingredient) {
                    resultSpan.textContent = value + ' ' + from + ' of ' + ingredient + ' = ' + displayResult + ' ' + to;
                } else {
                    resultSpan.textContent = value + ' ' + from + ' = ' + displayResult + ' ' + to;
                }
                resultSpan.style.color = 'var(--primary)';
            }

            // Update URL for sharing
            updateURL(value, from, to, ingredient);
        } else {
            console.error('Conversion failed for', from, 'to', to);
            toInput.value = '';
            if (resultSpan) {
                resultSpan.textContent = 'Conversion not available';
                resultSpan.style.color = 'var(--error)';
            }
        }
    }

    function applyFormula(value, from, to, formulas) {
            console.log('Looking for formula:', from, '->', to);

            // Direct formula match
            for (const formula of formulas) {
                if (formula.from === from && formula.to === to) {
                    console.log('Found direct formula:', formula.formula);
                    try {
                        const func = new Function('x', 'return ' + formula.formula);
                        const result = func(value);
                        console.log('Formula result:', result);
                        return result;
                    } catch (e) {
                        console.error('Formula error:', e, 'for', formula);
                        return null;
                    }
                }
            }

            // Try reverse formula
            for (const formula of formulas) {
                if (formula.from === to && formula.to === from) {
                    console.log('Found reverse formula, calculating inverse:', formula.formula);
                    try {
                        // For inverse, we need to solve for x: formula(x) = value
                        // This is complex, so we'll use numerical approximation
                        const func = new Function('x', 'return ' + formula.formula);

                        // Simple binary search for inverse
                        let low = -1e6;
                        let high = 1e6;
                        let mid;

                        // If function is monotonic (most conversions are)
                        for (let i = 0; i < 100; i++) {
                            mid = (low + high) / 2;
                            const midVal = func(mid);

                            if (Math.abs(midVal - value) < 0.0001) {
                                return mid;
                            }

                            if (midVal < value) {
                                low = mid;
                            } else {
                                high = mid;
                            }
                        }

                        return mid; // Approximate inverse
                    } catch (e) {
                        console.error('Inverse formula error:', e);
                        return null;
                    }
                }
            }

            // Try chain conversion through a common unit
            if (formulas.length > 0) {
                const commonUnits = ['celsius', 'fahrenheit', 'gram', 'ounce', 'cup', 'milliliter'];

                for (const commonUnit of commonUnits) {
                    if (commonUnit === from || commonUnit === to) continue;

                    // Check if we have from -> commonUnit and commonUnit -> to
                    let formula1 = null;
                    let formula2 = null;

                    for (const formula of formulas) {
                        if (formula.from === from && formula.to === commonUnit) {
                            formula1 = formula;
                        }
                        if (formula.from === commonUnit && formula.to === to) {
                            formula2 = formula;
                        }
                    }

                    if (formula1 && formula2) {
                        console.log('Found chain conversion through', commonUnit);
                        try {
                            const func1 = new Function('x', 'return ' + formula1.formula);
                            const func2 = new Function('x', 'return ' + formula2.formula);
                            const intermediate = func1(value);
                            const result = func2(intermediate);
                            return result;
                        } catch (e) {
                            console.error('Chain conversion error:', e);
                            return null;
                        }
                    }
                }
            }

            console.log('No formula found for', from, '->', to);
            return null;
        }

    function updateURL(value, from, to, ingredient = null) {
        const params = new URLSearchParams();
        params.set('value', value);
        params.set('from', from);
        params.set('to', to);
        if (ingredient) params.set('ingredient', ingredient);

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
    const urlIngredient = params.get('ingredient');

    if (urlValue && urlFrom && urlTo) {
        fromInput.value = urlValue;
        if (Array.from(fromUnit.options).some(opt => opt.value === urlFrom)) {
            fromUnit.value = urlFrom;
        }
        if (Array.from(toUnit.options).some(opt => opt.value === urlTo)) {
            toUnit.value = urlTo;
        }
        if (urlIngredient && ingredientSelect) {
            ingredientSelect.value = urlIngredient;
        }
    }

    // Initial conversion
    console.log('Performing initial conversion...');
    convert();
}

function initCategoryFilter() {
    const searchInput = document.getElementById('searchConverters');
    const categoryFilters = document.querySelectorAll('.category-filter');
    const clearBtn = document.querySelector('.clear-filters');
    const converterCards = document.querySelectorAll('.converter-card');

    if (!searchInput && !categoryFilters.length) return;

    function filterConverters() {
        const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
        const activeCategory = document.querySelector('.category-filter.active')?.dataset.category || 'all';

        let visibleCount = 0;

        converterCards.forEach(card => {
            const title = card.dataset.title.toLowerCase();
            const desc = card.dataset.description.toLowerCase();
            const categories = card.dataset.categories ? card.dataset.categories.toLowerCase().split(',') : [];

            const matchesSearch = !searchTerm ||
                title.includes(searchTerm) ||
                desc.includes(searchTerm) ||
                categories.some(cat => cat.includes(searchTerm));

            const matchesCategory = activeCategory === 'all' ||
                categories.includes(activeCategory.toLowerCase());

            if (matchesSearch && matchesCategory) {
                card.style.display = 'block';
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });

        // Update count
        const countElement = document.querySelector('.converter-count');
        if (countElement) {
            countElement.textContent = visibleCount;
        }

        // Show/hide no results message
        const noResults = document.querySelector('.no-results');
        if (noResults) {
            noResults.style.display = visibleCount === 0 ? 'block' : 'none';
        }
    }

    // Event listeners
    if (searchInput) {
        searchInput.addEventListener('input', filterConverters);
        // Add debouncing for better performance
        let debounceTimer;
        searchInput.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(filterConverters, 300);
        });
    }

    categoryFilters.forEach(filter => {
        filter.addEventListener('click', (e) => {
            e.preventDefault();

            // Remove active class from all
            categoryFilters.forEach(f => f.classList.remove('active'));

            // Add active to clicked
            filter.classList.add('active');

            filterConverters();
        });
    });

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            // Clear search
            if (searchInput) searchInput.value = '';

            // Reset category to "All"
            categoryFilters.forEach(f => f.classList.remove('active'));
            const allFilter = document.querySelector('.category-filter[data-category="all"]');
            if (allFilter) allFilter.classList.add('active');

            filterConverters();
        });
    }

    // Initial filter
    filterConverters();
}
`;

// ==============================
// SEO & SCHEMA GENERATION
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

    if (page.type === 'blog') {
        return `
        <script type="application/ld+json">
        {
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": "${page.title}",
            "description": "${page.description}",
            "image": "${CONFIG.site.url}/og-image.jpg",
            "datePublished": "${formatDate()}",
            "dateModified": "${formatDate()}",
            "author": {
                "@type": "Person",
                "name": "${CONFIG.site.name}"
            },
            "publisher": {
                "@type": "Organization",
                "name": "${CONFIG.site.name}",
                "logo": {
                    "@type": "ImageObject",
                    "url": "${CONFIG.site.url}/logo.png"
                }
            },
            "mainEntityOfPage": {
                "@type": "WebPage",
                "@id": "${CONFIG.site.url}${page.url}"
            }
        }
        </script>
        `;
    }

    return `<script type="application/ld+json">${JSON.stringify(baseSchema, null, 2)}</script>`;
}

// ==============================
// PAGE GENERATORS
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

    // Get all categories
    const allCategories = getAllCategories();

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    ${generateMetaTags(page)}
    <style>${STYLES}</style>
    <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>${CONFIG.site.logo}</text></svg>">
    <link rel="icon" type="image/png" href="/favicon.png">
</head>
<body>
    ${generateNavigation('home', 'root')}
    ${generateBreadcrumbs('home', {}, 'root')}
    ${generateBreadcrumbSchema('home', {}, 'root')}

    <main class="main-content">
        <div class="container">
            <!-- Hero Section -->
            <div class="card">
                <h1 style="font-size: 2rem; color: var(--primary); margin-bottom: 1rem; line-height: 1.3;">
                    ${CONTENT.homepage?.hero?.title || 'Free Cooking Measurement Converters'}
                </h1>
                <p style="font-size: 1.1rem; color: var(--text); margin-bottom: 1.5rem;">
                    ${CONTENT.homepage?.hero?.subtitle || CONFIG.site.tagline}
                </p>

                <!-- Search Bar -->
                <div class="search-container">
                    <span class="search-icon">🔍</span>
                    <input type="text"
                           id="searchConverters"
                           class="search-input"
                           placeholder="Search converters by name, description, or category..."
                           aria-label="Search converters">
                </div>

                <!-- Category Filters -->
                ${allCategories.length > 0 ? `
                <div class="category-filters">
                    <span style="font-weight: 600; margin-right: 0.5rem;">Filter by:</span>
                    <a href="#" class="category-filter active" data-category="all">All Converters</a>
                    ${allCategories.map(cat => `
                    <a href="#" class="category-filter" data-category="${cat}">
                        ${getCategoryDisplayName(cat)}
                    </a>
                    `).join('')}
                    <button class="clear-filters" style="margin-left: auto;">Clear Filters</button>
                </div>
                ` : ''}

                <p style="margin: 1rem 0; color: var(--text); font-size: 0.9rem;">
                    Showing <span class="converter-count">${CONVERTERS.converters.length}</span> of ${CONVERTERS.converters.length} converters
                </p>
            </div>

            ${generateAdUnit('top', 'home')}

            <!-- Featured Converter -->
            ${featuredConverters.length > 0 ? `
            <div class="converter-wrapper">
                <h2 style="text-align: center; margin-bottom: 1.25rem; color: var(--primary-dark); font-size: 1.5rem;">
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

            <!-- Converters Grid with Category Tags -->
            <div class="card converters-header">
                <h2 style="color: var(--primary); margin-bottom: 1rem; font-size: 1.5rem;">All Cooking Converters</h2>
                <p style="margin-bottom: 1rem; font-size: 0.9rem;">Browse our collection of ${CONVERTERS.converters.length} converters</p>
            </div>

            <div class="converters-grid">
                ${CONVERTERS.converters.map(converter => `
                <div class="converter-card"
                     data-title="${converter.title}"
                     data-description="${converter.description}"
                     data-categories="${converter.categories ? converter.categories.join(',') : ''}">
                    <h3 style="color: var(--primary-dark); margin-bottom: 0.5rem; font-size: 1.1rem;">${converter.title}</h3>
                    <p style="margin-bottom: 0.75rem; font-size: 0.85rem; color: var(--text);">
                        ${converter.description}
                    </p>

                    <!-- Category Tags -->
                    ${converter.categories && Array.isArray(converter.categories) ? `
                    <div class="category-tags">
                        ${converter.categories.map(cat => `
                        <span class="category-tag">${getCategoryDisplayName(cat)}</span>
                        `).join('')}
                    </div>
                    ` : ''}

                    <a href="converters/${converter.slug}/" style="
                        display: inline-block;
                        margin-top: 1rem;
                        padding: 0.5rem 1rem;
                        background: var(--primary);
                        color: white;
                        text-decoration: none;
                        border-radius: 4px;
                        font-weight: 500;
                        transition: background 0.3s;
                        font-size: 0.9rem;
                    ">Use Converter</a>
                </div>
                `).join('')}

                <!-- No Results Message -->
                <div class="no-results">
                    <p>No converters found matching your criteria.</p>
                    <p>Try a different search term or category.</p>
                </div>
            </div>

            ${generateAdUnit('bottom', 'home')}

            <!-- SEO Content -->
            <div class="card">
                <h2>Cooking Conversion Guide</h2>
                ${CONTENT.homepage?.content?.map(section => `
                <div style="margin: 1.5rem 0;">
                    <h3 style="color: var(--primary-dark); margin-bottom: 1rem; font-size: 1.1rem;">${section.title}</h3>
                    <p style="font-size: 0.9rem;">${section.content}</p>
                </div>
                `).join('') || CONFIG.site.keywords.map(keyword => `
                <div style="margin: 1.5rem 0;">
                    <h3 style="color: var(--primary-dark); font-size: 1.1rem;">${keyword.charAt(0).toUpperCase() + keyword.slice(1)}</h3>
                    <p style="font-size: 0.9rem;">Convert ${keyword} with our accurate calculators. Get instant results for all your cooking and baking needs.</p>
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
                            <p style="font-size: 0.9rem;">${faq.answer}</p>
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

    const showSidebar = CONFIG.ads?.sidebar?.enabled &&
                       (converter.ads?.sidebar?.enabled !== false);

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    ${generateMetaTags(page)}
    <style>${STYLES}</style>
    <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>${CONFIG.site.logo}</text></svg>">
</head>
<body>
    ${generateNavigation(converter.slug, 'converters/' + converter.slug)}
    ${generateBreadcrumbs('converter', converter, 'converters')}
    ${generateBreadcrumbSchema('converter', converter, 'converters')}

    ${generateMobileStickyAd(converter)}

    <main class="main-content">
        <div class="container">
            <!-- Back to converters link -->
            <div class="back-to-converters">
                <a href="../">← Back to All Converters</a>
            </div>

            <div class="converter-page-layout">
                <div class="converter-main-content">
                    ${generateContentBySequence(converter)}
                </div>

                ${showSidebar ? generateSidebarAds(converter) : ''}
            </div>
        </div>
    </main>

    ${generateFooter('converters/' + converter.slug)}

    <script>${CONVERTER_JS}</script>
</body>
</html>
    `;
}

function generateStaticPage(pageName, content) {
    const page = {
        title: content.title,
        description: content.description,
        url: '/' + pageName + '/',
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
                <h1 style="color: var(--primary); font-size: 1.75rem;">${content.title}</h1>
                <div style="margin-top: 1.5rem; line-height: 1.8; font-size: 0.9rem;">
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
                            <p style="font-size: 0.9rem;">${faq.answer}</p>
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
// SITEMAP GENERATOR
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
        {
            url: '/blog/',
            lastmod: formatDate(),
            changefreq: 'weekly',
            priority: '0.7'
        },
        ...CONVERTERS.converters.map(converter => ({
            url: '/converters/' + converter.slug + '/',
            lastmod: formatDate(),
            changefreq: 'weekly',
            priority: '0.9'
        }))
    ];

    // Add blog posts to sitemap
    if (BLOGS.blogs && BLOGS.blogs.length > 0) {
        const publishedBlogs = BLOGS.blogs.filter(blog => blog.published !== false);
        publishedBlogs.forEach(blog => {
            pages.push({
                url: '/blog/' + blog.slug + '/',
                lastmod: blog.published_date || formatDate(),
                changefreq: 'monthly',
                priority: '0.6'
            });
        });
    }

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
// DEFAULT JSON CREATION
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
        "categories": [
            "weight",
            "volume",
            "temperature",
            "length",
            "time",
            "baking",
            "cooking",
            "ingredient",
            "metric",
            "imperial"
        ],
        "categoryDisplayNames": {
            "weight": "Weight",
            "volume": "Volume",
            "temperature": "Temperature",
            "length": "Length",
            "time": "Time",
            "baking": "Baking",
            "cooking": "Cooking",
            "ingredient": "Ingredient Specific",
            "metric": "Metric",
            "imperial": "Imperial"
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
                "converter_bottom": true,
                "sidebar_right": true,
                "mobile_sticky": true
            },
            "excludePages": [],
            "sidebar": {
                "enabled": true,
                "width": "300px",
                "gap": "20px",
                "sticky": true
            },
            "mobile": {
                "stickyAd": {
                    "enabled": true,
                    "position": "bottom",
                    "showAfterScroll": 500,
                    "hideOnConverter": false
                }
            }
        },
        "content": {
            "defaultSequence": [
                "hero",
                "converter",
                "quickReference",
                "comparisonTable",
                "tips",
                "faq",
                "related"
            ],
            "showSectionIcons": true,
            "enablePrintStyles": true,
            "enableDarkMode": true
        }
    };

    const defaultConverters = {
        "converters": [
            {
                "id": "cups-to-grams",
                "slug": "cups-to-grams",
                "title": "Cups to Grams Converter",
                "description": "Convert cups to grams for all cooking ingredients with precision accuracy",
                "keywords": ["cups to grams", "1 cup in grams", "baking measurement conversion"],
                "categories": ["weight", "volume", "baking", "ingredient"],
                "featured": true,
                "contentSequence": [
                    "hero",
                    "converter",
                    "quickReference",
                    "comparisonTable",
                    "tips",
                    "faq",
                    "related"
                ],
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
                "contentSections": {
                    "hero": {
                        "title": "Cups to Grams Converter",
                        "subtitle": "Accurate conversions for all baking ingredients"
                    },
                    "quickReference": {
                        "title": "Quick Reference Chart",
                        "items": [
                            {"ingredient": "All-purpose flour", "cup": 1, "grams": 125, "icon": "🍞"},
                            {"ingredient": "Granulated sugar", "cup": 1, "grams": 225, "icon": "🍬"}
                        ]
                    }
                },
                "faqs": [
                    {
                        "question": "How many grams are in 1 cup of flour?",
                        "answer": "1 cup of all-purpose flour equals approximately 125 grams."
                    }
                ]
            },
            {
                "id": "oven-temp-converter",
                "slug": "oven-temperature-converter",
                "title": "Oven Temperature Converter",
                "description": "Convert between Celsius, Fahrenheit, and Gas Mark for perfect baking results",
                "keywords": ["oven temperature", "celsius to fahrenheit", "gas mark conversion"],
                "categories": ["temperature", "baking", "cooking"],
                "featured": true,
                "defaults": {
                    "value": 180,
                    "from": "celsius",
                    "to": "fahrenheit"
                },
                "supportedUnits": ["celsius", "fahrenheit", "gas mark"],
                "conversions": {
                    "celsius": { "fahrenheit": "x * 9/5 + 32", "gas mark": "x / 14 + 1" },
                    "fahrenheit": { "celsius": "(x - 32) * 5/9", "gas mark": "(x - 32) * 5/9 / 14 + 1" }
                }
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
                    "content": "Our cooking measurement converters provide accurate conversions for all your cooking and baking needs."
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

    // NEW: Create default blogs.json
    const defaultBlogs = {
        "blogs": [
            {
                "id": "welcome-blog",
                "slug": "welcome-to-our-blog",
                "title": "Welcome to Our Blog",
                "description": "Learn about cooking conversions and tips in our new blog section",
                "published": true,
                "published_date": formatDate(),
                "author": "Admin",
                "category": "General",
                "read_time": 3,
                "content": [
                    {
                        "type": "paragraph",
                        "text": "Welcome to our new blog section! Here you'll find helpful articles about cooking measurements, conversion tips, and kitchen hacks."
                    },
                    {
                        "type": "heading",
                        "level": 2,
                        "text": "Why Accurate Measurements Matter"
                    },
                    {
                        "type": "paragraph",
                        "text": "In baking especially, precise measurements can mean the difference between success and failure. That's why we created these accurate converters."
                    },
                    {
                        "type": "list",
                        "ordered": false,
                        "items": [
                            "Use proper measuring tools",
                            "Level off dry ingredients",
                            "Use liquid measuring cups for liquids",
                            "Measure at eye level"
                        ]
                    }
                ]
            }
        ]
    };

    fs.writeFileSync('./blogs.json', JSON.stringify(defaultBlogs, null, 2));

    console.log('✅ Created default JSON files:');
    console.log('   - config.json (with categories)');
    console.log('   - converters.json');
    console.log('   - content.json');
    console.log('   - blogs.json (NEW!)');
    console.log('\n📝 Edit these files and run: node generate.js');
}

// ==============================
// VALIDATION FUNCTIONS
// ==============================

function validateConverter(converter) {
    console.log(`   Validating: ${converter.id}`);

    // Check required fields
    const required = ['id', 'slug', 'title', 'description'];
    for (const field of required) {
        if (!converter[field]) {
            throw new Error(`Missing required field: ${field}`);
        }
    }

    // Check contentSections if present
    if (converter.contentSections) {
        // Check recipeExamples
        if (converter.contentSections.recipeExamples) {
            if (!converter.contentSections.recipeExamples.examples ||
                !Array.isArray(converter.contentSections.recipeExamples.examples)) {
                throw new Error(`Invalid recipeExamples.examples - must be an array in converter ${converter.id}`);
            }
        }

        // Check quickReference
        if (converter.contentSections.quickReference) {
            if (converter.contentSections.quickReference.items &&
                !Array.isArray(converter.contentSections.quickReference.items)) {
                throw new Error(`Invalid quickReference.items - must be an array in converter ${converter.id}`);
            }
        }

        // Check comparisonTable
        if (converter.contentSections.comparisonTable) {
            if (converter.contentSections.comparisonTable.rows &&
                !Array.isArray(converter.contentSections.comparisonTable.rows)) {
                throw new Error(`Invalid comparisonTable.rows - must be an array in converter ${converter.id}`);
            }
        }

        // Check visualChart
        if (converter.contentSections.visualChart) {
            if (converter.contentSections.visualChart.items &&
                !Array.isArray(converter.contentSections.visualChart.items)) {
                throw new Error(`Invalid visualChart.items - must be an array in converter ${converter.id}`);
            }
        }

        // Check stepByStep
        if (converter.contentSections.stepByStep) {
            if (converter.contentSections.stepByStep.steps &&
                !Array.isArray(converter.contentSections.stepByStep.steps)) {
                throw new Error(`Invalid stepByStep.steps - must be an array in converter ${converter.id}`);
            }
        }

        // Check commonMistakes
        if (converter.contentSections.commonMistakes) {
            if (converter.contentSections.commonMistakes.mistakes &&
                !Array.isArray(converter.contentSections.commonMistakes.mistakes)) {
                throw new Error(`Invalid commonMistakes.mistakes - must be an array in converter ${converter.id}`);
            }
        }

        // Check equipmentGuide
        if (converter.contentSections.equipmentGuide) {
            if (converter.contentSections.equipmentGuide.tools &&
                !Array.isArray(converter.contentSections.equipmentGuide.tools)) {
                throw new Error(`Invalid equipmentGuide.tools - must be an array in converter ${converter.id}`);
            }
        }

        // Check scientificBackground
        if (converter.contentSections.scientificBackground) {
            if (converter.contentSections.scientificBackground.concepts &&
                !Array.isArray(converter.contentSections.scientificBackground.concepts)) {
                throw new Error(`Invalid scientificBackground.concepts - must be an array in converter ${converter.id}`);
            }
        }

        // Check regionalVariations
        if (converter.contentSections.regionalVariations) {
            if (converter.contentSections.regionalVariations.regions &&
                !Array.isArray(converter.contentSections.regionalVariations.regions)) {
                throw new Error(`Invalid regionalVariations.regions - must be an array in converter ${converter.id}`);
            }
        }
    }

    // Check FAQs
    if (converter.faqs && !Array.isArray(converter.faqs)) {
        throw new Error(`Invalid faqs - must be an array in converter ${converter.id}`);
    }

    console.log(`   ✓ Validated: ${converter.id}`);
}

// ==============================
// MAIN GENERATION FUNCTION - UPDATED WITH BLOG SUPPORT
// ==============================

async function generateWebsite() {
    console.log('🚀 Starting website generation with blog support...');
    console.log(`📊 Site: ${CONFIG.site.name}`);
    console.log(`📊 Converters: ${CONVERTERS.converters.length}`);
    console.log(`📊 Blog Posts: ${BLOGS.blogs ? BLOGS.blogs.filter(b => b.published !== false).length : 0}`);

    // Get categories info
    const allCategories = getAllCategories();
    console.log(`📊 Categories: ${allCategories.length}`);

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
        ensureDirectory(path.join(outputDir, 'blog')); // NEW: Blog directory

        // Generate pages
        console.log('📄 Generating homepage...');
        await writeFile(path.join(outputDir, 'index.html'), generateHomepage());

        // Converter pages - WITH ERROR HANDLING FOR EACH CONVERTER
        console.log(`⚖️ Generating ${CONVERTERS.converters.length} converter pages...`);

        const converterErrors = [];

        for (const converter of CONVERTERS.converters) {
            try {
                console.log(`   Processing: ${converter.id}`);

                // Validate converter data before generating
                validateConverter(converter);

                ensureDirectory(path.join(outputDir, 'converters', converter.slug));
                await writeFile(
                    path.join(outputDir, 'converters', converter.slug, 'index.html'),
                    generateConverterPage(converter)
                );
                console.log(`   ✓ Generated: ${converter.id}`);
            } catch (error) {
                console.error(`   ✗ Error generating ${converter.id}:`, error.message);
                converterErrors.push({
                    id: converter.id,
                    error: error.message,
                    stack: error.stack
                });
            }
        }

        // NEW: Generate blog pages if blogs exist
        if (BLOGS.blogs && BLOGS.blogs.length > 0) {
            console.log(`📝 Generating blog pages...`);
            const publishedBlogs = BLOGS.blogs.filter(blog => blog.published !== false);

            // Generate individual blog pages
            for (const blog of publishedBlogs) {
                try {
                    ensureDirectory(path.join(outputDir, 'blog', blog.slug));
                    await writeFile(
                        path.join(outputDir, 'blog', blog.slug, 'index.html'),
                        generateBlogPost(blog)
                    );
                    console.log(`   ✓ Generated blog: ${blog.slug}`);
                } catch (error) {
                    console.error(`   ✗ Error generating blog ${blog.slug}:`, error.message);
                }
            }

            // Generate blog index page
            await writeFile(
                path.join(outputDir, 'blog', 'index.html'),
                generateBlogsIndex()
            );
            console.log('   ✓ Generated blog index');
        }

        // Static pages
        const staticPages = ['about', 'privacy', 'terms', 'contact'];
        for (const pageName of staticPages) {
            if (CONTENT[pageName]) {
                console.log(`📄 Generating ${pageName} page...`);
                ensureDirectory(path.join(outputDir, pageName));
                await writeFile(
                    path.join(outputDir, pageName, 'index.html'),
                    generateStaticPage(pageName, CONTENT[pageName])
                );
            }
        }

        // Converters index page WITH CATEGORY FILTERING
        console.log('📁 Generating converters index...');

        const convertersIndex = `
<!DOCTYPE html>
<html lang="en">
<head>
    ${generateMetaTags({
        title: 'All Converters | ' + CONFIG.site.name,
        description: 'Browse all cooking measurement converters by category. Filter and search through our collection.',
        url: '/converters/',
        type: 'collection'
    })}
    <style>${STYLES}</style>
</head>
<body class="converters-page">
    ${generateNavigation('converters', 'converters')}
    ${generateBreadcrumbs('collection', {title: 'Converters'}, 'converters')}
    ${generateBreadcrumbSchema('collection', {title: 'Converters'}, 'converters')}

    <main class="main-content">
        <div class="container">
            <div class="card converters-header">
                <h1 style="color: var(--primary); margin-bottom: 0.5rem; font-size: 1.75rem;">All Cooking Converters</h1>
                <p style="margin-bottom: 1rem; font-size: 0.9rem;">Find the perfect converter for your needs. Filter by category or search.</p>

                <!-- Search Bar -->
                <div class="search-container">
                    <span class="search-icon">🔍</span>
                    <input type="text"
                           id="searchConverters"
                           class="search-input"
                           placeholder="Search converters by name, description, or category..."
                           aria-label="Search converters">
                </div>

                <!-- Category Filters -->
                ${allCategories.length > 0 ? `
                <div class="category-filters">
                    <span style="font-weight: 600; margin-right: 0.5rem; font-size: 0.9rem;">Categories:</span>
                    <a href="#" class="category-filter active" data-category="all">All</a>
                    ${allCategories.map(cat => `
                    <a href="#" class="category-filter" data-category="${cat}">
                        ${getCategoryDisplayName(cat)}
                    </a>
                    `).join('')}
                    <button class="clear-filters" style="margin-left: auto;">Clear Filters</button>
                </div>
                ` : ''}

                <p style="margin: 1rem 0; color: var(--text); font-size: 0.9rem;">
                    Showing <span class="converter-count">${CONVERTERS.converters.length}</span> of ${CONVERTERS.converters.length} converters
                </p>
            </div>

            <!-- Converters Grid -->
            <div class="converters-grid">
                ${CONVERTERS.converters.map(converter => `
                <div class="converter-card"
                     data-title="${converter.title}"
                     data-description="${converter.description}"
                     data-categories="${converter.categories ? converter.categories.join(',') : ''}">
                    <h3 style="color: var(--primary-dark); margin-bottom: 0.5rem; font-size: 1.1rem;">${converter.title}</h3>
                    <p style="margin-bottom: 0.75rem; font-size: 0.85rem; color: var(--text);">
                        ${converter.description}
                    </p>

                    <!-- Category Tags -->
                    ${converter.categories && Array.isArray(converter.categories) ? `
                    <div class="category-tags">
                        ${converter.categories.map(cat => `
                        <span class="category-tag">${getCategoryDisplayName(cat)}</span>
                        `).join('')}
                    </div>
                    ` : ''}

                    <a href="${converter.slug}/" style="
                        display: inline-block;
                        margin-top: 1rem;
                        padding: 0.5rem 1rem;
                        background: var(--primary);
                        color: white;
                        text-decoration: none;
                        border-radius: 4px;
                        font-weight: 500;
                        transition: background 0.3s;
                        font-size: 0.9rem;
                    ">Use Converter</a>
                </div>
                `).join('')}

                <!-- No Results Message -->
                <div class="no-results">
                    <p>No converters found matching your criteria.</p>
                    <p>Try a different search term or category.</p>
                </div>
            </div>
        </div>
    </main>
    ${generateFooter('converters')}
    <script>${CONVERTER_JS}</script>
</body>
</html>
        `;

        await writeFile(
            path.join(outputDir, 'converters', 'index.html'),
            convertersIndex
        );

        // Sitemap
        console.log('🗺️ Generating sitemap.xml...');
        await writeFile(
            path.join(outputDir, 'sitemap.xml'),
            generateSitemap()
        );

        // Robots.txt
        console.log('🤖 Generating robots.txt...');
        await writeFile(
            path.join(outputDir, 'robots.txt'),
            generateRobotsTxt()
        );

        console.log('\n' + '='.repeat(60));
        console.log('✅ GENERATION COMPLETE WITH BLOG SUPPORT!');
        console.log('='.repeat(60));
        console.log(`📊 Statistics:`);
        console.log(`   Total pages: ${4 + CONVERTERS.converters.length + (BLOGS.blogs ? BLOGS.blogs.filter(b => b.published !== false).length : 0)}`);
        console.log(`   Converters: ${CONVERTERS.converters.length}`);
        console.log(`   Successful: ${CONVERTERS.converters.length - converterErrors.length}`);
        console.log(`   Failed: ${converterErrors.length}`);
        console.log(`   Blog Posts: ${BLOGS.blogs ? BLOGS.blogs.filter(b => b.published !== false).length : 0}`);
        console.log(`   Categories: ${allCategories.length}`);

        if (converterErrors.length > 0) {
            console.log('\n❌ Failed converters:');
            converterErrors.forEach(err => console.log(`   • ${err.id}`));
            console.log('\n🔧 Fix these converters in converters.json and run again.');
        }

        console.log('\n🎯 NEW FEATURES:');
        console.log('   • Blog system with individual post pages');
        console.log('   • Blog index page with featured images');
        console.log('   • Blog navigation in header');
        console.log('   • Blog breadcrumbs and SEO');
        console.log('   • Blog sitemap inclusion');
        console.log('\n📁 File structure:');
        console.log(`   ${outputDir}/`);
        console.log(`   ├── index.html`);
        console.log(`   ├── converters/`);
        console.log(`   │   ├── index.html`);
        console.log(`   │   └── [slug]/index.html`);
        console.log(`   ├── blog/`);
        console.log(`   │   ├── index.html`);
        console.log(`   │   └── [slug]/index.html`);
        console.log(`   ├── about/index.html`);
        console.log(`   ├── contact/index.html`);
        console.log(`   ├── privacy/index.html`);
        console.log(`   ├── terms/index.html`);
        console.log(`   ├── sitemap.xml`);
        console.log(`   └── robots.txt`);
        console.log('\n🚀 To serve locally:');
        console.log('   cd public && npx serve');
        console.log('\n📝 To add blog posts:');
        console.log('   1. Edit blogs.json');
        console.log('   2. Run: node generate.js');
        console.log('   3. Blog will appear at /blog/');
        console.log('='.repeat(60));

    } catch (error) {
        console.error('❌ Generation failed:', error);
        console.error('\n🔍 Debugging info:');
        console.error('   Error type:', error.name);
        console.error('   Error message:', error.message);
        console.error('   Error location:');

        // Try to parse the stack trace to give better info
        if (error.stack) {
            const stackLines = error.stack.split('\n');
            // Look for the line with generate.js in it
            const relevantLine = stackLines.find(line => line.includes('generate.js'));
            if (relevantLine) {
                console.error('   In file: generate.js');
                // Extract line number if possible
                const lineMatch = relevantLine.match(/generate\.js:(\d+):(\d+)/);
                if (lineMatch) {
                    console.error(`   Line: ${lineMatch[1]}, Column: ${lineMatch[2]}`);

                    // Give context based on line number
                    const lineNum = parseInt(lineMatch[1]);
                    if (lineNum >= 770 && lineNum <= 780) {
                        console.error('   Problem in: generateRecipeExamplesSection function');
                        console.error('   Check converters.json for malformed recipeExamples section');
                    } else if (lineNum >= 750 && lineNum <= 760) {
                        console.error('   Problem in: generateRegionalVariationsSection function');
                        console.error('   Check converters.json for malformed regionalVariations section');
                    }
                }
            }
        }
    }
}

// Helper function for async file writing
function writeFile(path, content) {
    return new Promise((resolve, reject) => {
        fs.writeFile(path, content, 'utf8', (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}

// ==============================
// RUN GENERATOR
// ==============================

if (require.main === module) {
    generateWebsite();
}

module.exports = { generateWebsite };