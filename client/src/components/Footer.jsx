export default function Footer() {
  return (
    <footer className="mt-16 border-t-2 border-gray-100 bg-white">
      <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-red-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-black">T</span>
          </div>
          <span className="font-black text-gray-900">TECH<span className="text-red-600">ZONE</span></span>
        </div>
        <p className="text-gray-400 text-sm font-medium">© 2025 TECHZONE · อุปกรณ์คอมพิวเตอร์ครบวงจร</p>
        <div className="flex items-center gap-4 text-gray-400 text-sm font-medium">
          <span>🖥️ CPU</span>
          <span>🎮 GPU</span>
          <span>💾 Storage</span>
          <span>⌨️ Peripherals</span>
        </div>
      </div>
    </footer>
  );
}
