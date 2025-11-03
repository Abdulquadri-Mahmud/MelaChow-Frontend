"use client";
import { FaEdit, FaTrash } from "react-icons/fa";

export default function FoodTable({ foods, onEdit, onDelete }) {
  return (
    <div className="overflow-x-auto bg-white shadow-sm rounded-lg">
      <table className="min-w-full text-sm text-left">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-3">Image</th>
            <th className="p-3">Name</th>
            <th className="p-3">Category</th>
            <th className="p-3">Price</th>
            <th className="p-3">Availability</th>
            <th className="p-3">Rating</th>
            <th className="p-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {foods.map((food) => (
            <tr key={food._id} className="border-t hover:bg-gray-50 transition">
              <td className="p-3">
                <img
                  src={food.image || "https://via.placeholder.com/40"}
                  alt={food.name}
                  className="w-12 h-12 object-cover rounded-md"
                />
              </td>
              <td className="p-3">{food.name}</td>
              <td className="p-3">{food.category}</td>
              <td className="p-3 text-[#FF6600] font-semibold">${food.price}</td>
              <td className="p-3">{food.availability ? "✅" : "❌"}</td>
              <td className="p-3">{food.rating || "—"}</td>
              <td className="p-3 flex gap-2">
                <button
                  onClick={() => onEdit(food)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <FaEdit />
                </button>
                <button
                  onClick={() => onDelete(food)}
                  className="text-red-500 hover:text-red-700"
                >
                  <FaTrash />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
