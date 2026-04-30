// Page8CommunityReddit.jsx
import { NewspaperPage } from "../pages/NewspaperPage";
import { LayoutCommunityReddit } from "../layouts/LayoutCommunityReddit";
import { communitySignalData } from "../data/page7";

const { topics, reddit } = communitySignalData;
const [rd1, rd2, rd3, rd4] = reddit;

export function Page8CommunityReddit() {
  return (
    <NewspaperPage
      banner={{
        headline: "COMMUNITY SIGNAL",
        deck: "Trending topics ranked by velocity, engagement and sentiment across security communities",
      }}
      mastheadProps={{
        name: "The Times of Cyber",
        date: "Monday, April 28, 2026",
        edition: "Page 8 · Community",
        nameplateClassName: "font-Aktura text-2xl",
        showBottomBorder: false,
      }}
      layout={
        <LayoutCommunityReddit
          topics={topics}
          col1={[rd1, rd3]}
          col2={[rd2]}
          col3={[rd4]}
        />
      }
    />
  );
}
