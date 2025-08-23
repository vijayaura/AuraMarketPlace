import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { QuotesComparison } from "@/components/QuotesComparison";

const Quotes = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <QuotesComparison />
      <Footer />
    </div>
  );
};

export default Quotes;