import Node from "./Node";

export default class Character extends Node {
  _dx = 0;
  _dy = 0;
  _speed = 0;
  constructor({ speed, ...props }) {
    super(props);
    this._speed = speed || 0;
  }

  setVelocity = velocity => {
    velocity = velocity || {};
    this._dx = velocity.dx || 0;
    this._dy = velocity.dy || 0;
  };

  update = dt => {
    super.update(dt);
    this._updateVelocity();
  };

  _updateVelocity = () => {
    this.position.x += this._dx * this._speed;
    this.position.y += this._dy * this._speed;
  };
}
