export function generateAIScenario(prompt: string) {
  const trustImpact = Math.floor(Math.random() * 40) - 20;

  const id = crypto.randomUUID();
  return {
    id,
    title: `AI Scenario: ${prompt.slice(0, 40)}`,
    run() {
      return {
        scenarioId: id,
        title: "AI-Generated Scenario",
        summary: `AI simulated outcome for: "${prompt}"`,
        before: {
          trustScore: 70,
          profileStrength: 70,
        },
        after: {
          trustScore: 70 + trustImpact,
          profileStrength: 70 + Math.floor(trustImpact / 2),
        },
        events: [
          {
            type: "ai_reasoning",
            message: "AI evaluated resume signals, peer data, and employer risk",
            impact: trustImpact,
          },
          {
            type: "system",
            message: "Trust recalculated using predictive weighting",
          },
        ],
        aiExplanation: [
          "Resume timeline consistency",
          "Peer density across employers",
          "Historical employer reliability",
          "Role overlap confidence",
        ],
      };
    },
  };
}
