import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PolicyDelivery } from "@/components/PolicyDelivery";

const Success = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <PolicyDelivery />
      <Footer />
    </div>
  );
};

export default Success;