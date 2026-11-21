"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { FC, ReactNode } from "react";
import { Toaster } from "@/components/Toaster";

interface ProvidersProps {
  children: ReactNode;
}
const queryClient = new QueryClient();
const Providers: FC<ProvidersProps> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster>{children}</Toaster>
    </QueryClientProvider>
  );
};

export default Providers;
