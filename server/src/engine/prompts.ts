import type { FacilitatorPrompt, TeamFull } from "@sim/shared";
import { nanoid } from "nanoid";

export function generatePrompts(teams: TeamFull[]): FacilitatorPrompt[] {
  const prompts: FacilitatorPrompt[] = [];

  for (const t of teams) {
    const lastDirective = t.history.slice(-2).filter((h) => h.decision.leadership === "directive").length;
    if (lastDirective >= 2) {
      prompts.push({
        id: nanoid(6),
        teamId: t.id,
        teamName: t.name,
        tone: "warning",
        text: `${t.name} has used a directive style two rounds running. Ask how the team is experiencing that.`,
      });
    }

    if (t.kpis.customer < 45) {
      prompts.push({
        id: nanoid(6),
        teamId: t.id,
        teamName: t.name,
        tone: "warning",
        text: `${t.name} is under-indexing on customer experience. Prompt them on where the customer sits in their priorities.`,
      });
    }

    const escalations = t.history.filter((h) => h.decision.action === "escalate").length;
    if (escalations >= 2) {
      prompts.push({
        id: nanoid(6),
        teamId: t.id,
        teamName: t.name,
        tone: "warning",
        text: `${t.name} is escalating often. Explore whether they trust their own authority.`,
      });
    }

    if (t.hidden.trust < 40) {
      prompts.push({
        id: nanoid(6),
        teamId: t.id,
        teamName: t.name,
        tone: "warning",
        text: `Trust is low in ${t.name}'s store. Ask what signals they think they are sending.`,
      });
    }

    if (t.kpis.engagement > 75 && t.kpis.sales > 65) {
      prompts.push({
        id: nanoid(6),
        teamId: t.id,
        teamName: t.name,
        tone: "positive",
        text: `${t.name} is holding both engagement and sales. Invite them to share what is working.`,
      });
    }
  }

  if (teams.length >= 2) {
    const sorted = [...teams].sort((a, b) => b.score - a.score);
    const top = sorted[0];
    const bottom = sorted[sorted.length - 1];
    if (top.score - bottom.score > 80) {
      prompts.push({
        id: nanoid(6),
        tone: "info",
        text: `Gap between ${top.name} and ${bottom.name} is widening. Consider surfacing approach differences.`,
      });
    }
  }

  return prompts.slice(0, 6);
}
