export default function Input({ label, ...props }) {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-widest">
          {label}
        </label>
      )}
      <input
        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-red-500 outline-none text-sm text-gray-800 font-medium transition-colors bg-gray-50 focus:bg-white placeholder-gray-400"
        {...props}
      />
    </div>
  );
}
