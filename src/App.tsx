import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import FlowSelection from "./pages/FlowSelection";
import BrokerLogin from "./pages/BrokerLogin";
import InsurerLogin from "./pages/InsurerLogin";
import MarketAdminLogin from "./pages/MarketAdminLogin";
import BrokerDashboard from "./pages/BrokerDashboard";
import BrokerUserManagement from "./pages/BrokerUserManagement";
import AddUser from "./pages/AddUser";
import EditUser from "./pages/EditUser";
import { InsurerLayout } from "./components/InsurerLayout";
import InsurerUserManagement from "./pages/InsurerUserManagement";
import AddInsurerUser from "./pages/AddInsurerUser";
import EditInsurerUser from "./pages/EditInsurerUser";
import { BrokerLayout } from "./components/BrokerLayout";
import Proposal from "./pages/Proposal";
import ProductSelection from "./pages/ProductSelection";
import ProposalRouter from "./pages/ProposalRouter";
import Quotes from "./pages/Quotes";
import Documents from "./pages/Documents";
// Declaration component removed - now using DeclarationTab in ProposalForm
import Payment from "./pages/Payment";
import Success from "./pages/Success";
import PISuccess from "./pages/PISuccess";
import InsurerDashboard from "./pages/InsurerDashboard";
import QuoteDetails from "./pages/QuoteDetails";
import PolicyDetails from "./pages/PolicyDetails";
import ProductConfig from "./pages/ProductConfig";
import CreatePlan from "./pages/CreatePlan";
import CEWCustomization from "./pages/CEWCustomization";
import NotFound from "./pages/NotFound";
import ManageInsurers from "./pages/ManageInsurers";
import InsurerDetailDashboard from "./pages/InsurerDetailDashboard";
import InsurerProductConfig from "./pages/InsurerProductConfig";
import PIProductConfig from "./pages/PIProductConfig";
import InsurerPricingConfig from "./pages/InsurerPricingConfig";
import BrokerAdminDashboard from "./pages/BrokerAdminDashboard";
import { MarketAdminLayout } from "./components/MarketAdminLayout";
import MarketAdminDashboard from "./pages/MarketAdminDashboard";
import RequireAuth from "./components/RequireAuth";
import MarketAdminBrokerManagement from "./pages/MarketAdminBrokerManagement";
import MarketAdminInsurerManagement from "./pages/MarketAdminInsurerManagement";
import MastersProductSelection from "./pages/MastersProductSelection";
import CARMastersManagement from "./pages/CARMastersManagement";
import PIMastersManagement from "./pages/PIMastersManagement";
import CreateInsurer from "./pages/CreateInsurer";
import EditInsurer from "./pages/EditInsurer";
import CreateBroker from "./pages/CreateBroker";
import EditBroker from "./pages/EditBroker";
import BrokerDetailsView from "./pages/BrokerDetailsView";
import BrokerConfiguration from "./pages/BrokerConfiguration";
import ProductsList from "./pages/ProductsList";
import MarketAdminProductsList from "./pages/MarketAdminProductsList";
import MarketAdminSingleProductConfig from "./pages/MarketAdminSingleProductConfig";
import MarketAdminBrokerConfigurator from "./pages/MarketAdminBrokerConfigurator";
import MarketAdminQuoteFormat from "./pages/MarketAdminQuoteFormat";
import SingleProductConfig from "./pages/SingleProductConfig";
import PIProposal from "./pages/PIProposal";
import BrokerConfigurator from "./pages/BrokerConfigurator";
import QuoteFormat from "./pages/QuoteFormat";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        
        <Routes>
          <Route path="/" element={<FlowSelection />} />
          
          {/* Login Routes */}
          <Route path="/broker/login" element={<BrokerLogin />} />
          <Route path="/insurer/login" element={<InsurerLogin />} />
          <Route path="/admin/login" element={<MarketAdminLogin />} />
          
          {/* Broker Routes */}
          <Route path="/broker" element={<BrokerLayout />}>
            <Route index element={<BrokerDashboard />} />
            <Route path="dashboard" element={<BrokerDashboard />} />
            <Route path="user-management" element={<BrokerUserManagement />} />
            <Route path="add-user" element={<AddUser />} />
            <Route path="edit-user/:userId" element={<EditUser />} />
            <Route path="quote/:id/edit" element={<Proposal />} />
            <Route path="quote/:id" element={<QuoteDetails />} />
            <Route path="policy/:id" element={<PolicyDetails />} />
          </Route>
          <Route path="/broker/edit-user/:userId" element={<EditUser />} />
          <Route path="/broker/manage-insurers" element={<ManageInsurers />} />
          <Route path="/broker/insurer/:insurerId/dashboard" element={<InsurerDetailDashboard />} />
          <Route path="/insurer/:insurerId/product-config" element={<InsurerProductConfig />} />
          
          {/* Market Admin Routes - Protected */}
          <Route path="/market-admin" element={<RequireAuth requiredRole="admin"><MarketAdminLayout /></RequireAuth>}>
            <Route path="dashboard" element={<MarketAdminDashboard />} />
            <Route path="masters-management" element={<MastersProductSelection />} />
            <Route path="masters-management/car" element={<CARMastersManagement />} />
            <Route path="masters-management/pi" element={<PIMastersManagement />} />
            <Route path="broker-management" element={<MarketAdminBrokerManagement />} />
            <Route path="broker/:brokerId/details" element={<BrokerDetailsView />} />
            <Route path="broker/:brokerId/configure" element={<BrokerConfiguration />} />
            <Route path="broker/:brokerId/quote/:quoteId" element={<QuoteDetails />} />
            <Route path="insurer-management" element={<MarketAdminInsurerManagement />} />
            <Route path="insurers" element={<MarketAdminInsurerManagement />} />
            <Route path="insurers/:insurerId" element={<InsurerDetailDashboard />} />
            <Route path="create-insurer" element={<CreateInsurer />} />
            <Route path="insurer/:insurerId/edit" element={<EditInsurer />} />
            <Route path="create-broker" element={<CreateBroker />} />
            <Route path="broker/:brokerId/edit" element={<EditBroker />} />
            
            <Route path="insurer/:insurerId/dashboard" element={<InsurerDetailDashboard />} />
            <Route path="insurer/:insurerId/quote/:quoteId" element={<QuoteDetails />} />
            <Route path="insurer/:insurerId/policy/:id" element={<PolicyDetails />} />
            <Route path="broker/:brokerId/policy/:id" element={<PolicyDetails />} />
            <Route path="quote/:quoteId" element={<QuoteDetails />} />
            <Route path="policy/:id" element={<PolicyDetails />} />
            <Route path="insurer/:insurerId/product-config" element={<InsurerProductConfig />} />
            <Route path="insurer/:insurerId/product-config/broker-configurator" element={<MarketAdminBrokerConfigurator />} />
            <Route path="insurer/:insurerId/product-config/quote-format" element={<MarketAdminQuoteFormat />} />
            <Route path="insurer/:insurerId/product-config/products" element={<MarketAdminProductsList />} />
            <Route path="insurer/:insurerId/product-config/products/:productId" element={<MarketAdminSingleProductConfig />} />
            <Route path="insurer/:insurerId/pricing-config" element={<InsurerPricingConfig />} />
            <Route path="product-config" element={<ProductConfig />} />
          </Route>
          <Route path="/market-admin/insurer/:insurerId/products/2" element={<PIProductConfig />} />
          {/* Product Selection */}
          <Route path="/broker/product-selection" element={<ProductSelection />} />
          
          {/* Product-specific proposal forms */}
          <Route path="/customer/proposal/:productCode" element={<ProposalRouter />} />
          
          {/* Legacy route - redirect to CAR proposal for backward compatibility */}
          <Route path="/customer/proposal" element={<Proposal />} />
          <Route path="/customer/documents" element={<Documents />} />
          <Route path="/customer/quotes" element={<Quotes />} />
          <Route path="/customer/cew-customization" element={<CEWCustomization />} />
          {/* Declaration route removed - now handled within ProposalForm */}
          <Route path="/customer/payment" element={<Payment />} />
          <Route path="/customer/success" element={<Success />} />
          <Route path="/customer/pi-success" element={<PISuccess />} />
          {/* Insurer Routes */}
          <Route path="/insurer" element={<InsurerLayout />}>
            <Route index element={<InsurerDashboard />} />
            <Route path="dashboard" element={<InsurerDashboard />} />
            <Route path="user-management" element={<InsurerUserManagement />} />
            <Route path="product-config" element={<InsurerProductConfig />} />
            <Route path="broker-assignments" element={<div />} />
            <Route path="product-config/products" element={<ProductsList />} />
            <Route path="product-config/products/:productId" element={<SingleProductConfig />} />
            <Route path="product-config/broker-configurator" element={<BrokerConfigurator />} />
            <Route path="product-config/quote-format" element={<QuoteFormat />} />
            <Route path="add-user" element={<AddInsurerUser />} />
            <Route path="edit-user/:userId" element={<EditInsurerUser />} />
            <Route path="quote/:id" element={<QuoteDetails />} />
            <Route path="policy/:id" element={<PolicyDetails />} />
          </Route>
          <Route path="/insurer/products" element={<ProductsList />} />
          <Route path="/insurer/products/:productId" element={<SingleProductConfig />} />
          <Route path="/insurer/products/2" element={<PIProductConfig />} />
          <Route path="/insurer/product-config/new" element={<CreatePlan />} />
          <Route path="/insurer/:insurerId/pricing-config" element={<InsurerPricingConfig />} />
          {/* Legacy routes - removed for standardization */}
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
