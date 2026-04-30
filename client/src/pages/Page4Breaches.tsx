import { NewspaperPage } from "../pages/NewspaperPage";
import { LayoutDenseWideCenter } from "../layouts/LayoutDenseWideCenter";
import { breachStories } from "../data/page4";

const [br1, br2, br3, br4, br5, br6, br7, br8] = breachStories;

export function Page4Breaches() {
  return (
    <NewspaperPage
      banner={{
        headline: "DATA BREACHES",
        deck: "Corporate and state systems face relentless intrusion attempts",
      }}
      mastheadProps={{
        name: "The Times of Cyber",
        date: "Monday, April 28, 2026",
        edition: "Page 4 · International",
        nameplateClassName: "font-Aktura text-2xl",
        showBottomBorder: false,
      }}
      layout={
        <LayoutDenseWideCenter
          feature={br1}
          left={[br2, br4, br6]}
          right={[br3, br5, br7, br8]}
        />
      }
    />
  );
}
