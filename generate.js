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
    function getPath(target, currentLoc) {
        if (currentLoc === 'root') {
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
// NEW: CONTENT SECTION GENERATORS
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
                // Check if it's the ingredient format (has 'ingredient' property)
                if (item.ingredient) {
                    const cupValue = item.cup;
                    const isCupValueString = typeof cupValue === 'string';
                    const cupNumber = parseFloat(cupValue) || 1;

                    // Determine what to display in the "to" section
                    let toValue = '';
                    if (item.grams) {
                        toValue = `${item.grams}g`;
                    } else if (item.ml) {
                        toValue = `${item.ml}ml`;
                    } else if (item.ounce) {
                        toValue = `${item.ounce} oz`;
                    } else if (item.tablespoon) {
                        toValue = `${item.tablespoon} tbsp`;
                    } else if (item.teaspoon) {
                        toValue = `${item.teaspoon} tsp`;
                    } else if (item.fahrenheit) {
                        toValue = `${item.fahrenheit}°F`;
                    } else if (item.celsius) {
                        toValue = `${item.celsius}°C`;
                    } else if (item.kelvin) {
                        toValue = `${item.kelvin}K`;
                    } else if (item.liter) {
                        toValue = `${item.liter}L`;
                    } else if (item.pound) {
                        toValue = `${item.pound} lb`;
                    }
                    // Add more unit types as needed

                    return `
                    <div class="reference-item">
                        ${item.icon ? `<div class="reference-icon">${item.icon}</div>` : ''}
                        <div class="reference-content">
                            <h3>${item.ingredient}</h3>
                            <div class="reference-values">
                                <span class="reference-from">${isCupValueString ? cupValue : cupNumber} cup${cupNumber !== 1 ? 's' : ''}</span>
                                <span class="reference-arrow">→</span>
                                <span class="reference-to">${toValue}</span>
                            </div>
                            ${item.tip ? `<div class="reference-tip" style="font-size:0.85rem;color:#666;margin-top:0.5rem;">${item.tip}</div>` : ''}
                        </div>
                    </div>
                    `;
                }
                // Otherwise it's the cup fraction format (has 'cup' and other units but no 'ingredient')
                else {
                    // Try to find any unit in the item
                    const cupValue = item.cup || '';
                    const isCupValueString = typeof cupValue === 'string';
                    const cupNumber = parseFloat(cupValue) || 0.25;

                    // Determine what to display
                    let fromValue = `${isCupValueString ? cupValue : cupNumber} cup${cupNumber !== 1 ? 's' : ''}`;
                    let toValue = '';

                    // Check for all possible unit types
                    if (item.grams) {
                        toValue = `${item.grams}g`;
                    } else if (item.ml) {
                        toValue = `${item.ml}ml`;
                    } else if (item.ounce) {
                        toValue = `${item.ounce} oz`;
                    } else if (item.tablespoon) {
                        toValue = `${item.tablespoon} tbsp`;
                    } else if (item.teaspoon) {
                        toValue = `${item.teaspoon} tsp`;
                    } else if (item.fahrenheit) {
                        toValue = `${item.fahrenheit}°F`;
                    } else if (item.celsius) {
                        toValue = `${item.celsius}°C`;
                    } else if (item.kelvin) {
                        toValue = `${item.kelvin}K`;
                    }

                    return `
                    <div class="reference-item">
                        <div class="reference-content">
                            <h3>${isCupValueString ? cupValue : cupNumber + ' cup'}${cupNumber !== 1 ? 's' : ''}</h3>
                            <div class="reference-values">
                                <span class="reference-from">${fromValue}</span>
                                ${toValue ? `<span class="reference-arrow">→</span><span class="reference-to">${toValue}</span>` : ''}
                            </div>
                            ${item.note ? `<div class="reference-note" style="font-size:0.85rem;color:#666;margin-top:0.5rem;">${item.note}</div>` : ''}
                        </div>
                    </div>
                    `;
                }
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
                        ${Object.values(row).map(cell => `<td>${cell}</td>`).join('')}
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
// NEW: GENERATE CONTENT BY SEQUENCE
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
// CSS STYLES (Green Growth Theme) - UPDATED WITH CATEGORY FILTERS
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

/* Breadcrumbs */
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

/* Back to converters link */
.back-to-converters {
    margin: 0.5rem 0 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--border);
}

.back-to-converters a {
    color: var(--primary);
    text-decoration: none;
    font-weight: 500;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    transition: color 0.3s;
}

.back-to-converters a:hover {
    color: var(--primary-dark);
    text-decoration: underline;
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

/* NEW: Category and Search Styles */
.converters-header {
    margin-bottom: 2.5rem;
}

.category-filters {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin: 1.5rem 0;
    align-items: center;
}

.category-filter {
    padding: 0.5rem 1rem;
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
}

.category-filter:hover,
.category-filter.active {
    background: var(--primary);
    color: white;
    border-color: var(--primary);
}

.search-container {
    position: relative;
    margin: 1rem 0 1.5rem;
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

.converters-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
    margin: 2rem 0;
}

.converter-card {
    background: var(--surface);
    border-radius: 12px;
    padding: 1.5rem;
    border: 1px solid var(--border);
    transition: transform 0.3s, box-shadow 0.3s;
    position: relative;
}

.converter-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 25px rgba(0,0,0,0.1);
}

.category-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin: 0.75rem 0 1rem;
}

.category-tag {
    padding: 0.25rem 0.75rem;
    background: var(--background);
    border: 1px solid var(--border);
    border-radius: 12px;
    font-size: 0.8rem;
    color: var(--text);
    white-space: nowrap;
}

.no-results {
    text-align: center;
    padding: 3rem;
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
    font-size: 0.95rem;
    white-space: nowrap;
}

.clear-filters:hover {
    background: var(--primary);
    color: white;
}

/* Converter UI */
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

.ingredient-selector {
    margin: 1rem auto;
    text-align: center;
    max-width: 500px;
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

/* Content Section Styles */
.content-section {
    margin: 2.5rem 0;
    padding: 2rem;
    background: var(--surface);
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

.section-header {
    margin-bottom: 1.5rem;
    text-align: center;
}

.section-header h2 {
    color: var(--primary-dark);
    margin-bottom: 0.5rem;
    font-size: 1.8rem;
}

.section-description {
    color: var(--text);
    opacity: 0.8;
    max-width: 800px;
    margin: 0 auto;
}

/* Hero Section */
.hero-section {
    text-align: center;
    padding: 2rem 2rem 1.5rem;
}

.hero-section h1 {
    color: var(--primary);
    font-size: 2.2rem;
    margin-bottom: 0.75rem;
}

.hero-subtitle {
    font-size: 1.2rem;
    color: var(--text);
    margin-bottom: 1.5rem;
    max-width: 800px;
    margin-left: auto;
    margin-right: auto;
}

.hero-intro {
    font-size: 1.1rem;
    line-height: 1.8;
    color: var(--text);
    max-width: 800px;
    margin: 1.5rem auto 0;
}

/* Quick Reference */
.quick-reference-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-top: 1.5rem;
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
    transform: translateY(-5px);
}

.reference-icon {
    font-size: 2rem;
    margin-bottom: 0.5rem;
}

.reference-content h3 {
    font-size: 1.1rem;
    margin-bottom: 0.5rem;
    color: var(--primary-dark);
}

.reference-values {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.5rem;
}

.reference-from {
    color: var(--text);
    font-weight: 500;
}

.reference-arrow {
    color: var(--primary);
}

.reference-to {
    color: var(--primary);
    font-weight: bold;
    font-size: 1.1rem;
}

/* Comparison Table */
.comparison-table table {
    width: 100%;
    border-collapse: collapse;
}

.comparison-table th {
    background: var(--primary-light);
    color: var(--primary-dark);
    padding: 1rem;
    text-align: left;
    font-weight: 600;
}

.comparison-table td {
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--border);
}

/* Visual Chart */
.visual-chart-container {
    display: flex;
    flex-wrap: wrap;
    gap: 1.5rem;
    justify-content: center;
}

.visual-item {
    flex: 1;
    min-width: 200px;
    max-width: 300px;
    background: var(--background);
    padding: 1.5rem;
    border-radius: 10px;
    border-left: 4px solid var(--primary);
    text-align: center;
    transition: transform 0.3s;
}

.visual-item:hover {
    transform: translateY(-5px);
}

.visual-icon {
    font-size: 2.5rem;
    margin-bottom: 1rem;
}

.visual-weight {
    font-size: 1.5rem;
    font-weight: bold;
    color: var(--primary);
    margin: 0.5rem 0;
}

.visual-comparison {
    color: var(--text);
    opacity: 0.8;
    font-style: italic;
}

/* Step by Step */
.steps-container {
    max-width: 800px;
    margin: 0 auto;
}

.step {
    display: flex;
    gap: 1.5rem;
    margin-bottom: 2rem;
    align-items: flex-start;
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
}

.step-content h3 {
    color: var(--primary-dark);
    margin-bottom: 0.5rem;
}

.step-tip, .step-warning, .step-note {
    padding: 0.75rem;
    border-radius: 6px;
    margin-top: 0.5rem;
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

/* Common Mistakes */
.mistakes-container {
    display: grid;
    gap: 1rem;
}

.mistake-item {
    background: var(--background);
    padding: 1.5rem;
    border-radius: 8px;
    border-left: 4px solid #ddd;
    transition: transform 0.3s;
}

.mistake-item:hover {
    transform: translateX(5px);
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
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
}

.mistake-consequence, .mistake-solution {
    margin-top: 0.5rem;
}

/* Equipment Guide */
.equipment-container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
}

.equipment-item {
    background: var(--background);
    padding: 1.5rem;
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
    font-size: 1.2rem;
}

.equipment-header h3 {
    flex: 1;
    color: var(--primary-dark);
}

.equipment-importance {
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.8rem;
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
}

.equipment-features ul {
    margin-left: 1.5rem;
    margin-bottom: 1rem;
}

.equipment-price, .equipment-brands {
    margin: 0.5rem 0;
}

/* Scientific Background */
.concepts-container {
    display: grid;
    gap: 1.5rem;
}

.concept {
    background: var(--background);
    padding: 1.5rem;
    border-radius: 8px;
}

.concept h3 {
    color: var(--primary-dark);
    margin-bottom: 0.5rem;
}

.concept-examples, .concept-impact {
    margin-top: 1rem;
}

.concept-examples ul {
    margin-left: 1.5rem;
    margin-top: 0.5rem;
}

/* Regional Variations */
.regions-container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
}

.region-item {
    background: var(--background);
    padding: 1.5rem;
    border-radius: 8px;
    border: 1px solid var(--border);
}

.region-header h3 {
    color: var(--primary-dark);
    margin-bottom: 0.5rem;
}

.region-cup-size {
    background: var(--primary-light);
    color: var(--primary-dark);
    padding: 0.25rem 0.75rem;
    border-radius: 4px;
    display: inline-block;
    margin-top: 0.5rem;
    font-weight: bold;
}

.region-units, .region-system, .region-note {
    margin: 0.5rem 0;
}

/* Recipe Examples */
.recipe-example {
    background: var(--background);
    padding: 1.5rem;
    border-radius: 8px;
    margin: 1.5rem 0;
}

.recipe-example h3 {
    color: var(--primary-dark);
    margin-bottom: 1rem;
}

.recipe-comparison {
    display: flex;
    gap: 2rem;
    margin: 1.5rem 0;
    flex-wrap: wrap;
    align-items: flex-start;
}

.recipe-original, .recipe-converted {
    flex: 1;
    min-width: 250px;
    background: var(--surface);
    padding: 1.5rem;
    border-radius: 8px;
}

.recipe-original h4, .recipe-converted h4 {
    color: var(--primary);
    margin-bottom: 1rem;
}

.recipe-original ul, .recipe-converted ul {
    margin-left: 1.5rem;
}

.recipe-arrow {
    display: flex;
    align-items: center;
    font-size: 1.5rem;
    color: var(--primary);
}

.recipe-serves, .recipe-tip {
    margin-top: 1rem;
    padding: 0.75rem;
    background: var(--surface);
    border-radius: 6px;
}

/* Related Converters */
.related-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
    margin-top: 1.5rem;
}

.related-item {
    background: var(--background);
    padding: 1.5rem;
    border-radius: 8px;
    border: 1px solid var(--border);
}

.related-item h3 {
    color: var(--primary-dark);
    margin-bottom: 0.5rem;
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
}

.related-link:hover {
    background: var(--primary-dark);
}

/* Tips Section */
.tips-section ul {
    margin-left: 1.5rem;
    margin-top: 1rem;
}

.tips-section li {
    margin-bottom: 0.5rem;
    position: relative;
    padding-left: 1.5rem;
}

.tips-section li:before {
    content: "✓";
    color: var(--success);
    position: absolute;
    left: 0;
    font-weight: bold;
}

/* FAQ Container */
.faq-container {
    margin-top: 1.5rem;
}

/* Sidebar Ads */
.sidebar-ad-container {
    width: 300px;
    margin-left: 2rem;
}

.sidebar-ad {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1.5rem;
    text-align: center;
}

/* Mobile Sticky Ad */
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
}

/* Two Column Layout for Converter Pages */
.converter-page-layout {
    display: flex;
    gap: 2rem;
    align-items: flex-start;
}

.converter-main-content {
    flex: 1;
    min-width: 0;
}

/* Responsive Design */
@media (max-width: 1024px) {
    .converter-page-layout {
        flex-direction: column;
    }

    .sidebar-ad-container {
        width: 100%;
        margin-left: 0;
        margin-top: 2rem;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1rem;
    }
}

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
        gap: 0.75rem;
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
        height: 44px;
        padding: 0.5rem;
        font-size: 1rem;
    }

    .converter-input {
        min-width: 80px;
    }

    .converter-select {
        font-size: 0.9rem;
        min-width: 120px;
    }

    .converter-swap {
            width: 44px;
        height: 44px;
        font-size: 1rem;
        margin: 0.25rem auto;
        order: 3;
    }

    /* Stacked conversion result for mobile */
    .converter-result {
        font-size: 1.1rem;
        padding: 0.75rem;
        text-align: left;
        line-height: 1.4;
        background: var(--background);
        border-radius: 8px;
        margin-top: 0.75rem;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .converter-result::before {
        content: "Result:";
        font-size: 0.85rem;
        color: #666;
        font-weight: normal;
        margin-bottom: 0.25rem;
    }

    /* Category filters mobile */
    .category-filters {
        overflow-x: auto;
        padding-bottom: 0.5rem;
        -webkit-overflow-scrolling: touch;
        margin: 1rem 0;
    }

    .search-input {
        font-size: 16px; /* Prevents zoom on iOS */
    }

    .converters-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
    }

    .clear-filters {
        margin-left: 0;
        margin-top: 0.5rem;
    }

    @media (max-width: 480px) {
        .converter-input,
        .converter-select {
            height: 40px;
            padding: 0.4rem;
        }

        .converter-input {
            font-size: 0.95rem;
        }

        .converter-select {
            font-size: 0.85rem;
        }

        .converter-swap {
            width: 40px;
            height: 40px;
        }

        .converter-result {
            font-size: 1rem;
            padding: 0.6rem;
        }
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

    .content-section {
        padding: 1.5rem;
        margin: 1.5rem 0;
    }

    .quick-reference-grid {
        grid-template-columns: 1fr;
    }

    .visual-chart-container {
        flex-direction: column;
    }

    .step {
        flex-direction: column;
        text-align: center;
    }

    .step-number {
        margin: 0 auto 1rem;
    }

    .recipe-comparison {
        flex-direction: column;
    }

    .recipe-arrow {
        transform: rotate(90deg);
        margin: 1rem 0;
        justify-content: center;
    }

    .mobile-sticky-ad {
        display: flex;
    }

    .hero-section h1 {
        font-size: 2rem;
    }

    .section-header h2 {
        font-size: 1.5rem;
    }
}

@media (min-width: 769px) {
    .mobile-sticky-ad {
        display: none !important;
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

    .equipment-container,
    .regions-container,
    .related-grid {
        grid-template-columns: 1fr;
    }

    .converter-card {
        padding: 1.25rem;
    }

    .category-tags {
        gap: 0.25rem;
    }

    .category-tag {
        font-size: 0.75rem;
        padding: 0.2rem 0.6rem;
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

                <p style="margin: 1rem 0; color: var(--text);">
                    Showing <span class="converter-count">${CONVERTERS.converters.length}</span> of ${CONVERTERS.converters.length} converters
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

            <!-- Converters Grid with Category Tags -->
            <div class="card converters-header">
                <h2 style="color: var(--primary); margin-bottom: 1rem;">All Cooking Converters</h2>
                <p style="margin-bottom: 1rem;">Browse our collection of ${CONVERTERS.converters.length} converters</p>
            </div>

            <div class="converters-grid">
                ${CONVERTERS.converters.map(converter => `
                <div class="converter-card"
                     data-title="${converter.title}"
                     data-description="${converter.description}"
                     data-categories="${converter.categories ? converter.categories.join(',') : ''}">
                    <h3 style="color: var(--primary-dark); margin-bottom: 0.5rem;">${converter.title}</h3>
                    <p style="margin-bottom: 0.75rem; font-size: 0.95rem; color: var(--text);">
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
        ...CONVERTERS.converters.map(converter => ({
            url: '/converters/' + converter.slug + '/',
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

    console.log('✅ Created default JSON files:');
    console.log('   - config.json (with categories)');
    console.log('   - converters.json');
    console.log('   - content.json');
    console.log('\n📝 Edit these files and run: node generate.js');
}

// ==============================
// MAIN GENERATION FUNCTION
// ==============================

async function generateWebsite() {
    console.log('🚀 Starting website generation with category filtering...');
    console.log(`📊 Site: ${CONFIG.site.name}`);
    console.log(`📊 Converters: ${CONVERTERS.converters.length}`);

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

        // Generate pages
        console.log('📄 Generating homepage with category filtering...');
        await writeFile(path.join(outputDir, 'index.html'), generateHomepage());

        // Converter pages
        console.log(`⚖️ Generating ${CONVERTERS.converters.length} converter pages...`);
        for (const converter of CONVERTERS.converters) {
            ensureDirectory(path.join(outputDir, 'converters', converter.slug));
            await writeFile(
                path.join(outputDir, 'converters', converter.slug, 'index.html'),
                generateConverterPage(converter)
            );
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
        console.log('📁 Generating converters index with category filtering...');

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
                <h1 style="color: var(--primary); margin-bottom: 0.5rem;">All Cooking Converters</h1>
                <p style="margin-bottom: 1rem;">Find the perfect converter for your needs. Filter by category or search.</p>

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
                    <span style="font-weight: 600; margin-right: 0.5rem;">Categories:</span>
                    <a href="#" class="category-filter active" data-category="all">All</a>
                    ${allCategories.map(cat => `
                    <a href="#" class="category-filter" data-category="${cat}">
                        ${getCategoryDisplayName(cat)}
                    </a>
                    `).join('')}
                    <button class="clear-filters" style="margin-left: auto;">Clear Filters</button>
                </div>
                ` : ''}

                <p style="margin: 1rem 0; color: var(--text);">
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
                    <h3 style="color: var(--primary-dark); margin-bottom: 0.5rem;">${converter.title}</h3>
                    <p style="margin-bottom: 0.75rem; font-size: 0.95rem; color: var(--text);">
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
        console.log('✅ GENERATION COMPLETE WITH CATEGORY FILTERING!');
        console.log('='.repeat(60));
        console.log(`📊 Statistics:`);
        console.log(`   Total pages: ${4 + CONVERTERS.converters.length}`);
        console.log(`   Converters: ${CONVERTERS.converters.length}`);
        console.log(`   Categories: ${allCategories.length}`);
        console.log('\n🎯 FEATURES ADDED:');
        console.log('   • Category filtering on BOTH homepage and converters page');
        console.log('   • Search functionality');
        console.log('   • Category tags on converter cards');
        console.log('   • Clear filters button');
        console.log('   • Configurable categories in config.json');
        console.log('   • Category display names customization');
        console.log('   • Responsive mobile design');
        console.log('\n📁 File structure:');
        console.log(`   ${outputDir}/`);
        console.log(`   ├── index.html (with filters)`);
        console.log(`   ├── converters/`);
        console.log(`   │   ├── index.html (with filters)`);
        console.log(`   │   └── [slug]/index.html`);
        console.log(`   ├── about/index.html`);
        console.log(`   ├── contact/index.html`);
        console.log(`   ├── privacy/index.html`);
        console.log(`   ├── terms/index.html`);
        console.log(`   ├── sitemap.xml`);
        console.log(`   └── robots.txt`);
        console.log('\n🚀 To serve locally:');
        console.log('   cd public && npx serve');
        console.log('\n🔧 To update config.json:');
        console.log('   Add "categories" array and "categoryDisplayNames" object');
        console.log('\n🔧 To update converters:');
        console.log('   1. Edit converters.json - add "categories": ["cat1", "cat2"]');
        console.log('   2. Run: node generate.js');
        console.log('='.repeat(60));

    } catch (error) {
        console.error('❌ Generation failed:', error);
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