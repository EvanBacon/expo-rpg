/*
Texture from: http://stemkoski.github.io/Three.js/Texture-Animation.html
*/

import Expo from 'expo';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const THREE = require('three');
import ExpoTHREE from 'expo-three';

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

class App extends React.Component {

  render() {
    // Create an `Expo.GLView` covering the whole screen, tell it to call our
    // `_onGLContextCreate` function once it's initialized.
    return (
      <View style={{flex: 1}}>
      <Expo.GLView
        style={{ flex: 1 }}
        onContextCreate={this._onGLContextCreate}
      />
    <DPad       style={{position: 'absolute', bottom: 8, left: 8}}
          onPressOut={ id => {
            if (this.node) {
              this.node.setSelectedSpriteKey(null)
            }
            this.selected = null

          }}
          onPress={id => {
            if (this.node) {
              this.node.setSelectedSpriteKey(id)
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

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({
      // NOTE: How to create an Expo-compatible THREE texture
      map: await ExpoTHREE.createTextureAsync({
        asset: Expo.Asset.fromModule(require('./assets/icons/app.png')),
      }),
    });

    camera.position.z = 1;

    let textures = [
      {key: "down",  texture: require('./assets/images/hero/0.png')},
      {key: "left",  texture: require('./assets/images/hero/1.png')},
      {key: "up",    texture: require('./assets/images/hero/2.png')},
      {key: "right", texture: require('./assets/images/hero/3.png')},
    ];

    let sprites = {};

    let keys = Object.keys(textures);
    for (let i in keys) {

      const {key, texture} = textures[i];

      const size = {
        width: 32 * 3,
        height: 64 * 3
      }
      const sprite = new Sprite({
        image: texture,
        tilesHoriz: 6,
        tilesVert: 1,
        numTiles: 6,
        tileDispDuration: 75,
        position: {
          x: 0,
          y: 0
        },
        size
      });
      await sprite.setup();
      scene.add(sprite.mesh);
      sprites[key] = sprite;
    }

    this.node = new Node({
      sprites
    });



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

Expo.registerRootComponent(App);


class Node {
  constructor({sprites, selectedSpriteKey}) {
    // console.warn(JSON.stringify(sprites))

    Object.keys(sprites).map(val => sprites[val].mesh.visible = false);
    this.sprites = sprites;

    this.setSelectedSpriteKey(selectedSpriteKey || Object.keys(sprites)[0]);
    this.setSelectedSpriteKey(null);
  }

  setSelectedSpriteKey = key => {
    if (this.selectedSpriteKey != key) {

      for (let _key of Object.keys(this.sprites)) {
        let _sprite = this.sprites[_key];
        if (_key == key) {
          _sprite.mesh.visible = true;
        } else {
          _sprite.mesh.visible = false;
        }
      }

      this.isAnimating = key;
      const lastSprite = this.sprites[this.selectedSpriteKey];
      if (lastSprite) {
        lastSprite.mesh.visible = !this.isAnimating
      }


      // if (this.sprites.hasOwnProperty(key)) {
      //   this.sprites[key].mesh.visible = true;
      // }
      this.selectedSpriteKey = key;
    }
  }

  update = dt => {
    if (this.selectedSpriteKey) {
      if (this.sprites.hasOwnProperty(this.selectedSpriteKey)) {
        this.sprites[this.selectedSpriteKey].animation.update(1000 * dt);
      }
    }
  }

}

class Sprite {
  constructor({image, tilesHoriz, tilesVert, numTiles, tileDispDuration, filter = THREE.NearestFilter, size, position, ...props}) {
    let _props = {image, tilesHoriz, tilesVert, numTiles, tileDispDuration, filter, size, position, ...props};
    Object.keys(_props).map(v=> this[v] = _props[v]);
  }

  setup = async () => {
    const {image, tilesHoriz, tilesVert, numTiles, tileDispDuration, filter, size, position} = this;

    this.texture = await ExpoTHREE.createTextureAsync({
      asset: Expo.Asset.fromModule(image),
    });
    /// Preserve Pixel Texture - no smoothing
    this.texture.magFilter = this.texture.minFilter = filter;

    this.animation = new TextureAnimator( this.texture, tilesHoriz, tilesVert, numTiles, tileDispDuration ); // texture, #horiz, #vert, #total, duration.
    this.material = new THREE.MeshBasicMaterial( {
      map: this.texture,
    });
    this.geometry = new THREE.PlaneGeometry(size.width, size.height, 1, 1);
    this.mesh = new THREE.Mesh(this.geometry, this.material);

    this.mesh.position.x = position.x
    this.mesh.position.y = position.y
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
