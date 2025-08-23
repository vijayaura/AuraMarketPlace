import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProposalForm } from "@/components/ProposalForm";

const Proposal = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <ProposalForm />
      <Footer />
    </div>
  );
};

export default Proposal;