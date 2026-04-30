// Page7CommunityHN.jsx
import { NewspaperPage } from "../pages/NewspaperPage";
import { LayoutCommunityHN } from "../layouts/LayoutCommunityHN";
import { communitySignalData } from "../data/page7";

const { topics, hn } = communitySignalData;
const [hn1, hn2, hn3, hn4] = hn;

export function Page7CommunityHN() {
  return (
    <NewspaperPage
      banner={{
        headline: "COMMUNITY SIGNAL",
        deck: "Trending topics ranked by velocity, engagement and sentiment across security communities",
      }}
      mastheadProps={{
        name: "The Times of Cyber",
        date: "Monday, April 28, 2026",
        edition: "Page 7 · Community",
        nameplateClassName: "font-Aktura text-2xl",
        showBottomBorder: false,
      }}
      layout={
        <LayoutCommunityHN
          topics={topics}
          col1={[hn1, hn3]}
          col2={[hn2, hn4]}
        />
      }
    />
  );
}
