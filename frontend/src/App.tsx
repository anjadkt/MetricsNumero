import AppLayout from "./components/layout/AppLayout";
import Home from "./pages/Home";
import AnalysisWorkspace from "./pages/AnalysisWorkspace";
import Auth from "./pages/Auth";
import DocumentLibrary from "./pages/DocumentLibrary";
import ComplianceAssistant from "./pages/ComplianceAssistant";
import PharmaAgentOS from "./pages/PharmaAgentOS";
import ReportsExports from "./pages/ReportsExports";
import { BrowserRouter, Route, Routes } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Authentication */}
        <Route path="/auth" element={<Auth />} />

        {/* Application */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/documents" element={<DocumentLibrary />} />
          <Route path="/analysis" element={<AnalysisWorkspace />} />
          <Route path="/compliance" element={<ComplianceAssistant />} />
          <Route path="/pharma-agent-os" element={<PharmaAgentOS />} />
          <Route path="/reports" element={<ReportsExports />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;