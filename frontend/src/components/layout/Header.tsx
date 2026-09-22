import { Sparkles, ChevronDown, Bell } from 'lucide-react';

export default function Header() {
  return (
    <header className="w-full bg-white border-b border-gray-100 px-6 py-2.5 flex items-center justify-between font-sans">
      {/* Left side: Subtitle / Branding description */}
      <div className="flex items-center">
        <span className="text-xs font-medium text-slate-400 tracking-wide">
          AI-Powered Pharmaceutical Research & Compliance Assistant
        </span>
      </div>

      {/* Right side controls */}
      <div className="flex items-center space-x-4">
        {/* PharmAgent OS Tag/Button */}
        <div className="flex items-center space-x-2 bg-purple-50/60 hover:bg-purple-100/60 text-purple-700 px-3 py-1.5 rounded-lg border border-purple-100 cursor-pointer transition-colors">
          <Sparkles className="w-4 h-4 text-purple-600" />
          <span className="text-xs font-semibold">PharmAgent OS</span>
          <span className="bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider">
            New
          </span>
        </div>

        {/* LLM Selector Dropdown */}
        <div className="flex items-center space-x-2 bg-white border border-gray-200 hover:border-gray-300 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 cursor-pointer shadow-sm transition-all">
          <span className="text-slate-400">LLM:</span>
          <span className="font-semibold text-slate-800">Groq (Llama 3.3 70B)</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
        </div>

        {/* Divider */}
        <div className="h-6 w-[1px] bg-gray-200 mx-1" />

        {/* Notification Bell */}
        <button className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-gray-100 rounded-full transition-colors relative">
          <Bell className="w-4 h-4" />
        </button>

        {/* User Profile */}
        <div className="flex items-center space-x-2.5 pl-1 cursor-pointer group">
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-semibold text-xs shadow-sm">
            JD
          </div>
          {/* User Details */}
          <div className="flex flex-col text-left">
            <span className="text-xs font-semibold text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors">
              John Doe
            </span>
            <span className="text-[10px] text-slate-400 leading-tight">
              Pharma Analyst
            </span>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-colors" />
        </div>
      </div>
    </header>
  );
}