import { AppLoading } from "expo";
import React from "react";
import arrayFromObject from "./utils/arrayFromObject";
import cacheAssetsAsync from "./utils/cacheAssetsAsync";
import Files from "./Files";
import Game from "./components/Game";

export default class App extends React.Component {
  state = { assetsLoaded: false };

  componentWillMount() {
    this.loadAssetsAsync();
  }

  loadAssetsAsync = async () => {
    try {
      await cacheAssetsAsync({
        files: arrayFromObject(Files)
      });
    } catch (e) {
      console.warn(
        "There was an error caching assets (see: app.js), perhaps due to a " +
          "network timeout, so we skipped caching. Reload the app to try again."
      );
      console.log(e.message);
    } finally {
      this.setState({ assetsLoaded: true });
    }
  };

  render() {
    return this.state.assetsLoaded ? <Game /> : <AppLoading />;
  }
}
