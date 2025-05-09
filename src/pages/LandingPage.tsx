import React from 'react';
import HowItWorks from './HowItWorks';
import TimeSavingSection from './TimeSavingSection';
import Features from './Features';
import Pricing from '../components/Pricing';
import Testimonials from './Testimonials';
import Footer from './Footer';
import HeroSection from './HeroSection';
import Navbar from './header/navbar';

export const LandingPage: React.FC = () => {

  return (
    <div className="min-h-screen bg-white">

      <Navbar />
      <HeroSection />
      <HowItWorks />
      <TimeSavingSection />
      <Features />
      <Pricing />
      <Testimonials />
      <Footer />

    </div>
  );
};