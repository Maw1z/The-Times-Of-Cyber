import { NewspaperPage } from "../pages/NewspaperPage";
import { LayoutDenseAsymmetric } from "../layouts/LayoutDenseAsymmetric";
import { zeroDayStories } from "../data/page3";

const [zd1, zd2, zd3, zd4, zd5, zd6, zd7, zd8] = zeroDayStories;

export function Page3ZeroDay() {
  return (
    <NewspaperPage
      banner={{
        headline: "ZERO-DAY EXPLOITS",
        deck: "Unpatched vulnerabilities expose systemic weaknesses",
      }}
      mastheadProps={{
        name: "The Times of Cyber",
        date: "Monday, April 28, 2026",
        edition: "Page 3 · Security",
        nameplateClassName: "font-Aktura text-2xl",
        showBottomBorder: false,
      }}
      layout={
        <LayoutDenseAsymmetric
          lead={zd1}
          col1={[zd2, zd4]}
          col2={[zd3, zd5]}
          col3={[zd6, zd7, zd8]}
        />
      }
    />
  );
}
