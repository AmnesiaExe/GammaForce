/**
 * Policy framework grounding for the prioritisation model.
 *
 * Every scoring factor maps back to published WA Government / national guidance
 * so a priority score can always be defended to an agency.
 * Source: WA Cyber Security Unit (WASOC), Office of Digital Government 
 * https://soc.cyber.wa.gov.au/
 */

export interface FrameworkReference {
  key: string;
  label: string;
  authority: string;
  url: string;
  appliesTo: string;
}

export const FRAMEWORK_REFERENCES: FrameworkReference[] = [
  {
    key: "wasoc-vuln-baseline",
    label: "Vulnerability Management Baseline",
    authority: "WA Cyber Security Unit (WASOC)",
    url: "https://soc.cyber.wa.gov.au/baselines/vulnerability-management/",
    appliesTo: "Threat score, remediation urgency",
  },
  {
    key: "essential-eight",
    label: "Essential Eight Maturity Model",
    authority: "ACSC / ASD",
    url: "https://soc.cyber.wa.gov.au/guidelines/essential-eight/",
    appliesTo: "Agency control posture",
  },
  {
    key: "acsc-strategies",
    label: "Strategies to Mitigate Cyber Security Incidents",
    authority: "ACSC / ASD",
    url: "https://soc.cyber.wa.gov.au/acsc-strategies/",
    appliesTo: "Intelligence confidence (ASD match)",
  },
  {
    key: "wa-csp",
    label: "WA Cyber Security Policy",
    authority: "Office of Digital Government",
    url: "https://soc.cyber.wa.gov.au/",
    appliesTo: "Agency value, citizen impact",
  },
  {
    key: "patch-management",
    label: "Patch Management Guideline",
    authority: "WASOC (aligned to ACSC)",
    url: "https://soc.cyber.wa.gov.au/guidelines/patch-management/",
    appliesTo: "Remediation urgency",
  },
  {
    key: "incident-reporting",
    label: "Incident Reporting (IRP)",
    authority: "WASOC",
    url: "https://soc.cyber.wa.gov.au/guidelines/incident-reporting/",
    appliesTo: "Active exploitation, related incidents",
  },
];
