export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-red-100 rounded-full opacity-40 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-red-50 rounded-full opacity-60 blur-3xl" />
      </div>
      <div className="relative w-full max-w-md" style={{ animation: "popIn 0.3s ease" }}>
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-600 rounded-2xl shadow-xl shadow-red-200 mb-4">
            <span className="text-white text-3xl font-black">T</span>
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">
            TECH<span className="text-red-600">ZONE</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1 font-medium">{subtitle}</p>
        </div>
        <div className="bg-white rounded-3xl shadow-2xl shadow-gray-200/60 border border-gray-100 p-8">
          <h2 className="text-2xl font-black text-gray-900 mb-6">{title}</h2>
          {children}
        </div>
      </div>
    </div>
  );
}
