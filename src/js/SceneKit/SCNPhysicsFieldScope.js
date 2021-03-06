'use strict'


/**
 * Options for defining the region of space affected by a physics field, used by the scope property.
 * @typedef {Object} SCNPhysicsFieldScope
 * @property {number} insideExtent - The field’s effect applies only to objects within the region of space defined by its position and extent.
 * @property {number} outsideExtent - The field’s effect applies only to objects outside the region of space defined by its position and extent.
 * @see https://developer.apple.com/documentation/scenekit/scnphysicsfieldscope
 */
const SCNPhysicsFieldScope = {
  insideExtent: 0,
  outsideExtent: 1
}

export default SCNPhysicsFieldScope
