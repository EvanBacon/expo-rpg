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
import { StyleSheet, Image, View } from 'react-native';
const THREE = require('three');
import ExpoTHREE from 'expo-three';
import Images from '../Images'
import SpriteView from './SpriteView';

import Sprite from './Sprite';
import Character from './Character';

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

export default class Game extends React.Component {
  state ={width:0, height: 0}

  renderDPad = () => (
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
    )

    render() {
      return (
        <View onLayout={({nativeEvent:{layout:{width, height}}}) => this.setState({width, height}) } style={StyleSheet.absoluteFill}>
          <Image source={Images.map} style={StyleSheet.flatten([{width: this.state.width, height: this.state.height, resizeMode: 'cover'}])}/>

        <SpriteView
          touchDown={({x, y}) => {
          }}
          touchMoved={({x, y}) => {
          }}
          touchUp={({x, y}) => {
          }}
          update={(currentTime) => {

            this.node.update(currentTime);

          }}
          onSetup={ async ({scene, camera}) => {
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

          }}
        />
        {this.renderDPad()}
      </View>
    );
  }
}
