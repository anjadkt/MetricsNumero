import Header from './Header';
import Sidebar from './Sidebar';

export default function AppLayout({ children }: { children?: React.ReactNode }) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50">
      {/* Sidebar Component */}
      <Sidebar />

      {/* Main Container */}
      <div className="flex flex-col flex-1 h-full overflow-hidden">
        {/* Header Component */}
        <Header />

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children || (
            <div className="flex flex-col items-center justify-center h-full border-2 border-dashed border-gray-200 rounded-2xl bg-white/50 text-slate-400">
              <p className="text-sm font-medium">Main Content Area</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}