'use strict'

import NSObject from '../ObjectiveC/NSObject'
import SCNSceneRenderer from './SCNSceneRenderer'
import SCNTechniqueSupport from './SCNTechniqueSupport'
import SCNScene from './SCNScene'
import CGRect from '../CoreGraphics/CGRect'
import CGSize from '../CoreGraphics/CGSize'
import SCNAntialiasingMode from './SCNAntialiasingMode'
import SCNMatrix4 from './SCNMatrix4'
import SCNNode from './SCNNode'
import SCNProgram from './SCNProgram'
import SCNCamera from './SCNCamera'
import SCNLight from './SCNLight'
import SCNVector3 from './SCNVector3'
import SCNVector4 from './SCNVector4'
import SKColor from '../SpriteKit/SKColor'
import SCNGeometryPrimitiveType from './SCNGeometryPrimitiveType'
import SCNGeometrySource from './SCNGeometrySource'
import SCNHitTestResult from './SCNHitTestResult'

/**
 * @access private
 * @type {string}
 */
const _defaultVertexShader = 
 `#version 300 es
  precision mediump float;

  uniform mat4 viewTransform;
  uniform mat4 viewProjectionTransform;

  #define NUM_AMBIENT_LIGHTS __NUM_AMBIENT_LIGHTS__
  #define NUM_DIRECTIONAL_LIGHTS __NUM_DIRECTIONAL_LIGHTS__
  #define NUM_OMNI_LIGHTS __NUM_OMNI_LIGHTS__
  #define NUM_SPOT_LIGHTS __NUM_SPOT_LIGHTS__
  #define NUM_IES_LIGHTS __NUM_IES_LIGHTS__
  #define NUM_PROBE_LIGHTS __NUM_PROBE_LIGHTS__

  layout (std140) uniform materialUniform {
    vec4 ambient;
    vec4 diffuse;
    vec4 specular;
    vec4 emission;
    float shininess;
  } material;

  struct AmbientLight {
    vec4 color;
  };

  struct DirectionalLight {
    vec4 color;
    vec4 direction; // should use vec4; vec3 might cause problem for the layout
  };

  struct OmniLight {
    vec4 color;
    vec4 position; // should use vec4; vec3 might cause problem for the layout
  };

  struct SpotLight {
    // TODO: implement
    vec4 color;
  };

  struct IESLight {
    // TODO: implement
    vec4 color;
  };

  struct ProbeLight {
    // TODO: implement
    vec4 color;
  };

  layout (std140) uniform lightUniform {
    __LIGHT_DEFINITION__
  } light;
  __VS_LIGHT_VARS__

  //uniform mat3x4[255] skinningJoints;
  uniform vec4[765] skinningJoints;
  uniform int numSkinningJoints;

  in vec3 position;
  in vec3 normal;
  in vec2 texcoord;
  in vec4 boneIndices;
  in vec4 boneWeights;

  out vec3 v_position;
  out vec3 v_normal;
  out vec2 v_texcoord;
  out vec4 v_color;
  out vec3 v_eye;

  void main() {
    vec3 pos = vec3(0, 0, 0);
    vec3 nom = vec3(0, 0, 0);
    if(numSkinningJoints > 0){
      for(int i=0; i<numSkinningJoints; i++){
        float weight = boneWeights[i];
        if(int(boneIndices[i]) < 0){
          continue;
        }
        int idx = int(boneIndices[i]) * 3;
        mat4 jointMatrix = transpose(mat4(skinningJoints[idx],
                                          skinningJoints[idx+1],
                                          skinningJoints[idx+2],
                                          vec4(0, 0, 0, 1)));
        pos += (jointMatrix * vec4(position, 1.0)).xyz * weight;
        nom += (mat3(jointMatrix) * normal) * weight;
      }
    }else{
      mat4 jointMatrix = transpose(mat4(skinningJoints[0],
                                        skinningJoints[1],
                                        skinningJoints[2],
                                        vec4(0, 0, 0, 1)));
      pos = (jointMatrix * vec4(position, 1.0)).xyz;
      nom = mat3(jointMatrix) * normal;
    }
    v_position = pos;
    v_normal = nom;

    vec3 viewPos = vec3(-viewTransform[3][0], -viewTransform[3][1], -viewTransform[3][2]);
    v_eye = viewPos - pos;

    v_color = material.emission;
    int numLights = 0;

    __VS_LIGHTING__

    v_texcoord = texcoord;
    gl_Position = viewProjectionTransform * vec4(pos, 1.0);
  }
`


const _vsAmbient = `
  for(int i=0; i<NUM_AMBIENT_LIGHTS; i++){
    v_color += light.ambient[i].color * material.ambient;
  }
`

const _vsDirectional = `
  for(int i=0; i<NUM_DIRECTIONAL_LIGHTS; i++){
    v_light[numLights + i] = -light.directional[i].direction.xyz;
  }
  numLights += NUM_DIRECTIONAL_LIGHTS;
`

const _vsOmni = `
  for(int i=0; i<NUM_OMNI_LIGHTS; i++){
    v_light[numLights + i] = light.omni[i].position.xyz - pos;
  }
  numLights += NUM_OMNI_LIGHTS;
`

const _vsSpot = `
  for(int i=0; i<NUM_SPOT_LIGHTS; i++){
    v_light[numLights + i] = light.spot[i].position.xyz - pos;
  }
  numLights += NUM_SPOT_LIGHTS;
`

const _vsIES = ''
const _vsProbe = ''

const _materialLoc = 0
const _lightLoc = 1


/**
 * @access private
 * @type {string}
 */
const _defaultFragmentShader = 
 `#version 300 es
  precision mediump float;

  uniform bool[8] textureFlags;
  #define TEXTURE_EMISSION_INDEX 0
  #define TEXTURE_AMBIENT_INDEX 1
  #define TEXTURE_DIFFUSE_INDEX 2
  #define TEXTURE_SPECULAR_INDEX 3
  #define TEXTURE_REFLECTIVE_INDEX 4
  #define TEXTURE_TRANSPARENT_INDEX 5
  #define TEXTURE_MULTIPLY_INDEX 6
  #define TEXTURE_NORMAL_INDEX 7

  uniform sampler2D u_emissionTexture;
  uniform sampler2D u_ambientTexture;
  uniform sampler2D u_diffuseTexture;
  uniform sampler2D u_specularTexture;
  uniform sampler2D u_reflectiveTexture;
  uniform sampler2D u_transparentTexture;
  uniform sampler2D u_multiplyTexture;
  uniform sampler2D u_normalTexture;

  #define NUM_AMBIENT_LIGHTS __NUM_AMBIENT_LIGHTS__
  #define NUM_DIRECTIONAL_LIGHTS __NUM_DIRECTIONAL_LIGHTS__
  #define NUM_OMNI_LIGHTS __NUM_OMNI_LIGHTS__
  #define NUM_SPOT_LIGHTS __NUM_SPOT_LIGHTS__
  #define NUM_IES_LIGHTS __NUM_IES_LIGHTS__
  #define NUM_PROBE_LIGHTS __NUM_PROBE_LIGHTS__

  layout (std140) uniform materialUniform {
    vec4 ambient;
    vec4 diffuse;
    vec4 specular;
    vec4 emission;
    float shininess;
  } material;

  struct AmbientLight {
    vec4 color;
  };

  struct DirectionalLight {
    vec4 color;
    vec4 direction; // should use vec4; vec3 might cause problem for the layout
  };

  struct OmniLight {
    vec4 color;
    vec4 position; // should use vec4; vec3 might cause problem for the layout
  };

  struct ProbeLight {
    // TODO: implement
    vec4 color;
  };

  struct SpotLight {
    // TODO: implement
    vec4 color;
  };

  layout (std140) uniform lightUniform {
    __LIGHT_DEFINITION__
  } light;
  __FS_LIGHT_VARS__

  in vec3 v_position;
  in vec3 v_normal;
  in vec2 v_texcoord;
  in vec4 v_color;
  in vec3 v_eye;

  out vec4 outColor;

  void main() {
    outColor = v_color;

    vec3 viewVec = normalize(v_eye);
    vec3 nom = normalize(v_normal);

    int numLights = 0;
      
    __FS_LIGHTING__
    
    // diffuse texture
    if(textureFlags[TEXTURE_DIFFUSE_INDEX]){
      vec4 color = texture(u_diffuseTexture, v_texcoord);
      outColor = color * outColor;
    }
  }
`

const _fsAmbient = `
`

const _fsDirectional = `
  for(int i=0; i<NUM_DIRECTIONAL_LIGHTS; i++){
    // diffuse
    vec3 lightVec = normalize(v_light[numLights + i]);
    float diffuse = clamp(dot(lightVec, nom), 0.0f, 1.0f);
    outColor += light.directional[i].color * material.diffuse * diffuse;

    // specular
    if(diffuse > 0.0f){
      vec3 halfVec = normalize(lightVec + viewVec);
      float specular = pow(dot(halfVec, nom), material.shininess);
      outColor += material.specular * specular; // TODO: get the light color of specular
    }
  }
  numLights += NUM_DIRECTIONAL_LIGHTS;
`

const _fsOmni = `
  for(int i=0; i<NUM_OMNI_LIGHTS; i++){
    // diffuse
    vec3 lightVec = normalize(v_light[numLights + i]);
    float diffuse = clamp(dot(lightVec, nom), 0.0f, 1.0f);
    outColor += light.omni[i].color * material.diffuse * diffuse;

    // specular
    if(diffuse > 0.0f){
      vec3 halfVec = normalize(lightVec + viewVec);
      float specular = pow(dot(halfVec, nom), material.shininess);
      outColor += material.specular * specular; // TODO: get the light color of specular
    }
  }
  numLights += NUM_OMNI_LIGHTS;
`

const _fsSpot = `
  // TODO: implement
`

const _fsIES = ''
const _fsProbe = ''

const _defaultCameraDistance = 15

/**
 * A renderer for displaying SceneKit scene in an an existing Metal workflow or OpenGL context. 
 * @access public
 * @extends {NSObject}
 * @implements {SCNSceneRenderer}
 * @implements {SCNTechniqueSupport}
 * @see https://developer.apple.com/reference/scenekit/scnrenderer
 */
export default class SCNRenderer extends NSObject {
  // Creating a Renderer

  /**
   * Creates a renderer with the specified Metal device.
   * @access public
   * @constructor
   * @param {?MTLDevice} device - A Metal device.
   * @param {?Map<AnyHashable, Object>} [options = null] - An optional dictionary for future extensions.
   * @desc Use this initializer to create a SceneKit renderer that draws into the rendering targets your app already uses to draw other content. For the device parameter, pass the MTLDevice object your app uses for drawing. Then, to tell SceneKit to render your content, call the SCNRenderer method, providing a command buffer and render pass descriptor for SceneKit to use in its rendering.
   * @see https://developer.apple.com/reference/scenekit/scnrenderer/1518404-init
   */
  constructor(device, options = null) {
    super()

    // Specifying a Scene

    /**
     * The scene to be rendered.
     * @type {?SCNScene}
     * @see https://developer.apple.com/reference/scenekit/scnrenderer/1518400-scene
     */
    this.scene = null

    // Managing Animation Timing

    this._nextFrameTime = 0

    /**
     * context to draw frame
     * @type {WebGLRenderingContext}
     */
    this._context = null

    /**
     *
     * @access private
     * @type {SKColor}
     */
    this._backgroundColor = null

    //////////////////////
    // SCNSceneRenderer //
    //////////////////////

    // Managing Scene Display

    /**
     * Required. The node from which the scene’s contents are viewed for rendering.
     * @type {?SCNNode}
     * @see https://developer.apple.com/reference/scenekit/scnscenerenderer/1523982-pointofview
     */
    this.pointOfView = null

    /**
     * Required. A Boolean value that determines whether SceneKit automatically adds lights to a scene.
     * @type {boolean}
     * @see https://developer.apple.com/reference/scenekit/scnscenerenderer/1523812-autoenablesdefaultlighting
     */
    this.autoenablesDefaultLighting = false

    /**
     * Required. A Boolean value that determines whether SceneKit applies jittering to reduce aliasing artifacts.
     * @type {boolean}
     * @see https://developer.apple.com/reference/scenekit/scnscenerenderer/1524026-isjitteringenabled
     */
    this.isJitteringEnabled = false

    /**
     * Required. A Boolean value that determines whether SceneKit displays rendering performance statistics in an accessory view.
     * @type {boolean}
     * @see https://developer.apple.com/reference/scenekit/scnscenerenderer/1522763-showsstatistics
     */
    this.showsStatistics = false

    /**
     * Required. Options for drawing overlay content in a scene that can aid debugging.
     * @type {SCNDebugOptions}
     * @see https://developer.apple.com/reference/scenekit/scnscenerenderer/1523281-debugoptions
     */
    this.debugOptions = null

    this._renderingAPI = null

    // Managing Scene Animation Timing

    /**
     * Required. The current scene time.
     * @type {number}
     * @see https://developer.apple.com/reference/scenekit/scnscenerenderer/1522680-scenetime
     */
    this.sceneTime = 0

    /**
     * Required. A Boolean value that determines whether the scene is playing.
     * @type {boolean}
     * @see https://developer.apple.com/reference/scenekit/scnscenerenderer/1523401-isplaying
     */
    this.isPlaying = false

    /**
     * Required. A Boolean value that determines whether SceneKit restarts the scene time after all animations in the scene have played.
     * @type {boolean}
     * @see https://developer.apple.com/reference/scenekit/scnscenerenderer/1522878-loops
     */
    this.loops = false


    // Participating in the Scene Rendering Process

    /**
     * Required. A delegate object that receives messages about SceneKit’s rendering process.
     * @type {?SCNSceneRendererDelegate}
     * @see https://developer.apple.com/reference/scenekit/scnscenerenderer/1522671-delegate
     */
    this.delegate = null


    // Customizing Scene Rendering with Metal

    this._currentRenderCommandEncoder = null
    this._device = null
    this._commandQueue = null
    this._colorPixelFormat = null
    this._depthPixelFormat = null
    this._stencilPixelFormat = null

    // Rendering Sprite Kit Content over a Scene

    /**
     * Required. A Sprite Kit scene to be rendered on top of the SceneKit content.
     * @type {?SKScene}
     * @see https://developer.apple.com/reference/scenekit/scnscenerenderer/1524051-overlayskscene
     */
    //this.overlaySKScene = null


    // Working With Positional Audio

    /**
     * Required. The node representing the listener’s position in the scene for use with positional audio effects.
     * @type {?SCNNode}
     * @see https://developer.apple.com/reference/scenekit/scnscenerenderer/1523747-audiolistener
     */
    //this.audioListener = null
    //this._audioEnvironmentNode = null
    //this._audioEngine = null

    // Instance Properties

    /**
     * Required. 
     * @type {number}
     * @see https://developer.apple.com/reference/scenekit/scnscenerenderer/1522854-currenttime
     */
    //this.currentTime = 0

    /**
     * @access private
     * @type {SCNProgram}
     */
    this.__defaultProgram = null

    this._location = new Map()

    this._defaultCameraPosNode = new SCNNode()
    this._defaultCameraRotNode = new SCNNode()
    this._defaultCameraNode = new SCNNode()
    this._defaultCameraNode.name = 'kSCNFreeViewCameraName'

    const camera = new SCNCamera()
    camera.name = 'kSCNFreeViewCameraNameCamera'
    this._defaultCameraNode.camera = camera
    this._defaultCameraNode.position = new SCNVector3(0, 0, _defaultCameraDistance)

    this._defaultCameraPosNode.addChildNode(this._defaultCameraRotNode)
    this._defaultCameraRotNode.addChildNode(this._defaultCameraNode)

    this._defaultLightNode = new SCNNode()
    const light = new SCNLight()
    light.color = SKColor.white
    light.type = SCNLight.LightType.omni
    light.position = new SCNVector3(0, 10, 10)
    this._defaultLightNode.light = light

    /**
     * @access private
     * @type {CGRect}
     */
    this._viewRect = null

    /**
     * @access private
     * @type {WebGLTexture}
     */
    this.__dummyTexture = null

    /**
     * @access private
     * @type {Object}
     */
    this._lightNodes = {}

    /**
     * @access private
     * @type {Object}
     */
    this._numLights = {}

    /**
     * @access private
     * @type {WebGLBuffer}
     */
    this._lightBuffer = null
  }

  /**
   * Creates a renderer with the specified Metal device.
   * @access public
   * @param {?MTLDevice} device - A Metal device.
   * @param {?Map<AnyHashable, Object>} [options = null] - An optional dictionary for future extensions.
   * @returns {void}
   * @desc Use this initializer to create a SceneKit renderer that draws into the rendering targets your app already uses to draw other content. For the device parameter, pass the MTLDevice object your app uses for drawing. Then, to tell SceneKit to render your content, call the SCNRenderer method, providing a command buffer and render pass descriptor for SceneKit to use in its rendering.
   * @see https://developer.apple.com/reference/scenekit/scnrenderer/1518404-init
   */
  init(device, options = null) {
  }

  // Managing Animation Timing

  /**
   * The timestamp for the next frame to be rendered.
   * @type {number}
   * @desc If the renderer’s scene has any attached actions or animations, use this property to determine how long your app should wait before telling the renderer to draw another frame. If this property’s value matches that of the renderer’s currentTime property, the scene contains a continuous animation—schedule your next render at whatever time best maintains your app’s performance. If the value is infinite, the scene has no running actions or animations.
   * @see https://developer.apple.com/reference/scenekit/scnrenderer/1518410-nextframetime
   */
  get nextFrameTime() {
    return this._nextFrameTime
  }

  // Rendering a Scene Using Metal

  /**
   * Renders the scene’s contents at the specified system time in the specified Metal command buffer.
   * @access public
   * @param {number} time - The timestamp, in seconds, at which to render the scene.
   * @param {CGRect} viewport - The pixel dimensions in which to render.
   * @param {MTLCommandBuffer} commandBuffer - The Metal command buffer in which SceneKit should schedule rendering commands.
   * @param {MTLRenderPassDescriptor} renderPassDescriptor - The Metal render pass descriptor describing the rendering target.
   * @returns {void}
   * @desc This method can be used only with an SCNRenderer object created with the SCNRenderer initializer. Call this method to tell SceneKit to draw the renderer’s scene into the render target described by the renderPassDescriptor parameter, by encoding render commands into the commandBuffer parameter.When you call this method, SceneKit updates its hierarchy of presentation nodes based on the specified timestamp, and then draws the scene using the specified Metal objects. NoteBy default, the playback timing of actions and animations in a scene is based on the system time, not the scene time. Before using this method to control the playback of animations, set the usesSceneTimeBase property of each animation to true, or specify the playUsingSceneTimeBase option when loading a scene file that contains animations.
   * @see https://developer.apple.com/reference/scenekit/scnrenderer/1518401-render
   */
  renderAtTimePassDescriptor(time, viewport, commandBuffer, renderPassDescriptor) {
  }

  // Rendering a Scene Using OpenGL

  /**
   * Renders the scene’s contents in the renderer’s OpenGL context.
   * @deprecated
   * @access public
   * @returns {void}
   * @desc This method can be used only with an SCNRenderer object created with the SCNRenderer initializer. Call this method to tell SceneKit to draw the renderer’s scene into the OpenGL context you created the renderer with.When you call this method, SceneKit updates its hierarchy of presentation nodes based on the current system time, and then draws the scene.
   * @see https://developer.apple.com/reference/scenekit/scnrenderer/1518403-render
   */
  render() {
    if(this.scene === null){
      console.error('SCNRenderer.render(): scene is null')
      return
    }
    if(this.context === null){
      console.error('SCNRenderer.render(): context is null')
      return
    }

    // set camera node
    const cameraNode = this._getCameraNode()
    const camera = cameraNode.camera
    camera._updateProjectionTransform(this._viewRect)

    // set light node
    this._lightNodes = this._createLightNodeArray()

    const gl = this.context
    const program = this._defaultProgram._glProgram
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT)
    // camera params
    gl.uniformMatrix4fv(gl.getUniformLocation(program, 'viewTransform'), false, cameraNode.viewTransform.float32Array())
    gl.uniformMatrix4fv(gl.getUniformLocation(program, 'viewProjectionTransform'), false, cameraNode.viewProjectionTransform.float32Array())

    //console.log('cameraNode.position: ' + cameraNode.position.float32Array())
    //console.log('viewTransform: ' + cameraNode.viewTransform.float32Array())
    //console.log('projectionTransform: ' + cameraNode.camera.projectionTransform.float32Array())
    //console.log('viewProjectionTransform: ' + cameraNode.viewProjectionTransform.float32Array())
    
    if(this._lightBuffer === null){
      this._initializeLightBuffer(program)
    }

    const lights = this._lightNodes
    const lightData = []
    lights.ambient.forEach((node) => {
      lightData.push(...node.light.color.float32Array())
    })
    lights.directional.forEach((node) => {
      const direction = (new SCNVector3(0, 0, -1)).rotateWithQuaternion(node._worldOrientation)
      lightData.push(
        ...node.light.color.float32Array(),
        ...direction.float32Array(), 0
      )
    })
    lights.omni.forEach((node) => {
      lightData.push(
        ...node.light.color.float32Array(),
        ...node._worldTranslation.float32Array(), 0
      )
    })
    lights.probe.forEach((node) => {
      lightData.push(...node.light.color.float32Array())
    })
    lights.spot.forEach((node) => {
      lightData.push(...node.light.color.float32Array())
    })

    gl.bindBuffer(gl.UNIFORM_BUFFER, this._lightBuffer)
    gl.bufferData(gl.UNIFORM_BUFFER, new Float32Array(lightData), gl.DYNAMIC_DRAW)
    gl.bindBuffer(gl.UNIFORM_BUFFER, null)

    const renderingArray = this._createRenderingNodeArray()
    renderingArray.forEach((node) => {
      this._renderNode(node)
    })

    gl.flush()
  }

  /**
   * @access private
   * @returns {SCNNode} -
   */
  _getCameraNode() {
    let cameraNode = this.pointOfView
    if(cameraNode === null){
      cameraNode = this._searchCameraNode()
      this.pointOfView = cameraNode
      if(cameraNode === null){
        cameraNode = this._defaultCameraNode
      }
    }
    if(cameraNode === this._defaultCameraNode){
      this._defaultCameraPosNode._updateWorldTransform()
    }
    return cameraNode
  }

  /**
   *
   * @access private
   * @returns {SCNNode[]} -
   */
  _createRenderingNodeArray() {
    const arr = [this.scene._rootNode]
    const targetNodes = []
    while(arr.length > 0){
      const node = arr.shift()
      if(node.presentation.geometry !== null){
        targetNodes.push(node)
      }
      arr.push(...node.childNodes)
    }
    targetNodes.sort((a, b) => { return a.renderingOrder - b.renderingOrder })

    return targetNodes
  }

  /**
   *
   * @access private
   * @returns {SCNNode[]} -
   */
  _createLightNodeArray() {
    const targetNodes = {
      ies: [],
      ambient: [],
      directional: [],
      omni: [],
      probe: [],
      spot: []
    }

    const arr = [this.scene.rootNode]
    let numLights = 0
    while(arr.length > 0){
      const node = arr.shift()
      if(node.presentation.light !== null){
        targetNodes[node.presentation.light.type].push(node.presentation)
        if(node.presentation.light.type !== SCNLight.LightType.ambient){
          numLights += 1
        }
      }
      arr.push(...node.childNodes)
    }
    if(this.autoenablesDefaultLighting && numLights === 0){
      targetNodes[this._defaultLightNode.light.type].push(this._defaultLightNode)
    }

    return targetNodes
  }

  /**
   *
   * @access private
   * @param {SCNNode} node -
   * @returns {void}
   */
  _renderNode(node) {
    const gl = this.context
    const geometry = node.presentation.geometry
    let program = this._defaultProgram._glProgram
    if(geometry.program !== null){
      program = geometry.program._glProgram
    }
    gl.useProgram(program)

    if(geometry._vertexArrayObjects === null){
      this._initializeVAO(node, program)
      this._initializeUBO(node, program)
    }

    if(node.morpher !== null){
      this._updateVAO(node)
    }

    // TODO: use geometry setting
    gl.disable(gl.CULL_FACE)

    if(node.presentation.skinner !== null){
      gl.uniform1i(gl.getUniformLocation(program, 'numSkinningJoints'), node.presentation.skinner.numSkinningJoints)
      gl.uniform4fv(gl.getUniformLocation(program, 'skinningJoints'), node.presentation.skinner.float32Array())
    }else{
      gl.uniform1i(gl.getUniformLocation(program, 'numSkinningJoints'), 0)
      gl.uniform4fv(gl.getUniformLocation(program, 'skinningJoints'), node.presentation._worldTransform.float32Array3x4f())
    }

    const geometryCount = geometry.geometryElements.length
    if(geometryCount === 0){
      throw new Error('geometryCount: 0')
    }
    for(let i=0; i<geometryCount; i++){
      const vao = geometry._vertexArrayObjects[i]
      const element = geometry.geometryElements[i]
      //const material = node.presentation.geometry.materials[i]

      gl.bindVertexArray(vao)

      geometry._bufferMaterialData(gl, program, i)

      let shape = null
      switch(element.primitiveType){
        case SCNGeometryPrimitiveType.triangles:
          shape = gl.TRIANGLES
          break
        case SCNGeometryPrimitiveType.triangleStrip:
          shape = gl.TRIANGLE_STRIP
          break
        case SCNGeometryPrimitiveType.line:
          shape = gl.LINES
          break
        case SCNGeometryPrimitiveType.point:
          shape = gl.POINTS
          break
        case SCNGeometryPrimitiveType.polygon:
          shape = gl.TRIANGLE_FAN
          break
        default:
          throw new Error(`unsupported primitiveType: ${element.primitiveType}`)
      }

      let size = null
      switch(element.bytesPerIndex){
        case 1:
          size = gl.UNSIGNED_BYTE
          break
        case 2:
          size = gl.UNSIGNED_SHORT
          break
        case 4:
          size = gl.UNSIGNED_INT
          break
        default:
          throw new Error(`unsupported index size: ${element.bytesPerIndex}`)
      }

      gl.drawElements(shape, element._glData.length, size, 0)
    }
  }

  /**
   * Renders the scene’s contents at the specified system time in the renderer’s OpenGL context.
   * @access public
   * @param {number} time - The timestamp, in seconds, at which to render the scene.
   * @returns {void}
   * @desc This method can be used only with an SCNRenderer object created with the SCNRenderer initializer. Call this method to tell SceneKit to draw the renderer’s scene into the OpenGL context you created the renderer with.When you call this method, SceneKit updates its hierarchy of presentation nodes based on the specified timestamp, and then draws the scene.NoteBy default, the playback timing of actions and animations in a scene is based on the system time, not the scene time. Before using this method to control the playback of animations, set the usesSceneTimeBase property of each animation to true, or specify the playUsingSceneTimeBase option when loading a scene file that contains animations.
   * @see https://developer.apple.com/reference/scenekit/scnrenderer/1518402-render
   */
  renderAtTime(time) {
  }

  // Capturing a Snapshot

  /**
   * Creates an image by drawing the renderer’s content at the specified system time.
   * @access public
   * @param {number} time - The timestamp, in seconds, at which to render the scene.
   * @param {CGSize} size - The size, in pixels, of the image to create.
   * @param {SCNAntialiasingMode} antialiasingMode - The antialiasing mode to use for the image output.
   * @returns {Image} - 
   * @desc When you call this method, SceneKit updates its hierarchy of presentation nodes based on the specified timestamp, and then draws the scene into a new image object of the specified size.
   * @see https://developer.apple.com/reference/scenekit/scnrenderer/1641767-snapshot
   */
  snapshotAtTimeWith(time, size, antialiasingMode) {
    return null
  }

  // Instance Methods

  /**
   * 
   * @access public
   * @param {SCNNode[]} lightProbes - 
   * @param {number} time - 
   * @returns {void}
   * @see https://developer.apple.com/reference/scenekit/scnrenderer/2097153-updateprobes
   */
  updateProbesAtTime(lightProbes, time) {
  }

  //////////////////////
  // SCNSceneRenderer //
  //////////////////////

  // Presenting a Scene

  /**
   * Required. Displays the specified scene with an animated transition.
   * @access public
   * @param {SCNScene} scene - The new scene to be displayed.
   * @param {SKTransition} transition - An object that specifies the duration and style of the animated transition.
   * @param {?SCNNode} pointOfView - The node to use as the pointOfView property when displaying the new scene.
   * @param {?function(): void} [completionHandler = null] - A block that SceneKit calls after the transition animation has completed.This block takes no parameters and has no return value.
   * @returns {void}
   * @desc Use this method to change the scene displayed in a SceneKit view (or other renderer) with an animated transition. For details on transition styles, see SKTransition.
   * @see https://developer.apple.com/reference/scenekit/scnscenerenderer/1523028-present
   */
  presentWithIncomingPointOfView(scene, transition, pointOfView, completionHandler = null) {
  }

  // Managing Scene Display
  /**
   * Required. The graphics technology SceneKit uses to render the scene.
   * @type {SCNRenderingAPI}
   * @desc You choose a graphics technology when initializing a scene renderer:When initializing a SCNView object, use the init(frame:options:) initializer and the preferredRenderingAPI key. Alternatively, create a view in Interface Builder and use the Rendering API control in the inspector. During initialization, the view will attempt to use the preferred API, but will fall back to a different API if the preferred one is not supported on the current hardware.To create a SCNRenderer object that renders into your own OpenGL contect, use the init(context:options:) initializer. To create a renderer for use in your own Metal workflow, use the init(device:options:) initializer.The rendering technology used by a SCNLayer object is determined by Core Animation.After initializing a renderer, this property reflects the rendering technology in use.
   * @see https://developer.apple.com/reference/scenekit/scnscenerenderer/1522616-renderingapi
   */
  get renderingAPI() {
    return this._renderingAPI
  }

  // Preloading Renderer Resources

  /**
   * Required. Prepares a SceneKit object for rendering.
   * @access public
   * @param {Object} object - An SCNScene, SCNNode, SCNGeometry, or SCNMaterial instance.
   * @param {?function(): boolean} [block = null] - A block that SceneKit calls periodically while preparing the object. The block takes no parameters.Your block should return false to tell SceneKit to continue preparing the object, or true to cancel preparation.Pass nil for this parameter if you do not need an opportunity to cancel preparing the object.
   * @returns {boolean} - 
   * @desc By default, SceneKit lazily loads resources onto the GPU for rendering. This approach uses memory and GPU bandwidth efficiently, but can lead to stutters in an otherwise smooth frame rate when you add large amounts of new content to an animated scene. To avoid such issues, use this method to prepare content for drawing before adding it to the scene. You can call this method on a secondary thread to prepare content asynchronously. SceneKit prepares all content associated with the object parameter you provide. If you provide an SCNMaterial object, SceneKit loads any texture images assigned to its material properties. If you provide an SCNGeometry object, SceneKit loads all materials attached to the geometry, as well as its vertex data. If you provide an SCNNode or SCNScene object, SceneKit loads all geometries and materials associated with the node and all its child nodes, or with the entire node hierarchy of the scene.You can use the block parameter to cancel preparation if content is no longer needed. For example, in a game you might use this method to preload areas of the game world the player is soon to enter, but if the player character dies before entering those areas, you can return true from the block to cancel preloading.You can observe the progress of this operation with the Progress class. For details, see Progress.
   * @see https://developer.apple.com/reference/scenekit/scnscenerenderer/1522798-prepare
   */
  prepareShouldAbortBlock(object, block = null) {
    return false
  }

  /**
   * Required. Prepares the specified SceneKit objects for rendering, using a background thread.
   * @access public
   * @param {Object[]} objects - An array of containing one or more SCNScene, SCNNode, SCNGeometry, or SCNMaterial instances.
   * @param {?function(arg1: boolean): void} [completionHandler = null] - A block that SceneKit calls when object preparation fails or completes.The block takes the following parameter:successtrue if all content was successfully prepared for rendering; otherwise, false.
   * @returns {void}
   * @desc By default, SceneKit lazily loads resources onto the GPU for rendering. This approach uses memory and GPU bandwidth efficiently, but can lead to stutters in an otherwise smooth frame rate when you add large amounts of new content to an animated scene. To avoid such issues, use this method to prepare content for drawing before adding it to the scene. SceneKit uses a secondary thread to prepare content asynchronously.SceneKit prepares all content associated with the objects you provide. If you provide an SCNMaterial object, SceneKit loads any texture images assigned to its material properties. If you provide an SCNGeometry object, SceneKit loads all materials attached to the geometry, as well as its vertex data. If you provide an SCNNode or SCNScene object, SceneKit loads all geometries and materials associated with the node and all its child nodes, or with the entire node hierarchy of the scene.You can observe the progress of this operation with the Progress class. For details, see Progress.
   * @see https://developer.apple.com/reference/scenekit/scnscenerenderer/1523375-prepare
   */
  prepare(objects, completionHandler = null) {
  }

  // Working With Projected Scene Contents

  /**
   * Required. Searches the renderer’s scene for objects corresponding to a point in the rendered image.
   * @access public
   * @param {CGPoint} point - 
   * @param {?Map<SCNHitTestOption, Object>} [options = null] - A dictionary of options affecting the search. See Hit Testing Options Keys for acceptable values.
   * @returns {SCNHitTestResult[]} - 
   * @desc A 2D point in the rendered screen coordinate space can refer to any point along a line segment in the 3D scene coordinate space. Hit-testing is the process of finding elements of a scene located along this line segment. For example, you can use this method to find the geometry corresponding to a click event in a SceneKit view.
   * @see https://developer.apple.com/reference/scenekit/scnscenerenderer/1522929-hittest
   */
  hitTest(point, options = null) {
    const result = []
    if(this.scene === null){
      return result
    }

    const cameraNode = this._getCameraNode()
    cameraNode.camera._updateProjectionTransform(this._viewRect)
    const vp = cameraNode.viewProjectionTransform
    const invVp = vp.invert()

    const viewPoint = new SCNVector3(point.x, point.y, 0)
    const viewRay = new SCNVector3(point.x, point.y, 0.1)
    const worldPoint = viewPoint.transform(invVp)
    const worldRay = viewRay.transform(invVp)
    console.log(`worldPoint: ${worldPoint.float32Array()}`)
    console.log(`worldRay  : ${worldRay.float32Array()}`)
    const rayVec = worldRay.sub(worldPoint)

    const renderingArray = this._createRenderingNodeArray()
    console.log(`renderingArray.length: ${renderingArray.length}`)

    renderingArray.forEach((node) => {
      result.push(...this._nodeHitTest(node, worldPoint, rayVec))
    })

    return result
  }

  /**
   * Required. Returns a Boolean value indicating whether a node might be visible from a specified point of view.
   * @access public
   * @param {SCNNode} node - The node whose visibility is to be tested.
   * @param {SCNNode} pointOfView - A node defining a point of view, as used by the pointOfView property.
   * @returns {boolean} - 
   * @desc Any node containing a camera or spotlight may serve as a point of view (see the pointOfView property for details). Such a node defines a viewing frustum—a portion of the scene’s coordinate space, shaped like a truncated pyramid, that encloses all points visible from that point of view.Use this method to test whether a node lies within the viewing frustum defined by another node (which may or may not be the scene renderer’s current pointOfView node). For example, in a game scene containing multiple camera nodes, you could use this method to determine which camera is currently best for viewing a moving player character.Note that this method does not perform occlusion testing. That is, it returns true if the tested node lies within the specified viewing frustum regardless of whether that node’s contents are obscured by other geometry.
   * @see https://developer.apple.com/reference/scenekit/scnscenerenderer/1522647-isnode
   */
  isNodeInsideFrustumOf(node, pointOfView) {
    return false
  }

  /**
   * Required. Returns all nodes that might be visible from a specified point of view.
   * @access public
   * @param {SCNNode} pointOfView - A node defining a point of view, as used by the pointOfView property.
   * @returns {SCNNode[]} - 
   * @desc Any node containing a camera or spotlight may serve as a point of view (see the pointOfView property for details). Such a node defines a viewing frustum—a portion of the scene’s coordinate space, shaped like a truncated pyramid, that encloses all points visible from that point of view.Use this method find all nodes whose content lies within the viewing frustum defined by another node (which may or may not be the scene renderer’s current pointOfView node).Note that this method does not perform occlusion testing. That is, the returned array includes any node that lies within the specified viewing frustum regardless of whether that node’s contents are obscured by other geometry.
   * @see https://developer.apple.com/reference/scenekit/scnscenerenderer/1522942-nodesinsidefrustum
   */
  nodesInsideFrustumOf(pointOfView) {
    return null
  }

  /**
   * Required. Projects a point from the 3D world coordinate system of the scene to the 2D pixel coordinate system of the renderer.
   * @access public
   * @param {SCNVector3} point - A point in the world coordinate system of the renderer’s scene.
   * @returns {SCNVector3} - 
   * @desc The z-coordinate of the returned point describes the depth of the projected point relative to the near and far clipping planes of the renderer’s viewing frustum (defined by its pointOfView node). Projecting a point on the near clipping plane returns a point whose z-coordinate is 0.0; projecting a point on the far clipping plane returns a point whose z-coordinate is 1.0.
   * @see https://developer.apple.com/reference/scenekit/scnscenerenderer/1524089-projectpoint
   */
  projectPoint(point) {
    return null
  }

  /**
   * Required. Unprojects a point from the 2D pixel coordinate system of the renderer to the 3D world coordinate system of the scene.
   * @access public
   * @param {SCNVector3} point - A point in the screen-space (view, layer, or GPU viewport) coordinate system of the scene renderer.
   * @returns {SCNVector3} - 
   * @desc The z-coordinate of the point parameter describes the depth at which to unproject the point relative to the near and far clipping planes of the renderer’s viewing frustum (defined by its pointOfView node). Unprojecting a point whose z-coordinate is 0.0 returns a point on the near clipping plane; unprojecting a point whose z-coordinate is 1.0 returns a point on the far clipping plane.A 2D point in the rendered screen coordinate space can refer to any point along a line segment in the 3D scene coordinate space. To test for scene contents along this line—for example, to find the geometry corresponding to the location of a click event in a view—use the hitTest(_:options:) method.
   * @see https://developer.apple.com/reference/scenekit/scnscenerenderer/1522631-unprojectpoint
   */
  unprojectPoint(point) {
    return null
  }

  // Customizing Scene Rendering with Metal
  /**
   * Required. The Metal render command encoder in use for the current SceneKit rendering pass.
   * @type {?MTLRenderCommandEncoder}
   * @desc Use this render command encoder to encode additional rendering commands before or after SceneKit draws its own content.This property is valid only during the SceneKit rendering loop—that is, within one of the methods defined in the SCNSceneRendererDelegate protocol. Accessing this property at any other time returns nil.
   * @see https://developer.apple.com/reference/scenekit/scnscenerenderer/1522609-currentrendercommandencoder
   */
  get currentRenderCommandEncoder() {
    return this._currentRenderCommandEncoder
  }

  /**
   * Required. The Metal device this renderer uses for rendering.
   * @type {?MTLDevice}
   * @desc Use this property to create or look up other Metal resources that use the same device as your SceneKit renderer.NoteThis property is valid only for scene renderers whose renderingAPI value is metal. You create a SceneKit view that renders using Metal with the preferredRenderingAPI initialization option or in Interface Builder, or an SCNRenderer that uses Metal with the init(device:options:) method. For OpenGL-based scene renderers, this property’s value is always nil.
   * @see https://developer.apple.com/reference/scenekit/scnscenerenderer/1523935-device
   */
  get device() {
    return this._device
  }

  /**
   * Required. The Metal command queue this renderer uses for rendering.
   * @type {?MTLCommandQueue}
   * @desc Use this property to schedule additional command buffers for the Metal device to execute as part of the render cycle. For example, you can use a compute command encoder to modify the vertex data in a Metal buffer for use by a SCNGeometrySource object.NoteThis property is valid only for scene renderers whose renderingAPI value is metal. You create a SceneKit view that renders using Metal with the preferredRenderingAPI initialization option or in Interface Builder, or an SCNRenderer that uses Metal with the init(device:options:) method. For OpenGL-based scene renderers, this property’s value is always nil.
   * @see https://developer.apple.com/reference/scenekit/scnscenerenderer/1523974-commandqueue
   */
  get commandQueue() {
    return this._commandQueue
  }

  /**
   * Required. The Metal pixel format for the renderer’s color output.
   * @type {MTLPixelFormat}
   * @desc Use this property, along with the depthPixelFormat and stencilPixelFormat properties, if you perform custom drawing with Metal (see the SCNSceneRendererDelegate and SCNNodeRendererDelegate classes) and need to create a new MTLRenderPipelineState object to change the GPU state as part of your rendering.NoteThis property is valid only for scene renderers whose renderingAPI value is metal. You create a SceneKit view that renders using Metal with the preferredRenderingAPI initialization option or in Interface Builder, or an SCNRenderer that uses Metal with the init(device:options:) method. For OpenGL-based scene renderers, this property’s value is always nil.
   * @see https://developer.apple.com/reference/scenekit/scnscenerenderer/1523701-colorpixelformat
   */
  get colorPixelFormat() {
    return this._colorPixelFormat
  }

  /**
   * Required. The Metal pixel format for the renderer’s depth buffer.
   * @type {MTLPixelFormat}
   * @desc Use this property, along with the colorPixelFormat and stencilPixelFormat properties, if you perform custom drawing with Metal (see the SCNSceneRendererDelegate and SCNNodeRendererDelegate classes) and need to create a new MTLRenderPipelineState object to change the GPU state as part of your rendering.NoteThis property is valid only for scene renderers whose renderingAPI value is metal. You create a SceneKit view that renders using Metal with the preferredRenderingAPI initialization option or in Interface Builder, or an SCNRenderer that uses Metal with the init(device:options:) method. For OpenGL-based scene renderers, this property’s value is always nil.
   * @see https://developer.apple.com/reference/scenekit/scnscenerenderer/1523780-depthpixelformat
   */
  get depthPixelFormat() {
    return this._depthPixelFormat
  }

  /**
   * Required. The Metal pixel format for the renderer’s stencil buffer.
   * @type {MTLPixelFormat}
   * @desc Use this property, along with the depthPixelFormat and colorPixelFormat properties, if you perform custom drawing with Metal (see the SCNSceneRendererDelegate and SCNNodeRendererDelegate classes) and need to create a new MTLRenderPipelineState object to change the GPU state as part of your rendering.NoteThis property is valid only for scene renderers whose renderingAPI value is metal. You create a SceneKit view that renders using Metal with the preferredRenderingAPI initialization option or in Interface Builder, or an SCNRenderer that uses Metal with the init(device:options:) method. For OpenGL-based scene renderers, this property’s value is always nil.
   * @see https://developer.apple.com/reference/scenekit/scnscenerenderer/1523315-stencilpixelformat
   */
  get stencilPixelFormat() {
    return this._stencilPixelFormat
  }

  // Customizing Scene Rendering with OpenGL

  /**
   * Required. The OpenGL rendering context that SceneKit uses for rendering the scene.
   * @type {?Object}
   * @desc In macOS, the value of this property is a Core OpenGL cglContextObj object.In iOS, the value of this property is an EAGLContext object.
   * @see https://developer.apple.com/reference/scenekit/scnscenerenderer/1522840-context
   */
  get context() {
    return this._context
  }

  _setContext(context) {
    this._context = context
    this._createDummyTexture()
  }

  // Working With Positional Audio

  /**
   * Required. The 3D audio mixing node SceneKit uses for positional audio effects.
   * @type {AVAudioEnvironmentNode}
   * @desc SceneKit uses this audio node to spatialize sounds from SCNAudioPlayer objects attached to nodes in the scene. You can use this object in conjunction with the audioEngine property to rearrange the audio graph to add other, non-spatialized audio sources or mix in audio processing effects.
   * @see https://developer.apple.com/reference/scenekit/scnscenerenderer/1523582-audioenvironmentnode
   */
  get audioEnvironmentNode() {
    return this._audioEnvironmentNode
  }

  /**
   * Required. The audio engine SceneKit uses for playing scene sounds.
   * @type {AVAudioEngine}
   * @desc SceneKit uses this audio engine to play sounds from SCNAudioPlayer objects attached to nodes in the scene. You can use this object directly to add other sound sources not related to scene contents, or to add other sound processing nodes or mixing nodes to the audio engine. To identify the node SceneKit uses for spatializing scene sounds when connecting other nodes, use the audioEnvironmentNode property.
   * @see https://developer.apple.com/reference/scenekit/scnscenerenderer/1522686-audioengine
   */
  get audioEngine() {
    return this._audioEngine
  }

  /**
   * @access private
   * @type {SCNProgram}
   */
  get _defaultProgram() {
    const numLightsChanged = this._numLightsChanged()
    if(this.__defaultProgram !== null && !numLightsChanged){
      return this.__defaultProgram
    }

    const gl = this.context
    if(this.__defaultProgram === null){
      this.__defaultProgram = new SCNProgram()
      this.__defaultProgram._glProgram = gl.createProgram()
    }
    const p = this.__defaultProgram
    const vsText = this._defaultVertexShader
    const fsText = this._defaultFragmentShader

    // initialize vertex shader
    const vertexShader = gl.createShader(gl.VERTEX_SHADER)
    gl.shaderSource(vertexShader, vsText)
    gl.compileShader(vertexShader)
    if(!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)){
      const info = gl.getShaderInfoLog(vertexShader)
      throw new Error(`vertex shader compile error: ${info}`)
    }

    // initialize fragment shader
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)
    gl.shaderSource(fragmentShader, fsText)
    gl.compileShader(fragmentShader)
    if(!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)){
      const info = gl.getShaderInfoLog(fragmentShader)
      throw new Error(`fragment shader compile error: ${info}`)
    }

    gl.attachShader(p._glProgram, vertexShader)
    gl.attachShader(p._glProgram, fragmentShader)


    // link program object
    gl.linkProgram(p._glProgram)
    if(!gl.getProgramParameter(p._glProgram, gl.LINK_STATUS)){
      const info = gl.getProgramInfoLog(p._glProgram)
      throw new Error(`program link error: ${info}`)
    }

    gl.useProgram(p._glProgram)
    //gl.clearColor(1, 1, 1, 1)
    gl.clearDepth(1.0)
    gl.clearStencil(0)

    gl.enable(gl.DEPTH_TEST)
    gl.depthFunc(gl.LEQUAL)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    gl.enable(gl.CULL_FACE)
    gl.cullFace(gl.BACK)

    // set default textures to prevent warnings
    this._setDummyTextureAsDefault()
    
    return this.__defaultProgram
  }

  /**
   * @access private
   * @returns {string} -
   */
  get _defaultVertexShader() {
    return this._replaceTexts(_defaultVertexShader)
  }

  /**
   * @access private
   * @returns {string} -
   */
  get _defaultFragmentShader() {
    return this._replaceTexts(_defaultFragmentShader)
  }

  /**
   * @access private
   * @param {string} text -
   * @returns {string} -
   */
  _replaceTexts(text) {
    const vars = new Map()
    const numAmbient = this._numLights[SCNLight.LightType.ambient]
    const numDirectional = this._numLights[SCNLight.LightType.directional]
    const numOmni = this._numLights[SCNLight.LightType.omni]
    const numSpot = this._numLights[SCNLight.LightType.spot]
    const numIES = this._numLights[SCNLight.LightType.IES]
    const numProbe = this._numLights[SCNLight.LightType.probe]

    vars.set('__NUM_AMBIENT_LIGHTS__', numAmbient)
    vars.set('__NUM_DIRECTIONAL_LIGHTS__', numDirectional)
    vars.set('__NUM_OMNI_LIGHTS__', numOmni)
    vars.set('__NUM_SPOT_LIGHTS__', numSpot)
    vars.set('__NUM_IES_LIGHTS__', numIES)
    vars.set('__NUM_PROBE_LIGHTS__', numProbe)

    let lightDefinition = ''
    let vsLighting = ''
    let fsLighting = ''
    if(numAmbient > 0){
      lightDefinition += 'AmbientLight ambient[NUM_AMBIENT_LIGHTS]; '
      vsLighting += _vsAmbient
      fsLighting += _fsAmbient
    }
    if(numDirectional > 0){
      lightDefinition += 'DirectionalLight directional[NUM_DIRECTIONAL_LIGHTS]; '
      vsLighting += _vsDirectional
      fsLighting += _fsDirectional

    }
    if(numOmni > 0){
      lightDefinition += 'OmniLight omni[NUM_OMNI_LIGHTS]; '
      vsLighting += _vsOmni
      fsLighting += _fsOmni
    }
    if(numSpot > 0){
      lightDefinition += 'OmniLight spot[NUM_OMNI_LIGHTS]; '
      vsLighting += _vsSpot
      fsLighting += _fsSpot
    }
    if(numIES > 0){
      lightDefinition += 'IESLight probe[NUM_IES_LIGHTS]; '
      vsLighting += _vsIES
      fsLighting += _fsIES
    }
    if(numProbe > 0){
      lightDefinition += 'ProbeLight probe[NUM_PROBE_LIGHTS]; '
      vsLighting += _vsProbe
      fsLighting += _fsProbe
    }
    vars.set('__LIGHT_DEFINITION__', lightDefinition)
    vars.set('__VS_LIGHTING__', vsLighting)
    vars.set('__FS_LIGHTING__', fsLighting)

    if(numDirectional + numOmni + numSpot > 0){
      const v = 'vec3 v_light[NUM_DIRECTIONAL_LIGHTS + NUM_OMNI_LIGHTS + NUM_SPOT_LIGHTS]; '
      vars.set('__VS_LIGHT_VARS__', 'out ' + v)
      vars.set('__FS_LIGHT_VARS__', 'in ' + v)
    }else{
      vars.set('__VS_LIGHT_VARS__', '')
      vars.set('__FS_LIGHT_VARS__', '')
    }

    let result = text
    vars.forEach((value, key) => {
      const rex = new RegExp(key, 'g')
      result = result.replace(rex, value)
    })

    return result
  }

  _initializeVAO(node, program) {
    const gl = this.context
    const geometry = node.presentation.geometry
    const baseGeometry = node.geometry

    // prepare vertex array data
    //const vertexBuffer = geometry._createVertexBuffer(gl, baseGeometry)
    const vertexBuffer = geometry._createVertexBuffer(gl, node)
    // TODO: retain attribute locations
    const positionLoc = gl.getAttribLocation(program, 'position')
    const normalLoc = gl.getAttribLocation(program, 'normal')
    const texcoordLoc = gl.getAttribLocation(program, 'texcoord')
    const boneIndicesLoc = gl.getAttribLocation(program, 'boneIndices')
    const boneWeightsLoc = gl.getAttribLocation(program, 'boneWeights')

    geometry._vertexArrayObjects = []
    const elementCount = node.presentation.geometry.geometryElements.length
    for(let i=0; i<elementCount; i++){
      const element = node.presentation.geometry.geometryElements[i]
      const material = node.presentation.geometry.materials[i]
      const vao = gl.createVertexArray()
      gl.bindVertexArray(vao)

      // initialize vertex buffer
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)

      gl.bindAttribLocation(program, positionLoc, 'position')
      gl.bindAttribLocation(program, normalLoc, 'normal')
      gl.bindAttribLocation(program, texcoordLoc, 'texcoord')
      gl.bindAttribLocation(program, boneIndicesLoc, 'boneIndices')
      gl.bindAttribLocation(program, boneWeightsLoc, 'boneWeights')
      
      // vertexAttribPointer(ulong idx, long size, ulong type, bool norm, long stride, ulong offset)

      // position
      const posSrc = geometry.getGeometrySourcesForSemantic(SCNGeometrySource.Semantic.vertex)[0]
      if(posSrc){
        //console.log(`posSrc: ${positionLoc}, ${posSrc.componentsPerVector}, ${posSrc.dataStride}, ${posSrc.dataOffset}`)
        gl.enableVertexAttribArray(positionLoc)
        gl.vertexAttribPointer(positionLoc, posSrc.componentsPerVector, gl.FLOAT, false, posSrc.dataStride, posSrc.dataOffset)
      }else{
        gl.disableVertexAttribArray(positionLoc)
      }

      // normal
      const nrmSrc = geometry.getGeometrySourcesForSemantic(SCNGeometrySource.Semantic.normal)[0]
      if(nrmSrc){
        //console.log(`nrmSrc: ${normalLoc}, ${nrmSrc.componentsPerVector}, ${nrmSrc.dataStride}, ${nrmSrc.dataOffset}`)
        gl.enableVertexAttribArray(normalLoc)
        gl.vertexAttribPointer(normalLoc, nrmSrc.componentsPerVector, gl.FLOAT, false, nrmSrc.dataStride, nrmSrc.dataOffset)
      }else{
        gl.disableVertexAttribArray(normalLoc)
      }

      // texcoord
      const texSrc = geometry.getGeometrySourcesForSemantic(SCNGeometrySource.Semantic.texcoord)[0]
      if(texSrc){
        //console.log(`texSrc: ${texcoordLoc}, ${texSrc.componentsPerVector}, ${texSrc.dataStride}, ${texSrc.dataOffset}`)
        gl.enableVertexAttribArray(texcoordLoc)
        gl.vertexAttribPointer(texcoordLoc, texSrc.componentsPerVector, gl.FLOAT, false, texSrc.dataStride, texSrc.dataOffset)
      }else{
        gl.disableVertexAttribArray(texcoordLoc)
      }

      // boneIndices
      //const indSrc = geometry.getGeometrySourcesForSemantic(SCNGeometrySource.Semantic.boneIndices)[0]
      const indSrc = node.skinner ? node.skinner._boneIndices : null
      if(indSrc){
        //console.log(`indSrc: ${boneIndicesLoc}, ${indSrc.componentsPerVector}, ${indSrc.dataStride}, ${indSrc.dataOffset}`)
        gl.enableVertexAttribArray(boneIndicesLoc)
        gl.vertexAttribPointer(boneIndicesLoc, indSrc.componentsPerVector, gl.FLOAT, false, indSrc.dataStride, indSrc.dataOffset)
      }else{
        gl.disableVertexAttribArray(boneIndicesLoc)
      }

      // boneWeights
      //const wgtSrc = geometry.getGeometrySourcesForSemantic(SCNGeometrySource.Semantic.boneWeights)[0]
      const wgtSrc = node.skinner ? node.skinner._boneWeights : null
      if(wgtSrc){
        //console.log(`wgtSrc: ${boneWeightsLoc}, ${wgtSrc.componentsPerVector}, ${wgtSrc.dataStride}, ${wgtSrc.dataOffset}`)
        gl.enableVertexAttribArray(boneWeightsLoc)
        gl.vertexAttribPointer(boneWeightsLoc, wgtSrc.componentsPerVector, gl.FLOAT, false, wgtSrc.dataStride, wgtSrc.dataOffset)
      }else{
        gl.disableVertexAttribArray(boneWeightsLoc)
      }

      // FIXME: use setting
      gl.disable(gl.CULL_FACE)

      // initialize index buffer
      // FIXME: check geometrySource semantic
      const indexBuffer = element._createBuffer(gl)
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
      
      geometry._vertexArrayObjects.push(vao)
    }
  }

  _initializeLightBuffer(program) {
    const gl = this.context
    
    const lightIndex = gl.getUniformBlockIndex(program, 'lightUniform')

    this._lightBuffer = gl.createBuffer()
    gl.uniformBlockBinding(program, lightIndex, _lightLoc)
    gl.bindBufferBase(gl.UNIFORM_BUFFER, _lightLoc, this._lightBuffer)
  }

  _initializeUBO(node, program) {
    const gl = this.context
    const geometry = node.presentation.geometry

    const materialIndex = gl.getUniformBlockIndex(program, 'materialUniform')
    geometry._materialBuffer = gl.createBuffer()
    gl.uniformBlockBinding(program, materialIndex, _materialLoc)
    gl.bindBufferBase(gl.UNIFORM_BUFFER, _materialLoc, geometry._materialBuffer)
  }

  _updateVAO(node) {
    const gl = this.context
    const geometry = node.presentation.geometry
    const baseGeometry = node.geometry

    geometry._updateVertexBuffer(gl, baseGeometry)
  }

  get _dummyTexture() {
    return this.__dummyTexture
  }

  _createDummyTexture() {
    const gl = this.context

    const canvas = document.createElement('canvas')
    canvas.width = 1
    canvas.height = 1
    const context = canvas.getContext('2d')
    context.fillStyle = 'rgba(255, 255, 255, 1.0)'
    context.fillRect(0, 0, 1, 1)

    this.__dummyTexture = gl.createTexture()

    gl.bindTexture(gl.TEXTURE_2D, this.__dummyTexture)
    // texImage2D(target, level, internalformat, width, height, border, format, type, source)
    // Safari complains that 'source' is not ArrayBufferView type, but WebGL2 should accept HTMLCanvasElement.
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, canvas)
    gl.bindTexture(gl.TEXTURE_2D, null)
  }

  _setDummyTextureAsDefault() {
    const gl = this.context
    const p = this._defaultProgram

    const texNames = [
      gl.TEXTURE0,
      gl.TEXTURE1,
      gl.TEXTURE2,
      gl.TEXTURE3,
      gl.TEXTURE4,
      gl.TEXTURE5,
      gl.TEXTURE6,
      gl.TEXTURE7
    ]
    const texSymbols = [
      'u_emissionTexture',
      'u_ambientTexture',
      'u_diffuseTexture',
      'u_specularTexture',
      'u_reflectiveTexture',
      'u_transparentTexture',
      'u_multiplyTexture',
      'u_normalTexture'
    ]
    for(let i=0; i<texNames.length; i++){
      const texName = texNames[i]
      const symbol = texSymbols[i]
      gl.uniform1i(gl.getUniformLocation(p._glProgram, symbol), i)
      gl.activeTexture(texName)
      gl.bindTexture(gl.TEXTURE_2D, this.__dummyTexture)
    }
  }

  _switchToDefaultCamera() {
    if(this.pointOfView === null){
      this._defaultCameraPosNode.position = new SCNVector3(0, 0, 0)
      this._defaultCameraRotNode.rotation = new SCNVector4(0, 0, 0, 0)
      this._defaultCameraNode.position = new SCNVector3(0, 0, _defaultCameraDistance)
      console.log('pov null')
    }else if(this.pointOfView !== this._defaultCameraNode){
      const rot = this.pointOfView._worldRotation
      const rotMat = SCNMatrix4.matrixWithRotation(rot)
      const pos = this.pointOfView._worldTranslation

      this._defaultCameraPosNode.position = (new SCNVector3(0, 0, -_defaultCameraDistance)).rotate(rotMat).add(pos)
      this._defaultCameraRotNode.rotation = rot
      this._defaultCameraNode.position = new SCNVector3(0, 0, _defaultCameraDistance)
      console.log(`pov defined: pov.pos: ${this.pointOfView._worldTranslation.float32Array()}`)
      console.log(`pov defined: node.pos: ${this._defaultCameraNode._worldTranslation.float32Array()}`)
    }
    this.pointOfView = this._defaultCameraNode
  }

  _setDefaultCameraOrientation(orientation) {
    this._defaultCameraRotNode.orientation = orientation
  }

  _searchCameraNode() {
    const nodes = [this.scene._rootNode]
    let node = nodes.shift()
    while(node){
      if(node.camera !== null){
        return node
      }
      nodes.push(...node._childNodes)
      node = nodes.shift()
    }
    return null
  }

  /**
   * @access private
   * @returns {SCNVector3} -
   */
  _getCameraPosition() {
    if(this.pointOfView === this._defaultCameraNode){
      return this._defaultCameraPosNode.position
    }else if(this.pointOfView === null){
      return new SCNVector3(0, 0, 0)
    }
    const rot = this._getCameraOrientation()
    const rotMat = SCNMatrix4.matrixWithRotation(rot)
    const pos = this.pointOfView._worldTranslation
    return pos.add((new SCNVector3(0, 0, -_defaultCameraDistance)).rotate(rotMat))
  }

  /**
   * @access private
   * @returns {SCNVector4} -
   */
  _getCameraOrientation() {
    if(this.pointOfView === this._defaultCameraNode){
      return this._defaultCameraRotNode.orientation
    }else if(this.pointOfView === null){
      return new SCNVector4(0, 0, 0, 0)
    }
    return this.pointOfView._worldOrientation
  }

  /**
   * @access private
   * @returns {number} -
   */
  _getCameraDistance() {
    if(this.pointOfView === this._defaultCameraNode){
      return this._defaultCameraNode.position.z
    }
    return _defaultCameraDistance
  }

  /**
   * @access private
   * @returns {boolean} - true if the number of lights is changed.
   */
  _numLightsChanged() {
    let changed = false
    Object.values(SCNLight.LightType).forEach((type) => {
      const num = this._lightNodes[type].length
      if(num !== this._numLights[type]){
        changed = true
        this._numLights[type] = num
      }
    })
    return changed
  }

  /**
   * @access private
   * @param {SCNNode} node -
   * @param {SCNVector3} rayPoint - 
   * @param {SCNVector3} rayVec -
   * @returns {SCNHitTestResult[]} -
   */
  _nodeHitTest(node, rayPoint, rayVec) {
    const result = []
    const geometry = node.presentation.geometry
    const invRay = rayVec.mul(-1)

    console.log(`rayPoint: ${rayPoint.float32Array()}`)
    console.log(`rayVec: ${rayVec.float32Array()}`)

    //if(node.morpher !== null){
    //  this._updateVAO(node)
    //}

    // TODO: test the bounding box/sphere first for performance

    const source = geometry.getGeometrySourcesForSemantic(SCNGeometrySource.Semantic.vertex)[0]
    const sourceLen = source.vectorCount
    const sourceData = []
    const modelTransform = node.presentation._worldTransform
    const skinningJoints = []
    if(node.presentation.skinner){
      const skinner = node.presentation.skinner
      const numBones = skinner._bones.length
      for(let i=0; i<numBones; i++){
        const bone = skinner._bones[i]
        const mat = skinner._boneInverseBindTransforms[i].mult(bone._presentation._worldTransform)
        skinningJoints.push(mat)
      }
      for(let i=0; i<sourceLen; i++){
        const weights = skinner._boneWeights._vectorAt(i)
        const indices = skinner._boneIndices._vectorAt(i)
        const mat = new SCNMatrix4()
        for(let j=0; j<skinner.numSkinningJoints; j++){
          mat.add(skinningJoints[indices[j]].mul(weights[j]))
        }
        sourceData.push(source._scnVectorAt(i).transform(mat))
      }
    }else{
      for(let i=0; i<sourceLen; i++){
        sourceData.push(source._scnVectorAt(i).transform(modelTransform))
      }
    }

    const geometryCount = geometry.geometryElements.length
    for(let i=0; i<geometryCount; i++){
      console.log(`geometry element ${i}`)
      const element = geometry.geometryElements[i]
      switch(element.primitiveType){
        case SCNGeometryPrimitiveType.line:
          console.warn('hitTest for line is not implemented')
          continue
        case SCNGeometryPrimitiveType.point:
          console.warn('hitTest for point is not implemented')
          continue
      }

      const elementData = element._glData
      const len = element.primitiveCount
      console.log(`primitiveCount: ${len}`)
      // TODO: check cull settings
      for(let pi=0; pi<len; pi++){
        const indices = element._indexAt(pi)

        const v0 = sourceData[indices[0]]
        const v1 = sourceData[indices[1]]
        const v2 = sourceData[indices[2]]

        const e1 = v1.sub(v0)
        const e2 = v2.sub(v0)

        let denom = this._det(e1, e2, invRay)
        if(denom <= 0){
          continue
        }
        denom = 1.0 / denom

        const d = rayPoint.sub(v0)
        const u = this._det(d, e2, invRay) * denom
        if(u < 0 || u > 1){
          continue
        }

        const v = this._det(e1, d, invRay) * denom
        if(v < 0 || v > 1){
          continue
        }

        const t = this._det(e1, e2, d) * denom
        if(t < 0){
          continue
        }

        // Hit!
        console.log(`Hit! ${i}: ${pi}`)
        const hitPoint = rayPoint.add(rayVec.mul(t))
        const invModel = modelTransform.invert()

        const res = new SCNHitTestResult()
        res._node = node
        res._geometryIndex = i
        res._faceIndex = pi
        res._worldCoordinates = hitPoint
        res._localCoordinates = hitPoint.transform(invModel)
        const nom = e1.cross(e2)
        res._worldNormal = nom.normalize()
        res._localNormal = nom.transform(invModel)
        res._modelTransform = modelTransform
        res._boneNode = null // it should be array... what should I put here?
        result.push(res)
      }
    }

    return result
  }

  /**
   * calculate a determinant of 3x3 matrix from 3 vectors.
   * @access private
   * @param {SCNVector3} v1 -
   * @param {SCNVector3} v2 -
   * @param {SCNVector3} v3 -
   * @returns {number} -
   */
  _det(v1, v2, v3) {
    return (
        v1.x * v2.y * v3.z
      + v1.y * v2.z * v3.x
      + v1.z * v2.x * v3.y
      - v1.x * v2.z * v3.y
      - v1.y * v2.x * v3.z
      - v1.z * v2.y * v3.x
    )
  }
}

