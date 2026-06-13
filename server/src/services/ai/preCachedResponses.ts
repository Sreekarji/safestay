export const PRE_CACHED_AI_RESPONSES = {
  // Fire safety reports
  fire_safety: {
    broken_extinguisher: {
      mistral: {
        verdict: 'accept',
        confidence: 0.95,
        reasoning: 'Image clearly shows expired fire extinguisher with visible damage and pressure gauge in red zone.'
      },
      groq: {
        verdict: 'accept',
        confidence: 0.88,
        reasoning: 'Context matches typical fire safety violation. Severity level (8/10) is appropriate for non-functional safety equipment.'
      },
      gemini: {
        verdict: 'accept',
        confidence: 0.93,
        reasoning: 'Image and description are consistent. Clear evidence of safety hazard requiring immediate attention.'
      },
      consensus: 'accept',
      overallConfidence: 0.92
    },
    blocked_exit: {
      mistral: {
        verdict: 'accept',
        confidence: 0.92,
        reasoning: 'Image shows emergency exit blocked by furniture and storage items.'
      },
      groq: {
        verdict: 'accept',
        confidence: 0.90,
        reasoning: 'Blocked emergency exits are critical safety violations. Report is consistent with visual evidence.'
      },
      gemini: {
        verdict: 'accept',
        confidence: 0.91,
        reasoning: 'Clear visual evidence of obstructed emergency egress path.'
      },
      consensus: 'accept',
      overallConfidence: 0.91
    }
  },
  
  // Water quality reports
  water_quality: {
    contaminated_water: {
      mistral: {
        verdict: 'accept',
        confidence: 0.88,
        reasoning: 'Image shows discolored water sample with visible particles and sediment.'
      },
      groq: {
        verdict: 'accept',
        confidence: 0.85,
        reasoning: 'Water contamination report consistent with visual evidence. Severity (7/10) appropriate for health hazard.'
      },
      gemini: {
        verdict: 'accept',
        confidence: 0.87,
        reasoning: 'Visual evidence supports water quality concern. Consistent with reported issue.'
      },
      consensus: 'accept',
      overallConfidence: 0.87
    }
  },
  
  // Structural reports
  structural: {
    wall_crack: {
      mistral: {
        verdict: 'accept',
        confidence: 0.85,
        reasoning: 'Image shows significant structural crack in wall, approximately 2-3cm wide.'
      },
      groq: {
        verdict: 'accept',
        confidence: 0.82,
        reasoning: 'Structural damage report is plausible. Crack size suggests potential foundation issue.'
      },
      gemini: {
        verdict: 'accept',
        confidence: 0.84,
        reasoning: 'Visual evidence of structural damage consistent with report description.'
      },
      consensus: 'accept',
      overallConfidence: 0.84
    }
  },
  
  // Rejected reports (fake/invalid)
  rejected: {
    fake_water_leak: {
      mistral: {
        verdict: 'reject',
        confidence: 0.78,
        reasoning: 'Image appears to be stock photo. Water damage pattern inconsistent with natural leak.'
      },
      groq: {
        verdict: 'reject',
        confidence: 0.82,
        reasoning: 'Report contains generic description. Image metadata suggests external source.'
      },
      gemini: {
        verdict: 'reject',
        confidence: 0.80,
        reasoning: 'Visual evidence does not match described scenario. Likely fabricated report.'
      },
      consensus: 'reject',
      overallConfidence: 0.80
    },
    exaggerated_electrical: {
      mistral: {
        verdict: 'reject',
        confidence: 0.75,
        reasoning: 'Image shows normal electrical outlet. No visible damage or hazard.'
      },
      groq: {
        verdict: 'reject',
        confidence: 0.85,
        reasoning: 'Severity rating (10/10) excessive for described issue. Report appears exaggerated.'
      },
      gemini: {
        verdict: 'reject',
        confidence: 0.78,
        reasoning: 'Visual evidence contradicts severity of reported issue.'
      },
      consensus: 'reject',
      overallConfidence: 0.79
    }
  },
  
  // Pending reports (awaiting verification)
  pending: {
    minor_hygiene: {
      mistral: {
        verdict: 'uncertain',
        confidence: 0.60,
        reasoning: 'Image shows some cleanliness issues but severity unclear from single image.'
      },
      groq: {
        verdict: 'uncertain',
        confidence: 0.55,
        reasoning: 'Hygiene concerns are subjective. Additional verification needed.'
      },
      gemini: {
        verdict: 'uncertain',
        confidence: 0.58,
        reasoning: 'Limited evidence to make definitive determination.'
      },
      consensus: 'pending',
      overallConfidence: 0.58
    }
  }
};

// Pre-generated Sarvam AI translations for demo
export const PRE_CACHED_SARVAM_TRANSLATIONS = {
  'en': {
    'ssi_explanation': 'The SafeStay Safety Index (SSI) is a dynamic score from 0 to 100 that measures the overall safety of a student accommodation based on verified reports.',
    'report_summary': 'This report has been verified by our AI system with high confidence.',
    'safety_briefing': 'Based on current reports, this accommodation has several safety concerns that need attention.'
  },
  'te': {
    'ssi_explanation': 'SafeStay భద్రతా సూచిక (SSI) అనేది ధృవీకరించబడిన నివేదికల ఆధారంగా విద్యార్థి వసతి యొక్క మొత్తం భద్రతను కొలిచే 0 నుండి 100 వరకు డైనమిక్ స్కోర్.',
    'report_summary': 'ఈ నివేదిక మా AI వ్యవస్థ ద్వారా అధిక నమ్మకంతో ధృవీకరించబడింది.',
    'safety_briefing': 'ప్రస్తుత నివేదికల ఆధారంగా, ఈ వసతికి శ్రద్ధ అవసరమైన అనేక భద్రతా ఆందోళనలు ఉన్నాయి.'
  },
  'hi': {
    'ssi_explanation': 'SafeStay सुरक्षा सूचकांक (SSI) सत्यापित रिपोर्टों के आधार पर छात्र आवास की समग्र सुरक्षा को मापने वाला 0 से 100 तक का एक गतिशील स्कोर है।',
    'report_summary': 'यह रिपोर्ट हमारी AI प्रणाली द्वारा उच्च विश्वास के साथ सत्यापित की गई है।',
    'safety_briefing': 'वर्तमान रिपोर्टों के आधार पर, इस आवास में कई सुरक्षा चिंताएं हैं जिन पर ध्यान देने की आवश्यकता है।'
  }
};

// Pre-generated ElevenLabs audio for demo (text to be synthesized)
export const PRE_CACHED_ELEVENLABS_TEXT = {
  ssi_summaries: {
    'green_valley_pg': 'Green Valley PG has a SafeStay Safety Index of 85. This accommodation is classified as low risk.',
    'city_comfort_pg': 'City Comfort PG has a SafeStay Safety Index of 45. This accommodation is classified as high risk.',
    'sunshine_hostel': 'Sunshine Hostel has a SafeStay Safety Index of 72. This accommodation is classified as low risk.',
    'budget_stay': 'Budget Stay has a SafeStay Safety Index of 32. This accommodation is classified as high risk.',
    'student_nest': 'Student Nest has a SafeStay Safety Index of 68. This accommodation is classified as medium risk.'
  },
  safety_briefings: {
    'city_comfort_pg': 'Safety briefing for City Comfort PG. There are 3 high severity safety concerns: fire safety, structural, and water quality. Please exercise caution.',
    'budget_stay': 'Safety briefing for Budget Stay. There are 4 high severity safety concerns: fire safety, electrical, hygiene, and security. Please exercise caution.'
  }
};
