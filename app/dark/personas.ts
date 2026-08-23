/**
 * Liste des personas côté interface.
 * Les `id` doivent rester identiques à ceux de `app/api/dark/route.ts`,
 * qui détient les system prompts correspondants.
 */
export type Persona = { id: string; label: string; hint: string };

export const PERSONAS: Persona[] = [
  { id: "standard", label: "Standard", hint: "Réponses claires et structurées" },
  { id: "cash", label: "Sans détour", hint: "Franc, critique, zéro flatterie" },
  { id: "dev", label: "Dev", hint: "Code d'abord, explication ensuite" },
  { id: "copy", label: "Copywriter", hint: "Accroches et scripts publicitaires" },
  { id: "prof", label: "Pédagogue", hint: "Explique en partant de zéro" },
];

export const DEFAULT_PERSONA = "standard";
