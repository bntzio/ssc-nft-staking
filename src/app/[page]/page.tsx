import Link from 'next/link'
import Image from 'next/image'
import BigNumber from 'bignumber.js'
import { Connection } from '@solana/web3.js'
import { getStakedDataByMint } from '@genesysgo/ssc-staking-sdk'

async function fetchStakeData(mints: number[]) {
  const connection = new Connection(`https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY ?? ''}`, 'confirmed')

  const items = []

  for (const mint of mints) {
    const stakeData = await getStakedDataByMint(connection, mint)

    for (const stake of stakeData) {
      items.push({
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

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="mb-32 grid text-center lg:max-w-5xl lg:w-full lg:mb-0 lg:grid-cols-4 lg:text-left">
        {items.map((item, idx) => (
          <div className="flex flex-col items-center justify-center p-4 space-y-4 bg-black rounded-lg shadow-lg" key={idx}>
            <Image
              src={item.image}
              alt={item.name}
              width={100}
              height={100}
            />
            <div className="text-xl font-bold">{item.name}</div>
            <div className="text-lg">Withdrawn: {item.withdrawn}</div>
            <div className="text-lg">Harvested: {item.harvested}</div>
            <div className="text-lg">Bonus Redeemed: {item.bonus_redeemed ? 'YES' : 'NO'}</div>
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
