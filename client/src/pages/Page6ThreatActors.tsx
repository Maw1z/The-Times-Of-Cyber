// Page6ThreatActors.jsx
import { NewspaperPage } from "../pages/NewspaperPage";
import { LayoutThreatDeskActors } from "../layouts/LayoutThreatDeskActors";
import { threatActorStories } from "../data/page6";

const { actors, stories } = threatActorStories;
const [ac1, ac2, ac3, ac4, ac5] = stories;

export function Page6ThreatActors() {
  return (
    <NewspaperPage
      banner={{
        headline: "THREAT ACTOR REGISTRY",
        deck: "Active groups ranked by operational tempo, target scope and TTP sophistication",
      }}
      mastheadProps={{
        name: "The Times of Cyber",
        date: "Monday, April 28, 2026",
        edition: "Page 6 · Threat Intelligence",
        nameplateClassName: "font-Aktura text-2xl",
        showBottomBorder: false,
      }}
      layout={
        <LayoutThreatDeskActors
          actors={actors}
          col1={[ac1, ac3, ac4]}
          col2={[ac2, ac5]}
        />
      }
    />
  );
}
