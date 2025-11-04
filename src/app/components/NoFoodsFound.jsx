import { SearchX } from "lucide-react"; // lucide-react icons

export default function NoFoodsFound() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-xl">
      <div className="bg-orange-100 p-4 rounded-full">
        <SearchX className="w-10 h-10 text-orange-500" />
      </div>

      <h2 className="text-xl font-semibold text-gray-800 mt-4">
        No Foods Found
      </h2>

      <p className="text-gray-500 mt-2 text-center max-w-sm">
        We couldn’t find any meals that match your search. Try checking your spelling,
        adjusting your filters, or exploring other categories.
      </p>

      <button
        onClick={() => window.location.reload()}
        className="mt-6 px-5 py-2 bg-orange-500 text-white font-medium rounded-lg shadow hover:bg-orange-600 transition-all duration-300"
      >
        Refresh Search
      </button>
    </div>
  );
}
