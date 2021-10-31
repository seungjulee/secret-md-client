import { Block } from 'baseui/block'
import { StyledLink } from 'baseui/link'
import { ToasterContainer } from 'baseui/toast'
import { H2 } from 'baseui/typography'
import useIsClient from 'hooks/useIsClient'
import Head from 'next/head'
import Link from 'next/link'
import type { FC } from 'react'
import AccountSelect from './AccountSelect'

const Layout: FC<{title?: string}> = ({title, children}) => {
  const isClient = useIsClient()
  const displayTitle = 'SecretMD' //title || 'Phala SDK Example'
  return (
    <Block width="100%" maxWidth="980px" margin="0 auto" padding="0 32px">
      <Head>
        <title>{displayTitle}</title>
      </Head>

      <Block
        as="header"
        height="120px"
        display="flex"
        alignItems="center"
        justifyContent="space-between"
      >
        <Block
          as="header"
          height="60px"
          display="flex"
          alignItems="flex-start"
          justifyContent="flex-start"
          flexDirection="column"
        >
          <Block
            as="header"
            height="120px"
            display="flex"
            alignItems="end"
            justifyContent="space-between"
          >
            <div className="remove-underline">
              <Link href="/" passHref>
                <StyledLink>
                  <H2>🥷 SecretMD</H2>
                </StyledLink>
              </Link>
            </div>

            {/* <span className="px-4">Write About</span> */}
          </Block>
          <span className="text-gray-500">
            Encrypted markdown on confidential Phala blockchain
          </span>
        </Block>
        {isClient && <AccountSelect />}
      </Block>

      <main>{children}</main>

      <ToasterContainer
        placement="top"
        autoHideDuration={3000}
        overrides={{ToastBody: {style: {wordBreak: 'break-all'}}}}
      />
    </Block>
  )
}

export default Layout
