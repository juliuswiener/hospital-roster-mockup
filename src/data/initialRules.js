// Predefined rules that ensure fair scheduling
export const initialRules = [
  {
    id: 'fairness-equal-distribution',
    text: 'Alle Mitarbeiter sollen gleichmäßig eingesetzt werden',
    type: 'soft',
    category: 'Fairness',
    appliesTo: 'all',
    source: 'predefined',
    weight: 10,
    isActive: true,
    parameters: {
      objective: 'equal_utilization',
      description: 'Verteilt Schichten gleichmäßig auf alle Mitarbeiter'
    }
  }
];
