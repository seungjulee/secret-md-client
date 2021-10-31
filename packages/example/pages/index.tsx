import type { NextPage } from 'next'
import CreatePost from './create-post'

const LINKS: [string, string][] = [
  ['/guess-number', 'Guess Number'],
  ['/btc-price-bot', 'BTC Price Bot'],
  ['/create-post', 'Create Post'],
  ['/view-post', 'View Post'],
]

const Home: NextPage = () => {
  return <CreatePost />
}

export default Home
