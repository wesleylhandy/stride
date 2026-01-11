import { HeroSection } from "./components/HeroSection";
import { FeatureHighlights } from "./components/FeatureHighlights";
import { ComparisonSection } from "./components/ComparisonSection";
import { IntegrationsSection } from "./components/integrations/IntegrationsSection";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <FeatureHighlights />
      <IntegrationsSection />
      <ComparisonSection />
    </div>
  );
}

