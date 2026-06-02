// Simulates the AI backend logic
export const analyzeAreaSafety = (lat, lng) => {
  const hour = new Date().getHours();
  
  // Logic for 4.1 & 4.2
  const factors = {
    lighting: hour > 18 || hour < 6 ? 0.4 : 0.9, // Lower at night
    crowdDensity: Math.random(),
    visibility: 0.85,
    historicalCrime: 0.1, // Low probability
  };

  const riskScore = (factors.lighting * 0.4 + (1 - factors.crowdDensity) * 0.3 + (1 - factors.historicalCrime) * 0.3);

  return {
    score: riskScore.toFixed(2),
    classification: riskScore > 0.7 ? 'Low' : riskScore > 0.4 ? 'Medium' : 'High',
    prediction: "Risk likely to increase in next 30 mins due to sunset.", // 4.2
    metrics: factors
  };
};