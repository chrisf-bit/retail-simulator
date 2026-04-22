import type { Alert, Issue, DisruptionEvent } from "@sim/shared";

export const ISSUE_BANK: Issue[] = [
  {
    id: "iss_short_stock",
    title: "Short-dated stock build-up",
    description: "Chilled aisle has 180 units within 24h expiry.",
    severity: "medium",
    tags: ["commercial", "safety_loss"],
  },
  {
    id: "iss_till_queue",
    title: "Till queue exceeding 8 minutes",
    description: "Front-end service levels breaching threshold.",
    severity: "high",
    tags: ["customer", "commercial"],
  },
  {
    id: "iss_sickness",
    title: "Two team members absent",
    description: "Duty manager short-handed in backroom.",
    severity: "medium",
    tags: ["people_team"],
  },
  {
    id: "iss_theft_pattern",
    title: "Repeat shoplifting pattern flagged",
    description: "Security footage shows three incidents this week in spirits aisle.",
    severity: "high",
    tags: ["safety_loss"],
  },
  {
    id: "iss_delivery_late",
    title: "Delivery running 90 minutes late",
    description: "Backroom team blocked, shop floor gaps forming.",
    severity: "medium",
    tags: ["commercial"],
  },
  {
    id: "iss_complaint_escalation",
    title: "Customer complaint escalated",
    description: "Refund refused at self-scan, customer demanding manager.",
    severity: "medium",
    tags: ["customer"],
  },
  {
    id: "iss_team_conflict",
    title: "Interpersonal conflict on nights team",
    description: "Supervisor flagged a dispute affecting morale and output.",
    severity: "medium",
    tags: ["people_team"],
  },
  {
    id: "iss_planogram",
    title: "Planogram compliance at 62%",
    description: "Head Office flagged compliance shortfall in beers & wines.",
    severity: "low",
    tags: ["commercial"],
  },
  {
    id: "iss_waste",
    title: "Waste tracking 14% above target",
    description: "Bakery and produce departments over index this week.",
    severity: "medium",
    tags: ["commercial", "safety_loss"],
  },
];

export const ALERT_BANK: Omit<Alert, "id" | "timestamp">[] = [
  {
    kind: "head_office",
    title: "Head Office: weekly compliance review",
    message: "Regional visit next Tuesday, availability audit expected.",
  },
  {
    kind: "operational",
    title: "Chiller alarm temporarily silenced",
    message: "Engineering callout logged, response in 45 minutes.",
  },
  {
    kind: "head_office",
    title: "Head Office: price file update live",
    message: "118 SKUs changed overnight, verify edge labels.",
  },
  {
    kind: "operational",
    title: "Self-scan unit 4 offline",
    message: "Awaiting engineer, divert customers to manned tills.",
  },
];

export const DISRUPTION_BANK: Omit<DisruptionEvent, "id" | "triggeredAt">[] = [
  {
    title: "Fire alarm activation",
    message: "Full evacuation triggered by a faulty smoke detector in backroom.",
    impact: "Shop floor unattended for 12 minutes, safety and trust under pressure.",
  },
  {
    title: "Competitor flash promotion",
    message: "Rival store launched a 25% off promotion within the hour.",
    impact: "Sales pressure intensifies, requires commercial response.",
  },
  {
    title: "Viral customer complaint",
    message: "Social media post about till queues gaining traction.",
    impact: "Customer experience KPI under scrutiny from Head Office.",
  },
  {
    title: "Key colleague walks out",
    message: "A senior team member left mid-shift citing pressure.",
    impact: "Trust and capability hits; engagement at risk.",
  },
  {
    title: "Power outage in backroom",
    message: "Chilled goods at risk, 30 minute window.",
    impact: "Shrinkage and operations under threat.",
  },
];
