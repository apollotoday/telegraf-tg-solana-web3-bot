'use client'

import React from 'react'


export default function MarketMakingPage({
  params,
}: {
  params: { customerId: string }
}) {
  const id = params.customerId

  return (
    <main>
      <h1>{id}</h1>
    </main>
  )
}