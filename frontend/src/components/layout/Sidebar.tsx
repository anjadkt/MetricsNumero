import {
  Home,
  FileText,
  LayoutGrid,
  ShieldCheck,
  Cpu,
  FileSpreadsheet,
  Settings,
  HelpCircle,
  ArrowRight,
} from "lucide-react";

import { useLocation, useNavigate } from "react-router-dom";

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const mainNavItems = [
    {
      name: "Home",
      icon: Home,
      path: "/",
    },
    {
      name: "Document Library",
      icon: FileText,
      path: "/documents",
      badge: "5",
    },
    {
      name: "Analysis Workspace",
      icon: LayoutGrid,
      path: "/analysis",
    },
    {
      name: "Compliance Assistant",
      icon: ShieldCheck,
      path: "/compliance",
    },
    {
      name: "PharmAgent OS",
      icon: Cpu,
      path: "/pharma-agent-os",
      isNew: true,
    },
    {
      name: "Reports & Exports",
      icon: FileSpreadsheet,
      path: "/reports",
    },
  ];

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }

    return location.pathname.startsWith(path);
  };

  return (
    <aside className="w-64 h-screen bg-white border-r border-gray-100 flex flex-col justify-between p-4 font-sans select-none">
      <div>
        {/* Logo Header */}
        <div className="flex items-center space-x-3 px-3 py-2 mb-6">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-md shadow-blue-500/20">
            <span className="text-white font-black text-sm tracking-tighter">
              M
            </span>
          </div>

          <span className="text-xl font-bold text-slate-900 tracking-tight">
            MetricsNumero
          </span>
        </div>

        {/* Main Navigation */}
        <nav className="space-y-1">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <button
                key={item.name}
                onClick={() => navigate(item.path)}
                className={`w-full cursor-pointer flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all relative ${
                  active
                    ? "bg-blue-50/80 text-blue-600"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                {/* Active Indicator */}
                {active && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 bg-blue-600 rounded-r-full" />
                )}

                <div className="flex items-center space-x-3">
                  <Icon
                    className={`w-4 h-4 ${
                      active ? "text-blue-600" : "text-slate-500"
                    }`}
                  />

                  <span>{item.name}</span>
                </div>

                {/* Badge */}
                {item.badge && (
                  <span className="bg-blue-100 text-blue-600 text-[11px] font-bold px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}

                {/* New Badge */}
                {item.isNew && (
                  <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    New
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="space-y-4 pt-4">
        <div className="space-y-1">
          {/* Settings */}
          <button
            onClick={() => navigate("/settings")}
            className={`w-full flex items-center space-x-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
              isActive("/settings")
                ? "bg-blue-50 text-blue-600"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <Settings className="w-4 h-4 text-slate-500" />
            <span>Settings</span>
          </button>

          {/* Help */}
          <button
            onClick={() => navigate("/help")}
            className={`w-full flex items-center space-x-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
              isActive("/help")
                ? "bg-blue-50 text-blue-600"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <HelpCircle className="w-4 h-4 text-slate-500" />
            <span>Help & Support</span>
          </button>
        </div>

        {/* Promo Card */}
        <div className="bg-gradient-to-br from-blue-50/60 to-indigo-50/60 border border-blue-100/80 rounded-2xl p-4 text-left">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-red-500 font-extrabold text-sm tracking-tight">
              tcs
            </span>

            <span className="text-blue-900 font-bold text-xs">
              TCS Inspired Innovation
            </span>
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
            Inspired by TCS's Agentic AI platform for faster, safer and smarter
            drug development.
          </p>

          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2 px-3 rounded-lg flex items-center justify-center space-x-1.5 shadow-sm shadow-blue-500/20 transition-colors">
            <span>Learn More</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
