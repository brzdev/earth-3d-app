import React from 'react';
import SolarSystem from './components/Planet';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>3D Solar System</h1>
      </header>
      <SolarSystem />
    </div>
  );
}

export default App;