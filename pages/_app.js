import '../styles/globals.css'
import Layout from '../components/Layout'
import ErrorBoundary from '../components/ErrorBoundary'
import Head from 'next/head'

export default function App({Component,pageProps}){
  return (
    <>
      <Head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <ErrorBoundary>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </ErrorBoundary>
    </>
  )
}