import { stories } from "./data/stories";

import { LayoutMagazine } from "./layouts/LayoutMagazine";
import { Layout2Col } from "./layouts/Layout2Col";
import { Layout3Col } from "./layouts/Layout3Col";

import { FrontPage } from "./pages/FrontPage";
import { Page2Ransomware } from "./pages/Page2Ransomware";
import { Page4Breaches } from "./pages/Page4Breaches";
import { Page3ZeroDay } from "./pages/Page3ZeroDay";
import { Page5ThreatDesk } from "./pages/Page5ThreatDesk";
import { Page6ThreatActors } from "./pages/Page6ThreatActors";
import { Page7CommunityHN } from "./pages/Page7CommunityHN";
import { Page8CommunityReddit } from "./pages/Page8CommunityReddit";

function getLayout(variant) {
  switch (variant) {
    case "2col":
      return (
        <Layout2Col
          lead={stories.ransomware}
          sidebar={[
            stories.zeroTrust,
            stories.cryptoMarkets,
            stories.aiAlerts,
            stories.openSource,
          ]}
        />
      );

    case "magazine":
      return (
        <LayoutMagazine
          lead={stories.ransomware}
          briefs={[
            stories.zeroTrust,
            stories.cryptoMarkets,
            stories.aiAlerts,
            stories.openSource,
          ]}
        />
      );

    case "3col":
    default:
      return (
        <Layout3Col
          lead={stories.ransomware}
          sidebar={[stories.zeroTrust, stories.cryptoMarkets, stories.aiAlerts]}
          briefs={[stories.openSource, stories.insurance]}
        />
      );
  }
}

export default function App() {
  return (
    <>
      {/* Outer viewport fill */}
      <div className="min-h-screen w-screen flex flex-col pt-5 gap-5 items-center justify-center bg-stone-400">
        <FrontPage />
        <Page2Ransomware />
        <Page3ZeroDay />
        <Page4Breaches />
        <Page5ThreatDesk />
        <Page6ThreatActors />
        <Page7CommunityHN />
        <Page8CommunityReddit />
      </div>
    </>
  );
}
