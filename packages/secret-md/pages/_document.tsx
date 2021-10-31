import Document, {
    DocumentContext,
    Head,
    Html,
    Main,
    NextScript
} from 'next/document'
import { Server, Sheet } from 'styletron-engine-atomic'
import { Provider as StyletronProvider } from 'styletron-react'
import { styletron } from '../styletron'

// https://github.com/vercel/next.js/blob/canary/examples/with-styletron/pages/_document.js
class MyDocument extends Document<{stylesheets: Sheet[]}> {
  static async getInitialProps(ctx: DocumentContext) {
    const renderPage = () =>
      ctx.renderPage({
        /* eslint-disable-next-line react/display-name */
        enhanceApp: (App) => (props) =>
          (
            <StyletronProvider value={styletron}>
              <App {...props} />
            </StyletronProvider>
          ),
      })
    const initialProps = await Document.getInitialProps({
      ...ctx,
      renderPage,
    })
    const stylesheets = (styletron as Server).getStylesheets() || []
    return {...initialProps, stylesheets}
  }

  render() {
    return (
      <Html lang="en">
        <Head>
          {this.props.stylesheets.map((sheet, i) => (
            <style
              className="_styletron_hydrate_"
              dangerouslySetInnerHTML={{__html: sheet.css}}
              media={sheet.attrs.media}
              data-hydrate={sheet.attrs['data-hydrate']}
              key={i}
            />
          ))}
          <meta name="description" content="Phala SDK Example" />
          <link
            rel="icon"
            href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🥷</text></svg>"
          />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}

export default MyDocument
