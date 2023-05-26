import { BrowserRouter, Route, Routes} from 'react-router-dom';
import NotFound from './Routes/NotFound';
import ClaimNFT from './Routes/ClaimNFT';
import VaultLayout from './Components/Layout/VaultLayout';
import "./App.css";
import Modal from 'react-modal';
import Redirecting from './Routes/Redirecting';

Modal.setAppElement('#root');

function App() {
  if (process.env.REACT_APP_HOST_REDIRECT) {
    try {
      let redirectURL = new URL(process.env.REACT_APP_HOST_REDIRECT);
      let currentURL = new URL(window.location.href);
      redirectURL.pathname = currentURL.pathname;
      redirectURL.hash = currentURL.hash;
      redirectURL.search = currentURL.search;
      window.location.replace(redirectURL);
    } catch(_) {}
    return <Redirecting/>
  }

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path='/'  element={<VaultLayout title='NFT Vault'/>}>
            <Route path='claim/:nft/:token_id' element={<ClaimNFT/>}/>
            <Route path='*' element={<NotFound/>}/>
          </Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;