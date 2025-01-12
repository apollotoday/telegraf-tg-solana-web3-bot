'use server'

import React from 'react'
import { Box, Text } from "@chakra-ui/react";
import prisma from '../../../../src/lib/prisma'

export async function getMarketMakingInfoForCustomer(customerId: string) {

  const customer = await prisma.botCustomer.findUnique({
    where: {
      id: customerId
    }
  })

  if (!customer) {
    throw new Error('Customer not found')
  }

  const bookedService = await prisma.bookedService.findFirst({
    where: {
      botCustomerId: customerId,
      type: 'MARKET_MAKING',
      isActive: true,
      awaitingFunding: false
    },
    include: {
      usedSplToken: true,
      poolForService: true
    }
  })

  if (!bookedService) {
    throw new Error('Market making service not found')
  }

  const marketMakingCycle = await prisma.marketMakingCycle.findFirst({
    where: {
      bookedServiceId: bookedService.id,
      isActive: true
    }
  })

  if (!marketMakingCycle) {
    throw new Error('Market making cycle not found')
  }

  const botCustomerWallets = await prisma.botCustomerWallet.findMany({
    where: {
      botCustomerId: customerId,
      type: 'MARKET_MAKING'
    },
    select: {
      pubkey: true,
      latestSolBalance: true,
      latestTokenBalance: true,
      createdAt: true,
      updatedAt: true
    }
  })

  const marketMakingJobs = await prisma.marketMakingJob.findMany({
    where: {
      cycleId: marketMakingCycle.id
    },
  })


  return {
    customer,
    bookedService,
    marketMakingCycle,
    botCustomerWallets,
    marketMakingJobs,
    usedToken: bookedService.usedSplTokenMint,
    liquidityPoolInfo: bookedService.poolForService
  }
}


export async function MarketMakingDashboardForCustomer({ customerId }: { customerId: string }) {
  const marketMakingInfo = await getMarketMakingInfoForCustomer(customerId)

  return (
    <Box>
      <Text>Hi {marketMakingInfo.customer.name}</Text>
    </Box>
  )
}

