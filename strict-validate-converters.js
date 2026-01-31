// strict-validate-converters.js (REALISTIC - MATCHING ACTUAL STRUCTURE)
const fs = require('fs');
const path = require('path');

// Define realistic structure requirements based on ACTUAL JSON
const SECTION_STRUCTURES = {
  hero: {
    requiredKeys: ['title'],
    optionalKeys: ['subtitle', 'intro'],
    exactKeys: ['title', 'subtitle', 'intro'], // Allowed keys
    example: {
      "hero": {
        "title": "Converter Title",
        "subtitle": "Optional subtitle",
        "intro": "Optional introduction"
      }
    }
  },

  quickReference: {
    requiredKeys: ['title', 'items'],
    optionalKeys: ['description'],
    exactKeys: ['title', 'description', 'items'],
    items: {
      type: 'array',
      minItems: 3,
      itemStructure: {
        requiredKeys: ['ingredient'], // Only ingredient is required
        optionalKeys: ['cup', 'grams', 'icon', 'tip', 'tablespoon', 'teaspoon',
                      'celsius', 'fahrenheit', 'gasMark', 'ml', 'ounce', 'pound'],
        // FLEXIBLE: Different converters need different keys
        validate: (item, index, path, errors) => {
          if (typeof item !== 'object' || item === null) {
            errors.push(`${path}[${index}] must be an object`);
            return;
          }

          // Check required key
          if (item.ingredient === undefined) {
            errors.push(`${path}[${index}] missing required key: "ingredient"`);
          }

          // Check for at least one value besides ingredient
          const valueKeys = Object.keys(item).filter(key =>
            !['ingredient', 'icon', 'tip'].includes(key)
          );
          if (valueKeys.length === 0) {
            errors.push(`${path}[${index}] must have at least one conversion value (cup, grams, celsius, etc.)`);
          }
        }
      }
    },
    example: {
      "quickReference": {
        "title": "Quick Reference",
        "description": "Optional description",
        "items": [
          {
            "ingredient": "Flour",
            "cup": 1,
            "grams": 125,
            "icon": "🍞",
            "tip": "Optional tip"
          }
        ]
      }
    }
  },

  comparisonTable: {
    requiredKeys: ['title'],
    optionalKeys: ['description', 'columns', 'rows'],
    exactKeys: ['title', 'description', 'columns', 'rows'],
    columns: {
      type: 'array',
      minItems: 2,
      validate: (columns, path, errors) => {
        if (!Array.isArray(columns)) {
          errors.push(`"${path}" must be an array`);
        }
      }
    },
    rows: {
      type: 'array',
      minItems: 8, // You wanted at least 8 entries
      itemStructure: {
        type: 'object',
        // Validate rows have consistent structure with columns
        validate: (row, index, path, columns, errors) => {
          if (!columns) return; // Can't validate without columns

          if (typeof row !== 'object' || row === null) {
            errors.push(`${path}[${index}] must be an object`);
            return;
          }

          // For comparison table, row should have reasonable structure
          const rowKeys = Object.keys(row);
          if (rowKeys.length === 0) {
            errors.push(`${path}[${index}] must have at least one key`);
          }
        }
      }
    },
    validate: (sectionData, sectionName, errors) => {
      // If columns exist, rows must exist and vice versa
      const hasColumns = sectionData.columns && Array.isArray(sectionData.columns);
      const hasRows = sectionData.rows && Array.isArray(sectionData.rows);

      if (hasColumns && !hasRows) {
        errors.push(`"${sectionName}" has columns but no rows`);
      }
      if (hasRows && !hasColumns) {
        errors.push(`"${sectionName}" has rows but no columns`);
      }
    },
    example: {
      "comparisonTable": {
        "title": "Comparison Table",
        "description": "Optional description",
        "columns": ["Column1", "Column2", "Column3"],
        "rows": [
          {"Column1": "Value1", "Column2": "Value2", "Column3": "Value3"}
        ]
      }
    }
  },

  visualChart: {
    requiredKeys: ['title'],
    optionalKeys: ['description', 'items'],
    exactKeys: ['title', 'description', 'items'],
    items: {
      type: 'array',
      minItems: 2,
      itemStructure: {
        requiredKeys: ['name'],
        optionalKeys: ['weight', 'comparison', 'visual', 'color']
      }
    },
    example: {
      "visualChart": {
        "title": "Visual Chart",
        "description": "Optional description",
        "items": [
          {
            "name": "Item",
            "weight": "100g",
            "comparison": "Light",
            "visual": "📊",
            "color": "#ff0000"
          }
        ]
      }
    }
  },

  stepByStep: {
    requiredKeys: ['title', 'steps'],
    optionalKeys: ['description'],
    exactKeys: ['title', 'description', 'steps'],
    steps: {
      type: 'array',
      minItems: 1,
      itemStructure: {
        requiredKeys: ['number', 'title', 'content'],
        optionalKeys: ['tip', 'warning', 'note']
      }
    },
    example: {
      "stepByStep": {
        "title": "Step by Step",
        "description": "Optional description",
        "steps": [
          {
            "number": 1,
            "title": "Step 1",
            "content": "Content"
          }
        ]
      }
    }
  },

  commonMistakes: {
    requiredKeys: ['title'],
    optionalKeys: ['description', 'mistakes', 'items'],
    exactKeys: ['title', 'description', 'mistakes', 'items'],
    mistakes: {
      type: 'array',
      minItems: 1,
      itemStructure: {
        requiredKeys: ['mistake', 'consequence', 'solution'],
        optionalKeys: ['severity', 'icon']
      }
    },
    items: {
      type: 'array',
      minItems: 1,
      itemStructure: { type: 'string' }
    },
    example: {
      "commonMistakes": {
        "title": "Common Mistakes",
        "description": "Optional description",
        "mistakes": [
          {
            "mistake": "Mistake",
            "consequence": "Consequence",
            "solution": "Solution",
            "severity": "high",
            "icon": "⚠️"
          }
        ]
      }
    }
  },

  equipmentGuide: {
    requiredKeys: ['title', 'tools'],
    optionalKeys: ['description'],
    exactKeys: ['title', 'description', 'tools'],
    tools: {
      type: 'array',
      minItems: 1,
      itemStructure: {
        requiredKeys: ['name', 'importance'],
        optionalKeys: ['icon', 'features', 'priceRange', 'recommendedBrands']
      }
    },
    example: {
      "equipmentGuide": {
        "title": "Equipment Guide",
        "description": "Optional description",
        "tools": [
          {
            "name": "Tool",
            "importance": "Essential",
            "icon": "⚖️",
            "features": ["Feature1", "Feature2"],
            "priceRange": "$20-$50"
          }
        ]
      }
    }
  },

  scientificBackground: {
    requiredKeys: ['title'],
    optionalKeys: ['description', 'concepts'],
    exactKeys: ['title', 'description', 'concepts'],
    concepts: {
      type: 'array',
      minItems: 1,
      itemStructure: {
        requiredKeys: ['concept'],
        optionalKeys: ['explanation', 'examples', 'impact']
      }
    },
    example: {
      "scientificBackground": {
        "title": "Scientific Background",
        "description": "Optional description",
        "concepts": [
          {
            "concept": "Concept",
            "explanation": "Explanation",
            "examples": ["Example1", "Example2"],
            "impact": "Impact"
          }
        ]
      }
    }
  },

  regionalVariations: {
    requiredKeys: ['title'],
    optionalKeys: ['description', 'regions'],
    exactKeys: ['title', 'description', 'regions'],
    regions: {
      type: 'array',
      minItems: 1,
      itemStructure: {
        requiredKeys: ['region'],
        optionalKeys: ['cupSize', 'commonUnits', 'system', 'note']
      }
    },
    example: {
      "regionalVariations": {
        "title": "Regional Variations",
        "description": "Optional description",
        "regions": [
          {
            "region": "United States",
            "cupSize": "240ml",
            "commonUnits": ["cups", "tablespoons"],
            "system": "US Customary",
            "note": "Note"
          }
        ]
      }
    }
  },

  recipeExamples: {
    requiredKeys: ['title', 'examples'],
    optionalKeys: ['description'],
    exactKeys: ['title', 'description', 'examples'],
    examples: {
      type: 'array',
      minItems: 1,
      itemStructure: {
        requiredKeys: ['recipe'],
        optionalKeys: ['original', 'converted', 'serves', 'tip']
      }
    },
    example: {
      "recipeExamples": {
        "title": "Recipe Examples",
        "description": "Optional description",
        "examples": [
          {
            "recipe": "Recipe",
            "original": ["1 cup flour"],
            "converted": ["125g flour"],
            "serves": "4",
            "tip": "Tip"
          }
        ]
      }
    }
  },

  tips: {
    requiredKeys: ['title'],
    optionalKeys: ['description', 'tips', 'items'],
    exactKeys: ['title', 'description', 'tips', 'items'],
    // Must have either tips or items (or both)
    validate: (sectionData, sectionName, errors) => {
      const hasTips = sectionData.tips && Array.isArray(sectionData.tips);
      const hasItems = sectionData.items && Array.isArray(sectionData.items);

      if (!hasTips && !hasItems) {
        errors.push(`"${sectionName}" must have either "tips" or "items" array`);
      }
    },
    tips: {
      type: 'array',
      minItems: 1,
      itemStructure: { type: 'string' }
    },
    items: {
      type: 'array',
      minItems: 1,
      itemStructure: { type: 'string' }
    },
    example: {
      "tips": {
        "title": "Tips",
        "description": "Optional description",
        "tips": ["Tip 1", "Tip 2"],
        "items": ["Item 1", "Item 2"]
      }
    }
  },

  faq: {
    requiredKeys: ['title', 'items'],
    optionalKeys: ['description'],
    exactKeys: ['title', 'description', 'items'],
    items: {
      type: 'array',
      minItems: 1,
      itemStructure: {
        requiredKeys: ['question', 'answer']
      }
    },
    example: {
      "faq": {
        "title": "FAQ",
        "description": "Optional description",
        "items": [
          {
            "question": "Question?",
            "answer": "Answer."
          }
        ]
      }
    }
  },

  faqs: {
    requiredKeys: ['title', 'items'],
    optionalKeys: ['description'],
    exactKeys: ['title', 'description', 'items'],
    items: {
      type: 'array',
      minItems: 1,
      itemStructure: {
        requiredKeys: ['question', 'answer']
      }
    },
    example: {
      "faqs": {
        "title": "FAQs",
        "description": "Optional description",
        "items": [
          {
            "question": "Question?",
            "answer": "Answer."
          }
        ]
      }
    }
  },

  related: {
    requiredKeys: ['title'],
    optionalKeys: ['description', 'links', 'items'],
    exactKeys: ['title', 'description', 'links', 'items'],
    // Must have either links or items (or both)
    validate: (sectionData, sectionName, errors) => {
      const hasLinks = sectionData.links && Array.isArray(sectionData.links);
      const hasItems = sectionData.items && Array.isArray(sectionData.items);

      if (!hasLinks && !hasItems) {
        errors.push(`"${sectionName}" must have either "links" or "items" array`);
      }
    },
    links: {
      type: 'array',
      minItems: 1,
      itemStructure: { type: 'string' }
    },
    items: {
      type: 'array',
      minItems: 1,
      itemStructure: { type: 'string' }
    },
    example: {
      "related": {
        "title": "Related",
        "description": "Optional description",
        "links": ["link1", "link2"],
        "items": ["item1", "item2"]
      }
    }
  }
};

class RealisticConverterValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.failedIds = [];
    this.wordCounts = {};

    this.SPECIAL_SECTIONS = ['converter', 'faq', 'faqs'];

    // TOP-LEVEL: Based on your actual JSON, NOT theoretical requirements
    this.TOP_LEVEL_REQUIRED_KEYS = [
      'id',
      'slug',
      'title',
      'description',
      'keywords',
      'categories',
      'manualRelatedLinks',
      'featured',
      'contentSequence',
      'defaults',
      'supportedUnits',
      'faqs',
      'contentSections'
    ];

    this.TOP_LEVEL_OPTIONAL_KEYS = [
      'conversions',
      'conversionFormulas',  // Optional - can use conversions instead
      'ingredientFormulas'   // Optional
    ];

    this.ALL_TOP_LEVEL_KEYS = [...this.TOP_LEVEL_REQUIRED_KEYS, ...this.TOP_LEVEL_OPTIONAL_KEYS];
  }

  validateConverters(converters) {
    console.log(`🔍 Validating ${converters.length} converter(s) with REALISTIC rules...\n`);

    converters.forEach((converter, index) => {
      const converterId = converter.id || `converter-${index}`;
      console.log(`📄 ${index + 1}. Validating: ${converterId}`);

      const converterErrors = this.validateSingleConverter(converter);

      if (converterErrors.length === 0) {
        console.log(`   ✅ ${converterId}: Valid`);
        console.log();
      } else {
        console.log(`   ❌ ${converterId}: ${converterErrors.length} error(s)`);
        converterErrors.forEach(error => console.log(`      🔴 ${error}`));

        this.showStructureGuide(converter, converterErrors);
        console.log();
        this.failedIds.push(converterId);
      }
    });

    this.printSummary();

    return {
      isValid: this.failedIds.length === 0,
      total: converters.length,
      valid: converters.length - this.failedIds.length,
      failed: this.failedIds.length,
      failedIds: this.failedIds,
      wordCounts: this.wordCounts
    };
  }

  showStructureGuide(converter, errors) {
    const problematicSections = new Set();

    errors.forEach(error => {
      if (error.includes('Section "') && error.includes('" in contentSequence not found')) {
        const match = error.match(/Section "([^"]+)" in contentSequence/);
        if (match) problematicSections.add(match[1]);
      } else if (error.includes('Missing required field: "')) {
        const match = error.match(/Missing required field: "([^"]+)"/);
        if (match) problematicSections.add('top-level');
      } else if (error.includes('contentSections.')) {
        const match = error.match(/contentSections\.([^.]+)\./);
        if (match) problematicSections.add(match[1]);
      }
    });

    if (problematicSections.size > 0) {
      console.log(`\n   📖 STRUCTURE GUIDE for ${converter.id}:`);
      console.log(`   ${'─'.repeat(50)}`);

      if (problematicSections.has('top-level')) {
        console.log(`   TOP-LEVEL required keys: ${this.TOP_LEVEL_REQUIRED_KEYS.join(', ')}`);
        console.log(`   TOP-LEVEL optional keys: ${this.TOP_LEVEL_OPTIONAL_KEYS.join(', ')}`);
        console.log(`   ${'─'.repeat(50)}`);
      }

      problematicSections.forEach(sectionName => {
        if (sectionName === 'top-level') return;

        const structure = SECTION_STRUCTURES[sectionName];
        if (structure && structure.example) {
          console.log(`   ${sectionName.toUpperCase()} structure:`);
          console.log(`   ${JSON.stringify(structure.example, null, 2).split('\n').map(line => `     ${line}`).join('\n')}`);
          console.log(`   ${'─'.repeat(50)}`);
        }
      });

      // Special notes
      if (problematicSections.has('quickReference')) {
        console.log(`   ℹ️  QUICK REFERENCE: Items need "ingredient" + at least one value (cup, grams, celsius, etc.)`);
        console.log(`   ℹ️  Temperature converters: celsius, fahrenheit, gasMark`);
        console.log(`   ℹ️  Volume converters: cup, grams, tablespoon, teaspoon`);
        console.log(`   ${'─'.repeat(50)}`);
      }

      if (problematicSections.has('comparisonTable')) {
        console.log(`   ℹ️  COMPARISON TABLE: Need at least 8 rows, columns and rows must both exist`);
        console.log(`   ℹ️  Row keys don't need to exactly match column headers`);
        console.log(`   ${'─'.repeat(50)}`);
      }

      if (problematicSections.has('tips') || problematicSections.has('related')) {
        console.log(`   ℹ️  TIPS/RELATED: Need either "tips"/"links" or "items" (or both)`);
        console.log(`   ${'─'.repeat(50)}`);
      }
    }
  }

  validateSingleConverter(converter) {
    const errors = [];

    // 1. Check REQUIRED top-level keys exist
    this.TOP_LEVEL_REQUIRED_KEYS.forEach(key => {
      if (converter[key] === undefined) {
        errors.push(`Missing required field: "${key}"`);
      }
    });

    // 2. Check for additional top-level keys (warn only)
    const actualKeys = Object.keys(converter);
    actualKeys.forEach(key => {
      if (!this.ALL_TOP_LEVEL_KEYS.includes(key)) {
        this.warnings.push(`${converter.id}: Additional key "${key}" found (allowed but not in template)`);
      }
    });

    // 3. Validate conversion data - EITHER conversions OR conversionFormulas
    const hasConversions = converter.conversions && typeof converter.conversions === 'object';
    const hasConversionFormulas = converter.conversionFormulas && Array.isArray(converter.conversionFormulas);

    if (!hasConversions && !hasConversionFormulas) {
      errors.push('Must have either "conversions" object or "conversionFormulas" array');
    }

    if (hasConversions && hasConversionFormulas) {
      this.warnings.push(`${converter.id}: Has both "conversions" and "conversionFormulas" - using "conversions"`);
    }

    // 4. Validate arrays exist and are arrays
    if (converter.keywords && !Array.isArray(converter.keywords)) {
      errors.push('"keywords" must be an array');
    }

    if (converter.categories && !Array.isArray(converter.categories)) {
      errors.push('"categories" must be an array');
    }

    if (converter.manualRelatedLinks && !Array.isArray(converter.manualRelatedLinks)) {
      errors.push('"manualRelatedLinks" must be an array');
    }

    if (converter.supportedUnits && !Array.isArray(converter.supportedUnits)) {
      errors.push('"supportedUnits" must be an array');
    }

    if (converter.conversionFormulas && !Array.isArray(converter.conversionFormulas)) {
      errors.push('"conversionFormulas" must be an array');
    }

    if (converter.ingredientFormulas && !Array.isArray(converter.ingredientFormulas)) {
      errors.push('"ingredientFormulas" must be an array');
    }

    if (converter.faqs && !Array.isArray(converter.faqs)) {
      errors.push('"faqs" must be an array');
    }

    // 5. Check featured is boolean
    if (converter.featured !== undefined && typeof converter.featured !== 'boolean') {
      errors.push('"featured" must be a boolean');
    }

    // 6. ContentSequence checks
    if (!converter.contentSequence || !Array.isArray(converter.contentSequence)) {
      errors.push('"contentSequence" must be an array');
    } else if (converter.contentSequence.length === 0) {
      errors.push('"contentSequence" cannot be empty');
    } else if (!converter.contentSequence.includes('hero')) {
      errors.push('"contentSequence" must include "hero" section');
    }

    // 7. ContentSections validation
    if (!converter.contentSections || typeof converter.contentSections !== 'object') {
      errors.push('"contentSections" must be an object');
    } else {
      const contentSections = converter.contentSections;

      // Check all NON-SPECIAL sections in contentSequence exist
      if (converter.contentSequence) {
        converter.contentSequence.forEach(sectionName => {
          if (this.SPECIAL_SECTIONS.includes(sectionName)) return;
          if (!contentSections[sectionName]) {
            errors.push(`Section "${sectionName}" in contentSequence not found in contentSections`);
          }
        });
      }

      // Validate each section
      Object.entries(contentSections).forEach(([sectionName, sectionData]) => {
        const sectionErrors = this.validateContentSection(sectionName, sectionData);
        sectionErrors.forEach(error => errors.push(error));
      });
    }

    // 8. Defaults validation
    if (!converter.defaults) {
      errors.push('Missing required field: "defaults"');
    } else if (typeof converter.defaults !== 'object') {
      errors.push('"defaults" must be an object');
    } else {
      const defaultsRequired = ['value', 'from', 'to'];
      defaultsRequired.forEach(key => {
        if (converter.defaults[key] === undefined) {
          errors.push(`"defaults.${key}" is required`);
        }
      });
    }

    // 9. SupportedUnits validation
    if (!converter.supportedUnits || !Array.isArray(converter.supportedUnits)) {
      errors.push('"supportedUnits" must be an array');
    } else if (converter.supportedUnits.length === 0) {
      errors.push('"supportedUnits" cannot be empty');
    } else if (hasConversions) {
      // Validate conversion matrix only if using conversions object
      this.validateConversionMatrix(converter, errors);
    }

    // 10. Validate top-level faqs array
    if (converter.faqs) {
      this.validateTopLevelFAQs(converter.faqs, errors);
    }

    // 11. Check word count (1000 words minimum)
    const wordCount = this.calculateWordCount(converter);
    this.wordCounts[converter.id] = wordCount;

    if (wordCount < 1000) {
      errors.push(`Low content volume: Only ${wordCount} words (minimum 1000 words required)`);
    }

    return errors;
  }

  calculateWordCount(converter) {
    let totalWords = 0;

    const countWords = (str) => {
      if (typeof str !== 'string') return 0;
      return str.trim().split(/\s+/).filter(word => word.length > 0).length;
    };

    const countWordsInObject = (obj) => {
      if (!obj || typeof obj !== 'object') return;

      if (Array.isArray(obj)) {
        obj.forEach(item => {
          if (typeof item === 'string') {
            totalWords += countWords(item);
          } else if (typeof item === 'object' && item !== null) {
            countWordsInObject(item);
          }
        });
      } else {
        Object.values(obj).forEach(value => {
          if (typeof value === 'string') {
            totalWords += countWords(value);
          } else if (typeof value === 'object' && value !== null) {
            countWordsInObject(value);
          }
        });
      }
    };

    // Count words in top-level fields
    if (converter.title) totalWords += countWords(converter.title);
    if (converter.description) totalWords += countWords(converter.description);

    // Count words in contentSections
    if (converter.contentSections) {
      countWordsInObject(converter.contentSections);
    }

    // Count words in FAQs
    if (converter.faqs && Array.isArray(converter.faqs)) {
      converter.faqs.forEach(faq => {
        if (faq.question) totalWords += countWords(faq.question);
        if (faq.answer) totalWords += countWords(faq.answer);
      });
    }

    return totalWords;
  }

  validateConversionMatrix(converter, errors) {
    const supportedUnits = converter.supportedUnits || [];
    const conversions = converter.conversions || {};

    if (supportedUnits.length === 0) return;

    // Check all units have conversion entries
    supportedUnits.forEach(unit => {
      if (!conversions[unit]) {
        errors.push(`Missing conversion entry for unit: "${unit}"`);
      }
    });

    // Check each conversion matrix
    supportedUnits.forEach(fromUnit => {
      supportedUnits.forEach(toUnit => {
        if (conversions[fromUnit] && conversions[fromUnit][toUnit] === undefined) {
          errors.push(`Missing conversion: "${fromUnit}" → "${toUnit}"`);
        }
      });
    });

    // Validate self-conversions are "x"
    supportedUnits.forEach(unit => {
      if (conversions[unit] && conversions[unit][unit] !== 1) {
        errors.push(`Self-conversion for "${unit}" must be 1 (got: ${conversions[unit][unit]})`);
      }
    });
  }

  validateTopLevelFAQs(faqsArray, errors) {
    if (!Array.isArray(faqsArray)) {
      errors.push('"faqs" must be an array');
      return;
    }

    if (faqsArray.length === 0) {
      errors.push('"faqs" array cannot be empty');
      return;
    }

    faqsArray.forEach((faq, index) => {
      if (!faq.question) {
        errors.push(`"faqs"[${index}] missing required field: "question"`);
      }
      if (!faq.answer) {
        errors.push(`"faqs"[${index}] missing required field: "answer"`);
      }
    });
  }

  validateContentSection(sectionName, sectionData) {
    const errors = [];

    if (sectionName === 'converter') return errors;

    const structure = SECTION_STRUCTURES[sectionName];

    if (!structure) {
      errors.push(`Unknown section: "${sectionName}" in contentSections`);
      return errors;
    }

    if (typeof sectionData !== 'object' || sectionData === null) {
      errors.push(`Section "${sectionName}" must be an object`);
      return errors;
    }

    // Check required keys
    if (structure.requiredKeys) {
      structure.requiredKeys.forEach(key => {
        if (sectionData[key] === undefined) {
          errors.push(`contentSections.${sectionName} missing required key: "${key}"`);
        }
      });
    }

    // Call section-specific validation if it exists
    if (structure.validate) {
      try {
        structure.validate(sectionData, `contentSections.${sectionName}`, errors);
      } catch (e) {
        errors.push(`Error validating ${sectionName}: ${e.message}`);
      }
    }

    // Validate nested structures
    this.validateNestedStructures(sectionName, sectionData, structure, errors);

    return errors;
  }

  validateNestedStructures(sectionName, sectionData, structure, errors) {
    // Validate items arrays
    if (structure.items && sectionData.items !== undefined) {
      if (sectionName === 'quickReference') {
        this.validateQuickReferenceItems(`${sectionName}.items`, sectionData.items, structure.items, errors);
      } else if (sectionName === 'tips' || sectionName === 'related') {
        this.validateFlexibleItemsArray(`${sectionName}.items`, sectionData.items, structure.items, errors);
      } else {
        this.validateGenericArray(`${sectionName}.items`, sectionData.items, structure.items, errors);
      }
    }

    // Validate other arrays
    if (structure.tips && sectionData.tips !== undefined) {
      this.validateStringArray(`${sectionName}.tips`, sectionData.tips, structure.tips, errors);
    }

    if (structure.links && sectionData.links !== undefined) {
      this.validateStringArray(`${sectionName}.links`, sectionData.links, structure.links, errors);
    }

    if (structure.mistakes && sectionData.mistakes !== undefined) {
      this.validateMistakesArray(`${sectionName}.mistakes`, sectionData.mistakes, structure.mistakes, errors);
    }

    if (structure.tools && sectionData.tools !== undefined) {
      this.validateGenericArray(`${sectionName}.tools`, sectionData.tools, structure.tools, errors);
    }

    if (structure.concepts && sectionData.concepts !== undefined) {
      this.validateGenericArray(`${sectionName}.concepts`, sectionData.concepts, structure.concepts, errors);
    }

    if (structure.regions && sectionData.regions !== undefined) {
      this.validateGenericArray(`${sectionName}.regions`, sectionData.regions, structure.regions, errors);
    }

    if (structure.examples && sectionData.examples !== undefined) {
      this.validateGenericArray(`${sectionName}.examples`, sectionData.examples, structure.examples, errors);
    }

    if (structure.steps && sectionData.steps !== undefined) {
      this.validateGenericArray(`${sectionName}.steps`, sectionData.steps, structure.steps, errors);
    }

    // Validate columns and rows
    if (structure.columns && sectionData.columns !== undefined) {
      if (!Array.isArray(sectionData.columns)) {
        errors.push(`"${sectionName}.columns" must be an array`);
      } else if (structure.columns.minItems && sectionData.columns.length < structure.columns.minItems) {
        errors.push(`"${sectionName}.columns" must have at least ${structure.columns.minItems} items (has ${sectionData.columns.length})`);
      }
    }

    if (structure.rows && sectionData.rows !== undefined) {
      if (!Array.isArray(sectionData.rows)) {
        errors.push(`"${sectionName}.rows" must be an array`);
      } else if (structure.rows.minItems && sectionData.rows.length < structure.rows.minItems) {
        errors.push(`"${sectionName}.rows" must have at least ${structure.rows.minItems} items (has ${sectionData.rows.length})`);
      }
    }
  }

  validateQuickReferenceItems(path, array, structure, errors) {
    if (!Array.isArray(array)) {
      errors.push(`"${path}" must be an array`);
      return;
    }

    if (structure.minItems && array.length < structure.minItems) {
      errors.push(`"${path}" must have at least ${structure.minItems} items (has ${array.length})`);
    }

    array.forEach((item, index) => {
      if (structure.itemStructure && structure.itemStructure.validate) {
        structure.itemStructure.validate(item, index, path, errors);
      } else if (typeof item !== 'object' || item === null) {
        errors.push(`"${path}[${index}]" must be an object`);
      } else {
        // Basic validation
        if (item.ingredient === undefined) {
          errors.push(`"${path}[${index}]" missing required key: "ingredient"`);
        }
      }
    });
  }

  validateFlexibleItemsArray(path, array, structure, errors) {
    if (!Array.isArray(array)) {
      errors.push(`"${path}" must be an array`);
      return;
    }

    if (structure.minItems && array.length < structure.minItems) {
      errors.push(`"${path}" must have at least ${structure.minItems} items (has ${array.length})`);
    }

    // For tips/related items, can be strings or objects
    array.forEach((item, index) => {
      if (typeof item !== 'string' && (typeof item !== 'object' || item === null)) {
        errors.push(`"${path}[${index}]" must be a string or object`);
      }
    });
  }

  validateGenericArray(path, array, structure, errors) {
    if (!Array.isArray(array)) {
      errors.push(`"${path}" must be an array`);
      return;
    }

    if (structure.minItems && array.length < structure.minItems) {
      errors.push(`"${path}" must have at least ${structure.minItems} items (has ${array.length})`);
    }

    if (structure.itemStructure) {
      array.forEach((item, index) => {
        if (structure.itemStructure.type === 'object') {
          if (typeof item !== 'object' || item === null) {
            errors.push(`"${path}[${index}]" must be an object`);
          } else if (structure.itemStructure.requiredKeys) {
            structure.itemStructure.requiredKeys.forEach(key => {
              if (item[key] === undefined) {
                errors.push(`"${path}[${index}]" missing required key: "${key}"`);
              }
            });
          }
        } else if (structure.itemStructure.type === 'string') {
          if (typeof item !== 'string') {
            errors.push(`"${path}[${index}]" must be a string (got ${typeof item})`);
          }
        }
      });
    }
  }

  validateStringArray(path, array, structure, errors) {
    if (!Array.isArray(array)) {
      errors.push(`"${path}" must be an array`);
      return;
    }

    if (structure.minItems && array.length < structure.minItems) {
      errors.push(`"${path}" must have at least ${structure.minItems} items (has ${array.length})`);
    }

    array.forEach((item, index) => {
      if (typeof item !== 'string') {
        errors.push(`"${path}[${index}]" must be a string (got ${typeof item})`);
      }
    });
  }

  validateMistakesArray(path, array, structure, errors) {
    this.validateGenericArray(path, array, structure, errors);
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('🔬 REALISTIC VALIDATION SUMMARY');
    console.log('='.repeat(60));

    if (this.failedIds.length === 0) {
      console.log('🎉 All converters passed validation!');
    } else {
      console.log(`❌ ${this.failedIds.length} converter(s) failed validation:`);
      this.failedIds.forEach(id => console.log(`   - ${id}`));
    }

    console.log('\n📊 WORD COUNT SUMMARY:');
    console.log('-' .repeat(40));
    Object.entries(this.wordCounts).forEach(([id, count]) => {
      const status = count >= 1000 ? '✅' : '❌';
      console.log(`   ${status} ${id}: ${count} words ${count < 1000 ? `(NEEDS ${1000 - count} MORE)` : ''}`);
    });

    if (this.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      this.warnings.forEach(warning => console.log(`   • ${warning}`));
    }

    console.log('='.repeat(60));

    if (this.failedIds.length > 0) {
      console.log('\n🚨 Validation failed! Fix errors before deployment.');
      process.exit(1);
    }
  }
}

function validateConvertersFileStrict(filePath) {
  try {
    console.log(`📂 Reading file: ${filePath}`);
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);

    if (!data.converters || !Array.isArray(data.converters)) {
      console.error('❌ Invalid file structure: "converters" array not found');
      process.exit(1);
    }

    console.log(`📊 Found ${data.converters.length} converter(s) in file\n`);

    const validator = new RealisticConverterValidator();
    return validator.validateConverters(data.converters);

  } catch (error) {
    console.error(`❌ Error reading or parsing file: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log('Usage: node strict-validate-converters.js <path-to-converters.json>');
    console.log('Example: node strict-validate-converters.js ./data/converters.json');
    console.log('\nREALISTIC VALIDATION RULES:');
    console.log('  • Required top-level keys: id, slug, title, description, keywords, categories');
    console.log('  • manualRelatedLinks, featured, contentSequence, defaults, supportedUnits');
    console.log('  • conversions OR conversionFormulas (not both required)');
    console.log('  • faqs, contentSections');
    console.log('  • Optional: conversionFormulas, ingredientFormulas');
    console.log('  • contentSequence must include "hero"');
    console.log('  • quickReference: items need "ingredient" + at least one value');
    console.log('  • comparisonTable: need at least 8 rows if present');
    console.log('  • tips/related: need either tips/links or items (or both)');
    console.log('  • Minimum 1000 words of content');
    console.log('\nExits with code 1 if validation fails.');
    process.exit(1);
  }

  const filePath = path.resolve(args[0]);

  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  validateConvertersFileStrict(filePath);
}

module.exports = { RealisticConverterValidator, validateConvertersFileStrict };