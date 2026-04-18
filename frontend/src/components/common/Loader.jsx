export default function Loader({ size = 'md', text = '' }) {
  const sizes = { sm: 'h-5 w-5', md: 'h-10 w-10', lg: 'h-16 w-16' };
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <div className={`${sizes[size]} border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin`} />
      {text && <p className="text-gray-500 text-sm">{text}</p>}
    </div>
  );
}
