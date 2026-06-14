import type {
  RouteLocation,
  RouteIntelligence,
  RoutePoint,
  RiskHotspot,
  RouteComparison,
} from '../types';

// ── College Locations ───────────────────────────────────────
export const COLLEGES: RouteLocation[] = [
  { id: 'col-1', name: 'IIIT Hyderabad', latitude: 17.4435, longitude: 78.3476, area: 'Gachibowli' },
  { id: 'col-2', name: 'JNTU Hyderabad', latitude: 17.4943, longitude: 78.3926, area: 'Kukatpally' },
  { id: 'col-3', name: 'Osmania University', latitude: 17.4156, longitude: 78.5302, area: 'Amberpet' },
  { id: 'col-4', name: 'IIT Hyderabad', latitude: 17.5868, longitude: 78.1238, area: 'Kandi' },
  { id: 'col-5', name: 'CBIT', latitude: 17.4155, longitude: 78.3249, area: 'Gandipet' },
  { id: 'col-6', name: 'Vasavi College', latitude: 17.3890, longitude: 78.4790, area: 'LB Nagar' },
];

// ── Accommodation Locations (from demo markers) ─────────────
export const ACCOMMODATIONS: RouteLocation[] = [
  { id: 'acc-1', name: 'Sunshine Ladies PG', latitude: 17.4486, longitude: 78.3908, area: 'Madhapur' },
  { id: 'acc-2', name: 'Vertex Student Hostel', latitude: 17.4435, longitude: 78.3476, area: 'Hitech City' },
  { id: 'acc-3', name: 'Green Valley Residency', latitude: 17.4400, longitude: 78.3488, area: 'Hitech City' },
  { id: 'acc-4', name: 'SafeNest Boys PG', latitude: 17.4977, longitude: 78.3171, area: 'Kondapur' },
  { id: 'acc-5', name: 'Rainbow Ladies Hostel', latitude: 17.4590, longitude: 78.3780, area: 'Gachibowli' },
  { id: 'acc-6', name: 'City Nest PG', latitude: 17.4155, longitude: 78.3249, area: 'Ameerpet' },
  { id: 'acc-7', name: 'Comfort Stay Hostel', latitude: 17.4849, longitude: 78.3013, area: 'Kukatpally' },
  { id: 'acc-8', name: 'Student Inn', latitude: 17.4250, longitude: 78.3180, area: 'Ameerpet' },
  { id: 'acc-9', name: 'Metro Homes PG', latitude: 17.4062, longitude: 78.4691, area: 'LB Nagar' },
  { id: 'acc-10', name: 'Star View Residency', latitude: 17.4744, longitude: 78.3170, area: 'Kondapur' },
  { id: 'acc-11', name: 'Budget Stay PG', latitude: 17.3967, longitude: 78.4863, area: 'Dilshuknagar' },
  { id: 'acc-12', name: 'Lakshmi Ladies Hostel', latitude: 17.3833, longitude: 78.4011, area: 'Dilshuknagar' },
  { id: 'acc-13', name: 'New York Residency', latitude: 17.4531, longitude: 78.2987, area: 'Kukatpally' },
  { id: 'acc-14', name: 'Sri Sai Student Lodge', latitude: 17.3798, longitude: 78.4783, area: 'LB Nagar' },
  { id: 'acc-15', name: 'RK Nagar PG', latitude: 17.4689, longitude: 78.3102, area: 'Kondapur' },
  { id: 'acc-16', name: 'Sreekar Balgoni Ladies PG', latitude: 17.4333, longitude: 78.3333, area: 'Narsingi' },
];

// ── Interpolate route points between two locations ──────────
function interpolateRoute(
  start: { lat: number; lng: number },
  end: { lat: number; lng: number },
  numPoints: number = 20,
): RoutePoint[] {
  const points: RoutePoint[] = [];
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    // Add slight curvature for realism
    const midLat = (start.lat + end.lat) / 2 + Math.sin(t * Math.PI) * 0.008;
    const midLng = (start.lng + end.lng) / 2 + Math.cos(t * Math.PI) * 0.005;
    const lat = start.lat + (end.lat - start.lat) * t + (midLat - (start.lat + end.lat) / 2) * Math.sin(t * Math.PI);
    const lng = start.lng + (end.lng - start.lng) * t + (midLng - (start.lng + end.lng) / 2) * Math.sin(t * Math.PI);
    // Safety score varies along route
    const baseScore = 75 + Math.sin(t * Math.PI * 3) * 12 + Math.cos(t * 5) * 8;
    points.push({ lat, lng, safetyScore: Math.max(20, Math.min(98, Math.round(baseScore))) });
  }
  return points;
}

// ── Generate hotspots along route ───────────────────────────
function generateHotspots(routePoints: RoutePoint[], seed: number): RiskHotspot[] {
  const hotspotTypes: Array<{ type: RiskHotspot['type']; label: string }> = [
    { type: 'security', label: 'Security Concern' },
    { type: 'hygiene', label: 'Food Safety Complaints' },
    { type: 'water', label: 'Water Quality Issues' },
    { type: 'theft', label: 'Theft Reports' },
    { type: 'noise', label: 'Noise Disturbance' },
    { type: 'electricity', label: 'Power Outage Zone' },
  ];

  const hotspots: RiskHotspot[] = [];
  const numHotspots = 2 + (seed % 3);

  for (let i = 0; i < numHotspots; i++) {
    const pointIdx = Math.floor(((i + 1) / (numHotspots + 1)) * (routePoints.length - 1));
    const point = routePoints[pointIdx];
    const typeInfo = hotspotTypes[(seed + i) % hotspotTypes.length];
    hotspots.push({
      id: `hs-${seed}-${i}`,
      latitude: point.lat + (Math.sin(i * 2.5) * 0.002),
      longitude: point.lng + (Math.cos(i * 2.5) * 0.002),
      type: typeInfo.type,
      label: typeInfo.label,
      reportCount: 3 + ((seed + i) * 7) % 15,
      severity: (1 + ((seed + i) * 3) % 5) as 1 | 2 | 3 | 4 | 5,
      lastReported: new Date(Date.now() - ((seed + i) * 3 + 1) * 86400000).toISOString().split('T')[0],
    });
  }
  return hotspots;
}

// ── Calculate route intelligence ────────────────────────────
function calculateRouteIntelligence(
  accommodation: RouteLocation,
  college: RouteLocation,
): RouteIntelligence {
  const routePoints = interpolateRoute(
    { lat: accommodation.latitude, lng: accommodation.longitude },
    { lat: college.latitude, lng: college.longitude },
  );

  const avgScore = Math.round(routePoints.reduce((s, p) => s + p.safetyScore, 0) / routePoints.length);
  const minScore = Math.min(...routePoints.map((p) => p.safetyScore));
  const seed = accommodation.name.length + college.name.length;

  const hotspots = generateHotspots(routePoints, seed);

  // Distance calculation (Haversine approximation)
  const R = 6371;
  const dLat = ((college.latitude - accommodation.latitude) * Math.PI) / 180;
  const dLng = ((college.longitude - accommodation.longitude) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((accommodation.latitude * Math.PI) / 180) *
      Math.cos((college.latitude * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const distanceKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = `${distanceKm.toFixed(1)} km`;

  // Travel time (assume 25 km/h avg speed in city)
  const travelMinutes = Math.round((distanceKm / 25) * 60);
  const travelTime = travelMinutes < 60 ? `${travelMinutes} min` : `${Math.floor(travelMinutes / 60)}h ${travelMinutes % 60}m`;

  let riskLevel: RouteIntelligence['riskLevel'] = 'safe';
  if (avgScore < 60) riskLevel = 'high-risk';
  else if (avgScore < 80) riskLevel = 'moderate';

  const nightSafety = Math.max(30, minScore + 10);

  const recommendations = [
    { level: 'safe', text: `Recommended route for all students, including female travelers. Well-lit corridors with regular patrol presence. No recent security incidents reported along this corridor. Safe for night travel until 11 PM.` },
    { level: 'moderate', text: `Generally safe during daytime hours (6 AM – 9 PM). Exercise caution during evening hours near ${hotspots[0]?.label.toLowerCase() || 'commercial areas'}. Consider traveling with friends after 9 PM. Keep emergency contacts handy.` },
    { level: 'high-risk', text: `⚠️ Use alternative routes during night hours (after 8 PM). Multiple safety concerns reported along this corridor. ${hotspots.length} risk zones identified. Consider cab services for late travel. Female students should avoid this route after sunset.` },
  ];

  const aiSummaries = [
    `Based on analysis of ${hotspots.reduce((s, h) => s + h.reportCount, 0)} reports from accommodations near ${accommodation.area} and along the corridor to ${college.area}, this route is ${riskLevel === 'safe' ? 'generally safe' : riskLevel === 'moderate' ? 'moderately safe' : 'concerning'}. ${hotspots.length > 0 ? `The area around ${hotspots[0].label.toLowerCase()} has received a ${avgScore >= 60 ? 'small' : 'significant'} increase in safety complaints during late evening hours. Local authorities have been notified and additional lighting has been requested.` : 'No major safety concerns have been reported along this route.'} Students are advised to ${riskLevel === 'safe' ? 'travel freely during most hours with standard precautions' : riskLevel === 'moderate' ? 'avoid travel after 10 PM and stay in groups during evening hours' : 'use alternative routes after 8 PM and consider cab services for late travel'}.`,
    `This ${riskLevel === 'safe' ? 'well-maintained' : riskLevel === 'moderate' ? 'moderate-risk' : 'high-risk'} corridor spans ${distanceKm.toFixed(1)} km from ${accommodation.area} to ${college.area}. ${riskLevel === 'safe' ? 'The route features well-lit streets, active security presence, and regular patrol routes.' : `The route passes through ${hotspots.length} area${hotspots.length !== 1 ? 's' : ''} with elevated safety concerns.`} Night safety rating of ${nightSafety}/100 ${nightSafety >= 70 ? 'indicates strong overnight security' : nightSafety >= 50 ? 'suggests moderate overnight safety' : 'suggests limited overnight security measures'}. ${hotspots.length > 0 ? `Key concern: ${hotspots[0].label} with ${hotspots[0].reportCount} reports filed.` : ''}`,
  ];

  return {
    routeId: `route-${accommodation.id}-${college.id}`,
    accommodationName: accommodation.name,
    collegeName: college.name,
    routePoints,
    hotspots,
    safetyScore: avgScore,
    riskLevel,
    travelTime,
    distance,
    nightSafetyRating: nightSafety,
    recommendation: recommendations.find((r) => r.level === riskLevel)?.text || recommendations[0].text,
    aiSummary: aiSummaries[seed % 2],
  };
}

// ── Public API ──────────────────────────────────────────────
export function getRouteIntelligence(
  accommodationId: string,
  collegeId: string,
): RouteIntelligence | null {
  const acc = ACCOMMODATIONS.find((a) => a.id === accommodationId);
  const col = COLLEGES.find((c) => c.id === collegeId);
  if (!acc || !col) return null;
  return calculateRouteIntelligence(acc, col);
}

export function getRouteComparison(
  accommodationIdA: string,
  accommodationIdB: string,
  collegeId: string,
): RouteComparison | null {
  const routeA = getRouteIntelligence(accommodationIdA, collegeId);
  const routeB = getRouteIntelligence(accommodationIdB, collegeId);
  if (!routeA || !routeB) return null;

  const better = routeA.safetyScore >= routeB.safetyScore ? routeA : routeB;
  const worse = routeA.safetyScore >= routeB.safetyScore ? routeB : routeA;
  const diff = better.safetyScore - worse.safetyScore;

  return {
    routeA,
    routeB,
    aiRecommendation: `📊 AI Analysis: ${better.accommodationName} provides a ${diff > 15 ? 'significantly' : 'moderately'} safer daily commute to ${routeA.collegeName} with a safety score of ${better.safetyScore} vs ${worse.safetyScore}. ${better.accommodationName} has ${better.hotspots.length} risk zones compared to ${worse.hotspots.length} for ${worse.accommodationName}. Night safety rating: ${better.nightSafetyRating}/100 vs ${worse.nightSafetyRating}/100. Recommendation: Choose ${better.accommodationName} for a safer, more comfortable daily commute.`,
  };
}

export function getRouteMetrics() {
  return {
    avgRouteSSI: 76,
    safestRoute: 'Sunshine Ladies PG → IIIT Hyderabad (88)',
    highestRiskZone: 'Dilshuknagar corridor',
    recentAlerts: 4,
  };
}
