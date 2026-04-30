import { NewspaperPage } from "../pages/NewspaperPage";
import { LayoutDense5Col } from "../layouts/LayoutDense5Col";
import { ransomwareStories } from "../data/page2";

const [rw1, rw2, rw3, rw4, rw5, rw6, rw7, rw8] = ransomwareStories;

export function Page2Ransomware() {
  return (
    <NewspaperPage
      banner={{
        headline: "RANSOMWARE",
        deck: "Escalating attacks reshape global cyber defense priorities",
      }}
      mastheadProps={{
        name: "The Times of Cyber",
        date: "Monday, April 28, 2026",
        edition: "Page 2 · National",
        nameplateClassName: "font-Aktura text-2xl",
        showBottomBorder: false,
      }}
      layout={
        <LayoutDense5Col
          columns={[
            [rw1], // col 0 — lead story, wide body, fills the column
            [rw2], // col 1 — secondary, hospitals
            [rw3], // col 2 — secondary, ransom wallets
            [rw4, rw5, rw6], // col 3 — three briefs stacked
            [rw7, rw8], // col 4 — two briefs
          ]}
        />
      }
    />
  );
}
