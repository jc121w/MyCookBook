import { ChevronsLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";

const BackButton = () => {
  const router = useRouter();
  return (
    <button className="btn btn-ghost" onClick={() => router.back()}>
      <ChevronsLeft /> Back
    </button>
  );
};

export default BackButton;
