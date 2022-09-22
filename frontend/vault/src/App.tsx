import { BrowserRouter, Route, Routes} from 'react-router-dom';
import NotFound from './Routes/NotFound';
import ClaimNFT from './Routes/ClaimNFT';
import ViewNFT from './Routes/ViewNFT';
import VaultLayout from './Components/Layout/VaultLayout';
import "./App.css";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path='/'  element={<VaultLayout title='this is the vault'/>}>
            <Route path='claim/:nft/:token_id' element={<ClaimNFT/>}/>
            <Route path='view/:nft/:token_id' element={<ViewNFT/>}/>
            <Route path='*' element={<NotFound/>}/>
          </Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
