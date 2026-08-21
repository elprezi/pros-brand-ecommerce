import React from 'react';
import { Hero } from '../components/home/Hero';
import { FeaturedCategories } from '../components/home/FeaturedCategories';
import { ServicesBenefitsBar } from '../components/home/ServicesBenefitsBar';
import { CollectionsSection } from '../components/home/CollectionsSection';

export const HomePage: React.FC = () => {
  return (
    <div className="bg-[#F7F6F2] min-h-screen text-black">
      {/* 1. Hero Section (Split Banner with Slider) */}
      <Hero />

      {/* 2. Featured Categories (3 Horizontal Cards: HOMME, FEMME, ACCESSOIRES) */}
      <FeaturedCategories />

      {/* 3. Services & Benefits Bar (5 Benefit Blocks) */}
      <ServicesBenefitsBar />

      {/* 4. Nos Collections Section (3 Widescreen Lifestyle Cards) */}
      <CollectionsSection />
    </div>
  );
};
