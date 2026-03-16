export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="w-10 h-10 border-4 border-red-100 border-t-red-600 rounded-full animate-spin" />
    </div>
  );
}
