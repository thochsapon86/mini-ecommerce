export default function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "popIn 0.25s ease" }}
      >
        <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100">
          <h2 className="text-xl font-black text-gray-900 tracking-tight">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors text-lg font-bold"
          >✕</button>
        </div>
        <div className="px-7 py-6">{children}</div>
      </div>
    </div>
  );
}
