import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'

const DynamicComponentWithNoSSR = dynamic(() => import('./view-post-core'), {
  ssr: false,
})

function ViewPost(obj) {
  const router = useRouter()
  console.log('top obj', router)
  return <DynamicComponentWithNoSSR />
}

ViewPost.title = 'View Post'

export default ViewPost
