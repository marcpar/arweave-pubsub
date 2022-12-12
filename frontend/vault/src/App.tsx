import { BrowserRouter, Route, Routes} from 'react-router-dom';
import NotFound from './Routes/NotFound';
import ClaimNFT from './Routes/ClaimNFT';
import ViewNFT from './Routes/ViewNFT';
import VaultLayout from './Components/Layout/VaultLayout';
import "./App.css";
import GlobeImage from "./Assets/WT-3D-Globe.png"
import ClaimNFTCallback from './Routes/ClaimNFTCallback';
function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path='/'  element={<VaultLayout title='this is the vault'/>}>
            <Route path='claim/:nft/:token_id' element={<ClaimNFT/>}/>
            <Route path='claim-callback' element={<ClaimNFTCallback/>}/>
            <Route path='view/:nft/:token_id' element={<ViewNFT/>}/>
            
            <Route path='*' element={<NotFound/>}/>
          </Route>
        </Routes>
      </BrowserRouter>
      <img className="globe-background" src={GlobeImage}/>  
    </div>
  );
}

export default App;
