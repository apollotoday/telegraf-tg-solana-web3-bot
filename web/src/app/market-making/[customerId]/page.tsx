'use server'

import React from 'react'
import { getMarketMakingInfoForCustomer } from '../../api/marketMakingInfo'
import { Box, Text, VStack } from '@chakra-ui/react'

export default async function MarketMakingPage({ params }: { params: Promise<{ customerId: string }> }) {
  const customerId = (await params).customerId
  const marketMakingInfo = await getMarketMakingInfoForCustomer(customerId)

  return (
    <main className='w-full'>
      <Box className='mb-[150px]'>
        <Text>Hi {marketMakingInfo.customer.name}</Text>
        <Box className='w-full'>
          <VStack alignItems={'flex-start'} justifyContent={'flex-start'}>
            <Text>Your Market Making Info</Text>
            <Text>Market making for: {marketMakingInfo.usedToken.name}</Text>
            <Text>
              Price: ${marketMakingInfo.usedToken.lastUsdcPrice?.toFixed(5)} (24hr:
              <span style={{ color: (marketMakingInfo.usedToken.priceChange24hPercent ?? 0) >= 0 ? '#77dd77' : '#ff6961' }}>
                {(marketMakingInfo.usedToken.priceChange24hPercent ?? 0).toFixed(2)}%
              </span>
              )
            </Text>
            <Text>
              Volume:
              <VStack gap={2}>
                <Text>1hr: ${marketMakingInfo.usedToken.v1hUSD?.toFixed(2)}</Text>
                <Box display="flex" alignItems="center" width="100%" height="6px" borderRadius="5px" overflow="hidden">
                  <Box width={`${(marketMakingInfo.usedToken.vBuy1hUSD ?? 0 / (marketMakingInfo.usedToken.v1hUSD ?? 0)) * 100}%`} bg="#77dd77" height="100%"></Box>
                  <Box width={`${(marketMakingInfo.usedToken.vSell1hUSD ?? 0 / (marketMakingInfo.usedToken.v1hUSD ?? 0)) * 100}%`} bg="#ff6961" height="100%"></Box>
                </Box>
                <Text>Buy: ${marketMakingInfo.usedToken.vBuy1hUSD?.toFixed(2)} / Sell: ${marketMakingInfo.usedToken.vSell1hUSD?.toFixed(2)}</Text>
                
                <Text>2hr: ${marketMakingInfo.usedToken.v2hUSD?.toFixed(2)}</Text>
                <Box display="flex" alignItems="center" width="100%" height="6px" borderRadius="5px" overflow="hidden">
                  <Box width={`${(marketMakingInfo.usedToken.vBuy2hUSD ?? 0 / (marketMakingInfo.usedToken.v2hUSD ?? 0)) * 100}%`} bg="#77dd77" height="100%"></Box>
                  <Box width={`${(marketMakingInfo.usedToken.vSell2hUSD ?? 0 / (marketMakingInfo.usedToken.v2hUSD ?? 0)) * 100}%`} bg="#ff6961" height="100%"></Box>
                </Box>
                <Text>Buy: ${marketMakingInfo.usedToken.vBuy2hUSD?.toFixed(2)} / Sell: ${marketMakingInfo.usedToken.vSell2hUSD?.toFixed(2)}</Text>
                
                <Text>4hr: ${marketMakingInfo.usedToken.v4hUSD?.toFixed(2)}</Text>
                <Box display="flex" alignItems="center" width="100%" height="6px" borderRadius="5px" overflow="hidden">
                  <Box width={`${(marketMakingInfo.usedToken.vBuy4hUSD ?? 0 / (marketMakingInfo.usedToken.v4hUSD ?? 0)) * 100}%`} bg="#77dd77" height="100%"></Box>
                  <Box width={`${(marketMakingInfo.usedToken.vSell4hUSD ?? 0 / (marketMakingInfo.usedToken.v4hUSD ?? 0)) * 100}%`} bg="#ff6961" height="100%"></Box>
                </Box>
                <Text>Buy: ${marketMakingInfo.usedToken.vBuy4hUSD?.toFixed(2)} / Sell: ${marketMakingInfo.usedToken.vSell4hUSD?.toFixed(2)}</Text>
                
                <Text>8hr: ${marketMakingInfo.usedToken.v8hUSD?.toFixed(2)}</Text>
                <Box display="flex" alignItems="center" width="100%" height="6px" borderRadius="5px" overflow="hidden">
                  <Box width={`${(marketMakingInfo.usedToken.vBuy8hUSD ?? 0 / (marketMakingInfo.usedToken.v8hUSD ?? 0)) * 100}%`} bg="#77dd77" height="100%"></Box>
                  <Box width={`${(marketMakingInfo.usedToken.vSell8hUSD ?? 0 / (marketMakingInfo.usedToken.v8hUSD ?? 0)) * 100}%`} bg="#ff6961" height="100%"></Box>
                </Box>
                <Text>Buy: ${marketMakingInfo.usedToken.vBuy8hUSD?.toFixed(2)} / Sell: ${marketMakingInfo.usedToken.vSell8hUSD?.toFixed(2)}</Text>
                
                <Text>24hr: ${marketMakingInfo.usedToken.v24hUSD?.toFixed(2)}</Text>
                <Box display="flex" alignItems="center" width="100%" height="6px" borderRadius="5px" overflow="hidden">
                  <Box width={`${(marketMakingInfo.usedToken.vBuy24hUSD ?? 0 / (marketMakingInfo.usedToken.v24hUSD ?? 0)) * 100}%`} bg="#77dd77" height="100%"></Box>
                  <Box width={`${(marketMakingInfo.usedToken.vSell24hUSD ?? 0 / (marketMakingInfo.usedToken.v24hUSD ?? 0)) * 100}%`} bg="#ff6961" height="100%"></Box>
                </Box>
                <Text>Buy: ${marketMakingInfo.usedToken.vBuy24hUSD?.toFixed(2)} / Sell: ${marketMakingInfo.usedToken.vSell24hUSD?.toFixed(2)}</Text>
              </VStack>
            </Text>
          </VStack>
        </Box>
      </Box>
    </main>
  )
}
