import Image from "next/image";
import FoodList from "./components/users/FoodList/FoodList";

export default function Home() {
  return (
    <div className="flex min-h-screen bg-zinc-50 font-sans">
      <FoodList/>
    </div>
  );
}
