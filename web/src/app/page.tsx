import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import Banner from "@/components/Banner/Banner";
import { Toaster } from "@/components/ui/toaster";

import {
  CardSection,
  SignUpSection,
  PackageCardSection,
  HeroSection,
  UnLockSection,
} from "./Sections";

const Home = () => {
  return (
    <div className="w-full relative justify-center bg-black sm:px-[10px]">
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
        <SignUpSection />

        {/* Unlock the full potential of Momentum Labs section*/}
        <UnLockSection />
      </main>
      <Footer />
      <Toaster />
    </div>
  );
};

export default Home;
