import Link from "next/link";
import { HeroSection } from "./components/HeroSection";
import { FeatureHighlights } from "./components/FeatureHighlights";
import { ComparisonSection } from "./components/ComparisonSection";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <FeatureHighlights />
      <ComparisonSection />
    </div>
  );
}

