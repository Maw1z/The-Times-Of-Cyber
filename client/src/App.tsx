import { HalftoneImage } from "./components/HalftoneImage";

function App() {
  return (
    <div className="bg-[#FAFAFA] min-h-screen p-10 space-y-10">
      <h1 className="font-Aktura text-9xl leading-none">The Times of Cyber</h1>
      <HalftoneImage src="https://paper.design/flowers.webp" />
      <h1>Hello world</h1>
    </div>
  );
}

export default App;
