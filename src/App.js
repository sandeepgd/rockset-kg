import React, { Component } from 'react';
import MyCustomSigma from './MyCustomSigma';
import logo from './logo.svg';
import './App.css';

require('dotenv').config()

class App extends Component {
  render() {
    return (
        <MyCustomSigma/>
    );
  }
}

export default App;
