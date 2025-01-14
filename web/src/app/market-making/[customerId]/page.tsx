"use server";

import React from "react";
import { getMarketMakingInfoForCustomer } from "../../api/marketMakingInfo";
import { Box, Text } from "@chakra-ui/react";

export default async function MarketMakingPage({
  params,
}: {
  params: Promise<{ customerId: string }>;
}) {
  const customerId = (await params).customerId;
  const marketMakingInfo = await getMarketMakingInfoForCustomer(customerId);

  return (
    <main>
      <Box>
        <Text>Hi {marketMakingInfo.customer.name}</Text>
      </Box>
    </main>
  );
}
