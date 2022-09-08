import { BrowserRouter, Route, Routes } from 'react-router-dom';
import NotFound from './Routes/NotFound';
import ClaimNFT from './Routes/ClaimNFT';
import VaultLayout from './Components/Layout/VaultLayout';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path='/'  element={<VaultLayout title='this is the vault'/>}>
            <Route path='claim/:nft/:token_id' element={<ClaimNFT/>}/>
          </Route>
          <Route path='*' element={<NotFound/>}/>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
