//
// Copyright (c) 2017-present, by Evan Bacon. All Rights Reserved.
// @author Evan Bacon / https://github.com/EvanBacon
//

import Expo, {AppLoading} from 'expo';
import React from 'react';
import { StyleSheet, Image, Text, View } from 'react-native';
import arrayFromObject from './utils/arrayFromObject'
import cacheAssetsAsync from './utils/cacheAssetsAsync'
const THREE = require('three');
import ExpoTHREE from 'expo-three';
import Images from './Images'
import Game from './components/Game';

class App extends React.Component {
  state = {appIsReady: false};
  componentWillMount() {
    this._loadAssetsAsync();
  }
  async _loadAssetsAsync() {
    try {
      await cacheAssetsAsync({
        images: arrayFromObject(Images),
      });
    } catch (e) {
      console.warn(
        'There was an error caching assets (see: main.js), perhaps due to a ' +
        'network timeout, so we skipped caching. Reload the app to try again.'
      );
      console.log(e.message);
    } finally {
      this.setState({ appIsReady: true });
    }
  }

  render() {
      return this.state.appIsReady ? <Game /> : <AppLoading />
  }
}
Expo.registerRootComponent(App);
