import {CropCanvas} from "./crop-canvas";

export enum FcImgCropAreaType {
  Square = 'square',
  Circle = 'circle'
}

export abstract class CropArea {
  protected _minSize = 80;
  protected _cropCanvas: CropCanvas;
  protected _image = new Image();
  protected _x = 0;
  protected _y = 0;
  protected _size = 200;

  constructor(protected _ctx, protected _events) {
    this._cropCanvas = new CropCanvas(_ctx);
  }

  getImage() {
    return this._image;
  }

  setImage(image) {
    this._image = image;
  };

  getX() {
    return this._x;
  };

  setX(x) {
    this._x = x;
    this._dontDragOutside();
  };

  getY() {
    return this._y;
  };

  setY(y) {
    this._y = y;
    this._dontDragOutside();
  };

  getSize() : number {
    return this._size;
  };

  setSize(size) {
    this._size = Math.max(this._minSize, size);
    this._dontDragOutside();
  };

  getMinSize() {
    return this._minSize;
  };

  setMinSize(size) {
    this._minSize = size;
    this._size = Math.max(this._minSize, this._size);
    this._dontDragOutside();
  };

  _dontDragOutside() {
    var h = this._ctx.canvas.height,
      w = this._ctx.canvas.width;
    if (this._size > w) {
      this._size = w;
    }
    if (this._size > h) {
      this._size = h;
    }
    if (this._x < this._size / 2) {
      this._x = this._size / 2;
    }
    if (this._x > w - this._size / 2) {
      this._x = w - this._size / 2;
    }
    if (this._y < this._size / 2) {
      this._y = this._size / 2;
    }
    if (this._y > h - this._size / 2) {
      this._y = h - this._size / 2;
    }
  };

  abstract _drawArea(ctx, centerCoords, size);

  draw() {
    this._cropCanvas.drawCropArea(this._image, [this._x, this._y], this._size, this._drawArea);
  };

  abstract processMouseMove(mouseCurX: number, mouseCurY: number);

  abstract processMouseDown(mouseDownX: number, mouseDownY: number);

  abstract processMouseUp(mouseDownX: number, mouseDownY: number);
}