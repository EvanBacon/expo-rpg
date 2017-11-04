import Expo from "expo";
import React from "react";
import PropTypes from "prop-types"; // 15.6.0
import { StyleSheet, PanResponder } from "react-native";
import * as THREE from "three"; // 0.88.0
import ExpoTHREE from "expo-three"; // 2.0.2

export default class SpriteView extends React.Component {
  static propTypes = {
    touchDown: PropTypes.func.isRequired,
    touchMoved: PropTypes.func.isRequired,
    touchUp: PropTypes.func.isRequired,
    update: PropTypes.func.isRequired,
    onSetup: PropTypes.func.isRequired
  };

  static defaultProps = {
    touchDown: ({ x, y }) => {},
    touchMoved: ({ x, y }) => {},
    touchUp: ({ x, y }) => {},
    update: currentTime => {},
    onSetup: ({ scene, camera }) => {}
  };

  scene;
  clock;
  camera;

  ///@Evan NOTE: This is lifted from SpriteKit.
  worldSpaceWidth = 750;
  worldSpaceHeight = null; //1334

  constructor() {
    super();
    this.setupGestures();
  }

  setupGestures = () => {
    const touchesBegan = ({ nativeEvent }, gestureState) => {
      const { touches } = nativeEvent;
      touches.map(
        ({ target, locationX, locationY, force, identifier, timestamp }) => {
          this.props.touchDown({ x: locationX, y: locationY });
        }
      );
    };

    const touchesMoved = ({ nativeEvent }, gestureState) => {
      const { touches } = nativeEvent;
      touches.map(
        ({ target, locationX, locationY, force, identifier, timestamp }) => {
          this.props.touchMoved({ x: locationX, y: locationY });
        }
      );
    };

    const touchesEnded = ({ nativeEvent }, gestureState) => {
      const { touches } = nativeEvent;
      touches.map(
        ({ target, locationX, locationY, force, identifier, timestamp }) => {
          this.props.touchUp({ x: locationX, y: locationY });
        }
      );
    };

    this.panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: touchesBegan,
      onPanResponderMove: touchesMoved,
      onPanResponderRelease: touchesEnded,
      onPanResponderTerminate: touchesEnded, //cancel
      onShouldBlockNativeResponder: () => false
    });
  };

  render() {
    const { style, ...props } = this.props;
    // Create an `Expo.GLView` covering the whole screen, tell it to call our
    // `_onGLContextCreate` function once it's initialized.
    return (
      <Expo.GLView
        {...this.panResponder.panHandlers}
        style={StyleSheet.flatten([StyleSheet.absoluteFill, style])}
        onContextCreate={this._onGLContextCreate}
      />
    );
  }

  _onGLContextCreate = async gl => {
    this.scene = new THREE.Scene();
    this.clock = new THREE.Clock();

    /// Camera
    const { drawingBufferWidth: glWidth, drawingBufferHeight: glHeight } = gl;
    this.worldSpaceHeight = glHeight / glWidth * this.worldSpaceWidth;
    this.camera = new THREE.OrthographicCamera(
      this.worldSpaceWidth / -2,
      this.worldSpaceWidth / 2,
      this.worldSpaceHeight / 2,
      this.worldSpaceHeight / -2,
      0,
      1
    );
    this.camera.position.z = 1;

    const renderer = ExpoTHREE.createRenderer({ gl });
    renderer.setSize(glWidth, glHeight);
    /// Color, Alpha
    renderer.setClearColor(0x000000, 0);

    await this.props.onSetup({ scene: this.scene, camera: this.camera });

    const render = () => {
      requestAnimationFrame(render);
      var delta = this.clock.getDelta();
      this.props.update(delta);
      renderer.render(this.scene, this.camera);
      gl.endFrameEXP();
    };

    render();
  };
}
