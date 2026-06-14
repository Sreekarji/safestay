// ============================================================
// server/utils/preCachedResponses.js
// Pre-cached AI responses for DEMO_MODE
// Allows the platform to function without live AI API keys
// ============================================================

function shouldUseDemoMode() {
  return process.env.DEMO_MODE === 'true';
}

const cachedResponses = {
  mistral: {
    'Food Safety': {
      source: 'mistral',
      isRelevant: true,
      issueDetected: 'Evidence of food safety concerns including unsealed food containers and potential cross-contamination',
      severity: 'high',
      confidence: 0.87,
      redFlags: ['Unsealed food containers visible', 'Improper food storage observed', 'Potential cross-contamination risk'],
      description: 'The image shows evidence of food safety violations including improperly stored food items and lack of proper containment measures.'
    },
    'Water Quality': {
      source: 'mistral',
      isRelevant: true,
      issueDetected: 'Discolored water and potential pipe corrosion visible',
      severity: 'high',
      confidence: 0.82,
      redFlags: ['Water discoloration visible', 'Possible pipe corrosion', 'Staining around fixtures'],
      description: 'Visual analysis reveals water quality concerns including discoloration and visible staining that may indicate contamination or pipe deterioration.'
    },
    'Hygiene': {
      source: 'mistral',
      isRelevant: true,
      issueDetected: 'Evidence of poor hygiene conditions including mold and unsanitary surfaces',
      severity: 'medium',
      confidence: 0.79,
      redFlags: ['Mold growth visible', 'Accumulated dirt and debris', 'Unsanitary surface conditions'],
      description: 'The image displays hygiene concerns including visible mold growth and accumulated debris indicating inadequate cleaning and maintenance.'
    },
    'Security': {
      source: 'mistral',
      isRelevant: true,
      issueDetected: 'Security vulnerabilities including damaged locks and broken access points',
      severity: 'high',
      confidence: 0.84,
      redFlags: ['Damaged or broken lock mechanism', 'Compromised entry point', 'Missing security features'],
      description: 'Analysis shows security concerns with visible damage to locking mechanisms and potential unauthorized access points.'
    },
    'Infrastructure': {
      source: 'mistral',
      isRelevant: true,
      issueDetected: 'Structural damage including cracks and water damage to walls and ceilings',
      severity: 'medium',
      confidence: 0.81,
      redFlags: ['Wall cracks visible', 'Water damage stains', 'Deteriorating structural elements'],
      description: 'The image reveals infrastructure issues including structural cracks, water damage, and general deterioration of building components.'
    }
  },

  groq: {
    'Food Safety': {
      source: 'groq',
      isRelevant: true,
      issueDetected: 'Food safety complaint validated - common accommodation issue',
      severity: 'high',
      confidence: 0.83,
      redFlags: ['Food safety is a critical concern in student accommodations', 'Complaint category is highly credible'],
      description: 'Context analysis confirms food safety is a prevalent and serious concern in student accommodations. The complaint category carries high credibility.'
    },
    'Water Quality': {
      source: 'groq',
      isRelevant: true,
      issueDetected: 'Water quality complaint validated - critical health concern',
      severity: 'high',
      confidence: 0.85,
      redFlags: ['Water quality issues are health hazards', 'Common in aging accommodation infrastructure'],
      description: 'Water quality is a critical health and safety concern in student accommodations. Issues with water quality are well-documented in aging infrastructure.'
    },
    'Hygiene': {
      source: 'groq',
      isRelevant: true,
      issueDetected: 'Hygiene complaint validated - legitimate accommodation concern',
      severity: 'medium',
      confidence: 0.78,
      redFlags: ['Hygiene issues affect resident wellbeing', 'Visual evidence typically available for hygiene complaints'],
      description: 'Hygiene concerns are valid accommodation safety issues that commonly affect student wellbeing. Visual evidence is typically available for such complaints.'
    },
    'Security': {
      source: 'groq',
      isRelevant: true,
      issueDetected: 'Security complaint validated - safety is paramount',
      severity: 'high',
      confidence: 0.86,
      redFlags: ['Security is a fundamental accommodation requirement', 'Security complaints require urgent attention'],
      description: 'Security concerns are among the most critical accommodation issues. Student safety is paramount and security complaints warrant immediate attention.'
    },
    'Infrastructure': {
      source: 'groq',
      isRelevant: true,
      issueDetected: 'Infrastructure complaint validated - common in student housing',
      severity: 'medium',
      confidence: 0.80,
      redFlags: ['Infrastructure issues are prevalent in older buildings', 'Visual evidence commonly supports infrastructure complaints'],
      description: 'Infrastructure concerns are common in student accommodations, particularly in older buildings. Visual evidence typically supports such claims effectively.'
    }
  },

  gemini: {
    'Food Safety': {
      source: 'gemini',
      isRelevant: true,
      issueDetected: 'Visual indicators of food safety violations detected',
      severity: 'high',
      confidence: 0.85,
      redFlags: ['Unhygienic food handling conditions apparent', 'Storage conditions below acceptable standards'],
      description: 'Gemini vision analysis detects visual indicators consistent with food safety violations. Storage and handling conditions appear to fall below acceptable standards.'
    },
    'Water Quality': {
      source: 'gemini',
      isRelevant: true,
      issueDetected: 'Visual evidence suggests water quality issues',
      severity: 'high',
      confidence: 0.80,
      redFlags: ['Discoloration patterns consistent with contamination', 'Fixture condition suggests maintenance issues'],
      description: 'Image analysis reveals visual patterns consistent with water quality concerns. Fixture condition and discoloration suggest underlying maintenance issues.'
    },
    'Hygiene': {
      source: 'gemini',
      isRelevant: true,
      issueDetected: 'Hygiene concerns visible in image analysis',
      severity: 'medium',
      confidence: 0.77,
      redFlags: ['Unsanitary conditions detected', 'Maintenance standards appear substandard'],
      description: 'Gemini analysis identifies visible hygiene concerns in the image. Overall maintenance and cleanliness standards appear to be below acceptable levels.'
    },
    'Security': {
      source: 'gemini',
      isRelevant: true,
      issueDetected: 'Security vulnerabilities identified in image',
      severity: 'high',
      confidence: 0.83,
      redFlags: ['Access control weaknesses visible', 'Physical security measures appear compromised'],
      description: 'Vision analysis reveals potential security vulnerabilities including compromised access control measures and physical security deficiencies.'
    },
    'Infrastructure': {
      source: 'gemini',
      isRelevant: true,
      issueDetected: 'Infrastructure deterioration patterns detected',
      severity: 'medium',
      confidence: 0.79,
      redFlags: ['Structural wear patterns visible', 'Maintenance backlog indicators present'],
      description: 'Gemini image analysis detects patterns consistent with infrastructure deterioration. Visual indicators suggest accumulated maintenance backlog.'
    }
  }
};

function getCachedResponse(source, issueType) {
  const sourceResponses = cachedResponses[source];
  if (!sourceResponses) {
    return {
      source,
      isRelevant: null,
      issueDetected: 'Unknown source',
      severity: 'none',
      confidence: 0,
      redFlags: [],
      description: `No cached response available for source: ${source}`
    };
  }

  const response = sourceResponses[issueType];
  if (!response) {
    return {
      source,
      isRelevant: null,
      issueDetected: 'Unknown issue type',
      severity: 'none',
      confidence: 0,
      redFlags: [],
      description: `No cached response available for issue type: ${issueType}`
    };
  }

  return { ...response };
}

function getCachedVerdict(issueType) {
  return {
    finalVerdict: 'VERIFIED',
    overallSeverity: 'high',
    confidenceScore: 0.85,
    summary: `Three AI systems analyzed the complaint about "${issueType}" and reached consensus. The image evidence supports the reported issue with high confidence.`,
    recommendAdminReview: false
  };
}

module.exports = {
  shouldUseDemoMode,
  getCachedResponse,
  getCachedVerdict
};
