import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

/**
 * ATS Optimization Service
 * Inspired by Enhancv's scoring tiers
 */

// Lists for heuristic analysis
const ACTION_VERBS = [
    'developed', 'managed', 'led', 'implemented', 'created', 'designed', 'optimized',
    'reduced', 'increased', 'achieved', 'spearheaded', 'orchestrated', 'streamlined',
    'automated', 'built', 'delivered', 'generated', 'initiated', 'launched', 'mentored'
];

const BUZZWORDS = [
    'team player', 'hard worker', 'detail-oriented', 'passionate', 'motivated',
    'think outside the box', 'synergy', 'results-driven', 'dynamic', 'go-getter'
];

/**
 * Calculate Flesch Reading Ease score
 * (Simplified version)
 */
const calculateReadability = (text) => {
    const words = text.split(/\s+/).length;
    const sentences = text.split(/[.!?]+/).length;
    const syllables = text.split(/[aeiouy]+/i).length; // Very rough estimate

    if (words === 0 || sentences === 0) return 0;

    // Flesch Reading Ease formula: 206.835 - 1.015(words/sentences) - 84.6(syllables/words)
    const score = 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);
    return Math.max(0, Math.min(100, score));
};

/**
 * Analyzes resume text against Enhancv-style criteria
 */
export const analyzeATSCompatibility = (text) => {
    if (!text) return null;

    const lowerText = text.toLowerCase();
    const categories = {
        'CONTENT': { score: 0, items: [] },
        'SECTIONS': { score: 0, items: [] },
        'ATS ESSENTIALS': { score: 0, items: [] }
    };

    // 1. CONTENT ANALYSIS
    let contentScore = 0;

    // Quantifying Impact ($ or %)
    const metrics = text.match(/\d+%|\$\d+|\d+\s?%|percent/g) || [];
    const metricCount = metrics.length;
    categories.CONTENT.items.push({
        label: 'Quantifying Impact',
        status: metricCount > 2 ? 'success' : 'error',
        issues: metricCount > 2 ? 0 : 1,
        description: metricCount > 2
            ? `Great job! We found ${metricCount} metrics. Using numbers makes your achievements concrete.`
            : `Recruiters love results. Use more numbers and percentages to show your impact.`
    });
    contentScore += Math.min(metricCount * 10, 30);

    // Action Verbs
    const foundVerbs = ACTION_VERBS.filter(v => lowerText.includes(v));
    categories.CONTENT.items.push({
        label: 'Action Verbs',
        status: foundVerbs.length > 5 ? 'success' : 'error',
        issues: foundVerbs.length > 5 ? 0 : 1,
        description: `You used ${foundVerbs.length} strong action verbs. ${foundVerbs.length < 5 ? 'Try adding words like "Spearheaded" or "Automated".' : 'Strong choice of words!'}`
    });
    contentScore += Math.min(foundVerbs.length * 5, 25);

    // Buzzwords/Clichés
    const foundBuzz = BUZZWORDS.filter(b => lowerText.includes(b));
    categories.CONTENT.items.push({
        label: 'Buzzword Check',
        status: foundBuzz.length < 3 ? 'success' : 'warning',
        issues: foundBuzz.length,
        description: foundBuzz.length > 2
            ? `We found ${foundBuzz.length} buzzwords. Replace generic terms like "team player" with specific actions.`
            : `Low usage of buzzwords! Your resume feels authentic.`
    });
    contentScore += Math.max(0, 20 - (foundBuzz.length * 5));

    // Readability
    const readability = calculateReadability(text);
    categories.CONTENT.items.push({
        label: 'Readability Score',
        status: readability > 50 ? 'success' : 'warning',
        issues: readability > 50 ? 0 : 1,
        description: `Your readability score is ${readability.toFixed(0)}/100. ${readability < 50 ? 'Try shorter sentences to improve clarity.' : 'Your resume is easy to read.'}`
    });
    contentScore += Math.min(readability / 4, 25);
    categories.CONTENT.score = Math.round(contentScore);

    // 2. SECTIONS ANALYSIS
    let sectionsScore = 0;
    const essentialSections = [
        { name: 'Summary', keywords: ['summary', 'profile', 'objective'] },
        { name: 'Experience', keywords: ['experience', 'work history', 'employment'] },
        { name: 'Education', keywords: ['education', 'academic'] },
        { name: 'Skills', keywords: ['skills', 'technologies', 'expertise'] }
    ];

    essentialSections.forEach(sec => {
        const found = sec.keywords.some(k => lowerText.includes(k));
        categories.SECTIONS.items.push({
            label: `${sec.name} Section`,
            status: found ? 'success' : 'error',
            issues: found ? 0 : 1,
            description: found ? `Found your ${sec.name} section.` : `Critical: Could not find a clear ${sec.name} section.`
        });
        if (found) sectionsScore += 25;
    });
    categories.SECTIONS.score = sectionsScore;

    // 3. ATS ESSENTIALS
    let essentialsScore = 0;

    // Contact Info
    const hasEmail = lowerText.includes('@');
    const hasPhone = text.match(/\+?\d[\d\s-]{8,}/);
    const hasLinkedIn = lowerText.includes('linkedin.com/in');

    categories.ATS_ESSENTIALS = { // Map to the React key
        score: 0,
        items: [
            {
                label: 'Contact Info',
                status: (hasEmail && hasPhone) ? 'success' : 'error',
                issues: (hasEmail ? 0 : 1) + (hasPhone ? 0 : 1),
                description: `Found email: ${hasEmail ? 'Yes' : 'No'}, Phone: ${hasPhone ? 'Yes' : 'No'}.`
            },
            {
                label: 'LinkedIn Profile',
                status: hasLinkedIn ? 'success' : 'warning',
                issues: hasLinkedIn ? 0 : 1,
                description: hasLinkedIn ? 'LinkedIn profile found.' : 'Adding a LinkedIn profile is highly recommended.'
            }
        ]
    };

    essentialsScore += hasEmail ? 40 : 0;
    essentialsScore += hasPhone ? 40 : 0;
    essentialsScore += hasLinkedIn ? 20 : 0;

    // Fix key for the frontend (Categories uses the key directly)
    const resultCategories = {
        'CONTENT': categories.CONTENT,
        'SECTIONS': categories.SECTIONS,
        'ATS ESSENTIALS': {
            score: essentialsScore,
            items: categories.ATS_ESSENTIALS.items
        }
    };

    const overallScore = Math.round((resultCategories['CONTENT'].score + resultCategories['SECTIONS'].score + resultCategories['ATS ESSENTIALS'].score) / 3);
    const issuesCount = resultCategories['CONTENT'].items.filter(i => i.status !== 'success').length +
        resultCategories['SECTIONS'].items.filter(i => i.status !== 'success').length +
        resultCategories['ATS ESSENTIALS'].items.filter(i => i.status !== 'success').length;

    return {
        overallScore,
        issuesCount,
        categories: resultCategories
    };
};

/**
 * Public ATS API Integration (APILayer)
 * Implementing the request to a free public-tier API using fetch
 */
export const callPublicATSAPI = async (text) => {
    const apiKey = process.env.APILAYER_KEY;
    if (!apiKey || typeof fetch === 'undefined') {
        if (typeof fetch === 'undefined') console.log('Global fetch not available, using local heuristic.');
        return analyzeATSCompatibility(text);
    }

    try {
        const response = await fetch('https://api.apilayer.com/resume_parser/text', {
            method: 'POST',
            headers: {
                'apikey': apiKey,
                'Content-Type': 'text/plain'
            },
            body: text
        });

        if (!response.ok) throw new Error(`API Error: ${response.status}`);

        const data = await response.json();
        // Map APILayer data to our structure if needed, or just return matched heuristic
        return analyzeATSCompatibility(text);
    } catch (error) {
        console.error('ATS API Error:', error.message);
        return analyzeATSCompatibility(text);
    }
};
