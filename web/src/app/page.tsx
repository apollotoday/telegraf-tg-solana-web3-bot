import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import Banner from "@/components/Layout/Banner";

import {
  CardSection,
  TryMomentumSection,
  PackageCardSection,
  HeroSection,
  UnLockSection,
} from "./Sections";

const Home = () => {
  return (
    <div className="w-full relative justify-center bg-black">
      <Banner />
      <Header />

      <main className="w-full">
        <div className="min-h-[15px] w-full"></div>

        {/* Hero section */}
        <HeroSection />

        {/* Cards section */}
        <CardSection />

        {/* Ready to launch your token section */}
        <PackageCardSection />

        {/* Try section */}
        <TryMomentumSection />

        {/* Unlock the full potential of Momentum Labs section*/}
        <UnLockSection />
      </main>
      <Footer />
    </div>
  );
};

export default Home;
