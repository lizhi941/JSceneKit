'use strict'

import NSObject from '../ObjectiveC/NSObject'
import SKActionTimingMode from './SKActionTimingMode'
//import CGVector from '../CoreGraphics/CGVector'
import CGPoint from '../CoreGraphics/CGPoint'
//import CGPath from '../CoreGraphics/CGPath'
import CGSize from '../CoreGraphics/CGSize'
import CGRect from '../CoreGraphics/CGRect'
import SKColor from './SKColor'
//import SKTexture from './SKTexture'
//import SKWarpGeometry from './SKWarpGeometry'
//import SKNode from './SKNode'
//import SKActionTimingFunction from './SKActionTimingFunction'


/**
 * An object that is executed by an SKNode to change its structure or content.
 * @access public
 * @extends {NSObject}
 * @see https://developer.apple.com/reference/spritekit/skaction
 */
export default class SKAction extends NSObject {

  // Creating Custom Actions

  /**
   * Creates an action of the given name from an action file with a new duration.
   * @access public
   * @constructor
   * @param {string} name - The name of the action.
   * @param {string} url - The URL of the file containing the action.
   * @param {number} sec - The duration of the action, in seconds.
   * @see https://developer.apple.com/reference/spritekit/skaction/1417754-init
   */
  constructor(name, url, sec) {
    super()

    // Inspecting an Action’s Animation Properties

    /**
     * A speed factor that modifies how fast an action runs.
     * @type {number}
     * @see https://developer.apple.com/reference/spritekit/skaction/1417718-speed
     */
    this._speed = 1.0

    /**
     * The timing mode used to execute an action.
     * @type {SKActionTimingMode}
     * @see https://developer.apple.com/reference/spritekit/skaction/1417807-timingmode
     */
    this._timingMode = SKActionTimingMode.linear

    /**
     * A block used to customize the timing function.
     * @type {SKActionTimingFunction}
     * @see https://developer.apple.com/reference/spritekit/skaction/1417666-timingfunction
     */
    this._timingFunction = null

    /**
     * The duration required to complete an action.
     * @type {number}
     * @see https://developer.apple.com/reference/spritekit/skaction/1417790-duration
     */
    this._duration = 0

    /**
     * @access private
     * @type {boolean}
     */
    this._finished = false

    this._beginTime = 0
    this._isRunning = false
    this._pausedTime = 0
    this._completionHandler = null

    this.__actionStartTime = null
  }

  /**
   * A speed factor that modifies how fast an action runs.
   * @type {number}
   * @see https://developer.apple.com/reference/spritekit/skaction/1417718-speed
   */
  get speed() {
    return this._speed
  }
  set speed(newValue) {
    this._speed = newValue
  }

  /**
   * The timing mode used to execute an action.
   * @type {SKActionTimingMode}
   * @see https://developer.apple.com/reference/spritekit/skaction/1417807-timingmode
   */
  get timingMode() {
    return this._timingMode
  }
  set timingMode(newValue) {
    this._timingMode = newValue
  }

  /**
   * A block used to customize the timing function.
   * @type {SKActionTimingFunction}
   * @see https://developer.apple.com/reference/spritekit/skaction/1417666-timingfunction
   */
  get timingFunction() {
    return this._timingFunction
  }
  set timingFunction(newValue) {
    this._timingFunction = newValue
  }

  /**
   * The duration required to complete an action.
   * @type {number}
   * @see https://developer.apple.com/reference/spritekit/skaction/1417790-duration
   */
  get duration() {
    return this._duration
  }
  set duration(newValue) {
    this._duration = newValue
  }

  get _actionStartTime() {
    return this.__actionStartTime
  }
  set _actionStartTime(newValue) {
    this.__actionStartTime = newValue
  }

  /**
   * @access public
   * @returns {SKAction} -
   */
  copy() {
    const action = super.copy()

    action._beginTime = this._beginTime
    action._duration = this._duration
    action._speed = this.speed
    action._timingMode = this.timingMode
    action._timingFunction = this.timingFunction
    action._finished = this._finished
    //action._isRunning = this._isRunning
    //action._pausedTime = this._pausedTime
    //action._completionHandler = this._completionHandler

    return action
  }

  /**
   * apply action to the given node.
   * @access private
   * @param {Object} obj - target object to apply this action.
   * @param {number} time - active time
   * @param {boolean} [needTimeConversion = true] -
   * @returns {void}
   */
  _applyAction(obj, time, needTimeConversion = true) {
    const t = this._getTime(time, needTimeConversion)
    //this._handleEvents(obj, t)
  }

  _getTime(time, needTimeConversion) {
    if(!needTimeConversion){
      if(time >= 1.0 && !this._finished){
        this._finished = true
      }
      return time
    }

    const baseTime = this._basetimeFromTime(time)
    if(this.timingFunction === null){
      return baseTime
    }

    return this.timingFunction._getValueAtTime(baseTime)
  }

  /**
   * convert parent time to base time
   * @access private
   * @param {number} time - parent time
   * @returns {number} - animation base time for the current frame (0-1 or null).
   */
  _basetimeFromTime(time) {
    const activeTime = time - this._actionStartTime
    return this._basetimeFromActivetime(activeTime)
  }

  /**
   * convert parent time to active time
   * @access private
   * @param {number} time - parent time
   * @returns {number} - animation active time for the current frame.
   */
  _activetimeFromTime(time) {
    return time - this._actionStartTime
  }

  /**
   * convert active time to base time
   * @access private
   * @param {number} time - active time
   * @returns {number} - animation base time for the current frame (0-1 or null).
   */
  _basetimeFromActivetime(time) {
    let dt = time - this._beginTime
    //let dt = time
    if(this.speed === 0){
      return 0
    }
    if(this._duration === 0){
      return dt / Math.abs(this.speed)
    }
    let duration = this._duration / Math.abs(this.speed)
    if(duration === 0){
      duration = 0.25
    }

    if(dt >= duration){
      // the action is over.
      if(!this._finished){
        this._finished = true
      }
    }

    return dt / duration
  }

  /**
   * @access private
   * @param {Object} from -
   * @param {Object} to -
   * @param {number} t -
   * @returns {Object} -
   */
  _lerp(from, to, t) {
    if(t === null){
      // the action is over.
      return to
    }
    //if(from instanceof SCNVector4){
    //  // TODO: slerp for Quaternion
    //  return from.lerp(to, t)
    //}else if(from instanceof SCNVector3){
    //  return from.lerp(to, t)
    //}else if(from instanceof CGSize){
    if(from instanceof CGSize){
      return from._lerp(to, t)
    }else if(from instanceof CGPoint){
      return from._lerp(to, t)
    }else if(from instanceof CGRect){
      return from._lerp(to, t)
    }else if(from instanceof SKColor){
      return from._lerp(to, t)
    }
    return from + (to - from) * t
  }

  /**
   * @access private
   * @param {Object} from -
   * @param {Object} to -
   * @param {number} t -
   * @returns {Object} -
   */
  //_slerp(from, to, t) {
  //  if(!(from instanceof SCNVector4)){
  //    throw new Error('SCNAction._slerp: object is not SCNVector4')
  //  }
  //  return from.slerp(to, t)
  //}

  _resetFinished() {
    this._finished = false
  }


  /**
   * Creates an action of the given name from an action file.
   * @access public
   * @param {string} name - The name of the action.
   * @returns {SKAction}
   * @see https://developer.apple.com/reference/spritekit/skaction/1417814-init
   */
  static actionWithName(name) {
    return new SKAction(name, null, 0.25)
  }

  /**
   * Creates an action of the given name from an action file with a new duration.
   * @access public
   * @param {string} name - The name of the action.
   * @param {number} sec - The duration of the action.
   * @returns {void}
   * @see https://developer.apple.com/reference/spritekit/skaction/1417697-init
   */
  static actionWithNamedDuration(name, sec) {
    return new SKAction(name, null, sec)
  }

  /**
   * Creates an action of the given name from an action file.
   * @access public
   * @param {string} name - The name of the action.
   * @param {string} url - The URL of the file containing the action.
   * @returns {void}
   * @see https://developer.apple.com/reference/spritekit/skaction/1417680-init
   */
  static actionWithNamedFrom(name, url) {
    return new SKAction(name, url)
  }

  
  // Creating Actions That Move Nodes

  /**
   * Creates an action that moves a node relative to its current position.
   * @access public
   * @param {number} deltaX - The x-value, in points, to add to the node’s position.
   * @param {number} deltaY - The y-value, in points, to add to the node’s position.
   * @param {number} sec - The duration of the animation.
   * @returns {SKAction} - 
   * @desc When the action executes, the node’s position property animates from its current position to its new position.This action is reversible; the reverse is created as if the following code is executed:let negDelta = CGVector(dx: -deltaX, dy: -deltaY)
let action = SKAction.moveBy(x: -deltaX, y: -deltaX, duration: sec)
let negDelta = CGVector(dx: -deltaX, dy: -deltaY)
let action = SKAction.moveBy(x: -deltaX, y: -deltaX, duration: sec)

   * @see https://developer.apple.com/reference/spritekit/skaction/1417722-moveby
   */
  static moveByXYDuration(deltaX, deltaY, sec) {
    return null
  }

  /**
   * Creates an action that moves a node relative to its current position.
   * @access public
   * @param {CGVector} delta - A vector that describes the change to apply to the node’s position.
   * @param {number} sec - The duration of the animation.
   * @returns {SKAction} - 
   * @desc When the action executes, the node’s position property animates from its current position to its new position.This action is reversible; the reverse is created as if the following code is executed:let negDelta = CGVector(dx: -deltaX, dy: -deltaY)
let action = SKAction.move(by: negDelta, duration: sec)
let negDelta = CGVector(dx: -deltaX, dy: -deltaY)
let action = SKAction.move(by: negDelta, duration: sec)

   * @see https://developer.apple.com/reference/spritekit/skaction/1417739-move
   */
  static moveByDuration(delta, sec) {
    return null
  }

  /**
   * Creates an action that moves a node to a new position.
   * @access public
   * @param {CGPoint} location - The coordinates for the node’s new position.
   * @param {number} sec - The duration of the animation.
   * @returns {SKAction} - 
   * @desc When the action executes, the node’s position property animates from its current position to its new position.This action is not reversible; the reverse of this action has the same duration but does not move the node.
   * @see https://developer.apple.com/reference/spritekit/skaction/1417768-move
   */
  static moveToDuration(location, sec) {
    return null
  }

  /**
   * Creates an action that moves the node along a relative path, orienting the node to the path.
   * @access public
   * @param {CGPath} path - A Core Graphics path whose coordinates are relative to the node’s current position.
   * @param {number} sec - The duration of the animation.
   * @returns {SKAction} - 
   * @desc Calling this method is equivalent to calling the follow(_:asOffset:orientToPath:duration:) method, passing in true to both the offset and orient parameters.This action is reversible; the resulting action creates and then follows a reversed path with the same duration.
   * @see https://developer.apple.com/reference/spritekit/skaction/1417822-follow
   */
  static followDuration(path, sec) {
    return null
  }

  /**
   * Creates an action that moves the node along a relative path at a specified speed, orienting the node to the path.
   * @access public
   * @param {CGPath} path - A Core Graphics path whose coordinates are relative to the node’s current position.
   * @param {number} speed - The speed at which the node should move, in points per second.
   * @returns {SKAction} - 
   * @desc Calling this method is equivalent to calling the follow(_:asOffset:orientToPath:speed:) method, passing in true to both the offset and orient parameters.This action is reversible; the resulting action creates and then follows a reversed path with the same speed.
   * @see https://developer.apple.com/reference/spritekit/skaction/1417786-follow
   */
  static follow(path, speed) {
    return null
  }

  /**
   * Creates an action that moves the node along a path.
   * @access public
   * @param {CGPath} path - A path to follow.
   * @param {boolean} offset - If true, the points in the path are relative offsets to the node’s starting position. If false, the points in the node are absolute coordinate values.
   * @param {boolean} orient - If true, the node’s zRotation property animates so that the node turns to follow the path. If false, the zRotation property of the node is unchanged.
   * @param {number} sec - The duration of the animation.
   * @returns {SKAction} - 
   * @desc When the action executes, the node’s position and zRotation properties are animated along the provided path.This action is reversible; the resulting action creates a reversed path and then follows it, with the same duration.
   * @see https://developer.apple.com/reference/spritekit/skaction/1417662-follow
   */
  static followAsOffsetOrientToPathDuration(path, offset, orient, sec) {
    return null
  }

  /**
   * Creates an action that moves the node at a specified speed along a path.
   * @access public
   * @param {CGPath} path - A path to follow.
   * @param {boolean} offset - If true, the points in the path are relative offsets to the node’s starting position. If false, the points in the node are absolute coordinate values.
   * @param {boolean} orient - If true, the node’s zRotation property animates so that the node turns to follow the path. If false, the zRotation property of the node is unchanged.
   * @param {number} speed - The speed at which the node should move, in points per second.
   * @returns {SKAction} - 
   * @desc When the action executes, the node’s position and zRotation properties are animated along the provided path. The duration of the action is determined by the length of the path and the speed of the node.This action is reversible; the resulting action creates a reversed path and then follows it, with the same speed.
   * @see https://developer.apple.com/reference/spritekit/skaction/1417798-follow
   */
  static followAsOffsetOrientToPath(path, offset, orient, speed) {
    return null
  }

  // Creating Actions That Rotate Nodes

  /**
   * Creates an action that rotates the node by a relative value.
   * @access public
   * @param {number} radians - The amount to rotate the node, in radians.
   * @param {number} sec - The duration of the animation.
   * @returns {SKAction} - 
   * @desc When the action executes, the node’s zRotation property animates to the new angle.This action is reversible; the reverse is created as if the following code is executed:let action = SKAction.rotate(byAngle: -radians, duration: sec)
let action = SKAction.rotate(byAngle: -radians, duration: sec)

   * @see https://developer.apple.com/reference/spritekit/skaction/1417805-rotate
   */
  static rotateByAngleDuration(radians, sec) {
    return null
  }

  /**
   * Creates an action that rotates the node counterclockwise to an absolute angle.
   * @access public
   * @param {number} radians - The angle to rotate the node to, in radians.
   * @param {number} sec - The duration of the animation.
   * @returns {SKAction} - 
   * @desc When the action executes, the node’s zRotation property is interpolated to the new angle.This action is not reversible; the reverse of this action has the same duration but does not change anything.
   * @see https://developer.apple.com/reference/spritekit/skaction/1417668-rotate
   */
  static rotateToAngleDuration(radians, sec) {
    return null
  }

  // Creating Actions That Change a Node’s Animation Speed

  /**
   * Creates an action that changes how fast the node executes actions by a relative value.
   * @access public
   * @param {number} speed - The amount to add to the node’s speed.
   * @param {number} sec - The duration of the animation.
   * @returns {SKAction} - 
   * @desc When the action executes, the node’s speed property animates to the new value.This action is reversible; the reverse is created as if the following code is executed:let action = SKAction.speed(by: -speed, duration: sec)
let action = SKAction.speed(by: -speed, duration: sec)

   * @see https://developer.apple.com/reference/spritekit/skaction/1417690-speed
   */
  static speedByDuration(speed, sec) {
    return null
  }

  /**
   * Creates an action that changes how fast the node executes actions.
   * @access public
   * @param {number} speed - The new value for the node’s speed.
   * @param {number} sec - The duration of the animation.
   * @returns {SKAction} - 
   * @desc When the action executes, the node’s speed property animates to the new value.This action is not reversible; the reverse of this action has the same duration but does not change anything.
   * @see https://developer.apple.com/reference/spritekit/skaction/1417684-speed
   */
  static speedToDuration(speed, sec) {
    return null
  }

  // Creating Actions That Change a Node’s Scale

  /**
   * Creates an action that changes the x and y scale values of a node by a relative value.
   * @access public
   * @param {number} scale - The amount to add to the node’s x and y scale values.
   * @param {number} sec - The duration of the animation.
   * @returns {SKAction} - 
   * @desc When the action executes, the node’s xScale and yScale properties are animated to the new value.This action is reversible; the reverse is created as if the following code is executed:let action = SKAction.scale(by: -scale, duration: sec)
let action = SKAction.scale(by: -scale, duration: sec)

   * @see https://developer.apple.com/reference/spritekit/skaction/1417741-scale
   */
  static scaleByDuration(scale, sec) {
    return null
  }

  /**
   * Creates an action that changes the x and y scale values of a node to achieve 
   * @access public
   * @param {CGSize} size - The new size of the node.
   * @param {number} sec - The duration of the animation.
   * @returns {SKAction} - 
   * @desc When the action executes, the node’s xScale and yScale properties are animated to achieve the specified size in its parent's coordinate space. This action is not reversible; the reverse of this action has the same duration but does not change anything.
   * @see https://developer.apple.com/reference/spritekit/skaction/1643619-scale
   */
  static scaleToDuration(size, sec) {
    return null
  }

  /**
   * Creates an action that adds relative values to the x and y scale values of a node.
   * @access public
   * @param {number} xScale - The amount to add to the node’s x scale value.
   * @param {number} yScale - The amount to add to the node’s y scale value.
   * @param {number} sec - The duration of the animation.
   * @returns {SKAction} - 
   * @desc When the action executes, the node’s xScale and yScale properties are animated to the new value.This action is reversible; the reverse is created as if the following code is executed:let action = SKAction.scaleX(by: -scaleX, y: -scaleY, duration: sec)
let action = SKAction.scaleX(by: -scaleX, y: -scaleY, duration: sec)

   * @see https://developer.apple.com/reference/spritekit/skaction/1417796-scalex
   */
  static scaleXByYDuration(xScale, yScale, sec) {
    return null
  }

  /**
   * Creates an action that changes the x and y scale values of a node.
   * @access public
   * @param {number} xScale - The new value for the node’s x scale value.
   * @param {number} yScale - The new value for the node’s y scale value.
   * @param {number} sec - The duration of the animation.
   * @returns {SKAction} - 
   * @desc When the action executes, the node’s xScale and yScale properties are animated to the new value.This action is not reversible; the reverse of this action has the same duration but does not change anything.
   * @see https://developer.apple.com/reference/spritekit/skaction/1417728-scalex
   */
  static scaleXToYDuration(xScale, yScale, sec) {
    return null
  }

  /**
   * Creates an action that changes the x scale value of a node to a new value.
   * @access public
   * @param {number} scale - The new value for the node’s x scale value.
   * @param {number} sec - The duration of the animation.
   * @returns {SKAction} - 
   * @desc When the action executes, the node’s xScale property animates to the new value.This action is not reversible; the reverse of this action has the same duration but does not change anything.
   * @see https://developer.apple.com/reference/spritekit/skaction/1417699-scalex
   */
  static scaleXToDuration(scale, sec) {
    return null
  }

  /**
   * Creates an action that changes the y scale value of a node to a new value.
   * @access public
   * @param {number} scale - The new value for the node’s y scale value.
   * @param {number} sec - The duration of the animation.
   * @returns {SKAction} - 
   * @desc When the action executes, the node’s yScale property animates to the new value.This action is not reversible; the reverse of this action has the same duration but does not change anything.
   * @see https://developer.apple.com/reference/spritekit/skaction/1417708-scaley
   */
  static scaleYToDuration(scale, sec) {
    return null
  }

  // Creating Actions to Show or Hide a Node

  /**
   * Creates an action that makes a node visible.
   * @access public
   * @returns {SKAction} - 
   * @desc This action has an instantaneous duration. When the action executes, the node’s isHidden property is set to false.This action is reversible; the reversed action hides the node.
   * @see https://developer.apple.com/reference/spritekit/skaction/1417660-unhide
   */
  static unhide() {
    return null
  }

  /**
   * Creates an action that hides a node.
   * @access public
   * @returns {SKAction} - 
   * @desc This action has an instantaneous duration. When the action executes, the node’s isHidden property is set to true.This action is reversible; the reversed action shows the node.
   * @see https://developer.apple.com/reference/spritekit/skaction/1417704-hide
   */
  static hide() {
    return null
  }

  // Creating Actions That Change a Node’s Transparency

  /**
   * Creates an action that changes the alpha value of the node to 1.0.
   * @access public
   * @param {number} sec - The duration of the animation.
   * @returns {SKAction} - 
   * @desc When the action executes, the node’s alpha property animates from its current value to 1.0.This action is reversible; the reverse is created as if the following code is executed:let action = SKAction.fadeOut(withDuration: sec)
let action = SKAction.fadeOut(withDuration: sec)

   * @see https://developer.apple.com/reference/spritekit/skaction/1417818-fadein
   */
  static fadeInWithDuration(sec) {
    return null
  }

  /**
   * Creates an action that changes the alpha value of the node to 0.0.
   * @access public
   * @param {number} sec - The duration of the animation.
   * @returns {SKAction} - 
   * @desc When the action executes, the node’s alpha property animates from its current value to 0.0. This causes the node to disappear.This action is reversible; the reverse is created as if the following code is executed:let action = SKAction.fadeIn(withDuration: sec)
let action = SKAction.fadeIn(withDuration: sec)

   * @see https://developer.apple.com/reference/spritekit/skaction/1417738-fadeout
   */
  static fadeOutWithDuration(sec) {
    return null
  }

  /**
   * Creates an action that adjusts the alpha value of a node by a relative value.
   * @access public
   * @param {number} factor - The amount to add to the node’s alpha value.
   * @param {number} sec - The duration of the animation.
   * @returns {SKAction} - 
   * @desc When the action executes, the node’s alpha property animates to its new value.This action is reversible; the reverse is created as if the following code is executed:let action = SKAction.fadeAlpha(by: -factor, duration: sec)
let action = SKAction.fadeAlpha(by: -factor, duration: sec)

   * @see https://developer.apple.com/reference/spritekit/skaction/1417716-fadealpha
   */
  static fadeAlphaByDuration(factor, sec) {
    return null
  }

  /**
   * Creates an action that adjusts the alpha value of a node to a new value.
   * @access public
   * @param {number} alpha - The new value of the node’s alpha.
   * @param {number} sec - The duration of the animation.
   * @returns {SKAction} - 
   * @desc When the action executes, the node’s alpha property animates to its new value.This action is not reversible; the reverse of this action has the same duration but does not change anything.
   * @see https://developer.apple.com/reference/spritekit/skaction/1417673-fadealpha
   */
  static fadeAlphaToDuration(alpha, sec) {
    return null
  }

  // Creating Actions That Change a Sprite Node’s Content

  /**
   * Creates an action that adjusts the size of a sprite.
   * @access public
   * @param {number} width - The amount to add to the sprite’s width.
   * @param {number} height - The amount to add to the sprite’s height.
   * @param {number} duration - The duration of the animation.
   * @returns {SKAction} - 
   * @desc This action can only be executed by a SKSpriteNode object. When the action executes, the sprite’s size property animates to its new value.This action is reversible; the reverse is created as if the following code is executed:let action = SKAction.resize(byWidth: -width, height: -height, duration: sec)
let action = SKAction.resize(byWidth: -width, height: -height, duration: sec)

   * @see https://developer.apple.com/reference/spritekit/skaction/1417812-resize
   */
  static resizeByWidth(width, height, duration) {
    return null
  }

  /**
   * Creates an action that changes the height of a sprite to a new absolute value.
   * @access public
   * @param {number} height - The new height of the sprite.
   * @param {number} duration - The duration of the animation.
   * @returns {SKAction} - 
   * @desc This action can only be executed by an SKSpriteNode object. When the action executes, the sprite’s size property animates to its new value.This action is not reversible; the reverse of this action has the same duration but does not change anything.
   * @see https://developer.apple.com/reference/spritekit/skaction/1417825-resize
   */
  static resizeToHeight(height, duration) {
    return null
  }

  /**
   * Creates an action that changes the width of a sprite to a new absolute value.
   * @access public
   * @param {number} width - The new width of the sprite.
   * @param {number} duration - The duration of the animation.
   * @returns {SKAction} - 
   * @desc This action can only be executed by an SKSpriteNode object. When the action executes, the sprite’s size property animates to its new value.This action is not reversible; the reverse of this action has the same duration but does not change anything.
   * @see https://developer.apple.com/reference/spritekit/skaction/1417686-resize
   */
  static resizeToWidth(width, duration) {
    return null
  }

  /**
   * Creates an action that changes a sprite’s texture.
   * @access public
   * @param {SKTexture} texture - The new texture to use on the sprite.
   * @returns {SKAction} - 
   * @desc This action can only be executed by an SKSpriteNode object. When the action executes, the sprite’s texture property changes immediately to the new texture.This action is not reversible; the reverse of this action does nothing.
   * @see https://developer.apple.com/reference/spritekit/skaction/1417784-settexture
   */
  static setTexture(texture) {
    return null
  }

  /**
   * Creates an action that animates changes to a sprite’s texture.
   * @access public
   * @param {SKTexture[]} textures - An array of textures to use when animating a sprite.
   * @param {number} sec - The duration, in seconds, that each texture is displayed. 
   * @returns {SKAction} - 
   * @desc This action can only be executed by an SKSpriteNode object. When the action executes, the sprite’s texture property animates through the array of textures. The sprite’s texture property is changed to the next texture in the array. The action then pauses for the specified time before continuing. The action continues until it has finished animating through all of the textures in the array. The total duration of the action is the number of textures multiplied by the frame interval.This action is reversible; the resulting action animates through the same textures from last to first.
   * @see https://developer.apple.com/reference/spritekit/skaction/1417828-animate
   */
  static animateWithTimePerFrame(textures, sec) {
    return null
  }

  /**
   * Creates an action that changes a sprite’s normal texture.
   * @access public
   * @param {SKTexture} texture - The new texture to use on the sprite.
   * @returns {SKAction} - 
   * @desc This action can only be executed by an SKSpriteNode object. When the action executes, the sprite’s normalTexture property changes immediately to the new texture.This action is not reversible; the reverse of this action does nothing.
   * @see https://developer.apple.com/reference/spritekit/skaction/1417706-setnormaltexture
   */
  static setNormalTexture(texture) {
    return null
  }

  /**
   * Creates an action that animates changes to a sprite’s normal texture.
   * @access public
   * @param {SKTexture[]} textures - An array of textures to use.
   * @param {number} sec - The amount of time that each texture is displayed.
   * @returns {SKAction} - 
   * @desc This action can only be executed by an SKSpriteNode object. When the action executes, the sprite’s normalTexture property animates through the array of textures. The sprite’s normalTexture property is changed to the next texture in the array. The action then pauses for the specified time before continuing. The action continues until it has finished animating through all of the textures in the array. The total duration of the action is the number of textures multiplied by the frame interval.This action is reversible; the resulting action animates through the same textures from last to first.
   * @see https://developer.apple.com/reference/spritekit/skaction/1417746-animate
   */
  static animateWithNormalTexturesTimePerFrame(textures, sec) {
    return null
  }

  /**
   * Creates an animation that animates a sprite’s color and blend factor.
   * @access public
   * @param {CGColor} color - The new color for the sprite.
   * @param {number} colorBlendFactor - The new blend factor for the sprite.
   * @param {number} sec - The duration of the animation.
   * @returns {SKAction} - 
   * @desc This action can only be executed by an SKSpriteNode object. When the action executes, the sprite’s color and colorBlendFactor properties are animated to their new values.This action is not reversible; the reverse of this action does nothing.
   * @see https://developer.apple.com/reference/spritekit/skaction/1417678-colorize
   */
  static colorizeWithDuration(color, colorBlendFactor, sec) {
    return null
  }

  // Creating Physics Actions

  /**
   * Creates an action that applies a force to the center of gravity of a node’s physics body.
   * @access public
   * @param {CGVector} force - A vector that describes how much force is applied in each dimension. The force is measured in Newtons.
   * @param {number} sec - The duration over which the force is applied to the physics body.
   * @returns {SKAction} - 
   * @desc When the action executes, the force is applied continuously to the physics body for the duration of the action. This action accelerates the body without imparting any angular acceleration to it.This action is reversible; it applies an equal force in the opposite direction.
   * @see https://developer.apple.com/reference/spritekit/skaction/1417782-applyforce
   */
  static applyForceDuration(force, sec) {
    return null
  }

  /**
   * Creates an action that applies a torque to an node’s physics body.
   * @access public
   * @param {number} torque - The amount of torque, in Newton-meters.
   * @param {number} sec - The duration over which the torque is applied to the physics body.
   * @returns {SKAction} - 
   * @desc When the action executes, the torque is applied continuously to the physics body for the duration of the action. This action generates an angular acceleration on the body without causing any linear acceleration.This action is reversible; it applies an equal torque in the opposite direction.
   * @see https://developer.apple.com/reference/spritekit/skaction/1417756-applytorque
   */
  static applyTorqueDuration(torque, sec) {
    return null
  }

  /**
   * Creates an action that applies an force to a specific point on a node’s physics body.
   * @access public
   * @param {CGVector} force - A vector that describes how much force is applied in each dimension. The force is measured in Newtons.
   * @param {CGPoint} point - A point in scene coordinates that defines where the force is applied to the physics body.
   * @param {number} sec - The duration over which the force is applied to the physics body.
   * @returns {SKAction} - 
   * @desc When the action executes, the force is applied continuously to the physics body for the duration of the action. Because the force is applied to a specific point on the body, it may impart both linear acceleration and angular acceleration. This action is reversible; it applies an equal force in the opposite direction.
   * @see https://developer.apple.com/reference/spritekit/skaction/1417823-applyforce
   */
  static applyForceAtDuration(force, point, sec) {
    return null
  }

  /**
   * Creates an action that applies an impulse to the center of gravity of a physics body.
   * @access public
   * @param {CGVector} impulse - A vector that describes how much momentum to impart to the body in each dimension over the duration of the action. The impulse is measured in Newton-seconds.
   * @param {number} sec - The duration over which the total impulse should be applied to the physics body.
   * @returns {SKAction} - 
   * @desc When the action executes, applies a constant force to the physics body for the duration of the action. The force is calculated by dividing the impulse strength by the duration of the action. For example, if an impulse of 1 Newton-second is applied to the physics body, and the the duration is 10 seconds, then a force of 0.1 Newtons is applied to the physics body.This action is reversible; it applies an equal impulse in the opposite direction.
   * @see https://developer.apple.com/reference/spritekit/skaction/1417770-applyimpulse
   */
  static applyImpulseDuration(impulse, sec) {
    return null
  }

  /**
   * Creates an action that applies an angular impulse to a node’s physics body.
   * @access public
   * @param {number} impulse - The total impulse to apply to the physics body. The impulse is measured in Newton-seconds.
   * @param {number} sec - The number of seconds over which to apply the impulse. For example, if you specify a duration of four seconds, one quarter of the impulse will be applied each second.
   * @returns {SKAction} - 
   * @desc When the action executes, applies a constant torque to the physics body for the duration of the action. The torque is calculated by dividing the impulse strength by the duration of the action. This action affects the body’s angular velocity without changing the body’s linear velocity.This action is reversible; it applies an equal angular impulse in the opposite direction.
   * @see https://developer.apple.com/reference/spritekit/skaction/1417775-applyangularimpulse
   */
  static applyAngularImpulseDuration(impulse, sec) {
    return null
  }

  /**
   * Creates an action that applies an impulse to a specific point of a node’s physics body.
   * @access public
   * @param {CGVector} impulse - The total impulse to apply to the physics body. The impulse is measured in Newton-seconds.
   * @param {CGPoint} point - A point in scene coordinates that defines where the impulse was applied to the physics body.
   * @param {number} sec - A new action object.
   * @returns {SKAction} - 
   * @desc When the action executes, applies a constant force to the physics body for the duration of the action. The force is calculated by dividing the impulse strength by the duration of the action. For example, if an impulse of 1 Newton-second is applied to the physics body, and the the duration is 10 seconds, then a force of 0.1 Newtons is applied to the physics body. Because the force is applied to a specific point on the body, it may impart both linear acceleration and angular acceleration.This action is reversible; it applies an equal impulse in the opposite direction.
   * @see https://developer.apple.com/reference/spritekit/skaction/1417732-applyimpulse
   */
  static applyImpulseAtDuration(impulse, point, sec) {
    return null
  }

  /**
   * Creates an action that changes the charge of a node’s physics body to a new value.
   * @access public
   * @param {number} v - The new charge of the physics body.
   * @param {number} duration - The duration of the animation.
   * @returns {SKAction} - 
   * @desc When the action executes, the physics body’s charge property animates from its current value to its new value.This action is not reversible.
   * @see https://developer.apple.com/reference/spritekit/skaction/1417752-changecharge
   */
  static changeChargeTo(v, duration) {
    return null
  }

  /**
   * Creates an action that changes the charge of a node’s physics body by a relative value.
   * @access public
   * @param {number} v - The amount to add to the physics body’s charge.
   * @param {number} duration - The duration of the animation.
   * @returns {SKAction} - 
   * @desc When the action executes, the physics body’s charge property animates from its current value to its new value.This action is reversible; the reverse is created as if the following code is executed:let action = SKAction.changeCharge(by: -v, duration: sec)
let action = SKAction.changeCharge(by: -v, duration: sec)

   * @see https://developer.apple.com/reference/spritekit/skaction/1417714-changecharge
   */
  static changeChargeBy(v, duration) {
    return null
  }

  /**
   * Creates an action that changes the mass of a node’s physics body to a new value.
   * @access public
   * @param {number} v - The new mass of the physics body.
   * @param {number} duration - The duration of the animation.
   * @returns {SKAction} - 
   * @desc When the action executes, the physics body’s mass property animates from its current value to its new value.This action is not reversible.
   * @see https://developer.apple.com/reference/spritekit/skaction/1417780-changemass
   */
  static changeMassTo(v, duration) {
    return null
  }

  /**
   * Creates an action that changes the mass of a node’s physics body by a relative value.
   * @access public
   * @param {number} v - The amount to add to the physics body’s mass.
   * @param {number} duration - The duration of the animation.
   * @returns {SKAction} - 
   * @desc When the action executes, the physics body’s mass property animates from its current value to its new value.This action is reversible; the reverse is created as if the following code is executed:let action = SKAction.changeMass(by: -v, duration: sec)
let action = SKAction.changeMass(by: -v, duration: sec)

   * @see https://developer.apple.com/reference/spritekit/skaction/1417710-changemass
   */
  static changeMassBy(v, duration) {
    return null
  }

  /**
   * Creates an action that animates a change of a physics field’s strength.
   * @access public
   * @param {number} strength - The new strength for the field.
   * @param {number} sec - The duration of the animation.
   * @returns {SKAction} - 
   * @desc When the action executes, the field node’s strength property animates from its current value to its new value.This action is not reversible; the reverse of this action has the same duration but does not do anything.
   * @see https://developer.apple.com/reference/spritekit/skaction/1417815-strength
   */
  static strengthToDuration(strength, sec) {
    return null
  }

  /**
   * Creates an action that animates a change of a physics field’s strength to a value relative to the existing value.
   * @access public
   * @param {number} strength - The value to add to the field.
   * @param {number} sec - The duration of the animation.
   * @returns {SKAction} - 
   * @desc When the action executes, the field node’s strength property animates from its current value to its new value.This action is reversible; the reverse is created as if the following code is executed:let action = SKAction.strength(by: -strength, duration: sec)
let action = SKAction.strength(by: -strength, duration: sec)

   * @see https://developer.apple.com/reference/spritekit/skaction/1417762-strength
   */
  static strengthByDuration(strength, sec) {
    return null
  }

  /**
   * Creates an action that animates a change of a physics field’s falloff.
   * @access public
   * @param {number} falloff - The new falloff for the field.
   * @param {number} sec - The duration of the animation, in seconds.
   * @returns {SKAction} - 
   * @desc When the action runs, the field node’s falloff property animates from its current value to its new value. This action is not reversible.
   * @see https://developer.apple.com/reference/spritekit/skaction/1417758-falloff
   */
  static falloffToDuration(falloff, sec) {
    return null
  }

  /**
   * Creates an action that animates a change of a physics field’s falloff to a value relative to the existing value.
   * @access public
   * @param {number} falloff - The value to add to the falloff.
   * @param {number} sec - The duration of the animation, in seconds.
   * @returns {SKAction} - 
   * @desc When the action executes, the field node’s falloff property animates from its current value to its new value.This action is reversible; the reverse is created as if the following code is executed:let action = SKAction.falloff(by: -falloff, duration: sec)
let action = SKAction.falloff(by: -falloff, duration: sec)

   * @see https://developer.apple.com/reference/spritekit/skaction/1417766-falloff
   */
  static falloffByDuration(falloff, sec) {
    return null
  }

  // Creating Actions to Warp a Node

  /**
   * Creates an action to distort a node through a sequence of SKWarpGeometry objects.  
   * @access public
   * @param {SKWarpGeometry[]} warps - The sequence of warps to apply to the node.
   * @param {number[]} times - The times at which each warp distortion in the sequence should complete.
   * @returns {?SKAction} - 
   * @desc The numberOfColumns and numberOfRows in each geometry in the sequence should match.
   * @see https://developer.apple.com/reference/spritekit/skaction/1690937-animate
   */
  static animateWithWarps(warps, times) {
    return null
  }

  /**
   * Creates an action to distort a node based using an SKWarpGeometry object.  
   * @access public
   * @param {SKWarpGeometry} warp - The warp geometry to distort the node to.
   * @param {number} duration - The duration of the animation.
   * @returns {?SKAction} - 
   * @desc The numberOfColumns and numberOfRows in the node's current geometry should match those of the specified geometry.
   * @see https://developer.apple.com/reference/spritekit/skaction/1690951-warp
   */
  static warpTo(warp, duration) {
    return null
  }

  // Creating Audio Actions

  /**
   * Creates an action that plays a sound.
   * @access public
   * @param {string} soundFile - The name of a sound file in the app’s bundle.
   * @param {boolean} wait - If true, the duration of this action is the same as the length of the audio playback. If false, the action is considered to have completed immediately.
   * @returns {SKAction} - 
   * @desc Use SKAction playSoundFileNamed:waitForCompletion: only for short incidentals. Use AVAudioPlayer for long running background music. This action is not reversible; the reversed action is identical to the original action.
   * @see https://developer.apple.com/reference/spritekit/skaction/1417664-playsoundfilenamed
   */
  static playSoundFileNamedWaitForCompletion(soundFile, wait) {
    return null
  }

  /**
   * Creates an action that tells an audio node to start playback.
   * @access public
   * @returns {SKAction} - 
   * @desc This action may only be executed on an SKAudioNode object.This action is not reversible.
   * @see https://developer.apple.com/reference/spritekit/skaction/1417730-play
   */
  static play() {
    return null
  }

  /**
   * Creates an action that tells an audio node to pause playback.
   * @access public
   * @returns {SKAction} - 
   * @desc This action may only be executed on an SKAudioNode object. The audio is paused, and if restarted, resumes at where it was paused.This action is not reversible.
   * @see https://developer.apple.com/reference/spritekit/skaction/1417820-pause
   */
  static pause() {
    return null
  }

  /**
   * Creates an action that tells an audio node to stop playback.
   * @access public
   * @returns {SKAction} - 
   * @desc This action may only be executed on an SKAudioNode object. The audio is stopped, and if restarted, begins at the beginning.This action is not reversible.
   * @see https://developer.apple.com/reference/spritekit/skaction/1417794-stop
   */
  static stop() {
    return null
  }

  /**
   * Creates an action that changes an audio node’s playback rate to a new value.
   * @access public
   * @param {number} v - The new value for the playback rate. A playback rate of 1.0 represents normal speed.
   * @param {number} duration - The duration of the animation, in seconds.
   * @returns {SKAction} - 
   * @desc When the action executes, the audio node’s playback rate animates from its current value to its new value. For more information, see AVAudio3DMixing.This action is not reversible.
   * @see https://developer.apple.com/reference/spritekit/skaction/1417808-changeplaybackrate
   */
  static changePlaybackRateTo(v, duration) {
    return null
  }

  /**
   * Creates an action that changes an audio node’s playback rate by a relative amount.
   * @access public
   * @param {number} v - The amount to change the playback rate by. A playback rate of 1.0 represents normal speed.
   * @param {number} duration - The duration of the animation, in seconds.
   * @returns {SKAction} - 
   * @desc When the action executes, the audio node’s playback rate animates from its current value to its new value. For more information, see AVAudio3DMixing.This action is reversible; the reverse is created as if the following code is executed:let action = SKAction.changePlaybackRate(by: -v, duration: sec)
let action = SKAction.changePlaybackRate(by: -v, duration: sec)

   * @see https://developer.apple.com/reference/spritekit/skaction/1417670-changeplaybackrate
   */
  static changePlaybackRateBy(v, duration) {
    return null
  }

  /**
   * Creates an action that changes an audio node’s volume to a new value.
   * @access public
   * @param {number} v - The new value for the volume. The value should be between 0.0 (silence) and 1.0 (maximum value for source audio), inclusive. 
   * @param {number} duration - The duration of the animation, in seconds.
   * @returns {SKAction} - 
   * @desc When the action executes, the audio node’s volume animates from its current value to its new value. For more information, see AVAudio3DMixing.This action is not reversible.
   * @see https://developer.apple.com/reference/spritekit/skaction/1417682-changevolume
   */
  static changeVolumeTo(v, duration) {
    return null
  }

  /**
   * Creates an action that changes an audio node’s volume by a relative value.
   * @access public
   * @param {number} v - The amount to change the volume by. 
   * @param {number} duration - The duration of the animation, in seconds.
   * @returns {SKAction} - 
   * @desc When the action executes, the audio node’s volume animates from its current value to its new value. For more information, see AVAudio3DMixing.This action is reversible; the reverse is created as if the following code is executed:let action = SKAction.changeVolume(by: -v, duration: sec)
let action = SKAction.changeVolume(by: -v, duration: sec)

   * @see https://developer.apple.com/reference/spritekit/skaction/1417726-changevolume
   */
  static changeVolumeBy(v, duration) {
    return null
  }

  /**
   * Creates an action that changes an audio node’s obstruction to a new value.
   * @access public
   * @param {number} v - The new value for the obstruction, in decibels.
   * @param {number} duration - The duration of the animation, in seconds.
   * @returns {SKAction} - 
   * @desc When the action executes, the audio node’s obstruction animates from its current value to its new value. Passing this action a value of -100 yields the greatest reduction in volume. For more information, see AVAudio3DMixing.This action is not reversible.
   * @see https://developer.apple.com/reference/spritekit/skaction/1519718-changeobstruction
   */
  static changeObstructionTo(v, duration) {
    return null
  }

  /**
   * Creates an action that changes an audio node’s obstruction by a relative value.
   * @access public
   * @param {number} v - The amount to change the obstruction by, in decibels.
   * @param {number} duration - The duration of the animation, in seconds.
   * @returns {SKAction} - 
   * @desc When the action executes, the audio node’s obstruction animates from its current value to its new value. For more information, see AVAudio3DMixing.This action is reversible; the reverse is created as if the following code is executed:let action = SKAction.changeObstruction(by: -v, duration: sec)
let action = SKAction.changeObstruction(by: -v, duration: sec)

   * @see https://developer.apple.com/reference/spritekit/skaction/1520346-changeobstruction
   */
  static changeObstructionBy(v, duration) {
    return null
  }

  /**
   * Creates an action that changes an audio node’s occlusion to a new value.
   * @access public
   * @param {number} v - The new value for the occlusion, in decibels.
   * @param {number} duration - The duration of the animation, in seconds.
   * @returns {SKAction} - 
   * @desc When the action executes, the audio node’s occlusion animates from its current value to its new value. Passing this action a value of -100 yields the greatest reduction in volume. For more information, see AVAudio3DMixing.This action is not reversible.
   * @see https://developer.apple.com/reference/spritekit/skaction/1520433-changeocclusion
   */
  static changeOcclusionTo(v, duration) {
    return null
  }

  /**
   * Creates an action that changes an audio node’s occlusion by a relative value.
   * @access public
   * @param {number} v - The amount to change the occlusion by, in decibels.
   * @param {number} duration - The duration of the animation, in seconds.
   * @returns {SKAction} - 
   * @desc When the action executes, the audio node’s occlusion animates from its current value to its new value. For more information, see AVAudio3DMixing.This action is reversible; the reverse is created as if the following code is executed:let action = SKAction.changeOcclusion(by: -v, duration: sec)
let action = SKAction.changeOcclusion(by: -v, duration: sec)

   * @see https://developer.apple.com/reference/spritekit/skaction/1520117-changeocclusion
   */
  static changeOcclusionBy(v, duration) {
    return null
  }

  /**
   * Creates an action that changes an audio node’s reverb to a new value.
   * @access public
   * @param {number} v - The new value for the reverb. The value should be between 0.0 and 1.0, inclusive.
   * @param {number} duration - The duration of the animation, in seconds.
   * @returns {SKAction} - 
   * @desc When the action executes, the audio node’s reverb animates from its current value to its new value. For more information, see AVAudio3DMixing.This action is not reversible.
   * @see https://developer.apple.com/reference/spritekit/skaction/1520320-changereverb
   */
  static changeReverbTo(v, duration) {
    return null
  }

  /**
   * Creates an action that changes an audio node’s reverb by a relative value.
   * @access public
   * @param {number} v - The amount to change the reverb by.
   * @param {number} duration - The duration of the animation, in seconds.
   * @returns {SKAction} - 
   * @desc When the action executes, the audio node’s reverb animates from its current value to its new value. For more information, see AVAudio3DMixing.This action is reversible; the reverse is created as if the following code is executed:let action = SKAction.changeReverb(by: -v, duration: sec)
let action = SKAction.changeReverb(by: -v, duration: sec)

   * @see https://developer.apple.com/reference/spritekit/skaction/1519568-changereverb
   */
  static changeReverbBy(v, duration) {
    return null
  }

  /**
   * Creates an action that changes an audio node’s stereo panning to a new value.
   * @access public
   * @param {number} v - The new value for stereo panning. The value must between -1.0 (left channel only) and 1.0 (right channel only), inclusive.
   * @param {number} duration - The duration of the animation, in seconds.
   * @returns {SKAction} - 
   * @desc When the action executes, the audio node’s stereo panning animates from its current value to its new value. For more information, see AVAudio3DMixing.This action is not reversible.
   * @see https://developer.apple.com/reference/spritekit/skaction/1519976-stereopan
   */
  static stereoPanTo(v, duration) {
    return null
  }

  /**
   * Creates an action that changes an audio node’s stereo panning by a relative value.
   * @access public
   * @param {number} v - The amount to change the stereo panning by. 
   * @param {number} duration - The duration of the animation, in seconds.
   * @returns {SKAction} - 
   * @desc When the action executes, the audio node’s stereo panning animates from its current value to its new value. For more information, see AVAudio3DMixing.This action is reversible; the reverse is created as if the following code is executed:let action = SKAction.stereoPan(by: -v, duration: sec)
let action = SKAction.stereoPan(by: -v, duration: sec)

   * @see https://developer.apple.com/reference/spritekit/skaction/1519713-stereopan
   */
  static stereoPanBy(v, duration) {
    return null
  }

  // Removing Nodes from the Scene

  /**
   * Creates an action that removes the node from its parent.
   * @access public
   * @returns {SKAction} - 
   * @desc When the action executes, the node is immediately removed from its parent.This action is not reversible; the reverse of this action is the same action.
   * @see https://developer.apple.com/reference/spritekit/skaction/1417748-removefromparent
   */
  static removeFromParent() {
    return null
  }

  // Creating Actions That Perform Actions on a Node’s Child

  /**
   * Creates an action that runs an action on a named child object.
   * @access public
   * @param {SKAction} action - The action to execute.
   * @param {string} name - The name of a child object. See the name property on the SKNode object.
   * @returns {SKAction} - 
   * @desc This action has an instantaneous duration, although the action executed on the child may have a duration of its own. When the action executes, it looks up an appropriate child node and calls its run(_:) method, passing in the action to execute. This action is reversible; it tells the child to execute the reverse of the action specified by the action parameter.
   * @see https://developer.apple.com/reference/spritekit/skaction/1417671-run
   */
  static runOnChildWithName(action, name) {
    return null
  }

  // Creating Actions That Combine or Repeat Other Actions

  /**
   * Creates an action that runs a collection of actions in parallel.
   * @access public
   * @param {SKAction[]} actions - An array of SKAction objects.
   * @returns {SKAction} - 
   * @desc When the action executes, the actions that comprise the group all start immediately and run in parallel. The duration of the group action is the longest duration among the collection of actions. If an action in the group has a duration less than the group’s duration, the action completes, then idles until the group completes the remaining actions. This matters most when creating a repeating action that repeats a group.This action is reversible; it creates a new group action that contains the reverse of each action specified in the group. 
   * @see https://developer.apple.com/reference/spritekit/skaction/1417688-group
   */
  static group(actions) {
    return null
  }

  /**
   * Creates an action that runs a collection of actions sequentially.
   * @access public
   * @param {SKAction[]} actions - An array of SKAction objects.
   * @returns {SKAction} - 
   * @desc When the action executes, the first action in the sequence starts and runs to completion. Subsequent actions in the sequence run in a similar fashion until all of the actions in the sequence have executed. The duration of the sequence action is the sum of the durations of the actions in the sequence.This action is reversible; it creates a new sequence action that reverses the order of the actions. Each action in the reversed sequence is itself reversed. For example, if an action sequence is {1,2,3}, the reversed sequence would be {3R,2R,1R}.
   * @see https://developer.apple.com/reference/spritekit/skaction/1417817-sequence
   */
  static sequence(actions) {
    return null
  }

  /**
   * Creates an action that repeats another action a specified number of times.
   * @access public
   * @param {SKAction} action - The action to execute.
   * @param {number} count - The number of times to execute the action.
   * @returns {SKAction} - 
   * @desc When the action executes, the associated action runs to completion and then repeats, until the count is reached.This action is reversible; it creates a new action that is the reverse of the specified action and then repeats it the same number of times.
   * @see https://developer.apple.com/reference/spritekit/skaction/1417750-repeat
   */
  static repeat(action, count) {
    return null
  }

  /**
   * Creates an action that repeats another action forever.
   * @access public
   * @param {SKAction} action - The action to execute.
   * @returns {SKAction} - 
   * @desc When the action executes, the associated action runs to completion and then repeats.This action is reversible; it creates a new action that is the reverse of the specified action and then repeats it forever.NoteThe action to be repeated must have a non-instantaneous duration.
   * @see https://developer.apple.com/reference/spritekit/skaction/1417676-repeatforever
   */
  static repeatForever(action) {
    return null
  }

  // Creating an Action to Introduce a Delay into a Sequence

  /**
   * Creates an action that idles for a specified period of time.
   * @access public
   * @param {number} sec - The amount of time to wait.
   * @returns {SKAction} - 
   * @desc When the action executes, the action waits for the specified amount of time, then ends. This is typically used as part of a sequence of actions to insert a delay between two other actions. You might also use it in conjunction with the run(_:completion:) method to trigger code that needs to run at a later time.This action is not reversible; the reverse of this action is the same action.
   * @see https://developer.apple.com/reference/spritekit/skaction/1417788-wait
   */
  static waitForDuration(sec) {
    return null
  }

  /**
   * Creates an action that idles for a randomized period of time.
   * @access public
   * @param {number} sec - The average amount of time to wait.
   * @param {number} durationRange - The range of possible values for the duration.
   * @returns {SKAction} - 
   * @desc When the action executes, the action waits for the specified amount of time, then ends. This is typically used as part of a sequence of actions to insert a delay between two other actions. However, you might also use it in conjunction with the run(_:completion:) method to trigger code that needs to run at a later time.Each time the action is executed, the action computes a new random value for the duration. The duration may vary in either direction by up to half of the value of the durationRange parameter.This action is not reversible; the reverse of this action is the same action.
   * @see https://developer.apple.com/reference/spritekit/skaction/1417760-wait
   */
  static waitForDurationWithRange(sec, durationRange) {
    return null
  }

  // Creating Actions to Perform Inverse Kinematic Calculations

  /**
   * Creates an action that performs an inverse kinematic reach.
   * @access public
   * @param {SKNode} node - The node whose position the current node should move closer to. 
   * @param {SKNode} root - The highest level ancestor of the target node that should be rotated.
   * @param {number} sec - The length of the animation.
   * @returns {SKAction} - 
   * @desc This action is typically used to implement character animation across a series of moving parts. When the action executes, it performs an inverse kinematic calculation to determine new rotation values for the target node and any of its ancestors up to and including the root node. Each node is rotated around its anchor point in an attempt to get the targeted node’s position closer to the intended destination. Each node’s rotation value is constrained by that node’s reachConstraints property. If the action cannot successfully reach the target position, it gets the node as close as it can to the target position.This action is not reversible; the reverse of this action is the same action.
   * @see https://developer.apple.com/reference/spritekit/skaction/1417827-reach
   */
  static reachToRootNodeDuration(node, root, sec) {
    return null
  }

  /**
   * Creates an action that performs an inverse kinematic reach.
   * @access public
   * @param {CGPoint} position - The intended destination for the node, specified in the scene’s coordinate system. 
   * @param {SKNode} root - The highest level ancestor of the target node that should be rotated.
   * @param {number} velocity - The maximum speed at which the node should move.
   * @returns {SKAction} - 
   * @desc This action is typically used to implement character animation across a series of moving parts. When the action executes, it performs an inverse kinematic calculation to determine new rotation values for the target node and any of its ancestors up to and including the root node. Each node is rotated around its anchor point in an attempt to get the targeted node’s position closer to the intended destination. Each node’s rotation value is constrained by that node’s reachConstraints property. If the action cannot successfully reach the target position, it gets the node as close as it can to the target position.The duration of the action is calculated implicitly based on the speed of movement and the distance that the node needs to travel.This action is not reversible; the reverse of this action is the same action.
   * @see https://developer.apple.com/reference/spritekit/skaction/1417720-reach
   */
  static reachToRootNode(position, root, velocity) {
    return null
  }


  /**
   * Creates an action that executes a block over a duration.
   * @access public
   * @param {number} seconds - The duration of the action, in seconds.
   * @param {function(arg1: SKNode, arg2: number): void} block - The block to run. The block takes the following parameters:nodeThe node on which the action is running.elapsedTimeThe amount of time that has passed in the animation.
   * @returns {SKAction} - 
   * @desc When the action executes, the block is called repeatedly until the action’s duration expires. The elapsed time is computed and passed to the block whenever the block is called.This action is not reversible; the reverse action executes the same block.The following code shows how you can create a custom action to update an attribute of an SKShader attached to a sprite node. let customAction = SKAction.customAction(withDuration: 2.0) {
    node, elapsedTime in
    
    if let node = node as? SKSpriteNode {
        node.setValue(SKAttributeValue(float: Float(elapsedTime)),
                                       forAttribute: "a_time")
    }
}
let customAction = SKAction.customAction(withDuration: 2.0) {
    node, elapsedTime in
    
    if let node = node as? SKSpriteNode {
        node.setValue(SKAttributeValue(float: Float(elapsedTime)),
                                       forAttribute: "a_time")
    }
}

   * @see https://developer.apple.com/reference/spritekit/skaction/1417745-customaction
   */
  static customActionWithDurationActionBlock(seconds, block) {
    return null
  }

  /**
   * Creates an action that calls a method on an object.
   * @access public
   * @param {function} selector - The selector of the method to call.
   * @param {Object} target - The target object.
   * @returns {SKAction} - 
   * @desc The action object maintains a strong reference to the target object.When the action executes, the target object’s method is called. This action occurs instantaneously.This action is not reversible; the reverse of this action calls the selector again.
   * @see https://developer.apple.com/reference/spritekit/skaction/1417764-perform
   */
  static performOnTarget(selector, target) {
    return null
  }

  /**
   * Creates an action that executes a block.
   * @access public
   * @param {function(): void} block - The block to run.
   * @returns {SKAction} - 
   * @desc When the action executes, the block is called. This action takes place instantaneously.This action is not reversible; the reverse action executes the same block.
   * @see https://developer.apple.com/reference/spritekit/skaction/1417692-run
   */
  static run(block) {
    return null
  }

  // Reversing an Action

  /**
   * Creates an action that reverses the behavior of another action.
   * @access public
   * @returns {SKAction} - 
   * @desc This method always returns an action object; however, not all actions are reversible. When reversed, some actions return an object that either does nothing or that performs the same action as the original action. For details on how an action is reversed, see the description of the class method used to create that action.
   * @see https://developer.apple.com/reference/spritekit/skaction/1417803-reversed
   */
  reversed() {
    return null
  }
}
