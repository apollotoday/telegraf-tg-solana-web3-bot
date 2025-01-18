import {
  CardSection,
  SignUpSection,
  PackageCardSection,
  HeroSection,
  UnLockSection,
} from "./Sections";

const Home = () => {
  return (
    <main className="w-full scroll-smooth">
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
  );
};

export default Home;
