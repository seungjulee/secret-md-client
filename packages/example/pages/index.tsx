import { StyledLink } from 'baseui/link'
import type { NextPage } from 'next'
import Head from 'next/head'
import Link from 'next/link'

const LINKS: [string, string][] = [
  ['/guess-number', 'Guess Number'],
  ['/btc-price-bot', 'BTC Price Bot'],
  ['/create-post', 'Create Post'],
]

const Home: NextPage = () => {
  return (
    <div>
      <Head>
        <title>Phala SDK Example</title>
      </Head>

      <Link href="/template" passHref>
        <StyledLink>Template</StyledLink>
      </Link>

      <ol>
        {LINKS.map(([href, label], index) => (
          <li key={href}>
            <Link href={href} passHref>
              <StyledLink>{label}</StyledLink>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  )
}

export default Home
