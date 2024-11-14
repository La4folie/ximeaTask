import React from 'react';
import cameraDataFile from './data/cameraData.xlsx';
import CameraModelGrid from './components/CameraModelGrid';
import ximealogo from './../src/assets/images/ximea-logo.svg'

function App() {

  return (
    <div className="min-h-screen bg-zinc-800 flex flex-col">
      <div className="flex justify-center py-4 items-center h-1/5">
        <img src={ximealogo} alt="logo" className="h-24" />
      </div>

      <div className="flex-1 flex justify-center p-6 h-4/5">
        <div className="flex-1 bg-white rounded-lg shadow-lg p-2 overflow-auto">
          <CameraModelGrid cameraDataFile={cameraDataFile} />
        </div>
      </div>
    </div>
  );
}

export default App;
