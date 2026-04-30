import { NewspaperPage } from "../pages/NewspaperPage";
import { LayoutMagazine } from "../layouts/LayoutMagazine";
import { stories } from "../data/stories";

export function FrontPage() {
  return (
    <NewspaperPage
      banner={{
        headline: "RANSOMWARE",
        deck: "Escalating attacks reshape global cyber defense priorities",
      }}
      mastheadProps={{
        name: "The Times of Cyber",
        date: "Monday, April 28, 2026",
        edition: "Late Edition · $4.00",
        nameplateClassName: "font-Aktura text-7xl pt-2",
      }}
      layout={
        <LayoutMagazine
          lead={stories.ransomware}
          briefs={[
            // @ts-expect-error temp
            stories.zeroTrust,
            // @ts-expect-error temp
            stories.cryptoMarkets,
            // @ts-expect-error temp
            stories.aiAlerts,
            // @ts-expect-error temp
            stories.openSource,
          ]}
        />
      }
    />
  );
}
