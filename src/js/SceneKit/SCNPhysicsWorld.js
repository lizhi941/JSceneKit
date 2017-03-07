'use strict'

import NSObject from '../ObjectiveC/NSObject'
import SCNVector3 from './SCNVector3'
import SCNPhysicsBehavior from './SCNPhysicsBehavior'
import SCNPhysicsContactDelegate from './SCNPhysicsContactDelegate'
import SCNPhysicsContact from './SCNPhysicsContact'
import SCNPhysicsBody from './SCNPhysicsBody'
import SCNHitTestResult from './SCNHitTestResult'
import SCNPhysicsShape from './SCNPhysicsShape'
import SCNMatrix4 from './SCNMatrix4'

const _TestOption = {
  backfaceCulling: Symbol(),
  collisionBitMask: Symbol(),
  searchMode: Symbol()
}

const _TestSearchMode = {
  all: Symbol(),
  any: Symbol(),
  closest: Symbol()
}


/**
 * The global simulation of collisions, gravity, joints, and other physics effects in a scene.
 * @access public
 * @extends {NSObject}
 * @see https://developer.apple.com/reference/scenekit/scnphysicsworld
 */
export default class SCNPhysicsWorld extends NSObject {

  /**
   * constructor
   * @access public
   * @returns {void}
   */
  init() {

    // Managing the Physics Simulation

    /**
     * A vector that specifies the gravitational acceleration applied to physics bodies in the physics world.
     * @type {SCNVector3}
     * @see https://developer.apple.com/reference/scenekit/scnphysicsworld/1512855-gravity
     */
    this.gravity = null

    /**
     * The rate at which the simulation executes.
     * @type {number}
     * @see https://developer.apple.com/reference/scenekit/scnphysicsworld/1512851-speed
     */
    this.speed = 0

    /**
     * The time interval between updates to the physics simulation.
     * @type {number}
     * @see https://developer.apple.com/reference/scenekit/scnphysicsworld/1512881-timestep
     */
    this.timeStep = 0


    // Registering Physics Behaviors

    this._allBehaviors = null

    // Detecting Contacts Between Physics Bodies

    /**
     * A delegate that is called when two physics bodies come in contact with each other.
     * @type {?SCNPhysicsContactDelegate}
     * @see https://developer.apple.com/reference/scenekit/scnphysicsworld/1512843-contactdelegate
     */
    this.contactDelegate = null

  }

  // Managing the Physics Simulation

  /**
   * Forces the physics engine to reevaluate possible collisions between physics bodies.
   * @access public
   * @returns {void}
   * @desc By default, SceneKit checks for collisions between physics bodies only once per simulation step. If you directly change the positions of any physics bodies outside of a SCNPhysicsContactDelegate method, call the updateCollisionPairs() method before using any of the methods listed in Searching for Physics Bodies Detecting Contacts Between Physics Bodies.
   * @see https://developer.apple.com/reference/scenekit/scnphysicsworld/1512877-updatecollisionpairs
   */
  updateCollisionPairs() {
  }

  // Registering Physics Behaviors

  /**
   * Adds a behavior to the physics world.
   * @access public
   * @param {SCNPhysicsBehavior} behavior - The behavior to be added.
   * @returns {void}
   * @desc Physics behaviors constrain or modify the effects of the physics simulation on sets of physics bodies. For example, the SCNPhysicsHingeJoint behavior causes two bodies to move as if connected by a hinge that pivots around a specific axis, and the SCNPhysicsVehicle behavior causes a body to roll like a car or other wheeled vehicle.To use a behavior in your scene, follow these steps:Create SCNPhysicsBody objects and attach them to each node that participates in the behavior.Create and configure a behavior object joining the physics bodies. See SCNPhysicsBehavior for a list of behavior classes.Call addBehavior(_:) on your scene’s physics world object to add the behavior to the physics simulation.
   * @see https://developer.apple.com/reference/scenekit/scnphysicsworld/1512839-addbehavior
   */
  addBehavior(behavior) {
  }

  /**
   * Removes a behavior from the physics world.
   * @access public
   * @param {SCNPhysicsBehavior} behavior - The behavior to be removed.
   * @returns {void}
   * @see https://developer.apple.com/reference/scenekit/scnphysicsworld/1512870-removebehavior
   */
  removeBehavior(behavior) {
  }

  /**
   * Removes all behaviors affecting bodies in the physics world.
   * @access public
   * @returns {void}
   * @see https://developer.apple.com/reference/scenekit/scnphysicsworld/1512849-removeallbehaviors
   */
  removeAllBehaviors() {
  }
  /**
   * The list of behaviors affecting bodies in the physics world.
   * @type {SCNPhysicsBehavior[]}
   * @desc 
   * @see https://developer.apple.com/reference/scenekit/scnphysicsworld/1512853-allbehaviors
   */
  get allBehaviors() {
    return this._allBehaviors
  }

  // Detecting Contacts Between Physics Bodies

  /**
   * Checks for contacts between two physics bodies.
   * @access public
   * @param {SCNPhysicsBody} bodyA - The first body (to test for contact with the second).
   * @param {SCNPhysicsBody} bodyB - The second body (to test for contact with the first).
   * @param {?Map<SCNPhysicsWorld.TestOption, Object>} [options = null] - A dictionary of options affecting the test, or nil to use default options. For applicable keys and the possible values, see Physics Test Options Keys.
   * @returns {SCNPhysicsContact[]} - 
   * @desc SceneKit sends messages to the physics world’s contactDelegate object only when collisions occur between bodies whose collisionBitMask and categoryBitMask properties overlap, and only for collisions between certain types of bodies. (For details, see SCNPhysicsBodyType.) Use this method to directly test for contacts between any two bodies at a time of your choosing. For example, to implement a game where the player character can pick up an item, you might call this method when the player presses the “pick up” button to see if the player character is in contact with the item to be picked up.
   * @see https://developer.apple.com/reference/scenekit/scnphysicsworld/1512875-contacttestbetween
   */
  contactTestBetween(bodyA, bodyB, options = null) {
    return null
  }

  /**
   * Checks for contacts between one physics body and any other bodies in the physics world.
   * @access public
   * @param {SCNPhysicsBody} body - The body to test for contact.
   * @param {?Map<SCNPhysicsWorld.TestOption, Object>} [options = null] - A dictionary of options affecting the test, or nil to use default options. For applicable keys and the possible values, see Physics Test Options Keys.
   * @returns {SCNPhysicsContact[]} - 
   * @desc SceneKit sends messages to the physics world’s contactdelegate object only when collisions occur between bodies whose collisionBitMask and categoryBitMask properties overlap, and only for collisions between certain types of bodies. (For details, see SCNPhysicsBodyType.) Use this method to directly test for all contacts between one body and any other bodies at a time of your choosing. For example, to implement a game with a “wall jump” effect, you could call this method when the player presses the jump button to see if the player character is in contact with any walls.
   * @see https://developer.apple.com/reference/scenekit/scnphysicsworld/1512841-contacttest
   */
  contactTestWith(body, options = null) {
    return null
  }

  // Searching for Physics Bodies

  /**
   * Searches for physics bodies along a line segment between two points in the physics world.
   * @access public
   * @param {SCNVector3} origin - An endpoint of the line segment to search, specified in the scene’s world coordinate system.
   * @param {SCNVector3} dest - The other endpoint of the line segment to search, specified in the scene’s world coordinate system.
   * @param {?Map<SCNPhysicsWorld.TestOption, Object>} [options = null] - A dictionary of options affecting the test, or nil to use default options. For applicable keys and the possible values, see Physics Test Options Keys.
   * @returns {SCNHitTestResult[]} - 
   * @desc Use this method to implement concepts such as line of sight in your app. For example, in a game you might implement behavior for an enemy character by searching for physics bodies along a line between the enemy character’s position and the player character’s position, as illustrated below:// Options: Look only for the closest object along line of sight,
// and use the collision bitmask to avoid finding the enemy itself.
NSDictionary *options = @{ SCNPhysicsTestSearchModeKey : SCNPhysicsTestSearchModeClosest,
                     SCNPhysicsTestCollisionBitMaskKey : @(kMyCategoryPlayer) };
 
NSArray *results = [physicsWorld rayTestWithSegmentFromPoint:enemy.position
                                                     toPoint:player.position
                                                     options:options];
if (results.firstObject.node == player) {
    // Enemy can see player: begin pursuit.
} else {
    // Enemy cannot see player: remain idle.
}
// Options: Look only for the closest object along line of sight,
// and use the collision bitmask to avoid finding the enemy itself.
NSDictionary *options = @{ SCNPhysicsTestSearchModeKey : SCNPhysicsTestSearchModeClosest,
                     SCNPhysicsTestCollisionBitMaskKey : @(kMyCategoryPlayer) };
 
NSArray *results = [physicsWorld rayTestWithSegmentFromPoint:enemy.position
                                                     toPoint:player.position
                                                     options:options];
if (results.firstObject.node == player) {
    // Enemy can see player: begin pursuit.
} else {
    // Enemy cannot see player: remain idle.
}

   * @see https://developer.apple.com/reference/scenekit/scnphysicsworld/1512857-raytestwithsegment
   */
  rayTestWithSegmentFromTo(origin, dest, options = null) {
    return null
  }

  /**
   * Searches for physics bodies in the space formed by moving a convex shape through the physics world.
   * @access public
   * @param {SCNPhysicsShape} shape - A physics shape. This shape must enclose a convex volume. For details on creating shapes that satisfy this requirement, see SCNPhysicsShape.
   * @param {SCNMatrix4} from - A transform matrix representing the initial position and orientation of the shape.
   * @param {SCNMatrix4} to - A transform matrix representing the final position and orientation of the shape.
   * @param {?Map<SCNPhysicsWorld.TestOption, Object>} [options = null] - A dictionary of options affecting the test, or nil to use default options. For applicable keys and the possible values, see Physics Test Options Keys.
   * @returns {SCNPhysicsContact[]} - 
   * @desc Use this method when it’s important to plan for (or avoid) collisions ahead of the physics simulation. For example, in a game you might plan maneuvers for a flying character to fit through the gaps between static bodies in the physics world, as illustrated below:// Look for potential collisions along the spaceship's current path.
SCNMatrix4 current = spaceship.transform;
SCNMatrix4 upAhead = SCNMatrix4Translate(current, 0, 0, LOOK_AHEAD_DISTANCE);
NSArray *contacts = [physicsWorld convexSweepTestWithShape:spaceship.physicsBody.physicsShape
                                             fromTransform:current
                                               toTransform:upAhead
                                                   options:nil];
if (contacts.count == 0) {
    // Flight path looks okay.
} else {
    // Flight path will cause a collision: look for another way around.
}
// Look for potential collisions along the spaceship's current path.
SCNMatrix4 current = spaceship.transform;
SCNMatrix4 upAhead = SCNMatrix4Translate(current, 0, 0, LOOK_AHEAD_DISTANCE);
NSArray *contacts = [physicsWorld convexSweepTestWithShape:spaceship.physicsBody.physicsShape
                                             fromTransform:current
                                               toTransform:upAhead
                                                   options:nil];
if (contacts.count == 0) {
    // Flight path looks okay.
} else {
    // Flight path will cause a collision: look for another way around.
}

   * @see https://developer.apple.com/reference/scenekit/scnphysicsworld/1512859-convexsweeptest
   */
  convexSweepTestWith(shape, from, to, options = null) {
    return null
  }

  // Structures
  /**
   * @type {Object} TestOption
   * @property {Symbol} backfaceCulling The key for choosing whether to ignore back-facing polygons in physics shapes when searching for contacts.
   * @property {Symbol} collisionBitMask The key for selecting which categories of physics bodies that SceneKit should test for contacts.
   * @property {Symbol} searchMode The key for selecting the number and order of contacts to be tested.
   * @see https://developer.apple.com/reference/scenekit/scnphysicsworld.testoption
   */
  static get TestOption() {
    return _TestOption
  }
  /**
   * @type {Object} TestSearchMode
   * @property {Symbol} all Searches should return all contacts matching the search parameters.
   * @property {Symbol} any Searches should return only the first contact found regardless of its position relative to the search parameters.
   * @property {Symbol} closest Searches should return only the closest contact to the beginning of the search.
   * @see https://developer.apple.com/reference/scenekit/scnphysicsworld.testsearchmode
   */
  static get TestSearchMode() {
    return _TestSearchMode
  }
}