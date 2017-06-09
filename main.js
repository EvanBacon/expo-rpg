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
console.disableYellowBox = true;

class App extends React.Component {

  render() {
    // Create an `Expo.GLView` covering the whole screen, tell it to call our
    // `_onGLContextCreate` function once it's initialized.
    return (
      <Expo.GLView
        style={{ flex: 1 }}
        onContextCreate={this._onGLContextCreate}
      />
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


    const sprite = new SpriteNode({
      image: require('./assets/images/run.png'),
      tilesHoriz: 10,
      tilesVert: 1,
      numTiles: 10,
      tileDispDuration: 75,
      position: {
        x: -100,
        y: 75,
      },
      size: {
        width: 600,
        height: 600
      }
    });
    await sprite.setup();

    scene.add(sprite.mesh);

    const render = () => {
      requestAnimationFrame(render);


      var delta = clock.getDelta();
      sprite.animation.update(1000 * delta);
      sprite.mesh.rotation.z -= 1 * delta

      renderer.render(scene, camera);

      // NOTE: At the end of each frame, notify `Expo.GLView` with the below
      gl.endFrameEXP();
    }
    render();
  }
}

Expo.registerRootComponent(App);


function SpriteNode({image, tilesHoriz, tilesVert, numTiles, tileDispDuration, filter = THREE.NearestFilter, size, position, ...props})
{

  this.setup = async () => {
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
    this.mesh.position = {...position, z: 0};

  }



}

function TextureAnimator(texture, tilesHoriz, tilesVert, numTiles, tileDispDuration)
{
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

  // how long has the current image been displayed?
  this.currentDisplayTime = 0;

  // which image is currently being displayed?
  this.currentTile = 0;

  this.update = function( milliSec )
  {
    this.currentDisplayTime += milliSec;
    while (this.currentDisplayTime > this.tileDisplayDuration)
    {
      this.currentDisplayTime -= this.tileDisplayDuration;
      this.currentTile++;
      if (this.currentTile == this.numberOfTiles)
      this.currentTile = 0;
      var currentColumn = this.currentTile % this.tilesHorizontal;
      texture.offset.x = currentColumn / this.tilesHorizontal;
      var currentRow = Math.floor( this.currentTile / this.tilesHorizontal );
      texture.offset.y = currentRow / this.tilesVertical;
    }
  };
}
