import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PaymentSection } from "@/components/PaymentSection";

const Payment = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <PaymentSection />
      <Footer />
    </div>
  );
};

export default Payment;