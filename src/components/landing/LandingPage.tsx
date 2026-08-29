import React from 'react';
import { LandingNavbar } from './LandingNavbar';
import { HeroSection } from './HeroSection';
import { InteractiveWorkflowDemo } from './InteractiveWorkflowDemo';
import { FeaturesSection } from './FeaturesSection';
import { HowItWorksSection } from './HowItWorksSection';
import { ComparisonSection } from './ComparisonSection';
import { PricingSection } from './PricingSection';
import { FaqSection } from './FaqSection';
import { LandingFooter } from './LandingFooter';

interface LandingPageProps {
  onLaunchApp: () => void;
  onOpenProModal: () => void;
  isUnlocked: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onLaunchApp,
  onOpenProModal,
  isUnlocked,
}) => {
  const handleScrollToDemo = () => {
    const el = document.getElementById('workflow-demo');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Fixed Navbar */}
      <LandingNavbar
        onLaunchApp={onLaunchApp}
        onOpenProModal={onOpenProModal}
        isUnlocked={isUnlocked}
      />

      {/* Hero Section */}
      <HeroSection
        onLaunchApp={onLaunchApp}
        onScrollToDemo={handleScrollToDemo}
      />

      {/* Interactive Workflow & Transformation Demonstration */}
      <InteractiveWorkflowDemo
        onLaunchApp={onLaunchApp}
      />

      {/* Core Features & Capabilities */}
      <FeaturesSection />

      {/* How It Works (4-Step Timeline) */}
      <HowItWorksSection
        onLaunchApp={onLaunchApp}
      />

      {/* Old Manual Way vs Automated Way Comparison */}
      <ComparisonSection />

      {/* Transparent Pricing ($19/mo Pro Pass & Free Tier) */}
      <PricingSection
        onLaunchApp={onLaunchApp}
        onOpenProModal={onOpenProModal}
        isUnlocked={isUnlocked}
      />

      {/* Frequently Asked Questions */}
      <FaqSection />

      {/* Bottom CTA Banner & Footer */}
      <LandingFooter
        onLaunchApp={onLaunchApp}
        onOpenProModal={onOpenProModal}
      />
    </div>
  );
};
