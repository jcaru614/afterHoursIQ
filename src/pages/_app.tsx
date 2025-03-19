import { store } from '@/redux/store';
import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { Provider } from 'react-redux';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <Provider store={store}>
      <div className='bg-gradient-to-r from-[#1D0F41] to-[#0A0922]'>
        <Component {...pageProps} />
      </div>
    </Provider>
  );
}
