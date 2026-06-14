function calculateTrustScore(reports) {
  if (!reports || reports.length === 0) return { score: 100, label: 'Safe', color: 'green' };

  const now = new Date();
  let totalPenalty = 0;

  const severityWeights = { 'low': 5, 'medium': 15, 'high': 30 };
  const categoryWeights = {
    'Security': 1.5, 'Food Safety': 1.3, 'Water Quality': 1.3,
    'Hygiene': 1.0, 'Infrastructure': 0.8
  };

  reports.forEach(report => {
    if (report.status === 'rejected' || report.status === 'pending') return;

    const daysSince = Math.floor((now - new Date(report.createdAt)) / (1000 * 60 * 60 * 24));
    const decayFactor = Math.max(0.1, 1 - (daysSince / 365));
    const severityPenalty = severityWeights[report.severity] || 10;
    const categoryMultiplier = categoryWeights[report.issueType] || 1.0;
    const upvoteMultiplier = 1 + (Math.min((report.upvotes || 0), 20) * 0.1);
    
    let statusMultiplier = 1.0; // Default for 'approved'
    if (report.status === 'verified') {
      statusMultiplier = 0.2; // 80% reduction
    } else if (report.status === 'disputed') {
      statusMultiplier = 1.2; // 20% increase
    } else if (report.status === 'resolved') {
      statusMultiplier = 0.5; // Bonus for resolution attempt
    }

    totalPenalty += severityPenalty * categoryMultiplier * decayFactor * upvoteMultiplier * statusMultiplier;
  });

  let score = Math.round(100 - totalPenalty);
  
  if (isNaN(score)) score = 100;
  score = Math.max(0, Math.min(100, score));

  let label, color;

  if (score >= 80) { label = 'Safe'; color = 'green'; }
  else if (score >= 50) { label = 'Caution'; color = 'yellow'; }
  else { label = 'Unsafe'; color = 'red'; }

  return { score, label, color };
}

async function updateAccommodationScore(Accommodation, Report, accommodationId) {
  if (!accommodationId) return;

  const reports = await Report.find({
    accommodation: accommodationId,
    status: { $ne: 'rejected' }
  }).lean();

  const { score, label, color } = calculateTrustScore(reports);

  const accommodation = await Accommodation.findById(accommodationId);
  if (!accommodation) return;

  await Accommodation.findByIdAndUpdate(accommodationId, {
    trustScore: score,
    trustScoreLabel: label,
    trustScoreColor: color,
    totalReports: reports.length,
    lastScoreUpdate: new Date()
  });
}

module.exports = { calculateTrustScore, updateAccommodationScore };
