const INPUT_COST_PER_1K = 0.00125; // USD per 1K input tokens
const OUTPUT_COST_PER_1K = 0.005; // USD per 1K output tokens

export function estimateCost(inputTokens: number, outputTokens: number): number {
  return (inputTokens / 1000) * INPUT_COST_PER_1K +
    (outputTokens / 1000) * OUTPUT_COST_PER_1K;
}

export function formatUSD(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(amount);
}
