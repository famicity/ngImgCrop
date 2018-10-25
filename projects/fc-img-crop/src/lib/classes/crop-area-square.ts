import {CropArea} from "./crop-area";
import {FcImgCropEvent} from "./crop-pubsub";

export class CropAreaSquare extends CropArea {
    _resizeCtrlBaseRadius = 10;
    _resizeCtrlNormalRatio = 0.75;
    _resizeCtrlHoverRatio = 1;
    _iconMoveNormalRatio = 0.9;
    _iconMoveHoverRatio = 1.2;

    _posDragStartX = 0;
    _posDragStartY = 0;
    _posResizeStartX = 0;
    _posResizeStartY = 0;
    _posResizeStartSize = 0;

    _resizeCtrlIsHover = -1;
    _areaIsHover = false;
    _resizeCtrlIsDragging = -1;
    _areaIsDragging = false;

    private _resizeCtrlNormalRadius: number;
    private _resizeCtrlHoverRadius: number;

    constructor(ctx, events) {
        super(ctx, events);

        this._resizeCtrlNormalRadius = this._resizeCtrlBaseRadius * this._resizeCtrlNormalRatio;
        this._resizeCtrlHoverRadius = this._resizeCtrlBaseRadius * this._resizeCtrlHoverRatio;
    };

    _calcSquareCorners() {
        var hSize = this._size / 2;
        return [
            [this._x - hSize, this._y - hSize],
            [this._x + hSize, this._y - hSize],
            [this._x - hSize, this._y + hSize],
            [this._x + hSize, this._y + hSize]
        ];
    }

    _calcSquareDimensions() {
        var hSize = this._size / 2;
        return {
            left: this._x - hSize,
            top: this._y - hSize,
            right: this._x + hSize,
            bottom: this._y + hSize
        };
    }

    _isCoordWithinArea(coord) {
        var squareDimensions = this._calcSquareDimensions();
        return (coord[0] >= squareDimensions.left && coord[0] <= squareDimensions.right && coord[1] >= squareDimensions.top && coord[1] <= squareDimensions.bottom);
    }

    _isCoordWithinResizeCtrl(coord) {
        var resizeIconsCenterCoords = this._calcSquareCorners();
        var res = -1;
        for (var i = 0, len = resizeIconsCenterCoords.length; i < len; i++) {
            var resizeIconCenterCoords = resizeIconsCenterCoords[i];
            if (coord[0] > resizeIconCenterCoords[0] - this._resizeCtrlHoverRadius && coord[0] < resizeIconCenterCoords[0] + this._resizeCtrlHoverRadius &&
                coord[1] > resizeIconCenterCoords[1] - this._resizeCtrlHoverRadius && coord[1] < resizeIconCenterCoords[1] + this._resizeCtrlHoverRadius) {
                res = i;
                break;
            }
        }
        return res;
    }

    _drawArea(ctx, centerCoords, size) {
        var hSize = size / 2;
        ctx.rect(centerCoords[0] - hSize, centerCoords[1] - hSize, size, size);
    }

    draw() {
        CropArea.prototype.draw.apply(this, arguments);

        // draw move icon
        this._cropCanvas.drawIconMove([this._x, this._y], this._areaIsHover ? this._iconMoveHoverRatio : this._iconMoveNormalRatio);

        // draw resize cubes
        var resizeIconsCenterCoords = this._calcSquareCorners();
        for (var i = 0, len = resizeIconsCenterCoords.length; i < len; i++) {
            var resizeIconCenterCoords = resizeIconsCenterCoords[i];
            this._cropCanvas.drawIconResizeCircle(resizeIconCenterCoords, this._resizeCtrlBaseRadius, this._resizeCtrlIsHover === i ? this._resizeCtrlHoverRatio : this._resizeCtrlNormalRatio);
        }
    }

    processMouseMove(mouseCurX, mouseCurY) {
        var cursor = 'default';
        var res = false;

        this._resizeCtrlIsHover = -1;
        this._areaIsHover = false;

        if (this._areaIsDragging) {
            this._x = mouseCurX - this._posDragStartX;
            this._y = mouseCurY - this._posDragStartY;
            this._areaIsHover = true;
            cursor = 'move';
            res = true;
            this._events.trigger(FcImgCropEvent.AreaMove);
        } else if (this._resizeCtrlIsDragging > -1) {
            var xMulti, yMulti;
            switch (this._resizeCtrlIsDragging) {
                case 0: // Top Left
                    xMulti = -1;
                    yMulti = -1;
                    cursor = 'nwse-resize';
                    break;
                case 1: // Top Right
                    xMulti = 1;
                    yMulti = -1;
                    cursor = 'nesw-resize';
                    break;
                case 2: // Bottom Left
                    xMulti = -1;
                    yMulti = 1;
                    cursor = 'nesw-resize';
                    break;
                case 3: // Bottom Right
                    xMulti = 1;
                    yMulti = 1;
                    cursor = 'nwse-resize';
                    break;
            }
            var iFX = (mouseCurX - this._posResizeStartX) * xMulti;
            var iFY = (mouseCurY - this._posResizeStartY) * yMulti;
            var iFR;
            if (iFX > iFY) {
                iFR = this._posResizeStartSize + iFY;
            } else {
                iFR = this._posResizeStartSize + iFX;
            }
            var wasSize = this._size;
            this._size = Math.max(this._minSize, iFR);
            var posModifier = (this._size - wasSize) / 2;
            this._x += posModifier * xMulti;
            this._y += posModifier * yMulti;
            this._resizeCtrlIsHover = this._resizeCtrlIsDragging;
            res = true;
            this._events.trigger(FcImgCropEvent.AreaResize);
        } else {
            var hoveredResizeBox = this._isCoordWithinResizeCtrl([mouseCurX, mouseCurY]);
            if (hoveredResizeBox > -1) {
                switch (hoveredResizeBox) {
                    case 0:
                        cursor = 'nwse-resize';
                        break;
                    case 1:
                        cursor = 'nesw-resize';
                        break;
                    case 2:
                        cursor = 'nesw-resize';
                        break;
                    case 3:
                        cursor = 'nwse-resize';
                        break;
                }
                this._areaIsHover = false;
                this._resizeCtrlIsHover = hoveredResizeBox;
                res = true;
            } else if (this._isCoordWithinArea([mouseCurX, mouseCurY])) {
                cursor = 'move';
                this._areaIsHover = true;
                res = true;
            }
        }

        this._dontDragOutside();
        this._ctx.canvas.style.cursor = cursor;

        return res;
    }

    processMouseDown(mouseDownX, mouseDownY) {
        var isWithinResizeCtrl = this._isCoordWithinResizeCtrl([mouseDownX, mouseDownY]);
        if (isWithinResizeCtrl > -1) {
            this._areaIsDragging = false;
            this._areaIsHover = false;
            this._resizeCtrlIsDragging = isWithinResizeCtrl;
            this._resizeCtrlIsHover = isWithinResizeCtrl;
            this._posResizeStartX = mouseDownX;
            this._posResizeStartY = mouseDownY;
            this._posResizeStartSize = this._size;
            this._events.trigger(FcImgCropEvent.AreaResizeStart);
        } else if (this._isCoordWithinArea([mouseDownX, mouseDownY])) {
            this._areaIsDragging = true;
            this._areaIsHover = true;
            this._resizeCtrlIsDragging = -1;
            this._resizeCtrlIsHover = -1;
            this._posDragStartX = mouseDownX - this._x;
            this._posDragStartY = mouseDownY - this._y;
            this._events.trigger(FcImgCropEvent.AreaMoveStart);
        }
    }

    processMouseUp(/*mouseUpX, mouseUpY*/) {
        if (this._areaIsDragging) {
            this._areaIsDragging = false;
            this._events.trigger(FcImgCropEvent.AreaMoveEnd);
        }
        if (this._resizeCtrlIsDragging > -1) {
            this._resizeCtrlIsDragging = -1;
            this._events.trigger(FcImgCropEvent.AreaResizeEnd);
        }
        this._areaIsHover = false;
        this._resizeCtrlIsHover = -1;

        this._posDragStartX = 0;
        this._posDragStartY = 0;
    }
}