/** Short lay descriptors for each panel, shown under the group heading. */
const PANEL_DESCRIPTIONS: Record<string, string> = {
  "Lipid panel": "fats in your blood",
  "Blood sugar": "how your body handles sugar",
  "Metabolic panel": "kidneys, salts, and balance",
  "Complete blood count": "your blood cells",
  Liver: "how your liver is doing",
  Thyroid: "your thyroid",
  Vitamins: "vitamin levels",
  Inflammation: "signs of inflammation",
};

export function panelDescription(panel: string): string | undefined {
  return PANEL_DESCRIPTIONS[panel];
}
