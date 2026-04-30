// Page5ThreatDesk.jsx
import { NewspaperPage } from "../pages/NewspaperPage";
import { LayoutThreatDeskCVE } from "../layouts/LayoutThreatDeskCVE";
import { threatDeskStories } from "../data/page5";

const { cves, stories } = threatDeskStories;
const [td1, td2, td3, td4, td5] = stories;

export function Page5ThreatDesk() {
  return (
    <NewspaperPage
      banner={{
        headline: "VULNERABILITY DESK",
        deck: "Ranked by exploitability state, CVSS severity and deployment exposure",
      }}
      mastheadProps={{
        name: "The Times of Cyber",
        date: "Monday, April 28, 2026",
        edition: "Page 5 · Threat Intelligence",
        nameplateClassName: "font-Aktura text-2xl",
        showBottomBorder: false,
      }}
      layout={
        <LayoutThreatDeskCVE
          cves={cves}
          col1={[td1, td3, td4]}
          col2={[td2, td5]}
        />
      }
    />
  );
}
