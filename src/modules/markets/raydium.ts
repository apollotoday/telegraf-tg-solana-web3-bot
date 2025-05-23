import {
  Market as RayMarket,
  Liquidity,
  LIQUIDITY_STATE_LAYOUT_V4,
  LiquidityPoolJsonInfo,
  LIQUIDITY_STATE_LAYOUT_V5,
  TokenAmount,
  LiquidityStateV4,
  LiquidityStateV5,
  LiquidityPoolKeys,
  _SERUM_PROGRAM_ID_V3,
  Percent,
  Token,
  SwapSide,
  LiquidityPoolInfo,
  MARKET_STATE_LAYOUT_V3,
  ApiPoolInfoV4,
  jsonInfo2PoolKeys,
  Market,
} from '@raydium-io/raydium-sdk'
import {
  AccountLayout,
  MintLayout,
  NATIVE_MINT,
  TOKEN_PROGRAM_ID,
  createCloseAccountInstruction,
  createSyncNativeInstruction,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountIdempotentInstruction,
} from '@solana/spl-token'
import {
  PublicKey,
  Signer,
  SystemProgram,
  ComputeBudgetProgram,
  TransactionInstruction,
  Keypair,
  Connection,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js'
import { BN } from '@project-serum/anchor'
import { toBufferBE } from 'bigint-buffer'
import { TransactionMessage, VersionedTransaction } from '@solana/web3.js'
// import { connection, puffAddr, solAddr } from "../../config"
import { primaryRpcConnection, net, primaryStakedRpcConnection, buyCounts, buyAmount } from '../../config'
import { calculatePartionedSwapAmount } from '../../calculationUtils'
import { getJitoFeeInstructions, sendAndConfirmJitoBundle, sendAndConfirmJitoTransactionViaRPC } from '../../jitoUtils'
import _ from 'lodash'
import { sendAndConfirmVersionedTransactionAndRetry, solToLamports } from '../../solUtils'
import { sendAndConfirmTransactionAndRetry } from '../solTransaction/solSendTransactionUtils'
import reattempt from 'reattempt'
import { decryptWallet } from '../wallet/walletUtils'
import { sleep } from '../utils/timeUtils'

export type BuyFromPoolInput = {
  poolKeys: LiquidityPoolKeys
  amountIn: TokenAmount
  amountOut: TokenAmount
  user: PublicKey
  feePayer?: PublicKey
  fixedSide: SwapSide
  tokenAccountIn: PublicKey
  tokenAccountOut: PublicKey
}

export type ComputeBuyAmountInput = {
  poolKeys: LiquidityPoolKeys
  user: PublicKey
  amount: number
  inputAmountType: 'send' | 'receive'
  buyToken: 'base' | 'quote'
  slippage?: Percent
}

export class BaseRay {
  private cacheIxs: TransactionInstruction[]
  // private pools: LiquidityPoolJsonInfo[];
  private pools: Map<string, LiquidityPoolJsonInfo>
  private cachedPoolKeys: Map<string, LiquidityPoolKeys>
  ammProgramId: PublicKey
  private orderBookProgramId: PublicKey
  private feeDestinationId: PublicKey

  constructor() {
    this.cacheIxs = []
    this.cachedPoolKeys = new Map()
    this.pools = new Map()
    if (net == 'devnet') {
      console.log('devnet')
      this.ammProgramId = new PublicKey('HWy1jotHpo6UqeQxx49dpYYdQB8wj9Qk9MdxwjLvDHB8')
      this.feeDestinationId = new PublicKey('3XMrhbv989VxAMi3DErLV9eJht1pHppW5LbKxe9fkEFR')
      this.orderBookProgramId = new PublicKey('EoTcMgcDRTJVZDMZWBoU6rhYHZfkNTVEAfz3uUJRcYGj')
    } else {
      console.log('mainnet')
      this.ammProgramId = new PublicKey('675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8')
      this.feeDestinationId = new PublicKey('7YttLkHDoNj9wyDur5pM1ejNaAvT9X4eqaYcHQqtj2G5')
      this.orderBookProgramId = new PublicKey('srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX')
    }
  }

  async getMarketInfo(marketId: PublicKey) {
    const marketAccountInfo = await primaryRpcConnection.getAccountInfo(marketId, 'confirmed').catch((error: any) => null)
    if (!marketAccountInfo) throw 'Market not found'
    try {
      return RayMarket.getLayouts(3).state.decode(marketAccountInfo.data)
    } catch (parseMeketDataError) {
      // log({ parseMeketDataError })
    }
    return null
  }

  private ixsAdderCallback = (ixs: TransactionInstruction[] = []) => {
    this.cacheIxs.push(...ixs)
  }

  reInit = () => (this.cacheIxs = [])
  getPoolInfo = (poolId: string) => this.pools.get(poolId)

  async getPoolKeys(poolId: PublicKey): Promise<LiquidityPoolKeys> {
    if (!this.pools) this.pools = new Map()
    if (!this.cachedPoolKeys) this.cachedPoolKeys = new Map()
    const cache2 = this.cachedPoolKeys.get(poolId.toBase58())
    if (cache2) {
      return cache2
    }
    // const cache = this.pools.get(poolId.toBase58())
    // if (cache) {
    //   return jsonInfo2PoolKeys(cache) as LiquidityPoolKeys
    // }

    const accountInfo = await primaryRpcConnection.getAccountInfo(poolId)
    if (!accountInfo) throw 'Pool info not found'
    let poolState: LiquidityStateV4 | LiquidityStateV5 | undefined = undefined
    let version: 4 | 5 | undefined = undefined
    let poolAccountOwner = accountInfo.owner
    if (accountInfo.data.length == LIQUIDITY_STATE_LAYOUT_V4.span) {
      poolState = LIQUIDITY_STATE_LAYOUT_V4.decode(accountInfo.data)
      version = 4
    } else if (accountInfo.data.length == LIQUIDITY_STATE_LAYOUT_V5.span) {
      poolState = LIQUIDITY_STATE_LAYOUT_V5.decode(accountInfo.data)
      version = 5
    } else throw 'Invalid Pool data lenght'
    if (!poolState || !version) throw 'Invalid pool address'

    let {
      authority,
      baseDecimals,
      baseMint,
      baseVault,
      configId,
      id,
      lookupTableAccount,
      lpDecimals,
      lpMint,
      lpVault,
      marketAuthority,
      marketId,
      marketProgramId,
      marketVersion,
      nonce,
      openOrders,
      programId,
      quoteDecimals,
      quoteMint,
      quoteVault,
      targetOrders,
      // version,
      withdrawQueue,
    } = Liquidity.getAssociatedPoolKeys({
      baseMint: poolState.baseMint,
      baseDecimals: poolState.baseDecimal.toNumber(),
      quoteMint: poolState.quoteMint,
      quoteDecimals: poolState.quoteDecimal.toNumber(),
      marketId: poolState.marketId,
      marketProgramId: poolState.marketProgramId,
      marketVersion: 3,
      programId: poolAccountOwner,
      version,
    })
    if (lpMint.toBase58() != poolState.lpMint.toBase58()) {
      throw 'Found some invalid keys'
    }

    // log({ version, baseMint: baseMint.toBase58(), quoteMint: quoteMint.toBase58(), lpMint: lpMint.toBase58(), marketId: marketId.toBase58(), marketProgramId: marketProgramId.toBase58() })
    let marketState: any = undefined
    const marketAccountInfo = await primaryRpcConnection.getAccountInfo(marketId).catch((error) => null)
    if (!marketAccountInfo) throw 'Market not found'
    try {
      marketState = RayMarket.getLayouts(marketVersion).state.decode(marketAccountInfo.data)
      // if (mProgramIdStr != _SERUM_PROGRAM_ID_V3 && mProgramIdStr != _OPEN_BOOK_DEX_PROGRAM) {
      // }
    } catch (parseMeketDataError) {
      console.log({ parseMeketDataError })
    }
    if (!marketState) throw 'MarketState not found'
    const {
      baseVault: marketBaseVault,
      quoteVault: marketQuoteVault,
      eventQueue: marketEventQueue,
      bids: marketBids,
      asks: marketAsks,
    } = marketState
    const res: LiquidityPoolKeys = {
      baseMint,
      quoteMint,
      quoteDecimals,
      baseDecimals,
      authority,
      baseVault,
      quoteVault,
      id,
      lookupTableAccount,
      lpDecimals,
      lpMint,
      lpVault,
      marketAuthority,
      marketId,
      marketProgramId,
      marketVersion,
      openOrders,
      programId,
      targetOrders,
      version,
      withdrawQueue,
      marketAsks,
      marketBids,
      marketBaseVault,
      marketQuoteVault,
      marketEventQueue,
    }
    this.cachedPoolKeys.set(poolId.toBase58(), res)
    // log({ poolKeys: res })
    return res
  }

  async buyFromPool(input: BuyFromPoolInput): Promise<{ ixs: TransactionInstruction[]; signers: Signer[]; amount: number }> {
    this.reInit()
    const updateCPIx = ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 500_001 })
    const updateCLIx = ComputeBudgetProgram.setComputeUnitLimit({ units: 100_000 })
    const { amountIn, amountOut, poolKeys, user, fixedSide, tokenAccountIn, tokenAccountOut, feePayer } = input
    this.cacheIxs.push(updateCPIx, updateCLIx)

    const inToken = (amountIn as TokenAmount).token.mint

    const createInAtaInx = createAssociatedTokenAccountIdempotentInstruction(
      user,
      tokenAccountIn,
      user,
      (amountIn as TokenAmount).token.mint,
    )
    const createOutAtaInx = createAssociatedTokenAccountIdempotentInstruction(
      user,
      tokenAccountOut,
      user,
      (amountOut as TokenAmount).token.mint,
    )
    this.cacheIxs.push(createInAtaInx, createOutAtaInx)

    if (inToken.toBase58() == NATIVE_MINT.toBase58()) {
      let lamports = BigInt(amountIn.raw.toNumber())
      const sendSolIx = SystemProgram.transfer({
        fromPubkey: user,
        toPubkey: tokenAccountIn,
        lamports,
      })
      this.cacheIxs.push(sendSolIx)

      const syncWSolAta = createSyncNativeInstruction(tokenAccountIn, TOKEN_PROGRAM_ID)
      this.cacheIxs.push(syncWSolAta)
    }
    // -------------------

    let rayIxs = Liquidity.makeSwapInstruction({
      poolKeys,
      amountIn: amountIn.raw,
      amountOut: amountOut.raw,
      fixedSide,
      userKeys: { owner: user, tokenAccountIn, tokenAccountOut },
    }).innerTransaction

    if (inToken.toBase58() != NATIVE_MINT.toBase58()) {
      const unwrapSol = createCloseAccountInstruction(tokenAccountOut, user, user)
      rayIxs.instructions.push(unwrapSol)
    }

    return {
      ixs: [...this.cacheIxs, ...rayIxs.instructions],
      signers: [...rayIxs.signers],
      amount: amountOut.raw.toNumber() / Math.pow(10, amountOut.token.decimals),
    }
  }

  async computeBuyAmount(
    input: ComputeBuyAmountInput,
    etc?: { extraBaseResever?: number; extraQuoteReserve?: number; extraLpSupply?: number },
  ) {
    const { amount, buyToken, inputAmountType, poolKeys, user } = input
    const slippage = input.slippage ?? new Percent(1, 100)
    const base = poolKeys.baseMint
    const baseMintDecimals = poolKeys.baseDecimals
    const quote = poolKeys.quoteMint
    const quoteMintDecimals = poolKeys.quoteDecimals
    const baseTokenAccount = getAssociatedTokenAddressSync(base, user)
    const quoteTokenAccount = getAssociatedTokenAddressSync(quote, user)
    const baseR = new Token(TOKEN_PROGRAM_ID, base, baseMintDecimals)
    const quoteR = new Token(TOKEN_PROGRAM_ID, quote, quoteMintDecimals)
    let amountIn: TokenAmount
    let amountOut: TokenAmount
    let tokenAccountIn: PublicKey
    let tokenAccountOut: PublicKey
    const [lpAccountInfo, baseVAccountInfo, quoteVAccountInfo] = await primaryRpcConnection
      .getMultipleAccountsInfo([poolKeys.lpMint, poolKeys.baseVault, poolKeys.quoteVault].map((e) => new PublicKey(e)))
      .catch(() => [null, null, null, null])
    if (!lpAccountInfo || !baseVAccountInfo || !quoteVAccountInfo) throw 'Failed to fetch some data'
    // const lpSupply = new BN(Number(MintLayout.decode(lpAccountInfo.data).supply.toString()))
    // const baseReserve = new BN(Number(AccountLayout.decode(baseVAccountInfo.data).amount.toString()))
    // const quoteReserve = new BN(Number(AccountLayout.decode(quoteVAccountInfo.data).amount.toString()))
    const lpSupply = new BN(toBufferBE(MintLayout.decode(lpAccountInfo.data).supply, 8)).addn(etc?.extraLpSupply ?? 0)
    const baseReserve = new BN(toBufferBE(AccountLayout.decode(baseVAccountInfo.data).amount, 8)).addn(etc?.extraBaseResever ?? 0)
    const quoteReserve = new BN(toBufferBE(AccountLayout.decode(quoteVAccountInfo.data).amount, 8)).addn(
      etc?.extraQuoteReserve ?? 0,
    )
    let fixedSide: SwapSide

    const poolInfo: LiquidityPoolInfo = {
      baseDecimals: poolKeys.baseDecimals,
      quoteDecimals: poolKeys.quoteDecimals,
      lpDecimals: poolKeys.lpDecimals,
      lpSupply,
      baseReserve,
      quoteReserve,
      startTime: null as any,
      status: null as any,
    }

    if (inputAmountType == 'send') {
      fixedSide = 'out' //buy************************ */
      if (buyToken == 'base') {
        amountIn = new TokenAmount(quoteR, amount.toString(), false)
        // amountOut = Liquidity.computeAmountOut({ amountIn, currencyOut: baseR, poolInfo, poolKeys, slippage }).amountOut
        amountOut = Liquidity.computeAmountOut({ amountIn, currencyOut: baseR, poolInfo, poolKeys, slippage })
          .minAmountOut as TokenAmount
      } else {
        amountIn = new TokenAmount(baseR, amount.toString(), false)
        // amountOut = Liquidity.computeAmountOut({ amountIn, currencyOut: quoteR, poolInfo, poolKeys, slippage }).amountOut
        amountOut = Liquidity.computeAmountOut({ amountIn, currencyOut: quoteR, poolInfo, poolKeys, slippage })
          .minAmountOut as TokenAmount
      }
    } else {
      fixedSide = 'in' //sell************************ */
      if (buyToken == 'base') {
        amountOut = new TokenAmount(baseR, amount.toString(), false)
        // amountIn = Liquidity.computeAmountIn({ amountOut, currencyIn: quoteR, poolInfo, poolKeys, slippage }).amountIn
        amountIn = Liquidity.computeAmountIn({ amountOut, currencyIn: quoteR, poolInfo, poolKeys, slippage })
          .maxAmountIn as TokenAmount
      } else {
        amountIn = new TokenAmount(baseR, amount.toString(), false)
        // amountIn = Liquidity.computeAmountIn({ amountOut, currencyIn: baseR, poolInfo, poolKeys, slippage }).amountIn
        amountOut = Liquidity.computeAmountOut({ amountIn, currencyOut: quoteR, poolInfo, poolKeys, slippage })
          .minAmountOut as TokenAmount
      }
    }
    if (buyToken == 'base') {
      tokenAccountOut = baseTokenAccount
      tokenAccountIn = quoteTokenAccount
    } else {
      tokenAccountOut = quoteTokenAccount
      tokenAccountIn = baseTokenAccount
    }

    return {
      amountIn,
      amountOut,
      tokenAccountIn,
      tokenAccountOut,
      fixedSide,
    }
  }

  async computeSellAmount(
    input: ComputeBuyAmountInput,
    etc?: { extraBaseResever?: number; extraQuoteReserve?: number; extraLpSupply?: number },
  ) {
    const { amount, buyToken, inputAmountType, poolKeys, user } = input
    const slippage = input.slippage ?? new Percent(1, 100)
    const base = poolKeys.baseMint
    const baseMintDecimals = poolKeys.baseDecimals
    const quote = poolKeys.quoteMint
    const quoteMintDecimals = poolKeys.quoteDecimals
    const baseTokenAccount = getAssociatedTokenAddressSync(base, user)
    const quoteTokenAccount = getAssociatedTokenAddressSync(quote, user)
    const baseR = new Token(TOKEN_PROGRAM_ID, base, baseMintDecimals)
    const quoteR = new Token(TOKEN_PROGRAM_ID, quote, quoteMintDecimals)
    let amountIn: TokenAmount
    let amountOut: TokenAmount
    let tokenAccountIn: PublicKey
    let tokenAccountOut: PublicKey
    const [lpAccountInfo, baseVAccountInfo, quoteVAccountInfo] = await primaryRpcConnection
      .getMultipleAccountsInfo([poolKeys.lpMint, poolKeys.baseVault, poolKeys.quoteVault].map((e) => new PublicKey(e)))
      .catch(() => [null, null, null, null])
    if (!lpAccountInfo || !baseVAccountInfo || !quoteVAccountInfo) throw 'Failed to fetch some data'
    // const lpSupply = new BN(Number(MintLayout.decode(lpAccountInfo.data).supply.toString()))
    // const baseReserve = new BN(Number(AccountLayout.decode(baseVAccountInfo.data).amount.toString()))
    // const quoteReserve = new BN(Number(AccountLayout.decode(quoteVAccountInfo.data).amount.toString()))

    const lpSupply = new BN(toBufferBE(MintLayout.decode(lpAccountInfo.data).supply, 8)).addn(etc?.extraLpSupply ?? 0)
    const baseReserve = new BN(toBufferBE(AccountLayout.decode(baseVAccountInfo.data).amount, 8)).addn(etc?.extraBaseResever ?? 0)
    const quoteReserve = new BN(toBufferBE(AccountLayout.decode(quoteVAccountInfo.data).amount, 8)).addn(
      etc?.extraQuoteReserve ?? 0,
    )
    let fixedSide: SwapSide

    const poolInfo: LiquidityPoolInfo = {
      baseDecimals: poolKeys.baseDecimals,
      quoteDecimals: poolKeys.quoteDecimals,
      lpDecimals: poolKeys.lpDecimals,
      lpSupply,
      baseReserve,
      quoteReserve,
      startTime: null as any,
      status: null as any,
    }

    if (inputAmountType == 'send') {
      fixedSide = 'in'
      if (buyToken == 'base') {
        amountIn = new TokenAmount(quoteR, amount.toString(), false)
        // amountOut = Liquidity.computeAmountOut({ amountIn, currencyOut: baseR, poolInfo, poolKeys, slippage }).amountOut
        amountOut = Liquidity.computeAmountOut({ amountIn, currencyOut: baseR, poolInfo, poolKeys, slippage })
          .minAmountOut as TokenAmount
      } else {
        amountIn = new TokenAmount(baseR, amount.toString(), false)
        // amountOut = Liquidity.computeAmountOut({ amountIn, currencyOut: quoteR, poolInfo, poolKeys, slippage }).amountOut
        amountOut = Liquidity.computeAmountOut({ amountIn, currencyOut: quoteR, poolInfo, poolKeys, slippage })
          .minAmountOut as TokenAmount
      }
    } else {
      fixedSide = 'out'
      if (buyToken == 'base') {
        amountOut = new TokenAmount(baseR, amount.toString(), false)
        // amountIn = Liquidity.computeAmountIn({ amountOut, currencyIn: quoteR, poolInfo, poolKeys, slippage }).amountIn
        amountIn = Liquidity.computeAmountIn({ amountOut, currencyIn: quoteR, poolInfo, poolKeys, slippage })
          .maxAmountIn as TokenAmount
      } else {
        amountOut = new TokenAmount(quoteR, amount.toString(), false)
        // amountIn = Liquidity.computeAmountIn({ amountOut, currencyIn: baseR, poolInfo, poolKeys, slippage }).amountIn
        amountIn = Liquidity.computeAmountIn({ amountOut, currencyIn: baseR, poolInfo, poolKeys, slippage })
          .maxAmountIn as TokenAmount
      }
    }
    if (buyToken == 'base') {
      tokenAccountOut = baseTokenAccount
      tokenAccountIn = quoteTokenAccount
    } else {
      tokenAccountOut = quoteTokenAccount
      tokenAccountIn = baseTokenAccount
    }

    return {
      amountIn,
      amountOut,
      tokenAccountIn,
      tokenAccountOut,
      fixedSide,
    }
  }

  async computeAmount(
    input: {
      poolKeys: LiquidityPoolKeys
      user: PublicKey
      amount: number
      type: 'buy' | 'sell'
      amountSide: 'in' | 'out'
      slippage?: Percent
    },
    etc?: { extraBaseResever?: number; extraQuoteReserve?: number; extraLpSupply?: number },
  ) {
    const { amount, poolKeys, user } = input
    const slippage = input.slippage ?? new Percent(1, 100)
    const base = poolKeys.baseMint
    const baseMintDecimals = poolKeys.baseDecimals
    const quote = poolKeys.quoteMint
    const quoteMintDecimals = poolKeys.quoteDecimals
    const baseTokenAccount = getAssociatedTokenAddressSync(base, user)
    const quoteTokenAccount = getAssociatedTokenAddressSync(quote, user)
    const baseR = new Token(TOKEN_PROGRAM_ID, base, baseMintDecimals)
    const quoteR = new Token(TOKEN_PROGRAM_ID, quote, quoteMintDecimals)
    let amountIn: TokenAmount
    let amountOut: TokenAmount
    let tokenAccountIn: PublicKey
    let tokenAccountOut: PublicKey
    const [lpAccountInfo, baseVAccountInfo, quoteVAccountInfo] = await primaryRpcConnection
      .getMultipleAccountsInfo([poolKeys.lpMint, poolKeys.baseVault, poolKeys.quoteVault].map((e) => new PublicKey(e)))
      .catch(() => [null, null, null, null])
    if (!lpAccountInfo || !baseVAccountInfo || !quoteVAccountInfo) throw 'Failed to fetch some data'
    // const lpSupply = new BN(Number(MintLayout.decode(lpAccountInfo.data).supply.toString()))
    // const baseReserve = new BN(Number(AccountLayout.decode(baseVAccountInfo.data).amount.toString()))
    // const quoteReserve = new BN(Number(AccountLayout.decode(quoteVAccountInfo.data).amount.toString()))

    const lpSupply = new BN(toBufferBE(MintLayout.decode(lpAccountInfo.data).supply, 8)).addn(etc?.extraLpSupply ?? 0)
    const baseReserve = new BN(toBufferBE(AccountLayout.decode(baseVAccountInfo.data).amount, 8)).addn(etc?.extraBaseResever ?? 0)
    const quoteReserve = new BN(toBufferBE(AccountLayout.decode(quoteVAccountInfo.data).amount, 8)).addn(
      etc?.extraQuoteReserve ?? 0,
    )
    let fixedSide: SwapSide

    const poolInfo: LiquidityPoolInfo = {
      baseDecimals: poolKeys.baseDecimals,
      quoteDecimals: poolKeys.quoteDecimals,
      lpDecimals: poolKeys.lpDecimals,
      lpSupply,
      baseReserve,
      quoteReserve,
      startTime: null as any,
      status: null as any,
    }

    if (input.type == 'buy') {
      // base in quote out
      if (input.amountSide == 'in') {
        amountIn = new TokenAmount(baseR, amount.toString(), false)
        amountOut = Liquidity.computeAmountOut({ amountIn, currencyOut: quoteR, poolInfo, poolKeys, slippage })
          .minAmountOut as TokenAmount
      } else {
        amountOut = new TokenAmount(quoteR, amount.toString(), false)
        amountIn = Liquidity.computeAmountIn({ amountOut, currencyIn: baseR, poolInfo, poolKeys, slippage })
          .maxAmountIn as TokenAmount
      }
    } else {
      // base out; quote in
      if (input.amountSide == 'in') {
        amountIn = new TokenAmount(quoteR, amount.toString(), false)
        amountOut = Liquidity.computeAmountOut({ amountIn, currencyOut: baseR, poolInfo, poolKeys, slippage })
          .minAmountOut as TokenAmount
      } else {
        amountOut = new TokenAmount(baseR, amount.toString(), false)
        amountIn = Liquidity.computeAmountIn({ amountOut, currencyIn: quoteR, poolInfo, poolKeys, slippage })
          .maxAmountIn as TokenAmount
      }
    }

    if (input.type == 'buy') {
      tokenAccountIn = baseTokenAccount
      tokenAccountOut = quoteTokenAccount
    } else {
      tokenAccountIn = quoteTokenAccount
      tokenAccountOut = baseTokenAccount
    }

    return {
      amountIn,
      amountOut,
      tokenAccountIn,
      tokenAccountOut,
    }
  }
}

export async function formatAmmKeysById(connection: Connection, id: string): Promise<ApiPoolInfoV4 | undefined> {
  try {
    console.log('id', id)
    const account = await connection.getAccountInfo(new PublicKey(id))
    if (account === null) {
      console.log(' get id info error ')
      throw Error(' get id info error ')
    }
    const info = LIQUIDITY_STATE_LAYOUT_V4.decode(account.data)
    // console.log("info", info);

    const marketId = info.marketId
    const marketAccount = await connection.getAccountInfo(marketId)
    // console.log("marketAccount", marketAccount);
    if (marketAccount === null) {
      console.log('get market info error')
      throw Error('get market info error')
    }
    const marketInfo = MARKET_STATE_LAYOUT_V3.decode(marketAccount.data)
    // console.log("marketInfo", marketInfo);

    // const lpMint = info.lpMint
    // const lpMintAccount = await connection.getAccountInfo(lpMint)
    // console.log('lpMintAccount', lpMintAccount)
    // if (lpMintAccount === null) {
    //     console.log(' get lp mint info error')
    //     throw Error(' get lp mint info error')
    // }
    // const lpMintInfo = SPL_MINT_LAYOUT.decode(lpMintAccount.data)zs
    const data = {
      id,
      baseMint: info.baseMint.toString(),
      quoteMint: info.quoteMint.toString(),
      lpMint: info.lpMint.toString(),
      baseDecimals: info.baseDecimal.toNumber(),
      quoteDecimals: info.quoteDecimal.toNumber(),
      lpDecimals: 9,
      version: 4,
      programId: account.owner.toString(),
      authority: Liquidity.getAssociatedAuthority({ programId: account.owner }).publicKey.toString(),
      openOrders: info.openOrders.toString(),
      targetOrders: info.targetOrders.toString(),
      baseVault: info.baseVault.toString(),
      quoteVault: info.quoteVault.toString(),
      withdrawQueue: info.withdrawQueue.toString(),
      lpVault: info.lpVault.toString(),
      marketVersion: 3,
      marketProgramId: info.marketProgramId.toString(),
      marketId: info.marketId.toString(),
      marketAuthority: Market.getAssociatedAuthority({
        programId: info.marketProgramId,
        marketId: info.marketId,
      }).publicKey.toString(),
      marketBaseVault: marketInfo.baseVault.toString(),
      marketQuoteVault: marketInfo.quoteVault.toString(),
      marketBids: marketInfo.bids.toString(),
      marketAsks: marketInfo.asks.toString(),
      marketEventQueue: marketInfo.eventQueue.toString(),
      lookupTableAccount: PublicKey.default.toString(),
    } as ApiPoolInfoV4
    // console.log("-------------------------------------", data);
    return data
  } catch (e) {
    console.log('formatAmmKeysById', e)
  }
}

export const getPoolkeys = async (connection: Connection, id: string) => {
  try {
    const targetPoolInfo = await formatAmmKeysById(connection, id)
    // console.log("targetPoolInfo", targetPoolInfo);
    const poolKeys = jsonInfo2PoolKeys(targetPoolInfo) as LiquidityPoolKeys
    return poolKeys
  } catch (e) {
    console.log('getPoolkeys', e)
    return null
  }
}

export async function getRaydiumPoolsByTokenAddress(tokenAddress: string): Promise<PublicKey[]> {
  const tokenPublicKey = new PublicKey(tokenAddress)
  const poolAddresses: PublicKey[] = []

  // Fetch all accounts owned by the Raydium program
  const accounts = await primaryRpcConnection.getProgramAccounts(new PublicKey(_SERUM_PROGRAM_ID_V3), {
    filters: [
      {
        dataSize: 165, // Only account data layouts for token accounts are 165 bytes
      },
    ],
  })

  for (const account of accounts) {
    const accountInfo = AccountLayout.decode(account.account.data)

    // Check if this account contains the token
    if (accountInfo.mint.equals(tokenPublicKey)) {
      poolAddresses.push(account.pubkey)
    }
  }

  return poolAddresses
}

// Usage example

export type SwapInput = {
  keypair: Keypair
  poolId: PublicKey
  feePayer?: Keypair
  buyToken: 'base' | 'quote'
  sellToken?: 'base' | 'quote'
  amountSide: 'send' | 'receive'
  amount: number
  slippage: Percent
}

export async function swapRaydium(input: {
  keypair: Keypair
  poolId: PublicKey
  feePayer?: Keypair
  type: 'buy' | 'sell'
  amountSide: 'in' | 'out'
  amount: number
  slippage: Percent
  additionalInstructions?: TransactionInstruction[]
  additionalSigners?: Signer[]
}) {
  const feePayer = input?.feePayer ?? input.keypair
  console.log('feePayer', feePayer.publicKey.toBase58())

  const { instructions, signers, amountIn, minAmountOut, expectedAmountOut } = await createSwapRaydiumInstructions(input)

  console.log('amountIn', amountIn.toFixed(4))
  console.log('minAmountOut', minAmountOut.toFixed(4))
  console.log('expectedAmountOut', expectedAmountOut?.toFixed(4))

  const latestBlockhash = await primaryRpcConnection.getLatestBlockhash()

  const txMsg = new TransactionMessage({
    instructions: [...(input.additionalInstructions ?? []), ...instructions],
    payerKey: feePayer.publicKey,
    recentBlockhash: latestBlockhash.blockhash,
  }).compileToV0Message()

  const tx = new VersionedTransaction(txMsg)

  tx.sign([feePayer, input.keypair, ...signers, ...(input.additionalSigners ?? [])])

  return {
    tx,
    amountIn,
    minAmountOut,
    expectedAmountOut,
    latestBlockhash,
  }
}

export async function createSwapRaydiumInstructions(input: {
  keypair: Keypair
  poolId: PublicKey
  feePayer?: Keypair
  type: 'buy' | 'sell'
  amountSide: 'in' | 'out'
  amount: number
  slippage: Percent
}) {
  const user = input.keypair.publicKey
  const baseRay = new BaseRay()
  const feePayer = input?.feePayer ?? input.keypair

  const { amountIn, amountOut, tokenAccountIn, tokenAccountOut, poolKeys, swapAmountInfoNoSlippage } = await computeRaydiumAmounts(input)

  const minAmountOut = amountOut
  const expectedAmountOut = swapAmountInfoNoSlippage?.amountOut

  console.log(`swap ${amountIn.toFixed(4)} ${amountIn.token.mint} to ${amountOut.toFixed(4)} ${amountOut.token.mint}`)

  const txInfo = await baseRay
    .buyFromPool({
      amountIn,
      amountOut,
      fixedSide: input.amountSide,
      poolKeys,
      tokenAccountIn,
      tokenAccountOut,
      user,
      feePayer: feePayer.publicKey,
    })
    .catch((buyFromPoolError) => {
      console.log({ buyFromPoolError })
      return null
    })

  if (!txInfo) throw new Error('failed to prepare swap transaction')

  return {
    instructions: txInfo.ixs,
    signers: txInfo.signers,
    amountIn,
    minAmountOut,
    expectedAmountOut,
  }
}

export async function computeRaydiumAmounts(input: {
  keypair: Keypair
  poolId: PublicKey
  type: 'buy' | 'sell'
  amountSide: 'in' | 'out'
  amount: number
  slippage: Percent
}) {
  const user = input.keypair.publicKey
  const baseRay = new BaseRay()
  const slippage = input.slippage

  const poolKeys = await getPoolkeys(primaryRpcConnection, input.poolId.toBase58()).catch((getPoolKeysError) => {
    console.log({ getPoolKeysError })
    return null
  })
  if (!poolKeys) {
    throw new Error('pool not found')
  }

  const [swapAmountInfo, swapAmountInfoNoSlippage] = await Promise.all([
    baseRay
      .computeAmount({
        amount: input.amount,
        type: input.type,
        amountSide: input.amountSide,
        poolKeys,
        user,
        slippage,
      })
      .catch((computeBuyAmountError) => console.log({ computeBuyAmountError })),
    baseRay
      .computeAmount({
        amount: input.amount,
        type: input.type,
        amountSide: input.amountSide,
        poolKeys,
        user,
        slippage: new Percent(0),
      })
      .catch((computeBuyAmountError) => console.log({ computeBuyAmountError }))
  ])

  if (!swapAmountInfo || !swapAmountInfoNoSlippage) throw new Error('failed to calculate the amount')

  return {
    ...swapAmountInfo,
    poolKeys,
    swapAmountInfoNoSlippage
  }
}

export async function fakeVolumneTransaction(args: {
  pool: PublicKey
  swapAmount: number
  wallet: Keypair
  differentFeePayer?: boolean
}) {
  const swapAmount = args.swapAmount

  const feePayers = Array.from({ length: 3 }, (_, i) => {
    const wallet = Keypair.generate()

    const sendFundsIntr = SystemProgram.transfer({
      fromPubkey: args.wallet.publicKey,
      toPubkey: wallet.publicKey,
      lamports: solToLamports(0.002),
    })
    const sendFundsBackInstr = SystemProgram.transfer({
      fromPubkey: wallet.publicKey,
      toPubkey: args.wallet.publicKey,
      lamports: solToLamports(0.00189),
    })

    return {
      wallet,
      sendFundsIntr,
      sendFundsBackInstr,
    }
  })

  // console.log("buy1FeePayer", buy1FeePayer.publicKey.toBase58());
  // console.log("buy2FeePayer", buy2FeePayer.publicKey.toBase58());
  // console.log("sellFeePayer", sellFeePayer.publicKey.toBase58());

  const buyAmountRes = await computeRaydiumAmounts({
    amount: swapAmount,
    amountSide: 'in',
    type: 'buy',
    keypair: args.wallet,
    poolId: args.pool,
    slippage: new Percent(100, 100),
  })

  const outAmount = Number(buyAmountRes.amountOut.toExact())

  const outAmount1 = Math.floor(outAmount * _.random(0.4, 0.6))

  const outAmount2 = outAmount - outAmount1

  const [buyRes, buyRes2, sellRes] = await Promise.all([
    swapRaydium({
      amount: outAmount1,
      amountSide: 'out',
      type: 'buy',
      keypair: args.wallet,
      feePayer: args.differentFeePayer ? feePayers[0].wallet : undefined,
      additionalInstructions: args.differentFeePayer ? [feePayers[0].sendFundsBackInstr] : [],
      poolId: args.pool,
      slippage: new Percent(10, 100),
    }),
    swapRaydium({
      amount: outAmount2,
      amountSide: 'out',
      type: 'buy',
      keypair: args.wallet,
      feePayer: args.differentFeePayer ? feePayers[1].wallet : undefined,
      additionalInstructions: args.differentFeePayer ? [feePayers[1].sendFundsBackInstr] : [],
      poolId: args.pool,
      slippage: new Percent(10, 100),
    }),
    swapRaydium({
      amount: outAmount,
      amountSide: 'in',
      type: 'sell',
      keypair: args.wallet,
      feePayer: args.differentFeePayer ? feePayers[2].wallet : undefined,
      additionalInstructions: args.differentFeePayer ? [feePayers[2].sendFundsBackInstr] : [],
      poolId: args.pool,
      slippage: new Percent(10, 100),
    }),
  ])

  if (buyRes.tx && buyRes2.tx && sellRes.tx) {
    const res = await sendAndConfirmJitoBundle({
      transactions: [buyRes.tx, buyRes2.tx, sellRes.tx],
      payer: args.wallet,
      // signers: [args.wallet],
      feeTxInstructions: [...(args.differentFeePayer ? feePayers.map((e) => e.sendFundsIntr) : [])],
    })
    return res
  } else {
    throw new Error('failed to prepare swap transaction')
  }
}

export async function fakeVolumneTransactionFeePayerPool(args: {
  pool: PublicKey
  swapAmount: number
  wallet: Keypair
  buy1FeePayer?: Keypair
  buy2FeePayer?: Keypair
  sellFeePayer?: Keypair
}) {
  const swapAmount = args.swapAmount
  const sellAmountPercentage = 0.98
  const sellAmount = swapAmount * sellAmountPercentage

  const buy1FeePayer = args.buy1FeePayer ?? args.wallet
  const buy2FeePayer = args.buy2FeePayer ?? args.wallet
  const sellFeePayer = args.sellFeePayer ?? args.wallet

  console.log('buy1FeePayer', buy1FeePayer.publicKey.toBase58())
  console.log('buy2FeePayer', buy2FeePayer.publicKey.toBase58())
  console.log('sellFeePayer', sellFeePayer.publicKey.toBase58())

  const buyAmountRes = await computeRaydiumAmounts({
    amount: swapAmount,
    amountSide: 'in',
    type: 'buy',
    keypair: args.wallet,
    poolId: args.pool,
    slippage: new Percent(10, 100),
  })

  const outAmount = Number(buyAmountRes.amountOut.toExact())

  const outAmount1 = Math.floor(outAmount * _.random(0.4, 0.6))

  const outAmount2 = outAmount - outAmount1

  const [buyRes, buyRes2, sellRes] = await Promise.all([
    swapRaydium({
      amount: outAmount1,
      amountSide: 'out',
      type: 'buy',
      keypair: args.wallet,
      feePayer: buy1FeePayer,
      poolId: args.pool,
      slippage: new Percent(10, 100),
    }),
    swapRaydium({
      amount: outAmount2,
      amountSide: 'out',
      type: 'buy',
      keypair: args.wallet,
      feePayer: buy2FeePayer,
      poolId: args.pool,
      slippage: new Percent(10, 100),
    }),
    swapRaydium({
      amount: outAmount,
      amountSide: 'in',
      type: 'sell',
      keypair: args.wallet,
      feePayer: sellFeePayer,
      poolId: args.pool,
      slippage: new Percent(10, 100),
    }),
  ])

  const feePerTx = 0.00011
  const feePayerFundingAmount = 0.001

  function fundFeePayer(feePayer: Keypair) {
    return SystemProgram.transfer({
      fromPubkey: args.wallet.publicKey,
      toPubkey: feePayer.publicKey,
      lamports: solToLamports(feePayerFundingAmount),
    })
  }

  function sendFundsBack(feePayer: Keypair) {
    return SystemProgram.transfer({
      fromPubkey: buy1FeePayer.publicKey,
      toPubkey: args.wallet.publicKey,
      lamports: solToLamports(0.0005),
    })
  }

  if (
    buyRes.tx
    // &&  buyRes2.tx && sellRes.tx
  ) {
    const res = await sendAndConfirmJitoBundle({
      transactions: [buyRes.tx, buyRes2.tx, sellRes.tx],
      payer: args.wallet,
      // signers: [args.wallet],
      feeTxInstructions: [
        // sendFundsBack(buy1FeePayer),
        // fundFeePayer(feePayer2), fundFeePayer(feePayer3)
      ],
    })
    return res
  } else {
    throw new Error('failed to prepare swap transaction')
  }
}

export async function getTokensForPool(poolId: PublicKey): Promise<{ baseToken: PublicKey; quoteToken: PublicKey }> {
  const poolKeys = await getPoolkeys(primaryRpcConnection, poolId.toBase58())
  if (!poolKeys) {
    throw new Error('Pool not found')
  }

  return {
    baseToken: poolKeys.baseMint,
    quoteToken: poolKeys.quoteMint,
  }
}

export async function executeRaydiumSwapAndRetry({
  swapParams,
  priorityFeeLamports,
  shouldSimulate = false
}: {
  swapParams: Parameters<typeof swapRaydium>[0]
  priorityFeeLamports?: number,
  shouldSimulate?: boolean
}) {
  return await reattempt.run({ times: 2, delay: 200 }, async () => {
    const useJito = false
    const { tx, amountIn, minAmountOut, expectedAmountOut, latestBlockhash } = await swapRaydium({
      ...swapParams,
      additionalInstructions: [
        /*ComputeBudgetProgram.setComputeUnitPrice({
          microLamports: priorityFeeLamports,
        }),*/

        ...(useJito ? getJitoFeeInstructions(swapParams.keypair) : []),
      ],
    })

    if (shouldSimulate) {
      const simulateRes = await primaryStakedRpcConnection.simulateTransaction(tx)
      console.log(`simulateRes------------>>>>>>>>>>', ${simulateRes}` )
    }

    const txRes = await (useJito
      ? sendAndConfirmJitoTransactionViaRPC({
        transaction: tx,
        latestBlockhash,
      })
      : sendAndConfirmVersionedTransactionAndRetry({
        transaction: tx,
        latestBlockhash,
        useStakedRpc: true,
      }))

    return {
      ...txRes,
      amountIn,
      minAmountOut,
      expectedAmountOut,
    }
  })
}

export async function rankingBoost(
  wallets: Array<{
    isActive: boolean;
    botCustomerId: string;
    pubkey: string;
    encryptedPrivKey: string;
  }>,
  mainEncryptedPrivKey: string,
  token: string,
  pool: string
) {
  const mainWallet: Keypair = decryptWallet(mainEncryptedPrivKey)
  const walletList = wallets
  while (true) {
    // test
    const buyersWallet: Array<{
      isActive: boolean;
      botCustomerId: string;
      pubkey: string;
      encryptedPrivKey: string;
    }> = []

    let i = 0

    while (i++ < buyCounts) {
      const index = Math.floor(Math.random() * walletList.length)
      const current = walletList[index]
      if (buyersWallet.includes(current)) { i--; continue }
      const balance = await primaryRpcConnection.getBalance(new PublicKey(current.pubkey))
      if (balance < 0.00001 * LAMPORTS_PER_SOL) {
        walletList.splice(index, 1)
        if (walletList.length == 0) break
        i--;
        continue
      }
      buyersWallet.push(current)
    }

    // test
    await Promise.allSettled(buyersWallet.map(async (buyer, idx) => {
      try {
        const feePayer = decryptWallet(buyer.encryptedPrivKey)
        const swapParams = {
          keypair: mainWallet,
          poolId: new PublicKey(pool),
          feePayer,
          type: 'sell',
          amountSide: 'in',
          amount: buyAmount,
          slippage: new Percent(1)
        } as Parameters<typeof swapRaydium>[0]
        const buyResult = await executeRaydiumSwapAndRetry({ swapParams })
      } catch (err) {
        console.log(`Error processing buyer ${idx}:`, err)
      }
    }))

    if (walletList.length == 0) break

    await sleep(1000)
  }

  const tokenAta = getAssociatedTokenAddressSync(new PublicKey(token), mainWallet.publicKey)
  const tokenBalInfo = await primaryRpcConnection.getTokenAccountBalance(tokenAta)
  const tokenBalance = tokenBalInfo.value.uiAmount
  const swapParams = {
    keypair: mainWallet,
    poolId: new PublicKey(pool),
    feePayer: mainWallet,
    type: 'sell',
    amountSide: 'in',
    amount: tokenBalance,
    slippage: new Percent(100)
  } as Parameters<typeof swapRaydium>[0]
  const sellResult = await executeRaydiumSwapAndRetry({ swapParams })
}