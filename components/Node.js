import * as THREE from "three"; // 0.88.0

export default class Node extends THREE.Group {
  constructor({ sprites, selectedSpriteKey, ...props }) {
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
        lastSprite.visible = !this.isAnimating;
      }
      this.selectedSpriteKey = key;
    }
  };

  getSelectedSprite = () => {
    if (this.selectedSpriteKey) {
      if (this.sprites.hasOwnProperty(this.selectedSpriteKey)) {
        return this.sprites[this.selectedSpriteKey];
      }
    }
  };

  update(dt) {
    let sprite = this.getSelectedSprite();
    if (sprite) {
      sprite.animation.update(1000 * dt);
    }
  }
}
