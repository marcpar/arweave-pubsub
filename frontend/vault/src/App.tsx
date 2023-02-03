import { BrowserRouter, Route, Routes} from 'react-router-dom';
import NotFound from './Routes/NotFound';
import ClaimNFT from './Routes/ClaimNFT';
import ViewNFT from './Routes/ViewNFT';
import VaultLayout from './Components/Layout/VaultLayout';
import "./App.css";
import ClaimNFTCallback from './Routes/ClaimNFTCallback';
import Modal from 'react-modal';

Modal.setAppElement('#root');

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path='/'  element={<VaultLayout title='NFT Vault'/>}>
            <Route path='claim/:nft/:token_id' element={<ClaimNFT/>}/>
            <Route path='claim-callback' element={<ClaimNFTCallback/>}/>
            <Route path='view/:nft/:token_id' element={<ViewNFT/>}/>
            <Route path='*' element={<NotFound/>}/>
          </Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
