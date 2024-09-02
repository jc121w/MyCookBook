import { ChevronsLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";

export const BackButton = () => {
  const router = useRouter();
  return (
    <button
      className="border rounded-xl w-24 h-12 flex items-center justify-center mt-5 duration-200 select-none hover:scale-[1.15] transition-all hover:bg-slate-200"
      onClick={() => router.back()}
    >
      <ChevronsLeft /> Back
    </button>
  );
};
