"use client";

import { ChakraProvider, defaultSystem } from "@chakra-ui/react";

type ProviderProps = {
  children: React.ReactNode;
};

const Providers: React.FC<ProviderProps> = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return <ChakraProvider value={defaultSystem}>{children}</ChakraProvider>;
};

export default Providers;
