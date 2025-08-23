import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { DocumentUpload } from "@/components/DocumentUpload";

const Documents = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <DocumentUpload />
      <Footer />
    </div>
  );
};

export default Documents;