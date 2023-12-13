import Link from 'next/link'
import Image from 'next/image'
import BigNumber from 'bignumber.js'
import { Connection, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { getStakedDataByMint } from '@genesysgo/ssc-staking-sdk'

async function fetchStakeData(mints: number[]) {
  // const connection = new Connection(`https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY ?? ''}`, 'confirmed')
  const connection = new Connection(`https://aloise-03hryw-fast-mainnet.helius-rpc.com`, 'confirmed')

  const items = []

  for (const mint of mints) {
    const stakeData = await getStakedDataByMint(connection, mint)

    for (const stake of stakeData) {
      items.push({
        id: mint,
        name: stake.json.name,
        image: stake.json.image,
        withdrawn: new BigNumber(stake.withdrawn).dividedBy(1000000000).toFixed(0).toLocaleString(),
        harvested: new BigNumber(stake.harvested).dividedBy(1000000000).toFixed(0).toLocaleString(),
        bonus_redeemed: stake.bonus_redeemed,
      })
    }
  }

  return items
}

export default async function Page({ params }: { params: { page: string } }) {
  const res = await fetch('https://api.tensor.so/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-tensor-api-key': process.env.TENSOR_API_KEY ?? '',
    },
    body: JSON.stringify({
      query: `
        query CollectionStats($slug: String!) {
          activeListingsV2(slug: $slug, sortBy: PriceAsc) {
            txs {
              mint {
                onchainId
              }
              tx {
                grossAmount
              }
            }
          }
        }
      `,
      variables: {
        slug: 'shadowy_super_coder_dao'
      },
    }),
    next: { revalidate: 360 },
  })

  const data = await res.json()

  const listingsMints = data.data.activeListingsV2.txs.map((tx: any) => tx.mint.onchainId)

  const currentPage = parseInt(params.page)

  const nextMints = listingsMints.slice((currentPage - 1) * 12, (currentPage - 1) * 12 + 12)

  const items = await fetchStakeData(nextMints)

  const pricesMap = data.data.activeListingsV2.txs.reduce((acc: any, tx: any) => {
    if (!acc[tx.mint.onchainId]) {
      acc[tx.mint.onchainId] = []
    }

    acc[tx.mint.onchainId].push(tx.tx.grossAmount)

    return acc
  }
  , {})

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="space-y-4 mb-20">
        <h1 className="text-3xl font-bold text-center">Shadowy Super Coders NFT Staking</h1>
        <div className="flex flex-col items-center space-y-2">
          <p>This site shows the $SHDW emissions for the Shadowy Super Coders NFTs.</p>
          <p>All NFTs listed below are available for sale in Tensor <span role="img" aria-label="atom emoji">⚛️</span></p>
        </div>
        <div className="flex flex-col items-center space-y-2">
          <p>Feeling generous? Donate some ◎SOL to the following address:</p>
          <p className="text-fuchsia-500"><b>8mhAeLpNV7QJEZKjpppp3Sv9xh2W6EikCBswgugZJrcS</b></p>
          <p>Made by <b><a href="https://x.com/0xPegasus" target="_blank" className="text-blue-500">@0xPegasus</a></b></p>
        </div>
      </div>
      <div className="mb-32 grid text-center lg:max-w-5xl lg:w-full lg:mb-0 lg:grid-cols-4 lg:text-left gap-2">
        {items.map((item, idx) => (
          <div className="flex flex-col items-center justify-center p-4 space-y-4 bg-black rounded-lg shadow-lg border-slate-800 border" key={idx}>
            <Image
              src={item.image}
              alt={item.name}
              width={100}
              height={100}
              unoptimized
            />
            <div className="text-xl font-bold text-center">{item.name}</div>
            <div className="flex flex-col items-center space-y-1">
              <div className="">Withdrawn: <b>{item.withdrawn} SHDW</b></div>
              <div className="">Harvested: <b>{item.harvested} SHDW</b></div>
              <div className="">Bonus Redeemed: {item.bonus_redeemed ? <span role="img" aria-label="check emoji">✅</span> : <span role="img" aria-label="x emoji">❌</span>}</div>
            </div>
            <a href={`https://www.tensor.trade/item/${item.id}`} target="_blank">
              <button className="border-2 border-dashed border-fuchsia-500 hover:bg-fuchsia-500 text-lg text-white font-semibold px-4 py-2">Buy for ◎{pricesMap[item.id][0] / LAMPORTS_PER_SOL}</button>
            </a>
          </div>
        ))}
      </div>
      <div className="flex justify-center items-center space-x-12 mt-16">
        {currentPage > 1 && <Link href={`/${currentPage - 1}`}>Previous</Link>}
        <Link href={`/${currentPage + 1}`}>Next</Link>
      </div>
    </main>
  )
}
