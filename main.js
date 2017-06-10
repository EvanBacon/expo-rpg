//
// Copyright (c) 2017-present, by Evan Bacon. All Rights Reserved.
// @author Evan Bacon / https://github.com/EvanBacon
//

/*
Texture from: http://stemkoski.github.io/Three.js/Texture-Animation.html
*/
import DirectionType from './DirectionType'

import Expo, {AppLoading} from 'expo';
import React from 'react';
import { StyleSheet, Image, Text, View } from 'react-native';
import arrayFromObject from './utils/arrayFromObject'
import cacheAssetsAsync from './utils/cacheAssetsAsync'
const THREE = require('three');
import ExpoTHREE from 'expo-three';
import Images from './Images'
global.document = {};
// THREE warns us about some GL extensions that `Expo.GLView` doesn't support
// yet. This is ok, most things will still work, and we'll support those
// extensions hopefully soon.
// console.disableYellowBox = true;
console.ignoredYellowBox = [
  'THREE.WebGLRenderer',
  'THREE.WebGLProgram',
];

import DPad from './DPad'
const defVelocity = {
  [DirectionType.left]: {dx: -1},
  [DirectionType.right]: {dx: 1},
  [DirectionType.up]:   {dy: 1},
  [DirectionType.down]: {dy: -1},
}

const image = require('./assets/images/map.png');
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
    if (!this.state.appIsReady) {
      return <AppLoading />
    }

    // Create an `Expo.GLView` covering the whole screen, tell it to call our
    // `_onGLContextCreate` function once it's initialized.
    return (  <Game /> );
}
}

Expo.registerRootComponent(App);




class Game extends React.Component {
  state ={width:0, height: 0}
  render() {
    // Create an `Expo.GLView` covering the whole screen, tell it to call our
    // `_onGLContextCreate` function once it's initialized.
    return (
      <View onLayout={({nativeEvent:{layout:{width, height}}}) => this.setState({width, height}) } style={StyleSheet.absoluteFill}>
        <Image source={Images.map} style={StyleSheet.flatten([{width: this.state.width, height: this.state.height, resizeMode: 'cover'}])}/>

      <Expo.GLView
        style={StyleSheet.absoluteFill}
        onContextCreate={this._onGLContextCreate}
      />

      <DPad
        style={{position: 'absolute', bottom: 8, left: 8}}
        onPressOut={ id => {
          if (this.node) {
            this.node.setSelectedSpriteKey(null)
            this.node.setVelocity()
          }
          this.selected = null

        }}
        onPress={id => {
          if (this.node) {
            this.node.setSelectedSpriteKey(id)
            this.node.setVelocity(defVelocity[id])
          }
          this.selected = id
        }}/>
      </View>
    );
  }

  // This is called by the `Expo.GLView` once it's initialized
  _onGLContextCreate = async (gl) => {
    // Based on https://threejs.org/docs/#manual/introduction/Creating-a-scene
    // In this case we instead use a texture for the material (because textures
    // are cool!). All differences from the normal THREE.js example are
    // indicated with a `NOTE:` comment.

    var clock = new THREE.Clock();


    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(
      gl.drawingBufferWidth / -2, gl.drawingBufferWidth / 2, gl.drawingBufferHeight / 2, gl.drawingBufferHeight / -2, 0, 1);

      // NOTE: How to create an `Expo.GLView`-compatible THREE renderer
      const renderer = ExpoTHREE.createRenderer({ gl });
      renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
      renderer.setClearColor(
        0x000000,
        0
      );

      camera.position.z = 1;

      let textures = [
        {key: "down",  texture: Images.hero['0']},
        {key: "left",  texture: Images.hero['1']},
        {key: "up",    texture: Images.hero['2']},
        {key: "right", texture: Images.hero['3']},
      ];

      let sprites = {};

      let keys = Object.keys(textures);
      for (let i in keys) {

        const {key, texture} = textures[i];

        const size = {
          width: 32 * 3,
          height: 64 * 3
        }
        const sprite = new Sprite();
        await sprite.setup({
          image: texture,
          tilesHoriz: 6,
          tilesVert: 1,
          numTiles: 6,
          tileDispDuration: 75,
          size
        });
        sprites[key] = sprite;
      }


      this.node = new Character({
        sprites,
        speed: 3
      });
      scene.add(this.node);

      const render = () => {
        requestAnimationFrame(render);
        var delta = clock.getDelta();

        this.node.update(delta);

        renderer.render(scene, camera);
        // NOTE: At the end of each frame, notify `Expo.GLView` with the below
        gl.endFrameEXP();
      }
      render();
    }
  }


  //


  class Node extends THREE.Group {
    constructor({sprites, selectedSpriteKey, ...props}) {
      super(props);


      Object.keys(sprites).map(val => {
        let _sprite = sprites[val];
        if (_sprite instanceof THREE.Object3D) {
          this.add(_sprite);
        }
        sprites[val].visible = false;
      });
      this.sprites = sprites;

      this.setSelectedSpriteKey(selectedSpriteKey || Object.keys(sprites)[0]);
      this.setSelectedSpriteKey(null);
    }

    setSelectedSpriteKey = key => {
      if (this.selectedSpriteKey != key) {

        for (let _key of Object.keys(this.sprites)) {
          let _sprite = this.sprites[_key];
          if (_key == key) {
            _sprite.visible = true;
          } else {
            _sprite.visible = false;
          }
        }

        this.isAnimating = key;
        const lastSprite = this.sprites[this.selectedSpriteKey];
        if (lastSprite) {
          lastSprite.visible = !this.isAnimating
        }
        this.selectedSpriteKey = key;
      }
    }

    getSelectedSprite = () => {
      if (this.selectedSpriteKey) {
        if (this.sprites.hasOwnProperty(this.selectedSpriteKey)) {
          return this.sprites[this.selectedSpriteKey];
        }
      }
    }

    update(dt) {
      let sprite = this.getSelectedSprite();
      if (sprite) {
        sprite.animation.update(1000 * dt);
      }
    }

  }

  class Sprite extends THREE.Mesh {

    setup = async ({image, tilesHoriz, tilesVert, numTiles, tileDispDuration, filter = THREE.NearestFilter, size, position = {}, ...props}) => {

      // Save props
      let _props = {
        image,
        tilesHoriz,
        tilesVert,
        numTiles,
        tileDispDuration,
        filter,
        size,
        position,
        ...props
      };

      Object.keys(_props).map(v=> this[`__${v}`] = _props[v]);


      this._texture = await ExpoTHREE.createTextureAsync({
        asset: Expo.Asset.fromModule(image),
      });
      /// Preserve Pixel Texture - no smoothing
      this._texture.magFilter = this._texture.minFilter = filter;

      this.animation = new TextureAnimator( this._texture, tilesHoriz, tilesVert, numTiles, tileDispDuration ); // texture, #horiz, #vert, #total, duration.
      this.material = new THREE.MeshBasicMaterial( {
        map: this._texture,
        transparent: true,
      });
      this.geometry = new THREE.PlaneGeometry(size.width, size.height, 1, 1);
      this.position.x = position.x || 0
      this.position.y = position.y || 0
    }
  }


  class Plane extends THREE.Mesh {

    set image(_image) {
      (async () => {


        this._texture = await ExpoTHREE.createTextureAsync({
          asset: Expo.Asset.fromModule(_image),
        });
        /// Preserve Pixel Texture - no smoothing
        this._texture.magFilter = this._texture.minFilter = filter;

        this.material = new THREE.MeshBasicMaterial( {
          map: this._texture,
        });
      })()
    }

  }

  class TextureAnimator {
    constructor(texture, tilesHoriz, tilesVert, numTiles, tileDispDuration) {
      // note: texture passed by reference, will be updated by the update function.

      this.tilesHorizontal = tilesHoriz;
      this.tilesVertical = tilesVert;
      // how many images does this spritesheet contain?
      //  usually equals tilesHoriz * tilesVert, but not necessarily,
      //  if there at blank tiles at the bottom of the spritesheet.
      this.numberOfTiles = numTiles;
      // texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set( 1 / this.tilesHorizontal, 1 / this.tilesVertical );

      // how long should each image be displayed?
      this.tileDisplayDuration = tileDispDuration;
      this.texture = texture;
      // how long has the current image been displayed?
      this.currentDisplayTime = 0;

      // which image is currently being displayed?
      this.currentTile = 0;
    }

    update = milliSec => {
      this.currentDisplayTime += milliSec;
      while (this.currentDisplayTime > this.tileDisplayDuration)
      {
        this.currentDisplayTime -= this.tileDisplayDuration;
        this.currentTile++;
        if (this.currentTile == this.numberOfTiles)
        this.currentTile = 0;
        var currentColumn = this.currentTile % this.tilesHorizontal;
        this.texture.offset.x = currentColumn / this.tilesHorizontal;
        var currentRow = Math.floor( this.currentTile / this.tilesHorizontal );
        this.texture.offset.y = currentRow / this.tilesVertical;
      }
    }
  }


  class Character extends Node {
    _dx = 0;
    _dy = 0;
    _speed = 0;
    constructor({speed, ...props}) {
      super(props);
      this._speed = speed || 0;

    }

    setVelocity = (velocity) => {
      velocity = velocity || {};
      this._dx = velocity.dx || 0;
      this._dy = velocity.dy || 0;
    }

    update = dt => {
      super.update(dt);
      this._updateVelocity();
    }

    _updateVelocity = () => {
      this.position.x += this._dx * this._speed;
      this.position.y += this._dy * this._speed;
    }
  }
